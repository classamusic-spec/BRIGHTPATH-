import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Fox } from '@/components/characters/fox/Fox';
import { ConfirmSheet } from '@/components/coach/ConfirmSheet';
import { EvidenceRow } from '@/components/coach/EvidenceRow';
import { ChoiceChips, TextField } from '@/components/coach/Form';
import { CardHeader } from '@/components/coach/Kit';
import { Icon } from '@/components/icons/Icon';
import { Appear, Button, Card, Header, IconTile, ProgressBar, Screen, Sheet, StatusPill, Tap, Toggle, Txt } from '@/components/ui';
import { KIND_LABEL, MODE_COPY } from '@/engine/decision';
import { CONFIDENCE_LABEL, EMERGENCE_LABELS, emergenceState, FUNCTIONAL_LABELS, functionalUseState, SUPPORT_LABELS } from '@/engine/evidence';
import { INTERVALS } from '@/engine/spaced';
import { AREA_LABEL } from '@/engine/summary';
import type { AdaptationRecord, GoalStatus, GrowthDimension, SupportLevel } from '@/engine/types';
import { goBackOr } from '@/lib/nav';
import { useApp } from '@/store';
import { useGoalView } from '@/store/derived';
import { colors, radius } from '@/theme';

const DIM_LABEL: Record<GrowthDimension, string> = {
  emergence: 'Emergence',
  reliability: 'Reliability',
  independence: 'Independence',
  flexibility: 'Flexibility',
  retention: 'Retention',
  functionalUse: 'Functional Use',
};

const STATUS_LABEL: Record<GoalStatus, string> = { draft: 'Draft', active: 'In Progress', paused: 'Paused', complete: 'Complete & Maintain', retired: 'Retired' };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Txt v="body" color={colors.textMuted} style={{ width: 120, fontSize: 17 }}>
        {label}
      </Txt>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const isLevel = (v: unknown): v is SupportLevel => typeof v === 'number' && v >= 1 && v <= 7;
const levelName = (v: AdaptationRecord['from']) => (isLevel(v) ? SUPPORT_LABELS[v] : v == null ? '—' : String(v));
const dateOf = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/** 27 · Goal Details — with the explainable "why" behind the next step. */
export default function GoalDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const view = useGoalView(id);
  const updateGoal = useApp((s) => s.updateGoal);
  const deleteGoal = useApp((s) => s.deleteGoal);
  const learner = useApp((s) => s.learners.find((l) => l.id === view?.goal.learnerId));
  const [menu, setMenu] = useState(false);
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!view) return <Redirect href="/coach/goals" />;
  const { goal, rec, summary, dims, progress } = view;
  const recent = [...view.observations].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 6);
  const areaCategory = goal.skillArea === 'communication' || goal.skillArea === 'social' ? 'Communication' : AREA_LABEL[goal.skillArea];
  const changes = [...goal.adaptations].sort((a, b) => (a.at < b.at ? 1 : -1));
  // Undo is offered on the newest support change that is still in effect.
  const undoable = changes.find((a) => isLevel(a.from) && isLevel(a.to));
  const canUndo = (a: AdaptationRecord) => a === undoable && a.to === goal.supportLevel && isLevel(a.from);
  const undo = (a: AdaptationRecord) => {
    if (!isLevel(a.from)) return;
    updateGoal(goal.id, {
      supportLevel: a.from,
      adaptations: [...goal.adaptations, { at: new Date().toISOString(), kind: 'restore', from: a.to, to: a.from, reason: 'Adult restored the earlier level.', atValidCount: summary.validCount }],
    });
  };

  return (
    <Screen
      header={
        <Header
          title="Goal Details"
          right={
            <Tap onPress={() => setMenu(true)} accessibilityLabel="Goal options" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="dots" size={30} color={colors.cobalt} />
            </Tap>
          }
        />
      }
    >
      <Appear>
        <Card style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <IconTile tone="mint" size={76} radiusPx={20}>
              <Icon name="chat" size={54} />
            </IconTile>
            <Txt v="heading" color={colors.heading} style={{ flex: 1, fontSize: 22, lineHeight: 28 }} accessibilityRole="header">
              {goal.title}
            </Txt>
            <Tap
              onPress={() => {
                setTitle(goal.title);
                setNotes(goal.notes);
                setEdit(true);
              }}
              style={{ backgroundColor: colors.primarySoft, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 }}
              accessibilityLabel="Edit goal"
            >
              <Txt v="label" color={colors.text}>
                Edit
              </Txt>
            </Tap>
          </View>
          <View style={{ marginTop: 10 }}>
            <Row label="Category">
              <Txt v="body" color={colors.textSoft} style={{ fontSize: 17 }}>
                {areaCategory}
              </Txt>
            </Row>
            <Row label="Target Date">
              <Txt v="body" color={colors.textSoft} style={{ fontSize: 17 }}>
                {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
              </Txt>
            </Row>
            <Row label="Status">
              <StatusPill label={STATUS_LABEL[goal.status]} color={goal.status === 'active' ? colors.mint : colors.textFaint} />
            </Row>
            <Row label="Notes">
              <Txt v="body" color={colors.textSoft} style={{ fontSize: 17, lineHeight: 23 }}>
                {goal.notes || `${learner?.displayName ?? 'The learner'} is practising: ${goal.observableAction}`}
              </Txt>
            </Row>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 }}>
            <Txt v="heading" color={colors.heading} style={{ fontSize: 21 }}>
              Progress
            </Txt>
            <Txt v="heading" color={colors.mintDeep} style={{ fontSize: 21 }}>{`${Math.round(progress * 100)}%`}</Txt>
          </View>
          <ProgressBar value={progress} color={colors.mint} height={16} />
          <Txt v="caption" color={colors.textMuted} style={{ marginTop: 6 }}>
            Journey progress across the six growth dimensions — not a score.
          </Txt>
        </Card>
      </Appear>

      <Appear delay={100} style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 10 }}>
        <View style={{ width: 120, height: 120, justifyContent: 'flex-end' }}>
          <Fox pose="bust" size={120} wavePaw decorative />
        </View>
        <View style={{ flex: 1, backgroundColor: '#E6EFFB', borderRadius: radius.lg, padding: 16, marginBottom: 6 }}>
          <Txt v="bodyLg" color={colors.text} style={{ fontSize: 19 }}>
            Progress looks different for everyone!
          </Txt>
        </View>
      </Appear>

      {/* Explainable recommendation (Framework §5–§8) */}
      <Appear delay={150}>
        <Card style={{ padding: 16, marginTop: 12, borderWidth: rec.kind === 'humanReview' ? 2 : 0, borderColor: colors.blush }}>
          <Txt v="caption" color={colors.textMuted}>
            SUGGESTED NEXT STEP
          </Txt>
          <Txt v="heading" color={rec.kind === 'humanReview' ? colors.alertText : colors.heading} style={{ marginTop: 2 }}>
            {KIND_LABEL[rec.kind]}
          </Txt>
          {rec.kind !== 'humanReview' ? (
            <Txt v="bodySm" color={colors.textSoft}>{`Child journey: ${MODE_COPY[rec.mode].label} — “${MODE_COPY[rec.mode].child}”`}</Txt>
          ) : null}
          <View style={{ marginTop: 10, gap: 6 }}>
            {rec.reasons.map((r) => (
              <View key={r} style={{ flexDirection: 'row', gap: 8 }}>
                <Txt v="body" color={colors.primary}>
                  •
                </Txt>
                <Txt v="body" color={colors.text} style={{ flex: 1 }}>
                  {r}
                </Txt>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            <View style={styles.meta}>
              <Txt v="caption" color={colors.text}>{`Evidence: ${CONFIDENCE_LABEL[rec.confidence]}`}</Txt>
            </View>
            <View style={styles.meta}>
              <Txt v="caption" color={colors.text}>{`${summary.validCount} valid · ${summary.accessLimited.length} access-limited`}</Txt>
            </View>
            <View style={styles.meta}>
              <Txt v="caption" color={colors.text}>{`Support now: ${SUPPORT_LABELS[goal.supportLevel]}`}</Txt>
            </View>
            <View style={styles.meta}>
              <Txt v="caption" color={colors.text}>{`Next review: ${INTERVALS[goal.spaced.index]?.label ?? '—'}`}</Txt>
            </View>
            <View style={styles.meta}>
              <Txt v="caption" color={colors.text}>{`Next practice: ${goal.spaced.nextDue ? new Date(goal.spaced.nextDue).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Not scheduled yet'}`}</Txt>
            </View>
          </View>
          {rec.checks.length ? (
            <View style={{ marginTop: 12, gap: 4 }}>
              {rec.checks.map((c) => (
                <View key={c.step} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <View style={[styles.checkDot, { backgroundColor: c.passed ? colors.mint : '#DCE3F0' }]}>
                    {c.passed ? <Icon name="check" size={12} color="#FFFFFF" /> : null}
                  </View>
                  <Txt v="caption" color={colors.textSoft} style={{ flex: 1 }}>
                    {c.question}
                  </Txt>
                </View>
              ))}
            </View>
          ) : null}
          {goal.currentPattern ? (
            <Button kind="soft" size="md" title="Open Support Path Planner" onPress={() => router.push({ pathname: '/coach/learner/[id]/support-path', params: { id: goal.learnerId } })} style={{ marginTop: 12 }} />
          ) : null}
        </Card>
      </Appear>

      <Appear delay={180}>
        <Card style={{ padding: 16, marginTop: 12 }}>
          <CardHeader title="Support changes" />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, paddingVertical: 6 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt v="label" color={colors.ink}>
                Keep this level
              </Txt>
              <Txt v="bodySm" color={colors.textSoft}>{`Stay at “${SUPPORT_LABELS[goal.supportLevel]}”. BrightPath won’t change support automatically.`}</Txt>
            </View>
            <Toggle value={!!goal.supportLocked} onChange={(v) => updateGoal(goal.id, { supportLocked: v })} label="Keep this support level" />
          </View>
          {changes.length === 0 ? (
            <Txt v="body" color={colors.textMuted} style={{ marginTop: 6 }}>
              No automatic changes yet. Any change BrightPath makes will be listed here, with the reason.
            </Txt>
          ) : (
            changes.map((a, i) => (
              <View key={`${a.at}${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.lineSoft }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt v="label" color={colors.ink}>{`${dateOf(a.at)} · ${levelName(a.from)} → ${levelName(a.to)}`}</Txt>
                  <Txt v="bodySm" color={colors.textSoft}>
                    {a.temporary ? `Short help boost. ${a.reason}` : a.reason}
                  </Txt>
                </View>
                {canUndo(a) ? (
                  <Tap onPress={() => undo(a)} accessibilityLabel={`Undo: go back to ${levelName(a.from)}`} style={{ backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 }}>
                    <Txt v="label" color={colors.primaryDeep}>
                      Undo
                    </Txt>
                  </Tap>
                ) : null}
              </View>
            ))
          )}
        </Card>
      </Appear>

      <Appear delay={200}>
        <Card style={{ padding: 16, marginTop: 12 }}>
          <Txt v="subheading" color={colors.ink} style={{ marginBottom: 10 }}>
            Six growth dimensions
          </Txt>
          {(Object.keys(DIM_LABEL) as GrowthDimension[]).map((d) => (
            <View key={d} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Txt v="label" color={colors.text}>
                  {DIM_LABEL[d]}
                </Txt>
                <Txt v="caption" color={colors.textMuted}>
                  {d === 'emergence' ? EMERGENCE_LABELS[emergenceState(summary) - 1] : d === 'functionalUse' ? FUNCTIONAL_LABELS[functionalUseState(summary) - 1] : d === 'retention' && !summary.retention.probes ? 'Not checked yet' : `${Math.round(dims[d] * 100)}%`}
                </Txt>
              </View>
              <ProgressBar value={dims[d]} color={colors.primary} height={8} />
            </View>
          ))}
        </Card>
      </Appear>

      <Appear delay={250}>
        <Card style={{ padding: 16, marginTop: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Txt v="subheading" color={colors.ink}>
              Recent evidence
            </Txt>
            <Tap onPress={() => router.push({ pathname: '/coach/learner/[id]/observe', params: { id: goal.learnerId, goal: goal.id } })} accessibilityLabel="Add observation" style={{ paddingVertical: 10, paddingLeft: 12 }}>
              <Txt v="label" color={colors.primary}>
                + Add
              </Txt>
            </Tap>
          </View>
          {recent.length === 0 ? (
            <Txt v="body" color={colors.textMuted}>
              No observations yet.
            </Txt>
          ) : (
            <View style={{ gap: 8 }}>
              {recent.map((o) => (
                <EvidenceRow key={o.id} obs={o} style={{ backgroundColor: colors.cardSoft }} />
              ))}
            </View>
          )}
        </Card>
      </Appear>

      <Sheet visible={menu} onClose={() => setMenu(false)} title="Goal options" subtitle="Goals are never completed on app accuracy alone.">
        <View style={{ gap: 10 }}>
          {goal.status !== 'active' ? <Button kind="soft" title="Resume goal" onPress={() => { updateGoal(goal.id, { status: 'active' }); setMenu(false); }} /> : <Button kind="soft" title="Pause goal" onPress={() => { updateGoal(goal.id, { status: 'paused' }); setMenu(false); }} />}
          <Button kind="soft" title="Complete & maintain" onPress={() => { updateGoal(goal.id, { status: 'complete' }); setMenu(false); }} />
          <Button kind="soft" title="Retire — no longer useful" onPress={() => { updateGoal(goal.id, { status: 'retired', flags: { ...goal.flags, noLongerUseful: true } }); setMenu(false); }} />
          <Button kind="soft" title={goal.flags.adultsDisagree ? 'Team agrees again' : 'Team disagrees on success'} onPress={() => { updateGoal(goal.id, { flags: { ...goal.flags, adultsDisagree: !goal.flags.adultsDisagree } }); setMenu(false); }} />
          <Button kind="danger" title="Delete goal" onPress={() => { setMenu(false); setConfirmDelete(true); }} />
        </View>
      </Sheet>

      <ConfirmSheet
        visible={confirmDelete}
        title="Delete this goal?"
        body={`Delete “${goal.title}”? Its ${view.observations.length} observation${view.observations.length === 1 ? '' : 's'} stay in ${learner?.displayName ?? 'the learner'}’s notes but lose their link to this goal. This can’t be undone. Retire keeps the goal and its history.`}
        confirmTitle="Delete"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          deleteGoal(goal.id);
          goBackOr('/coach/goals');
        }}
      >
        <Button
          kind="soft"
          size="md"
          title="Retire instead"
          onPress={() => {
            updateGoal(goal.id, { status: 'retired', flags: { ...goal.flags, noLongerUseful: true } });
            setConfirmDelete(false);
          }}
          style={{ marginBottom: 4 }}
        />
      </ConfirmSheet>

      <Sheet visible={edit} onClose={() => setEdit(false)} title="Edit goal">
        <TextField label="Goal name" value={title} onChangeText={setTitle} />
        <TextField label="Notes" value={notes} onChangeText={setNotes} multiline />
        <Txt v="label" color={colors.ink} style={{ marginBottom: 6 }}>
          Status
        </Txt>
        <ChoiceChips
          options={(['active', 'paused', 'complete'] as GoalStatus[]).map((s) => ({ key: s, label: STATUS_LABEL[s] }))}
          value={goal.status}
          onChange={(v) => updateGoal(goal.id, { status: v as GoalStatus })}
        />
        <Button
          title="Save"
          onPress={() => {
            updateGoal(goal.id, { title: title.trim() || goal.title, notes });
            setEdit(false);
          }}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  meta: { backgroundColor: '#EEF3FB', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  checkDot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});

