import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import {
  Screen,
  AppHeader,
  Card,
  SectionHeader,
  WellnessCard,
} from '../components/ui';
import { CrisisBanner, HotlineCard } from '../components/support';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import type { RootStackParamList } from '../navigation/StackNavigator';
import { useTranslation } from '../i18n';
import { getSupportServices } from '../content/supportServices';
import { wellnessImages } from '../assets/images';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SupportCenterScreen() {
  const navigation = useNavigation<Nav>();
  const { t, language, isRTL } = useTranslation();
  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' : 'left';

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
        <SectionHeader title={t('support.disclaimerTitle')} />
      </View>
      <View style={styles.section}>
        <Card variant="outlined" style={styles.disclaimerCard}>
          <View style={[styles.disclaimerHeader, { flexDirection: rowDirection }]}>
            <View style={styles.disclaimerIcon}>
              <Ionicons
                name="information-circle"
                size={20}
                color={colors.status.infoDark}
              />
            </View>
            <Text style={[styles.disclaimerTitle, { textAlign }]}>
              {t('support.disclaimerCardTitle')}
            </Text>
          </View>
          <Text style={[styles.disclaimerText, { textAlign }]}>
            {t('support.disclaimerText')}
          </Text>
        </Card>
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
  disclaimerCard: {
    backgroundColor: colors.surfaces.cardSoft,
    borderColor: colors.status.info + '55',
  },
  disclaimerHeader: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  disclaimerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.status.info + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimerTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
  disclaimerText: {
    ...typography.bodySm,
    color: colors.text.secondary,
    lineHeight: 23,
  },
});
