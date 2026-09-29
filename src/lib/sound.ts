import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

import { selectLearner, useApp } from '@/store';

/**
 * Gentle UI sounds. Never required for meaning (Framework §42 stage 4) and
 * silenced by the sensory profile or a Quiet session.
 */
const SOURCES = {
  tap: require('../../assets/sounds/tap.wav'),
  chime: require('../../assets/sounds/chime.wav'),
  sparkle: require('../../assets/sounds/sparkle.wav'),
  whoosh: require('../../assets/sounds/whoosh.wav'),
};

export const AMBIENT = {
  rain: { label: 'Soft Rain', source: require('../../assets/sounds/rain.wav') },
  waves: { label: 'Ocean Waves', source: require('../../assets/sounds/waves.wav') },
  forest: { label: 'Forest Birds', source: require('../../assets/sounds/forest.wav') },
};

export type SoundName = keyof typeof SOURCES;

const players: Partial<Record<SoundName, AudioPlayer>> = {};

function allowed(): boolean {
  const s = useApp.getState();
  return (selectLearner(s)?.access.sensory.soundEffects ?? true) && !s.session.quiet;
}

export function playSound(name: SoundName, volume = 0.6) {
  if (!allowed()) return;
  try {
    let p = players[name];
    if (!p) {
      p = createAudioPlayer(SOURCES[name]);
      players[name] = p;
    }
    p.volume = volume;
    p.seekTo(0);
    p.play();
  } catch {
    // Sound is decoration only — ignore failures.
  }
}
