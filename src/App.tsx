/**
 * NO ESCAPE: THE ULTIMATE TRAP HORROR GAME
 * Main Game Coordinator & React-Three.js Bridge
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { GameStatus, GameSettings, LevelProgress, PlayerStats, RunStats } from './game/types';
import { LEVELS, getLevelDef } from './game/levels';
import { getInitialProgress, recordLevelCompletion } from './game/rules';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { SettingsModal } from './components/SettingsModal';
import { sound } from './game/audio';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // High-level Game States
  const [gameStatus, setGameStatus] = useState<GameStatus>('title');
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Settings
  const [settings, setSettings] = useState<GameSettings>(() => ({
    difficulty: 'normal',
    masterVolume: 0.8,
    sfxVolume: 0.9,
    ambientVolume: 0.5,
    mouseSensitivity: 1.0,
    invertY: false,
    showMobileControls: typeof window !== 'undefined' && ('ontouchstart' in window || window.innerWidth < 768),
    graphicsQuality: 'high',
    postProcessing: true,
    showFps: false,
  }));

  // Progress (saved in localStorage)
  const [progress, setProgress] = useState<Record<number, LevelProgress>>(() => {
    try {
      const saved = localStorage.getItem('no_escape_progress');
      if (saved) return JSON.parse(saved);
    } catch {}
    return getInitialProgress();
  });

  // Live Simulation Readouts
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
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
  });

  const [runStats, setRunStats] = useState<RunStats>({
    currentLevel: 1,
    deathsThisRun: 0,
    totalDeaths: 0,
    elapsedTime: 0,
    activeCheckpoint: null,
    deathReason: '',
    trollTrapHit: '',
  });

  // Track held keys in ref
  const keysPressed = useRef<Set<string>>(new Set());
  const isPointerLocked = useRef<boolean>(false);
  const isDragging = useRef<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sync state to document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = gameStatus;
  }, [gameStatus]);

  // Save progress
  useEffect(() => {
    try {
      localStorage.setItem('no_escape_progress', JSON.stringify(progress));
    } catch {}
  }, [progress]);

  // Initialize Engine once
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const initialDef = getLevelDef(currentLevelId);
    const engine = new GameEngine(canvasMountRef.current, initialDef, settings);
    engineRef.current = engine;

    // Callbacks from Engine
    engine.onStatsChange = (s) => setPlayerStats(s);
    engine.onRunStatsChange = (r) => setRunStats(r);

    engine.onVictory = () => {
      setGameStatus('victory');
      document.exitPointerLock?.();
      // Record progress
      setProgress((prev) =>
        recordLevelCompletion(
          prev,
          engine.currentLevelDef.id,
          engine.runStats.elapsedTime,
          engine.currentLevelDef.parTime,
          engine.runStats.deathsThisRun,
          settings.difficulty
        )
      );
    };

    engine.onGameOver = (reason) => {
      setGameStatus('gameover');
      document.exitPointerLock?.();
    };

    // Auto-start query parameter (?autostart=1)
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setGameStatus('playing');
      engine.start();
    }

    // Resize observer
    const handleResize = () => {
      if (canvasMountRef.current && engineRef.current) {
        engineRef.current.resize(
          canvasMountRef.current.clientWidth,
          canvasMountRef.current.clientHeight
        );
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Update engine settings when settings state changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.settings = settings;
    }
  }, [settings]);

  // Unified Keyboard Controls Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      keysPressed.current.add(code);

      // Prevent scrolling on Space / Arrow keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        e.preventDefault();
      }

      // Title to Playing Handshake via Enter or Space
      if (gameStatus === 'title' && (code === 'Enter' || code === 'Space')) {
        handleStartGame();
        return;
      }

      // Quick Respawn [R]
      if (code === 'KeyR') {
        if (gameStatus === 'gameover' || gameStatus === 'playing') {
          handleRespawn();
          return;
        }
      }

      // Pause [Escape or KeyP]
      if (code === 'Escape' || code === 'KeyP') {
        if (gameStatus === 'playing') {
          setGameStatus('paused');
          document.exitPointerLock?.();
          sound.stopAmbientDrone();
        } else if (gameStatus === 'paused') {
          handleResume();
        }
        return;
      }

      // Toggle Mute [KeyM]
      if (code === 'KeyM') {
        handleToggleMute();
        return;
      }

      // Flashlight [KeyF]
      if (code === 'KeyF' && gameStatus === 'playing') {
        if (engineRef.current) {
          engineRef.current.toggleFlashlight();
        }
        return;
      }

      // Jump [Space]
      if (code === 'Space' && gameStatus === 'playing') {
        if (engineRef.current) {
          engineRef.current.triggerJump();
        }
      }

      updateEngineInputs();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
      updateEngineInputs();
    };

    const handleWindowBlur = () => {
      keysPressed.current.clear();
      isDragging.current = false;
      updateEngineInputs();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [gameStatus, settings]);

  // Map keyboard state to Engine input vector
  const updateEngineInputs = () => {
    if (!engineRef.current) return;
    const keys = keysPressed.current;

    let moveX = 0;
    let moveZ = 0;

    if (keys.has('KeyW') || keys.has('ArrowUp')) moveZ -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) moveZ += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) moveX -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) moveX += 1;

    // Normalize
    const len = Math.hypot(moveX, moveZ);
    if (len > 0) {
      moveX /= len;
      moveZ /= len;
    }

    engineRef.current.inputMove.x = moveX;
    engineRef.current.inputMove.z = moveZ;
    engineRef.current.inputSprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
    engineRef.current.inputCrouch = keys.has('KeyC') || keys.has('ControlLeft');
  };

  // Mouse Orbit & PointerLock
  useEffect(() => {
    const canvas = canvasMountRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (gameStatus !== 'playing') return;
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };

      // Try PointerLock on click
      if (canvas.requestPointerLock && !document.pointerLockElement) {
        canvas.requestPointerLock();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (gameStatus !== 'playing' || !engineRef.current) return;

      let movementX = 0;
      let movementY = 0;

      if (document.pointerLockElement === canvas) {
        movementX = e.movementX;
        movementY = e.movementY;
      } else if (isDragging.current) {
        movementX = e.clientX - lastMousePos.current.x;
        movementY = e.clientY - lastMousePos.current.y;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
      } else {
        return;
      }

      const sens = 0.003 * settings.mouseSensitivity;
      const yMultiplier = settings.invertY ? 1 : -1;

      engineRef.current.cameraYaw -= movementX * sens;
      engineRef.current.cameraPitch = THREE_clamp(
        engineRef.current.cameraPitch + movementY * sens * yMultiplier,
        -0.1,
        1.1
      );
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handlePointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === canvas;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [gameStatus, settings]);

  function THREE_clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }

  // Action Handlers
  const handleStartGame = () => {
    setGameStatus('playing');
    if (engineRef.current) {
      engineRef.current.start();
    }
    // Attempt pointer lock
    canvasMountRef.current?.requestPointerLock?.();
  };

  const handleResume = () => {
    setGameStatus('playing');
    if (engineRef.current) {
      engineRef.current.start();
    }
    canvasMountRef.current?.requestPointerLock?.();
  };

  const handleRespawn = () => {
    setGameStatus('playing');
    if (engineRef.current) {
      engineRef.current.respawnPlayer();
    }
  };

  const handleRestartLevel = () => {
    setGameStatus('playing');
    if (engineRef.current) {
      const def = getLevelDef(currentLevelId);
      engineRef.current.loadLevel(def);
      engineRef.current.start();
    }
  };

  const handleSelectLevel = (levelId: number) => {
    setCurrentLevelId(levelId);
    if (engineRef.current) {
      const def = getLevelDef(levelId);
      engineRef.current.loadLevel(def);
      if (gameStatus === 'playing') {
        engineRef.current.start();
      }
    }
  };

  const handleNextLevel = () => {
    const nextId = Math.min(50, currentLevelId + 1);
    setCurrentLevelId(nextId);
    setGameStatus('playing');
    if (engineRef.current) {
      const def = getLevelDef(nextId);
      engineRef.current.loadLevel(def);
      engineRef.current.start();
    }
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const currentLevelDef = getLevelDef(currentLevelId);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans select-none">
      {/* 3D WebGL Canvas Mount Container */}
      <div
        ref={canvasMountRef}
        data-testid="three-canvas-container"
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Title Screen Overlay */}
      {gameStatus === 'title' && (
        <TitleScreen
          onStartGame={handleStartGame}
          onOpenLevelSelect={() => setIsLevelSelectOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          selectedDifficulty={settings.difficulty}
          onSelectDifficulty={(d) => setSettings((s) => ({ ...s, difficulty: d }))}
        />
      )}

      {/* Playing Active HUD */}
      {gameStatus === 'playing' && (
        <HUD
          stats={playerStats}
          runStats={runStats}
          levelDef={currentLevelDef}
          onPause={() => {
            setGameStatus('paused');
            document.exitPointerLock?.();
            sound.stopAmbientDrone();
          }}
          onRespawn={handleRespawn}
          onToggleFlashlight={() => engineRef.current?.toggleFlashlight()}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          showMobileControls={settings.showMobileControls}
          onMobileMove={(x, z) => {
            if (engineRef.current) {
              engineRef.current.inputMove.x = x;
              engineRef.current.inputMove.z = z;
            }
          }}
          onMobileJump={() => engineRef.current?.triggerJump()}
          onMobileSprint={(s) => {
            if (engineRef.current) engineRef.current.inputSprint = s;
          }}
          onMobileCrouch={(c) => {
            if (engineRef.current) engineRef.current.inputCrouch = c;
          }}
        />
      )}

      {/* Victory / Chamber Cleared Modal */}
      {gameStatus === 'victory' && (
        <LevelCompleteModal
          levelDef={currentLevelDef}
          clearTime={runStats.elapsedTime}
          deaths={runStats.deathsThisRun}
          difficulty={settings.difficulty}
          onNextLevel={handleNextLevel}
          onReplay={handleRestartLevel}
          onOpenLevelSelect={() => setIsLevelSelectOpen(true)}
        />
      )}

      {/* Game Over / Death Modal */}
      {gameStatus === 'gameover' && (
        <GameOverModal
          reason={runStats.deathReason}
          deaths={runStats.deathsThisRun}
          onRespawn={handleRespawn}
          onRestartLevel={handleRestartLevel}
          onOpenLevelSelect={() => setIsLevelSelectOpen(true)}
        />
      )}

      {/* Paused Modal */}
      {gameStatus === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestartLevel}
          onOpenLevelSelect={() => setIsLevelSelectOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onQuitToMenu={() => {
            setGameStatus('title');
            engineRef.current?.stop();
          }}
        />
      )}

      {/* 50-Level Selector Modal */}
      {isLevelSelectOpen && (
        <LevelSelectModal
          currentLevelId={currentLevelId}
          progress={progress}
          onSelectLevel={(id) => {
            handleSelectLevel(id);
            if (gameStatus === 'title') {
              handleStartGame();
            }
          }}
          onClose={() => setIsLevelSelectOpen(false)}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newS) => setSettings((s) => ({ ...s, ...newS }))}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}
