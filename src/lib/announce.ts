import { AccessibilityInfo, Platform } from 'react-native';
import { create } from 'zustand';

/** Latest web announcement; rendered once by the root layout in a polite live region. */
export const useAnnouncement = create<{ message: string; n: number }>(() => ({ message: '', n: 0 }));

/** Speak a short status message through the screen reader (VoiceOver, TalkBack or a web live region). */
export function announce(message: string) {
  if (Platform.OS === 'web') {
    // Clear first so repeating the same message is still announced.
    useAnnouncement.setState({ message: '' });
    setTimeout(() => useAnnouncement.setState((s) => ({ message, n: s.n + 1 })), 50);
    return;
  }
  AccessibilityInfo.announceForAccessibility(message);
}
