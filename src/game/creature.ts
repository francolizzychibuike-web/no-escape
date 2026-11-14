/**
 * NO ESCAPE - Horror AI Creature ("The Stalker" & "The Warden")
 * Composite procedural monster mesh with state machine (Patrol, Alert, Chase, Attack)
 */

import * as THREE from 'three';
import { EnemyDef } from './types';
import { sound } from './audio';

export class CreatureAI {
  public group: THREE.Group;
  public def: EnemyDef;
  public state: 'patrol' | 'alert' | 'chase' | 'attack' = 'patrol';

  public position: THREE.Vector3 = new THREE.Vector3();
  private patrolIndex: number = 0;
  private alertTimer: number = 0;
  private attackCooldown: number = 0;
  private stepDistance: number = 0;

  // Visual parts
  private eyeLeft: THREE.Mesh;
  private eyeRight: THREE.Mesh;
  private head: THREE.Mesh;
  private armLeftGroup: THREE.Group;
  private armRightGroup: THREE.Group;
  private legLeftGroup: THREE.Group;
  private legRightGroup: THREE.Group;
  private spineRidges: THREE.Mesh[] = [];

  constructor(def: EnemyDef) {
    this.def = def;
    this.position.set(...def.position);
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    const isWarden = def.type === 'warden';
    const scale = isWarden ? 1.6 : 1.1;

    // Materials
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: isWarden ? 0x1f0e0c : 0x121417,
      roughness: 0.85,
      metalness: 0.2,
    });
    const spineMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d0c0c,
      roughness: 0.5,
      metalness: 0.6,
    });
    const eyeMaterial = new THREE.MeshBasicMaterial({
      color: isWarden ? 0xff2200 : 0xff0044,
    });

    // 1. Torso (hunched, skeletal)
    const torsoGeo = new THREE.BoxGeometry(0.45 * scale, 0.8 * scale, 0.35 * scale);
    const torso = new THREE.Mesh(torsoGeo, skinMaterial);
    torso.position.y = 1.1 * scale;
    torso.castShadow = true;
    this.group.add(torso);

    // Spine spikes
    for (let i = 0; i < 4; i++) {
      const spikeGeo = new THREE.ConeGeometry(0.06 * scale, 0.25 * scale, 6);
      spikeGeo.rotateX(-Math.PI / 3);
      const spike = new THREE.Mesh(spikeGeo, spineMaterial);
      spike.position.set(0, (0.3 - i * 0.18) * scale, -0.22 * scale);
      torso.add(spike);
      this.spineRidges.push(spike);
    }

    // 2. Head & Glowing Red Eyes
    const headGeo = new THREE.BoxGeometry(0.32 * scale, 0.35 * scale, 0.35 * scale);
    this.head = new THREE.Mesh(headGeo, skinMaterial);
    this.head.position.set(0, 0.5 * scale, 0.12 * scale);
    torso.add(this.head);

    const eyeGeo = new THREE.SphereGeometry(0.045 * scale, 8, 8);
    this.eyeLeft = new THREE.Mesh(eyeGeo, eyeMaterial);
    this.eyeLeft.position.set(-0.1 * scale, 0.05 * scale, 0.18 * scale);
    this.head.add(this.eyeLeft);

    this.eyeRight = new THREE.Mesh(eyeGeo, eyeMaterial);
    this.eyeRight.position.set(0.1 * scale, 0.05 * scale, 0.18 * scale);
    this.head.add(this.eyeRight);

    // 3. Long Elongated Arms with Claws
    const armGeo = new THREE.CylinderGeometry(0.06 * scale, 0.04 * scale, 0.9 * scale, 8);

    this.armLeftGroup = new THREE.Group();
    this.armLeftGroup.position.set(-0.32 * scale, 0.25 * scale, 0);
    const armL = new THREE.Mesh(armGeo, skinMaterial);
    armL.position.y = -0.45 * scale;
    armL.castShadow = true;
    this.armLeftGroup.add(armL);
    torso.add(this.armLeftGroup);

    this.armRightGroup = new THREE.Group();
    this.armRightGroup.position.set(0.32 * scale, 0.25 * scale, 0);
    const armR = new THREE.Mesh(armGeo, skinMaterial);
    armR.position.y = -0.45 * scale;
    armR.castShadow = true;
    this.armRightGroup.add(armR);
    torso.add(this.armRightGroup);

    // 4. Digitigrade Legs
    const legGeo = new THREE.CylinderGeometry(0.07 * scale, 0.05 * scale, 0.9 * scale, 8);

    this.legLeftGroup = new THREE.Group();
    this.legLeftGroup.position.set(-0.18 * scale, 0.7 * scale, 0);
    const legL = new THREE.Mesh(legGeo, skinMaterial);
    legL.position.y = -0.45 * scale;
    legL.castShadow = true;
    this.legLeftGroup.add(legL);
    this.group.add(this.legLeftGroup);

    this.legRightGroup = new THREE.Group();
    this.legRightGroup.position.set(0.18 * scale, 0.7 * scale, 0);
    const legR = new THREE.Mesh(legGeo, skinMaterial);
    legR.position.y = -0.45 * scale;
    legR.castShadow = true;
    this.legRightGroup.add(legR);
    this.group.add(this.legRightGroup);
  }

  public resetState() {
    this.position.set(...this.def.position);
    this.group.position.copy(this.position);
    this.state = 'patrol';
    this.patrolIndex = 0;
    this.alertTimer = 0;
    this.attackCooldown = 0;
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    isPlayerSprinting: boolean,
    isFlashlightOn: boolean,
    speedMultiplier: number
  ): { hitPlayer: boolean; damage: number } {
    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.position);
    const distToPlayer = toPlayer.length();

    // Line of sight and hearing checks
    // If player is sprinting, hearing radius is doubled!
    const hearingDist = isPlayerSprinting ? this.def.detectionRadius * 1.5 : this.def.detectionRadius * 0.7;
    const canSee = distToPlayer < this.def.detectionRadius || (isFlashlightOn && distToPlayer < this.def.detectionRadius * 1.8);
    const canHear = distToPlayer < hearingDist;

    let hit = false;
    let targetPos: THREE.Vector3 | null = null;
    let moveSpeed = this.def.speed * speedMultiplier;

    // State machine
    if (this.state === 'patrol') {
      if (canSee || canHear) {
        this.state = 'alert';
        this.alertTimer = 0.6;
        sound.playHeartbeat();
      } else if (this.def.patrolPath && this.def.patrolPath.length > 0) {
        const p = this.def.patrolPath[this.patrolIndex];
        targetPos = new THREE.Vector3(...p);
        if (targetPos.distanceTo(this.position) < 0.5) {
          this.patrolIndex = (this.patrolIndex + 1) % this.def.patrolPath.length;
        }
        moveSpeed *= 0.6;
      }
    } else if (this.state === 'alert') {
      this.alertTimer -= dt;
      this.group.lookAt(playerPos.x, this.position.y, playerPos.z);
      // Head twitching
      this.head.rotation.y = (Math.random() - 0.5) * 0.4;
      if (this.alertTimer <= 0) {
        this.state = 'chase';
        sound.playJumpscare();
      }
    } else if (this.state === 'chase') {
      targetPos = playerPos;
      moveSpeed *= 1.4;

      if (distToPlayer > this.def.detectionRadius * 2.2) {
        // Lost track
        this.state = 'patrol';
      } else if (distToPlayer < 1.3 && this.attackCooldown <= 0) {
        // Close range attack
        this.state = 'attack';
        this.attackCooldown = 1.0;
        hit = true;
      }
    } else if (this.state === 'attack') {
      this.attackCooldown -= dt;
      if (this.attackCooldown <= 0) {
        this.state = 'chase';
      }
    }

    // Movement execution
    if (targetPos && this.state !== 'alert') {
      const dir = new THREE.Vector3().subVectors(targetPos, this.position);
      dir.y = 0;
      if (dir.lengthSq() > 0.01) {
        dir.normalize();
        this.position.addScaledVector(dir, moveSpeed * dt);
        this.group.position.copy(this.position);
        this.group.lookAt(targetPos.x, this.position.y, targetPos.z);

        // Limb animation
        this.stepDistance += moveSpeed * dt * 5;
        const swing = Math.sin(this.stepDistance);
        this.legLeftGroup.rotation.x = swing * 0.6;
        this.legRightGroup.rotation.x = -swing * 0.6;
        this.armLeftGroup.rotation.x = -swing * 0.8;
        this.armRightGroup.rotation.x = swing * 0.8;
      }
    }

    return { hitPlayer: hit, damage: this.def.damage };
  }
}
