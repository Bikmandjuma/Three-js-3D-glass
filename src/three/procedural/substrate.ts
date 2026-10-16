/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { getSoilTexture, getSoilBumpTexture, getWoodGrainTexture } from './textures';

export interface SubstrateBundle {
  group: THREE.Group;
  terrainMesh: THREE.Mesh;
  getHeightAt: (x: number, z: number) => number;
  dispose: () => void;
}

/**
 * Creates the multi-tier geological substrate (pebbles, charcoal, soil, rocks, driftwood)
 * and returns the terrain mesh and height query function.
 */
export function createSubstrate(radius: number = 3.6, depth: number = 1.2): SubstrateBundle {
  const group = new THREE.Group();
  group.name = 'Substrate_Assembly';

  const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];

  // 1. Soft radial contact shadow on floor plane beneath the terrarium
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 256;
  const sCtx = shadowCanvas.getContext('2d')!;
  const sGrad = sCtx.createRadialGradient(128, 128, 0, 128, 128, 120);
  sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
  sGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
  sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 256, 256);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  disposables.push(shadowTex);

  const shadowGeo = new THREE.PlaneGeometry(radius * 2.8, radius * 2.8);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });
  disposables.push(shadowGeo, shadowMat);
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = -0.02; // flush with ground
  group.add(shadowMesh);

  // 2. Base drainage river pebble layer (bottom cylinder)
  const pebbleGeo = new THREE.CylinderGeometry(radius * 0.94, radius * 0.96, depth * 0.35, 36, 1);
  const pebbleMat = new THREE.MeshStandardMaterial({
    color: 0x8a7f72,
    roughness: 0.6,
    metalness: 0.1,
    bumpMap: getSoilBumpTexture(),
    bumpScale: 0.08,
  });
  disposables.push(pebbleGeo, pebbleMat);
  const pebbleMesh = new THREE.Mesh(pebbleGeo, pebbleMat);
  pebbleMesh.position.y = depth * 0.175;
  pebbleMesh.castShadow = true;
  pebbleMesh.receiveShadow = true;
  group.add(pebbleMesh);

  // Instanced smooth river stones visible at bottom perimeter
  const stoneCount = 48;
  const stoneUnitGeo = new THREE.DodecahedronGeometry(0.24, 1);
  const stoneUnitMat = new THREE.MeshStandardMaterial({
    roughness: 0.45,
    metalness: 0.05,
    color: 0x6e6358,
  });
  disposables.push(stoneUnitGeo, stoneUnitMat);
  const instancedStones = new THREE.InstancedMesh(stoneUnitGeo, stoneUnitMat, stoneCount);
  instancedStones.castShadow = true;
  instancedStones.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const stoneColors = [
    new THREE.Color(0x5a5046),
    new THREE.Color(0x7d6f5f),
    new THREE.Color(0x9a8d7c),
    new THREE.Color(0x454846),
    new THREE.Color(0xb2a188),
  ];

  for (let i = 0; i < stoneCount; i++) {
    const angle = (i / stoneCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.1;
    const r = (radius * 0.88) + (Math.random() - 0.5) * 0.3;
    const px = Math.cos(angle) * r;
    const pz = Math.sin(angle) * r;
    const py = 0.14 + Math.random() * 0.12;

    dummy.position.set(px, py, pz);
    dummy.scale.set(
      0.8 + Math.random() * 0.5,
      0.5 + Math.random() * 0.4,
      0.8 + Math.random() * 0.5
    );
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    dummy.updateMatrix();

    instancedStones.setMatrixAt(i, dummy.matrix);
    instancedStones.setColorAt(i, stoneColors[i % stoneColors.length]);
  }
  instancedStones.instanceMatrix.needsUpdate = true;
  if (instancedStones.instanceColor) instancedStones.instanceColor.needsUpdate = true;
  group.add(instancedStones);

  // 3. Activated charcoal filtration stratum (thin dark band)
  const charcoalGeo = new THREE.CylinderGeometry(radius * 0.95, radius * 0.94, depth * 0.18, 36, 1);
  const charcoalMat = new THREE.MeshStandardMaterial({
    color: 0x1f1f21,
    roughness: 0.95,
    metalness: 0.05,
    bumpMap: getSoilBumpTexture(),
    bumpScale: 0.15,
  });
  disposables.push(charcoalGeo, charcoalMat);
  const charcoalMesh = new THREE.Mesh(charcoalGeo, charcoalMat);
  charcoalMesh.position.y = depth * 0.35 + depth * 0.09;
  charcoalMesh.receiveShadow = true;
  group.add(charcoalMesh);

  // 4. Undulating potting soil & living mossy loam surface
  const soilSegments = 48;
  const soilGeo = new THREE.CylinderGeometry(
    radius * 0.98,
    radius * 0.95,
    depth * 0.55,
    soilSegments,
    12
  );

  // Deform top vertices to create natural rolling landscape mounds
  const pos = soilGeo.attributes.position;
  const topY = depth * 0.55 * 0.5;

  // Heightfield calculation function
  const getHeightDisplacement = (x: number, z: number): number => {
    // Gentle natural mound in back-left, slight depression in center for mini pool/driftwood
    const d1 = Math.sin(x * 0.8 + 0.5) * Math.cos(z * 0.8) * 0.28;
    const d2 = Math.sin(x * 1.8 - 0.7) * Math.sin(z * 1.5 + 0.3) * 0.12;
    const mound = Math.exp(-((x + 1.2) ** 2 + (z + 0.8) ** 2) / 3.2) * 0.45;
    const rimFade = Math.max(0, 1 - (x * x + z * z) / (radius * radius * 0.95));
    return (d1 + d2 + mound) * rimFade;
  };

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (Math.abs(y - topY) < 0.05) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = getHeightDisplacement(x, z);
      pos.setY(i, y + h);
    }
  }
  soilGeo.computeVertexNormals();

  const soilMat = new THREE.MeshStandardMaterial({
    map: getSoilTexture(),
    bumpMap: getSoilBumpTexture(),
    bumpScale: 0.14,
    roughness: 0.88,
    metalness: 0.02,
  });
  disposables.push(soilGeo, soilMat);
  const soilMesh = new THREE.Mesh(soilGeo, soilMat);
  const baseSoilCenterY = depth * 0.35 + depth * 0.18 + depth * 0.275;
  soilMesh.position.y = baseSoilCenterY;
  soilMesh.receiveShadow = true;
  group.add(soilMesh);

  // 5. Natural Weathered Driftwood Root arching across landscape
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.8, baseSoilCenterY + 0.3, -0.6),
    new THREE.Vector3(-0.9, baseSoilCenterY + 0.65, 0.2),
    new THREE.Vector3(0.1, baseSoilCenterY + 0.48, 0.4),
    new THREE.Vector3(1.1, baseSoilCenterY + 0.25, -0.2),
    new THREE.Vector3(1.9, baseSoilCenterY + 0.1, -0.9),
  ]);
  const woodGeo = new THREE.TubeGeometry(curve, 32, 0.14, 8, false);
  const woodMat = new THREE.MeshStandardMaterial({
    map: getWoodGrainTexture(),
    roughness: 0.75,
    metalness: 0.05,
    color: 0x6e4a2d,
  });
  disposables.push(woodGeo, woodMat);
  const driftwoodMesh = new THREE.Mesh(woodGeo, woodMat);
  driftwoodMesh.castShadow = true;
  driftwoodMesh.receiveShadow = true;
  group.add(driftwoodMesh);

  // Driftwood branch offshoot
  const branchCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.4, baseSoilCenterY + 0.58, 0.3),
    new THREE.Vector3(-0.2, baseSoilCenterY + 0.72, 0.8),
    new THREE.Vector3(0.3, baseSoilCenterY + 0.4, 1.2),
  ]);
  const branchGeo = new THREE.TubeGeometry(branchCurve, 18, 0.08, 6, false);
  disposables.push(branchGeo);
  const branchMesh = new THREE.Mesh(branchGeo, woodMat);
  branchMesh.castShadow = true;
  group.add(branchMesh);

  // 6. Sculpted Slate Rock Outcropping
  const rockGroup = new THREE.Group();
  rockGroup.name = 'Slate_Outcropping';
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x474a4f,
    roughness: 0.8,
    metalness: 0.1,
    bumpMap: getSoilBumpTexture(),
    bumpScale: 0.05,
  });
  disposables.push(rockMat);

  const rockSlices = [
    { pos: [-1.4, baseSoilCenterY + 0.25, -1.2], scale: [1.2, 0.35, 0.9], rot: [0.15, 0.3, -0.1] },
    { pos: [-1.2, baseSoilCenterY + 0.45, -1.3], scale: [0.95, 0.28, 0.75], rot: [0.1, 0.4, -0.15] },
    { pos: [-1.0, baseSoilCenterY + 0.62, -1.4], scale: [0.65, 0.2, 0.5], rot: [0.08, 0.5, -0.2] },
    { pos: [1.3, baseSoilCenterY + 0.18, 1.1], scale: [0.8, 0.25, 0.7], rot: [-0.1, -0.4, 0.15] },
  ];

  rockSlices.forEach((cfg) => {
    const rGeo = new THREE.DodecahedronGeometry(0.7, 1);
    disposables.push(rGeo);
    const rMesh = new THREE.Mesh(rGeo, rockMat);
    rMesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    rMesh.scale.set(cfg.scale[0], cfg.scale[1], cfg.scale[2]);
    rMesh.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
    rMesh.castShadow = true;
    rMesh.receiveShadow = true;
    rockGroup.add(rMesh);
  });
  group.add(rockGroup);

  // 7. Miniature Translucent Quartz / Calcite Crystal Point Cluster
  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0xe0f7fa,
    transmission: 0.85,
    ior: 1.54,
    roughness: 0.12,
    metalness: 0.05,
    clearcoat: 0.8,
  });
  disposables.push(crystalMat);

  const crystalCluster = new THREE.Group();
  crystalCluster.position.set(1.4, baseSoilCenterY + 0.25, -0.8);
  for (let c = 0; c < 5; c++) {
    const height = 0.4 + Math.random() * 0.35;
    const cGeo = new THREE.ConeGeometry(0.08 + Math.random() * 0.04, height, 6);
    disposables.push(cGeo);
    const cMesh = new THREE.Mesh(cGeo, crystalMat);
    cMesh.position.set(
      (Math.random() - 0.5) * 0.25,
      height * 0.5,
      (Math.random() - 0.5) * 0.25
    );
    cMesh.rotation.set(
      (Math.random() - 0.5) * 0.35,
      Math.random() * Math.PI,
      (Math.random() - 0.5) * 0.35
    );
    cMesh.castShadow = true;
    crystalCluster.add(cMesh);
  }
  group.add(crystalCluster);

  // Height query function for planting flora flush on the soil
  const getHeightAt = (x: number, z: number): number => {
    const soilTopBase = baseSoilCenterY + depth * 0.55 * 0.5;
    return soilTopBase + getHeightDisplacement(x, z);
  };

  const dispose = () => {
    disposables.forEach((item) => {
      if ('dispose' in item) item.dispose();
    });
  };

  return {
    group,
    terrainMesh: soilMesh,
    getHeightAt,
    dispose,
  };
}
