/**
 * NO ESCAPE - Deceptive Trap System & Troll Obstacles
 * Inspired by Level Devil - Deceptive environments, unpredictable obstacles, and hilarious traps.
 */

import * as THREE from 'three';
import { TrapDef } from './types';
import { textures } from './textures';
import { sound } from './audio';

export interface TrapInstance {
  def: TrapDef;
  mesh: THREE.Group;
  initialPos: THREE.Vector3;
  currentPos: THREE.Vector3;
  triggered: boolean;
  active: boolean;
  stateTimer: number;
  update: (dt: number, playerPos: THREE.Vector3) => { hit: boolean; damage: number; message?: string };
  reset: () => void;
}

export function createTrap(def: TrapDef): TrapInstance {
  const group = new THREE.Group();
  const initialPos = new THREE.Vector3(...def.position);
  const currentPos = initialPos.clone();
  group.position.copy(initialPos);

  let triggered = false;
  let active = def.active ?? true;
  let stateTimer = 0;

  const concreteTex = textures.getConcreteTexture();
  const grateTex = textures.getMetalGrateTexture();
  const hazardTex = textures.getHazardTexture();
  const bumpMap = textures.getGenericBumpMap();

  // 1. DISAPPEARING PLATFORM
  if (def.type === 'disappearing_platform') {
    const size = def.size || [2, 0.4, 2];
    const geo = new THREE.BoxGeometry(...size);
    const mat = new THREE.MeshStandardMaterial({
      map: grateTex,
      bumpMap: bumpMap,
      bumpScale: 0.05,
      roughness: 0.6,
      metalness: 0.3,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    const update = (dt: number, playerPos: THREE.Vector3) => {
      if (!active) return { hit: false, damage: 0 };

      const dist = Math.hypot(playerPos.x - currentPos.x, playerPos.z - currentPos.z);
      const isAbove = playerPos.y >= currentPos.y && playerPos.y <= currentPos.y + 1.2;

      if (!triggered && dist < (size[0] / 2 + 0.3) && isAbove) {
        triggered = true;
        stateTimer = 0.35; // warning shake before drop
        sound.playCrumble();
      }

      if (triggered) {
        if (stateTimer > 0) {
          stateTimer -= dt;
          mesh.position.x = (Math.random() - 0.5) * 0.08;
          mesh.position.z = (Math.random() - 0.5) * 0.08;
        } else {
          // Drop down rapidly
          currentPos.y -= dt * 14;
          group.position.copy(currentPos);
          if (currentPos.y < -30) {
            active = false;
            group.visible = false;
          }
        }
      }

      return { hit: false, damage: 0 };
    };

    const reset = () => {
      triggered = false;
      active = true;
      stateTimer = 0;
      currentPos.copy(initialPos);
      group.position.copy(initialPos);
      mesh.position.set(0, 0, 0);
      group.visible = true;
    };

    return { def, mesh: group, initialPos, currentPos, triggered, active, stateTimer, update, reset };
  }

  // 2. FLEEING DOOR (LEVEL DEVIL SIGNATURE)
  if (def.type === 'fleeing_door') {
    // Door frame + Door slab
    const frameGeo = new THREE.BoxGeometry(1.6, 2.5, 0.2);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x22262a, roughness: 0.8 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    group.add(frame);

    const doorGeo = new THREE.BoxGeometry(1.2, 2.2, 0.15);
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      emissive: 0x15803d,
      emissiveIntensity: 0.4,
      roughness: 0.4,
    });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 0, 0.02);
    group.add(door);

    // Glowing EXIT sign above
    const signGeo = new THREE.BoxGeometry(0.8, 0.25, 0.1);
    const signMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 1.4, 0.06);
    group.add(sign);

    let timesFleed = 0;
    const maxFlees = 2;

    const update = (dt: number, playerPos: THREE.Vector3) => {
      const dist = currentPos.distanceTo(playerPos);
      if (dist < 4.0 && timesFleed < maxFlees) {
        // Flee away along Z or X!
        timesFleed++;
        sound.playTrollDoor();
        const fleeDir = def.direction || [0, 0, 1];
        currentPos.x += fleeDir[0] * (def.range || 5);
        currentPos.z += fleeDir[2] * (def.range || 5);
        group.position.copy(currentPos);
      }
      return { hit: false, damage: 0 };
    };

    const reset = () => {
      timesFleed = 0;
      currentPos.copy(initialPos);
      group.position.copy(initialPos);
    };

    return { def, mesh: group, initialPos, currentPos, triggered, active, stateTimer, update, reset };
  }

  // 3. FLOOR SPIKES
  if (def.type === 'floor_spike') {
    // Spikes plate
    const baseGeo = new THREE.BoxGeometry(1.8, 0.1, 1.8);
    const baseMat = new THREE.MeshStandardMaterial({ map: hazardTex, roughness: 0.7 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    group.add(base);

    // Conical spikes
    const spikeGroup = new THREE.Group();
    const spikeMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.8,
      roughness: 0.2,
    });
    for (let x = -0.6; x <= 0.6; x += 0.4) {
      for (let z = -0.6; z <= 0.6; z += 0.4) {
        const cone = new THREE.ConeGeometry(0.08, 0.7, 8);
        cone.translate(0, 0.35, 0);
        const spike = new THREE.Mesh(cone, spikeMat);
        spike.position.set(x, 0, z);
        spikeGroup.add(spike);
      }
    }
    // Hidden underneath floor initially
    spikeGroup.position.y = -0.6;
    group.add(spikeGroup);

    let popped = false;

    const update = (dt: number, playerPos: THREE.Vector3) => {
      const dist = Math.hypot(playerPos.x - currentPos.x, playerPos.z - currentPos.z);
      const isAbove = Math.abs(playerPos.y - currentPos.y) < 1.0;

      if (!popped && dist < 1.1 && isAbove) {
        popped = true;
        sound.playSpikeTrap();
      }

      if (popped) {
        spikeGroup.position.y = THREE.MathUtils.damp(spikeGroup.position.y, 0.05, 25, dt);
        if (dist < 0.9 && isAbove && spikeGroup.position.y > -0.2) {
          return { hit: true, damage: 100, message: "Impaled on Deceptive Spikes!" };
        }
      }

      return { hit: false, damage: 0 };
    };

    const reset = () => {
      popped = false;
      spikeGroup.position.y = -0.6;
    };

    return { def, mesh: group, initialPos, currentPos, triggered, active, stateTimer, update, reset };
  }

  // 4. FALLING CEILING / CRUSHER
  if (def.type === 'falling_ceiling') {
    const size = def.size || [3, 1, 3];
    const geo = new THREE.BoxGeometry(...size);
    const mat = new THREE.MeshStandardMaterial({
      map: concreteTex,
      bumpMap: bumpMap,
      roughness: 0.8,
    });
    const block = new THREE.Mesh(geo, mat);
    block.castShadow = true;
    group.add(block);

    // Hazard stripes on bottom
    const trimGeo = new THREE.BoxGeometry(size[0], 0.1, size[2]);
    const trimMat = new THREE.MeshStandardMaterial({ map: hazardTex });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.y = -size[1] / 2;
    group.add(trim);

    let dropped = false;

    const update = (dt: number, playerPos: THREE.Vector3) => {
      const distXZ = Math.hypot(playerPos.x - currentPos.x, playerPos.z - currentPos.z);
      if (!dropped && distXZ < size[0] * 0.7 && playerPos.y < currentPos.y) {
        dropped = true;
        sound.playCrumble();
      }

      if (dropped) {
        currentPos.y = Math.max(0.5, currentPos.y - dt * (def.speed || 16));
        group.position.copy(currentPos);

        const hitX = Math.abs(playerPos.x - currentPos.x) < size[0] / 2;
        const hitZ = Math.abs(playerPos.z - currentPos.z) < size[2] / 2;
        const hitY = playerPos.y >= currentPos.y - 0.5 && playerPos.y <= currentPos.y + 0.5;

        if (hitX && hitZ && hitY) {
          return { hit: true, damage: 100, message: "Crushed by Falling Ceiling!" };
        }
      }

      return { hit: false, damage: 0 };
    };

    const reset = () => {
      dropped = false;
      currentPos.copy(initialPos);
      group.position.copy(initialPos);
    };

    return { def, mesh: group, initialPos, currentPos, triggered, active, stateTimer, update, reset };
  }

  // 5. SWINGING BLADE PENDULUM
  if (def.type === 'swinging_blade') {
    const rodGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.5);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.position.y = -1.75;
    group.add(rod);

    const bladeGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.08, 16, 1, false, 0, Math.PI);
    bladeGeo.rotateZ(Math.PI / 2);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.15,
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = -3.5;
    group.add(blade);

    let angleTime = Math.random() * Math.PI;

    const update = (dt: number, playerPos: THREE.Vector3) => {
      angleTime += dt * (def.speed || 3.0);
      const angle = Math.sin(angleTime) * 1.1;
      group.rotation.z = angle;

      // Blade world position
      const bladeWorld = new THREE.Vector3(0, -3.5, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), angle).add(currentPos);
      if (bladeWorld.distanceTo(playerPos) < 1.0) {
        return { hit: true, damage: 100, message: "Sliced by Pendulum Blade!" };
      }

      return { hit: false, damage: 0 };
    };

    const reset = () => {
      angleTime = 0;
      group.rotation.set(0, 0, 0);
    };

    return { def, mesh: group, initialPos, currentPos, triggered, active, stateTimer, update, reset };
  }

  // 6. MOVING WALL / PUSHER
  if (def.type === 'moving_wall') {
    const size = def.size || [1.5, 3.0, 1.5];
    const geo = new THREE.BoxGeometry(...size);
    const mat = new THREE.MeshStandardMaterial({ map: concreteTex, bumpMap });
    const wall = new THREE.Mesh(geo, mat);
    wall.castShadow = true;
    group.add(wall);

    let moveTime = 0;
    const range = def.range || 4;
    const dir = def.direction || [1, 0, 0];

    const update = (dt: number, playerPos: THREE.Vector3) => {
      moveTime += dt * (def.speed || 2.0);
      const offset = (Math.sin(moveTime) * 0.5 + 0.5) * range;
      currentPos.x = initialPos.x + dir[0] * offset;
      currentPos.z = initialPos.z + dir[2] * offset;
      group.position.copy(currentPos);

      // Collision push
      const dx = Math.abs(playerPos.x - currentPos.x);
      const dz = Math.abs(playerPos.z - currentPos.z);
      if (dx < size[0] / 2 + 0.3 && dz < size[2] / 2 + 0.3 && Math.abs(playerPos.y - currentPos.y) < size[1] / 2) {
        return { hit: true, damage: 40, message: "Pushed by Moving Wall!" };
      }

      return { hit: false, damage: 0 };
    };

    const reset = () => {
      moveTime = 0;
      currentPos.copy(initialPos);
      group.position.copy(initialPos);
    };

    return { def, mesh: group, initialPos, currentPos, triggered, active, stateTimer, update, reset };
  }

  // 7. FAKE DOOR (TURNS RED & DETONATES)
  if (def.type === 'fake_door') {
    const frameGeo = new THREE.BoxGeometry(1.6, 2.5, 0.2);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x331010, roughness: 0.8 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    group.add(frame);

    const doorGeo = new THREE.BoxGeometry(1.2, 2.2, 0.15);
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a, // Looks like exit initially!
      emissive: 0x15803d,
      emissiveIntensity: 0.3,
    });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 0, 0.02);
    group.add(door);

    let exploded = false;

    const update = (dt: number, playerPos: THREE.Vector3) => {
      const dist = currentPos.distanceTo(playerPos);
      if (!exploded && dist < 1.5) {
        exploded = true;
        doorMat.color.setHex(0xdc2626);
        doorMat.emissive.setHex(0xb91c1c);
        doorMat.emissiveIntensity = 1.0;
        sound.playJumpscare();
        return { hit: true, damage: 100, message: "You trusted a Fake Exit Door!" };
      }
      return { hit: false, damage: 0 };
    };

    const reset = () => {
      exploded = false;
      const doorMesh = group.children[1] as THREE.Mesh;
      if (doorMesh && doorMesh.material) {
        const m = doorMesh.material as THREE.MeshStandardMaterial;
        m.color.setHex(0x16a34a);
        m.emissive.setHex(0x15803d);
        m.emissiveIntensity = 0.3;
      }
    };

    return { def, mesh: group, initialPos, currentPos, triggered, active, stateTimer, update, reset };
  }

  // Fallback generic trap
  const defaultGeo = new THREE.BoxGeometry(1, 1, 1);
  const defaultMat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
  group.add(new THREE.Mesh(defaultGeo, defaultMat));

  return {
    def,
    mesh: group,
    initialPos,
    currentPos,
    triggered: false,
    active: true,
    stateTimer: 0,
    update: () => ({ hit: false, damage: 0 }),
    reset: () => {},
  };
}
