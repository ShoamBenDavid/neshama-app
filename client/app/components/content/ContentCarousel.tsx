import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { spacing } from '../../theme/spacing';
import { useTranslation } from '../../i18n';
import WellnessCard from '../ui/WellnessCard';
import type { RegistryItem } from '../../content/contentRegistry';
import { pickImageForContent } from '../../assets/images';

interface ContentCarouselProps {
  items: RegistryItem[];
  onItemPress: (item: RegistryItem) => void;
  /** Card size to render. */
  cardSize?: 'sm' | 'md' | 'lg';
  /** Show lock badge on all items (e.g. preview-only feed). */
  lockAll?: boolean;
  /** Maximum items to render. */
  limit?: number;
}

/**
 * Horizontal carousel of `WellnessCard`s built from registry items. Picks an
 * image automatically — one curated Unsplash photo per content item.
 */
export default function ContentCarousel({
  items,
  onItemPress,
  cardSize = 'md',
  lockAll = false,
  limit,
}: ContentCarouselProps) {
  const { isRTL } = useTranslation();
  const visible = limit ? items.slice(0, limit) : items;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.row,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
      ]}
      ref={(ref) => {
        if (ref && isRTL) {
          ref.scrollToEnd({ animated: false });
        }
      }}
    >
      {visible.map((item) => {
        const image = pickImageForContent(item);
        return (
          <View key={item.id} style={styles.cardWrap}>
            <WellnessCard
              title={item.title}
              subtitle={item.durationLabel}
              image={image}
              duration={item.durationLabel}
              locked={lockAll}
              size={cardSize}
              onPress={() => onItemPress(item)}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  cardWrap: {
    // marginEnd handled by `gap` above for newer RN versions
  },
});
