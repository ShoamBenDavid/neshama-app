import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import ContentCard from './ContentCard';
import type { RegistryItem, CategoryMeta } from '../../content/contentRegistry';

interface ContentSectionProps {
  category: CategoryMeta;
  items: RegistryItem[];
  categoryLabel: string;
  seeAllLabel: string;
  onItemPress: (item: RegistryItem) => void;
  onSeeAll?: () => void;
}

export default function ContentSection({
  category,
  items,
  categoryLabel,
  seeAllLabel,
  onItemPress,
  onSeeAll,
}: ContentSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.categoryDot, { backgroundColor: category.gradientColors[0] }]} />
          <Text style={styles.title}>{categoryLabel}</Text>
        </View>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll} style={styles.seeAllBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.seeAllText}>{seeAllLabel}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.text.link} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContentCard item={item} onPress={() => onItemPress(item)} variant="carousel" />
        )}
        contentContainerStyle={styles.list}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    ...typography.h4,
    color: colors.text.primary,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    ...typography.captionMedium,
    color: colors.text.link,
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  separator: {
    width: spacing.md,
  },
});
