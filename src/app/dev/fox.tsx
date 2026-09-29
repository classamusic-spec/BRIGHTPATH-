import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { Fox, type FoxPose } from '@/components/characters/fox/Fox';

const ALL: FoxPose[] = ['wave', 'walk', 'jump', 'cheer', 'meditate', 'breathe', 'read', 'sleep', 'bust', 'head'];

export default function FoxGallery() {
  const { poses, size } = useLocalSearchParams<{ poses?: string; size?: string }>();
  const list = poses ? (poses.split(',') as FoxPose[]) : ALL;
  const s = size ? Number(size) : 200;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#EAF4FD' }} contentContainerStyle={{ padding: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {list.map((p) => (
        <View key={p} style={{ alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 8 }}>
          <Fox pose={p} size={s} motion="off" wavePaw />
          <Text>{p}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
