import { useCallback, useState } from 'react';
import { CameraSourceMode, WebcamStage } from './components/WebcamStage';
import { FloatingArBlocks } from './components/FloatingArBlocks';
import { VsCodeSetupModal } from './components/VsCodeSetupModal';
import { SpatialTelemetry } from './utils/yoloTelemetry';

export default function App() {
  const [sourceMode, setSourceMode] = useState<CameraSourceMode>('yolo_snapshot');
  const [pythonServerUrl, setPythonServerUrl] = useState<string>('http://127.0.0.1:5000');
  const [pythonConnected, setPythonConnected] = useState<boolean>(false);

  const [isDetected, setIsDetected] = useState<boolean>(true);
  const [canSide, setCanSide] = useState<'front' | 'back'>('front');
  const [spotlightIngredientId, setSpotlightIngredientId] = useState<string | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);

  const [telemetry, setTelemetry] = useState<{
    spatial: SpatialTelemetry;
    confidence: number;
    fps: number;
    label: string;
  }>({
    spatial: {
      xMeters: -0.06,
      yMeters: 0.02,
      zMeters: 0.41,
      widthRatio: 0.22,
      heightRatio: 0.85,
      centerX: 0.39,
      centerY: 0.55,
    },
    confidence: 0.55,
    fps: 60,
    label: 'Celsius energy drink',
  });

  const handleTelemetryUpdate = useCallback(
    (spatial: SpatialTelemetry, confidence: number, fps: number, label: string) => {
      setTelemetry({ spatial, confidence, fps, label });
    },
    []
  );

  const handleSpotlightIngredient = useCallback((ingredientId: string) => {
    setSpotlightIngredientId(ingredientId);
    setCanSide('back');
    setSourceMode((prev) => (prev === 'yolo_snapshot' ? 'demo_ar' : prev));
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#07090e] text-slate-100">
      {/* 3-ZONE TOP BAR CONTRACT OVER FULL-SCREEN WEBCAM */}
      <header className="fixed top-0 inset-x-0 z-40 flex items-center justify-between gap-8 px-6 py-3 bg-slate-950/82 backdrop-blur-md border-b border-slate-800/80">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setSourceMode('yolo_snapshot');
            setIsDetected(true);
          }}
          className="text-base sm:text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          Celsius AR Vision
        </a>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav aria-label="Camera Source Navigation" className="hidden md:flex items-center gap-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setSourceMode('yolo_snapshot');
              setIsDetected(true);
            }}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              sourceMode === 'yolo_snapshot'
                ? 'text-cyan-400 border-b border-cyan-400 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            YOLO Live Capture
          </button>
          <button
            type="button"
            onClick={() => {
              setSourceMode('demo_ar');
              setIsDetected(true);
            }}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              sourceMode === 'demo_ar'
                ? 'text-cyan-400 border-b border-cyan-400 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Interactive AR Can
          </button>
          <button
            type="button"
            onClick={() => {
              setSourceMode('webcam');
              setIsDetected(true);
            }}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              sourceMode === 'webcam'
                ? 'text-cyan-400 border-b border-cyan-400 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Browser Webcam
          </button>
          <button
            type="button"
            onClick={() => {
              setSourceMode('vscode_python');
              setIsDetected(true);
            }}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              sourceMode === 'vscode_python'
                ? 'text-cyan-400 border-b border-cyan-400 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Python (:5000)
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsSetupModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            VS Code YOLO + HTML
          </button>
        </div>
      </header>

      {/* FULL-SCREEN WEBCAM & YOLOv8 VISION VIEWPORT */}
      <main className="relative w-screen h-screen overflow-hidden">
        <WebcamStage
          sourceMode={sourceMode}
          pythonServerUrl={pythonServerUrl}
          isDetected={isDetected}
          onDetectedChange={setIsDetected}
          canSide={canSide}
          spotlightIngredientId={spotlightIngredientId}
          onTelemetryUpdate={handleTelemetryUpdate}
          onPythonConnectionChange={setPythonConnected}
        />

        {/* FLOATING AR CALLOUTS & COLLAPSIBLE / SCROLLABLE BLOCKS */}
        <FloatingArBlocks
          isDetected={isDetected}
          onSimulateToggle={() => setIsDetected((prev) => !prev)}
          detectionLabel={telemetry.label}
          confidence={telemetry.confidence}
          spatial={telemetry.spatial}
          canSide={canSide}
          onCanSideChange={(side) => {
            setCanSide(side);
            if (sourceMode === 'yolo_snapshot') {
              setSourceMode('demo_ar');
            }
          }}
          spotlightIngredientId={spotlightIngredientId}
          onSpotlightIngredient={handleSpotlightIngredient}
        />
      </main>

      {/* VS CODE PYTHON BRIDGE & STANDALONE HTML MODAL */}
      <VsCodeSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        pythonServerUrl={pythonServerUrl}
        onPythonServerUrlChange={setPythonServerUrl}
        pythonConnected={pythonConnected}
        onSwitchToPythonMode={(mode) => setSourceMode(mode)}
      />
    </div>
  );
}
