/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { VesselType, GlassMode } from '../../types/terrarium';
import { getWoodGrainTexture, getCondensationTexture } from './textures';

export interface VesselBundle {
  group: THREE.Group;
  updateMode: (mode: GlassMode, clarity: number, humidity: number) => void;
  updateAnimation: (dt: number, mode: GlassMode) => void;
  dispose: () => void;
}

export function createVessel(type: VesselType, radius: number = 3.6, height: number = 7.0): VesselBundle {
  const group = new THREE.Group();
  group.name = `Vessel_${type}`;

  const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];

  // PBR Physical Glass Material with transmission
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 0.94,
    opacity: 1.0,
    transparent: true,
    roughness: 0.03,
    metalness: 0.05,
    ior: 1.52,
    thickness: 1.2,
    specularIntensity: 1.0,
    specularColor: new THREE.Color(0xffffff),
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    depthWrite: false, // Prevents depth occlusion artifacts on interior contents
    side: THREE.DoubleSide,
  });
  disposables.push(glassMaterial);

  // Antiqued Architectural Brass Material
  const brassMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4a559,
    metalness: 0.88,
    roughness: 0.28,
  });
  disposables.push(brassMaterial);

  // Darkened solder joint material
  const solderMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a3b2c,
    metalness: 0.7,
    roughness: 0.4,
  });
  disposables.push(solderMaterial);

  // Condensation overlay material
  const condensationMat = new THREE.MeshStandardMaterial({
    map: getCondensationTexture(),
    alphaMap: getCondensationTexture(),
    transparent: true,
    opacity: 0.0,
    roughness: 0.1,
    metalness: 0.0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  disposables.push(condensationMat);

  // Dynamic animated components
  const movableLid = new THREE.Group();
  movableLid.name = 'Movable_Lid';
  group.add(movableLid);

  const staticBase = new THREE.Group();
  staticBase.name = 'Static_Base';
  group.add(staticBase);

  const frontWallGroup = new THREE.Group();
  frontWallGroup.name = 'Front_Wall';
  group.add(frontWallGroup);

  let targetLidY = 0;
  let currentLidY = 0;
  let targetLidRot = 0;
  let currentLidRot = 0;

  if (type === 'wardian') {
    // ----------------------------------------------------
    // WARDIAN CASE (Victorian Architectural Glass Conservatory)
    // ----------------------------------------------------
    const w = radius * 1.5;
    const d = radius * 1.5;
    const wallH = height * 0.52;
    const roofH = height * 0.38;

    // 1. Ornate Cast Bronze Tray Base
    const baseBoxGeo = new THREE.BoxGeometry(w + 0.3, 0.4, d + 0.3);
    disposables.push(baseBoxGeo);
    const baseBoxMesh = new THREE.Mesh(baseBoxGeo, brassMaterial);
    baseBoxMesh.position.y = 0.2;
    baseBoxMesh.castShadow = true;
    baseBoxMesh.receiveShadow = true;
    staticBase.add(baseBoxMesh);

    // 4 Ornate claw / ball feet
    const footOffsets = [
      [-w / 2 - 0.05, -d / 2 - 0.05],
      [w / 2 + 0.05, -d / 2 - 0.05],
      [-w / 2 - 0.05, d / 2 + 0.05],
      [w / 2 + 0.05, d / 2 + 0.05],
    ];
    footOffsets.forEach(([fx, fz]) => {
      const footGeo = new THREE.SphereGeometry(0.22, 12, 12);
      disposables.push(footGeo);
      const footMesh = new THREE.Mesh(footGeo, brassMaterial);
      footMesh.position.set(fx, 0.08, fz);
      footMesh.castShadow = true;
      staticBase.add(footMesh);
    });

    // 2. Corner brass vertical structural pillars
    const pillarGeo = new THREE.CylinderGeometry(0.06, 0.06, wallH, 8);
    disposables.push(pillarGeo);
    const corners = [
      [-w / 2, -d / 2],
      [w / 2, -d / 2],
      [-w / 2, d / 2],
      [w / 2, d / 2],
    ];
    corners.forEach(([cx, cz]) => {
      const pMesh = new THREE.Mesh(pillarGeo, brassMaterial);
      pMesh.position.set(cx, 0.4 + wallH / 2, cz);
      pMesh.castShadow = true;
      staticBase.add(pMesh);
    });

    // Horizontal brass top collar perimeter
    const collarGeoX = new THREE.BoxGeometry(w + 0.08, 0.1, 0.08);
    const collarGeoZ = new THREE.BoxGeometry(0.08, 0.1, d + 0.08);
    disposables.push(collarGeoX, collarGeoZ);
    const cx1 = new THREE.Mesh(collarGeoX, brassMaterial);
    cx1.position.set(0, 0.4 + wallH, -d / 2);
    const cx2 = new THREE.Mesh(collarGeoX, brassMaterial);
    cx2.position.set(0, 0.4 + wallH, d / 2);
    const cz1 = new THREE.Mesh(collarGeoZ, brassMaterial);
    cz1.position.set(-w / 2, 0.4 + wallH, 0);
    const cz2 = new THREE.Mesh(collarGeoZ, brassMaterial);
    cz2.position.set(w / 2, 0.4 + wallH, 0);
    staticBase.add(cx1, cx2, cz1, cz2);

    // 3. Lower Glass Panes
    // Back glass
    const backGlassGeo = new THREE.PlaneGeometry(w - 0.05, wallH - 0.05);
    disposables.push(backGlassGeo);
    const backGlass = new THREE.Mesh(backGlassGeo, glassMaterial);
    backGlass.position.set(0, 0.4 + wallH / 2, -d / 2);
    staticBase.add(backGlass);

    // Left glass
    const sideGlassGeo = new THREE.PlaneGeometry(d - 0.05, wallH - 0.05);
    disposables.push(sideGlassGeo);
    const leftGlass = new THREE.Mesh(sideGlassGeo, glassMaterial);
    leftGlass.rotation.y = Math.PI / 2;
    leftGlass.position.set(-w / 2, 0.4 + wallH / 2, 0);
    const rightGlass = new THREE.Mesh(sideGlassGeo, glassMaterial);
    rightGlass.rotation.y = -Math.PI / 2;
    rightGlass.position.set(w / 2, 0.4 + wallH / 2, 0);
    staticBase.add(leftGlass, rightGlass);

    // Front glass (detachable in cross-section mode!)
    const frontGlass = new THREE.Mesh(backGlassGeo, glassMaterial);
    frontGlass.position.set(0, 0.4 + wallH / 2, d / 2);
    frontWallGroup.add(frontGlass);

    // Inner condensation planes on walls
    const condSideGeo = new THREE.PlaneGeometry(d - 0.1, wallH - 0.1);
    disposables.push(condSideGeo);
    const condBack = new THREE.Mesh(backGlassGeo, condensationMat);
    condBack.position.set(0, 0.4 + wallH / 2, -d / 2 + 0.02);
    staticBase.add(condBack);

    // 4. Pitched Gabled Roof (Movable Lid)
    // Left & Right roof glass slopes
    const slopeLen = Math.sqrt((w / 2) ** 2 + roofH ** 2);
    const slopeAngle = Math.atan2(roofH, w / 2);

    const roofGlassGeo = new THREE.PlaneGeometry(slopeLen, d - 0.05);
    disposables.push(roofGlassGeo);

    const roofLeft = new THREE.Mesh(roofGlassGeo, glassMaterial);
    roofLeft.rotation.z = slopeAngle;
    roofLeft.rotation.y = Math.PI / 2;
    roofLeft.position.set(-w / 4, roofH / 2, 0);
    movableLid.add(roofLeft);

    const roofRight = new THREE.Mesh(roofGlassGeo, glassMaterial);
    roofRight.rotation.z = -slopeAngle;
    roofRight.rotation.y = Math.PI / 2;
    roofRight.position.set(w / 4, roofH / 2, 0);
    movableLid.add(roofRight);

    // Triangular Gable Ends (Front & Back)
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-w / 2, 0);
    gableShape.lineTo(0, roofH);
    gableShape.lineTo(w / 2, 0);
    gableShape.closePath();

    const gableGeo = new THREE.ShapeGeometry(gableShape);
    disposables.push(gableGeo);
    const gableBack = new THREE.Mesh(gableGeo, glassMaterial);
    gableBack.position.set(0, 0, -d / 2);
    const gableFront = new THREE.Mesh(gableGeo, glassMaterial);
    gableFront.position.set(0, 0, d / 2);
    movableLid.add(gableBack, gableFront);

    // Brass roof cresting & ridge spine
    const ridgeGeo = new THREE.CylinderGeometry(0.06, 0.06, d + 0.1, 8);
    disposables.push(ridgeGeo);
    const ridgeMesh = new THREE.Mesh(ridgeGeo, brassMaterial);
    ridgeMesh.rotation.x = Math.PI / 2;
    ridgeMesh.position.set(0, roofH, 0);
    movableLid.add(ridgeMesh);

    // Decorative brass finial spikes along the roof crest
    for (let f = -d / 2 + 0.3; f <= d / 2 - 0.3; f += 0.6) {
      const finialGeo = new THREE.ConeGeometry(0.05, 0.22, 6);
      disposables.push(finialGeo);
      const finialMesh = new THREE.Mesh(finialGeo, brassMaterial);
      finialMesh.position.set(0, roofH + 0.11, f);
      movableLid.add(finialMesh);
    }

    // Place movable lid at correct rest elevation
    movableLid.position.y = 0.4 + wallH;

  } else if (type === 'bell_jar') {
    // ----------------------------------------------------
    // BELL JAR / CLOCHE (Turned Walnut Base & Blown Crystal Dome)
    // ----------------------------------------------------
    const baseR = radius * 1.08;
    const baseH = 0.6;
    const domeR = radius * 0.95;
    const domeH = height * 0.75;

    // 1. Turned Walnut Base (Multi-stepped lathe pedestal)
    const lathePoints: THREE.Vector2[] = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(baseR, 0),
      new THREE.Vector2(baseR, 0.15),
      new THREE.Vector2(baseR * 0.96, 0.25),
      new THREE.Vector2(baseR * 0.98, 0.35),
      new THREE.Vector2(baseR * 0.92, 0.45),
      new THREE.Vector2(domeR + 0.12, 0.45),
      new THREE.Vector2(domeR + 0.12, 0.6), // outer rim of bell slot
      new THREE.Vector2(domeR - 0.08, 0.6), // inner rim
      new THREE.Vector2(domeR - 0.08, 0.52), // bottom of resting groove
      new THREE.Vector2(0, 0.52), // inner soil floor level
    ];

    const latheGeo = new THREE.LatheGeometry(lathePoints, 48);
    disposables.push(latheGeo);
    const walnutMat = new THREE.MeshStandardMaterial({
      map: getWoodGrainTexture(),
      roughness: 0.45,
      metalness: 0.05,
      color: 0x4a2e18,
    });
    disposables.push(walnutMat);
    const latheMesh = new THREE.Mesh(latheGeo, walnutMat);
    latheMesh.castShadow = true;
    latheMesh.receiveShadow = true;
    staticBase.add(latheMesh);

    // Velvet baize underside rim
    const ringGeo = new THREE.RingGeometry(baseR * 0.7, baseR * 0.98, 36);
    disposables.push(ringGeo);
    const velvetMat = new THREE.MeshBasicMaterial({ color: 0x18331d });
    disposables.push(velvetMat);
    const ringMesh = new THREE.Mesh(ringGeo, velvetMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.005;
    staticBase.add(ringMesh);

    // 2. Blown Glass Bell Dome (Cylinder + Hemisphere Dome Top)
    const domeCylinderH = domeH * 0.6;
    const domeCylinderGeo = new THREE.CylinderGeometry(domeR, domeR, domeCylinderH, 48, 1, true);
    disposables.push(domeCylinderGeo);
    const domeCylinder = new THREE.Mesh(domeCylinderGeo, glassMaterial);
    domeCylinder.position.y = domeCylinderH / 2;
    movableLid.add(domeCylinder);

    // Rounded crown hemisphere
    const capGeo = new THREE.SphereGeometry(domeR, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    disposables.push(capGeo);
    const capMesh = new THREE.Mesh(capGeo, glassMaterial);
    capMesh.position.y = domeCylinderH;
    movableLid.add(capMesh);

    // Teardrop / spherical finial handle knob on top of bell jar
    const knobStalkGeo = new THREE.CylinderGeometry(0.12, 0.22, 0.4, 24);
    const knobBallGeo = new THREE.SphereGeometry(0.35, 24, 24);
    disposables.push(knobStalkGeo, knobBallGeo);
    const knobStalk = new THREE.Mesh(knobStalkGeo, glassMaterial);
    knobStalk.position.y = domeCylinderH + domeR + 0.15;
    const knobBall = new THREE.Mesh(knobBallGeo, glassMaterial);
    knobBall.position.y = domeCylinderH + domeR + 0.45;
    movableLid.add(knobStalk, knobBall);

    // Inner condensation cylinder
    const condDomeGeo = new THREE.CylinderGeometry(domeR - 0.03, domeR - 0.03, domeCylinderH * 0.9, 36, 1, true);
    disposables.push(condDomeGeo);
    const condDomeMesh = new THREE.Mesh(condDomeGeo, condensationMat);
    condDomeMesh.position.y = domeCylinderH * 0.45;
    movableLid.add(condDomeMesh);

    // Resting level for bell jar dome
    movableLid.position.y = 0.52;

  } else {
    // ----------------------------------------------------
    // GEOMETRIC PRISM (Faceted Dodecahedral Terrarium with Brass Seams)
    // ----------------------------------------------------
    const prismR = radius * 1.05;
    const prismH = height * 0.8;
    const sides = 6;

    // 1. Spun Brass Base Collar
    const basePlateGeo = new THREE.CylinderGeometry(prismR * 1.05, prismR * 1.08, 0.35, sides);
    disposables.push(basePlateGeo);
    const basePlate = new THREE.Mesh(basePlateGeo, brassMaterial);
    basePlate.position.y = 0.18;
    basePlate.castShadow = true;
    staticBase.add(basePlate);

    // 2. Faceted Glass Prism Body
    const bodyH = prismH * 0.65;
    const prismBodyGeo = new THREE.CylinderGeometry(prismR * 0.9, prismR, bodyH, sides, 1, true);
    disposables.push(prismBodyGeo);
    const prismBody = new THREE.Mesh(prismBodyGeo, glassMaterial);
    prismBody.position.y = 0.35 + bodyH / 2;
    staticBase.add(prismBody);

    // Pyramidal Faceted Top Lid
    const lidH = prismH * 0.35;
    const roofConeGeo = new THREE.ConeGeometry(prismR * 0.9, lidH, sides, 1, true);
    disposables.push(roofConeGeo);
    const roofCone = new THREE.Mesh(roofConeGeo, glassMaterial);
    roofCone.position.y = lidH / 2;
    movableLid.add(roofCone);

    // Brass apex finial ring
    const finialTorusGeo = new THREE.TorusGeometry(0.24, 0.05, 12, 24);
    disposables.push(finialTorusGeo);
    const finialTorus = new THREE.Mesh(finialTorusGeo, brassMaterial);
    finialTorus.rotation.x = Math.PI / 2;
    finialTorus.position.y = lidH + 0.15;
    movableLid.add(finialTorus);

    // Brass edge ribbing along vertices
    for (let s = 0; s < sides; s++) {
      const angle = (s / sides) * Math.PI * 2;
      const x1 = Math.cos(angle) * prismR;
      const z1 = Math.sin(angle) * prismR;
      const x2 = Math.cos(angle) * (prismR * 0.9);
      const z2 = Math.sin(angle) * (prismR * 0.9);

      // Vertical side rib
      const edgeCurve = new THREE.LineCurve3(
        new THREE.Vector3(x1, 0.35, z1),
        new THREE.Vector3(x2, 0.35 + bodyH, z2)
      );
      const ribGeo = new THREE.TubeGeometry(edgeCurve, 4, 0.05, 6, false);
      disposables.push(ribGeo);
      const ribMesh = new THREE.Mesh(ribGeo, solderMaterial);
      staticBase.add(ribMesh);

      // Roof slope rib
      const roofCurve = new THREE.LineCurve3(
        new THREE.Vector3(x2, 0, z2),
        new THREE.Vector3(0, lidH, 0)
      );
      const roofRibGeo = new THREE.TubeGeometry(roofCurve, 4, 0.05, 6, false);
      disposables.push(roofRibGeo);
      const roofRibMesh = new THREE.Mesh(roofRibGeo, solderMaterial);
      movableLid.add(roofRibMesh);
    }

    movableLid.position.y = 0.35 + bodyH;
  }

  // Animation and state updater
  const updateMode = (mode: GlassMode, clarity: number, humidity: number) => {
    // 1. Glass visibility and transmission
    if (mode === 'wireframe') {
      glassMaterial.wireframe = true;
      glassMaterial.transmission = 0.0;
      glassMaterial.opacity = 0.4;
      frontWallGroup.visible = true;
    } else {
      glassMaterial.wireframe = false;
      glassMaterial.transmission = THREE.MathUtils.lerp(0.82, 0.98, clarity);
      glassMaterial.roughness = THREE.MathUtils.lerp(0.18, 0.02, clarity);
      glassMaterial.opacity = 1.0;

      if (mode === 'cross_section') {
        frontWallGroup.visible = false;
      } else {
        frontWallGroup.visible = true;
      }
    }

    // 2. Condensation visibility based on terrarium humidity
    const condensationThreshold = 55;
    if (humidity > condensationThreshold) {
      const condFactor = (humidity - condensationThreshold) / (100 - condensationThreshold);
      condensationMat.opacity = Math.min(0.85, condFactor * 0.9);
      condensationMat.visible = true;
    } else {
      condensationMat.opacity = 0.0;
      condensationMat.visible = false;
    }

    // 3. Lid target displacement
    if (mode === 'lid_opened') {
      targetLidY = height * 0.45; // Smoothly hovers open in exploded view
      targetLidRot = 0.2;
    } else {
      targetLidY = 0.0;
      targetLidRot = 0.0;
    }
  };

  const initialLidBaseY = movableLid.position.y;

  const updateAnimation = (dt: number, _mode: GlassMode) => {
    // Exponential damping for silky smooth lid opening / closing
    const lambda = 4.5;
    currentLidY = THREE.MathUtils.damp(currentLidY, targetLidY, lambda, dt);
    currentLidRot = THREE.MathUtils.damp(currentLidRot, targetLidRot, lambda, dt);

    movableLid.position.y = initialLidBaseY + currentLidY;
    movableLid.rotation.x = currentLidRot;
  };

  const dispose = () => {
    disposables.forEach((item) => {
      if ('dispose' in item) item.dispose();
    });
  };

  return {
    group,
    updateMode,
    updateAnimation,
    dispose,
  };
}
