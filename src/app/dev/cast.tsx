import { ScrollView, Text, View } from 'react-native';

import { Pip, Roo, Tilly } from '@/components/characters/Buddies';
import { Aiden, AidenFace, PEOPLE, PersonAvatar } from '@/components/characters/People';

const Box = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View style={{ alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 8 }}>
    {children}
    <Text>{label}</Text>
  </View>
);

export default function Cast() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#EAF4FD' }} contentContainerStyle={{ padding: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      <Box label="Pip"><Pip size={200} motion="off" /></Box>
      <Box label="Pip frustrated"><Pip size={200} mood="frustrated" motion="off" /></Box>
      <Box label="Tilly"><Tilly size={200} motion="off" /></Box>
      <Box label="Roo"><Roo size={200} motion="off" /></Box>
      <Box label="Aiden"><Aiden size={240} motion="off" /></Box>
      <Box label="Aiden face"><AidenFace size={120} motion="off" /></Box>
      {Object.entries(PEOPLE).map(([k, v]) => (
        <Box key={k} label={k}><PersonAvatar look={v} size={100} motion="off" /></Box>
      ))}
    </ScrollView>
  );
}
