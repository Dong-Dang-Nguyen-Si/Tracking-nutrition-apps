import React, { useEffect, useRef, useState } from 'react';
import { INGREDIENTS_DATA } from '../data/celsiusData';
import { computeSpatialTelemetry, interpolateBBox, NormalizedBBox, SpatialTelemetry } from '../utils/yoloTelemetry';

export type CameraSourceMode = 'demo_ar' | 'webcam' | 'vscode_python' | 'yolo_snapshot';

interface WebcamStageProps {
  sourceMode: CameraSourceMode;
  pythonServerUrl: string;
  isDetected: boolean;
  onDetectedChange: (detected: boolean) => void;
  canSide: 'front' | 'back';
  spotlightIngredientId: string | null;
  onTelemetryUpdate: (telemetry: SpatialTelemetry, conf: number, fps: number, label: string) => void;
  onPythonConnectionChange: (connected: boolean) => void;
}

export const WebcamStage: React.FC<WebcamStageProps> = ({
  sourceMode,
  pythonServerUrl,
  isDetected,
  onDetectedChange,
  canSide,
  spotlightIngredientId,
  onTelemetryUpdate,
  onPythonConnectionChange,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [isDraggingCan, setIsDraggingCan] = useState(false);
  const [canCenter, setCanCenter] = useState<{ cx: number; cy: number }>({ cx: 0.34, cy: 0.54 });

  // Store mutable refs for 60fps canvas animation loop without triggering React re-renders
  const targetBBoxRef = useRef<NormalizedBBox>({ x1: 0.25, y1: 0.16, x2: 0.43, y2: 0.88 });
  const smoothBBoxRef = useRef<NormalizedBBox>({ x1: 0.25, y1: 0.16, x2: 0.43, y2: 0.88 });
  const confidenceRef = useRef<number>(0.88);
  const labelRef = useRef<string>('Celsius energy drink');
  const fpsRef = useRef<number>(60);
  const isDetectedRef = useRef<boolean>(isDetected);
  const canSideRef = useRef<'front' | 'back'>(canSide);
  const spotlightRef = useRef<string | null>(spotlightIngredientId);
  const sourceModeRef = useRef<CameraSourceMode>(sourceMode);

  useEffect(() => {
    sourceModeRef.current = sourceMode;
  }, [sourceMode]);

  useEffect(() => {
    isDetectedRef.current = isDetected;
  }, [isDetected]);

  useEffect(() => {
    canSideRef.current = canSide;
  }, [canSide]);

  useEffect(() => {
    spotlightRef.current = spotlightIngredientId;
  }, [spotlightIngredientId]);

  // Update target bounding box when draggable can center changes in demo_ar or webcam mode
  useEffect(() => {
    if (sourceMode === 'yolo_snapshot') {
      // Match the exact blue box position in user's image_493473e9.png
      targetBBoxRef.current = { x1: 0.285, y1: 0.13, x2: 0.506, y2: 0.98 };
      confidenceRef.current = 0.55;
      labelRef.current = 'Celsius energy drink';
    } else if (sourceMode !== 'vscode_python') {
      const halfW = 0.085;
      const halfH = 0.35;
      targetBBoxRef.current = {
        x1: Math.max(0.04, canCenter.cx - halfW),
        y1: Math.max(0.08, canCenter.cy - halfH),
        x2: Math.min(0.96, canCenter.cx + halfW),
        y2: Math.min(0.95, canCenter.cy + halfH),
      };
      confidenceRef.current = 0.92;
      labelRef.current = 'Celsius energy drink';
    }
  }, [canCenter, sourceMode]);

  // Handle Browser Live Webcam stream
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    setWebcamError(null);

    if (sourceMode === 'webcam') {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' },
            audio: false,
          })
          .then((stream) => {
            activeStream = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          })
          .catch(() => {
            setWebcamError(
              'Camera access was blocked or no physical webcam was found. Using interactive AR camera feed.'
            );
          });
      } else {
        setWebcamError('Webcam API unavailable in this browser context. Using interactive AR feed.');
      }
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [sourceMode]);

  // Poll VS Code Python YOLOv8 server (/telemetry) when in vscode_python mode (or background auto-detect)
  useEffect(() => {
    let intervalId: number | undefined;
    let isMounted = true;

    const pollPythonTelemetry = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 900);
        const res = await fetch(`${pythonServerUrl.replace(/\/$/, '')}/telemetry`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error('Status not OK');
        const data = await res.json();
        if (!isMounted) return;

        onPythonConnectionChange(true);
        if (typeof data.detected === 'boolean') {
          onDetectedChange(data.detected);
        }
        if (Array.isArray(data.bbox) && data.bbox.length === 4) {
          targetBBoxRef.current = {
            x1: data.bbox[0],
            y1: data.bbox[1],
            x2: data.bbox[2],
            y2: data.bbox[3],
          };
        }
        if (typeof data.confidence === 'number') {
          confidenceRef.current = data.confidence;
        }
        if (typeof data.label === 'string') {
          labelRef.current = data.label;
        }
        if (typeof data.fps === 'number') {
          fpsRef.current = data.fps;
        }
      } catch {
        if (!isMounted) return;
        onPythonConnectionChange(false);
      }
    };

    if (sourceMode === 'vscode_python') {
      pollPythonTelemetry();
      intervalId = window.setInterval(pollPythonTelemetry, 220);
    } else {
      onPythonConnectionChange(false);
    }

    return () => {
      isMounted = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [sourceMode, pythonServerUrl, onDetectedChange, onPythonConnectionChange]);

  // 60FPS YOLOv8 AR Bounding Box + Callout Line Renderer
  useEffect(() => {
    let animId: number;
    let lastTelemetryPush = 0;

    const renderLoop = (now: number) => {
      const canvas = canvasRef.current;
      const stage = stageRef.current;
      if (canvas && stage) {
        const rect = stage.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
          canvas.width = rect.width;
          canvas.height = rect.height;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Interpolate bounding box smoothly
          smoothBBoxRef.current = interpolateBBox(smoothBBoxRef.current, targetBBoxRef.current, 0.22);
          const b = smoothBBoxRef.current;

          if (isDetectedRef.current) {
            const x = b.x1 * canvas.width;
            const y = b.y1 * canvas.height;
            const w = (b.x2 - b.x1) * canvas.width;
            const h = (b.y2 - b.y1) * canvas.height;

            // 1. Draw YOLOv8 Outer Bounding Box & Top Banner when not already baked into yolo_snapshot
            if (sourceModeRef.current !== 'yolo_snapshot') {
              ctx.strokeStyle = '#2563eb';
              ctx.lineWidth = 3;
              ctx.strokeRect(x, y, w, h);

              ctx.fillStyle = 'rgba(37, 99, 235, 0.06)';
              ctx.fillRect(x, y, w, h);

              const yoloText = `${labelRef.current} ${confidenceRef.current.toFixed(2)}`;
              ctx.font = '700 15px "JetBrains Mono", monospace';
              const textMetrics = ctx.measureText(yoloText);
              const bannerW = textMetrics.width + 16;
              const bannerH = 26;
              const bannerY = Math.max(58, y - bannerH);

              ctx.fillStyle = '#0038ff';
              ctx.fillRect(x - 1.5, bannerY, bannerW, bannerH);
              ctx.fillStyle = '#ffffff';
              ctx.fillText(yoloText, x + 6, bannerY + 18);
            }

            // Precision AR Cyan Corner Brackets
            const corner = 18;
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3.5;
            // Top-left
            ctx.beginPath();
            ctx.moveTo(x, y + corner);
            ctx.lineTo(x, y);
            ctx.lineTo(x + corner, y);
            ctx.stroke();
            // Top-right
            ctx.beginPath();
            ctx.moveTo(x + w - corner, y);
            ctx.lineTo(x + w, y);
            ctx.lineTo(x + w, y + corner);
            ctx.stroke();
            // Bottom-left
            ctx.beginPath();
            ctx.moveTo(x, y + h - corner);
            ctx.lineTo(x, y + h);
            ctx.lineTo(x + corner, y + h);
            ctx.stroke();
            // Bottom-right
            ctx.beginPath();
            ctx.moveTo(x + w - corner, y + h);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x + w, y + h - corner);
            ctx.stroke();

            // 3. Sub-OCR Detection Boxes on the Can (Front vs Back Ingredients)
            const drawOcrBox = (
              rx: number,
              ry: number,
              rw: number,
              rh: number,
              color: string,
              tag: string,
              highlighted: boolean
            ) => {
              const sx = x + rx * w;
              const sy = y + ry * h;
              const sw = rw * w;
              const sh = rh * h;

              ctx.strokeStyle = color;
              ctx.lineWidth = highlighted ? 3 : 1.5;
              ctx.strokeRect(sx, sy, sw, sh);
              ctx.fillStyle = highlighted ? 'rgba(244, 63, 94, 0.28)' : 'rgba(15, 23, 42, 0.35)';
              ctx.fillRect(sx, sy, sw, sh);

              ctx.font = '600 10px "JetBrains Mono", monospace';
              const tw = ctx.measureText(tag).width + 8;
              ctx.fillStyle = color;
              ctx.fillRect(sx, sy - 14, tw, 14);
              ctx.fillStyle = '#020617';
              ctx.fillText(tag, sx + 4, sy - 3.5);
            };

            if (canSideRef.current === 'front') {
              drawOcrBox(0.11, 0.14, 0.52, 0.08, '#f59e0b', 'HEALTH_CANADA_WARN 0.94', false);
              drawOcrBox(0.11, 0.26, 0.68, 0.24, '#38bdf8', 'BRAND_CELSIUS 0.98', false);
              drawOcrBox(0.14, 0.65, 0.72, 0.13, '#10b981', 'CLAIM_ZERO_SUGAR 0.95', false);
            } else {
              INGREDIENTS_DATA.forEach((item) => {
                const isSpotlit = spotlightRef.current === item.id;
                const color =
                  item.category === 'caution'
                    ? '#f43f5e'
                    : item.category === 'mystery'
                    ? '#38bdf8'
                    : '#10b981';
                if (isSpotlit || item.id !== 'glucuronolactone') {
                  drawOcrBox(
                    item.canRegion.rx,
                    item.canRegion.ry,
                    item.canRegion.rw,
                    item.canRegion.rh,
                    color,
                    item.canRegion.ocrTag,
                    isSpotlit
                  );
                }
              });
            }

            // 4. AR Pointer Callout Line from Detected Can to Floating AR Blocks on Right
            if (canvas.width >= 960) {
              const startX = x + w;
              const startY = y + h * 0.26;
              const endX = canvas.width - 524;
              const endY = Math.max(128, startY - 36);
              const midX = startX + Math.min(70, Math.max(24, (endX - startX) * 0.3));

              if (endX > startX + 40) {
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
                ctx.lineWidth = 1.75;
                ctx.setLineDash([6, 4]);
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(midX, endY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                ctx.setLineDash([]);

                // Anchor nodes
                ctx.fillStyle = '#38bdf8';
                ctx.beginPath();
                ctx.arc(startX, startY, 4.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(endX, endY, 4.5, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }

          // Push spatial telemetry at ~8Hz so React HUD stays crisp without 60Hz re-renders
          if (now - lastTelemetryPush > 130) {
            lastTelemetryPush = now;
            const spatial = computeSpatialTelemetry(smoothBBoxRef.current);
            onTelemetryUpdate(spatial, confidenceRef.current, fpsRef.current, labelRef.current);
          }
        }
      }
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [onTelemetryUpdate]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingCan || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const nx = Math.max(0.12, Math.min(0.85, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0.25, Math.min(0.78, (e.clientY - rect.top) / rect.height));
    setCanCenter({ cx: nx, cy: ny });
  };

  return (
    <div
      ref={stageRef}
      data-testid="webcam-fullscreen-stage"
      onPointerMove={handlePointerMove}
      onPointerUp={() => setIsDraggingCan(false)}
      className="relative w-screen h-screen overflow-hidden bg-[#07090e] select-none"
    >
      {/* 1. BACKGROUND LAYER: REAL YOLO CAPTURE / WEBCAM / PYTHON STREAM */}
      {sourceMode === 'yolo_snapshot' && (
        <img
          src="/assets/aistudio/image_493473e9.png"
          alt="YOLOv8 Live Webcam Capture of Celsius Energy Drink"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-95"
        />
      )}

      {sourceMode === 'demo_ar' && (
        <div className="absolute inset-0 w-full h-full">
          {/* Realistic subtle blurred room camera backdrop */}
          <img
            src="/assets/aistudio/image_493473e9.png"
            alt="Webcam Environment Backdrop"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-center blur-md scale-105 opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-slate-950/75" />
        </div>
      )}

      {sourceMode === 'webcam' && (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onClick={(e) => {
              if (!stageRef.current) return;
              const rect = stageRef.current.getBoundingClientRect();
              setCanCenter({
                cx: (e.clientX - rect.left) / rect.width,
                cy: (e.clientY - rect.top) / rect.height,
              });
              onDetectedChange(true);
            }}
            className="absolute inset-0 w-full h-full object-cover cursor-crosshair"
          />
          {webcamError && (
            <img
              src="/assets/aistudio/image_493473e9.png"
              alt="Fallback Webcam Stream"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-50 blur-xs"
            />
          )}
        </>
      )}

      {sourceMode === 'vscode_python' && (
        <img
          src={`${pythonServerUrl.replace(/\/$/, '')}/video_feed`}
          alt="VS Code Python YOLOv8 Live Stream"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/assets/aistudio/image_493473e9.png';
          }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Subtle Optical Camera Calibration Grid & Vignette Scrim */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148, 163, 184, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.05) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/60 pointer-events-none" />

      {/* 2. INTERACTIVE DRAGGABLE CELSIUS CAN (Visible in Demo AR mode when Detected is ON) */}
      {sourceMode === 'demo_ar' && isDetected && (
        <div
          onPointerDown={(e) => {
            setIsDraggingCan(true);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          style={{
            left: `${canCenter.cx * 100}%`,
            top: `${canCenter.cy * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
          title="Drag the Celsius can across the webcam viewport"
          className="absolute z-10 cursor-grab active:cursor-grabbing transition-shadow"
        >
          {canSide === 'front' ? (
            <svg
              viewBox="0 0 260 510"
              className="w-40 sm:w-48 md:w-52 h-auto drop-shadow-[0_24px_48px_rgba(0,0,0,0.9)] pointer-events-none"
            >
              <defs>
                <linearGradient id="canBodyGradAr" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#cbd5e1" />
                  <stop offset="18%" stopColor="#f8fafc" />
                  <stop offset="52%" stopColor="#ffffff" />
                  <stop offset="85%" stopColor="#e2e8f0" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>
                <linearGradient id="silverRimGradAr" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#64748b" />
                  <stop offset="30%" stopColor="#cbd5e1" />
                  <stop offset="55%" stopColor="#f1f5f9" />
                  <stop offset="85%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#475569" />
                </linearGradient>
                <linearGradient id="celsiusCGradAr" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="45%" stopColor="#84cc16" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              <ellipse cx="130" cy="22" rx="102" ry="12" fill="#0f172a" stroke="#334155" strokeWidth="2" />
              <path d="M28 22 Q130 34 232 22 L242 46 Q130 56 18 46 Z" fill="url(#canBodyGradAr)" />
              <rect x="18" y="44" width="224" height="360" rx="8" fill="url(#canBodyGradAr)" />
              <rect x="82" y="27" width="96" height="24" rx="2" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
              <text x="89" y="44" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="900" fontSize="16" fill="#0f172a">
                !
              </text>
              <rect x="97" y="30" width="77" height="9" fill="#0f172a" />
              <text
                x="135"
                y="37"
                textAnchor="middle"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontWeight="700"
                fontSize="6.5"
                fill="#ffffff"
              >
                Supplemented
              </text>
              <text
                x="135"
                y="47"
                textAnchor="middle"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontWeight="600"
                fontSize="6.2"
                fill="#334155"
              >
                Health Canada
              </text>
              <circle cx="84" cy="76" r="8" fill="none" stroke="#cbd5e1" strokeWidth="4.5" />
              <path
                d="M90 105 C95 66, 150 58, 178 72 C168 88, 145 92, 118 88 C102 86, 94 95, 90 105 Z"
                fill="url(#celsiusCGradAr)"
              />
              <path
                d="M90 102 C82 142, 132 168, 174 138 L158 118 C135 135, 112 124, 114 98 Z"
                fill="url(#silverRimGradAr)"
              />
              <text
                x="130"
                y="190"
                textAnchor="middle"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontWeight="800"
                fontSize="31"
                letterSpacing="1"
                fill="#0f172a"
              >
                CELSIUS<tspan fontSize="12">®</tspan>
              </text>
              <text
                x="169"
                y="203"
                textAnchor="middle"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontWeight="800"
                fontSize="10.5"
                letterSpacing="1.2"
                fill="#dc2626"
              >
                ENERGY
              </text>
              <g transform="translate(68, 214)">
                <path d="M5 10 Q45 78 115 32 Q65 18 5 10 Z" fill="#15803d" />
                <path d="M9 12 Q47 71 110 31 Q65 19 9 12 Z" fill="#dcfce7" />
                <path d="M12 13 Q49 65 106 30 Q60 19 12 13 Z" fill="#ef4444" />
                <circle cx="95" cy="38" r="18" fill="#facc15" stroke="#fef08a" strokeWidth="2" />
                <path d="M62 46 Q82 66 104 46 Z" fill="#fde047" stroke="#eab308" strokeWidth="1.5" />
              </g>
              <text
                x="58"
                y="298"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontWeight="600"
                fontSize="19"
                letterSpacing="0.8"
                fill="#1e293b"
              >
                SPARKLING
              </text>
              <text
                x="58"
                y="312"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontWeight="800"
                fontSize="9"
                fill="#e11d48"
              >
                WATERMELON LEMONADE FLAVOUR
              </text>
              <rect x="18" y="334" width="224" height="58" fill="#0f172a" />
              <text x="58" y="350" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="600" fontSize="10" fill="#f8fafc">
                ▸ ENERGY DRINK
              </text>
              <text x="58" y="365" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="600" fontSize="10" fill="#f8fafc">
                ▸ ZERO SUGAR
              </text>
              <text x="58" y="380" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="600" fontSize="10" fill="#f8fafc">
                ▸ ESSENTIAL FLAVOURS
              </text>
              <rect x="18" y="392" width="224" height="82" fill="url(#silverRimGradAr)" />
              <text
                x="130"
                y="462"
                textAnchor="middle"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontWeight="700"
                fontSize="10"
                fill="#0f172a"
              >
                High Caffeine Content · 355 mL
              </text>
              <path d="M18 474 Q130 492 242 474 L226 494 Q130 508 34 494 Z" fill="#94a3b8" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 280 510"
              className="w-40 sm:w-48 md:w-52 h-auto drop-shadow-[0_24px_48px_rgba(0,0,0,0.9)] pointer-events-none"
            >
              <ellipse cx="140" cy="22" rx="108" ry="12" fill="#0f172a" stroke="#334155" strokeWidth="2" />
              <rect x="22" y="28" width="236" height="452" rx="10" fill="#f1f5f9" />
              <rect x="30" y="42" width="122" height="270" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
              <text x="34" y="56" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="800" fontSize="9.5" fill="#0f172a">
                Supplemented Food Facts
              </text>
              <text x="34" y="84" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="800" fontSize="10" fill="#0f172a">
                Calories 10 · Sugars 0g
              </text>
              <text x="34" y="135" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="600" fontSize="7" fill="#0f172a">
                Biotin 57% · Niacin 125%
              </text>
              <text x="34" y="148" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="600" fontSize="7" fill="#0f172a">
                Pantothenate 200% · B2 154%
              </text>
              <text x="34" y="161" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="600" fontSize="7" fill="#0f172a">
                Vitamin B6 118% · B12 250%
              </text>
              <rect x="32" y="196" width="118" height="26" fill="#fef3c7" />
              <text x="34" y="207" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="800" fontSize="8" fill="#b45309">
                Caffeine: 140 mg
              </text>
              <text x="34" y="218" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="800" fontSize="8" fill="#0f766e">
                Taurine: 1094 mg
              </text>
              <rect x="32" y="228" width="118" height="78" fill="#fff1f2" stroke="#e11d48" strokeWidth="1" />
              <text x="35" y="242" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="6.8" fill="#be123c">
                Caution: Under 14 yrs, pregnant.
              </text>
              <text x="35" y="254" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="6.5" fill="#881337">
                Max 1 serving per day.
              </text>
              <rect x="156" y="42" width="94" height="270" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
              <text x="160" y="55" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="800" fontSize="8.5" fill="#0f172a">
                Ingredients:
              </text>
              <text x="160" y="67" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="600" fontSize="7" fill="#334155">
                Carbonated water,
              </text>
              <rect x="158" y="71" width="88" height="23" fill="#fee2e2" />
              <text x="160" y="79" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="800" fontSize="7.2" fill="#b91c1c">
                Citric acid, Taurine,
              </text>
              <text x="160" y="90" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="800" fontSize="7.2" fill="#b91c1c">
                Malic acid, Green tea,
              </text>
              <text x="160" y="135" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="7" fill="#0369a1">
                Glucuronolactone,
              </text>
              <rect x="158" y="139" width="88" height="22" fill="#fef3c7" />
              <text x="160" y="147" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="800" fontSize="7.2" fill="#b45309">
                Sucralose, Acesulfame
              </text>
              <text x="160" y="157" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="800" fontSize="7.2" fill="#b45309">
                potassium, Ginger,
              </text>
              <text x="160" y="213" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="7" fill="#0f766e">
                Cyanocobalamin (B12).
              </text>
              <text x="32" y="345" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="7.2" fill="#0f172a">
                Prepared in Canada for CELSIUS, Inc.
              </text>
            </svg>
          )}
        </div>
      )}

      {/* 3. REAL-TIME YOLOv8 CANVAS OVERLAY */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-20" />
    </div>
  );
};
