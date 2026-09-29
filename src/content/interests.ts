import type { InterestId } from '@/engine/types';

export interface InterestOption {
  id: InterestId;
  label: string;
  featured?: boolean;
}

export const INTERESTS: InterestOption[] = [
  { id: 'animals', label: 'Animals', featured: true },
  { id: 'art', label: 'Art', featured: true },
  { id: 'sports', label: 'Sports', featured: true },
  { id: 'music', label: 'Music', featured: true },
  { id: 'nature', label: 'Nature & Outdoors' },
  { id: 'books', label: 'Books & Stories' },
  { id: 'building', label: 'Building & Creating' },
  { id: 'helping', label: 'Helping Others' },
  { id: 'trains', label: 'Trains & Vehicles' },
  { id: 'water', label: 'Water Play' },
  { id: 'movement', label: 'Movement & Dance' },
];

export function interestLabel(id: InterestId): string {
  return INTERESTS.find((i) => i.id === id)?.label ?? id;
}
