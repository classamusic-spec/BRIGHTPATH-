import { router, type Href } from 'expo-router';

/** Go back when there is history (normal flow); otherwise replace with `href` (deep link or refresh). */
export function goBackOr(href: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(href);
}
