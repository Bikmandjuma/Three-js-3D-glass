/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  CameraPreset,
  FloraSpeciesType,
  GlassMode,
  PlantSpecimenData,
  TerrariumEnvironmentState,
  VesselType,
  WeatherType,
} from '../types/terrarium';
import { BOTANICAL_DATABASE } from '../data/plantsCatalog';
import { createSubstrate, SubstrateBundle } from './procedural/substrate';
import { createVessel, VesselBundle } from './procedural/vessel';
import { createFloraInstance, FloraInstance } from './procedural/flora';
import { createWeatherSystem, WeatherSystemBundle } from './procedural/weather';
import { setupLighting, LightingRigBundle } from './lighting';
import { terrariumAudio } from './audio';

export interface TerrariumEngineCallbacks {
  onSpecimenSelected: (specimenId: string | null) => void;
  onPlantAdded: (specimen: PlantSpecimenData) => void;
  onStateTick: (soilMoisture: number, humidity: number, temperature: number) => void;
}

export class TerrariumEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;

  private substrate: SubstrateBundle | null = null;
  private vessel: VesselBundle | null = null;
  private lighting: LightingRigBundle | null = null;
  private weatherSystem: WeatherSystemBundle | null = null;

  private floraInstances: Map<string, FloraInstance> = new Map();
  private floraDataList: PlantSpecimenData[] = [];

  private isRunning: boolean = false;
  private animFrameId: number | null = null;
  private clock: THREE.Clock = new THREE.Clock();

  // Camera preset animation targets
  private targetCamPos: THREE.Vector3 = new THREE.Vector3(7.5, 6.8, 9.2);
  private targetControlsTarget: THREE.Vector3 = new THREE.Vector3(0, 3.2, 0);
  private isTransitioningCamera: boolean = false;

  // Raycasting helpers (pre-allocated)
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouseVec: THREE.Vector2 = new THREE.Vector2();

  // Environment and simulation parameters
  private state: TerrariumEnvironmentState;
  private callbacks: TerrariumEngineCallbacks;

  private simulationAccumulator: number = 0;

  constructor(
    container: HTMLElement,
    initialState: TerrariumEnvironmentState,
    initialFlora: PlantSpecimenData[],
    callbacks: TerrariumEngineCallbacks
  ) {
    this.container = container;
    this.state = { ...initialState };
    this.floraDataList = [...initialFlora];
    this.callbacks = callbacks;

    // 1. Renderer Setup (Modern Color Pipeline)
    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);

    // 2. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e121a);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 120);
    this.camera.position.copy(this.targetCamPos);

    // 3. OrbitControls with Damping
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.02; // Ground limit
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 24.0;
    this.controls.target.copy(this.targetControlsTarget);
    this.controls.update();

    // 4. Initialize Lighting Rig
    this.lighting = setupLighting(this.scene, this.renderer);
    this.scene.add(this.lighting.group);

    // 5. Build Substrate
    this.buildSubstrate();

    // 6. Build Vessel
    this.buildVessel(this.state.vessel);

    // 7. Build Flora
    this.rebuildFlora();

    // 8. Build Weather
    this.weatherSystem = createWeatherSystem(3.5, 6.8);
    this.scene.add(this.weatherSystem.group);

    // 9. Pre-warm shaders
    this.renderer.compile(this.scene, this.camera);

    // 10. Event Listeners
    this.bindEvents();

    // 11. Start Loop
    this.start();
  }

  private buildSubstrate() {
    if (this.substrate) {
      this.scene.remove(this.substrate.group);
      this.substrate.dispose();
    }
    this.substrate = createSubstrate(3.6, 1.25);
    this.scene.add(this.substrate.group);
  }

  private buildVessel(type: VesselType) {
    if (this.vessel) {
      this.scene.remove(this.vessel.group);
      this.vessel.dispose();
    }
    this.vessel = createVessel(type, 3.6, 6.8);
    this.vessel.updateMode(this.state.glassMode, this.state.glassClarity, this.state.humidity);
    this.scene.add(this.vessel.group);
  }

  private rebuildFlora() {
    // Clear existing
    this.floraInstances.forEach((inst) => {
      this.scene.remove(inst.group);
      inst.dispose();
    });
    this.floraInstances.clear();

    const getHeightAt = this.substrate ? this.substrate.getHeightAt : () => 1.2;

    this.floraDataList.forEach((data) => {
      // Align position Y flush with the soil surface
      const y = getHeightAt(data.position[0], data.position[2]);
      const specData: PlantSpecimenData = {
        ...data,
        position: [data.position[0], y, data.position[2]],
      };
      const inst = createFloraInstance(specData);
      this.floraInstances.set(data.id, inst);
      this.scene.add(inst.group);
    });
  }

  private bindEvents() {
    window.addEventListener('resize', this.onResize);
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this.onPointerDown);
  }

  private unbindEvents() {
    window.removeEventListener('resize', this.onResize);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
  }

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onPointerDown = (event: MouseEvent) => {
    // Check if dragging or clicking
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouseVec.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseVec.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseVec, this.camera);

    // 1. If planting tool is active, raycast against soil terrain mesh
    if (this.state.plantToolActive && this.substrate) {
      const terrainHits = this.raycaster.intersectObject(this.substrate.terrainMesh, false);
      if (terrainHits.length > 0) {
        const hit = terrainHits[0];
        const distFromCenter = Math.sqrt(hit.point.x ** 2 + hit.point.z ** 2);
        if (distFromCenter < 2.9) {
          // Inside planting perimeter
          this.plantNewSpecimen(this.state.plantToolActive, hit.point.x, hit.point.z);
          return;
        }
      }
    }

    // 2. Raycast against flora hitboxes
    const allMeshes: THREE.Object3D[] = [];
    this.floraInstances.forEach((inst) => {
      inst.group.traverse((child) => {
        if (child.userData && child.userData.isFlora) {
          allMeshes.push(child);
        }
      });
    });

    const hits = this.raycaster.intersectObjects(allMeshes, false);
    if (hits.length > 0) {
      const specimenId = hits[0].object.userData.specimenId;
      if (specimenId) {
        this.selectSpecimen(specimenId);
        return;
      }
    }

    // Clicked empty space
    if (!this.state.plantToolActive) {
      this.callbacks.onSpecimenSelected(null);
    }
  };

  public plantNewSpecimen(species: FloraSpeciesType, x: number, z: number) {
    const meta = BOTANICAL_DATABASE[species];
    const id = `specimen_${species}_${Date.now()}`;
    const newSpecimen: PlantSpecimenData = {
      id,
      species,
      commonName: meta.commonName,
      botanicalName: meta.botanicalName,
      position: [x, 0, z],
      rotationY: Math.random() * Math.PI * 2,
      scale: 0.85,
      growthStage: 0.75, // Baby sprout
      health: 100,
      moistureReq: meta.moistureReq,
      lightReq: meta.lightReq,
      description: meta.description,
      funFact: meta.funFact,
    };

    this.floraDataList.push(newSpecimen);
    const getHeightAt = this.substrate ? this.substrate.getHeightAt : () => 1.2;
    const y = getHeightAt(x, z);
    newSpecimen.position[1] = y;

    const inst = createFloraInstance(newSpecimen);
    this.floraInstances.set(id, inst);
    this.scene.add(inst.group);

    this.callbacks.onPlantAdded(newSpecimen);
    this.selectSpecimen(id);
  }

  public selectSpecimen(specimenId: string) {
    this.state.selectedSpecimenId = specimenId;
    this.callbacks.onSpecimenSelected(specimenId);

    // Highlight or pulse selected specimen
    const inst = this.floraInstances.get(specimenId);
    if (inst) {
      inst.setEmissiveIntensity(1.5);
    }
  }

  public focusCameraOnSpecimen(specimenId: string) {
    const inst = this.floraInstances.get(specimenId);
    if (!inst) return;
    const pos = inst.data.position;
    this.targetControlsTarget.set(pos[0], pos[1] + 0.6, pos[2]);
    this.targetCamPos.set(pos[0] + 1.8, pos[1] + 1.2, pos[2] + 2.2);
    this.isTransitioningCamera = true;
  }

  public setCameraPreset(preset: CameraPreset) {
    this.isTransitioningCamera = true;
    switch (preset) {
      case 'overview':
        this.targetCamPos.set(7.5, 6.8, 9.2);
        this.targetControlsTarget.set(0, 3.2, 0);
        break;
      case 'macro':
        this.targetCamPos.set(2.4, 2.5, 3.2);
        this.targetControlsTarget.set(0, 1.8, 0);
        break;
      case 'top_down':
        this.targetCamPos.set(0.1, 13.5, 0.1);
        this.targetControlsTarget.set(0, 2.0, 0);
        break;
      case 'inside':
        this.targetCamPos.set(0.4, 2.1, 0.6);
        this.targetControlsTarget.set(0, 2.8, -0.4);
        break;
    }
  }

  public setEnvironmentState(newState: Partial<TerrariumEnvironmentState>) {
    const prevVessel = this.state.vessel;
    this.state = { ...this.state, ...newState };

    if (newState.vessel && newState.vessel !== prevVessel) {
      this.buildVessel(newState.vessel);
    }

    if (this.vessel) {
      this.vessel.updateMode(this.state.glassMode, this.state.glassClarity, this.state.humidity);
    }

    terrariumAudio.setWeatherAndDay(this.state.weather, this.state.timeOfDay);
  }

  public triggerMistSpritz() {
    if (this.weatherSystem) {
      this.weatherSystem.triggerMistSpritz();
    }
    terrariumAudio.playSpritzSound();

    // Increase terrarium humidity & soil moisture
    this.state.humidity = Math.min(100, this.state.humidity + 22);
    this.state.soilMoisture = Math.min(100, this.state.soilMoisture + 15);

    if (this.vessel) {
      this.vessel.updateMode(this.state.glassMode, this.state.glassClarity, this.state.humidity);
    }
  }

  public setGrowthStageAll(multiplier: number) {
    this.floraInstances.forEach((inst) => {
      inst.data.growthStage = multiplier;
      const s = inst.data.scale * multiplier;
      inst.group.scale.set(s, s, s);
    });
  }

  public regenerateFlora(seed: number, newFlora: PlantSpecimenData[]) {
    this.state.activeSeed = seed;
    this.floraDataList = [...newFlora];
    this.rebuildFlora();
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.tick();
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private tick = () => {
    if (!this.isRunning) return;
    this.animFrameId = requestAnimationFrame(this.tick);

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Time-of-day progression if playing
    if (this.state.isTimePlaying) {
      const hoursPerSec = (24 / 60) * (this.state.timeSpeed || 1);
      this.state.timeOfDay = (this.state.timeOfDay + hoursPerSec * dt) % 24;
    }

    // 2. Lighting & Sky Update
    if (this.lighting) {
      this.lighting.update(this.state.timeOfDay, this.state.weather);
      this.scene.background = this.lighting.getHorizonColor();
    }

    // 3. Vessel Animation (lid lift)
    if (this.vessel) {
      this.vessel.updateAnimation(dt, this.state.glassMode);
    }

    // 4. Weather & Atmosphere
    if (this.weatherSystem) {
      this.weatherSystem.update(dt, elapsedTime, this.state.weather);
    }

    // 5. Flora Animation (subtle wind sway)
    const isThunderstorm = this.state.weather === 'thunderstorm';
    const windStrength = isThunderstorm ? 2.5 : this.state.weather === 'rain' ? 1.4 : 0.8;
    this.floraInstances.forEach((inst) => {
      inst.updateAnimation(elapsedTime, windStrength);
    });

    // 6. Camera smooth exponential damping transition
    if (this.isTransitioningCamera) {
      const lambda = 4.2;
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.targetCamPos.x, lambda, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this.targetCamPos.y, lambda, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this.targetCamPos.z, lambda, dt);

      this.controls.target.x = THREE.MathUtils.damp(this.controls.target.x, this.targetControlsTarget.x, lambda, dt);
      this.controls.target.y = THREE.MathUtils.damp(this.controls.target.y, this.targetControlsTarget.y, lambda, dt);
      this.controls.target.z = THREE.MathUtils.damp(this.controls.target.z, this.targetControlsTarget.z, lambda, dt);

      if (this.camera.position.distanceTo(this.targetCamPos) < 0.05) {
        this.isTransitioningCamera = false;
      }
    }

    this.controls.update();

    // 7. Microclimate simulation tick (every 1 second)
    this.simulationAccumulator += dt;
    if (this.simulationAccumulator >= 1.0) {
      this.simulationAccumulator = 0;
      this.simulateMicroclimate();
    }

    // 8. Render
    this.renderer.render(this.scene, this.camera);
  };

  private simulateMicroclimate() {
    // Rain slowly increases soil moisture and humidity
    if (this.state.weather === 'rain' || this.state.weather === 'thunderstorm') {
      this.state.soilMoisture = Math.min(100, this.state.soilMoisture + 0.8);
      this.state.humidity = Math.min(100, this.state.humidity + 1.2);
    } else if (this.state.weather === 'sunny') {
      // Sun dries soil slightly and warms temperature
      this.state.soilMoisture = Math.max(20, this.state.soilMoisture - 0.15);
      this.state.humidity = Math.max(35, this.state.humidity - 0.25);
      this.state.temperature = Math.min(29, this.state.temperature + 0.05);
    } else if (this.state.weather === 'solstice') {
      this.state.temperature = Math.max(16, this.state.temperature - 0.1);
    }

    // Vessel condensation update
    if (this.vessel) {
      this.vessel.updateMode(this.state.glassMode, this.state.glassClarity, this.state.humidity);
    }

    this.callbacks.onStateTick(
      Math.round(this.state.soilMoisture),
      Math.round(this.state.humidity),
      Math.round(this.state.temperature * 10) / 10
    );
  }

  public dispose() {
    this.stop();
    this.unbindEvents();

    if (this.substrate) this.substrate.dispose();
    if (this.vessel) this.vessel.dispose();
    if (this.lighting) this.lighting.dispose();
    if (this.weatherSystem) this.weatherSystem.dispose();

    this.floraInstances.forEach((inst) => inst.dispose());
    this.floraInstances.clear();

    this.controls.dispose();
    this.renderer.dispose();

    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
