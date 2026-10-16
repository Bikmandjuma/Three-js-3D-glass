/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { WeatherType } from '../types/terrarium';
import { getStarfieldTexture } from './procedural/textures';

export interface LightingRigBundle {
  group: THREE.Group;
  update: (timeOfDay: number, weather: WeatherType) => void;
  getHorizonColor: () => THREE.Color;
  dispose: () => void;
}

export function setupLighting(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer
): LightingRigBundle {
  const group = new THREE.Group();
  group.name = 'Lighting_Rig';

  // 1. Mandatory Studio Environment Reflection (RoomEnvironment + PMREMGenerator)
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const roomEnv = new RoomEnvironment();
  const envTexture = pmremGenerator.fromScene(roomEnv, 0.04).texture;
  scene.environment = envTexture;
  pmremGenerator.dispose();
  roomEnv.dispose();

  // 2. Warm Sun / Cool Moon Directional Key Light
  const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 30;
  const d = 6.0;
  keyLight.shadow.camera.left = -d;
  keyLight.shadow.camera.right = d;
  keyLight.shadow.camera.top = d;
  keyLight.shadow.camera.bottom = -d;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.02;
  group.add(keyLight);

  // 3. Cool Ambient Hemisphere Fill Light (sky / ground contrast)
  const hemiLight = new THREE.HemisphereLight(0x7da4d4, 0x221c16, 0.65);
  group.add(hemiLight);

  // 4. Subtle Studio Rim Light for glass outline separation
  const rimLight = new THREE.DirectionalLight(0xaad0ff, 0.45);
  rimLight.position.set(-8, 5, -8);
  group.add(rimLight);

  // 5. Celestial Atmospheric Sky Dome
  const skyGeo = new THREE.SphereGeometry(28, 32, 24);
  const skyMat = new THREE.MeshBasicMaterial({
    map: getStarfieldTexture(),
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.95,
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  group.add(skyMesh);

  // Sun / Moon visual sphere in distance
  const celestialGeo = new THREE.SphereGeometry(0.8, 16, 16);
  const celestialMat = new THREE.MeshBasicMaterial({ color: 0xfff6cf });
  const celestialMesh = new THREE.Mesh(celestialGeo, celestialMat);
  group.add(celestialMesh);

  // Fog setup matching horizon color
  scene.fog = new THREE.FogExp2(0x131720, 0.035);

  const horizonColor = new THREE.Color();
  const skyTopColor = new THREE.Color();

  const update = (timeOfDay: number, weather: WeatherType) => {
    // Convert 24h to sun elevation angle (0 at 6h, 1 at 12h, 0 at 18h, -1 at 24h)
    const sunProgress = ((timeOfDay - 6) / 24) * Math.PI * 2;
    const sunElevation = Math.sin(sunProgress);
    const sunAzimuth = Math.cos(sunProgress);

    const isDay = sunElevation > -0.05;

    // Light position tracking celestial arc
    const lightDist = 14.0;
    const lx = Math.cos(sunProgress) * lightDist;
    const ly = Math.max(0.2, Math.abs(sunElevation) * lightDist + 1.0);
    const lz = Math.sin(sunProgress * 0.8) * 8.0;

    keyLight.position.set(lx, ly, lz);
    celestialMesh.position.set(lx * 1.5, ly * 1.5, lz * 1.5);

    // Weather impact modifiers
    let weatherDim = 1.0;
    if (weather === 'thunderstorm') weatherDim = 0.25;
    else if (weather === 'rain') weatherDim = 0.6;
    else if (weather === 'mist') weatherDim = 0.75;
    else if (weather === 'solstice') weatherDim = 0.85;

    if (isDay) {
      // Daytime transition (Dawn -> Noon -> Golden Hour -> Sunset)
      if (timeOfDay < 9) {
        // Dawn: Warm peach/amber
        const t = (timeOfDay - 6) / 3;
        keyLight.color.setRGB(1.0, 0.65 + t * 0.3, 0.45 + t * 0.45);
        keyLight.intensity = (0.9 + t * 1.0) * weatherDim;
        hemiLight.color.setHex(0xe8a87c);
        hemiLight.groundColor.setHex(0x382218);
        celestialMat.color.setHex(0xffaa5e);
        horizonColor.setRGB(0.28, 0.18, 0.14);
        skyTopColor.setRGB(0.12, 0.16, 0.26);
      } else if (timeOfDay < 16.5) {
        // Midday: Crisp warm daylight
        keyLight.color.setRGB(1.0, 0.96, 0.9);
        keyLight.intensity = 2.0 * weatherDim;
        hemiLight.color.setHex(0x9cc3ec);
        hemiLight.groundColor.setHex(0x2d241c);
        celestialMat.color.setHex(0xfffae8);
        horizonColor.setRGB(0.18, 0.24, 0.32);
        skyTopColor.setRGB(0.1, 0.18, 0.35);
      } else {
        // Golden Hour / Sunset (16.5 to 19.5)
        const t = Math.min(1.0, (timeOfDay - 16.5) / 3.0);
        keyLight.color.setRGB(1.0, 0.55 - t * 0.25, 0.28 - t * 0.15);
        keyLight.intensity = (1.8 - t * 1.1) * weatherDim;
        hemiLight.color.setHex(0xd97241);
        hemiLight.groundColor.setHex(0x261410);
        celestialMat.color.setHex(0xff6e3b);
        horizonColor.setRGB(0.25, 0.12, 0.15);
        skyTopColor.setRGB(0.14, 0.08, 0.22);
      }
    } else {
      // Nighttime / Moonlit (Twilight to Midnight to Pre-dawn)
      keyLight.color.setRGB(0.35, 0.55, 0.95); // Pale silver moonlight
      keyLight.intensity = 0.45 * weatherDim;
      hemiLight.color.setHex(0x283b63);
      hemiLight.groundColor.setHex(0x0e131d);
      celestialMat.color.setHex(0xd0e6ff); // Silver moon
      horizonColor.setRGB(0.05, 0.07, 0.12);
      skyTopColor.setRGB(0.02, 0.04, 0.08);
    }

    // Special stormy horizon tint
    if (weather === 'thunderstorm') {
      horizonColor.setRGB(0.08, 0.09, 0.11);
    } else if (weather === 'mist') {
      horizonColor.lerp(new THREE.Color(0.22, 0.26, 0.3), 0.5);
    } else if (weather === 'solstice') {
      horizonColor.lerp(new THREE.Color(0.2, 0.26, 0.35), 0.4);
    }

    // Update scene fog
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.copy(horizonColor);
      scene.fog.density = weather === 'mist' ? 0.075 : weather === 'thunderstorm' ? 0.045 : 0.032;
    }

    // Sky mesh tint
    skyMat.color.copy(horizonColor).multiplyScalar(2.2);
  };

  const getHorizonColor = () => horizonColor;

  const dispose = () => {
    envTexture.dispose();
    skyGeo.dispose();
    skyMat.dispose();
    celestialGeo.dispose();
    celestialMat.dispose();
  };

  return {
    group,
    update,
    getHorizonColor,
    dispose,
  };
}
