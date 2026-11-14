/**
 * NO ESCAPE - Pause Menu Modal
 */

import React from 'react';
import { Play, RotateCcw, Grid, Settings, Home } from 'lucide-react';
import { sound } from '../game/audio';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenLevelSelect: () => void;
  onOpenSettings: () => void;
  onQuitToMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenLevelSelect,
  onOpenSettings,
  onQuitToMenu,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 select-none pointer-events-auto animate-fade-in">
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-xl p-6 md:p-8 shadow-2xl flex flex-col items-center text-center">
        <div className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase mb-1">
          SIMULATION SUSPENDED
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight mb-6">
          PAUSED
        </h2>

        <div className="flex flex-col gap-3 w-full">
          <button
            data-start="true"
            onClick={() => {
              sound.playButton();
              onResume();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded bg-red-600 hover:bg-red-500 text-white font-black tracking-wider text-sm uppercase transition active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            RESUME [ESC]
          </button>

          <button
            onClick={() => {
              sound.playButton();
              onRestart();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-xs tracking-wider uppercase transition"
          >
            <RotateCcw className="w-4 h-4" />
            RESTART CHAMBER [R]
          </button>

          <button
            onClick={() => {
              sound.playButton();
              onOpenLevelSelect();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-xs tracking-wider uppercase transition"
          >
            <Grid className="w-4 h-4" />
            SELECT LEVEL (50)
          </button>

          <button
            onClick={() => {
              sound.playButton();
              onOpenSettings();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-xs tracking-wider uppercase transition"
          >
            <Settings className="w-4 h-4" />
            SETTINGS & AUDIO
          </button>

          <button
            onClick={() => {
              sound.playButton();
              onQuitToMenu();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded bg-zinc-950 hover:bg-zinc-900 border border-red-950 text-red-400 font-bold text-xs tracking-wider uppercase transition mt-2"
          >
            <Home className="w-4 h-4" />
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
