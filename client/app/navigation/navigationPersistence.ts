import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NavigationState, PartialState } from '@react-navigation/native';

const NAVIGATION_STATE_KEY = 'navigation_state';

/** Default bottom-tab route after a cold start / reload. */
export const DEFAULT_HOME_TAB = 'HomePage';

export type PersistedNavigationState =
  | NavigationState
  | PartialState<NavigationState>;

type NavState = NavigationState | PartialState<NavigationState>;

export async function loadNavigationState(): Promise<
  PersistedNavigationState | undefined
> {
  try {
    const json = await AsyncStorage.getItem(NAVIGATION_STATE_KEY);
    if (!json) return undefined;
    const parsed = JSON.parse(json) as PersistedNavigationState;
    return normalizeNavigationStateForLaunch(parsed);
  } catch {
    return undefined;
  }
}

export async function saveNavigationState(
  state: PersistedNavigationState | undefined,
): Promise<void> {
  try {
    if (state) {
      await AsyncStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state));
    }
  } catch {
    // Ignore storage write failures — navigation should still work.
  }
}

export async function clearNavigationState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(NAVIGATION_STATE_KEY);
  } catch {
    // Ignore storage delete failures.
  }
}

/**
 * On cold start, open Home unless the user was on a stack detail screen
 * (Chat, Settings, JournalEntry, etc.). Tab-only sessions always reset to Home.
 */
export function normalizeNavigationStateForLaunch(
  state: PersistedNavigationState | undefined,
): PersistedNavigationState | undefined {
  if (!state?.routes?.length) return undefined;

  const stackIndex = state.index ?? 0;
  const routes = state.routes;

  const isTabOnlySession =
    stackIndex === 0 &&
    routes.length === 1 &&
    routes[0].name === 'MainTabs';

  // Legacy persisted state when HomePage was a stack root screen.
  const isLegacyHomeRoot =
    stackIndex === 0 &&
    routes.length === 1 &&
    routes[0].name === 'HomePage';

  if (isTabOnlySession || isLegacyHomeRoot) {
    return undefined;
  }

  const cloned = JSON.parse(JSON.stringify(state)) as PersistedNavigationState;
  resetMainTabsToHome(cloned);
  return cloned;
}

function resetMainTabsToHome(state: NavState): void {
  if (!state.routes) return;

  for (const route of state.routes) {
    if (route.name === 'MainTabs' && route.state) {
      setActiveTab(route.state as NavState, DEFAULT_HOME_TAB);
    }
  }
}

type MutableNavState = {
  index?: number;
  routes?: Array<{
    name: string;
    state?: MutableNavState;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};

function setActiveTab(tabState: NavState, tabName: string): void {
  const mutable = tabState as MutableNavState;
  const routes = mutable.routes ?? [];
  const tabIndex = routes.findIndex((route) => route.name === tabName);
  if (tabIndex === -1) return;

  mutable.index = tabIndex;
  mutable.routes = routes.map((route) =>
    route.name === tabName ? route : { ...route, state: undefined },
  );
}
