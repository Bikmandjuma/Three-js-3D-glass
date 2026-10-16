/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlantSpecimenData } from '../types/terrarium';
import { BOTANICAL_DATABASE } from '../data/plantsCatalog';
import {
  X,
  Droplets,
  Sun,
  MapPin,
  Sparkles,
  Crosshair,
  Heart,
  Info,
} from 'lucide-react';

interface BotanicalSpecimenCardProps {
  specimen: PlantSpecimenData;
  onClose: () => void;
  onFocusCamera: (specimenId: string) => void;
  onSpritz: () => void;
}

export const BotanicalSpecimenCard: React.FC<BotanicalSpecimenCardProps> = ({
  specimen,
  onClose,
  onFocusCamera,
  onSpritz,
}) => {
  const meta = BOTANICAL_DATABASE[specimen.species];

  return (
    <div className="fixed top-20 left-4 md:left-6 z-30 w-full max-w-sm pointer-events-auto transition-all animate-in fade-in slide-in-from-left duration-200">
      <div className="bg-[#141820]/95 border border-stone-800/90 rounded-2xl p-4 shadow-2xl text-stone-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-800/80 pb-3 mb-3">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/40">
                {meta?.family || 'Plantae'}
              </span>
              <span className="text-[10px] text-stone-400 font-mono">
                Stage: {Math.round(specimen.growthStage * 100)}%
              </span>
            </div>
            <h2 className="text-base font-semibold text-stone-100 font-serif">
              {specimen.commonName}
            </h2>
            <p className="text-xs text-emerald-400 font-serif italic">
              {specimen.botanicalName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-100 border border-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Requirements Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="p-2 rounded-xl bg-stone-900/60 border border-stone-800/60">
            <div className="flex items-center gap-1.5 text-stone-400 text-[11px] mb-1">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>Moisture Need</span>
            </div>
            <div className="font-medium text-cyan-200">{specimen.moistureReq}</div>
          </div>

          <div className="p-2 rounded-xl bg-stone-900/60 border border-stone-800/60">
            <div className="flex items-center gap-1.5 text-stone-400 text-[11px] mb-1">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Sunlight Need</span>
            </div>
            <div className="font-medium text-amber-200">{specimen.lightReq}</div>
          </div>
        </div>

        {/* Native Habitat */}
        {meta?.nativeRegion && (
          <div className="flex items-start gap-1.5 text-xs text-stone-400 mb-2.5 bg-stone-900/40 p-2 rounded-lg border border-stone-800/40">
            <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
            <span className="leading-snug">
              <strong className="text-stone-300 font-medium">Native Biome:</strong>{' '}
              {meta.nativeRegion}
            </span>
          </div>
        )}

        {/* Description */}
        <p className="text-xs text-stone-300 leading-relaxed mb-3">
          {specimen.description}
        </p>

        {/* Botanical Fact Callout */}
        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/30 text-[11px] text-emerald-200/90 leading-snug mb-3 flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-emerald-300 font-medium">Botanical Fact: </strong>
            {specimen.funFact}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1 border-t border-stone-800/80">
          <button
            onClick={() => onFocusCamera(specimen.id)}
            className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-900/70 hover:bg-emerald-800/80 border border-emerald-600/40 text-emerald-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
            <span>Focus Camera</span>
          </button>

          <button
            onClick={onSpritz}
            className="py-1.5 px-3 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-600/40 text-cyan-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span>Spritz</span>
          </button>
        </div>
      </div>
    </div>
  );
};
