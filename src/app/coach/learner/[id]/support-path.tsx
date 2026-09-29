import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChoiceChips, SectionTitle, TextField } from '@/components/coach/Form';
import { useRouteLearner } from '@/components/coach/useRouteLearner';
import { Icon } from '@/components/icons/Icon';
import { Appear, Button, Callout, Card, Header, Screen, Sheet, Tap, Txt } from '@/components/ui';
import type { NeedCategory, SupportPathPlan } from '@/engine/types';
import { successHaptic } from '@/lib/feedback';
import { useApp } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { colors, radius, shadows } from '@/theme';

const STEPS = [
  { n: 1, title: 'Understand', sub: 'What’s happening now?' },
  { n: 2, title: 'Set a Goal', sub: 'Choose a meaningful goal' },
  { n: 3, title: 'Plan Together', sub: 'Strategies & supports' },
  { n: 4, title: 'Practice', sub: 'Try and adjust' },
  { n: 5, title: 'Review', sub: 'Celebrate progress' },
] as const;

const NEEDS: { key: NeedCategory; label: string }[] = [
  { key: 'communication', label: 'Communication' },
  { key: 'movement', label: 'Movement / body input' },
  { key: 'sensory', label: 'Sensory comfort' },
  { key: 'predictability', label: 'Predictability' },
  { key: 'break', label: 'Break / escape' },
  { key: 'connection', label: 'Social connection' },
  { key: 'autonomy', label: 'Autonomy / choice' },
  { key: 'uncertain', label: 'Not sure yet' },
];

const SUPPORT_IDEAS = ['First-Then card', 'Visual schedule', 'Break card within reach', 'Help card', 'One more minute option', 'Quiet corner', 'Movement break', 'Choice board'];

function blankPlan(learnerId: string): SupportPathPlan {
  const now = new Date().toISOString();
  return {
    id: `plan-${Date.now().toString(36)}`,
    learnerId,
    pattern: { description: '', when: '', before: '', after: '' },
    possibleNeed: 'uncertain',
    preferredPath: '',
    meetsSameNeed: false,
    supports: [],
    reviewNotes: '',
    completedSteps: [],
    currentStep: 1,
    highRisk: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 34 · Support Path Planner (Framework Part IX). Never claims certainty about
 * why behaviour happens; the preferred path must meet the same possible need.
 */
export default function SupportPathPlanner() {
  const learner = useRouteLearner();
  const saved = useApp((s) => s.plans.find((p) => p.learnerId === learner.id));
  const goals = useApp(useShallow((s) => s.goals.filter((g) => g.learnerId === learner.id)));
  const savePlan = useApp((s) => s.savePlan);
  const [plan, setPlan] = useState<SupportPathPlan>(() => saved ?? blankPlan(learner.id));
  const [open, setOpen] = useState<number | null>(null);
  const goal = useMemo(() => goals.find((g) => g.id === plan.goalId), [goals, plan.goalId]);

  const update = (patch: Partial<SupportPathPlan>) => setPlan((p) => ({ ...p, ...patch, updatedAt: new Date().toISOString() }));
  const completeStep = (n: number) => {
    const next: SupportPathPlan = {
      ...plan,
      completedSteps: [...new Set([...plan.completedSteps, n])],
      currentStep: Math.min(5, n + 1) as SupportPathPlan['currentStep'],
      updatedAt: new Date().toISOString(),
    };
    setPlan(next);
    savePlan(next);
    successHaptic();
    setOpen(null);
  };

  return (
    <Screen header={<Header title="Support Path Planner" titleSize="titleSm" subtitle="Build a plan for continued growth." />} footer={<Button title="Next Step" onPress={() => setOpen(plan.currentStep)} />}>
      <View style={{ gap: 12, marginTop: 4 }}>
        {STEPS.map((s, i) => {
          const done = plan.completedSteps.includes(s.n);
          const current = plan.currentStep === s.n && !done;
          return (
            <Appear key={s.n} delay={i * 60}>
              <Tap onPress={() => setOpen(s.n)} accessibilityLabel={`Step ${s.n}: ${s.title}. ${done ? 'Done' : current ? 'Current step' : 'Upcoming'}`} style={[styles.step, current ? styles.current : null]} scale={0.98}>
                <View style={[styles.num, { backgroundColor: done ? colors.teal : current ? colors.primary : '#6F7FC2' }]}>
                  <Txt v="title" color="#FFFFFF" style={{ fontSize: 26 }}>
                    {String(s.n)}
                  </Txt>
                </View>
                <View style={{ flex: 1 }}>
                  <Txt v="heading" color="#1320C4" style={{ fontSize: 21 }}>
                    {s.title}
                  </Txt>
                  <Txt v="body" color={colors.textSoft} style={{ fontSize: 16 }}>
                    {s.sub}
                  </Txt>
                </View>
                {done ? (
                  <View style={styles.done}>
                    <Icon name="check" size={30} color="#FFFFFF" />
                  </View>
                ) : null}
              </Tap>
            </Appear>
          );
        })}
      </View>
      <Card style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16 }}>
        <Icon name="sprout" size={70} />
        <Txt v="bodyLg" color={colors.text} style={{ flex: 1, fontSize: 19 }}>
          Consistent support creates brighter tomorrows.
        </Txt>
      </Card>

      <Sheet visible={open === 1} onClose={() => setOpen(null)} title="1 · Understand" subtitle="Describe what you see — not why you think it happens.">
        <TextField label="Current pattern (observable)" value={plan.pattern.description} onChangeText={(t) => update({ pattern: { ...plan.pattern, description: t } })} placeholder="e.g. Pushes items away when screen time ends" multiline />
        <TextField label="When / where it usually happens" value={plan.pattern.when} onChangeText={(t) => update({ pattern: { ...plan.pattern, when: t } })} />
        <TextField label="What tends to happen just before" value={plan.pattern.before} onChangeText={(t) => update({ pattern: { ...plan.pattern, before: t } })} />
        <TextField label="What tends to happen right after" value={plan.pattern.after} onChangeText={(t) => update({ pattern: { ...plan.pattern, after: t } })} />
        <SectionTitle>A possible need (a guess, not a fact)</SectionTitle>
        <ChoiceChips options={NEEDS} value={plan.possibleNeed} onChange={(v) => update({ possibleNeed: v as NeedCategory })} />
        <ChoiceChips
          options={[
            { key: 'no', label: 'Everyday pattern' },
            { key: 'yes', label: 'Safety risk' },
          ]}
          value={plan.highRisk ? 'yes' : 'no'}
          onChange={(v) => update({ highRisk: v === 'yes' })}
        />
        {plan.highRisk ? <Callout tone="blush" text="This plan may require qualified professional review." style={{ marginBottom: 12 }} /> : null}
        <Button title="Save step" disabled={!plan.pattern.description.trim()} onPress={() => completeStep(1)} />
      </Sheet>

      <Sheet visible={open === 2} onClose={() => setOpen(null)} title="2 · Set a Goal" subtitle="A preferred path that meets the same possible need.">
        <TextField label="Preferred path" value={plan.preferredPath} onChangeText={(t) => update({ preferredPath: t })} placeholder="e.g. Show the break card or ask for one more minute" multiline />
        <ChoiceChips
          options={[
            { key: 'yes', label: 'Meets the same need' },
            { key: 'no', label: 'Not sure it does' },
          ]}
          value={plan.meetsSameNeed ? 'yes' : 'no'}
          onChange={(v) => update({ meetsSameNeed: v === 'yes' })}
        />
        <SectionTitle>Link to a Growth Goal</SectionTitle>
        <ChoiceChips options={goals.map((g) => ({ key: g.id, label: g.title }))} value={plan.goalId ?? ''} onChange={(v) => update({ goalId: v as string })} />
        <Button kind="soft" size="md" title="Create a new Growth Goal" onPress={() => { setOpen(null); router.push({ pathname: '/coach/goal/new', params: { learner: learner.id } }); }} style={{ marginBottom: 10 }} />
        <Button title="Save step" disabled={!plan.preferredPath.trim() || !plan.meetsSameNeed} onPress={() => completeStep(2)} />
      </Sheet>

      <Sheet visible={open === 3} onClose={() => setOpen(null)} title="3 · Plan Together" subtitle="Supports that make the preferred path easy to use.">
        <ChoiceChips multi options={SUPPORT_IDEAS.map((s) => ({ key: s, label: s }))} value={plan.supports} onChange={(v) => update({ supports: v as string[] })} />
        <Txt v="caption" color={colors.textMuted} style={{ marginBottom: 12 }}>
          Supports are never removed as a consequence, and safe self-regulation is never discouraged just because it looks unusual.
        </Txt>
        <Button title="Save step" disabled={!plan.supports.length} onPress={() => completeStep(3)} />
      </Sheet>

      <Sheet visible={open === 4} onClose={() => setOpen(null)} title="4 · Practice" subtitle="Practise the preferred path through Discover → Practice → Explore → Remember.">
        <Txt v="body" style={{ marginBottom: 12 }}>
          {goal ? `Linked goal: ${goal.title}. Missions and Real-World Quests for this goal will record evidence automatically.` : 'Link a Growth Goal in step 2 so practice turns into evidence.'}
        </Txt>
        {goal ? <Button kind="soft" size="md" title="Open goal" onPress={() => { setOpen(null); router.push({ pathname: '/coach/goal/[id]', params: { id: goal.id } }); }} style={{ marginBottom: 10 }} /> : null}
        <Button title="Mark practising" onPress={() => completeStep(4)} />
      </Sheet>

      <Sheet visible={open === 5} onClose={() => setOpen(null)} title="5 · Review" subtitle="Compare evidence over time and celebrate progress.">
        <TextField label="What changed? What helped?" value={plan.reviewNotes} onChangeText={(t) => update({ reviewNotes: t })} multiline />
        <Button title="Save review" onPress={() => completeStep(5)} />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#FFFFFF', borderRadius: radius.lg, padding: 14, minHeight: 96, ...shadows.soft },
  current: { backgroundColor: '#DDEBFD' },
  num: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  done: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
});
