/**
 * NO ESCAPE - 3D Horror Game Engine
 * Three.js PBR rendering pipeline, third-person camera with wall-pull-in, physics, traps, and audio sync.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LevelDef, GameSettings, PlayerStats, RunStats } from './types';
import { CharacterController } from './character';
import { CreatureAI } from './creature';
import { createTrap, TrapInstance } from './traps';
import { textures } from './textures';
import { sound } from './audio';
import { DIFFICULTY_MODIFIERS } from './rules';

// Pre-allocated scratch math helpers (Zero GC in loop)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _camDesired = new THREE.Vector3();
const _ray = new THREE.Raycaster();

export class GameEngine {
  private container: HTMLDivElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private isRunning: boolean = false;
  private lastTime: number = 0;

  // Game actors & systems
  public player!: CharacterController;
  private levelMeshes: THREE.Group = new THREE.Group();
  private trapInstances: TrapInstance[] = [];
  private enemies: CreatureAI[] = [];
  private keyMesh: THREE.Group | null = null;
  private checkpointMeshes: THREE.Group[] = [];
  private exitDoorMesh: THREE.Group | null = null;
  private environmentColliders: THREE.Box3[] = [];

  // Lighting
  private keyLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private ambientLight!: THREE.AmbientLight;

  // Camera orbit state
  public cameraPitch: number = 0.25; // radians
  public cameraYaw: number = 0; // radians
  private cameraDistance: number = 4.2;

  // Active runtime state
  public currentLevelDef!: LevelDef;
  public settings!: GameSettings;
  public stats: PlayerStats = {
    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    flashlightBattery: 100,
    maxBattery: 100,
    flashlightOn: true,
    isCrouching: false,
    isSprinting: false,
    isGrounded: true,
    hasKey: false,
    keysCount: 0,
    relicsFound: 0,
  };

  public runStats: RunStats = {
    currentLevel: 1,
    deathsThisRun: 0,
    totalDeaths: 0,
    elapsedTime: 0,
    activeCheckpoint: null,
    deathReason: '',
    trollTrapHit: '',
  };

  // Input states
  public inputMove = { x: 0, z: 0 };
  public inputJumpBuffered: boolean = false;
  public jumpBufferTimer: number = 0;
  public coyoteTimer: number = 0;
  public inputSprint: boolean = false;
  public inputCrouch: boolean = false;

  // Callbacks to React HUD
  public onStatsChange?: (stats: PlayerStats) => void;
  public onRunStatsChange?: (runStats: RunStats) => void;
  public onVictory?: () => void;
  public onGameOver?: (reason: string) => void;
  public onCheckpointTriggered?: () => void;

  constructor(container: HTMLDivElement, initialLevel: LevelDef, settings: GameSettings) {
    this.container = container;
    this.currentLevelDef = initialLevel;
    this.settings = settings;

    this.detectSoftwareGl();
    this.initRenderer();
    this.initScene();
    this.initCamera();
    this.initPlayer();
    this.loadLevel(initialLevel);
  }

  private detectSoftwareGl() {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) {
      this.isSoftwareGl = true;
      return;
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  }

  private initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x08090a);
    this.scene.fog = new THREE.FogExp2(0x08090a, 0.04);

    // Studio Environment map
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Balanced horror lighting
    this.keyLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    this.keyLight.position.set(5, 12, 5);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 40;
    this.keyLight.shadow.camera.left = -15;
    this.keyLight.shadow.camera.right = 15;
    this.keyLight.shadow.camera.top = 15;
    this.keyLight.shadow.camera.bottom = -15;
    this.scene.add(this.keyLight);

    this.hemiLight = new THREE.HemisphereLight(0x384252, 0x121417, 0.6);
    this.scene.add(this.hemiLight);

    this.ambientLight = new THREE.AmbientLight(0x181a1f, 0.4);
    this.scene.add(this.ambientLight);

    this.scene.add(this.levelMeshes);
  }

  private initCamera() {
    const aspect = (this.container.clientWidth || 1) / (this.container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 80);
    this.camera.position.set(0, 3, 5);
  }

  private initPlayer() {
    this.player = new CharacterController();
    this.scene.add(this.player.group);
  }

  public resize(width: number, height: number) {
    if (!this.renderer || !this.camera) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Builds 3D level geometry based on level specifications
   */
  public loadLevel(levelDef: LevelDef) {
    this.currentLevelDef = levelDef;
    this.runStats.currentLevel = levelDef.id;
    this.runStats.deathsThisRun = 0;
    this.runStats.elapsedTime = 0;
    this.runStats.activeCheckpoint = null;
    this.runStats.deathReason = '';
    this.runStats.trollTrapHit = '';

    this.stats.hp = 100;
    this.stats.stamina = 100;
    this.stats.flashlightBattery = 100;
    this.stats.hasKey = !levelDef.exitKeyRequired;
    this.stats.keysCount = levelDef.exitKeyRequired ? 0 : 1;

    // Clear previous geometry & actors
    while (this.levelMeshes.children.length > 0) {
      const obj = this.levelMeshes.children[0];
      this.levelMeshes.remove(obj);
    }
    this.trapInstances = [];
    this.enemies = [];
    this.checkpointMeshes = [];
    this.environmentColliders = [];
    this.keyMesh = null;
    this.exitDoorMesh = null;

    // Fog and ambient light customization
    const fogColor = levelDef.fogColor || 0x08090a;
    this.scene.background = new THREE.Color(fogColor);
    this.scene.fog = new THREE.FogExp2(fogColor, levelDef.fogDensity || 0.035);
    this.ambientLight.color.setHex(levelDef.ambientLightColor || 0x181a1f);

    // Build floor & corridor
    const [sx, sy, sz] = levelDef.spawnPoint;
    const [ex, ey, ez] = levelDef.exitPoint;
    const minZ = Math.min(sz, ez) - 6;
    const maxZ = Math.max(sz, ez) + 6;
    const lengthZ = maxZ - minZ;
    const centerZ = (minZ + maxZ) / 2;

    const concreteTex = textures.getConcreteTexture();
    concreteTex.repeat.set(2, lengthZ / 4);

    const floorMat = new THREE.MeshStandardMaterial({
      map: concreteTex,
      bumpMap: textures.getGenericBumpMap(),
      bumpScale: 0.04,
      roughness: 0.7,
      metalness: 0.2,
    });

    const floorGeo = new THREE.BoxGeometry(6, 0.6, lengthZ);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, -0.3, centerZ);
    floorMesh.receiveShadow = !this.isSoftwareGl;
    this.levelMeshes.add(floorMesh);

    // Walls
    const wallGeo = new THREE.BoxGeometry(0.5, 5, lengthZ);
    const wallMat = new THREE.MeshStandardMaterial({
      map: concreteTex,
      roughness: 0.85,
      metalness: 0.1,
    });
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-3.25, 2.2, centerZ);
    leftWall.castShadow = !this.isSoftwareGl;
    leftWall.receiveShadow = !this.isSoftwareGl;
    this.levelMeshes.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(3.25, 2.2, centerZ);
    rightWall.castShadow = !this.isSoftwareGl;
    rightWall.receiveShadow = !this.isSoftwareGl;
    this.levelMeshes.add(rightWall);

    // End caps
    const capGeo = new THREE.BoxGeometry(7, 5, 0.5);
    const startCap = new THREE.Mesh(capGeo, wallMat);
    startCap.position.set(0, 2.2, minZ);
    this.levelMeshes.add(startCap);

    const endCap = new THREE.Mesh(capGeo, wallMat);
    endCap.position.set(0, 2.2, maxZ);
    this.levelMeshes.add(endCap);

    // Wall bounding box colliders
    this.environmentColliders.push(new THREE.Box3().setFromObject(leftWall));
    this.environmentColliders.push(new THREE.Box3().setFromObject(rightWall));
    this.environmentColliders.push(new THREE.Box3().setFromObject(startCap));
    this.environmentColliders.push(new THREE.Box3().setFromObject(endCap));

    // Ceiling beams for atmosphere
    const beamGeo = new THREE.BoxGeometry(6.5, 0.4, 0.4);
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x1f2428, roughness: 0.7, metalness: 0.5 });
    for (let z = minZ + 3; z <= maxZ - 3; z += 6) {
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0, 4.4, z);
      this.levelMeshes.add(beam);

      // Flickering halogen light sconce
      if (Math.random() > 0.4) {
        const sconceLight = new THREE.PointLight(0xffd599, 1.2, 10, 1.8);
        sconceLight.position.set(0, 4.1, z);
        this.levelMeshes.add(sconceLight);
      }
    }

    // Build Traps
    levelDef.traps.forEach((trapDef) => {
      const inst = createTrap(trapDef);
      this.trapInstances.push(inst);
      this.levelMeshes.add(inst.mesh);
    });

    // Build Key if required
    if (levelDef.exitKeyRequired && levelDef.keyPosition) {
      const keyGroup = new THREE.Group();
      keyGroup.position.set(...levelDef.keyPosition);

      const keyRingGeo = new THREE.TorusGeometry(0.18, 0.05, 12, 24);
      const keyStemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5);
      const keyMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.5,
        metalness: 0.9,
        roughness: 0.2,
      });

      const ring = new THREE.Mesh(keyRingGeo, keyMat);
      ring.position.y = 0.25;
      keyGroup.add(ring);

      const stem = new THREE.Mesh(keyStemGeo, keyMat);
      stem.position.y = 0;
      keyGroup.add(stem);

      const keyLight = new THREE.PointLight(0xf59e0b, 1.5, 4);
      keyGroup.add(keyLight);

      this.keyMesh = keyGroup;
      this.levelMeshes.add(keyGroup);
    }

    // Build Checkpoints
    levelDef.checkpoints.forEach((cp) => {
      const cpGroup = new THREE.Group();
      cpGroup.position.set(...cp.position);

      const pillarGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8);
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      cpGroup.add(pillar);

      const orbGeo = new THREE.SphereGeometry(0.2, 16, 16);
      const orbMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.y = 0.8;
      cpGroup.add(orb);

      const cpLight = new THREE.PointLight(0x06b6d4, 1.8, 5);
      cpLight.position.y = 0.8;
      cpGroup.add(cpLight);

      this.checkpointMeshes.push(cpGroup);
      this.levelMeshes.add(cpGroup);
    });

    // Build Exit Door
    const exitGroup = new THREE.Group();
    exitGroup.position.set(...levelDef.exitPoint);

    const doorFrameGeo = new THREE.BoxGeometry(2.0, 3.0, 0.3);
    const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const doorFrame = new THREE.Mesh(doorFrameGeo, doorFrameMat);
    exitGroup.add(doorFrame);

    const doorPanelGeo = new THREE.BoxGeometry(1.6, 2.6, 0.15);
    const doorPanelMat = new THREE.MeshStandardMaterial({
      color: levelDef.exitKeyRequired ? 0xef4444 : 0x22c55e,
      emissive: levelDef.exitKeyRequired ? 0x991b1b : 0x15803d,
      emissiveIntensity: 0.5,
      roughness: 0.3,
    });
    const doorPanel = new THREE.Mesh(doorPanelGeo, doorPanelMat);
    doorPanel.position.set(0, 0, 0.05);
    exitGroup.add(doorPanel);

    const signGeo = new THREE.BoxGeometry(1.0, 0.35, 0.1);
    const signMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 1.7, 0.1);
    exitGroup.add(sign);

    this.exitDoorMesh = exitGroup;
    this.levelMeshes.add(exitGroup);

    // Build Enemies
    if (levelDef.enemies && levelDef.enemies.length > 0) {
      levelDef.enemies.forEach((enemyDef) => {
        const creature = new CreatureAI(enemyDef);
        this.enemies.push(creature);
        this.levelMeshes.add(creature.group);
      });
    }

    // Reset player position at spawn
    this.player.resetState(levelDef.spawnPoint);
    this.player.setFlashlight(this.stats.flashlightOn);

    // Reset camera Yaw to face down corridor
    this.cameraYaw = 0;
    this.cameraPitch = 0.25;

    this.notifyStats();
  }

  public respawnPlayer() {
    this.runStats.deathsThisRun++;
    this.runStats.totalDeaths++;
    const respawnPos = this.runStats.activeCheckpoint || this.currentLevelDef.spawnPoint;
    this.player.resetState(respawnPos);
    this.stats.hp = this.stats.maxHp;
    this.stats.stamina = this.stats.maxStamina;

    // Reset traps & enemies
    this.trapInstances.forEach((t) => t.reset());
    this.enemies.forEach((e) => e.resetState());

    this.notifyStats();
    sound.startAmbientDrone();
  }

  public toggleFlashlight(): boolean {
    this.stats.flashlightOn = !this.stats.flashlightOn;
    this.player.setFlashlight(this.stats.flashlightOn);
    sound.playFlashlight();
    this.notifyStats();
    return this.stats.flashlightOn;
  }

  public triggerJump() {
    this.inputJumpBuffered = true;
    this.jumpBufferTimer = 0.14;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    sound.startAmbientDrone();
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.frameId);
    sound.stopAmbientDrone();
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 60);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private loop = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05);

    this.updateSimulation(dt);
    this.updateCamera(dt);

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.loop);
    } else {
      this.frameId = requestAnimationFrame(this.loop);
    }
  };

  private updateSimulation(dt: number) {
    if (this.player.isDead) {
      this.player.update(dt, 0);
      return;
    }

    this.runStats.elapsedTime += dt;
    const diffMods = DIFFICULTY_MODIFIERS[this.settings.difficulty];

    // 1. Stamina & Sprinting
    this.player.isCrouching = this.inputCrouch;
    const wantsSprint = this.inputSprint && !this.inputCrouch && this.stats.stamina > 5;
    this.player.isSprinting = wantsSprint;

    if (wantsSprint && (this.inputMove.x !== 0 || this.inputMove.z !== 0)) {
      this.stats.stamina = Math.max(0, this.stats.stamina - dt * 25 * diffMods.staminaDrain);
    } else {
      this.stats.stamina = Math.min(this.stats.maxStamina, this.stats.stamina + dt * 20);
    }

    // 2. Flashlight Battery
    if (this.stats.flashlightOn) {
      this.stats.flashlightBattery = Math.max(0, this.stats.flashlightBattery - dt * 1.5 * diffMods.flashlightDrain);
      if (this.stats.flashlightBattery <= 0) {
        this.player.setFlashlight(false);
        this.stats.flashlightOn = false;
      }
    }

    // 3. Movement Direction from Camera Angle
    const moveX = this.inputMove.x;
    const moveZ = this.inputMove.z;
    const hasMoveInput = Math.hypot(moveX, moveZ) > 0.05;

    let baseSpeed = 5.0;
    if (this.player.isCrouching) baseSpeed = 2.4;
    else if (this.player.isSprinting) baseSpeed = 8.2;

    // Camera yaw 0 = looking forward into +Z down the corridor
    const forward = _v1.set(Math.sin(this.cameraYaw), 0, Math.cos(this.cameraYaw)).normalize();
    const right = _v2.set(forward.z, 0, -forward.x).normalize();

    const wishDir = new THREE.Vector3();
    if (hasMoveInput) {
      wishDir.addScaledVector(forward, -moveZ);
      wishDir.addScaledVector(right, moveX);
      wishDir.normalize();

      this.player.targetRotationY = Math.atan2(wishDir.x, wishDir.z);
    }

    // Horizontal acceleration & friction
    const accel = this.player.isGrounded ? 40 : 15;
    const targetVelX = wishDir.x * baseSpeed;
    const targetVelZ = wishDir.z * baseSpeed;
    this.player.velocity.x = THREE.MathUtils.damp(this.player.velocity.x, targetVelX, accel, dt);
    this.player.velocity.z = THREE.MathUtils.damp(this.player.velocity.z, targetVelZ, accel, dt);

    // 4. Gravity & Coyote/Buffered Jump
    const gravity = -24;
    this.player.velocity.y += gravity * dt;

    if (this.player.isGrounded) {
      this.coyoteTimer = diffMods.coyoteTime;
    } else {
      this.coyoteTimer -= dt;
    }

    if (this.inputJumpBuffered) {
      this.jumpBufferTimer -= dt;
      if (this.jumpBufferTimer <= 0) {
        this.inputJumpBuffered = false;
      }
    }

    if (this.inputJumpBuffered && this.coyoteTimer > 0) {
      this.player.velocity.y = 8.5;
      this.player.isGrounded = false;
      this.coyoteTimer = 0;
      this.inputJumpBuffered = false;
      this.player.triggerJumpSquash();
      sound.playJump();
    }

    // 5. Integrate Position & Ground Collision
    const prevPos = this.player.position.clone();
    this.player.position.addScaledVector(this.player.velocity, dt);

    // Simple floor collision (y = 0 is ground plane)
    if (this.player.position.y <= 0) {
      if (!this.player.isGrounded && this.player.velocity.y < -4) {
        sound.playLand();
        this.player.triggerLandSquash();
      }
      this.player.position.y = 0;
      this.player.velocity.y = 0;
      this.player.isGrounded = true;
    } else {
      this.player.isGrounded = false;
    }

    // Bounds clamping along corridor width (-2.8 to 2.8)
    this.player.position.x = THREE.MathUtils.clamp(this.player.position.x, -2.7, 2.7);

    // Fall into void death check
    if (this.player.position.y < -8) {
      this.handleDeath("Fell into the Bottomless Abyss!");
      return;
    }

    // Moved distance for footstep sound & limb gait
    const movedDist = Math.hypot(this.player.position.x - prevPos.x, this.player.position.z - prevPos.z);
    if (this.player.isGrounded && movedDist > 0.05) {
      if (Math.random() < 0.12) {
        sound.playFootstep(this.player.isSprinting);
      }
    }

    this.player.update(dt, movedDist);

    // 6. Update Traps
    this.trapInstances.forEach((trap) => {
      const res = trap.update(dt, this.player.position);
      if (res.hit) {
        const actualDmg = res.damage * diffMods.damageMultiplier;
        this.stats.hp -= actualDmg;
        this.runStats.trollTrapHit = trap.def.type;
        sound.playSpikeTrap();
        if (this.stats.hp <= 0) {
          this.handleDeath(res.message || "Killed by a Deceptive Trap!");
        }
      }
    });

    // 7. Update Key Pickup
    if (this.keyMesh && !this.stats.hasKey && this.currentLevelDef.keyPosition) {
      this.keyMesh.rotation.y += dt * 3;
      if (this.player.position.distanceTo(this.keyMesh.position) < 1.3) {
        this.stats.hasKey = true;
        this.stats.keysCount = 1;
        this.scene.remove(this.keyMesh);
        this.keyMesh = null;
        sound.playKeyPickup();

        // Unlock Exit Door visual
        if (this.exitDoorMesh && this.exitDoorMesh.children[1]) {
          const doorMat = (this.exitDoorMesh.children[1] as THREE.Mesh).material as THREE.MeshStandardMaterial;
          doorMat.color.setHex(0x22c55e);
          doorMat.emissive.setHex(0x15803d);
        }
        this.notifyStats();
      }
    }

    // 8. Update Checkpoints
    this.currentLevelDef.checkpoints.forEach((cp, idx) => {
      const cpPos = new THREE.Vector3(...cp.position);
      if (this.player.position.distanceTo(cpPos) < 1.4) {
        if (!this.runStats.activeCheckpoint || this.runStats.activeCheckpoint[2] !== cpPos.z) {
          this.runStats.activeCheckpoint = cp.position;
          sound.playCheckpoint();
          if (this.onCheckpointTriggered) this.onCheckpointTriggered();
        }
      }
    });

    // 9. Update Enemies
    this.enemies.forEach((enemy) => {
      const res = enemy.update(
        dt,
        this.player.position,
        this.player.isSprinting,
        this.stats.flashlightOn,
        diffMods.enemySpeedMultiplier
      );
      if (res.hitPlayer) {
        const actualDmg = res.damage * diffMods.damageMultiplier;
        this.stats.hp -= actualDmg;
        sound.playDeath();
        if (this.stats.hp <= 0) {
          this.handleDeath("Caught by the Stalker!");
        }
      }
    });

    // 10. Check Exit Door Arrival (Victory Condition)
    const exitPos = new THREE.Vector3(...this.currentLevelDef.exitPoint);
    if (this.player.position.distanceTo(exitPos) < 1.6) {
      if (this.stats.hasKey) {
        this.handleVictory();
      } else {
        // Locked door reminder
        sound.playTrollDoor();
      }
    }

    this.notifyStats();
  }

  private handleDeath(reason: string) {
    this.player.isDead = true;
    this.runStats.deathReason = reason;
    sound.playDeath();
    if (this.onGameOver) this.onGameOver(reason);
  }

  private handleVictory() {
    this.isRunning = false;
    sound.playVictory();
    if (this.onVictory) this.onVictory();
  }

  private updateCamera(dt: number) {
    const targetPos = this.player.position.clone();
    targetPos.y += this.player.isCrouching ? 0.7 : 1.1;

    // Spherical camera position from pitch & yaw (camera behind player looking forward into corridor)
    const offsetX = Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;
    const offsetY = Math.sin(this.cameraPitch) * this.cameraDistance;
    const offsetZ = -Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;

    _camDesired.copy(targetPos).add(_v1.set(offsetX, offsetY, offsetZ));

    // Wall Raycast collision pull-in: raycast from character target to desired camera position
    const camDir = _camDesired.clone().sub(targetPos);
    const maxDist = camDir.length();
    camDir.normalize();

    _ray.set(targetPos, camDir);
    _ray.far = maxDist;

    // Check against level colliders
    let finalDist = maxDist;
    const hitTestBoxes: THREE.Box3[] = this.environmentColliders;
    for (const box of hitTestBoxes) {
      const intersect = _ray.ray.intersectBox(box, _v2);
      if (intersect) {
        const distToWall = targetPos.distanceTo(intersect);
        if (distToWall < finalDist) {
          finalDist = Math.max(0.6, distToWall - 0.2);
        }
      }
    }

    const actualCamPos = targetPos.clone().add(camDir.multiplyScalar(finalDist));

    // Smooth exponential damping
    this.camera.position.lerp(actualCamPos, Math.min(1, dt * 14));
    this.camera.lookAt(targetPos);
  }

  private notifyStats() {
    if (this.onStatsChange) this.onStatsChange({ ...this.stats });
    if (this.onRunStatsChange) this.onRunStatsChange({ ...this.runStats });
  }

  public dispose() {
    this.stop();
    window.removeEventListener('resize', () => {});
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
