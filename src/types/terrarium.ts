/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VesselType = 'wardian' | 'bell_jar' | 'geometric_prism';

export type WeatherType = 'sunny' | 'mist' | 'rain' | 'thunderstorm' | 'fireflies' | 'solstice';

export type GlassMode = 'intact' | 'lid_opened' | 'cross_section' | 'wireframe';

export type CameraPreset = 'overview' | 'macro' | 'top_down' | 'inside';

export type FloraSpeciesType = 
  | 'fern' 
  | 'bonsai' 
  | 'succulent' 
  | 'pitcher' 
  | 'biomushroom' 
  | 'cushion_moss';

export interface PlantSpecimenData {
  id: string;
  species: FloraSpeciesType;
  commonName: string;
  botanicalName: string;
  position: [number, number, number];
  rotationY: number;
  scale: number;
  growthStage: number; // 0.5 to 1.5
  health: number; // 0 to 100
  moistureReq: 'Low' | 'Moderate' | 'High' | 'Bog / Saturated';
  lightReq: 'Bright Indirect' | 'Full Sun' | 'Dappled Shade' | 'Low Light';
  description: string;
  funFact: string;
}

export interface TerrariumEnvironmentState {
  timeOfDay: number; // 0.0 - 24.0 hours
  isTimePlaying: boolean;
  timeSpeed: number; // multiplier
  weather: WeatherType;
  vessel: VesselType;
  glassMode: GlassMode;
  glassClarity: number; // 0.0 (opaque/frosted) to 1.0 (ultra-clear)
  soilMoisture: number; // 0 - 100%
  humidity: number; // 0 - 100%
  temperature: number; // 15 - 32 Celsius
  activeSeed: number;
  plantToolActive: FloraSpeciesType | null;
  audioMuted: boolean;
  selectedSpecimenId: string | null;
}
