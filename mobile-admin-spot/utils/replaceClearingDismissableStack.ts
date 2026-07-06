import { CommonActions } from "@react-navigation/native";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { store } from "expo-router/build/global-state/router-store";

export function replaceClearingDismissableStack(href: Href) {
  const nav = store.navigationRef;
  if (!nav.isReady()) {
    router.replace(href);
    return;
  }
  const nextState = store.getStateForHref(href);
  if (!nextState) {
    router.replace(href);
    return;
  }
  nav.dispatch(CommonActions.reset(nextState));
}
