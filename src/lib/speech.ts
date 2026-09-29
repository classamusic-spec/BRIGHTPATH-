import * as Speech from 'expo-speech';

import { selectLearner, useApp } from '@/store';

/** Read text aloud (Presentation: audio + visual / text + audio). */
export function speak(text: string, opts: { force?: boolean } = {}) {
  const s = useApp.getState();
  const l = selectLearner(s);
  const auto = l?.access.readAloud || l?.access.presentation === 'textAudio';
  if (!opts.force && !auto) return;
  Speech.stop();
  Speech.speak(text.replace(/[“”]/g, '"'), { rate: l?.access.processing === 'extended' ? 0.85 : 0.95, pitch: 1.05 });
}

export function stopSpeaking() {
  Speech.stop();
}
