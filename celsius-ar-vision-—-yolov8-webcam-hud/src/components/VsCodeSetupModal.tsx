import React, { useState } from 'react';
import { X, Copy, Check, Download, Terminal, ExternalLink } from 'lucide-react';
import { VSCODE_PYTHON_BRIDGE_CODE } from '../data/celsiusData';
import { CameraSourceMode } from './WebcamStage';

interface VsCodeSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  pythonServerUrl: string;
  onPythonServerUrlChange: (url: string) => void;
  pythonConnected: boolean;
  onSwitchToPythonMode: (mode: CameraSourceMode) => void;
}

export const VsCodeSetupModal: React.FC<VsCodeSetupModalProps> = ({
  isOpen,
  onClose,
  pythonServerUrl,
  onPythonServerUrlChange,
  pythonConnected,
  onSwitchToPythonMode,
}) => {
  const [copiedPy, setCopiedPy] = useState(false);

  if (!isOpen) return null;

  const handleCopyPython = async () => {
    try {
      await navigator.clipboard.writeText(VSCODE_PYTHON_BRIDGE_CODE);
      setCopiedPy(true);
      setTimeout(() => setCopiedPy(false), 2200);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = VSCODE_PYTHON_BRIDGE_CODE;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedPy(true);
      setTimeout(() => setCopiedPy(false), 2200);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vscode-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h2 id="vscode-modal-title" className="text-base sm:text-lg font-bold text-white">
              Connect VS Code YOLOv8 Webcam (`best.pt`) & Download Standalone HTML
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Stream your trained Ultralytics YOLOv8 model from VS Code directly into this full-screen AR webcam interface.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close VS Code Setup Modal"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto ar-scroll space-y-5 flex-1">
          {/* Step 1: Download Standalone HTML or Connect Live */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <div className="text-xs font-mono text-cyan-400">01. Standalone Single-File HTML</div>
                <h3 className="text-sm font-bold text-white mt-1">
                  Download `celsius_yolo_webcam.html` for VS Code
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Self-contained English HTML file with full-screen webcam, YOLOv8 bridge (`127.0.0.1:5000`), and the 3
                  collapsible & scrollable arrow blocks (Ingredient Decoder, Company Drama, Smart Device & Advice).
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href="/celsius_yolo_webcam.html"
                  download="celsius_yolo_webcam.html"
                  className="px-4 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Standalone HTML</span>
                </a>
                <a
                  href="/celsius_yolo_webcam.html"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview HTML</span>
                </a>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-amber-400">02. Live Local Server Endpoint</span>
                  <span
                    className={`text-xs font-mono ${
                      pythonConnected ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {pythonConnected ? '● Connected to VS Code' : '○ Waiting for python trial_web.py'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-1">VS Code Flask + OpenCV Endpoint</h3>
                <label htmlFor="python-url-input" className="block text-xs text-slate-400 mt-1">
                  Server URL running on your machine:
                </label>
                <input
                  id="python-url-input"
                  type="text"
                  value={pythonServerUrl}
                  onChange={(e) => onPythonServerUrlChange(e.target.value)}
                  className="mt-1.5 w-full px-3 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onSwitchToPythonMode('vscode_python');
                    onClose();
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Connect to Python (:5000) Stream
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Python Code to run in VS Code */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-white">
                  trial_web.py — Upgraded VS Code Script (`runs/detect/train/weights/best.pt`)
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyPython}
                className="px-3 py-1.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedPy ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPy ? 'Copied trial_web.py!' : 'Copy Python Code'}</span>
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto ar-scroll leading-relaxed max-h-[34vh]">
              {VSCODE_PYTHON_BRIDGE_CODE}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
