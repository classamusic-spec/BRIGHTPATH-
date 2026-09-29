import { Redirect } from 'expo-router';

/** The child experience is the front door; grown-ups enter through the Parent Gate. */
export default function Index() {
  return <Redirect href="/kid" />;
}
