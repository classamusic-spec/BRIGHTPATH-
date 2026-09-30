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
  useTalkVoice.setState({ talking: false });
}

/** Whether the Talk board voice is speaking (lights up the speak button). */
export const useTalkVoice = create<{ talking: boolean }>(() => ({ talking: false }));

let talkTurn = 0;

/**
 * The child's own voice on the Talk board. Unlike `speak` it always speaks:
 * this is how the child talks, so Read Aloud settings never mute it and a
 * Quiet session only makes it softer. Maple's mouth stays still — it is not
 * Maple talking.
 */
export function sayAloud(text: string) {
  const s = useApp.getState();
  const l = selectLearner(s);
  const turn = ++talkTurn;
  // Callbacks from an interrupted utterance must not switch the new one off.
  const set = (talking: boolean) => {
    if (turn === talkTurn) useTalkVoice.setState({ talking });
  };
  Speech.stop();
  setSpeaking(false);
  Speech.speak(text.replace(/[“”]/g, '"'), {
    language: 'en-US',
    rate: l?.access?.processing === 'extended' ? 0.9 : 0.95,
    pitch: 1.1,
    volume: s.session.quiet ? 0.6 : 1,
    onStart: () => set(true),
    onDone: () => set(false),
    onStopped: () => set(false),
    onError: () => set(false),
  });
}
