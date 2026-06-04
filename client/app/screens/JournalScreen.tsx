import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  Screen,
  AppHeader,
  LoadingState,
  ErrorState,
  EmptyState,
  FloatingButton,
} from '../components/ui';
import JournalEntryCard from '../components/JournalEntryCard';
import { JournalHeroCard } from '../components/journal';
import { spacing } from '../theme/spacing';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchJournalEntries } from '../store/slices/journalSlice';
import { useTranslation } from '../i18n';
import type { RootStackParamList } from '../navigation/StackNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function JournalScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { entries, isLoading, error } = useAppSelector(
    (state) => state.journal,
  );
  const { t } = useTranslation();

  const loadEntries = useCallback(() => {
    dispatch(fetchJournalEntries({}));
  }, [dispatch]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadEntries);
    return unsubscribe;
  }, [navigation, loadEntries]);

  if (isLoading && entries.length === 0) {
    return <LoadingState message={t('journal.loadingJournal')} />;
  }

  if (error && entries.length === 0) {
    return <ErrorState message={error} onRetry={loadEntries} />;
  }

  return (
    <Screen
      scrollable={false}
      padded={false}
      header={
        <AppHeader
          title={t('journal.mySafePlace')}
          subtitle={t('journal.safeSpaceMessage')}
          eyebrow={t('journal.entriesCount', { count: entries.length })}
        />
      }
    >
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <JournalHeroCard
            onPress={() => navigation.navigate('CreateJournal', {})}
          />
        }
        renderItem={({ item }) => (
          <JournalEntryCard
            entry={item}
            onPress={() =>
              navigation.navigate('JournalEntry', { entryId: item.id })
            }
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="book-outline"
            title={t('journal.noEntries')}
            message={t('journal.noEntriesSubtitle')}
            actionLabel={t('journal.writeFirstEntry')}
            onAction={() => navigation.navigate('CreateJournal', {})}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['5xl'],
  },
  fabWrap: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
  },
});
