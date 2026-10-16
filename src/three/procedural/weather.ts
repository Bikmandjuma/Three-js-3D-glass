/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { WeatherType } from '../../types/terrarium';

export interface WeatherSystemBundle {
  group: THREE.Group;
  update: (dt: number, elapsedTime: number, weather: WeatherType) => void;
  triggerMistSpritz: () => void;
  dispose: () => void;
}

export function createWeatherSystem(radius: number = 3.4, height: number = 6.5): WeatherSystemBundle {
  const group = new THREE.Group();
  group.name = 'Weather_Atmosphere_System';

  const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];

  // 1. Raindrop Particles (InstancedMesh of slender teardrop capsules)
  const rainCount = 180;
  const rainGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.35, 4);
  const rainMat = new THREE.MeshBasicMaterial({
    color: 0xc4e6ff,
    transparent: true,
    opacity: 0.65,
  });
  disposables.push(rainGeo, rainMat);
  const rainMesh = new THREE.InstancedMesh(rainGeo, rainMat, rainCount);
  rainMesh.visible = false;
  group.add(rainMesh);

  // Rain particle positions and velocities
  const rainPositions = new Float32Array(rainCount * 3);
  const rainSpeeds = new Float32Array(rainCount);
  for (let i = 0; i < rainCount; i++) {
    const r = Math.sqrt(Math.random()) * (radius * 0.85);
    const th = Math.random() * Math.PI * 2;
    rainPositions[i * 3] = Math.cos(th) * r;
    rainPositions[i * 3 + 1] = Math.random() * height + 1.0;
    rainPositions[i * 3 + 2] = Math.sin(th) * r;
    rainSpeeds[i] = 7.0 + Math.random() * 5.0;
  }

  // 2. Mist & Fog Cloud Puffs (Billowing soft sprites)
  const mistCount = 45;
  const mistGeo = new THREE.PlaneGeometry(1.4, 1.4);

  // Procedural soft radial puff texture
  const mistCanvas = document.createElement('canvas');
  mistCanvas.width = 128;
  mistCanvas.height = 128;
  const mCtx = mistCanvas.getContext('2d')!;
  const mGrad = mCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
  mGrad.addColorStop(0, 'rgba(235, 245, 255, 0.35)');
  mGrad.addColorStop(0.5, 'rgba(220, 235, 250, 0.15)');
  mGrad.addColorStop(1, 'rgba(220, 235, 250, 0)');
  mCtx.fillStyle = mGrad;
  mCtx.fillRect(0, 0, 128, 128);
  const mistTex = new THREE.CanvasTexture(mistCanvas);

  const mistMat = new THREE.MeshBasicMaterial({
    map: mistTex,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  disposables.push(mistGeo, mistMat, mistTex);

  const mistGroup = new THREE.Group();
  const mistData: { mesh: THREE.Mesh; seedX: number; seedZ: number; speed: number; rotSpeed: number }[] = [];

  for (let m = 0; m < mistCount; m++) {
    const mMesh = new THREE.Mesh(mistGeo, mistMat);
    const r = Math.random() * (radius * 0.8);
    const th = Math.random() * Math.PI * 2;
    const y = 1.0 + Math.random() * (height * 0.7);
    mMesh.position.set(Math.cos(th) * r, y, Math.sin(th) * r);
    mMesh.rotation.z = Math.random() * Math.PI * 2;
    mistGroup.add(mMesh);
    mistData.push({
      mesh: mMesh,
      seedX: (Math.random() - 0.5) * 0.8,
      seedZ: (Math.random() - 0.5) * 0.8,
      speed: 0.2 + Math.random() * 0.2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
    });
  }
  group.add(mistGroup);

  // 3. Fireflies (Bioluminescent wandering spheres with point lights)
  const fireflyCount = 28;
  const fireflyGeo = new THREE.SphereGeometry(0.045, 8, 8);
  const fireflyMat = new THREE.MeshBasicMaterial({
    color: 0x8fff4f,
  });
  disposables.push(fireflyGeo, fireflyMat);
  const fireflyMesh = new THREE.InstancedMesh(fireflyGeo, fireflyMat, fireflyCount);
  fireflyMesh.visible = false;
  group.add(fireflyMesh);

  // Firefly trajectory seeds
  const fireflySeeds: {
    baseX: number;
    baseY: number;
    baseZ: number;
    freqX: number;
    freqY: number;
    freqZ: number;
    phase: number;
  }[] = [];
  for (let f = 0; f < fireflyCount; f++) {
    const r = Math.random() * (radius * 0.7);
    const th = Math.random() * Math.PI * 2;
    fireflySeeds.push({
      baseX: Math.cos(th) * r,
      baseY: 1.2 + Math.random() * (height * 0.65),
      baseZ: Math.sin(th) * r,
      freqX: 0.5 + Math.random() * 0.8,
      freqY: 0.7 + Math.random() * 0.9,
      freqZ: 0.6 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
    });
  }

  // 4. Solstice Snowflakes (Gentle drifting crystals)
  const snowCount = 140;
  const snowGeo = new THREE.DodecahedronGeometry(0.04, 0);
  const snowMat = new THREE.MeshBasicMaterial({
    color: 0xf0f8ff,
    transparent: true,
    opacity: 0.8,
  });
  disposables.push(snowGeo, snowMat);
  const snowMesh = new THREE.InstancedMesh(snowGeo, snowMat, snowCount);
  snowMesh.visible = false;
  group.add(snowMesh);

  const snowPositions = new Float32Array(snowCount * 3);
  const snowWobbles = new Float32Array(snowCount);
  for (let s = 0; s < snowCount; s++) {
    const r = Math.sqrt(Math.random()) * (radius * 0.85);
    const th = Math.random() * Math.PI * 2;
    snowPositions[s * 3] = Math.cos(th) * r;
    snowPositions[s * 3 + 1] = Math.random() * height + 0.8;
    snowPositions[s * 3 + 2] = Math.sin(th) * r;
    snowWobbles[s] = Math.random() * Math.PI * 2;
  }

  // 5. Sun Motes / Dust Particles for clear day
  const moteCount = 60;
  const moteGeo = new THREE.SphereGeometry(0.02, 4, 4);
  const moteMat = new THREE.MeshBasicMaterial({
    color: 0xfff6cf,
    transparent: true,
    opacity: 0.5,
  });
  disposables.push(moteGeo, moteMat);
  const moteMesh = new THREE.InstancedMesh(moteGeo, moteMat, moteCount);
  group.add(moteMesh);

  const motePositions = new Float32Array(moteCount * 3);
  for (let m = 0; m < moteCount; m++) {
    const r = Math.random() * (radius * 0.8);
    const th = Math.random() * Math.PI * 2;
    motePositions[m * 3] = Math.cos(th) * r;
    motePositions[m * 3 + 1] = 1.0 + Math.random() * (height * 0.6);
    motePositions[m * 3 + 2] = Math.sin(th) * r;
  }

  // 6. Interactive Spritz Mist Spray Particles
  const spritzCount = 50;
  const spritzGeo = new THREE.SphereGeometry(0.03, 4, 4);
  const spritzMat = new THREE.MeshBasicMaterial({
    color: 0xdbf4ff,
    transparent: true,
    opacity: 0.0,
  });
  disposables.push(spritzGeo, spritzMat);
  const spritzMesh = new THREE.InstancedMesh(spritzGeo, spritzMat, spritzCount);
  group.add(spritzMesh);

  let spritzActive = false;
  let spritzTimer = 0;
  const spritzPos = new Float32Array(spritzCount * 3);
  const spritzVel = new Float32Array(spritzCount * 3);

  // Distant Lightning Flash Light for thunderstorm
  const lightningLight = new THREE.PointLight(0xbcd4ff, 0, 30, 2);
  lightningLight.position.set(0, height + 2, 0);
  group.add(lightningLight);

  let lightningTimer = 3.0;

  // Reusable dummy for matrix updates (zero per-frame allocation!)
  const _dummy = new THREE.Object3D();

  const triggerMistSpritz = () => {
    spritzActive = true;
    spritzTimer = 1.8;
    spritzMat.opacity = 0.85;

    for (let i = 0; i < spritzCount; i++) {
      // Emanate from nozzle near top
      spritzPos[i * 3] = (Math.random() - 0.5) * 0.5;
      spritzPos[i * 3 + 1] = height * 0.85;
      spritzPos[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.0;
      spritzVel[i * 3] = Math.cos(angle) * speed * 0.6;
      spritzVel[i * 3 + 1] = -speed * 1.5;
      spritzVel[i * 3 + 2] = Math.sin(angle) * speed * 0.6;
    }
  };

  const update = (dt: number, elapsedTime: number, weather: WeatherType) => {
    // A. Rain System (for 'rain' and 'thunderstorm')
    const isRaining = weather === 'rain' || weather === 'thunderstorm';
    rainMesh.visible = isRaining;

    if (isRaining) {
      const fallSpeedMult = weather === 'thunderstorm' ? 1.6 : 1.0;
      for (let i = 0; i < rainCount; i++) {
        rainPositions[i * 3 + 1] -= rainSpeeds[i] * fallSpeedMult * dt;
        if (rainPositions[i * 3 + 1] < 1.0) {
          rainPositions[i * 3 + 1] = height + Math.random() * 0.5;
        }

        _dummy.position.set(
          rainPositions[i * 3],
          rainPositions[i * 3 + 1],
          rainPositions[i * 3 + 2]
        );
        _dummy.rotation.set(0, 0, 0);
        _dummy.scale.set(1, weather === 'thunderstorm' ? 1.5 : 1, 1);
        _dummy.updateMatrix();
        rainMesh.setMatrixAt(i, _dummy.matrix);
      }
      rainMesh.instanceMatrix.needsUpdate = true;
    }

    // B. Mist System (for 'mist')
    const isMist = weather === 'mist';
    mistGroup.visible = isMist || mistMat.opacity > 0.01;
    const targetMistOpacity = isMist ? 0.35 : 0.0;
    mistMat.opacity = THREE.MathUtils.damp(mistMat.opacity, targetMistOpacity, 3.0, dt);

    if (mistMat.opacity > 0.01) {
      mistData.forEach((item, idx) => {
        item.mesh.rotation.z += item.rotSpeed * dt;
        const x = Math.sin(elapsedTime * item.speed + idx) * (radius * 0.7);
        const z = Math.cos(elapsedTime * item.speed + idx * 1.5) * (radius * 0.7);
        item.mesh.position.x = x;
        item.mesh.position.z = z;
      });
    }

    // C. Firefly System (for 'fireflies')
    const isFireflies = weather === 'fireflies';
    fireflyMesh.visible = isFireflies;

    if (isFireflies) {
      for (let f = 0; f < fireflyCount; f++) {
        const seed = fireflySeeds[f];
        const px = seed.baseX + Math.sin(elapsedTime * seed.freqX + seed.phase) * 0.8;
        const py = seed.baseY + Math.cos(elapsedTime * seed.freqY + seed.phase) * 0.5;
        const pz = seed.baseZ + Math.sin(elapsedTime * seed.freqZ + seed.phase * 1.3) * 0.8;

        // Pulsing glow scale
        const pulse = Math.sin(elapsedTime * 3.5 + seed.phase) * 0.35 + 0.8;

        _dummy.position.set(px, py, pz);
        _dummy.scale.set(pulse, pulse, pulse);
        _dummy.updateMatrix();
        fireflyMesh.setMatrixAt(f, _dummy.matrix);
      }
      fireflyMesh.instanceMatrix.needsUpdate = true;
    }

    // D. Solstice Snow
    const isSnow = weather === 'solstice';
    snowMesh.visible = isSnow;

    if (isSnow) {
      for (let s = 0; s < snowCount; s++) {
        snowPositions[s * 3 + 1] -= 0.8 * dt;
        snowWobbles[s] += dt * 2.0;

        if (snowPositions[s * 3 + 1] < 1.0) {
          snowPositions[s * 3 + 1] = height + Math.random() * 0.4;
        }

        const wx = Math.sin(snowWobbles[s]) * 0.15;
        const wz = Math.cos(snowWobbles[s]) * 0.15;

        _dummy.position.set(
          snowPositions[s * 3] + wx,
          snowPositions[s * 3 + 1],
          snowPositions[s * 3 + 2] + wz
        );
        _dummy.rotation.set(snowWobbles[s], snowWobbles[s] * 0.5, 0);
        _dummy.scale.set(1, 1, 1);
        _dummy.updateMatrix();
        snowMesh.setMatrixAt(s, _dummy.matrix);
      }
      snowMesh.instanceMatrix.needsUpdate = true;
    }

    // E. Sun motes (active during sunny day)
    const isSunny = weather === 'sunny';
    moteMesh.visible = isSunny;
    if (isSunny) {
      for (let m = 0; m < moteCount; m++) {
        const my = motePositions[m * 3 + 1] + Math.sin(elapsedTime * 0.5 + m) * 0.05;
        _dummy.position.set(
          motePositions[m * 3] + Math.cos(elapsedTime * 0.3 + m) * 0.05,
          my,
          motePositions[m * 3 + 2]
        );
        _dummy.scale.set(1, 1, 1);
        _dummy.updateMatrix();
        moteMesh.setMatrixAt(m, _dummy.matrix);
      }
      moteMesh.instanceMatrix.needsUpdate = true;
    }

    // F. Lightning during thunderstorm
    if (weather === 'thunderstorm') {
      lightningTimer -= dt;
      if (lightningTimer <= 0) {
        lightningLight.intensity = 4.5;
        lightningTimer = 3.5 + Math.random() * 5.0;
      } else {
        lightningLight.intensity = THREE.MathUtils.damp(lightningLight.intensity, 0, 12.0, dt);
      }
    } else {
      lightningLight.intensity = 0;
    }

    // G. Spritz animation
    if (spritzActive) {
      spritzTimer -= dt;
      spritzMat.opacity = Math.max(0, spritzTimer / 1.8 * 0.85);

      for (let i = 0; i < spritzCount; i++) {
        spritzPos[i * 3] += spritzVel[i * 3] * dt;
        spritzPos[i * 3 + 1] += spritzVel[i * 3 + 1] * dt;
        spritzPos[i * 3 + 2] += spritzVel[i * 3 + 2] * dt;

        _dummy.position.set(
          spritzPos[i * 3],
          spritzPos[i * 3 + 1],
          spritzPos[i * 3 + 2]
        );
        _dummy.scale.set(1, 1, 1);
        _dummy.updateMatrix();
        spritzMesh.setMatrixAt(i, _dummy.matrix);
      }
      spritzMesh.instanceMatrix.needsUpdate = true;

      if (spritzTimer <= 0) {
        spritzActive = false;
        spritzMat.opacity = 0;
      }
    }
  };

  const dispose = () => {
    disposables.forEach((item) => item.dispose());
  };

  return {
    group,
    update,
    triggerMistSpritz,
    dispose,
  };
}
