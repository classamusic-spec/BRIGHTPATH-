import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

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
import { recommend } from '@/engine/decision';
import { supportForMode } from '@/engine/prompts';
import { useApp, useLearner } from '@/store';
import { useMission } from '@/store/mission';

/** Mission player — renders reference screens 06–18 from mission content. */
export default function MissionScreen() {
  const { id, step } = useLocalSearchParams<{ id: string; step?: string }>();
  const mission = id ? missionById(id) : undefined;
  const learner = useLearner();
  const index = Math.max(0, Number(step ?? 0) || 0);
  const runId = useMission((s) => s.runId);
  const runMission = useMission((s) => s.missionId);

  // Start (or resume) a run when a mission opens.
  useEffect(() => {
    if (!mission) return;
    if (runId && runMission === mission.id) return;
    const app = useApp.getState();
    const goals = app.goals.filter((g) => g.learnerId === learner.id && g.status === 'active' && g.missionIds.includes(mission.id));
    const goal = goals[0];
    const rec = goal ? recommend(goal, app.observations.filter((o) => o.goalId === goal.id)) : null;
    const mode = rec?.mode ?? mission.journeyModes[0];
    const newRun = app.startMission(mission.id);
    useMission.getState().begin({
      runId: newRun,
      missionId: mission.id,
      goalId: goal?.id,
      mode,
      supportLevel: goal?.supportLevel ?? supportForMode(mode, learner.band),
    });
  }, [mission, runId, runMission, learner.id, learner.band]);

  if (!mission) return <Redirect href="/kid/quests" />;
  const s = mission.steps[Math.min(index, mission.steps.length - 1)];
  const next = () => {
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
