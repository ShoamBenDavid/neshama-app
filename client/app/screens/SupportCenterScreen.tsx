import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  Screen,
  AppHeader,
  SectionHeader,
  WellnessCard,
} from '../components/ui';
import { CrisisBanner, HotlineCard } from '../components/support';
import { spacing } from '../theme/spacing';
import type { RootStackParamList } from '../navigation/StackNavigator';
import { useTranslation } from '../i18n';
import { getSupportServices } from '../content/supportServices';
import { wellnessImages } from '../assets/images';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SupportCenterScreen() {
  const navigation = useNavigation<Nav>();
  const { t, language } = useTranslation();

  const services = useMemo(() => getSupportServices(language), [language]);

  const helpTiles = useMemo(
    () => [
      {
        title: t('support.talkToAI'),
        subtitle: t('support.talkToAIDesc'),
        image: require('../assets/talk_to_neshama.png'),
        onPress: () => navigation.navigate('Chat'),
      },
      {
        title: t('support.browseResources'),
        subtitle: t('support.browseResourcesDesc'),
        image: require('../assets/content_library.jpeg'),
        onPress: () => navigation.navigate('ContentLibrary'),
      },
      {
        title: t('support.communitySupport'),
        subtitle: t('support.communitySupportDesc'),
        image: wellnessImages.communitySupport,
        onPress: () => navigation.navigate('MainTabs', { screen: 'Forum' }),
      },
      {
        title: t('support.writeInJournal'),
        subtitle: t('support.writeInJournalDesc'),
        image: wellnessImages.journalCushion,
        onPress: () => navigation.navigate('CreateJournal', {}),
      },
    ],
    [t, navigation],
  );

  return (
    <Screen
      gradient="moodCalm"
      scrollable
      padded={false}
      header={
        <AppHeader
          title={t('support.warmTitle')}
          subtitle={t('support.warmSubtitle')}
        />
      }
    >
      <View style={styles.section}>
        <CrisisBanner />
      </View>

      <View style={styles.sectionHeaderWrap}>
        <SectionHeader title={t('support.crisisResources')} />
      </View>
      <View style={styles.section}>
        {services.crisisResources.map((resource, idx) => (
          <HotlineCard key={`${resource.name}-${idx}`} resource={resource} />
        ))}
      </View>

      <View style={styles.sectionHeaderWrap}>
        <SectionHeader title={t('support.helpfulNow')} />
      </View>

      <View style={styles.tileGrid}>
        {helpTiles.map((tile, idx) => (
          <View key={`tile-${idx}`} style={styles.tileWrap}>
            <WellnessCard
              title={tile.title}
              subtitle={tile.subtitle}
              image={tile.image}
              size="sm"
              onPress={tile.onPress}
            />
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.base,
  },
  sectionHeaderWrap: {
    paddingHorizontal: spacing.lg,
  },
  tileGrid: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  tileWrap: {
    width: '48%',
  },
});
