import type { AccessProfile, NotificationPrefs, Rewards } from '@/engine/types';

export const DEFAULT_ACCESS: AccessProfile = {
  communication: ['speech', 'picture', 'tap'],
  presentation: 'audioVisual',
  processing: 'extended',
  sensory: {
    music: false,
    soundEffects: true,
    haptics: true,
    animation: 'full',
    backgroundMotion: true,
    visualDensity: 'standard',
    celebration: 'full',
  },
  motor: { largeTargets: false, noDrag: true, simplifiedGestures: false },
  transitions: { visualSchedule: true, firstThen: true, oneMoreTurn: true, countdown: false, explicitAllDone: true },
  readAloud: false,
};

export const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  goalReminders: true,
  dailyCheckIn: true,
  progressUpdates: true,
  coachMessages: true,
  quietHours: { start: '21:00', end: '07:00' },
  reminderTimes: ['08:00', '16:30'],
};

export const EMPTY_REWARDS: Rewards = { stars: 0, badges: [], placed: [], history: [] };
