import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Screen,
  Header,
  Card,
  SectionHeader,
  LinkRow,
} from '../components/ui';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { useTranslation } from '../i18n';
import type { RootStackParamList } from '../navigation/StackNavigator';

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '1';

type Props = NativeStackScreenProps<RootStackParamList, 'AboutNeshama'>;

interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  description: string;
  rowDirection: 'row' | 'row-reverse';
  textAlign: 'left' | 'right';
}

function FeatureItem({
  icon,
  iconColor,
  title,
  description,
  rowDirection,
  textAlign,
}: FeatureItemProps) {
  return (
    <View style={[featureStyles.row, { flexDirection: rowDirection }]}>
      <View
        style={[
          featureStyles.iconWrap,
          { backgroundColor: iconColor + '15' },
        ]}
      >
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={featureStyles.content}>
        <Text style={[featureStyles.title, { textAlign }]}>{title}</Text>
        <Text style={[featureStyles.description, { textAlign }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

export default function AboutNeshamaScreen({ navigation }: Props) {
  const { t, isRTL } = useTranslation();
  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' : 'left';

  const handleOpenLink = (type: 'terms' | 'privacy' | 'licenses') => {
    const urls = {
      terms: 'https://neshamaapp.com/terms',
      privacy: 'https://neshamaapp.com/privacy',
      licenses: 'https://neshamaapp.com/licenses',
    };
    Linking.openURL(urls[type]).catch(() => {});
  };

  const handleContactEmail = () => {
    Linking.openURL(`mailto:${t('aboutApp.email')}`).catch(() => {});
  };

  return (
    <Screen header={<Header title={t('aboutApp.title')} showBack />}>
      <Card style={styles.brandCard} padded={false}>
        <View style={styles.brandInner}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>{t('welcome.appName')}</Text>
          <Text style={styles.tagline}>{t('welcome.tagline')}</Text>
          <View style={styles.versionPill}>
            <Text style={styles.versionPillText}>v{APP_VERSION}</Text>
          </View>
        </View>
      </Card>

      <SectionHeader title={t('aboutApp.mission')} />
      <Card style={styles.card}>
        <Text style={[styles.missionText, { textAlign }]}>
          {t('aboutApp.missionText')}
        </Text>
      </Card>

      <SectionHeader title={t('aboutApp.whatWeOffer')} />
      <Card style={styles.card}>
        <FeatureItem
          icon="chatbubble-ellipses"
          iconColor={colors.primary}
          title={t('aboutApp.featureChat')}
          description={t('aboutApp.featureChatDesc')}
          rowDirection={rowDirection}
          textAlign={textAlign}
        />
        <View style={styles.divider} />
        <FeatureItem
          icon="book"
          iconColor={colors.accent}
          title={t('aboutApp.featureJournal')}
          description={t('aboutApp.featureJournalDesc')}
          rowDirection={rowDirection}
          textAlign={textAlign}
        />
        <View style={styles.divider} />
        <FeatureItem
          icon="leaf"
          iconColor={colors.status.successDark}
          title={t('aboutApp.featureCalm')}
          description={t('aboutApp.featureCalmDesc')}
          rowDirection={rowDirection}
          textAlign={textAlign}
        />
        <View style={styles.divider} />
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('MainTabs', { screen: 'Forum' })
          }
          activeOpacity={0.7}
        >
          <FeatureItem
            icon="people"
            iconColor={colors.status.warningDark}
            title={t('aboutApp.featureCommunity')}
            description={t('aboutApp.featureCommunityDesc')}
            rowDirection={rowDirection}
            textAlign={textAlign}
          />
        </TouchableOpacity>
      </Card>

      <SectionHeader title={t('aboutApp.version')} />
      <Card style={styles.card}>
        <View style={[styles.versionRow, { flexDirection: rowDirection }]}>
          <Text style={[styles.versionLabel, { textAlign }]}>
            {t('aboutApp.version')}
          </Text>
          <Text style={styles.versionValue}>{APP_VERSION}</Text>
        </View>
        <View style={styles.divider} />
        <View style={[styles.versionRow, { flexDirection: rowDirection }]}>
          <Text style={[styles.versionLabel, { textAlign }]}>
            {t('aboutApp.buildNumber')}
          </Text>
          <Text style={styles.versionValue}>{BUILD_NUMBER}</Text>
        </View>
      </Card>

      <SectionHeader title={t('aboutApp.team')} />
      <Card style={styles.card}>
        <View style={[styles.teamRow, { flexDirection: rowDirection }]}>
          <View style={styles.teamIconWrap}>
            <Ionicons name="heart" size={22} color={colors.status.error} />
          </View>
          <Text style={[styles.teamText, { textAlign }]}>
            {t('aboutApp.teamDesc')}
          </Text>
        </View>
      </Card>

      <SectionHeader title={t('aboutApp.contact')} />
      <Card style={styles.card} padded={false}>
        <Text style={[styles.contactDesc, { textAlign }]}>
          {t('aboutApp.contactDesc')}
        </Text>
        <View style={styles.contactDivider} />
        <View style={styles.rowWrap}>
          <LinkRow
            icon="mail-outline"
            iconColor={colors.primary}
            label={t('aboutApp.email')}
            onPress={handleContactEmail}
          />
        </View>
      </Card>

      <View style={[styles.footer, { flexDirection: rowDirection }]}>
        <Ionicons name="heart" size={14} color={colors.status.error} />
        <Text style={styles.footerText}>{t('aboutApp.madeWith')}</Text>
      </View>
    </Screen>
  );
}

const featureStyles = StyleSheet.create({
  row: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  description: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
});

const styles = StyleSheet.create({
  brandCard: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    backgroundColor: colors.brand.lavenderMist,
    ...shadows.sm,
  },
  brandInner: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  logoContainer: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  logo: {
    width: 60,
    height: 60,
  },
  appName: {
    ...typography.h2,
    color: colors.text.primary,
  },
  tagline: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  versionPill: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  versionPillText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  card: {
    marginBottom: spacing.sm,
  },
  missionText: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  versionRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  versionLabel: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
  },
  versionValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  teamRow: {
    alignItems: 'center',
  },
  teamIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.status.error + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: spacing.md,
  },
  teamText: {
    ...typography.bodySm,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 22,
  },
  contactDesc: {
    ...typography.bodySm,
    color: colors.text.secondary,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    lineHeight: 22,
  },
  contactDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginTop: spacing.sm,
  },
  rowWrap: {
    paddingHorizontal: spacing.base,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  footerText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
});
