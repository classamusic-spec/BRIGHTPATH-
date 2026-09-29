# BrightPath

**Play. Practice. Feel Good.** BrightPath is a strengths-based learning app for
social, emotional and everyday life skills. Children practise with Finn the fox
in short, calm missions; parents, caregivers and coaches get plain-language
evidence, explainable next steps and planning tools.

BrightPath is **educational, not diagnostic or clinical**. It never labels a
child, and every recommendation shows the evidence and reasons behind it.

This repository implements the _BrightPath Framework v2_ and the 40 screens of
the v2 UI/UX boards as an [Expo](https://expo.dev) app for iOS and Android
(with a web preview for review).

## Run it

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npx expo start        # press i (iOS simulator), a (Android emulator) or w (web)
```

Scan the QR code with **Expo Go** (SDK 57) to run it on a phone — every native
module used here ships with Expo Go, so no custom build is needed.

| Command             | What it does                        |
| ------------------- | ----------------------------------- |
| `npm test`          | Engine and content-governance tests |
| `npm run typecheck` | TypeScript (`tsc --noEmit`)         |
| `npm run lint`      | ESLint via `expo lint`              |

Store builds use EAS: `npx eas-cli@latest build -p ios` / `-p android`
(requires an Expo account).

## A quick tour

The app opens on the child's side. The gear on the World Map leads to the
**parent gate** (type the three numbers shown as words) and the Parent/Coach
side. The app starts with demo data for a learner called Alex so every screen
has something to show; adults can delete it (or load it again) from
**Data & Privacy**.

| Board | Screen                                                  | Route                                                                      |
| ----- | ------------------------------------------------------- | -------------------------------------------------------------------------- |
| 01–05 | Splash, Choose Buddy, Readiness Check, World Map, Quests | `/kid`, `/kid/buddy`, `/kid/checkin`, `/kid/home`, `/kid/quests`            |
| 06–09 | In-Game Scenario → Choose → Success → Real-World Quest   | `/kid/mission/pip-tower` (steps advance in place)                           |
| 10    | Calm Space (breathing, quiet sounds, messages, focus)   | `/kid/calm`                                                                |
| 11–18 | Mission Detail → First-Then → Story → Choice → Supported Try → Feedback → Complete → Family Quest | `/kid/mission/be-kind-home`         |
| 19–20 | Rewards / My Room, All Done                             | `/kid/room`, `/kid/done`                                                   |
| 21–22 | Parent Gate, Coach Dashboard                            | `/gate`, `/coach`                                                          |
| 23–25 | Learner Overview, Access Profile, Interests             | `/coach/learner/[id]`, `…/access`, `…/interests`                           |
| 26–28 | Create Growth Goal, Goal Details, Add an Observation     | `/coach/goal/new`, `/coach/goal/[id]`, `…/observe`                         |
| 29–31 | Weekly Summary, Team & Sharing, Growth Map              | `…/weekly`, `…/team`, `…/growth-map`                                       |
| 32–34 | Context Matrix, Real-World Observation, Support Path    | `…/context`, `…/real-world`, `…/support-path`                              |
| 35–36 | Rewards / Profile, Progress Report                      | `…/profile` (also `/kid/profile`), `…/report`                              |
| 37–40 | Data & Privacy, Settings, Notifications, Coach Insights | `/coach/privacy`, `/coach/settings`, `/coach/notifications`, `…/insights`  |

Five missions are included: _Be Kind at Home_, _Pip's Tower_, _Help Hero_,
_Routine Road_ and _Flexi-Fix_.

## Finn and friends

Finn is a layered vector rig (`react-native-svg`) animated on the UI thread
with Reanimated: breathing, blinking, ear twitches, tail sway and an idle bob
run all the time, and poses cover waving, walking, jumping, cheering,
meditating (he breathes with the Calm Space guide), reading (pages flip) and
sleeping. Tapping Finn makes him hop and smile. Pip the penguin, Tilly the
turtle, Roo the puppy and Aiden are rigged the same way, and the scenery
(clouds, trees, rivers, flags, fireflies) moves gently.

All motion respects the phone's **Reduce Motion** setting, the learner's
sensory profile (full, gentle or off) and a **Quiet** session.

In development builds `/dev/fox` and `/dev/cast` show every pose, and
`/dev/icon` renders the app icon and splash artwork from the same rig.

## How the framework maps to the code

| Framework idea | Where it lives |
| --- | --- |
| Opportunity events that separate access from performance; access-limited moments never count as failure | `src/engine/evidence.ts` |
| Six growth dimensions and explainable decision rules (Discover → Practice → Explore → Remember, support changes, human review) with plain-language reasons and confidence | `src/engine/decision.ts` |
| Support ladder and fading, spaced "Remember" practice, presentation bands, readiness check | `src/engine/prompts.ts`, `spaced.ts`, `bands.ts`, `readiness.ts` |
| Context Matrix and adult summaries, reports and insights (observational wording, linked to raw evidence) | `src/engine/context.ts`, `summary.ts` |
| Content governance: banned wording, required fields, versioning, human review stages that are never auto-approved | `src/content/governance.ts` |
| Missions, quests, curriculum templates, rewards | `src/content/` |
| Local-first state, demo seed, derived views | `src/store/` |

Design principles carried through every screen:

- **Agency tools are always one tap away** (the hand button): Break, Help,
  More Time, Stop, Not Yet, Quiet Please and My Choice. Using them is never
  penalised.
- **No punitive mechanics**: no red crosses, streaks, forced timers,
  leaderboards or lost rewards. Stars are never taken away and are kept
  separate from evidence.
- **Every way of communicating counts equally** (speech, AAC, pictures,
  gesture, tap, typing), with read-aloud on every scenario.
- **Privacy**: a display name is all BrightPath needs (age and grade are
  optional); no ads, no child chat and no third-party analytics. Data stays on the device and can be exported as JSON
  or deleted from Data & Privacy. Photos stay on the device and voice notes are
  never recorded.
- **AI is optional**: nothing in the app depends on an AI service.

## Project layout

```
src/app/          routes (expo-router): kid/, coach/, gate, dev/
src/components/   ui/ (design system), characters/, scenery/, mission/, kid/, coach/, shared/, icons/
src/engine/       evidence, decisions, prompts, spacing, bands, context, summaries (+ tests)
src/content/      missions, quests, curriculum, rewards, governance
src/store/        zustand store, seed data, derived selectors
src/lib/          motion, sound, speech, haptics, text fitting
src/theme/        colours, typography, spacing, shadows
assets/           icons, splash, sounds
```

## Status and known limits

This is a working pilot build: all 40 screens and the engines are implemented,
and the engine rules are covered by unit tests. Before a real pilot:

- **Single device only.** There are no accounts, cloud sync or shared team
  access yet; team invites are recorded locally.
- **Reminders are preferences only.** Push notifications are not sent yet
  (that needs `expo-notifications` and scheduling).
- **Thresholds need validation.** Decision thresholds are product heuristics,
  exposed in code so they can be tuned with pilot data. Professional and
  editorial review stages in content governance are placeholders for people.
- **Not a clinical tool.** The Support Path Planner asks for qualified
  professional review whenever a plan involves safety risk.
- **Accessibility** has screen-reader labels, Reduce Motion support and text
  scaling up to 1.4×, but has not had a formal audit yet.
- **Sounds** are simple generated tones.
- Visual fidelity to the boards was reviewed on the web preview at iPhone
  sizes (390×844 and 375×667); check it on real devices before release.
