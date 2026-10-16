/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  CameraPreset,
  FloraSpeciesType,
  PlantSpecimenData,
  TerrariumEnvironmentState,
} from './types/terrarium';
import { generateStarterFlora } from './data/plantsCatalog';
import { TerrariumEngine } from './three/TerrariumEngine';
import { terrariumAudio } from './three/audio';
import { TopHud } from './components/TopHud';
import { BottomDock } from './components/BottomDock';
import { BotanicalSpecimenCard } from './components/BotanicalSpecimenCard';
import { Sprout } from 'lucide-react';

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<TerrariumEngine | null>(null);

  // Initial State
  const [envState, setEnvState] = useState<TerrariumEnvironmentState>({
    timeOfDay: 14.5, // 2:30 PM (Golden afternoon sunlight)
    isTimePlaying: false,
    timeSpeed: 1,
    weather: 'sunny',
    vessel: 'wardian',
    glassMode: 'intact',
    glassClarity: 0.88,
    soilMoisture: 72,
    humidity: 78,
    temperature: 22.4,
    activeSeed: 42,
    plantToolActive: null,
    audioMuted: true,
    selectedSpecimenId: null,
  });

  const [floraList, setFloraList] = useState<PlantSpecimenData[]>(() =>
    generateStarterFlora(42)
  );
  const [currentCamera, setCurrentCamera] = useState<CameraPreset>('overview');

  // Handle telemetry ticks from Three.js engine simulation
  const handleStateTick = useCallback(
    (soilMoisture: number, humidity: number, temperature: number) => {
      setEnvState((prev) => ({
        ...prev,
        soilMoisture,
        humidity,
        temperature,
      }));
    },
    []
  );

  const handleSpecimenSelected = useCallback((specimenId: string | null) => {
    setEnvState((prev) => ({
      ...prev,
      selectedSpecimenId: specimenId,
    }));
  }, []);

  const handlePlantAdded = useCallback((newPlant: PlantSpecimenData) => {
    setFloraList((prev) => [...prev, newPlant]);
    // Reset planting tool
    setEnvState((prev) => ({
      ...prev,
      plantToolActive: null,
    }));
  }, []);

  // Initialize Three.js Engine once on mount
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new TerrariumEngine(
      mountRef.current,
      envState,
      floraList,
      {
        onSpecimenSelected: handleSpecimenSelected,
        onPlantAdded: handlePlantAdded,
        onStateTick: handleStateTick,
      }
    );

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
      terrariumAudio.dispose();
    };
  }, []); // Run once

  // Push state updates to engine without rebuilding scene
  const handleUpdateEnvState = (partial: Partial<TerrariumEnvironmentState>) => {
    setEnvState((prev) => {
      const updated = { ...prev, ...partial };
      if (engineRef.current) {
        engineRef.current.setEnvironmentState(partial);
      }
      return updated;
    });
  };

  const handleSelectCamera = (preset: CameraPreset) => {
    setCurrentCamera(preset);
    if (engineRef.current) {
      engineRef.current.setCameraPreset(preset);
    }
  };

  const handleTriggerSpritz = () => {
    if (engineRef.current) {
      engineRef.current.triggerMistSpritz();
    }
  };

  const handleToggleAudio = () => {
    terrariumAudio.init();
    const newMuted = terrariumAudio.toggleMute();
    handleUpdateEnvState({ audioMuted: newMuted });
  };

  const handleRegenerateSeed = () => {
    const newSeed = Math.floor(Math.random() * 100000);
    const newFlora = generateStarterFlora(newSeed);
    setFloraList(newFlora);
    handleUpdateEnvState({ activeSeed: newSeed, selectedSpecimenId: null });
    if (engineRef.current) {
      engineRef.current.regenerateFlora(newSeed, newFlora);
    }
  };

  const handleGrowthChange = (growth: number) => {
    if (engineRef.current) {
      engineRef.current.setGrowthStageAll(growth);
    }
  };

  const handleFocusCameraOnSpecimen = (id: string) => {
    if (engineRef.current) {
      engineRef.current.focusCameraOnSpecimen(id);
    }
  };

  const selectedSpecimen = floraList.find(
    (f) => f.id === envState.selectedSpecimenId
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0c0f17] select-none text-stone-100 font-sans">
      {/* 3D WebGL Canvas Ref Mount */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Planting Cursor Hint Banner */}
      {envState.plantToolActive && (
        <div className="pointer-events-none fixed top-20 inset-x-0 flex justify-center z-20 animate-bounce">
          <div className="bg-emerald-950/90 border border-emerald-500/80 text-emerald-200 px-4 py-2 rounded-full shadow-2xl text-xs font-medium flex items-center gap-2">
            <Sprout className="w-4 h-4 text-emerald-400" />
            <span>Click on the soil inside the terrarium to plant {envState.plantToolActive}!</span>
            <span className="text-[10px] text-emerald-400/80 font-mono">(Esc to cancel)</span>
          </div>
        </div>
      )}

      {/* Top HUD (Brand, Telemetry, Camera, Audio, Spritz) */}
      <TopHud
        timeOfDay={envState.timeOfDay}
        weather={envState.weather}
        soilMoisture={envState.soilMoisture}
        humidity={envState.humidity}
        temperature={envState.temperature}
        audioMuted={envState.audioMuted}
        onToggleAudio={handleToggleAudio}
        onTriggerSpritz={handleTriggerSpritz}
        onSelectCamera={handleSelectCamera}
        currentCamera={currentCamera}
      />

      {/* Botanical Specimen Popover Card when clicked */}
      {selectedSpecimen && (
        <BotanicalSpecimenCard
          specimen={selectedSpecimen}
          onClose={() => handleSpecimenSelected(null)}
          onFocusCamera={handleFocusCameraOnSpecimen}
          onSpritz={handleTriggerSpritz}
        />
      )}

      {/* Collapsible Bottom Control Dock */}
      <BottomDock
        state={envState}
        onUpdateState={handleUpdateEnvState}
        onRegenerateSeed={handleRegenerateSeed}
        onGrowthChange={handleGrowthChange}
      />
    </div>
  );
}
