import { useState } from 'react';
import { View } from 'react-native';

import { PersonAvatar, PEOPLE } from '@/components/characters/People';
import { ChoiceChips, TextField } from '@/components/coach/Form';
import { useRouteLearner } from '@/components/coach/useRouteLearner';
import { Icon } from '@/components/icons/Icon';
import { Appear, Button, Card, Header, Screen, Sheet, Tap, Txt } from '@/components/ui';
import type { Permission, TeamMember, TeamRole } from '@/engine/types';
import { useApp } from '@/store';
import { colors, radius } from '@/theme';

const PERM_LABEL: Record<Permission, string> = { owner: 'Owner', edit: 'Can Edit', view: 'Can View' };
const ROLE_TITLE: Record<TeamRole, string> = { parent: 'Parent / Caregiver', caregiver: 'Caregiver', teacher: 'Teacher', therapist: 'Therapist', coach: 'Coach' };

/** 30 · Team & Sharing — one Owner controls permissions (Framework §30). */
export default function Team() {
  const learner = useRouteLearner();
  const allTeam = useApp((s) => s.team);
  const team = allTeam.filter((m) => m.learnerIds.includes(learner.id));
  const addTeamMember = useApp((s) => s.addTeamMember);
  const updateTeamMember = useApp((s) => s.updateTeamMember);
  const removeTeamMember = useApp((s) => s.removeTeamMember);
  const [invite, setInvite] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [menu, setMenu] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<TeamRole>('teacher');
  const [perm, setPerm] = useState<Permission>('view');

  return (
    <Screen
      header={
        <Header
          title={`${learner.displayName}’s Team`}
          right={
            <Tap onPress={() => setMenu(true)} accessibilityLabel="Team options" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="dots" size={28} color={colors.cobalt} />
            </Tap>
          }
        />
      }
    >
      <View style={{ gap: 12 }}>
        {team.map((m, i) => (
          <Appear key={m.id} delay={i * 50}>
            <Card
              onPress={m.isSelf ? undefined : () => setEditing(m)}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 14 }}
              accessibilityLabel={`${m.isSelf ? 'You' : m.name}, ${m.title}, ${PERM_LABEL[m.permission]}`}
            >
              <PersonAvatar look={PEOPLE[m.avatar]} size={76} />
              <View style={{ flex: 1 }}>
                <Txt v="heading" color="#1320C4" style={{ fontSize: 21 }}>
                  {m.isSelf ? 'You' : m.name}
                </Txt>
                <Txt v="body" color={colors.textMuted} style={{ fontSize: 17 }}>
                  {m.pending ? `${m.title} · invited` : m.title}
                </Txt>
              </View>
              <View style={{ backgroundColor: '#E6EEFB', borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10 }}>
                <Txt v="label" color={colors.text} style={{ fontSize: 16 }}>
                  {PERM_LABEL[m.permission]}
                </Txt>
              </View>
            </Card>
          </Appear>
        ))}
        <Tap onPress={() => setInvite(true)} style={{ height: 64, borderRadius: radius.lg, borderWidth: 2, borderStyle: 'dashed', borderColor: '#A9C3EC', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#FFFFFF' }} accessibilityLabel="Invite someone">
          <Icon name="plus" size={26} color={colors.cobalt} />
          <Txt v="heading" color={colors.text} style={{ fontSize: 20, fontFamily: 'Nunito_700Bold' }}>
            Invite Someone
          </Txt>
        </Tap>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, backgroundColor: '#E6EFFB', borderRadius: radius.lg, padding: 18 }}>
          <Icon name="people" size={72} />
          <Txt v="bodyLg" color={colors.text} style={{ flex: 1, fontSize: 19 }}>
            Together we create a brighter tomorrow.
          </Txt>
        </View>
      </View>

      <Sheet visible={invite} onClose={() => setInvite(false)} title="Invite someone" subtitle="Invites stay on this device until sync is turned on. Nothing is sent without your OK.">
        <TextField label="Name" value={name} onChangeText={setName} placeholder="e.g. Ms. Lopez" />
        <Txt v="label" color={colors.ink} style={{ marginBottom: 6 }}>
          Role
        </Txt>
        <ChoiceChips options={(Object.keys(ROLE_TITLE) as TeamRole[]).map((k) => ({ key: k, label: ROLE_TITLE[k] }))} value={role} onChange={(v) => setRole(v as TeamRole)} />
        <Txt v="label" color={colors.ink} style={{ marginBottom: 6 }}>
          Access
        </Txt>
        <ChoiceChips
          options={[
            { key: 'view', label: 'Can View' },
            { key: 'edit', label: 'Can Edit' },
          ]}
          value={perm}
          onChange={(v) => setPerm(v as Permission)}
        />
        <Button
          title="Add to team"
          disabled={!name.trim()}
          onPress={() => {
            addTeamMember({ name: name.trim(), role, title: ROLE_TITLE[role], permission: perm, avatar: role === 'coach' ? 'jordan' : role === 'therapist' ? 'drKim' : 'mrsTaylor', learnerIds: [learner.id], pending: true, invitedAt: new Date().toISOString() });
            setName('');
            setInvite(false);
          }}
        />
      </Sheet>

      <Sheet visible={!!editing} onClose={() => setEditing(null)} title={editing?.name} subtitle={editing?.title}>
        {editing && (
          <View>
            <Txt v="label" color={colors.ink} style={{ marginBottom: 6 }}>
              Access
            </Txt>
            <ChoiceChips
              options={[
                { key: 'view', label: 'Can View' },
                { key: 'edit', label: 'Can Edit' },
              ]}
              value={editing.permission === 'owner' ? 'edit' : editing.permission}
              onChange={(v) => {
                updateTeamMember(editing.id, { permission: v as Permission });
                setEditing({ ...editing, permission: v as Permission });
              }}
            />
            <Txt v="caption" color={colors.textMuted} style={{ marginBottom: 12 }}>
              Everyone’s observations keep their source, so adults can see where evidence came from.
            </Txt>
            <Button
              kind="danger"
              title="Remove from team"
              onPress={() => {
                if (editing.learnerIds.length > 1) updateTeamMember(editing.id, { learnerIds: editing.learnerIds.filter((x) => x !== learner.id) });
                else removeTeamMember(editing.id);
                setEditing(null);
              }}
            />
          </View>
        )}
      </Sheet>

      <Sheet visible={menu} onClose={() => setMenu(false)} title="About sharing">
        <Txt v="body" color={colors.text}>
          The Owner decides who can view or edit. Disagreements about what counts as success are shown side by side — never averaged away — and can pause automatic adaptation until the team reviews together.
        </Txt>
      </Sheet>
    </Screen>
  );
}
