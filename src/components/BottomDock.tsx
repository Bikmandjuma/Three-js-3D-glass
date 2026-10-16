/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CameraPreset,
  FloraSpeciesType,
  GlassMode,
  TerrariumEnvironmentState,
  VesselType,
  WeatherType,
} from '../types/terrarium';
import { BOTANICAL_DATABASE } from '../data/plantsCatalog';
import {
  Sun,
  Moon,
  CloudRain,
  CloudFog,
  Zap,
  Sparkles,
  Snowflake,
  Box,
  Sprout,
  Play,
  Pause,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sliders,
  Layers,
  Thermometer,
  Feather,
} from 'lucide-react';

interface BottomDockProps {
  state: TerrariumEnvironmentState;
  onUpdateState: (newState: Partial<TerrariumEnvironmentState>) => void;
  onRegenerateSeed: () => void;
  onGrowthChange: (growth: number) => void;
}

type TabType = 'lighting' | 'weather' | 'vessel' | 'flora';

export const BottomDock: React.FC<BottomDockProps> = ({
  state,
  onUpdateState,
  onRegenerateSeed,
  onGrowthChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('lighting');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [growthVal, setGrowthVal] = useState(1.0);

  // Keyboard shortcut 'H' to toggle dock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setIsCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const weatherOptions: { id: WeatherType; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'sunny',
      label: 'Clear Sun',
      icon: <Sun className="w-4 h-4 text-amber-400" />,
      desc: 'Warm golden rays with floating dust motes',
    },
    {
      id: 'mist',
      label: 'Morning Mist',
      icon: <CloudFog className="w-4 h-4 text-cyan-300" />,
      desc: 'Volumetric swirling fog trapped inside glass',
    },
    {
      id: 'rain',
      label: 'Spring Rain',
      icon: <CloudRain className="w-4 h-4 text-blue-400" />,
      desc: 'Gentle raindrops with glass condensation runs',
    },
    {
      id: 'thunderstorm',
      label: 'Thunderstorm',
      icon: <Zap className="w-4 h-4 text-indigo-400" />,
      desc: 'Heavy raindrops & distant lightning illumination',
    },
    {
      id: 'fireflies',
      label: 'Firefly Eve',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      desc: 'Dancing bioluminescent firefly swarm inside',
    },
    {
      id: 'solstice',
      label: 'Winter Solstice',
      icon: <Snowflake className="w-4 h-4 text-sky-300" />,
      desc: 'Drifting crystal snowflakes & frosty glass',
    },
  ];

  const vesselOptions: { id: VesselType; label: string; desc: string }[] = [
    {
      id: 'wardian',
      label: 'Wardian Case',
      desc: 'Victorian pitched conservatory with brass framing & claw feet',
    },
    {
      id: 'bell_jar',
      label: 'Bell Jar (Cloche)',
      desc: 'Turned dark walnut pedestal base with blown crystal dome',
    },
    {
      id: 'geometric_prism',
      label: 'Geodesic Prism',
      desc: 'Faceted hexagonal terrarium with antique solder joints',
    },
  ];

  const glassModes: { id: GlassMode; label: string }[] = [
    { id: 'intact', label: 'Crystal Intact' },
    { id: 'lid_opened', label: 'Exploded View (Lid Open)' },
    { id: 'cross_section', label: 'Cross-Section' },
    { id: 'wireframe', label: 'Brass Skeleton' },
  ];

  const plantSpeciesList: { id: FloraSpeciesType; label: string; iconColor: string }[] = [
    { id: 'fern', label: 'Fiddlehead Fern', iconColor: 'text-emerald-400' },
    { id: 'bonsai', label: 'Miniature Bonsai', iconColor: 'text-amber-500' },
    { id: 'succulent', label: 'Echeveria Rosette', iconColor: 'text-teal-300' },
    { id: 'pitcher', label: 'Carnivorous Pitcher', iconColor: 'text-rose-400' },
    { id: 'biomushroom', label: 'Ghost Mushroom', iconColor: 'text-green-300' },
    { id: 'cushion_moss', label: 'Velvet Moss', iconColor: 'text-lime-400' },
  ];

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-[min(940px,94vw)] transition-transform duration-300 ease-out ${
        isCollapsed ? 'translate-y-[calc(100%-42px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse / Expand Tab */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-4 py-1 rounded-t-lg bg-[#141820]/95 border-t border-x border-stone-800 text-stone-300 text-xs hover:text-stone-100 transition-colors cursor-pointer shadow-lg font-medium"
        >
          {isCollapsed ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-400" />}
          <span>{isCollapsed ? 'Show Controls' : 'Hide Controls'}</span>
          <span className="text-[10px] text-stone-500 font-mono ml-1 hidden sm:inline">(Key: H)</span>
        </button>
      </div>

      {/* Main Dock Container (Solid/rgba styling, no backdrop-filter) */}
      <div className="bg-[#141820]/95 border border-stone-800/90 rounded-2xl p-3 md:p-4 shadow-2xl">
        {/* Navigation Tabs Header */}
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-2.5 mb-3 gap-2 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('lighting')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'lighting'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Day & Light</span>
            </button>

            <button
              onClick={() => setActiveTab('weather')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'weather'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
              <span>Weather & Fog</span>
            </button>

            <button
              onClick={() => setActiveTab('vessel')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'vessel'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-amber-300" />
              <span>Vessel & Glass</span>
            </button>

            <button
              onClick={() => setActiveTab('flora')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'flora'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
              }`}
            >
              <Sprout className="w-3.5 h-3.5 text-emerald-400" />
              <span>Flora & Planting</span>
            </button>
          </div>

          {/* Quick Active Status Badge */}
          <div className="hidden md:flex items-center gap-2 text-[11px] text-stone-400 font-mono">
            <span>Glass: <strong className="text-stone-200 uppercase">{state.vessel.replace('_', ' ')}</strong></span>
            <span>•</span>
            <span>Mode: <strong className="text-emerald-300 uppercase">{state.glassMode.replace('_', ' ')}</strong></span>
          </div>
        </div>

        {/* Tab 1: Day & Lighting */}
        {activeTab === 'lighting' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-300 font-medium">Celestial Time:</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-amber-300 font-bold">
                  {Math.floor(state.timeOfDay).toString().padStart(2, '0')}:
                  {Math.floor((state.timeOfDay % 1) * 60)
                    .toString()
                    .padStart(2, '0')}
                </span>

                <button
                  onClick={() => onUpdateState({ isTimePlaying: !state.isTimePlaying })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs text-stone-200 transition-colors cursor-pointer"
                >
                  {state.isTimePlaying ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                  <span>{state.isTimePlaying ? 'Pause Cycle' : 'Play Cycle'}</span>
                </button>

                {state.isTimePlaying && (
                  <div className="flex items-center gap-1 bg-stone-900/80 rounded p-0.5 border border-stone-800 text-[10px]">
                    {[1, 5, 15].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => onUpdateState({ timeSpeed: spd })}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${
                          state.timeSpeed === spd
                            ? 'bg-emerald-800 text-emerald-100 font-bold'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Time Preset Pills */}
              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => onUpdateState({ timeOfDay: 6.2, isTimePlaying: false })}
                  className="px-2 py-1 rounded bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-amber-200 cursor-pointer"
                >
                  Dawn (06:15)
                </button>
                <button
                  onClick={() => onUpdateState({ timeOfDay: 12.0, isTimePlaying: false })}
                  className="px-2 py-1 rounded bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-amber-200 cursor-pointer"
                >
                  Noon (12:00)
                </button>
                <button
                  onClick={() => onUpdateState({ timeOfDay: 18.0, isTimePlaying: false })}
                  className="px-2 py-1 rounded bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-orange-300 cursor-pointer"
                >
                  Golden (18:00)
                </button>
                <button
                  onClick={() => onUpdateState({ timeOfDay: 23.5, isTimePlaying: false })}
                  className="px-2 py-1 rounded bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-indigo-300 cursor-pointer"
                >
                  Midnight (23:30)
                </button>
              </div>
            </div>

            {/* 24h Slider */}
            <div className="relative pt-1 pb-2">
              <input
                type="range"
                min="0"
                max="24"
                step="0.1"
                value={state.timeOfDay}
                onChange={(e) => onUpdateState({ timeOfDay: parseFloat(e.target.value) })}
                className="w-full h-2 rounded-lg bg-stone-800 appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[10px] text-stone-400 font-mono mt-1">
                <span>00:00 (Night)</span>
                <span>06:00 (Dawn)</span>
                <span>12:00 (Noon)</span>
                <span>18:00 (Sunset)</span>
                <span>24:00 (Night)</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Weather & Atmosphere */}
        {activeTab === 'weather' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {weatherOptions.map((opt) => {
              const isSelected = state.weather === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onUpdateState({ weather: opt.id })}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-950/70 border-emerald-500/60 shadow-lg'
                      : 'bg-stone-900/70 border-stone-800/70 hover:bg-stone-800/60 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="p-1 rounded bg-stone-950/70 border border-stone-800">
                      {opt.icon}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-mono px-1 rounded bg-emerald-500/20 text-emerald-300">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-xs font-semibold ${isSelected ? 'text-stone-100' : 'text-stone-300'}`}>
                      {opt.label}
                    </h3>
                    <p className="text-[10px] text-stone-400 leading-tight mt-0.5 line-clamp-2">
                      {opt.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 3: Vessel & Glass */}
        {activeTab === 'vessel' && (
          <div className="space-y-3">
            {/* Vessel Choice */}
            <div>
              <div className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold mb-1.5">
                Vessel Architecture
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {vesselOptions.map((v) => {
                  const isSelected = state.vessel === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => onUpdateState({ vessel: v.id })}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-950/50 border-amber-500/60 shadow-md'
                          : 'bg-stone-900/70 border-stone-800 hover:bg-stone-800/60 text-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${isSelected ? 'text-amber-200' : 'text-stone-200'}`}>
                          {v.label}
                        </span>
                        {isSelected && <span className="text-[10px] text-amber-400 font-mono">SELECTED</span>}
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1 leading-snug">{v.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Glass Mode & Clarity */}
            <div className="pt-2 border-t border-stone-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs text-stone-300 font-medium mr-1">Glass State:</span>
                {glassModes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onUpdateState({ glassMode: m.id })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      state.glassMode === m.id
                        ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                        : 'bg-stone-900/70 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Clarity slider */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-stone-400 whitespace-nowrap">Glass Refraction:</span>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={state.glassClarity}
                  onChange={(e) => onUpdateState({ glassClarity: parseFloat(e.target.value) })}
                  className="w-24 sm:w-32 h-1.5 rounded bg-stone-800 appearance-none cursor-pointer accent-emerald-400"
                />
                <span className="text-[11px] font-mono text-stone-300">{Math.round(state.glassClarity * 100)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Flora & Planting */}
        {activeTab === 'flora' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-300 font-medium">Plant New Specimen:</span>
                {state.plantToolActive && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-600/40">
                    Click anywhere on the soil terrain!
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Ecosystem Seed Re-Roll */}
                <button
                  onClick={onRegenerateSeed}
                  className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-stone-100 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Randomize Seed</span>
                </button>
              </div>
            </div>

            {/* Plant selection chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {plantSpeciesList.map((p) => {
                const isSelected = state.plantToolActive === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => onUpdateState({ plantToolActive: isSelected ? null : p.id })}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-900/60 border-emerald-500 text-emerald-100 shadow-md ring-1 ring-emerald-400'
                        : 'bg-stone-900/70 border-stone-800 text-stone-300 hover:bg-stone-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Sprout className={`w-3.5 h-3.5 ${p.iconColor}`} />
                      {isSelected ? (
                        <span className="text-[9px] px-1 bg-emerald-500/30 text-emerald-200 rounded">
                          PLANTING
                        </span>
                      ) : (
                        <span className="text-[9px] text-stone-500">+Add</span>
                      )}
                    </div>
                    <div className="text-xs font-medium truncate">{p.label}</div>
                  </button>
                );
              })}
            </div>

            {/* Global Growth Stage Slider */}
            <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <span>Growth Age Stage:</span>
                <input
                  type="range"
                  min="0.5"
                  max="1.4"
                  step="0.05"
                  value={growthVal}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setGrowthVal(v);
                    onGrowthChange(v);
                  }}
                  className="w-32 sm:w-48 h-1.5 rounded bg-stone-800 appearance-none cursor-pointer accent-emerald-400"
                />
                <span className="font-mono text-stone-200">{Math.round(growthVal * 100)}%</span>
              </div>
              <span className="text-[11px] text-stone-500 hidden sm:inline">
                Click any specimen in 3D to inspect its botanical card
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
