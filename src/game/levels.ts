/**
 * NO ESCAPE - 50 Level Registry Across 5 Chapters
 * Handcrafted progression inspired by Level Devil & survival horror.
 */

import { LevelDef, TrapDef } from './types';

// Helper to generate levels systematically with rich variation
function createLevel(
  id: number,
  chapter: number,
  title: string,
  subtitle: string,
  env: 'bunker' | 'trap_house' | 'forgotten_city' | 'nightmare_void' | 'warden_sanctum',
  parTime: number,
  trollHint: string,
  spawnZ: number,
  exitZ: number,
  traps: TrapDef[],
  hasKey: boolean = false,
  keyZ?: number,
  enemiesCount: number = 0
): LevelDef {
  const fogColors = {
    bunker: 0x0a0c0e,
    trap_house: 0x140c08,
    forgotten_city: 0x081014,
    nightmare_void: 0x180406,
    warden_sanctum: 0x110203,
  };

  const ambientColors = {
    bunker: 0x1a2228,
    trap_house: 0x241812,
    forgotten_city: 0x12242a,
    nightmare_void: 0x2a0c10,
    warden_sanctum: 0x200508,
  };

  const level: LevelDef = {
    id,
    chapter,
    title,
    subtitle,
    environment: env,
    spawnPoint: [0, 1.0, spawnZ],
    exitPoint: [0, 1.0, exitZ],
    exitKeyRequired: hasKey,
    keyPosition: hasKey ? [0, 1.0, keyZ ?? (spawnZ + exitZ) / 2] : undefined,
    checkpoints: [
      {
        id: `cp_${id}_1`,
        position: [0, 1.0, spawnZ + (exitZ - spawnZ) * 0.5],
      },
    ],
    traps,
    parTime,
    trollHint,
    ambientLightColor: ambientColors[env],
    fogColor: fogColors[env],
    fogDensity: 0.035,
  };

  if (enemiesCount > 0) {
    level.enemies = [];
    for (let e = 0; e < enemiesCount; e++) {
      const zOffset = spawnZ + (exitZ - spawnZ) * (0.4 + e * 0.25);
      level.enemies.push({
        id: `enemy_${id}_${e}`,
        type: chapter === 5 ? 'warden' : 'stalker',
        position: [e % 2 === 0 ? 2 : -2, 1.0, zOffset],
        patrolPath: [
          [-3, 1.0, zOffset],
          [3, 1.0, zOffset],
        ],
        detectionRadius: 9 + chapter * 1.5,
        speed: 3.5 + chapter * 0.4,
        damage: 40 + chapter * 10,
      });
    }
  }

  return level;
}

export const LEVELS: LevelDef[] = [
  // ================= CHAPTER 1: THE BEGINNING (1-10) =================
  createLevel(
    1, 1, "Awakening", "First steps into darkness", "bunker", 15,
    "Watch out for sudden gaps in the floor.",
    -12, 12,
    [
      { id: 't1_1', type: 'floor_spike', position: [0, 0, -2] },
      { id: 't1_2', type: 'disappearing_platform', position: [0, 0, 5], size: [2.5, 0.4, 2.5] },
    ]
  ),
  createLevel(
    2, 1, "The False Step", "Not everything is solid", "bunker", 18,
    "The middle tile looks suspicious for a reason.",
    -14, 14,
    [
      { id: 't2_1', type: 'disappearing_platform', position: [0, 0, -6], size: [2.5, 0.4, 2.5] },
      { id: 't2_2', type: 'floor_spike', position: [0, 0, 0] },
      { id: 't2_3', type: 'disappearing_platform', position: [0, 0, 7], size: [2.5, 0.4, 2.5] },
    ]
  ),
  createLevel(
    3, 1, "Falling Heavens", "Look up before you jump", "bunker", 20,
    "When dust falls from above, don't stand still.",
    -16, 16,
    [
      { id: 't3_1', type: 'falling_ceiling', position: [0, 4.5, -4], size: [3, 0.8, 3], speed: 18 },
      { id: 't3_2', type: 'floor_spike', position: [0, 0, 4] },
      { id: 't3_3', type: 'falling_ceiling', position: [0, 4.5, 10], size: [3, 0.8, 3], speed: 20 },
    ]
  ),
  createLevel(
    4, 1, "The Runner", "Speed is not always your friend", "bunker", 22,
    "Sprinting triggers sound sensors.",
    -18, 18,
    [
      { id: 't4_1', type: 'floor_spike', position: [0, 0, -8] },
      { id: 't4_2', type: 'moving_wall', position: [-2, 1.5, -1], direction: [1, 0, 0], range: 3, speed: 2.5 },
      { id: 't4_3', type: 'disappearing_platform', position: [0, 0, 8], size: [2.5, 0.4, 2.5] },
    ]
  ),
  createLevel(
    5, 1, "The First Key", "Locked doors demand tribute", "bunker", 25,
    "The key is guarded, but so is the way back.",
    -20, 20,
    [
      { id: 't5_1', type: 'floor_spike', position: [0, 0, -10] },
      { id: 't5_2', type: 'falling_ceiling', position: [0, 4.5, 0], size: [3, 0.8, 3] },
      { id: 't5_3', type: 'moving_wall', position: [2, 1.5, 10], direction: [-1, 0, 0], range: 3.5, speed: 3.0 },
    ],
    true, 0
  ),
  createLevel(
    6, 1, "Leap of Faith", "Mind the pendulum", "bunker", 24,
    "Time your dash when the blade reaches its crest.",
    -18, 18,
    [
      { id: 't6_1', type: 'swinging_blade', position: [0, 4.5, -6], speed: 3.2 },
      { id: 't6_2', type: 'disappearing_platform', position: [0, 0, 0], size: [2, 0.4, 2] },
      { id: 't6_3', type: 'swinging_blade', position: [0, 4.5, 8], speed: 3.8 },
    ]
  ),
  createLevel(
    7, 1, "Crumbling Path", "Keep moving, don't look back", "bunker", 25,
    "Every step collapses behind you.",
    -20, 20,
    [
      { id: 't7_1', type: 'disappearing_platform', position: [0, 0, -10], size: [2, 0.4, 2] },
      { id: 't7_2', type: 'disappearing_platform', position: [0, 0, -5], size: [2, 0.4, 2] },
      { id: 't7_3', type: 'floor_spike', position: [0, 0, 2] },
      { id: 't7_4', type: 'disappearing_platform', position: [0, 0, 10], size: [2, 0.4, 2] },
    ]
  ),
  createLevel(
    8, 1, "Double Trouble", "Two blades, one narrow bridge", "bunker", 26,
    "Wait between the two arcs.",
    -20, 20,
    [
      { id: 't8_1', type: 'swinging_blade', position: [0, 4.5, -8], speed: 3.0 },
      { id: 't8_2', type: 'falling_ceiling', position: [0, 4.5, 0], size: [3, 0.8, 3] },
      { id: 't8_3', type: 'swinging_blade', position: [0, 4.5, 10], speed: 3.5 },
    ]
  ),
  createLevel(
    9, 1, "The Pressure Chamber", "Walls with a personal grudge", "bunker", 28,
    "Notice the rhythm of the crushing plates.",
    -22, 22,
    [
      { id: 't9_1', type: 'moving_wall', position: [-2.5, 1.5, -10], direction: [1, 0, 0], range: 3.8, speed: 2.8 },
      { id: 't9_2', type: 'moving_wall', position: [2.5, 1.5, -2], direction: [-1, 0, 0], range: 3.8, speed: 2.8 },
      { id: 't9_3', type: 'floor_spike', position: [0, 0, 6] },
      { id: 't9_4', type: 'moving_wall', position: [-2.5, 1.5, 14], direction: [1, 0, 0], range: 3.8, speed: 3.2 },
    ]
  ),
  createLevel(
    10, 1, "The Threshold", "Chapter 1 Finale", "bunker", 30,
    "A final test of everything you've learned.",
    -24, 24,
    [
      { id: 't10_1', type: 'disappearing_platform', position: [0, 0, -14], size: [2.2, 0.4, 2.2] },
      { id: 't10_2', type: 'swinging_blade', position: [0, 4.5, -6], speed: 3.4 },
      { id: 't10_3', type: 'falling_ceiling', position: [0, 4.5, 2], size: [3, 0.8, 3] },
      { id: 't10_4', type: 'floor_spike', position: [0, 0, 10] },
      { id: 't10_5', type: 'moving_wall', position: [2.5, 1.5, 16], direction: [-1, 0, 0], range: 3.5, speed: 3.5 },
    ],
    true, 2
  ),

  // ================= CHAPTER 2: THE TRAP HOUSE (11-20) =================
  createLevel(
    11, 2, "The Welcoming Door", "Enter if you dare", "trap_house", 22,
    "The door seems excited to meet you. Or run away.",
    -18, 18,
    [
      { id: 't11_1', type: 'fleeing_door', position: [0, 1.2, 10], direction: [0, 0, 1], range: 6 },
      { id: 't11_2', type: 'floor_spike', position: [0, 0, 2] },
      { id: 't11_3', type: 'disappearing_platform', position: [0, 0, -6], size: [2, 0.4, 2] },
    ]
  ),
  createLevel(
    12, 2, "The Running Exit", "Level Devil classic", "trap_house", 24,
    "Just when you think you've made it... nope.",
    -20, 20,
    [
      { id: 't12_1', type: 'fleeing_door', position: [0, 1.2, 12], direction: [0, 0, 1], range: 7 },
      { id: 't12_2', type: 'moving_wall', position: [-2.5, 1.5, -4], direction: [1, 0, 0], range: 3.5, speed: 3.0 },
      { id: 't12_3', type: 'floor_spike', position: [0, 0, 4] },
    ]
  ),
  createLevel(
    13, 2, "Fake Hope", "Not all doors lead outside", "trap_house", 25,
    "One door is an exit. One door is an explosion.",
    -20, 20,
    [
      { id: 't13_1', type: 'fake_door', position: [-2.5, 1.2, 8] },
      { id: 't13_2', type: 'swinging_blade', position: [0, 4.5, -4], speed: 3.6 },
      { id: 't13_3', type: 'disappearing_platform', position: [0, 0, 2], size: [2, 0.4, 2] },
    ],
    true, -4
  ),
  createLevel(
    14, 2, "Spike Waltz", "Rhythm is key", "trap_house", 26,
    "Step in between the clicks.",
    -22, 22,
    [
      { id: 't14_1', type: 'floor_spike', position: [0, 0, -10] },
      { id: 't14_2', type: 'floor_spike', position: [0, 0, -2] },
      { id: 't14_3', type: 'floor_spike', position: [0, 0, 6] },
      { id: 't14_4', type: 'floor_spike', position: [0, 0, 14] },
    ]
  ),
  createLevel(
    15, 2, "Crush Corridors", "Tight spaces", "trap_house", 28,
    "Crouch under low ceiling passages.",
    -22, 22,
    [
      { id: 't15_1', type: 'falling_ceiling', position: [0, 4.5, -8], size: [3.5, 0.8, 3.5] },
      { id: 't15_2', type: 'falling_ceiling', position: [0, 4.5, 2], size: [3.5, 0.8, 3.5] },
      { id: 't15_3', type: 'moving_wall', position: [2.5, 1.5, 12], direction: [-1, 0, 0], range: 3.5, speed: 3.2 },
    ]
  ),
  createLevel(
    16, 2, "Vanishing Hall", "Memory test", "trap_house", 28,
    "Remember which platforms were real.",
    -24, 24,
    [
      { id: 't16_1', type: 'disappearing_platform', position: [0, 0, -14], size: [2, 0.4, 2] },
      { id: 't16_2', type: 'disappearing_platform', position: [0, 0, -6], size: [2, 0.4, 2] },
      { id: 't16_3', type: 'disappearing_platform', position: [0, 0, 2], size: [2, 0.4, 2] },
      { id: 't16_4', type: 'disappearing_platform', position: [0, 0, 10], size: [2, 0.4, 2] },
      { id: 't16_5', type: 'fleeing_door', position: [0, 1.2, 18], direction: [0, 0, 1], range: 5 },
    ]
  ),
  createLevel(
    17, 2, "The Mimic Hall", "Is that really a key?", "trap_house", 30,
    "Approach cautiously.",
    -24, 24,
    [
      { id: 't17_1', type: 'fake_door', position: [2.5, 1.2, -6] },
      { id: 't17_2', type: 'swinging_blade', position: [0, 4.5, 0], speed: 3.5 },
      { id: 't17_3', type: 'floor_spike', position: [0, 0, 8] },
      { id: 't17_4', type: 'moving_wall', position: [-2.5, 1.5, 14], direction: [1, 0, 0], range: 3.5, speed: 3.2 },
    ],
    true, 0
  ),
  createLevel(
    18, 2, "Guillotine Alley", "Time every leap", "trap_house", 32,
    "Three pendulums in synchronized chaos.",
    -26, 26,
    [
      { id: 't18_1', type: 'swinging_blade', position: [0, 4.5, -12], speed: 3.0 },
      { id: 't18_2', type: 'swinging_blade', position: [0, 4.5, -4], speed: 3.8 },
      { id: 't18_3', type: 'swinging_blade', position: [0, 4.5, 4], speed: 3.2 },
      { id: 't18_4', type: 'floor_spike', position: [0, 0, 12] },
    ]
  ),
  createLevel(
    19, 2, "The Trap Master's Lair", "Troll gauntlet", "trap_house", 35,
    "The door will run, the floor will fall, the walls will push.",
    -26, 26,
    [
      { id: 't19_1', type: 'moving_wall', position: [-2.5, 1.5, -14], direction: [1, 0, 0], range: 3.5, speed: 3.0 },
      { id: 't19_2', type: 'falling_ceiling', position: [0, 4.5, -6], size: [3, 0.8, 3] },
      { id: 't19_3', type: 'disappearing_platform', position: [0, 0, 2], size: [2, 0.4, 2] },
      { id: 't19_4', type: 'fleeing_door', position: [0, 1.2, 18], direction: [0, 0, 1], range: 6 },
    ]
  ),
  createLevel(
    20, 2, "House of Shadows", "Chapter 2 Finale", "trap_house", 38,
    "The true exit is unlocked only with the golden key.",
    -28, 28,
    [
      { id: 't20_1', type: 'fake_door', position: [-3, 1.2, 10] },
      { id: 't20_2', type: 'swinging_blade', position: [0, 4.5, -12], speed: 3.5 },
      { id: 't20_3', type: 'disappearing_platform', position: [0, 0, -4], size: [2, 0.4, 2] },
      { id: 't20_4', type: 'falling_ceiling', position: [0, 4.5, 4], size: [3, 0.8, 3] },
      { id: 't20_5', type: 'floor_spike', position: [0, 0, 14] },
    ],
    true, -4
  ),

  // ================= CHAPTER 3: THE FORGOTTEN CITY (21-30) =================
  createLevel(
    21, 3, "Streets of Silence", "The creature awakens", "forgotten_city", 35,
    "Turn off your flashlight if you hear heavy breathing.",
    -24, 24,
    [
      { id: 't21_1', type: 'floor_spike', position: [0, 0, -8] },
      { id: 't21_2', type: 'disappearing_platform', position: [0, 0, 4], size: [2.5, 0.4, 2.5] },
    ],
    false, undefined, 1
  ),
  createLevel(
    22, 3, "Dark Alleyways", "Stealth is mandatory", "forgotten_city", 36,
    "Crouching reduces your noise signature.",
    -26, 26,
    [
      { id: 't22_1', type: 'moving_wall', position: [-2.5, 1.5, -8], direction: [1, 0, 0], range: 3.5, speed: 2.8 },
      { id: 't22_2', type: 'falling_ceiling', position: [0, 4.5, 2], size: [3, 0.8, 3] },
    ],
    true, -2, 1
  ),
  createLevel(
    23, 3, "The Stalker's Territory", "It hunts by sound", "forgotten_city", 38,
    "Sprint only when you must clear a trap.",
    -26, 26,
    [
      { id: 't23_1', type: 'swinging_blade', position: [0, 4.5, -10], speed: 3.2 },
      { id: 't23_2', type: 'floor_spike', position: [0, 0, 0] },
      { id: 't23_3', type: 'fleeing_door', position: [0, 1.2, 18], direction: [0, 0, 1], range: 5 },
    ],
    false, undefined, 1
  ),
  createLevel(
    24, 3, "Flooded Subway", "Water splashes alert enemies", "forgotten_city", 40,
    "The platforms over the dark water are fragile.",
    -28, 28,
    [
      { id: 't24_1', type: 'disappearing_platform', position: [0, 0, -12], size: [2, 0.4, 2] },
      { id: 't24_2', type: 'disappearing_platform', position: [0, 0, -4], size: [2, 0.4, 2] },
      { id: 't24_3', type: 'floor_spike', position: [0, 0, 6] },
      { id: 't24_4', type: 'disappearing_platform', position: [0, 0, 14], size: [2, 0.4, 2] },
    ],
    true, -4, 1
  ),
  createLevel(
    25, 3, "Cathedral of Bones", "High ceilings, deep shadows", "forgotten_city", 42,
    "Beware the stalker on the grand aisle.",
    -30, 30,
    [
      { id: 't25_1', type: 'falling_ceiling', position: [0, 4.5, -14], size: [3.5, 0.8, 3.5] },
      { id: 't25_2', type: 'swinging_blade', position: [0, 4.5, -4], speed: 3.6 },
      { id: 't25_3', type: 'moving_wall', position: [2.5, 1.5, 8], direction: [-1, 0, 0], range: 3.5, speed: 3.2 },
      { id: 't25_4', type: 'fake_door', position: [-2.5, 1.2, 18] },
    ],
    false, undefined, 2
  ),
  createLevel(
    26, 3, "The Clocktower", "Mechanical doom", "forgotten_city", 40,
    "Gears and blades move like clockwork.",
    -28, 28,
    [
      { id: 't26_1', type: 'swinging_blade', position: [0, 4.5, -12], speed: 3.2 },
      { id: 't26_2', type: 'swinging_blade', position: [0, 4.5, -2], speed: 3.8 },
      { id: 't26_3', type: 'swinging_blade', position: [0, 4.5, 8], speed: 3.0 },
    ],
    true, -2, 1
  ),
  createLevel(
    27, 3, "Collapsing Viaduct", "Long drop below", "forgotten_city", 42,
    "Sprint across without stopping.",
    -30, 30,
    [
      { id: 't27_1', type: 'disappearing_platform', position: [0, 0, -16], size: [2, 0.4, 2] },
      { id: 't27_2', type: 'disappearing_platform', position: [0, 0, -8], size: [2, 0.4, 2] },
      { id: 't27_3', type: 'floor_spike', position: [0, 0, 0] },
      { id: 't27_4', type: 'disappearing_platform', position: [0, 0, 8], size: [2, 0.4, 2] },
      { id: 't27_5', type: 'disappearing_platform', position: [0, 0, 16], size: [2, 0.4, 2] },
    ],
    false, undefined, 1
  ),
  createLevel(
    28, 3, "The Sewer Maze", "Poison fumes and stalkers", "forgotten_city", 45,
    "Watch out for moving crushers from the walls.",
    -32, 32,
    [
      { id: 't28_1', type: 'moving_wall', position: [-2.5, 1.5, -16], direction: [1, 0, 0], range: 3.5, speed: 3.0 },
      { id: 't28_2', type: 'falling_ceiling', position: [0, 4.5, -6], size: [3, 0.8, 3] },
      { id: 't28_3', type: 'moving_wall', position: [2.5, 1.5, 6], direction: [-1, 0, 0], range: 3.5, speed: 3.2 },
      { id: 't28_4', type: 'fleeing_door', position: [0, 1.2, 22], direction: [0, 0, 1], range: 6 },
    ],
    true, 0, 2
  ),
  createLevel(
    29, 3, "The Red Square", "Open hunting ground", "forgotten_city", 45,
    "Creatures flank from both sides.",
    -32, 32,
    [
      { id: 't29_1', type: 'floor_spike', position: [0, 0, -14] },
      { id: 't29_2', type: 'swinging_blade', position: [0, 4.5, -4], speed: 3.5 },
      { id: 't29_3', type: 'falling_ceiling', position: [0, 4.5, 8], size: [3, 0.8, 3] },
    ],
    false, undefined, 2
  ),
  createLevel(
    30, 3, "City Exit Gate", "Chapter 3 Finale", "forgotten_city", 48,
    "Retrieve the gate key and evade the twin hunters.",
    -34, 34,
    [
      { id: 't30_1', type: 'fake_door', position: [3, 1.2, 12] },
      { id: 't30_2', type: 'swinging_blade', position: [0, 4.5, -16], speed: 3.6 },
      { id: 't30_3', type: 'disappearing_platform', position: [0, 0, -8], size: [2, 0.4, 2] },
      { id: 't30_4', type: 'moving_wall', position: [-2.5, 1.5, 0], direction: [1, 0, 0], range: 3.5, speed: 3.2 },
      { id: 't30_5', type: 'floor_spike', position: [0, 0, 14] },
    ],
    true, 0, 2
  ),

  // ================= CHAPTER 4: NIGHTMARE WORLD (31-40) =================
  createLevel(
    31, 4, "The Blood Rift", "Reality fractures", "nightmare_void", 40,
    "The void below claims all missteps.",
    -26, 26,
    [
      { id: 't31_1', type: 'disappearing_platform', position: [0, 0, -10], size: [1.8, 0.4, 1.8] },
      { id: 't31_2', type: 'floor_spike', position: [0, 0, 0] },
      { id: 't31_3', type: 'disappearing_platform', position: [0, 0, 10], size: [1.8, 0.4, 1.8] },
    ],
    false, undefined, 1
  ),
  createLevel(
    32, 4, "Twisted Geometry", "Walls do not obey physics", "nightmare_void", 42,
    "Watch the ceiling and walls simultaneously.",
    -28, 28,
    [
      { id: 't32_1', type: 'moving_wall', position: [-2.5, 1.5, -10], direction: [1, 0, 0], range: 3.5, speed: 3.4 },
      { id: 't32_2', type: 'falling_ceiling', position: [0, 4.5, 0], size: [3, 0.8, 3] },
      { id: 't32_3', type: 'moving_wall', position: [2.5, 1.5, 10], direction: [-1, 0, 0], range: 3.5, speed: 3.4 },
    ],
    true, 0, 1
  ),
  createLevel(
    33, 4, "The Hall of Screams", "Sensory overload", "nightmare_void", 44,
    "The exit door teleports when you blink.",
    -28, 28,
    [
      { id: 't33_1', type: 'fleeing_door', position: [0, 1.2, 14], direction: [0, 0, 1], range: 7 },
      { id: 't33_2', type: 'swinging_blade', position: [0, 4.5, -6], speed: 3.8 },
      { id: 't33_3', type: 'floor_spike', position: [0, 0, 4] },
    ],
    false, undefined, 2
  ),
  createLevel(
    34, 4, "Void Steps", "Minimal stepping stones", "nightmare_void", 45,
    "Every step is a disappearing trap.",
    -30, 30,
    [
      { id: 't34_1', type: 'disappearing_platform', position: [0, 0, -18], size: [1.6, 0.4, 1.6] },
      { id: 't34_2', type: 'disappearing_platform', position: [0, 0, -10], size: [1.6, 0.4, 1.6] },
      { id: 't34_3', type: 'disappearing_platform', position: [0, 0, -2], size: [1.6, 0.4, 1.6] },
      { id: 't34_4', type: 'disappearing_platform', position: [0, 0, 6], size: [1.6, 0.4, 1.6] },
      { id: 't34_5', type: 'disappearing_platform', position: [0, 0, 14], size: [1.6, 0.4, 1.6] },
    ],
    true, -2, 1
  ),
  createLevel(
    35, 4, "The Pendulum Corridor", "Four blades in rapid harmony", "nightmare_void", 45,
    "Run in precise cadence.",
    -30, 30,
    [
      { id: 't35_1', type: 'swinging_blade', position: [0, 4.5, -15], speed: 3.5 },
      { id: 't35_2', type: 'swinging_blade', position: [0, 4.5, -5], speed: 4.0 },
      { id: 't35_3', type: 'swinging_blade', position: [0, 4.5, 5], speed: 3.6 },
      { id: 't35_4', type: 'swinging_blade', position: [0, 4.5, 15], speed: 4.2 },
    ],
    false, undefined, 2
  ),
  createLevel(
    36, 4, "Labyrinth of Deceit", "Fake doors everywhere", "nightmare_void", 48,
    "Three doors appear, only one is benign.",
    -32, 32,
    [
      { id: 't36_1', type: 'fake_door', position: [-3, 1.2, 10] },
      { id: 't36_2', type: 'fake_door', position: [3, 1.2, 10] },
      { id: 't36_3', type: 'falling_ceiling', position: [0, 4.5, -8], size: [3, 0.8, 3] },
      { id: 't36_4', type: 'floor_spike', position: [0, 0, 2] },
    ],
    true, -8, 2
  ),
  createLevel(
    37, 4, "The Crushing Abyss", "Piston nightmare", "nightmare_void", 48,
    "Walls and ceiling close in from all axes.",
    -32, 32,
    [
      { id: 't37_1', type: 'moving_wall', position: [-2.5, 1.5, -14], direction: [1, 0, 0], range: 3.5, speed: 3.5 },
      { id: 't37_2', type: 'falling_ceiling', position: [0, 4.5, -4], size: [3, 0.8, 3] },
      { id: 't37_3', type: 'moving_wall', position: [2.5, 1.5, 6], direction: [-1, 0, 0], range: 3.5, speed: 3.5 },
      { id: 't37_4', type: 'falling_ceiling', position: [0, 4.5, 16], size: [3, 0.8, 3] },
    ],
    false, undefined, 2
  ),
  createLevel(
    38, 4, "The Stalker's Feast", "Aggressive hunt", "nightmare_void", 50,
    "Enemies move faster in the void.",
    -34, 34,
    [
      { id: 't38_1', type: 'floor_spike', position: [0, 0, -12] },
      { id: 't38_2', type: 'swinging_blade', position: [0, 4.5, -2], speed: 3.8 },
      { id: 't38_3', type: 'disappearing_platform', position: [0, 0, 8], size: [2, 0.4, 2] },
    ],
    true, 0, 3
  ),
  createLevel(
    39, 4, "Descent into Madness", "Unstable realm", "nightmare_void", 52,
    "Disappearing steps over bottomless pits.",
    -34, 34,
    [
      { id: 't39_1', type: 'disappearing_platform', position: [0, 0, -18], size: [1.8, 0.4, 1.8] },
      { id: 't39_2', type: 'falling_ceiling', position: [0, 4.5, -8], size: [3, 0.8, 3] },
      { id: 't39_3', type: 'disappearing_platform', position: [0, 0, 2], size: [1.8, 0.4, 1.8] },
      { id: 't39_4', type: 'swinging_blade', position: [0, 4.5, 12], speed: 4.0 },
      { id: 't39_5', type: 'fleeing_door', position: [0, 1.2, 22], direction: [0, 0, 1], range: 6 },
    ],
    false, undefined, 2
  ),
  createLevel(
    40, 4, "The Abyss Heart", "Chapter 4 Finale", "nightmare_void", 55,
    "Survive the void trial to reach the Warden's domain.",
    -36, 36,
    [
      { id: 't40_1', type: 'fake_door', position: [-3, 1.2, 14] },
      { id: 't40_2', type: 'swinging_blade', position: [0, 4.5, -18], speed: 4.0 },
      { id: 't40_3', type: 'disappearing_platform', position: [0, 0, -8], size: [1.8, 0.4, 1.8] },
      { id: 't40_4', type: 'falling_ceiling', position: [0, 4.5, 2], size: [3.5, 0.8, 3.5] },
      { id: 't40_5', type: 'moving_wall', position: [2.5, 1.5, 12], direction: [-1, 0, 0], range: 3.5, speed: 3.6 },
    ],
    true, -8, 3
  ),

  // ================= CHAPTER 5: NO ESCAPE (41-50) =================
  createLevel(
    41, 5, "The Gates of Despair", "The Final Chapter begins", "warden_sanctum", 48,
    "There is no turning back.",
    -30, 30,
    [
      { id: 't41_1', type: 'floor_spike', position: [0, 0, -12] },
      { id: 't41_2', type: 'falling_ceiling', position: [0, 4.5, -2], size: [3, 0.8, 3] },
      { id: 't41_3', type: 'disappearing_platform', position: [0, 0, 8], size: [2, 0.4, 2] },
    ],
    false, undefined, 2
  ),
  createLevel(
    42, 5, "The Warden's Wake", "Heavy steps shake the earth", "warden_sanctum", 50,
    "The Warden hits with crushing force.",
    -32, 32,
    [
      { id: 't42_1', type: 'moving_wall', position: [-2.5, 1.5, -12], direction: [1, 0, 0], range: 3.5, speed: 3.5 },
      { id: 't42_2', type: 'swinging_blade', position: [0, 4.5, 0], speed: 3.8 },
      { id: 't42_3', type: 'floor_spike', position: [0, 0, 12] },
    ],
    true, 0, 1
  ),
  createLevel(
    43, 5, "The Hall of Mirrors", "Mimics and illusions", "warden_sanctum", 52,
    "Three fake doors before the true path.",
    -32, 32,
    [
      { id: 't43_1', type: 'fake_door', position: [-3, 1.2, 4] },
      { id: 't43_2', type: 'fake_door', position: [3, 1.2, 4] },
      { id: 't43_3', type: 'fleeing_door', position: [0, 1.2, 18], direction: [0, 0, 1], range: 6 },
    ],
    false, undefined, 2
  ),
  createLevel(
    44, 5, "The Blood Bridge", "Fragile planks over blood rivers", "warden_sanctum", 54,
    "Do not hesitate on any stepping stone.",
    -34, 34,
    [
      { id: 't44_1', type: 'disappearing_platform', position: [0, 0, -20], size: [1.8, 0.4, 1.8] },
      { id: 't44_2', type: 'disappearing_platform', position: [0, 0, -12], size: [1.8, 0.4, 1.8] },
      { id: 't44_3', type: 'floor_spike', position: [0, 0, -4] },
      { id: 't44_4', type: 'disappearing_platform', position: [0, 0, 4], size: [1.8, 0.4, 1.8] },
      { id: 't44_5', type: 'disappearing_platform', position: [0, 0, 14], size: [1.8, 0.4, 1.8] },
    ],
    true, -4, 2
  ),
  createLevel(
    45, 5, "The Iron Vice", "Double crusher gauntlet", "warden_sanctum", 55,
    "Pushed left, crushed from right.",
    -34, 34,
    [
      { id: 't45_1', type: 'moving_wall', position: [-2.5, 1.5, -16], direction: [1, 0, 0], range: 3.5, speed: 3.6 },
      { id: 't45_2', type: 'moving_wall', position: [2.5, 1.5, -6], direction: [-1, 0, 0], range: 3.5, speed: 3.6 },
      { id: 't45_3', type: 'falling_ceiling', position: [0, 4.5, 4], size: [3.5, 0.8, 3.5] },
      { id: 't45_4', type: 'swinging_blade', position: [0, 4.5, 14], speed: 4.0 },
    ],
    false, undefined, 2
  ),
  createLevel(
    46, 5, "The Warden's Lair", "Boss battle arena", "warden_sanctum", 60,
    "Lure the Warden into the spike traps.",
    -36, 36,
    [
      { id: 't46_1', type: 'floor_spike', position: [-2, 0, -10] },
      { id: 't46_2', type: 'floor_spike', position: [2, 0, -10] },
      { id: 't46_3', type: 'falling_ceiling', position: [0, 4.5, 0], size: [3, 0.8, 3] },
      { id: 't46_4', type: 'floor_spike', position: [-2, 0, 10] },
      { id: 't46_5', type: 'floor_spike', position: [2, 0, 10] },
    ],
    true, 0, 2
  ),
  createLevel(
    47, 5, "Troll's Masterpiece", "The pinnacle of deception", "warden_sanctum", 60,
    "Fleeing door, disappearing floor, and fake checkpoints.",
    -36, 36,
    [
      { id: 't47_1', type: 'disappearing_platform', position: [0, 0, -18], size: [1.8, 0.4, 1.8] },
      { id: 't47_2', type: 'swinging_blade', position: [0, 4.5, -8], speed: 4.2 },
      { id: 't47_3', type: 'fake_door', position: [-3, 1.2, 6] },
      { id: 't47_4', type: 'fleeing_door', position: [0, 1.2, 20], direction: [0, 0, 1], range: 8 },
    ],
    false, undefined, 2
  ),
  createLevel(
    48, 5, "The Clock of Eternity", "Synchronized mechanical death", "warden_sanctum", 62,
    "Four swinging pendulums with overlapping reach.",
    -38, 38,
    [
      { id: 't48_1', type: 'swinging_blade', position: [0, 4.5, -20], speed: 3.5 },
      { id: 't48_2', type: 'swinging_blade', position: [0, 4.5, -8], speed: 4.2 },
      { id: 't48_3', type: 'swinging_blade', position: [0, 4.5, 4], speed: 3.8 },
      { id: 't48_4', type: 'swinging_blade', position: [0, 4.5, 16], speed: 4.4 },
      { id: 't48_5', type: 'floor_spike', position: [0, 0, -2] },
    ],
    true, -2, 2
  ),
  createLevel(
    49, 5, "Penultimate Terror", "The Warden's final trial", "warden_sanctum", 65,
    "Every trap type unified in one gauntlet.",
    -40, 40,
    [
      { id: 't49_1', type: 'disappearing_platform', position: [0, 0, -26], size: [1.8, 0.4, 1.8] },
      { id: 't49_2', type: 'moving_wall', position: [-2.5, 1.5, -16], direction: [1, 0, 0], range: 3.5, speed: 3.8 },
      { id: 't49_3', type: 'falling_ceiling', position: [0, 4.5, -4], size: [3.5, 0.8, 3.5] },
      { id: 't49_4', type: 'swinging_blade', position: [0, 4.5, 8], speed: 4.2 },
      { id: 't49_5', type: 'floor_spike', position: [0, 0, 18] },
      { id: 't49_6', type: 'fake_door', position: [3, 1.2, 26] },
    ],
    true, -4, 3
  ),
  createLevel(
    50, 5, "NO ESCAPE", "The Grand Finale", "warden_sanctum", 75,
    "Find the true door. Escape the nightmare forever.",
    -42, 42,
    [
      { id: 't50_1', type: 'disappearing_platform', position: [0, 0, -30], size: [1.8, 0.4, 1.8] },
      { id: 't50_2', type: 'swinging_blade', position: [0, 4.5, -20], speed: 4.2 },
      { id: 't50_3', type: 'falling_ceiling', position: [0, 4.5, -10], size: [3.5, 0.8, 3.5] },
      { id: 't50_4', type: 'moving_wall', position: [-2.5, 1.5, 0], direction: [1, 0, 0], range: 3.5, speed: 3.8 },
      { id: 't50_5', type: 'floor_spike', position: [0, 0, 10] },
      { id: 't50_6', type: 'fleeing_door', position: [0, 1.2, 26], direction: [0, 0, 1], range: 8 },
      { id: 't50_7', type: 'fake_door', position: [-3, 1.2, 32] },
    ],
    true, 0, 3
  ),
];

export function getLevelDef(id: number): LevelDef {
  return LEVELS.find((l) => l.id === id) || LEVELS[0];
}
