/**
 * NO ESCAPE - 3D Third-Person Character Controller & Composite Rig
 * Assembled procedural character (11 distinct parts) with walk/sprint/jump/crouch/death kinematics.
 */

import * as THREE from 'three';

export class CharacterController {
  public group: THREE.Group;
  public flashlight: THREE.SpotLight;
  public flashlightTarget: THREE.Object3D;
  private flashlightVolumetricCone: THREE.Mesh;

  // Body parts for procedural animation
  private torso: THREE.Mesh;
  private helmet: THREE.Mesh;
  private visor: THREE.Mesh;
  private backpack: THREE.Mesh;
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;
  private contactShadow: THREE.Mesh;

  // Animation & physics state
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public rotationY: number = 0;
  public targetRotationY: number = 0;

  public isGrounded: boolean = true;
  public isCrouching: boolean = false;
  public isSprinting: boolean = false;
  public isDead: boolean = false;

  private walkDistance: number = 0;
  private squashFactor: number = 1.0;
  private deathProgress: number = 0;

  constructor() {
    this.group = new THREE.Group();

    // PBR Materials
    const suitMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d4449,
      roughness: 0.7,
      metalness: 0.15,
    });
    const armorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e2226,
      roughness: 0.5,
      metalness: 0.4,
    });
    const visorMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x22d3ee,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.2,
      clearcoat: 1.0,
    });
    const packMaterial = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.6,
      metalness: 0.3,
    });
    const limbMaterial = new THREE.MeshStandardMaterial({
      color: 0x272e33,
      roughness: 0.75,
      metalness: 0.1,
    });

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.5, 0.6, 0.3);
    this.torso = new THREE.Mesh(torsoGeo, suitMaterial);
    this.torso.position.y = 0.95;
    this.torso.castShadow = true;
    this.group.add(this.torso);

    // Armor vest plate
    const vestGeo = new THREE.BoxGeometry(0.52, 0.45, 0.34);
    const vest = new THREE.Mesh(vestGeo, armorMaterial);
    vest.position.set(0, 0.02, 0);
    this.torso.add(vest);

    // 2. Helmet & Visor
    const helmetGeo = new THREE.SphereGeometry(0.22, 16, 16);
    this.helmet = new THREE.Mesh(helmetGeo, armorMaterial);
    this.helmet.position.set(0, 0.42, 0);
    this.helmet.castShadow = true;
    this.torso.add(this.helmet);

    const visorGeo = new THREE.BoxGeometry(0.24, 0.12, 0.1);
    this.visor = new THREE.Mesh(visorGeo, visorMaterial);
    this.visor.position.set(0, 0.02, 0.17);
    this.helmet.add(this.visor);

    // 3. Survival Backpack
    const packGeo = new THREE.BoxGeometry(0.38, 0.48, 0.22);
    this.backpack = new THREE.Mesh(packGeo, packMaterial);
    this.backpack.position.set(0, 0, -0.22);
    this.backpack.castShadow = true;
    this.torso.add(this.backpack);

    // 4. Arms
    const armGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.5, 12);

    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.34, 0.2, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, limbMaterial);
    leftArmMesh.position.y = -0.25;
    leftArmMesh.castShadow = true;
    this.leftArmGroup.add(leftArmMesh);
    this.torso.add(this.leftArmGroup);

    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.34, 0.2, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, limbMaterial);
    rightArmMesh.position.y = -0.25;
    rightArmMesh.castShadow = true;
    this.rightArmGroup.add(rightArmMesh);
    this.torso.add(this.rightArmGroup);

    // 5. Legs
    const legGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.65, 12);

    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.16, 0.65, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, limbMaterial);
    leftLegMesh.position.y = -0.32;
    leftLegMesh.castShadow = true;
    this.leftLegGroup.add(leftLegMesh);
    this.group.add(this.leftLegGroup);

    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.16, 0.65, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, limbMaterial);
    rightLegMesh.position.y = -0.32;
    rightLegMesh.castShadow = true;
    this.rightLegGroup.add(rightLegMesh);
    this.group.add(this.rightLegGroup);

    // 6. Tactical Flashlight
    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0, 0.9, 10);
    this.group.add(this.flashlightTarget);

    this.flashlight = new THREE.SpotLight(0xfff7e6, 4.5, 24, Math.PI / 6, 0.45, 1.2);
    this.flashlight.position.set(0.22, 1.15, 0.15);
    this.flashlight.target = this.flashlightTarget;
    this.flashlight.castShadow = true;
    this.flashlight.shadow.mapSize.width = 1024;
    this.flashlight.shadow.mapSize.height = 1024;
    this.flashlight.shadow.bias = -0.001;
    this.group.add(this.flashlight);

    // Volumetric cone effect
    const coneGeo = new THREE.ConeGeometry(2.0, 10, 16, 1, true);
    coneGeo.rotateX(-Math.PI / 2);
    coneGeo.translate(0, 0, 5);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfff3d1,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.flashlightVolumetricCone = new THREE.Mesh(coneGeo, coneMat);
    this.flashlightVolumetricCone.position.set(0.22, 1.15, 0.15);
    this.group.add(this.flashlightVolumetricCone);

    // 7. Ground Contact Shadow Disc
    const shadowGeo = new THREE.CircleGeometry(0.38, 16);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadow.position.y = 0.02;
    this.group.add(this.contactShadow);
  }

  public setFlashlight(on: boolean) {
    this.flashlight.visible = on;
    this.flashlightVolumetricCone.visible = on;
  }

  public triggerJumpSquash() {
    this.squashFactor = 1.25;
  }

  public triggerLandSquash() {
    this.squashFactor = 0.75;
  }

  public resetState(spawnPos: [number, number, number]) {
    this.position.set(...spawnPos);
    this.velocity.set(0, 0, 0);
    this.rotationY = 0;
    this.targetRotationY = 0;
    this.isDead = false;
    this.deathProgress = 0;
    this.group.position.copy(this.position);
    this.group.rotation.set(0, 0, 0);
    this.torso.rotation.set(0, 0, 0);
    this.torso.position.y = 0.95;
    this.leftArmGroup.rotation.set(0, 0, 0);
    this.rightArmGroup.rotation.set(0, 0, 0);
    this.leftLegGroup.rotation.set(0, 0, 0);
    this.rightLegGroup.rotation.set(0, 0, 0);
    this.group.scale.set(1, 1, 1);
  }

  public update(dt: number, movedDist: number) {
    // Smooth rotation towards target
    const diff = THREE.MathUtils.euclideanModulo(this.targetRotationY - this.rotationY + Math.PI, Math.PI * 2) - Math.PI;
    this.rotationY += diff * Math.min(1, dt * 15);
    this.group.rotation.y = this.rotationY;

    // Smooth squash restoration
    this.squashFactor = THREE.MathUtils.damp(this.squashFactor, 1.0, 10, dt);

    if (this.isDead) {
      this.deathProgress = Math.min(1, this.deathProgress + dt * 2.5);
      // Ragdoll crumble
      this.group.rotation.x = THREE.MathUtils.damp(this.group.rotation.x, -Math.PI / 2, 8, dt);
      this.torso.position.y = THREE.MathUtils.damp(this.torso.position.y, 0.25, 8, dt);
      this.leftLegGroup.rotation.x = THREE.MathUtils.damp(this.leftLegGroup.rotation.x, 0.6, 8, dt);
      this.rightLegGroup.rotation.x = THREE.MathUtils.damp(this.rightLegGroup.rotation.x, -0.4, 8, dt);
      return;
    }

    // Crouch height adjustment
    const targetTorsoY = this.isCrouching ? 0.65 : 0.95;
    this.torso.position.y = THREE.MathUtils.damp(this.torso.position.y, targetTorsoY, 12, dt);

    // Apply scale for squash-and-stretch
    const crouchScaleY = this.isCrouching ? 0.75 : 1.0;
    const currentScaleY = crouchScaleY * this.squashFactor;
    const currentScaleXZ = 1.0 / Math.sqrt(Math.max(0.1, currentScaleY));
    this.group.scale.set(currentScaleXZ, currentScaleY, currentScaleXZ);

    // Gait-synchronized limb animation
    if (this.isGrounded && movedDist > 0.001) {
      this.walkDistance += movedDist * (this.isSprinting ? 5.5 : 4.0);
      const swing = Math.sin(this.walkDistance);
      const swingAmp = this.isSprinting ? 0.65 : 0.45;

      this.leftLegGroup.rotation.x = swing * swingAmp;
      this.rightLegGroup.rotation.x = -swing * swingAmp;

      this.leftArmGroup.rotation.x = -swing * swingAmp * 0.7;
      this.rightArmGroup.rotation.x = swing * swingAmp * 0.7;

      // Subtle torso bob
      this.torso.position.y = targetTorsoY + Math.abs(Math.sin(this.walkDistance * 2)) * 0.04;
    } else if (this.isGrounded) {
      // Idle breathing
      const idle = Math.sin(Date.now() * 0.003) * 0.015;
      this.torso.position.y = targetTorsoY + idle;
      this.leftLegGroup.rotation.x = THREE.MathUtils.damp(this.leftLegGroup.rotation.x, 0, 10, dt);
      this.rightLegGroup.rotation.x = THREE.MathUtils.damp(this.rightLegGroup.rotation.x, 0, 10, dt);
      this.leftArmGroup.rotation.x = THREE.MathUtils.damp(this.leftArmGroup.rotation.x, 0, 10, dt);
      this.rightArmGroup.rotation.x = THREE.MathUtils.damp(this.rightArmGroup.rotation.x, 0, 10, dt);
    } else {
      // In-air jump pose
      this.leftLegGroup.rotation.x = THREE.MathUtils.damp(this.leftLegGroup.rotation.x, 0.4, 8, dt);
      this.rightLegGroup.rotation.x = THREE.MathUtils.damp(this.rightLegGroup.rotation.x, -0.2, 8, dt);
      this.leftArmGroup.rotation.x = THREE.MathUtils.damp(this.leftArmGroup.rotation.x, -0.6, 8, dt);
      this.rightArmGroup.rotation.x = THREE.MathUtils.damp(this.rightArmGroup.rotation.x, -0.6, 8, dt);
    }

    this.group.position.copy(this.position);
  }
}
