import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import StackNavigator from './StackNavigator';
import {
  clearNavigationState,
  loadNavigationState,
  saveNavigationState,
  type PersistedNavigationState,
} from './navigationPersistence';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { checkAuthStatus } from '../store/slices/authSlice';
import { colors } from '../theme/colors';

/**
 * Boots auth, restores stack detail screens when relevant, and always opens
 * the Home tab after a cold start / reload (tab-only sessions are not restored).
 */
export default function AppNavigation() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isCheckingAuth } = useAppSelector((state) => state.auth);
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [initialState, setInitialState] = useState<
    PersistedNavigationState | undefined
  >();
  const shouldPersistRef = useRef(false);

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  useEffect(() => {
    if (isCheckingAuth) return;

    let cancelled = false;
    setIsNavigationReady(false);
    shouldPersistRef.current = false;

    (async () => {
      try {
        if (isAuthenticated) {
          const saved = await loadNavigationState();
          if (!cancelled) {
            setInitialState(saved);
          }
        } else {
          await clearNavigationState();
          if (!cancelled) {
            setInitialState(undefined);
          }
        }
      } finally {
        if (!cancelled) {
          setIsNavigationReady(true);
          shouldPersistRef.current = true;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isCheckingAuth, isAuthenticated]);

  if (isCheckingAuth || !isNavigationReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      key={isAuthenticated ? 'main' : 'auth'}
      initialState={initialState}
      onStateChange={(state) => {
        if (shouldPersistRef.current && isAuthenticated && state) {
          saveNavigationState(state);
        }
      }}
    >
      <StackNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
