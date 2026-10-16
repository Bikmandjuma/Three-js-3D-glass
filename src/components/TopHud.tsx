/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CameraPreset, WeatherType } from '../types/terrarium';
import {
  Sun,
  Moon,
  CloudRain,
  CloudFog,
  Zap,
  Sparkles,
  Snowflake,
  Droplets,
  Volume2,
  VolumeX,
  Camera,
  Eye,
  Crosshair,
  Compass,
} from 'lucide-react';

interface TopHudProps {
  timeOfDay: number;
  weather: WeatherType;
  soilMoisture: number;
  humidity: number;
  temperature: number;
  audioMuted: boolean;
  onToggleAudio: () => void;
  onTriggerSpritz: () => void;
  onSelectCamera: (preset: CameraPreset) => void;
  currentCamera: CameraPreset;
}

export const TopHud: React.FC<TopHudProps> = ({
  timeOfDay,
  weather,
  soilMoisture,
  humidity,
  temperature,
  audioMuted,
  onToggleAudio,
  onTriggerSpritz,
  onSelectCamera,
  currentCamera,
}) => {
  // Format hours and minutes from 24h float
  const hours = Math.floor(timeOfDay);
  const minutes = Math.floor((timeOfDay - hours) * 60);
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  const getTimeLabel = (h: number) => {
    if (h >= 5 && h < 8) return 'Dawn Awakening';
    if (h >= 8 && h < 12) return 'Morning Light';
    if (h >= 12 && h < 16) return 'High Noon Sun';
    if (h >= 16 && h < 19) return 'Golden Hour';
    if (h >= 19 && h < 21) return 'Twilight Dusk';
    return 'Midnight Starlight';
  };

  const getWeatherIcon = (w: WeatherType) => {
    switch (w) {
      case 'sunny':
        return <Sun className="w-3.5 h-3.5 text-amber-400" />;
      case 'mist':
        return <CloudFog className="w-3.5 h-3.5 text-cyan-300" />;
      case 'rain':
        return <CloudRain className="w-3.5 h-3.5 text-blue-400" />;
      case 'thunderstorm':
        return <Zap className="w-3.5 h-3.5 text-indigo-400" />;
      case 'fireflies':
        return <Sparkles className="w-3.5 h-3.5 text-emerald-400" />;
      case 'solstice':
        return <Snowflake className="w-3.5 h-3.5 text-sky-300" />;
    }
  };

  const isNight = timeOfDay < 5.5 || timeOfDay > 20.0;

  return (
    <header className="pointer-events-none fixed top-0 inset-x-0 p-4 md:p-6 z-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
      {/* Brand Identity / Botanical Header */}
      <div className="pointer-events-auto bg-[#141820]/90 border border-stone-800/80 rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-600/40 flex items-center justify-center text-emerald-400">
          <Droplets className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-stone-100 text-sm font-semibold tracking-wider uppercase">
              Verdant Glass
            </h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700/30 font-mono">
              3D Vivarium
            </span>
          </div>
          <p className="text-[11px] text-stone-400 font-serif italic">
            Vivarium Botanicum in Vitro
          </p>
        </div>
      </div>

      {/* Atmospheric Microclimate Telemetry Chips */}
      <div className="pointer-events-auto hidden lg:flex items-center gap-2 bg-[#141820]/90 border border-stone-800/80 rounded-xl px-3.5 py-2 shadow-xl text-xs">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-stone-900/60 text-stone-300 border border-stone-800/50">
          {isNight ? <Moon className="w-3.5 h-3.5 text-indigo-300" /> : <Sun className="w-3.5 h-3.5 text-amber-300" />}
          <span className="font-mono text-stone-100 font-medium">{timeStr}</span>
          <span className="text-stone-400 text-[11px]">({getTimeLabel(timeOfDay)})</span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-stone-900/60 text-stone-300 border border-stone-800/50">
          {getWeatherIcon(weather)}
          <span className="capitalize text-stone-200">{weather}</span>
        </div>

        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-900/60 text-stone-300 border border-stone-800/50">
          <span className="text-stone-400 text-[11px]">Soil:</span>
          <span className="font-mono text-emerald-400 font-medium">{soilMoisture}%</span>
        </div>

        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-900/60 text-stone-300 border border-stone-800/50">
          <span className="text-stone-400 text-[11px]">Humidity:</span>
          <span className="font-mono text-cyan-400 font-medium">{humidity}%</span>
        </div>

        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-900/60 text-stone-300 border border-stone-800/50">
          <span className="text-stone-400 text-[11px]">Temp:</span>
          <span className="font-mono text-amber-300 font-medium">{temperature}°C</span>
        </div>
      </div>

      {/* Camera Presets & Fast Actions */}
      <div className="pointer-events-auto flex items-center gap-2 bg-[#141820]/90 border border-stone-800/80 rounded-xl p-1.5 shadow-xl">
        {/* Camera Pills */}
        <div className="flex items-center gap-1 bg-stone-900/80 rounded-lg p-0.5 border border-stone-800/60">
          <button
            onClick={() => onSelectCamera('overview')}
            title="Overview View (3/4 Angle)"
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              currentCamera === 'overview'
                ? 'bg-emerald-800/60 text-emerald-200 border border-emerald-600/40'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Overview</span>
          </button>

          <button
            onClick={() => onSelectCamera('macro')}
            title="Macro Close-Up View"
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              currentCamera === 'macro'
                ? 'bg-emerald-800/60 text-emerald-200 border border-emerald-600/40'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Macro</span>
          </button>

          <button
            onClick={() => onSelectCamera('inside')}
            title="Inside Vivarium Canopy View"
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              currentCamera === 'inside'
                ? 'bg-emerald-800/60 text-emerald-200 border border-emerald-600/40'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inside</span>
          </button>

          <button
            onClick={() => onSelectCamera('top_down')}
            title="Top-Down Plan View"
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              currentCamera === 'top_down'
                ? 'bg-emerald-800/60 text-emerald-200 border border-emerald-600/40'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Plan</span>
          </button>
        </div>

        {/* Spritz Water Action Button */}
        <button
          onClick={onTriggerSpritz}
          title="Spritz Mist Spray (+22% Humidity)"
          className="px-3 py-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-600/40 text-cyan-300 text-xs font-medium flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Droplets className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Spritz Mist</span>
        </button>

        {/* Audio Mute / Ambient Sound */}
        <button
          onClick={onToggleAudio}
          title={audioMuted ? 'Unmute Procedural Soundscape' : 'Mute Soundscape'}
          className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
            !audioMuted
              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-600/40'
              : 'bg-stone-900/80 text-stone-400 border-stone-800/70 hover:text-stone-200'
          }`}
        >
          {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
