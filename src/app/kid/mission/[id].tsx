import { Redirect, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { MissionCtx, type StepProps } from '@/components/mission/context';
import { StepCardChoice, StepQuickChoice } from '@/components/mission/StepChoices';
import { StepComplete, StepFeedback, StepSuccess } from '@/components/mission/StepCelebrate';
import { StepDetail } from '@/components/mission/StepDetail';
import { StepFirstThen } from '@/components/mission/StepFirstThen';
import { StepPractice } from '@/components/mission/StepPractice';
import { StepRealWorld } from '@/components/mission/StepRealWorld';
import { StepScenario, StepStory } from '@/components/mission/StepStory';
import { goToStep } from '@/components/mission/context';
import { missionById } from '@/content/missions';
import type { Mission } from '@/content/types';
import type { Learner } from '@/engine/types';
import { recommend } from '@/engine/decision';
import { supportForMode } from '@/engine/prompts';
import { useApp, useLearner } from '@/store';
import { useMission } from '@/store/mission';

/**
 * Screenshot tooling (dev web under Playwright) opens later steps directly;
 * there a deep link starts a run instead of redirecting to the first step.
 */
const automatedDevWeb = __DEV__ && Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.webdriver === true;

/** Opens a run for this mission and primes the in-memory mission session. */
function startRun(mission: Mission, learner: Learner): string {
  const app = useApp.getState();
  const goal = app.goals.find((g) => g.learnerId === learner.id && g.status === 'active' && g.missionIds.includes(mission.id));
  const rec = goal ? recommend(goal, app.observations.filter((o) => o.goalId === goal.id)) : null;
  const mode = rec?.mode ?? mission.journeyModes[0];
  const runId = app.startMission(mission.id);
  useMission.getState().begin({ runId, missionId: mission.id, goalId: goal?.id, mode, supportLevel: goal?.supportLevel ?? supportForMode(mode, learner.band) });
  return runId;
}

/** Mission player — renders reference screens 06–18 from mission content. */
export default function MissionScreen() {
  const { id, step } = useLocalSearchParams<{ id: string; step?: string }>();
  const mission = id ? missionById(id) : undefined;
  const learner = useLearner();
  const index = Math.max(0, Number(step ?? 0) || 0);
  const runId = useMission((s) => s.runId);
  const runMission = useMission((s) => s.missionId);

  const focused = useIsFocused();
  const startedRun = useRef<string | undefined>(undefined);

  // A run starts when the child moves on from the first step, so opening a
  // mission, deep links and Back (which lands on step 0) never create runs.
  const ensureRun = () => {
    if (!mission) return;
    const cur = useMission.getState();
    if (cur.runId && cur.missionId === mission.id) return;
    const newRun = startRun(mission, learner);
    if (index === 0) startedRun.current = newRun;
  };

  // Screenshot tooling only: a deep link to a later step starts its own run.
  useEffect(() => {
    if (automatedDevWeb && focused && index > 0 && mission && !(runId && runMission === mission.id)) startRun(mission, learner);
  }, [focused, index, runId, runMission, mission, learner]);

  // Leaving the mission from its first screen (Back, All Done) ends the run;
  // a run that was finished is left as it is.
  useEffect(
    () => () => {
      const own = startedRun.current;
      if (!own) return;
      useApp.getState().abandonRun(own);
      if (useMission.getState().runId === own) useMission.getState().end();
    },
    [],
  );

  if (!mission) return <Redirect href="/kid/quests" />;
  // A later step with no run for this mission (deep link, Back after finishing) restarts from the top.
  if (index > 0 && focused && !automatedDevWeb && (!runId || runMission !== mission.id)) return <Redirect href={{ pathname: '/kid/mission/[id]', params: { id: mission.id, step: '0' } }} />;
  const s = mission.steps[Math.min(index, mission.steps.length - 1)];
  const next = () => {
    if (index === 0) ensureRun();
    if (index + 1 < mission.steps.length) goToStep(mission.id, index + 1);
  };
  const props: StepProps = { mission, step: s, index, learner, next };

  let body: React.ReactNode = null;
  switch (s.type) {
    case 'detail':
      body = <StepDetail {...(props as StepProps<typeof s>)} />;
      break;
    case 'firstThen':
      body = <StepFirstThen {...(props as StepProps<typeof s>)} />;
      break;
    case 'scenario':
      body = <StepScenario {...(props as StepProps<typeof s>)} />;
      break;
    case 'story':
      body = <StepStory {...(props as StepProps<typeof s>)} />;
      break;
    case 'quickChoice':
      body = <StepQuickChoice key={s.id} {...(props as StepProps<typeof s>)} />;
      break;
    case 'cardChoice':
      body = <StepCardChoice key={s.id} {...(props as StepProps<typeof s>)} />;
      break;
    case 'success':
      body = <StepSuccess {...(props as StepProps<typeof s>)} />;
      break;
    case 'practice':
      body = <StepPractice key={s.id} {...(props as StepProps<typeof s>)} />;
      break;
    case 'feedback':
      body = <StepFeedback {...(props as StepProps<typeof s>)} />;
      break;
    case 'complete':
      body = <StepComplete {...(props as StepProps<typeof s>)} />;
      break;
    case 'realWorld':
      body = <StepRealWorld {...(props as StepProps<typeof s>)} />;
      break;
  }
  return <MissionCtx.Provider value={{ mission, index }}>{body}</MissionCtx.Provider>;
}
