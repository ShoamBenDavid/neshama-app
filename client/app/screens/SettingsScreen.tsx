import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  Header,
  Card,
  Button,
  Input,
  SectionHeader,
} from '../components/ui';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logoutUser, setUser } from '../store/slices/authSlice';
import { authAPI } from '../services/api';
import { useTranslation } from '../i18n';
import type { Language } from '../i18n';

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { t, language, setLanguage, isRTL } = useTranslation();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('settings.nameRequired'));
      return;
    }

    try {
      setSaving(true);
      const response = await authAPI.updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
      });
      if (response.success && response.data) {
        dispatch(setUser(response.data.user));
        Alert.alert(t('common.save'), t('settings.profileUpdated'));
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t('settings.profileUpdateFailed');
      Alert.alert(t('common.error'), message);
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

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

  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';

  return (
    <Screen header={<Header title={t('settings.title')} showBack />} avoidKeyboard>
      <SectionHeader title={t('settings.profile')} />
      <Card style={styles.card}>
        <Input
          label={t('settings.name')}
          value={name}
          onChangeText={setName}
          icon="person-outline"
          containerStyle={styles.input}
        />
        <Input
          label={t('settings.phoneOptional')}
          value={phone}
          onChangeText={setPhone}
          icon="call-outline"
          keyboardType="phone-pad"
          containerStyle={styles.input}
        />
        <Button
          title={t('settings.saveChanges')}
          onPress={handleSaveProfile}
          loading={saving}
          size="md"
        />
      </Card>

      <SectionHeader title={t('settings.language')} />
      <Card style={styles.card} padded={false}>
        <LanguageOption
          label={t('settings.english')}
          selected={language === 'en'}
          onPress={() => handleLanguageChange('en')}
          textAlign={textAlign}
          rowDirection={rowDirection}
        />
        <View style={styles.divider} />
        <LanguageOption
          label={t('settings.hebrew')}
          selected={language === 'he'}
          onPress={() => handleLanguageChange('he')}
          textAlign={textAlign}
          rowDirection={rowDirection}
        />
      </Card>

      <SectionHeader title={t('settings.about')} />
      <Card style={styles.card}>
        <View style={[styles.aboutRow, { flexDirection: rowDirection }]}>
          <Text style={[styles.aboutLabel, { textAlign }]}>
            {t('settings.version')}
          </Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>
        <View style={styles.divider} />
        <View style={[styles.aboutRow, { flexDirection: rowDirection }]}>
          <Text style={[styles.aboutLabel, { textAlign }]}>
            {t('settings.build')}
          </Text>
          <Text style={styles.aboutValue}>{t('settings.production')}</Text>
        </View>
      </Card>

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

interface LanguageOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  textAlign: 'left' | 'right';
  rowDirection: 'row' | 'row-reverse';
}

function LanguageOption({
  label,
  selected,
  onPress,
  textAlign,
  rowDirection,
}: LanguageOptionProps) {
  return (
    <TouchableOpacity
      style={[langStyles.row, { flexDirection: rowDirection }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          langStyles.label,
          selected && langStyles.labelSelected,
          { textAlign, flex: 1 },
        ]}
      >
        {label}
      </Text>
      <View style={langStyles.checkSlot}>
        {selected && (
          <Ionicons
            name="checkmark-circle"
            size={22}
            color={colors.primary}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  input: {
    marginBottom: spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.base,
  },
  aboutRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  aboutLabel: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
  },
  aboutValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  logoutButton: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
});

const langStyles = StyleSheet.create({
  row: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    minHeight: 52,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  labelSelected: {
    color: colors.primary,
  },
  checkSlot: {
    width: 28,
    alignItems: 'center',
  },
});
