/**
 * NO ESCAPE - In-Game Playing HUD & Mobile Touch Controls
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  Heart,
  Zap,
  Flashlight,
  Key,
  Skull,
  Timer,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Compass,
} from 'lucide-react';
import { PlayerStats, RunStats, LevelDef } from '../game/types';
import { sound } from '../game/audio';

interface HUDProps {
  stats: PlayerStats;
  runStats: RunStats;
  levelDef: LevelDef;
  onPause: () => void;
  onRespawn: () => void;
  onToggleFlashlight: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  showMobileControls: boolean;
  onMobileMove: (x: number, z: number) => void;
  onMobileJump: () => void;
  onMobileSprint: (sprinting: boolean) => void;
  onMobileCrouch: (crouching: boolean) => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  runStats,
  levelDef,
  onPause,
  onRespawn,
  onToggleFlashlight,
  isMuted,
  onToggleMute,
  showMobileControls,
  onMobileMove,
  onMobileJump,
  onMobileSprint,
  onMobileCrouch,
}) => {
  // Mobile virtual joystick state
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const [sprintHeld, setSprintHeld] = useState(false);
  const [crouchHeld, setCrouchHeld] = useState(false);

  // Handle touch joystick
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setIsJoystickActive(true);
    updateJoystick(touch.clientX, touch.clientY);
  };

  const handleJoystickTouchMove = (e: React.TouchEvent) => {
    if (!isJoystickActive) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateJoystick(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setIsJoystickActive(false);
        setJoystickPos({ x: 0, y: 0 });
        onMobileMove(0, 0);
        break;
      }
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const maxRadius = 45;
    const distance = Math.hypot(dx, dy);

    const clampedDist = Math.min(distance, maxRadius);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setJoystickPos({ x: knobX, y: knobY });

    // Normalized move vector (-1 to 1)
    const normX = knobX / maxRadius;
    const normZ = knobY / maxRadius;
    onMobileMove(normX, normZ);
  };

  // Format elapsed time (mm:ss.s)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 md:p-6 z-30">
      {/* Top Header Cluster */}
      <div className="flex items-start justify-between gap-1.5 md:gap-4">
        {/* Left: Health & Stamina & Battery */}
        <div className="flex flex-col gap-1.5 md:gap-2.5">
          {/* Health Bar */}
          <div className="flex items-center gap-1.5 md:gap-2 bg-zinc-950/80 border border-zinc-800/90 rounded-md px-2 md:px-3 py-1 md:py-1.5 shadow-lg w-32 md:w-52">
            <Heart className={`w-3.5 md:w-4 h-3.5 md:h-4 ${stats.hp < 35 ? 'text-red-500 animate-pulse' : 'text-rose-400'}`} />
            <div className="flex-1 bg-zinc-900 rounded-sm h-2.5 md:h-3 overflow-hidden border border-zinc-800">
              <div
                className={`h-full transition-all duration-150 ${
                  stats.hp < 35 ? 'bg-red-600' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100))}%` }}
              />
            </div>
            <span className="text-[10px] md:text-xs font-mono font-bold text-zinc-300 tabular-nums">
              {Math.max(0, Math.round(stats.hp))}
            </span>
          </div>

          {/* Stamina Bar */}
          <div className="flex items-center gap-1.5 md:gap-2 bg-zinc-950/80 border border-zinc-800/90 rounded-md px-2 md:px-3 py-1 md:py-1.5 shadow-lg w-32 md:w-52">
            <Zap className="w-3.5 md:w-4 h-3.5 md:h-4 text-amber-400" />
            <div className="flex-1 bg-zinc-900 rounded-sm h-2 md:h-2.5 overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-amber-500 transition-all duration-75"
                style={{ width: `${Math.max(0, Math.min(100, (stats.stamina / stats.maxStamina) * 100))}%` }}
              />
            </div>
            <span className="text-[9px] md:text-[10px] font-mono font-bold text-zinc-400 tabular-nums">
              {Math.round(stats.stamina)}%
            </span>
          </div>

          {/* Flashlight Battery */}
          <div className="flex items-center gap-1.5 md:gap-2 bg-zinc-950/80 border border-zinc-800/90 rounded-md px-2 md:px-3 py-1 md:py-1.5 shadow-lg w-32 md:w-52">
            <Flashlight className={`w-3.5 md:w-4 h-3.5 md:h-4 ${stats.flashlightOn ? 'text-yellow-300' : 'text-zinc-600'}`} />
            <div className="flex-1 bg-zinc-900 rounded-sm h-1.5 md:h-2 overflow-hidden border border-zinc-800">
              <div
                className={`h-full transition-all duration-150 ${
                  stats.flashlightOn ? 'bg-yellow-400' : 'bg-zinc-600'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, (stats.flashlightBattery / stats.maxBattery) * 100))}%` }}
              />
            </div>
            <button
              onClick={onToggleFlashlight}
              className="pointer-events-auto text-[9px] md:text-[10px] font-mono text-zinc-300 hover:text-white uppercase bg-zinc-800 px-1 py-0.5 rounded"
            >
              {stats.flashlightOn ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Center: Level Banner & Hint */}
        <div className="hidden sm:flex flex-col items-center text-center max-w-xs md:max-w-md bg-zinc-950/80 border border-zinc-800/90 rounded-lg px-3 md:px-4 py-1.5 md:py-2 shadow-lg">
          <div className="text-[10px] md:text-[11px] font-mono tracking-widest text-red-400 uppercase font-bold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            LEVEL {levelDef.id} · CH. {levelDef.chapter}
          </div>
          <div className="text-xs md:text-base font-bold text-zinc-100 tracking-tight">
            {levelDef.title}
          </div>
          <div className="text-[10px] md:text-[11px] text-zinc-400 italic truncate max-w-xs">
            "{levelDef.trollHint}"
          </div>
        </div>

        {/* Right: Key Status, Deaths, Timer, Utility Buttons */}
        <div className="flex flex-col items-end gap-1.5 md:gap-2.5">
          {/* Key & Deaths & Timer Cluster */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Key Socket */}
            <div
              className={`flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-md border text-[10px] md:text-xs font-mono font-bold shadow-lg ${
                stats.hasKey
                  ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                  : 'bg-zinc-950/80 border-zinc-800 text-zinc-600'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{stats.hasKey ? 'EXIT UNLOCKED' : 'KEY REQUIRED'}</span>
            </div>

            {/* Deaths */}
            <div className="flex items-center gap-1 px-2 md:px-2.5 py-1 md:py-1.5 rounded-md bg-zinc-950/80 border border-zinc-800 text-[10px] md:text-xs font-mono font-bold text-red-400 shadow-lg">
              <Skull className="w-3.5 h-3.5" />
              <span className="tabular-nums">{runStats.deathsThisRun}</span>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-1 px-2 md:px-2.5 py-1 md:py-1.5 rounded-md bg-zinc-950/80 border border-zinc-800 text-[10px] md:text-xs font-mono font-bold text-zinc-300 shadow-lg">
              <Timer className="w-3.5 h-3.5" />
              <span className="tabular-nums">{formatTime(runStats.elapsedTime)}</span>
            </div>
          </div>

          {/* Quick Utility Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onRespawn}
              aria-label="Respawn"
              className="pointer-events-auto p-1.5 md:p-2 rounded bg-zinc-900/90 border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white transition shadow-lg"
              title="Quick Respawn [R]"
            >
              <RotateCcw className="w-3.5 md:w-4 h-3.5 md:h-4" />
            </button>
            <button
              onClick={onToggleMute}
              aria-label="Mute"
              className="pointer-events-auto p-1.5 md:p-2 rounded bg-zinc-900/90 border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white transition shadow-lg"
              title="Mute Audio [M]"
            >
              {isMuted ? <VolumeX className="w-3.5 md:w-4 h-3.5 md:h-4" /> : <Volume2 className="w-3.5 md:w-4 h-3.5 md:h-4" />}
            </button>
            <button
              onClick={onPause}
              aria-label="Pause"
              className="pointer-events-auto p-1.5 md:p-2 rounded bg-zinc-900/90 border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white transition shadow-lg"
              title="Pause [P / Esc]"
            >
              <Pause className="w-3.5 md:w-4 h-3.5 md:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Critical Health Screen Vignette */}
      {stats.hp < 35 && (
        <div className="absolute inset-0 pointer-events-none ring-[16px] ring-red-600/30 animate-pulse" />
      )}

      {/* Mobile Touch Controls Overlay */}
      {showMobileControls && (
        <div className="flex items-end justify-between w-full pb-4 px-2">
          {/* Virtual Thumbstick */}
          <div
            ref={joystickBaseRef}
            onTouchStart={handleJoystickTouchStart}
            onTouchMove={handleJoystickTouchMove}
            onTouchEnd={handleJoystickTouchEnd}
            className="pointer-events-auto relative w-32 h-32 rounded-full bg-zinc-950/60 border-2 border-zinc-700/80 flex items-center justify-center touch-none shadow-2xl"
          >
            <div
              className="w-14 h-14 rounded-full bg-red-600/80 border border-red-400 shadow-md transform transition-transform duration-75"
              style={{
                transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
              }}
            />
          </div>

          {/* Action Buttons Right Side */}
          <div className="flex flex-col gap-3 pointer-events-auto">
            <div className="flex gap-3 justify-end">
              {/* Sprint Button */}
              <button
                onTouchStart={() => {
                  setSprintHeld(true);
                  onMobileSprint(true);
                }}
                onTouchEnd={() => {
                  setSprintHeld(false);
                  onMobileSprint(false);
                }}
                className={`w-14 h-14 rounded-full border text-xs font-mono font-bold flex items-center justify-center transition active:scale-90 shadow-lg ${
                  sprintHeld
                    ? 'bg-amber-600 border-amber-300 text-white'
                    : 'bg-zinc-900/80 border-zinc-700 text-zinc-300'
                }`}
              >
                SPRINT
              </button>

              {/* Crouch Button */}
              <button
                onTouchStart={() => {
                  setCrouchHeld(!crouchHeld);
                  onMobileCrouch(!crouchHeld);
                }}
                className={`w-14 h-14 rounded-full border text-xs font-mono font-bold flex items-center justify-center transition active:scale-90 shadow-lg ${
                  crouchHeld
                    ? 'bg-blue-600 border-blue-300 text-white'
                    : 'bg-zinc-900/80 border-zinc-700 text-zinc-300'
                }`}
              >
                CROUCH
              </button>
            </div>

            <div className="flex gap-3 justify-end">
              {/* Flashlight Button */}
              <button
                onClick={onToggleFlashlight}
                className="w-14 h-14 rounded-full bg-zinc-900/80 border border-zinc-700 text-xs font-mono font-bold text-yellow-400 flex items-center justify-center transition active:scale-90 shadow-lg"
              >
                LIGHT
              </button>

              {/* Big Jump Button */}
              <button
                onClick={() => {
                  sound.playJump();
                  onMobileJump();
                }}
                className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 border-2 border-red-400 text-white font-black text-sm tracking-wider flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.5)] transition active:scale-90"
              >
                JUMP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
