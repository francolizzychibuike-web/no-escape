/**
 * NO ESCAPE - Level Victory Modal
 */

import React, { useEffect } from 'react';
import { Star, Trophy, ArrowRight, RotateCcw, Grid } from 'lucide-react';
import confetti from 'canvas-confetti';
import { LevelDef, Difficulty } from '../game/types';
import { calculateStars } from '../game/rules';
import { sound } from '../game/audio';

interface LevelCompleteModalProps {
  levelDef: LevelDef;
  clearTime: number;
  deaths: number;
  difficulty: Difficulty;
  onNextLevel: () => void;
  onReplay: () => void;
  onOpenLevelSelect: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  levelDef,
  clearTime,
  deaths,
  difficulty,
  onNextLevel,
  onReplay,
  onOpenLevelSelect,
}) => {
  const stars = calculateStars(clearTime, levelDef.parTime, deaths, difficulty);

  useEffect(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#f59e0b', '#10b981'],
      });
    } catch {}
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 select-none pointer-events-auto animate-fade-in">
      <div className="w-full max-w-md bg-zinc-950 border border-emerald-900/60 rounded-xl p-6 md:p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col items-center text-center">
        {/* Victory Trophy Badge */}
        <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-600 flex items-center justify-center mb-3 shadow-lg">
          <Trophy className="w-7 h-7 text-emerald-400" />
        </div>

        <div className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase mb-1">
          CHAMBER CLEARED
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">
          LEVEL {levelDef.id}: {levelDef.title}
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          You survived the deception and escaped the chamber!
        </p>

        {/* 3-Star Rating Readout */}
        <div className="flex gap-2 my-5">
          {[1, 2, 3].map((starIdx) => (
            <Star
              key={starIdx}
              className={`w-9 h-9 transition-all duration-300 ${
                starIdx <= stars
                  ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                  : 'text-zinc-700'
              }`}
            />
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 w-full bg-zinc-900/80 border border-zinc-800 rounded-lg p-3 my-2 text-center">
          <div>
            <div className="text-[10px] font-mono text-zinc-400 uppercase">TIME</div>
            <div className="text-base font-bold text-white font-mono tabular-nums">
              {clearTime.toFixed(1)}s
            </div>
            <div className="text-[9px] text-zinc-500">Par: {levelDef.parTime}s</div>
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-400 uppercase">DEATHS</div>
            <div className="text-base font-bold text-red-400 font-mono tabular-nums">
              {deaths}
            </div>
            <div className="text-[9px] text-zinc-500">{deaths === 0 ? 'Flawless' : 'Attempts'}</div>
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-400 uppercase">DIFFICULTY</div>
            <div className="text-base font-bold text-amber-400 font-mono uppercase">
              {difficulty}
            </div>
            <div className="text-[9px] text-zinc-500">{stars} / 3 Stars</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full mt-5">
          <button
            data-start="true"
            onClick={() => {
              sound.playButton();
              onNextLevel();
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-black tracking-wider text-sm uppercase shadow-[0_0_20px_rgba(16,185,129,0.4)] transition active:scale-95"
          >
            <span>NEXT CHAMBER</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => {
                sound.playButton();
                onReplay();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold text-xs tracking-wider uppercase transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              REPLAY
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
