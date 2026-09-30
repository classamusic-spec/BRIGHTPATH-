import * as Speech from 'expo-speech';
import { create } from 'zustand';

import { selectLearner, useApp } from '@/store';

/** Whether Maple's voice is currently reading something aloud. */
export const useSpeaking = create<{ speaking: boolean }>(() => ({ speaking: false }));

const setSpeaking = (speaking: boolean) => useSpeaking.setState({ speaking });

const AUDIO_PRESENTATIONS = new Set(['audioVisual', 'textAudio', 'iconFirst', 'modelFirst']);

/**
 * Read text aloud. Automatic when the learner has Read Aloud on, their
 * presentation leans on audio or pictures, or they are in band A
 * (pre-readers) and the session is not Quiet; otherwise only when asked (`force`).
 */
export function speak(text: string, opts: { force?: boolean } = {}) {
  const s = useApp.getState();
  const l = selectLearner(s);
  // A Quiet session hushes the presentation-based default; an explicit Read Aloud setting is an access need and stays on.
  const byDefault = !s.session.quiet && (AUDIO_PRESENTATIONS.has(l?.access?.presentation ?? '') || l?.band === 'A');
  const auto = !!l && (!!l.access?.readAloud || byDefault);
  if (!opts.force && !auto) return;
  Speech.stop();
  Speech.speak(text.replace(/[“”]/g, '"'), {
    language: 'en-US',
    rate: l?.access?.processing === 'extended' ? 0.85 : 0.95,
    pitch: 1.05,
    onStart: () => setSpeaking(true),
    onDone: () => setSpeaking(false),
    onStopped: () => setSpeaking(false),
    onError: () => setSpeaking(false),
  });
}

export function stopSpeaking() {
  Speech.stop();
  setSpeaking(false);
}
