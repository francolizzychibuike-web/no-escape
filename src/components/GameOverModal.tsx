/**
 * NO ESCAPE - Game Over / Death Modal
 */

import React from 'react';
import { Skull, RotateCcw, ArrowLeft, Grid } from 'lucide-react';
import { getRandomTrollQuote } from '../game/rules';
import { sound } from '../game/audio';

interface GameOverModalProps {
  reason: string;
  deaths: number;
  onRespawn: () => void;
  onRestartLevel: () => void;
  onOpenLevelSelect: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  reason,
  deaths,
  onRespawn,
  onRestartLevel,
  onOpenLevelSelect,
}) => {
  const trollQuote = getRandomTrollQuote();

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none pointer-events-auto animate-fade-in">
      <div className="w-full max-w-md bg-zinc-950 border border-red-900/60 rounded-xl p-6 md:p-8 shadow-[0_0_50px_rgba(220,38,38,0.25)] flex flex-col items-center text-center">
        {/* Skull Icon */}
        <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-600 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
          <Skull className="w-8 h-8 text-red-500 animate-pulse" />
        </div>

        <div className="text-xs font-mono font-bold tracking-widest text-red-500 uppercase mb-1">
          YOU PERISHED
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
          {reason || "The Deception Claimed You"}
        </h2>

        {/* Troll Hint */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-3 my-4 w-full text-xs text-zinc-300 italic">
          "{trollQuote}"
        </div>

        <div className="text-xs font-mono text-zinc-400 mb-5">
          DEATH COUNT: <span className="text-red-400 font-bold tabular-nums">{deaths}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            data-start="true"
            onClick={() => {
              sound.playButton();
              onRespawn();
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded bg-red-600 hover:bg-red-500 text-white font-black tracking-wider text-sm uppercase shadow-[0_0_20px_rgba(220,38,38,0.5)] transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESPAWN AT CHECKPOINT [R]</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => {
                sound.playButton();
                onRestartLevel();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-xs tracking-wider uppercase transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              RESTART LEVEL
            </button>
            <button
              onClick={() => {
                sound.playButton();
                onOpenLevelSelect();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-xs tracking-wider uppercase transition"
            >
              <Grid className="w-3.5 h-3.5" />
              CHAMBERS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
