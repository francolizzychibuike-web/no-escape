/**
 * NO ESCAPE - Core Game Types and Interfaces
 */

export type Difficulty = 'easy' | 'normal' | 'hard' | 'nightmare';

export type GameStatus = 'title' | 'playing' | 'paused' | 'gameover' | 'victory';

export interface PlayerStats {
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  flashlightBattery: number;
  maxBattery: number;
  flashlightOn: boolean;
  isCrouching: boolean;
  isSprinting: boolean;
  isGrounded: boolean;
  hasKey: boolean;
  keysCount: number;
  relicsFound: number;
}

export type TrapType =
  | 'disappearing_platform'
  | 'fake_door'
  | 'fleeing_door'
  | 'mimic_door'
  | 'floor_spike'
  | 'falling_ceiling'
  | 'moving_wall'
  | 'collapsing_bridge'
  | 'swinging_blade'
  | 'laser_tripwire'
  | 'inverting_room'
  | 'fake_checkpoint'
  | 'push_block'
  | 'chase_hazard';

export interface TrapDef {
  id: string;
  type: TrapType;
  position: [number, number, number];
  size?: [number, number, number];
  triggerRadius?: number;
  active?: boolean;
  delay?: number;
  speed?: number;
  direction?: [number, number, number];
  range?: number;
  trollMessage?: string;
  revealed?: boolean;
  linkedEntityId?: string;
}

export interface CheckpointDef {
  id: string;
  position: [number, number, number];
  isFake?: boolean;
  trollTrigger?: boolean;
}

export interface EnemyDef {
  id: string;
  type: 'stalker' | 'warden' | 'creeper';
  position: [number, number, number];
  patrolPath?: [number, number, number][];
  detectionRadius: number;
  speed: number;
  damage: number;
}

export interface LevelDef {
  id: number;
  chapter: number;
  title: string;
  subtitle: string;
  environment: 'bunker' | 'trap_house' | 'forgotten_city' | 'nightmare_void' | 'warden_sanctum';
  spawnPoint: [number, number, number];
  exitPoint: [number, number, number];
  exitKeyRequired?: boolean;
  keyPosition?: [number, number, number];
  checkpoints: CheckpointDef[];
  traps: TrapDef[];
  enemies?: EnemyDef[];
  parTime: number; // in seconds for 3 stars
  trollHint: string;
  ambientLightColor?: number;
  fogColor?: number;
  fogDensity?: number;
}

export interface LevelProgress {
  unlocked: boolean;
  stars: number;
  bestTime: number;
  deaths: number;
  completed: boolean;
}

export interface GameSettings {
  difficulty: Difficulty;
  masterVolume: number;
  sfxVolume: number;
  ambientVolume: number;
  musicVolume?: number;
  mouseSensitivity: number;
  invertY: boolean;
  showMobileControls: boolean;
  graphicsQuality: 'low' | 'medium' | 'high' | 'ultra';
  postProcessing: boolean;
  showFps: boolean;
}

export interface RunStats {
  currentLevel: number;
  deathsThisRun: number;
  totalDeaths: number;
  elapsedTime: number;
  activeCheckpoint: [number, number, number] | null;
  deathReason: string;
  trollTrapHit: string;
}
