import { Redirect, Slot } from 'expo-router';

/** Developer galleries and artwork renderers — never reachable in release builds. */
export default function DevLayout() {
  if (!__DEV__) return <Redirect href="/" />;
  return <Slot />;
}
