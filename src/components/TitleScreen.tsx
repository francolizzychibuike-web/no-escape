/**
 * NO ESCAPE - Cinematic Horror Title Screen
 */

import React from 'react';
import { Play, Grid, Settings, Skull, Zap, Volume2, ShieldAlert } from 'lucide-react';
import { Difficulty } from '../game/types';
import { sound } from '../game/audio';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenLevelSelect: () => void;
  onOpenSettings: () => void;
  selectedDifficulty: Difficulty;
  onSelectDifficulty: (d: Difficulty) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenLevelSelect,
  onOpenSettings,
  selectedDifficulty,
  onSelectDifficulty,
}) => {
  const difficulties: { id: Difficulty; label: string; desc: string; color: string }[] = [
    { id: 'easy', label: 'EASY', desc: 'Forgiving traps & slower stalkers', color: 'text-emerald-400 border-emerald-800' },
    { id: 'normal', label: 'NORMAL', desc: 'Standard deceptive difficulty', color: 'text-amber-400 border-amber-800' },
    { id: 'hard', label: 'HARD', desc: 'Brutal traps & aggressive enemies', color: 'text-orange-400 border-orange-800' },
    { id: 'nightmare', label: 'NIGHTMARE', desc: 'One mistake is permanent doom', color: 'text-red-500 border-red-900' },
  ];

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between p-6 md:p-12 select-none bg-gradient-to-b from-black/80 via-black/40 to-black/90 pointer-events-auto">
      {/* Top Bar with Brand Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-ping" />
          <span className="text-xs tracking-widest font-mono text-red-500 uppercase">
            Survival Horror x Level Devil Traps
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              sound.playButton();
              sound.toggleMute();
            }}
            aria-label="Toggle Mute"
            className="p-2.5 rounded bg-zinc-900/90 border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white transition"
          >
            <Volume2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              sound.playButton();
              onOpenSettings();
            }}
            aria-label="Open Settings"
            className="p-2.5 rounded bg-zinc-900/90 border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white transition"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Title Centerpiece */}
      <div className="max-w-xl mx-auto text-center flex flex-col items-center">
        <div className="flex items-center gap-2 mb-2 text-red-500 tracking-widest text-xs font-mono uppercase">
          <ShieldAlert className="w-4 h-4" /> 50 Treacherous Levels · 5 Chapters
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-zinc-100 via-zinc-300 to-red-700 drop-shadow-[0_10px_20px_rgba(220,38,38,0.4)]">
          NO ESCAPE
        </h1>
        <p className="mt-3 text-sm md:text-base text-zinc-400 font-medium tracking-wide">
          Survival horror meets deceptive troll obstacles. Every door lies. Every step could crumble.
        </p>

        {/* Difficulty Selection Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-8 w-full max-w-md">
          {difficulties.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                sound.playButton();
                onSelectDifficulty(d.id);
              }}
              className={`py-2 px-3 rounded border text-xs font-mono font-bold tracking-wider transition ${
                selectedDifficulty === d.id
                  ? `${d.color} bg-zinc-900 shadow-[0_0_15px_rgba(239,68,68,0.2)] ring-1 ring-zinc-500`
                  : 'text-zinc-500 border-zinc-800 hover:border-zinc-700 bg-zinc-950/60'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Primary Start CTA */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-md">
          <button
            data-start="true"
            onClick={() => {
              sound.playButton();
              onStartGame();
            }}
            className="flex-1 flex items-center justify-center gap-3 py-4 px-8 rounded bg-red-600 hover:bg-red-500 text-white font-black text-lg tracking-wider uppercase shadow-[0_0_25px_rgba(220,38,38,0.6)] transition transform active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            ENTER THE TRAP
          </button>
          <button
            onClick={() => {
              sound.playButton();
              onOpenLevelSelect();
            }}
            className="flex items-center justify-center gap-2 py-4 px-6 rounded bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold text-sm tracking-wider uppercase transition"
          >
            <Grid className="w-5 h-5" />
            LEVELS (50)
          </button>
        </div>
      </div>

      {/* Bottom Controls Legend */}
      <div className="text-center">
        <p className="text-xs font-mono text-zinc-500 tracking-wider">
          WASD Move · Space Jump · Shift Sprint · C Crouch · F Flashlight · P Pause · R Respawn
        </p>
      </div>
    </div>
  );
};
