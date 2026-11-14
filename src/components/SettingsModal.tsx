/**
 * NO ESCAPE - Settings & Configuration Modal
 */

import React from 'react';
import { X, Volume2, Monitor, Gamepad2, Sliders, Shield } from 'lucide-react';
import { GameSettings, Difficulty } from '../game/types';
import { sound } from '../game/audio';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const difficulties: { id: Difficulty; label: string }[] = [
    { id: 'easy', label: 'EASY' },
    { id: 'normal', label: 'NORMAL' },
    { id: 'hard', label: 'HARD' },
    { id: 'nightmare', label: 'NIGHTMARE' },
  ];

  const graphicsProfiles: { id: 'low' | 'medium' | 'high' | 'ultra'; label: string }[] = [
    { id: 'low', label: 'LOW' },
    { id: 'medium', label: 'MED' },
    { id: 'high', label: 'HIGH' },
    { id: 'ultra', label: 'ULTRA' },
  ];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none pointer-events-auto animate-fade-in">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl p-6 md:p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-black text-white tracking-tight">
              GAME CONFIGURATION
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playButton();
              onClose();
            }}
            aria-label="Close"
            className="p-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Difficulty */}
        <div className="mb-5">
          <div className="text-xs font-mono font-bold text-zinc-400 uppercase mb-2 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-red-400" /> DIFFICULTY LEVEL
          </div>
          <div className="grid grid-cols-4 gap-2">
            {difficulties.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  sound.playButton();
                  onUpdateSettings({ difficulty: d.id });
                }}
                className={`py-2 px-2 rounded border text-xs font-mono font-bold transition ${
                  settings.difficulty === d.id
                    ? 'bg-red-950/80 border-red-600 text-white shadow-md'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Graphics Profile */}
        <div className="mb-5">
          <div className="text-xs font-mono font-bold text-zinc-400 uppercase mb-2 flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-blue-400" /> GRAPHICS PROFILE
          </div>
          <div className="grid grid-cols-4 gap-2">
            {graphicsProfiles.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  sound.playButton();
                  onUpdateSettings({ graphicsQuality: g.id });
                }}
                className={`py-2 px-2 rounded border text-xs font-mono font-bold transition ${
                  settings.graphicsQuality === g.id
                    ? 'bg-blue-950/80 border-blue-600 text-white shadow-md'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Audio Volume Sliders */}
        <div className="mb-5 space-y-3">
          <div className="text-xs font-mono font-bold text-zinc-400 uppercase flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" /> AUDIO MIXER
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Master Volume</span>
              <span className="font-mono">{Math.round(settings.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.masterVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdateSettings({ masterVolume: val });
                sound.setVolumes(val, settings.sfxVolume, settings.ambientVolume);
              }}
              className="w-full accent-red-500 bg-zinc-800 h-1.5 rounded cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>SFX & Traps</span>
              <span className="font-mono">{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdateSettings({ sfxVolume: val });
                sound.setVolumes(settings.masterVolume, val, settings.ambientVolume);
              }}
              className="w-full accent-red-500 bg-zinc-800 h-1.5 rounded cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Horror Ambient Drone</span>
              <span className="font-mono">{Math.round(settings.ambientVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.ambientVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdateSettings({ ambientVolume: val });
                sound.setVolumes(settings.masterVolume, settings.sfxVolume, val);
              }}
              className="w-full accent-red-500 bg-zinc-800 h-1.5 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Controls & Touch Mode */}
        <div className="mb-5 space-y-3">
          <div className="text-xs font-mono font-bold text-zinc-400 uppercase flex items-center gap-1.5">
            <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" /> INPUT PREFERENCES
          </div>

          <label className="flex items-center justify-between p-2.5 rounded bg-zinc-900/60 border border-zinc-800 cursor-pointer">
            <span className="text-xs text-zinc-300">Show On-Screen Virtual Controls</span>
            <input
              type="checkbox"
              checked={settings.showMobileControls}
              onChange={(e) => onUpdateSettings({ showMobileControls: e.target.checked })}
              className="accent-red-500 w-4 h-4 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded bg-zinc-900/60 border border-zinc-800 cursor-pointer">
            <span className="text-xs text-zinc-300">Invert Camera Y-Axis</span>
            <input
              type="checkbox"
              checked={settings.invertY}
              onChange={(e) => onUpdateSettings({ invertY: e.target.checked })}
              className="accent-red-500 w-4 h-4 rounded"
            />
          </label>
        </div>

        {/* Done Button */}
        <button
          onClick={() => {
            sound.playButton();
            onClose();
          }}
          className="w-full py-3 px-4 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wider uppercase transition"
        >
          APPLY & CLOSE
        </button>
      </div>
    </div>
  );
};
