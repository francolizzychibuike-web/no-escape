/**
 * NO ESCAPE - 50 Level & 5 Chapter Selector Modal
 */

import React, { useState } from 'react';
import { X, Star, Lock, Unlock, Play, ShieldAlert, Award } from 'lucide-react';
import { LevelProgress } from '../game/types';
import { LEVELS } from '../game/levels';
import { CHAPTER_NAMES } from '../game/rules';
import { sound } from '../game/audio';

interface LevelSelectModalProps {
  currentLevelId: number;
  progress: Record<number, LevelProgress>;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  currentLevelId,
  progress,
  onSelectLevel,
  onClose,
}) => {
  const [activeChapter, setActiveChapter] = useState(Math.ceil(currentLevelId / 10));
  const [unlockAll, setUnlockAll] = useState(true); // Free play toggle for instant review

  const chapterLevels = LEVELS.filter((l) => l.chapter === activeChapter);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 select-none pointer-events-auto animate-fade-in">
      <div className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-xl p-5 md:p-7 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <div className="text-xs font-mono font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> 50 CHAMBERS OF DECEIT
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              SELECT LEVEL
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setUnlockAll(!unlockAll)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white transition"
              title="Toggle Unlock All for immediate level testing"
            >
              {unlockAll ? <Unlock className="w-3.5 h-3.5 text-amber-400" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{unlockAll ? 'ALL UNLOCKED (TEST MODE)' : 'PROGRESSION MODE'}</span>
            </button>
            <button
              onClick={() => {
                sound.playButton();
                onClose();
              }}
              aria-label="Close"
              className="p-2 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chapter Tabs */}
        <div className="grid grid-cols-5 gap-1.5 md:gap-2 my-4">
          {CHAPTER_NAMES.map((chapName, idx) => {
            const chapNum = idx + 1;
            const isSelected = activeChapter === chapNum;
            return (
              <button
                key={chapNum}
                onClick={() => {
                  sound.playButton();
                  setActiveChapter(chapNum);
                }}
                className={`py-2 px-1.5 md:px-3 rounded text-center transition flex flex-col items-center ${
                  isSelected
                    ? 'bg-red-950/80 border border-red-600 text-white shadow-lg'
                    : 'bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="text-[10px] font-mono font-bold text-red-400 uppercase">
                  CH. {chapNum}
                </span>
                <span className="text-[11px] font-bold tracking-tight truncate w-full hidden sm:block">
                  {chapName}
                </span>
              </button>
            );
          })}
        </div>

        {/* 10 Level Cards Grid for Current Chapter */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pr-1 py-1">
          {chapterLevels.map((lvl) => {
            const lvlProg = progress[lvl.id] || { unlocked: false, stars: 0, bestTime: 0 };
            const isUnlocked = unlockAll || lvlProg.unlocked || lvl.id === 1;
            const isCurrent = currentLevelId === lvl.id;

            return (
              <button
                key={lvl.id}
                disabled={!isUnlocked}
                onClick={() => {
                  sound.playButton();
                  onSelectLevel(lvl.id);
                  onClose();
                }}
                className={`p-3.5 rounded-lg border text-left flex flex-col justify-between transition relative overflow-hidden group ${
                  isCurrent
                    ? 'bg-zinc-900 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)] ring-1 ring-red-500'
                    : isUnlocked
                    ? 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/80'
                    : 'bg-zinc-950/40 border-zinc-900 opacity-50 cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-red-400">
                      LVL {lvl.id}
                    </span>
                    {isUnlocked ? (
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= lvlProg.stars
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-zinc-700'
                            }`}
                          />
                        ))}
                      </div>
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-zinc-600" />
                    )}
                  </div>
                  <div className="text-sm font-bold text-zinc-100 group-hover:text-red-400 transition leading-tight">
                    {lvl.title}
                  </div>
                  <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                    {lvl.subtitle}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>Par: {lvl.parTime}s</span>
                  {lvlProg.bestTime > 0 && (
                    <span className="text-emerald-400 font-bold">{lvlProg.bestTime.toFixed(1)}s</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-4 mt-2 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>Total Levels: 50 | Chapters: 5</span>
          <span className="text-zinc-400">Select any chamber to enter directly</span>
        </div>
      </div>
    </div>
  );
};
