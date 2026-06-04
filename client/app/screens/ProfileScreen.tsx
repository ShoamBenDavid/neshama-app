import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  Header,
  Card,
  Button,
  LinkRow,
} from '../components/ui';
import StatCard from '../components/StatCard';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logoutUser } from '../store/slices/authSlice';
import { fetchJournalStats } from '../store/slices/journalSlice';
import type { RootStackParamList } from '../navigation/StackNavigator';
import { useTranslation } from '../i18n';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  onPress: () => void;
}

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { stats } = useAppSelector((state) => state.journal);
  const { t, isRTL } = useTranslation();

  useEffect(() => {
    dispatch(fetchJournalStats());
  }, [dispatch]);

  const handleLogout = () => {
    Alert.alert(t('profile.logOut'), t('profile.logOutConfirmation'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.logOut'),
        style: 'destructive',
        onPress: () => dispatch(logoutUser()),
      },
    ]);
  };

  const accountItems: MenuItem[] = [
    {
      icon: 'settings-outline',
      iconColor: colors.primary,
      label: t('profile.settingsMenu'),
      onPress: () => navigation.navigate('Settings'),
    },
    {
      icon: 'notifications-outline',
      iconColor: colors.accentDark,
      label: t('profile.notifications'),
      onPress: () => navigation.navigate('NotificationOptions'),
    },
    {
      icon: 'shield-checkmark-outline',
      iconColor: colors.status.successDark,
      label: t('profile.privacySecurity'),
      onPress: () => navigation.navigate('PrivacySecurity'),
    },
  ];

  const supportItems: MenuItem[] = [
    {
      icon: 'help-circle-outline',
      iconColor: colors.status.infoDark,
      label: t('profile.helpFAQ'),
      onPress: () => navigation.navigate('HelpFAQ'),
    },
    {
      icon: 'information-circle-outline',
      iconColor: colors.accent,
      label: t('profile.aboutNeshama'),
      onPress: () => navigation.navigate('AboutNeshama'),
    },
  ];

  const textAlign = isRTL ? 'right' : 'left';

  const renderMenuCard = (items: MenuItem[]) => (
    <Card style={styles.menuCard} padded={false}>
      {items.map((item, index) => (
        <View
          key={item.label}
          style={[
            styles.menuItemWrap,
            index < items.length - 1 && styles.menuItemBorder,
          ]}
        >
          <LinkRow
            icon={item.icon}
            iconColor={item.iconColor}
            label={item.label}
            onPress={item.onPress}
          />
        </View>
      ))}
    </Card>
  );

  return (
    <Screen header={<Header title={t('profile.title')} showBack />}>
      <Card style={styles.heroCard} padded={false}>
        <View style={styles.heroInner}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.name, { textAlign }]} numberOfLines={1}>
            {user?.name || t('common.user')}
          </Text>
          {!!user?.email && (
            <Text style={[styles.email, { textAlign }]} numberOfLines={1}>
              {user.email}
            </Text>
          )}
          
        </View>
      </Card>

      

      <View style={styles.menuGroup}>
        {renderMenuCard(accountItems)}
      </View>
      <View style={styles.menuGroup}>
        {renderMenuCard(supportItems)}
      </View>

      <Button
        title={t('profile.logOut')}
        variant="outline"
        onPress={handleLogout}
        style={styles.logoutButton}
        icon={
          <Ionicons name="log-out-outline" size={20} color={colors.primary} />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    backgroundColor: colors.brand.lavenderMist,
    ...shadows.sm,
  },
  heroInner: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  name: {
    ...typography.h3,
    color: colors.text.primary,
  },
  email: {
    ...typography.bodySm,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  memberPill: {
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  memberPillText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  statsRow: {
    marginTop: spacing.lg,
  },
  statSpacer: {
    width: spacing.md,
  },
  menuGroup: {
    marginTop: spacing.lg,
  },
  menuCard: {
    paddingHorizontal: spacing.base,
  },
  menuItemWrap: {
    paddingHorizontal: 0,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  logoutButton: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
});
