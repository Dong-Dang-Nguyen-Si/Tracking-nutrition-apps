import React, { useRef, useState } from 'react';
import {
  ChevronRight,
  ChevronUp,
  ChevronDown,
  GripHorizontal,
  Crosshair,
  RotateCcw,
  Eye,
  HeartPulse,
  Moon,
  Droplets,
  Flame,
} from 'lucide-react';
import {
  CLEANER_ALTERNATIVES,
  DRAMA_DATA,
  GOLDEN_RULES,
  SMART_SCENARIOS,
} from '../data/celsiusData';
import { filterDecodedIngredients, getSmartScenarioById, SpatialTelemetry } from '../utils/yoloTelemetry';

export type ArBlockId = 'ingredients' | 'drama' | 'smart_device';

interface FloatingArBlocksProps {
  isDetected: boolean;
  onSimulateToggle: () => void;
  detectionLabel: string;
  confidence: number;
  spatial: SpatialTelemetry;
  canSide: 'front' | 'back';
  onCanSideChange: (side: 'front' | 'back') => void;
  spotlightIngredientId: string | null;
  onSpotlightIngredient: (id: string) => void;
}

export const FloatingArBlocks: React.FC<FloatingArBlocksProps> = ({
  isDetected,
  onSimulateToggle,
  detectionLabel,
  confidence,
  spatial,
  canSide,
  onCanSideChange,
  spotlightIngredientId,
  onSpotlightIngredient,
}) => {
  // Track which AR block(s) are expanded via the arrow button
  const [expandedBlocks, setExpandedBlocks] = useState<Record<ArBlockId, boolean>>({
    ingredients: true,
    drama: false,
    smart_device: false,
  });

  // Ingredient Decoder filter state
  const [ingredientFilter, setIngredientFilter] = useState<'all' | 'caution' | 'mystery' | 'good'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Smart Device & Advice active scenario
  const [activeScenarioId, setActiveScenarioId] = useState<'workout' | 'study' | 'empty' | 'night'>('workout');

  // Draggable vertical/horizontal offset for the floating AR stack on webcam
  const [panelOffset, setPanelOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Refs to scrollable inner containers for smooth programmatic scroll up/down
  const scrollRefs = {
    ingredients: useRef<HTMLDivElement>(null),
    drama: useRef<HTMLDivElement>(null),
    smart_device: useRef<HTMLDivElement>(null),
  };

  const toggleBlock = (id: ArBlockId) => {
    setExpandedBlocks((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandOnlyBlock = (id: ArBlockId) => {
    setExpandedBlocks({
      ingredients: id === 'ingredients',
      drama: id === 'drama',
      smart_device: id === 'smart_device',
    });
  };

  const scrollBlockContent = (id: ArBlockId, direction: 'up' | 'down') => {
    const el = scrollRefs[id].current;
    if (!el) return;
    const delta = direction === 'down' ? 210 : -210;
    el.scrollBy({ top: delta, behavior: 'smooth' });
  };

  const handlePanelDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingPanel(true);
    dragStartRef.current = {
      x: e.clientX - panelOffset.x,
      y: e.clientY - panelOffset.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePanelDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingPanel) return;
    const nextX = Math.max(-420, Math.min(80, e.clientX - dragStartRef.current.x));
    const nextY = Math.max(-120, Math.min(260, e.clientY - dragStartRef.current.y));
    setPanelOffset({ x: nextX, y: nextY });
  };

  const handlePanelDragEnd = () => {
    setIsDraggingPanel(false);
  };

  const filteredIngredients = filterDecodedIngredients(ingredientFilter, searchQuery);
  const activeScenario = getSmartScenarioById(activeScenarioId, SMART_SCENARIOS);

  // If no Celsius can is currently detected in frame, show a clean minimal AR standby HUD prompt
  if (!isDetected) {
    return (
      <div className="fixed inset-x-0 bottom-8 z-30 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl px-6 py-4 max-w-xl w-full flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-cyan-400">
              YOLOv8 Optical Scanner Standby · Conf Threshold ≥ 0.50
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white mt-0.5">
              Hold a Celsius Energy Drink in front of your webcam
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              AR callout text and interactive arrow blocks appear automatically on detection.
            </p>
          </div>
          <button
            type="button"
            onClick={onSimulateToggle}
            className="px-4 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Simulate Can Detected
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* LEFT AR TELEMETRY & DETECTED PRODUCT CALLOUT ON WEBCAM */}
      <div className="fixed left-5 bottom-5 z-30 max-w-md pointer-events-auto hidden md:block">
        <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between gap-4 text-xs font-mono text-cyan-400">
            <span className="whitespace-nowrap shrink-0">TARGET LOCKED · {(confidence * 100).toFixed(0)}% CONF</span>
            <span className="whitespace-nowrap shrink-0">
              X:{spatial.xMeters >= 0 ? `+${spatial.xMeters.toFixed(2)}` : spatial.xMeters.toFixed(2)}m · Y:
              {spatial.yMeters >= 0 ? `+${spatial.yMeters.toFixed(2)}` : spatial.yMeters.toFixed(2)}m · Z:
              {spatial.zMeters.toFixed(2)}m
            </span>
          </div>

          <h2 className="text-base font-bold text-white mt-1.5 tracking-tight">
            CELSIUS® Sparkling Watermelon Lemonade
          </h2>

          <div className="text-xs text-slate-300 mt-1 font-mono">
            355 mL · 10 Cal · 0g Sugar · 140mg Caffeine · 1,094mg Taurine · pH 3.1
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/90 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => onCanSideChange('front')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  canSide === 'front'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Front Can View
              </button>
              <button
                type="button"
                onClick={() => onCanSideChange('back')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  canSide === 'back'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Back Ingredients OCR
              </button>
            </div>

            <button
              type="button"
              onClick={onSimulateToggle}
              title="Temporarily hide detected can to see empty webcam state"
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Hide Target
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT FLOATING AR ACCORDION BLOCKS OVERLAY ON WEBCAM */}
      <aside
        aria-label="Detected Celsius AR Information Blocks"
        style={{
          transform: `translate3d(${panelOffset.x}px, ${panelOffset.y}px, 0)`,
        }}
        className="fixed top-16 right-4 sm:right-6 bottom-4 z-30 w-[calc(100vw-2rem)] sm:w-[460px] lg:w-[500px] flex flex-col pointer-events-none"
      >
        <div className="pointer-events-auto flex flex-col max-h-full bg-slate-950/82 backdrop-blur-xl border border-slate-800/90 rounded-2xl overflow-hidden">
          {/* Draggable AR Overlay Header Bar */}
          <div
            onPointerDown={handlePanelDragStart}
            onPointerMove={handlePanelDragMove}
            onPointerUp={handlePanelDragEnd}
            className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 cursor-grab active:cursor-grabbing shrink-0"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                <GripHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">AR OVERLAY · {detectionLabel.toUpperCase()}</span>
                <span aria-hidden="true">·</span>
                <span className="shrink-0">{(confidence * 100).toFixed(0)}%</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 truncate">
                Click any arrow button to expand a block, then scroll up/down inside
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {(panelOffset.x !== 0 || panelOffset.y !== 0) && (
                <button
                  type="button"
                  onClick={() => setPanelOffset({ x: 0, y: 0 })}
                  aria-label="Reset AR overlay position"
                  className="p-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  setExpandedBlocks({
                    ingredients: false,
                    drama: false,
                    smart_device: false,
                  })
                }
                className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* 3 COLLAPSIBLE & SCROLLABLE AR BLOCKS CONTAINER */}
          <div className="p-3 space-y-2.5 overflow-y-auto ar-scroll flex-1">
            {/* ================================================================= */}
            {/* BLOCK 1: INGREDIENT DECODER                                       */}
            {/* ================================================================= */}
            <section
              data-testid="ar-block-ingredients"
              className="bg-slate-900/85 border border-slate-800 rounded-xl overflow-hidden transition-colors"
            >
              <div className="px-3.5 py-3 flex items-center justify-between gap-2 bg-slate-900/95">
                <button
                  type="button"
                  aria-expanded={expandedBlocks.ingredients}
                  onClick={() => toggleBlock('ingredients')}
                  className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer group"
                >
                  {/* Circular Chevron Arrow Button matching user's reference screenshot */}
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center border transition-transform duration-150 shrink-0 ${
                      expandedBlocks.ingredients
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 rotate-90'
                        : 'bg-slate-800 text-slate-200 border-slate-700 group-hover:border-cyan-400 group-hover:text-cyan-300'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                      1. Ingredient Decoder
                    </h3>
                    <div className="text-xs text-slate-400 truncate">
                      6 compounds decoded · 3 caution flags · 2 benign myths
                    </div>
                  </div>
                </button>

                {/* Smooth Scroll Up / Down Controls when expanded */}
                {expandedBlocks.ingredients ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => scrollBlockContent('ingredients', 'up')}
                      aria-label="Scroll Ingredient Decoder up"
                      title="Scroll Up"
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center border border-slate-700 cursor-pointer"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollBlockContent('ingredients', 'down')}
                      aria-label="Scroll Ingredient Decoder down"
                      title="Scroll Down"
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center border border-slate-700 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => expandOnlyBlock('ingredients')}
                    className="px-2.5 py-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Open
                  </button>
                )}
              </div>

              {expandedBlocks.ingredients && (
                <div className="border-t border-slate-800 p-3 space-y-2.5">
                  {/* Interactive Segmented Filter Row + Search */}
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
                    {(
                      [
                        { id: 'all', label: 'All (6)' },
                        { id: 'caution', label: 'Caution (3)' },
                        { id: 'mystery', label: 'Safe Myth (2)' },
                        { id: 'good', label: 'Vitamins (1)' },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setIngredientFilter(tab.id)}
                        className={`flex-1 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          ingredientFilter === tab.id
                            ? 'bg-cyan-500 text-slate-950'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Scrollable Ingredient Cards Container */}
                  <div
                    ref={scrollRefs.ingredients}
                    data-testid="scroll-container-ingredients"
                    className="max-h-[36vh] overflow-y-auto ar-scroll pr-1 space-y-2.5"
                  >
                    {filteredIngredients.map((item) => {
                      const isSpotlit = spotlightIngredientId === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border transition-colors ${
                            isSpotlit
                              ? 'bg-slate-900 border-cyan-400'
                              : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-xs font-mono text-slate-400">
                                {item.categoryLabel} · {item.riskLabel}
                              </div>
                              <h4 className="text-sm font-bold text-white mt-0.5">{item.name}</h4>
                              <div className="text-xs font-mono text-cyan-400/90 mt-0.5">
                                Label: {item.labelOnCan}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => onSpotlightIngredient(item.id)}
                              className="px-2.5 py-1 text-xs font-semibold bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-slate-700 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <Crosshair className="w-3.5 h-3.5" />
                              <span>Locate on Can</span>
                            </button>
                          </div>

                          <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 space-y-2 text-xs leading-relaxed">
                            <div>
                              <span className="font-semibold text-slate-200">Chemical Function: </span>
                              <span className="text-slate-300">{item.truth}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-amber-300">Physiological Impact: </span>
                              <span className="text-slate-300">{item.impact}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* ================================================================= */}
            {/* BLOCK 2: COMPANY DRAMA                                            */}
            {/* ================================================================= */}
            <section
              data-testid="ar-block-drama"
              className="bg-slate-900/85 border border-slate-800 rounded-xl overflow-hidden transition-colors"
            >
              <div className="px-3.5 py-3 flex items-center justify-between gap-2 bg-slate-900/95">
                <button
                  type="button"
                  aria-expanded={expandedBlocks.drama}
                  onClick={() => toggleBlock('drama')}
                  className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer group"
                >
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center border transition-transform duration-150 shrink-0 ${
                      expandedBlocks.drama
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 rotate-90'
                        : 'bg-slate-800 text-slate-200 border-slate-700 group-hover:border-cyan-400 group-hover:text-cyan-300'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                      2. Company Drama
                    </h3>
                    <div className="text-xs text-slate-400 truncate">
                      4 verified records · FDA Vodka recall · $8.2M & $82.6M lawsuits
                    </div>
                  </div>
                </button>

                {expandedBlocks.drama ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => scrollBlockContent('drama', 'up')}
                      aria-label="Scroll Company Drama up"
                      title="Scroll Up"
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center border border-slate-700 cursor-pointer"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollBlockContent('drama', 'down')}
                      aria-label="Scroll Company Drama down"
                      title="Scroll Down"
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center border border-slate-700 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => expandOnlyBlock('drama')}
                    className="px-2.5 py-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Open
                  </button>
                )}
              </div>

              {expandedBlocks.drama && (
                <div className="border-t border-slate-800 p-3">
                  <div
                    ref={scrollRefs.drama}
                    data-testid="scroll-container-drama"
                    className="max-h-[36vh] overflow-y-auto ar-scroll pr-1 space-y-2.5"
                  >
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                      <span className="font-semibold text-white">Entity:</span> Celsius Holdings, Inc. (NASDAQ: CELH) ·
                      Boca Raton, FL · Strategic Partner: PepsiCo
                    </div>

                    {DRAMA_DATA.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs font-mono text-amber-400">
                          <span>{item.category}</span>
                          <span className="text-slate-400">{item.year}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white leading-snug">{item.title}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">{item.summary}</p>
                        <div className="pt-2 border-t border-slate-800/80 text-xs text-cyan-300">
                          <span className="font-semibold text-white">Outcome: </span>
                          {item.verdict}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* ================================================================= */}
            {/* BLOCK 3: SMART DEVICE & ADVICE                                    */}
            {/* ================================================================= */}
            <section
              data-testid="ar-block-smart-device"
              className="bg-slate-900/85 border border-slate-800 rounded-xl overflow-hidden transition-colors"
            >
              <div className="px-3.5 py-3 flex items-center justify-between gap-2 bg-slate-900/95">
                <button
                  type="button"
                  aria-expanded={expandedBlocks.smart_device}
                  onClick={() => toggleBlock('smart_device')}
                  className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer group"
                >
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center border transition-transform duration-150 shrink-0 ${
                      expandedBlocks.smart_device
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 rotate-90'
                        : 'bg-slate-800 text-slate-200 border-slate-700 group-hover:border-cyan-400 group-hover:text-cyan-300'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                      3. Smart Device & Advice
                    </h3>
                    <div className="text-xs text-slate-400 truncate">
                      Wearable HR/Sleep telemetry · 4 intake scenarios · 3 protection rules
                    </div>
                  </div>
                </button>

                {expandedBlocks.smart_device ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => scrollBlockContent('smart_device', 'up')}
                      aria-label="Scroll Smart Device and Advice up"
                      title="Scroll Up"
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center border border-slate-700 cursor-pointer"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollBlockContent('smart_device', 'down')}
                      aria-label="Scroll Smart Device and Advice down"
                      title="Scroll Down"
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center border border-slate-700 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => expandOnlyBlock('smart_device')}
                    className="px-2.5 py-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Open
                  </button>
                )}
              </div>

              {expandedBlocks.smart_device && (
                <div className="border-t border-slate-800 p-3">
                  <div
                    ref={scrollRefs.smart_device}
                    data-testid="scroll-container-smart-device"
                    className="max-h-[38vh] overflow-y-auto ar-scroll pr-1 space-y-3"
                  >
                    {/* 4 Interactive Context Scenario Buttons */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {SMART_SCENARIOS.map((scen) => {
                        const isSelected = scen.id === activeScenarioId;
                        return (
                          <button
                            key={scen.id}
                            type="button"
                            onClick={() => setActiveScenarioId(scen.id)}
                            className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-500/15 border-cyan-400 text-white'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 text-xs font-mono">
                              <span
                                className={
                                  scen.status === 'Optimal'
                                    ? 'text-emerald-400'
                                    : scen.status === 'Caution'
                                    ? 'text-amber-400'
                                    : 'text-rose-400'
                                }
                              >
                                {scen.status}
                              </span>
                              <span className="text-slate-400">{scen.rating}</span>
                            </div>
                            <div className="text-xs font-bold text-white mt-0.5 truncate">{scen.title}</div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Scenario Verdict + Smart Device Biometric Telemetry */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                      <div className="text-xs font-mono text-cyan-400">
                        ACTIVE SCENARIO · {activeScenario.title.toUpperCase()} ({activeScenario.rating})
                      </div>
                      <h4 className="text-sm font-bold text-white leading-snug">{activeScenario.headline}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{activeScenario.description}</p>

                      {/* Smart Device / Wearable Biometric Readout Grid */}
                      <div className="pt-2 border-t border-slate-800">
                        <div className="text-xs font-mono text-slate-400 mb-2">
                          Smartwatch & Biometric Device Telemetry Forecast:
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                            <div className="flex items-center gap-1.5 text-rose-400 font-medium">
                              <HeartPulse className="w-3.5 h-3.5 shrink-0" />
                              <span>Heart Rate Delta</span>
                            </div>
                            <div className="font-mono text-white mt-0.5">
                              {activeScenario.smartDeviceMetrics.heartRateDelta}
                            </div>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                            <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                              <Moon className="w-3.5 h-3.5 shrink-0" />
                              <span>Sleep / HRV Impact</span>
                            </div>
                            <div className="font-mono text-white mt-0.5">
                              {activeScenario.smartDeviceMetrics.sleepImpact}
                            </div>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                            <div className="flex items-center gap-1.5 text-cyan-400 font-medium">
                              <Droplets className="w-3.5 h-3.5 shrink-0" />
                              <span>Hydration Target</span>
                            </div>
                            <div className="font-mono text-white mt-0.5">
                              {activeScenario.smartDeviceMetrics.hydrationNeed}
                            </div>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                              <Flame className="w-3.5 h-3.5 shrink-0" />
                              <span>Metabolic Window</span>
                            </div>
                            <div className="font-mono text-white mt-0.5">
                              {activeScenario.smartDeviceMetrics.metabolicWindow}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3 Golden Protection Rules */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <h4 className="text-xs font-mono uppercase text-cyan-400">
                        3 Harm-Reduction Rules (pH 3.1 & 140mg Caffeine)
                      </h4>
                      {GOLDEN_RULES.map((rule) => (
                        <div key={rule.title} className="pt-1.5 border-t border-slate-800/80 text-xs">
                          <div className="font-bold text-white">{rule.title}</div>
                          <p className="text-slate-300 mt-0.5 leading-relaxed">{rule.detail}</p>
                        </div>
                      ))}
                    </div>

                    {/* Cleaner Alternatives */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <h4 className="text-xs font-mono uppercase text-emerald-400">
                        Cleaner Alternatives (Zero Artificial Sweeteners)
                      </h4>
                      {CLEANER_ALTERNATIVES.map((alt) => (
                        <div key={alt.name} className="pt-1.5 border-t border-slate-800/80 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-white">{alt.name}</span>
                            <span className="font-mono text-slate-400">{alt.metrics}</span>
                          </div>
                          <p className="text-slate-300 mt-0.5 leading-relaxed">{alt.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </aside>
    </>
  );
};
