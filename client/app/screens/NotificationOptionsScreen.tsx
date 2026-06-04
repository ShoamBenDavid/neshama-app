import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  Header,
  Card,
  SectionHeader,
  SettingToggleRow,
  LoadingState,
} from '../components/ui';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { useTranslation, getChevronForwardName } from '../i18n';
import {
  NOTIF_PREFS_STORAGE_KEY,
  applyNotificationPrefs,
  ensureNotificationPermissions,
  notificationsSupported,
  type NotificationLabels,
} from '../services/notifications';

const STORAGE_KEY = NOTIF_PREFS_STORAGE_KEY;
const SAVE_DEBOUNCE_MS = 600;

export interface NotificationPrefs {
  dailyMood: boolean;
  journal: boolean;
  breathing: boolean;
  community: boolean;
  supportCenter: boolean;
  general: boolean;
  quietHours: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  dailyMood: true,
  journal: true,
  breathing: false,
  community: true,
  supportCenter: true,
  general: true,
  quietHours: false,
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function NotificationOptionsScreen() {
  const { t, isRTL } = useTranslation();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPrefs = useRef<NotificationPrefs>(DEFAULT_PREFS);
  const hasPromptedPermission = useRef(false);

  const buildLabels = useCallback(
    (): NotificationLabels => ({
      dailyMoodTitle: t('notifications.dailyMood'),
      dailyMoodBody: t('notifications.dailyMoodDesc'),
      journalTitle: t('notifications.journal'),
      journalBody: t('notifications.journalDesc'),
      breathingTitle: t('notifications.breathing'),
      breathingBody: t('notifications.breathingDesc'),
      communityTitle: t('notifications.communityUpdates'),
      communityBody: t('notifications.communityDesc'),
      supportCenterTitle: t('notifications.supportCenter'),
      supportCenterBody: t('notifications.supportCenterDesc'),
      generalTitle: t('notifications.general'),
      generalBody: t('notifications.generalDesc'),
    }),
    [t],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let active: NotificationPrefs = DEFAULT_PREFS;
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
          active = { ...DEFAULT_PREFS, ...parsed };
        }
        if (!cancelled) {
          setPrefs(active);
          latestPrefs.current = active;
        }
      } catch {
        // Storage read failed — keep defaults silently.
      } finally {
        if (!cancelled) setIsLoading(false);
      }

      // Sync OS scheduler with persisted prefs on mount so that
      // notifications keep firing across reinstalls / app updates.
      if (!notificationsSupported) return;
      try {
        const granted = await ensureNotificationPermissions();
        if (!cancelled) setPermissionDenied(!granted);
        if (granted) {
          await applyNotificationPrefs(active, buildLabels());
        }
      } catch {
        // Silently ignore — user can re-toggle to retry.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openSystemSettings = useCallback(() => {
    Linking.openSettings().catch(() => {
      // User can still open settings manually.
    });
  }, []);

  const warnPermissionDenied = useCallback(() => {
    if (hasPromptedPermission.current) return;
    hasPromptedPermission.current = true;
    Alert.alert(
      t('notifications.title'),
      t('notifications.permissionDeniedMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('notifications.openSettings'), onPress: openSystemSettings },
      ],
    );
  }, [openSystemSettings, t]);

  const persistPrefs = useCallback(
    (next: NotificationPrefs) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);

      setSaveStatus('saving');
      saveTimer.current = setTimeout(async () => {
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          if (notificationsSupported) {
            const result = await applyNotificationPrefs(next, buildLabels());
            setPermissionDenied(result.supported && !result.granted);
            if (result.supported && !result.granted) warnPermissionDenied();
          }
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 1800);
        } catch {
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 2500);
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [buildLabels, warnPermissionDenied],
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const toggle = useCallback(
    (key: keyof NotificationPrefs) => (value: boolean) => {
      const next = { ...latestPrefs.current, [key]: value };
      latestPrefs.current = next;
      setPrefs(next);
      persistPrefs(next);
    },
    [persistPrefs],
  );

  const anyEnabled = Object.entries(prefs)
    .filter(([k]) => k !== 'quietHours')
    .some(([, v]) => v);

  if (isLoading) {
    return (
      <Screen header={<Header title={t('notifications.title')} showBack />}>
        <LoadingState />
      </Screen>
    );
  }

  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' : 'left';

  return (
    <Screen
      header={
        <Header
          title={t('notifications.title')}
          showBack
          rightAction={<SaveIndicator status={saveStatus} />}
        />
      }
    >
      {!notificationsSupported && (
        <View style={[styles.infoBanner, { flexDirection: rowDirection }]}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.status.infoDark}
            style={styles.permissionIcon}
          />
          <View style={styles.permissionTextWrap}>
            <Text style={[styles.infoTitle, { textAlign }]}>
              {t('notifications.unsupportedTitle')}
            </Text>
            <Text style={[styles.permissionBody, { textAlign }]}>
              {t('notifications.unsupportedMessage')}
            </Text>
          </View>
        </View>
      )}

      {notificationsSupported && permissionDenied && anyEnabled && (
        <TouchableOpacity
          style={[styles.permissionBanner, { flexDirection: rowDirection }]}
          onPress={openSystemSettings}
          activeOpacity={0.85}
        >
          <Ionicons
            name="notifications-off-outline"
            size={20}
            color={colors.status.errorDark}
            style={styles.permissionIcon}
          />
          <View style={styles.permissionTextWrap}>
            <Text style={[styles.permissionTitle, { textAlign }]}>
              {t('notifications.permissionDeniedTitle')}
            </Text>
            <Text style={[styles.permissionBody, { textAlign }]}>
              {t('notifications.permissionDeniedMessage')}
            </Text>
          </View>
          <Ionicons
            name={getChevronForwardName(isRTL)}
            size={18}
            color={colors.status.errorDark}
          />
        </TouchableOpacity>
      )}

      <SectionHeader title={t('notifications.reminders')} />
      <Card style={styles.card} padded={false}>
        <View style={styles.toggleWrap}>
          <SettingToggleRow
            icon="happy-outline"
            iconColor={colors.mood[4]}
            label={t('notifications.dailyMood')}
            description={t('notifications.dailyMoodDesc')}
            value={prefs.dailyMood}
            onToggle={toggle('dailyMood')}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.toggleWrap}>
          <SettingToggleRow
            icon="book-outline"
            iconColor={colors.primary}
            label={t('notifications.journal')}
            description={t('notifications.journalDesc')}
            value={prefs.journal}
            onToggle={toggle('journal')}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.toggleWrap}>
          <SettingToggleRow
            icon="leaf-outline"
            iconColor={colors.secondary}
            label={t('notifications.breathing')}
            description={t('notifications.breathingDesc')}
            value={prefs.breathing}
            onToggle={toggle('breathing')}
          />
        </View>
      </Card>

      <SectionHeader title={t('notifications.community')} />
      <Card style={styles.card} padded={false}>
        <View style={styles.toggleWrap}>
          <SettingToggleRow
            icon="people-outline"
            iconColor={colors.accent}
            label={t('notifications.communityUpdates')}
            description={t('notifications.communityDesc')}
            value={prefs.community}
            onToggle={toggle('community')}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.toggleWrap}>
          <SettingToggleRow
            icon="heart-outline"
            iconColor={colors.status.error}
            label={t('notifications.supportCenter')}
            description={t('notifications.supportCenterDesc')}
            value={prefs.supportCenter}
            onToggle={toggle('supportCenter')}
          />
        </View>
      </Card>

      <SectionHeader title={t('notifications.appUpdates')} />
      <Card style={styles.card} padded={false}>
        <View style={styles.toggleWrap}>
          <SettingToggleRow
            icon="megaphone-outline"
            iconColor={colors.status.infoDark}
            label={t('notifications.general')}
            description={t('notifications.generalDesc')}
            value={prefs.general}
            onToggle={toggle('general')}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.toggleWrap}>
          <SettingToggleRow
            icon="moon-outline"
            iconColor={colors.accentDark}
            label={t('notifications.quietHours')}
            description={t('notifications.quietHoursDesc')}
            value={prefs.quietHours}
            onToggle={toggle('quietHours')}
          />
        </View>
      </Card>
    </Screen>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null;

  const icon: keyof typeof Ionicons.glyphMap =
    status === 'saving'
      ? 'cloud-upload-outline'
      : status === 'saved'
        ? 'checkmark-circle'
        : 'alert-circle-outline';

  const color =
    status === 'saving'
      ? colors.text.tertiary
      : status === 'saved'
        ? colors.status.successDark
        : colors.status.errorDark;

  return (
    <View style={indicatorStyles.wrap}>
      {status === 'saving' ? (
        <ActivityIndicator size={16} color={colors.text.tertiary} />
      ) : (
        <Ionicons name={icon} size={18} color={color} />
      )}
    </View>
  );
}

const indicatorStyles = StyleSheet.create({
  wrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  toggleWrap: {
    paddingHorizontal: spacing.base,
  },
  permissionBanner: {
    alignItems: 'center',
    backgroundColor: colors.status.errorDark + '14',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoBanner: {
    alignItems: 'center',
    backgroundColor: colors.status.infoDark + '14',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoTitle: {
    ...typography.bodySm,
    color: colors.status.infoDark,
    fontWeight: '600',
    marginBottom: 2,
  },
  permissionIcon: {
    marginEnd: spacing.sm,
  },
  permissionTextWrap: {
    flex: 1,
  },
  permissionTitle: {
    ...typography.bodySm,
    color: colors.status.errorDark,
    fontWeight: '600',
    marginBottom: 2,
  },
  permissionBody: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.base,
  },
});
