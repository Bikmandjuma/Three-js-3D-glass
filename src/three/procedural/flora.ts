/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { FloraSpeciesType, PlantSpecimenData } from '../../types/terrarium';
import { getLeafVeinTexture } from './textures';

export interface FloraInstance {
  data: PlantSpecimenData;
  group: THREE.Group;
  updateAnimation: (time: number, windStrength: number) => void;
  setEmissiveIntensity: (intensity: number) => void;
  dispose: () => void;
}

// Helper to create a spiral curve for fiddleheads
class SpiralCurve extends THREE.Curve<THREE.Vector3> {
  private turns: number;
  private radius: number;
  private height: number;

  constructor(turns: number = 2.5, radius: number = 0.35, height: number = 0.9) {
    super();
    this.turns = turns;
    this.radius = radius;
    this.height = height;
  }

  getPoint(t: number, optionalTarget = new THREE.Vector3()) {
    const angle = t * Math.PI * 2 * this.turns;
    const r = (1 - t) * this.radius;
    const x = Math.cos(angle) * r;
    const y = t * this.height + (1 - t) * 0.15;
    const z = Math.sin(angle) * r;
    return optionalTarget.set(x, y, z);
  }
}

/**
 * Procedural Maidenhair / Fiddlehead Fern (Adiantum capillus-veneris)
 * 3-12 parts: Root crown, spiral fiddlehead croziers, arching frond rachises, feather leaflets
 */
export function createFern(data: PlantSpecimenData): FloraInstance {
  const group = new THREE.Group();
  group.name = `Flora_Fern_${data.id}`;
  group.position.set(...data.position);
  group.rotation.y = data.rotationY;
  const s = data.scale * data.growthStage;
  group.scale.set(s, s, s);

  const disposables: (THREE.BufferGeometry | THREE.Material)[] = [];
  const emissiveMaterials: THREE.MeshStandardMaterial[] = [];
  const animatedFronds: THREE.Object3D[] = [];

  // 1. Root Crown (Base rhizome mound)
  const crownGeo = new THREE.SphereGeometry(0.22, 8, 8);
  const crownMat = new THREE.MeshStandardMaterial({
    color: 0x221a11,
    roughness: 0.9,
    metalness: 0.05,
  });
  disposables.push(crownGeo, crownMat);
  const crown = new THREE.Mesh(crownGeo, crownMat);
  crown.scale.set(1.2, 0.6, 1.2);
  crown.position.y = 0.08;
  group.add(crown);

  // 2. Spiral Fiddleheads (Young unfurling croziers)
  const spiralMat = new THREE.MeshStandardMaterial({
    color: 0x4e8a38,
    roughness: 0.45,
    metalness: 0.1,
  });
  disposables.push(spiralMat);

  for (let f = 0; f < 3; f++) {
    const spiralCurve = new SpiralCurve(2.2, 0.22, 0.7);
    const spiralGeo = new THREE.TubeGeometry(spiralCurve, 32, 0.045, 6, false);
    disposables.push(spiralGeo);
    const fiddlehead = new THREE.Mesh(spiralGeo, spiralMat);
    const angle = (f / 3) * Math.PI * 2 + 0.3;
    fiddlehead.rotation.y = angle;
    fiddlehead.rotation.z = 0.2;
    fiddlehead.position.set(Math.cos(angle) * 0.15, 0.05, Math.sin(angle) * 0.15);
    fiddlehead.castShadow = true;
    group.add(fiddlehead);
  }

  // 3. Arching Fronds with Paired Leaflets
  const frondCount = 7;
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x3aa74e,
    map: getLeafVeinTexture('#3aa74e'),
    roughness: 0.35,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  disposables.push(leafMat);

  // Leaflet prototype geometry
  const leafletShape = new THREE.Shape();
  leafletShape.moveTo(0, 0);
  leafletShape.quadraticCurveTo(0.12, 0.08, 0.16, 0.24);
  leafletShape.quadraticCurveTo(0.08, 0.36, 0, 0.42);
  leafletShape.quadraticCurveTo(-0.08, 0.36, -0.16, 0.24);
  leafletShape.quadraticCurveTo(-0.12, 0.08, 0, 0);
  const leafletGeo = new THREE.ShapeGeometry(leafletShape);
  disposables.push(leafletGeo);

  for (let i = 0; i < frondCount; i++) {
    const frondGroup = new THREE.Group();
    const angle = (i / frondCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const archRadius = 1.3 + (i % 3) * 0.25;
    const archHeight = 1.6 + (i % 2) * 0.3;

    // Rachis stem curve
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, archHeight * 0.5, 0.2),
      new THREE.Vector3(0, archHeight * 0.9, archRadius * 0.6),
      new THREE.Vector3(0, archHeight * 0.7, archRadius),
    ]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 20, 0.035, 6, false);
    disposables.push(stemGeo);
    const stemMesh = new THREE.Mesh(stemGeo, spiralMat);
    stemMesh.castShadow = true;
    frondGroup.add(stemMesh);

    // Leaflets along rachis
    const pairs = 8;
    for (let p = 2; p < pairs; p++) {
      const t = p / pairs;
      const point = stemCurve.getPoint(t);
      const tangent = stemCurve.getTangent(t);

      // Left leaflet
      const leftLeaf = new THREE.Mesh(leafletGeo, leafMat);
      leftLeaf.position.copy(point);
      leftLeaf.scale.set(0.65 * (1 - t * 0.3), 0.65 * (1 - t * 0.3), 0.65);
      leftLeaf.rotation.x = -Math.PI / 2 + 0.3;
      leftLeaf.rotation.z = Math.PI / 3;
      leftLeaf.position.x += 0.06;
      leftLeaf.castShadow = true;
      frondGroup.add(leftLeaf);

      // Right leaflet
      const rightLeaf = new THREE.Mesh(leafletGeo, leafMat);
      rightLeaf.position.copy(point);
      rightLeaf.scale.set(0.65 * (1 - t * 0.3), 0.65 * (1 - t * 0.3), 0.65);
      rightLeaf.rotation.x = -Math.PI / 2 + 0.3;
      rightLeaf.rotation.z = -Math.PI / 3;
      rightLeaf.position.x -= 0.06;
      rightLeaf.castShadow = true;
      frondGroup.add(rightLeaf);
    }

    frondGroup.rotation.y = angle;
    frondGroup.rotation.x = 0.25 + Math.random() * 0.15;
    group.add(frondGroup);
    animatedFronds.push(frondGroup);
  }

  // Hitbox for raycasting
  const hitGeo = new THREE.CylinderGeometry(1.4, 0.4, 2.2, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  disposables.push(hitGeo, hitMat);
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.position.y = 1.1;
  hitMesh.userData = { isFlora: true, specimenId: data.id };
  group.add(hitMesh);

  const updateAnimation = (time: number, windStrength: number) => {
    animatedFronds.forEach((frond, idx) => {
      const sway = Math.sin(time * 2.2 + idx * 1.3) * 0.05 * windStrength;
      frond.rotation.z = sway;
      frond.rotation.x += Math.cos(time * 1.8 + idx) * 0.015 * windStrength;
    });
  };

  const setEmissiveIntensity = (intensity: number) => {
    emissiveMaterials.forEach((m) => {
      m.emissiveIntensity = intensity;
    });
  };

  const dispose = () => {
    disposables.forEach((item) => item.dispose());
  };

  return {
    data,
    group,
    updateAnimation,
    setEmissiveIntensity,
    dispose,
  };
}

/**
 * Procedural Miniature Bonsai / Juniper Tree (Juniperus procumbens)
 * 3-12 parts: Gnarled trunk, surface roots, primary branches, 5 foliage canopy pads
 */
export function createBonsai(data: PlantSpecimenData): FloraInstance {
  const group = new THREE.Group();
  group.name = `Flora_Bonsai_${data.id}`;
  group.position.set(...data.position);
  group.rotation.y = data.rotationY;
  const s = data.scale * data.growthStage;
  group.scale.set(s, s, s);

  const disposables: (THREE.BufferGeometry | THREE.Material)[] = [];
  const animatedCanopies: THREE.Object3D[] = [];

  // 1. Gnarled S-curve Bonsai Trunk
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.2, 0.6, 0.1),
    new THREE.Vector3(-0.35, 1.3, -0.15),
    new THREE.Vector3(0.15, 1.9, 0.25),
    new THREE.Vector3(-0.1, 2.4, 0.1),
  ]);
  const trunkGeo = new THREE.TubeGeometry(trunkCurve, 32, 0.18, 8, false);
  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x543b2a,
    roughness: 0.85,
    metalness: 0.05,
  });
  disposables.push(trunkGeo, barkMat);
  const trunkMesh = new THREE.Mesh(trunkGeo, barkMat);
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;
  group.add(trunkMesh);

  // 2. Surface Buttress Roots clutching soil
  for (let r = 0; r < 4; r++) {
    const angle = (r / 4) * Math.PI * 2 + 0.4;
    const rootCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.2, 0),
      new THREE.Vector3(Math.cos(angle) * 0.35, 0.08, Math.sin(angle) * 0.35),
      new THREE.Vector3(Math.cos(angle) * 0.65, 0.0, Math.sin(angle) * 0.65),
    ]);
    const rootGeo = new THREE.TubeGeometry(rootCurve, 12, 0.08, 6, false);
    disposables.push(rootGeo);
    const rootMesh = new THREE.Mesh(rootGeo, barkMat);
    rootMesh.castShadow = true;
    group.add(rootMesh);
  }

  // 3. Side Branches and Tiered Cloud Foliage Pads
  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x27592e,
    roughness: 0.65,
    metalness: 0.05,
  });
  disposables.push(foliageMat);

  const branches = [
    { start: new THREE.Vector3(-0.3, 1.25, -0.1), end: new THREE.Vector3(-1.1, 1.5, -0.4), padScale: [1.2, 0.4, 0.9] },
    { start: new THREE.Vector3(0.15, 1.85, 0.2), end: new THREE.Vector3(1.0, 2.05, 0.5), padScale: [1.1, 0.35, 0.85] },
    { start: new THREE.Vector3(-0.05, 2.2, 0.1), end: new THREE.Vector3(-0.7, 2.5, 0.3), padScale: [0.9, 0.3, 0.75] },
    { start: new THREE.Vector3(0, 2.38, 0.1), end: new THREE.Vector3(0.2, 2.8, -0.1), padScale: [1.3, 0.45, 1.1] }, // Apex
  ];

  branches.forEach((b) => {
    // Branch limb
    const bCurve = new THREE.LineCurve3(b.start, b.end);
    const bGeo = new THREE.TubeGeometry(bCurve, 8, 0.09, 6, false);
    disposables.push(bGeo);
    const bMesh = new THREE.Mesh(bGeo, barkMat);
    bMesh.castShadow = true;
    group.add(bMesh);

    // Foliage Cloud Pad (Multi-dodecahedron cluster)
    const padGroup = new THREE.Group();
    padGroup.position.copy(b.end);

    for (let c = 0; c < 3; c++) {
      const cGeo = new THREE.DodecahedronGeometry(0.5, 1);
      disposables.push(cGeo);
      const cMesh = new THREE.Mesh(cGeo, foliageMat);
      cMesh.scale.set(b.padScale[0] * (0.8 + c * 0.15), b.padScale[1], b.padScale[2] * (0.8 + c * 0.15));
      cMesh.position.set((c - 1) * 0.2, (Math.random() - 0.5) * 0.1, (c - 1) * 0.15);
      cMesh.castShadow = true;
      padGroup.add(cMesh);
    }

    group.add(padGroup);
    animatedCanopies.push(padGroup);
  });

  // Hitbox
  const hitGeo = new THREE.CylinderGeometry(1.6, 0.8, 3.2, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  disposables.push(hitGeo, hitMat);
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.position.y = 1.6;
  hitMesh.userData = { isFlora: true, specimenId: data.id };
  group.add(hitMesh);

  const updateAnimation = (time: number, windStrength: number) => {
    animatedCanopies.forEach((canopy, i) => {
      canopy.position.y += Math.sin(time * 2.0 + i) * 0.002 * windStrength;
      canopy.rotation.z = Math.cos(time * 1.5 + i) * 0.02 * windStrength;
    });
  };

  const dispose = () => {
    disposables.forEach((item) => item.dispose());
  };

  return {
    data,
    group,
    updateAnimation,
    setEmissiveIntensity: () => {},
    dispose,
  };
}

/**
 * Procedural Echeveria Succulent Rosette (Echeveria elegans)
 * 3-12 parts: 4 concentric Fibonacci whorls of fleshy beveled petals, apical baby shoot
 */
export function createSucculent(data: PlantSpecimenData): FloraInstance {
  const group = new THREE.Group();
  group.name = `Flora_Succulent_${data.id}`;
  group.position.set(...data.position);
  group.rotation.y = data.rotationY;
  const s = data.scale * data.growthStage;
  group.scale.set(s, s, s);

  const disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  // Fleshy Petal Shape with rounded sides and sharp tip
  const petalShape = new THREE.Shape();
  petalShape.moveTo(0, 0);
  petalShape.quadraticCurveTo(0.2, 0.2, 0.25, 0.6);
  petalShape.quadraticCurveTo(0.2, 0.9, 0, 1.1); // Tip
  petalShape.quadraticCurveTo(-0.2, 0.9, -0.25, 0.6);
  petalShape.quadraticCurveTo(-0.2, 0.2, 0, 0);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 1,
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 3,
  };

  const petalGeo = new THREE.ExtrudeGeometry(petalShape, extrudeSettings);
  disposables.push(petalGeo);

  // Layered coloration: Base jade green, middle aqua, tip rosy-pink blush
  const petalMat = new THREE.MeshPhysicalMaterial({
    color: 0x48b087,
    roughness: 0.22,
    metalness: 0.05,
    clearcoat: 0.6,
    clearcoatRoughness: 0.15,
    transmission: 0.15, // fleshy translucence
    thickness: 0.4,
  });
  disposables.push(petalMat);

  // 4 Concentric whorls based on golden ratio angle
  const tiers = [
    { count: 12, radius: 0.75, scale: 1.0, pitch: 0.35, y: 0.1 },
    { count: 10, radius: 0.55, scale: 0.82, pitch: 0.55, y: 0.22 },
    { count: 7, radius: 0.35, scale: 0.64, pitch: 0.75, y: 0.34 },
    { count: 5, radius: 0.18, scale: 0.45, pitch: 0.95, y: 0.42 },
  ];

  tiers.forEach((tier) => {
    for (let p = 0; p < tier.count; p++) {
      const angle = (p / tier.count) * Math.PI * 2 + (tier.y * 3.5);
      const petalMesh = new THREE.Mesh(petalGeo, petalMat);

      petalMesh.scale.set(tier.scale, tier.scale, tier.scale);
      petalMesh.rotation.x = -Math.PI / 2 + tier.pitch;
      petalMesh.rotation.y = angle;
      petalMesh.rotation.z = Math.PI;

      const px = Math.cos(angle) * tier.radius;
      const pz = Math.sin(angle) * tier.radius;
      petalMesh.position.set(px, tier.y, pz);

      petalMesh.castShadow = true;
      petalMesh.receiveShadow = true;
      group.add(petalMesh);
    }
  });

  // Central rosette heart bud
  const centerGeo = new THREE.SphereGeometry(0.12, 12, 12);
  const centerMat = new THREE.MeshStandardMaterial({ color: 0x98d4b3, roughness: 0.3 });
  disposables.push(centerGeo, centerMat);
  const centerMesh = new THREE.Mesh(centerGeo, centerMat);
  centerMesh.position.y = 0.48;
  group.add(centerMesh);

  // Hitbox
  const hitGeo = new THREE.CylinderGeometry(1.0, 0.6, 0.8, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  disposables.push(hitGeo, hitMat);
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.position.y = 0.4;
  hitMesh.userData = { isFlora: true, specimenId: data.id };
  group.add(hitMesh);

  const dispose = () => {
    disposables.forEach((item) => item.dispose());
  };

  return {
    data,
    group,
    updateAnimation: () => {}, // succulents are rigid
    setEmissiveIntensity: () => {},
    dispose,
  };
}

/**
 * Procedural Carnivorous Pitcher Plant (Sarracenia purpurea)
 * 3-12 parts: 4 fluted trumpet pitchers, peristome nectar rims, hooded operculum flaps, digestive liquid sheen
 */
export function createPitcherPlant(data: PlantSpecimenData): FloraInstance {
  const group = new THREE.Group();
  group.name = `Flora_Pitcher_${data.id}`;
  group.position.set(...data.position);
  group.rotation.y = data.rotationY;
  const s = data.scale * data.growthStage;
  group.scale.set(s, s, s);

  const disposables: (THREE.BufferGeometry | THREE.Material)[] = [];
  const animatedPitchers: THREE.Object3D[] = [];

  const pitcherMat = new THREE.MeshStandardMaterial({
    color: 0x6e8738,
    roughness: 0.3,
    metalness: 0.05,
    bumpMap: getLeafVeinTexture('#a63a50'),
    bumpScale: 0.04,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x8f2d3a, // nectar-scented burgundy collar
    roughness: 0.2,
    metalness: 0.1,
  });
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: 0x1f3d2b,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.7,
  });
  disposables.push(pitcherMat, rimMat, liquidMat);

  const pitcherCount = 4;
  for (let i = 0; i < pitcherCount; i++) {
    const pGroup = new THREE.Group();
    const angle = (i / pitcherCount) * Math.PI * 2 + 0.3;
    const pHeight = 1.6 + (i % 2) * 0.4;

    // Pitcher flute profile curve
    const lathePoints: THREE.Vector2[] = [
      new THREE.Vector2(0.04, 0),
      new THREE.Vector2(0.08, pHeight * 0.2),
      new THREE.Vector2(0.16, pHeight * 0.5),
      new THREE.Vector2(0.28, pHeight * 0.8),
      new THREE.Vector2(0.35, pHeight),
    ];
    const tubeGeo = new THREE.LatheGeometry(lathePoints, 18);
    disposables.push(tubeGeo);
    const tubeMesh = new THREE.Mesh(tubeGeo, pitcherMat);
    tubeMesh.castShadow = true;
    pGroup.add(tubeMesh);

    // Flared Peristome Rim (Torus)
    const rimGeo = new THREE.TorusGeometry(0.35, 0.045, 8, 18);
    disposables.push(rimGeo);
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = pHeight;
    pGroup.add(rimMesh);

    // Digestive pool liquid surface
    const poolGeo = new THREE.CircleGeometry(0.18, 16);
    disposables.push(poolGeo);
    const poolMesh = new THREE.Mesh(poolGeo, liquidMat);
    poolMesh.rotation.x = -Math.PI / 2;
    poolMesh.position.y = pHeight * 0.45;
    pGroup.add(poolMesh);

    // Operculum (Overhanging Hood Leaflet to prevent rain flooding)
    const hoodShape = new THREE.Shape();
    hoodShape.moveTo(-0.35, 0);
    hoodShape.quadraticCurveTo(0, 0.4, 0.35, 0);
    hoodShape.quadraticCurveTo(0, 0.2, -0.35, 0);
    const hoodGeo = new THREE.ShapeGeometry(hoodShape);
    disposables.push(hoodGeo);
    const hoodMesh = new THREE.Mesh(hoodGeo, rimMat);
    hoodMesh.position.set(0, pHeight + 0.1, -0.2);
    hoodMesh.rotation.x = 0.6;
    pGroup.add(hoodMesh);

    // Lean outward naturally
    pGroup.rotation.y = angle;
    pGroup.rotation.z = 0.25;
    pGroup.position.set(Math.cos(angle) * 0.3, 0, Math.sin(angle) * 0.3);

    group.add(pGroup);
    animatedPitchers.push(pGroup);
  }

  // Hitbox
  const hitGeo = new THREE.CylinderGeometry(1.1, 0.5, 2.2, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  disposables.push(hitGeo, hitMat);
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.position.y = 1.1;
  hitMesh.userData = { isFlora: true, specimenId: data.id };
  group.add(hitMesh);

  const updateAnimation = (time: number, windStrength: number) => {
    animatedPitchers.forEach((p, idx) => {
      p.rotation.z = 0.25 + Math.sin(time * 2.0 + idx * 1.5) * 0.03 * windStrength;
    });
  };

  const dispose = () => {
    disposables.forEach((item) => item.dispose());
  };

  return {
    data,
    group,
    updateAnimation,
    setEmissiveIntensity: () => {},
    dispose,
  };
}

/**
 * Procedural Bioluminescent Fungal Cluster (Mycena chlorophos / Ghost Mushroom)
 * 3-12 parts: Curving stipes, parasol caps, underside gills, glowing emissive spore particles
 */
export function createBioMushroom(data: PlantSpecimenData): FloraInstance {
  const group = new THREE.Group();
  group.name = `Flora_BioMushroom_${data.id}`;
  group.position.set(...data.position);
  group.rotation.y = data.rotationY;
  const s = data.scale * data.growthStage;
  group.scale.set(s, s, s);

  const disposables: (THREE.BufferGeometry | THREE.Material)[] = [];
  const emissiveMats: THREE.MeshStandardMaterial[] = [];

  // Cap and stalk materials with neon cyan/emerald bioluminescent glow
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x3df0a0,
    emissive: 0x16d97c,
    emissiveIntensity: 0.8,
    roughness: 0.3,
    metalness: 0.1,
  });
  const stalkMat = new THREE.MeshStandardMaterial({
    color: 0xdfffe8,
    roughness: 0.6,
    metalness: 0.05,
    emissive: 0x0fa85b,
    emissiveIntensity: 0.35,
  });
  const gillMat = new THREE.MeshStandardMaterial({
    color: 0x18a362,
    emissive: 0x0fe37b,
    emissiveIntensity: 1.2,
    roughness: 0.4,
  });
  disposables.push(capMat, stalkMat, gillMat);
  emissiveMats.push(capMat, stalkMat, gillMat);

  const shroomConfigs = [
    { height: 1.1, capR: 0.42, offset: [0, 0], rot: [0.1, 0, -0.05] },
    { height: 0.85, capR: 0.34, offset: [0.28, 0.2], rot: [0.2, 0.5, 0.15] },
    { height: 0.65, capR: 0.26, offset: [-0.25, 0.18], rot: [-0.15, -0.3, -0.2] },
    { height: 0.45, capR: 0.2, offset: [0.12, -0.28], rot: [0.25, 1.2, 0.1] },
    { height: 0.35, capR: 0.16, offset: [-0.2, -0.15], rot: [-0.1, 2.0, -0.15] },
  ];

  shroomConfigs.forEach((cfg) => {
    const shroomGroup = new THREE.Group();
    shroomGroup.position.set(cfg.offset[0], 0, cfg.offset[1]);

    // Curving stalk
    const stalkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.04, cfg.height * 0.4, 0.02),
      new THREE.Vector3(0.08, cfg.height * 0.8, -0.02),
      new THREE.Vector3(0.1, cfg.height, 0),
    ]);
    const stalkGeo = new THREE.TubeGeometry(stalkCurve, 16, 0.045, 6, false);
    disposables.push(stalkGeo);
    const stalkMesh = new THREE.Mesh(stalkGeo, stalkMat);
    stalkMesh.castShadow = true;
    shroomGroup.add(stalkMesh);

    // Parasol Cap (Lathe geometry for bell contour)
    const capPoints: THREE.Vector2[] = [
      new THREE.Vector2(0, cfg.capR * 0.55),
      new THREE.Vector2(cfg.capR * 0.4, cfg.capR * 0.45),
      new THREE.Vector2(cfg.capR * 0.8, cfg.capR * 0.25),
      new THREE.Vector2(cfg.capR, 0),
      new THREE.Vector2(cfg.capR * 0.9, -0.05),
      new THREE.Vector2(0.05, 0),
    ];
    const capGeo = new THREE.LatheGeometry(capPoints, 18);
    disposables.push(capGeo);
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.set(0.1, cfg.height, 0);
    capMesh.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
    capMesh.castShadow = true;
    shroomGroup.add(capMesh);

    // Underside Gills Disc
    const gillGeo = new THREE.RingGeometry(0.05, cfg.capR * 0.9, 16);
    disposables.push(gillGeo);
    const gillMesh = new THREE.Mesh(gillGeo, gillMat);
    gillMesh.rotation.x = Math.PI / 2;
    gillMesh.position.set(0.1, cfg.height - 0.02, 0);
    shroomGroup.add(gillMesh);

    group.add(shroomGroup);
  });

  // Local PointLight for ambient night bioluminescence around the mushroom
  const sporeLight = new THREE.PointLight(0x2ef29b, 1.2, 3.5, 2.0);
  sporeLight.position.set(0, 0.8, 0);
  group.add(sporeLight);

  // Hitbox
  const hitGeo = new THREE.CylinderGeometry(0.8, 0.5, 1.4, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  disposables.push(hitGeo, hitMat);
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.position.y = 0.7;
  hitMesh.userData = { isFlora: true, specimenId: data.id };
  group.add(hitMesh);

  const updateAnimation = (time: number) => {
    // Bioluminescent gentle breathing pulse
    const pulse = Math.sin(time * 2.5) * 0.3 + 0.9;
    sporeLight.intensity = pulse * 1.5;
  };

  const setEmissiveIntensity = (intensity: number) => {
    emissiveMats.forEach((m) => {
      m.emissiveIntensity = intensity * 1.2;
    });
    sporeLight.intensity = intensity * 1.5;
  };

  const dispose = () => {
    disposables.forEach((item) => item.dispose());
  };

  return {
    data,
    group,
    updateAnimation,
    setEmissiveIntensity,
    dispose,
  };
}

/**
 * Procedural Cushion Moss (Dicranum scoparium / Velvet Moss)
 */
export function createCushionMoss(data: PlantSpecimenData): FloraInstance {
  const group = new THREE.Group();
  group.name = `Flora_Moss_${data.id}`;
  group.position.set(...data.position);
  group.rotation.y = data.rotationY;
  const s = data.scale * data.growthStage;
  group.scale.set(s, s, s);

  const disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  // Velvety hummock mound
  const moundGeo = new THREE.SphereGeometry(0.7, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const mossMat = new THREE.MeshStandardMaterial({
    color: 0x3b7d34,
    roughness: 0.92,
    metalness: 0.02,
  });
  disposables.push(moundGeo, mossMat);
  const moundMesh = new THREE.Mesh(moundGeo, mossMat);
  moundMesh.scale.set(1.4, 0.45, 1.1);
  moundMesh.receiveShadow = true;
  group.add(moundMesh);

  // Tiny spore stalks (pedicels)
  const stalkCount = 14;
  for (let i = 0; i < stalkCount; i++) {
    const sx = (Math.random() - 0.5) * 0.7;
    const sz = (Math.random() - 0.5) * 0.6;
    const sH = 0.2 + Math.random() * 0.15;
    const sGeo = new THREE.CylinderGeometry(0.012, 0.012, sH, 4);
    const sMat = new THREE.MeshStandardMaterial({ color: 0x82b84d, roughness: 0.6 });
    disposables.push(sGeo, sMat);
    const sMesh = new THREE.Mesh(sGeo, sMat);
    sMesh.position.set(sx, 0.2 + sH / 2, sz);
    group.add(sMesh);

    // Spore capsule bead
    const bGeo = new THREE.SphereGeometry(0.028, 6, 6);
    disposables.push(bGeo);
    const bMesh = new THREE.Mesh(bGeo, sMat);
    bMesh.position.set(sx, 0.2 + sH, sz);
    group.add(bMesh);
  }

  // Hitbox
  const hitGeo = new THREE.CylinderGeometry(0.9, 0.7, 0.5, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  disposables.push(hitGeo, hitMat);
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.position.y = 0.25;
  hitMesh.userData = { isFlora: true, specimenId: data.id };
  group.add(hitMesh);

  const dispose = () => {
    disposables.forEach((item) => item.dispose());
  };

  return {
    data,
    group,
    updateAnimation: () => {},
    setEmissiveIntensity: () => {},
    dispose,
  };
}

/**
 * Flora Factory mapping species to procedural generator
 */
export function createFloraInstance(data: PlantSpecimenData): FloraInstance {
  switch (data.species) {
    case 'fern':
      return createFern(data);
    case 'bonsai':
      return createBonsai(data);
    case 'succulent':
      return createSucculent(data);
    case 'pitcher':
      return createPitcherPlant(data);
    case 'biomushroom':
      return createBioMushroom(data);
    case 'cushion_moss':
      return createCushionMoss(data);
    default:
      return createFern(data);
  }
}
