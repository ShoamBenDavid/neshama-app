import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import {
  Screen,
  Header,
  EmptyState,
  WellnessCard,
  SectionHeader,
} from '../components/ui';
import ContentCarousel from '../components/content/ContentCarousel';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { useTranslation } from '../i18n';
import {
  getAllContent,
  getGroupedContent,
  CATEGORIES,
  type RegistryItem,
  type ContentCategory,
} from '../content/contentRegistry';
import { pickImageForContent } from '../assets/images';
import type { RootStackParamList } from '../navigation/StackNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ContentLibraryRoute = RouteProp<RootStackParamList, 'ContentLibrary'>;
type FilterId = 'all' | ContentCategory;

export default function ContentLibraryScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ContentLibraryRoute>();
  const { t, language, isRTL } = useTranslation();

  const [activeFilter, setActiveFilter] = useState<FilterId>(
    route.params?.initialCategory ?? 'all',
  );
  const [searchQuery, setSearchQuery] = useState('');

  const allContent = useMemo(() => getAllContent(language), [language]);
  const groupedContent = useMemo(() => getGroupedContent(language), [language]);

  const filterChips = useMemo(
    () => [
      { id: 'all' as FilterId, label: t('content.typeAll'), icon: 'grid-outline' as const },
      ...CATEGORIES.map((cat) => ({
        id: cat.id as FilterId,
        label: t(cat.labelKey),
        icon: cat.icon,
      })),
    ],
    [t],
  );

  const filteredItems = useMemo(() => {
    let items =
      activeFilter === 'all'
        ? allContent
        : allContent.filter((item) => item.category === activeFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(q)),
      );
    }

    return items;
  }, [allContent, activeFilter, searchQuery]);

  const handleItemPress = useCallback(
    (item: RegistryItem) => {
      const { screen, params } = item.navigationTarget;
      (navigation.navigate as Function)(screen, params);
    },
    [navigation],
  );

  const handleSeeAll = useCallback((categoryId: ContentCategory) => {
    setActiveFilter(categoryId);
    setSearchQuery('');
  }, []);

  const isSearching = searchQuery.trim().length > 0;
  const showGrouped = activeFilter === 'all' && !isSearching;

  return (
    <Screen gradient="dawn" scrollable={false} padded={false}contentContainerStyle={{ paddingBottom: spacing.lg }}>
      <Header
        title={t('content.resources')}
        showBack
        subtitle={t('content.resourcesSubtitle')}
      />

      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={colors.text.muted} />
          <TextInput
            style={[
              styles.searchInput,
              { textAlign: isRTL ? 'right' : 'left' },
            ]}
            placeholder={t('content.searchPlaceholder')}
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.chipsWrap}>
        <FlatList
          horizontal
          data={filterChips}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isActive = activeFilter === item.id;
            return (
              <TouchableOpacity
                style={[
                  styles.chip,
                  isActive && styles.chipActive,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}
                activeOpacity={0.85}
                onPress={() => {
                  setActiveFilter(item.id);
                  if (item.id !== 'all') setSearchQuery('');
                }}
              >
                <Ionicons
                  name={item.icon}
                  size={15}
                  color={isActive ? colors.text.inverse : colors.text.secondary}
                />
                <Text
                  style={[styles.chipText, isActive && styles.chipTextActive]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={[
            styles.chipsRow,
            isRTL ? styles.chipsRowRTL : styles.chipsRowLTR,
          ]}
          showsHorizontalScrollIndicator={false}
          style={styles.chipsContainer}
        />
      </View>

      {showGrouped ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {groupedContent.map((group) => (
            <View key={group.category.id}>
              <View style={styles.sectionHeaderWrap}>
                <SectionHeader
                  title={t(group.category.labelKey)}
                  actionLabel={t('common.seeAll')}
                  onActionPress={() => handleSeeAll(group.category.id)}
                />
              </View>
              <ContentCarousel
                items={group.items}
                onItemPress={handleItemPress}
                cardSize="md"
                limit={6}
              />
            </View>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <WellnessCard
                title={item.title}
                subtitle={item.durationLabel}
                image={pickImageForContent(item)}
                size="sm"
                duration={item.durationLabel}
                onPress={() => handleItemPress(item)}
              />
            </View>
          )}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            filteredItems.length > 0 ? (
              <Text
                style={[
                  styles.resultsCount,
                  { textAlign: isRTL ? 'right' : 'left' },
                ]}
              >
                {t('content.itemsCount', { count: filteredItems.length })}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="library-outline"
              title={t('content.noResources')}
              message={t('content.tryDifferentCategory')}
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.base,
    height: 48,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  chipsWrap: {
    height: 54,
    marginBottom: spacing.md,
    zIndex: 2,
    elevation: 2,
  },
  chipsContainer: {
    height: 54,
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: spacing.md,
  },
  chipsRow: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  chipsRowLTR: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chipsRowRTL: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    gap: spacing.xs,
    flexShrink: 0,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    ...typography.captionMedium,
    color: colors.text.secondary,
    flexShrink: 0,
    includeFontPadding: false,
  },
  chipTextActive: {
    color: colors.text.inverse,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
  sectionHeaderWrap: {
    paddingHorizontal: spacing.lg,
  },
  gridContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing['3xl'],
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  gridItem: {
    width: '48%',
  },
  resultsCount: {
    ...typography.caption,
    color: colors.text.muted,
    marginBottom: spacing.md,
  },
});
