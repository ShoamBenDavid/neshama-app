import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  Header,
  Card,
  Button,
  Input,
  AppModal,
  SectionHeader,
  LinkRow,
  SettingToggleRow,
} from '../components/ui';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { useTranslation } from '../i18n';
import { useAppDispatch } from '../store/hooks';
import { logoutUser } from '../store/slices/authSlice';

export default function PrivacySecurityScreen() {
  const { t, isRTL } = useTranslation();
  const dispatch = useAppDispatch();

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('common.error'), t('validation.passwordRequired'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('validation.passwordsMustMatch'));
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('validation.passwordMinLength'));
      return;
    }

    try {
      setChangingPassword(true);
      // TODO: call authAPI.changePassword({ currentPassword, newPassword }) when endpoint exists
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert(t('common.save'), t('privacy.passwordChanged'));
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      Alert.alert(t('common.error'), t('privacy.passwordChangeFailed'));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogoutAll = () => {
    Alert.alert(t('privacy.manageSessions'), t('privacy.logoutAllConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('privacy.logoutAllDevices'),
        style: 'destructive',
        onPress: () => {
          // TODO: call authAPI.logoutAllDevices() when endpoint exists
          dispatch(logoutUser());
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== 'DELETE') return;
    // TODO: call authAPI.deleteAccount() when endpoint exists
    Alert.alert(t('privacy.deleteAccount'), t('privacy.deleteAccountWarning'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          setDeleteModalVisible(false);
          dispatch(logoutUser());
        },
      },
    ]);
  };

  
  const handleOpenLink = (type: 'terms' | 'privacyPolicy') => {
    // TODO: open actual URLs with Linking.openURL when available
    Alert.alert(
      type === 'terms'
        ? t('privacy.termsOfService')
        : t('privacy.privacyPolicy'),
      'Coming soon',
    );
  };

  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' : 'left';

  return (
    <Screen header={<Header title={t('privacy.title')} showBack />}>
      <View style={[styles.subtitleBanner, { flexDirection: rowDirection }]}>
        <Ionicons
          name="shield-checkmark"
          size={20}
          color={colors.primary}
          style={styles.bannerIcon}
        />
        <Text style={[styles.subtitleText, { textAlign }]}>
          {t('privacy.subtitle')}
        </Text>
      </View>

      <SectionHeader title={t('privacy.account')} />
      <Card style={styles.card} padded={false}>
        <View style={styles.rowWrap}>
          <LinkRow
            icon="key-outline"
            iconColor={colors.primary}
            label={t('privacy.changePassword')}
            description={t('privacy.changePasswordDesc')}
            onPress={() => setPasswordModalVisible(true)}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.rowWrap}>
          <LinkRow
            icon="phone-portrait-outline"
            iconColor={colors.accentDark}
            label={t('privacy.manageSessions')}
            description={t('privacy.manageSessionsDesc')}
            onPress={handleLogoutAll}
          />
        </View>
      </Card>

      <SectionHeader title={t('privacy.security')} />
      <Card style={styles.card} padded={false}>
        <View style={styles.rowWrap}>
          <SettingToggleRow
            icon="finger-print-outline"
            iconColor={colors.status.successDark}
            label={t('privacy.biometricLock')}
            description={t('privacy.biometricLockDesc')}
            value={biometricEnabled}
            onToggle={setBiometricEnabled}
          />
        </View>
      </Card>

      <SectionHeader title={t('privacy.dataPrivacy')} />
      <Card style={styles.card}>
        <View style={styles.infoBlock}>
          <View
            style={[styles.infoHeader, { flexDirection: rowDirection }]}
          >
            <Ionicons name="lock-closed" size={18} color={colors.primary} />
            <Text style={[styles.infoTitle, { textAlign }]}>
              {t('privacy.dataPrivacyTitle')}
            </Text>
          </View>
          <Text style={[styles.infoText, { textAlign }]}>
            {t('privacy.dataPrivacyDesc')}
          </Text>
        </View>
        <View style={styles.dividerInner} />
        <View style={styles.infoBlock}>
          <View
            style={[styles.infoHeader, { flexDirection: rowDirection }]}
          >
            <Ionicons name="eye-off" size={18} color={colors.accentDark} />
            <Text style={[styles.infoTitle, { textAlign }]}>
              {t('privacy.anonymousTitle')}
            </Text>
          </View>
          <Text style={[styles.infoText, { textAlign }]}>
            {t('privacy.anonymousDesc')}
          </Text>
        </View>
      </Card>

      <SectionHeader title={t('privacy.legal')} />
      <Card style={styles.card} padded={false}>
        <View style={styles.rowWrap}>
          <LinkRow
            icon="document-text-outline"
            iconColor={colors.text.secondary}
            label={t('privacy.termsOfService')}
            onPress={() => handleOpenLink('terms')}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.rowWrap}>
          <LinkRow
            icon="shield-outline"
            iconColor={colors.text.secondary}
            label={t('privacy.privacyPolicy')}
            onPress={() => handleOpenLink('privacyPolicy')}
          />
        </View>
      </Card>

      <SectionHeader title={t('privacy.dangerZone')} />
      <Card style={[styles.card, styles.dangerCard]} padded={false}>
     
        <View style={styles.divider} />
        <View style={styles.rowWrap}>
          <LinkRow
            icon="trash-outline"
            label={t('privacy.deleteAccount')}
            description={t('privacy.deleteAccountDesc')}
            onPress={() => setDeleteModalVisible(true)}
            danger
          />
        </View>
      </Card>

      <AppModal
        visible={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
        title={t('privacy.changePassword')}
      >
        <Input
          label={t('privacy.currentPassword')}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          icon="lock-closed-outline"
          containerStyle={styles.modalInput}
        />
        <Input
          label={t('privacy.newPassword')}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          icon="key-outline"
          containerStyle={styles.modalInput}
        />
        <Input
          label={t('privacy.confirmNewPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          icon="key-outline"
          containerStyle={styles.modalInput}
        />
        <Button
          title={t('privacy.updatePassword')}
          onPress={handleChangePassword}
          loading={changingPassword}
          size="md"
        />
      </AppModal>

      <AppModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setDeleteConfirmText('');
        }}
        title={t('privacy.deleteAccount')}
      >
        <View
          style={[styles.deleteWarning, { flexDirection: rowDirection }]}
        >
          <Ionicons name="warning" size={28} color={colors.status.errorDark} />
          <Text style={[styles.deleteWarningText, { textAlign }]}>
            {t('privacy.deleteAccountConfirm')}
          </Text>
        </View>
        <Text style={[styles.deleteDescription, { textAlign }]}>
          {t('privacy.deleteAccountWarning')}
        </Text>
        <Input
          label={t('privacy.typeDelete')}
          value={deleteConfirmText}
          onChangeText={setDeleteConfirmText}
          icon="alert-circle-outline"
          containerStyle={styles.modalInput}
        />
        <Button
          title={t('privacy.deleteAccount')}
          variant="danger"
          onPress={handleDeleteAccount}
          disabled={deleteConfirmText !== 'DELETE'}
          size="md"
        />
      </AppModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitleBanner: {
    alignItems: 'center',
    backgroundColor: colors.primary + '0A',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  bannerIcon: {
    marginEnd: spacing.sm,
  },
  subtitleText: {
    ...typography.bodySm,
    color: colors.text.secondary,
    flex: 1,
  },
  card: {
    marginBottom: spacing.sm,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: colors.status.error + '30',
  },
  rowWrap: {
    paddingHorizontal: spacing.base,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.base,
  },
  dividerInner: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginVertical: spacing.xs,
  },
  infoBlock: {
    paddingVertical: spacing.sm,
  },
  infoHeader: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  infoTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
  infoText: {
    ...typography.bodySm,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  modalInput: {
    marginBottom: spacing.md,
  },
  deleteWarning: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  deleteWarningText: {
    ...typography.bodyMedium,
    color: colors.status.errorDark,
    flex: 1,
  },
  deleteDescription: {
    ...typography.bodySm,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
});
