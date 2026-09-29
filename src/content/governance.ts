/**
 * Content Governance (Framework Part XII). Automates the parts of the
 * safety rubric and approval checklist that software can verify. Human review
 * stages (professional, agency, editorial) are tracked in metadata and are
 * never auto-approved.
 */
import type { Mission, MissionStep } from './types';

/** Framework §57 "Avoid" list plus punitive wording (§2.4). */
export const BANNED_WORDS = [
  'bad behavior',
  'bad behaviour',
  'normal behavior',
  'deficit',
  'failed',
  'fail',
  'wrong',
  'noncompliant',
  'non-compliant',
  'fix the child',
  'fix them',
  'manipulate',
  'extinguish',
  'obey',
  'eye contact',
  'naughty',
];

export interface GovernanceIssue {
  missionId: string;
  rule: string;
  detail: string;
}

function stepText(step: MissionStep): string[] {
  const out: string[] = [];
  for (const [, v] of Object.entries(step)) {
    if (typeof v === 'string') out.push(v);
    if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === 'string') out.push(item);
        else if (item && typeof item === 'object') for (const x of Object.values(item)) if (typeof x === 'string') out.push(x);
      }
    }
    if (v && typeof v === 'object' && !Array.isArray(v)) for (const x of Object.values(v)) if (typeof x === 'string') out.push(x);
  }
  return out;
}

export function checkMission(m: Mission): GovernanceIssue[] {
  const issues: GovernanceIssue[] = [];
  const add = (rule: string, detail: string) => issues.push({ missionId: m.id, rule, detail });

  // §41 required metadata
  const required: (keyof Mission)[] = [
    'id', 'version', 'title', 'goalFamily', 'intendedGoals', 'journeyModes', 'dimensions', 'bands', 'gameEngine', 'world',
    'modalities', 'promptLevels', 'sensoryDefaults', 'interaction', 'durationMin', 'evidenceFields', 'validityRule',
    'contextTags', 'realWorldHook', 'accessibility', 'reviewStatus', 'releaseStatus',
  ];
  for (const k of required) {
    const v = m[k];
    if (v === undefined || v === null || (Array.isArray(v) && v.length === 0) || v === '') add('metadata', `Missing ${String(k)}`);
  }

  // Multimodal communication (§2.3): never speech-only.
  if (!m.modalities.some((x) => x === 'tap' || x === 'aac' || x === 'picture' || x === 'gesture')) {
    add('multimodal', 'Mission requires speech without an alternative.');
  }
  // Tap alternative for drag (§42 stage 4).
  if (m.interaction.includes('drag') && !m.interaction.includes('tap')) add('accessibility', 'Drag interaction without a tap alternative.');
  if (!m.accessibility.some((a) => /reduced motion/i.test(a))) add('accessibility', 'Reduced Motion support not declared.');

  // Real-world transfer hook (§38).
  if (!m.steps.some((s) => s.type === 'realWorld')) add('transfer', 'No Real-World Quest step.');

  // Choice steps: at least one helpful option, gentle feedback, no single "correct" when several are valid.
  for (const s of m.steps) {
    if (s.type === 'quickChoice' || s.type === 'cardChoice') {
      if (!s.options.some((o) => o.helpful)) add('choices', `${s.id} has no helpful option.`);
      for (const o of s.options) if (!o.feedback) add('feedback', `${s.id}/${o.id} is missing gentle feedback.`);
      if (!s.evidence?.templateId) add('evidence', `${s.id} does not declare what Growth Goal it measures.`);
    }
    if ((s.type === 'practice' || s.type === 'realWorld') && !s.evidence?.templateId) add('evidence', `${s.id} does not declare evidence.`);
  }

  // Language rubric (§43, §57).
  const text = [m.title, m.summary, m.realWorldHook, ...m.steps.flatMap(stepText)].join(' \n ').toLowerCase();
  for (const w of BANNED_WORDS) {
    const re = new RegExp(`\\b${w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (re.test(text)) add('language', `Uses avoided wording: “${w}”.`);
  }

  // Never self-approve.
  if (m.releaseStatus === 'approved' && m.reviewStatus !== 'approved') add('release', 'Released as approved without an approved review.');
  return issues;
}

export function checkAll(missions: Mission[]): GovernanceIssue[] {
  const seen = new Set<string>();
  const issues: GovernanceIssue[] = [];
  for (const m of missions) {
    if (seen.has(m.id)) issues.push({ missionId: m.id, rule: 'id', detail: 'Duplicate mission id.' });
    seen.add(m.id);
    issues.push(...checkMission(m));
  }
  return issues;
}

export const REVIEW_STAGES: { key: Mission['reviewStatus']; label: string }[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'frameworkReview', label: 'Framework review' },
  { key: 'agencyReview', label: 'Neurodiversity & agency review' },
  { key: 'accessibilityReview', label: 'Accessibility review' },
  { key: 'editorialReview', label: 'Editorial & cultural review' },
  { key: 'qaReview', label: 'QA & evidence review' },
  { key: 'pilotReady', label: 'Pilot ready' },
  { key: 'approved', label: 'Approved' },
  { key: 'retired', label: 'Retired' },
];
