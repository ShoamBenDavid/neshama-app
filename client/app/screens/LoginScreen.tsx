import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Screen, Header, Button, Input } from '../components/ui';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, clearError } from '../store/slices/authSlice';
import { useTranslation } from '../i18n';
import type { RootStackParamList } from '../navigation/StackNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const { t, isRTL } = useTranslation();

  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';

  const getLoginErrorMessage = React.useCallback(
    (errorCodeOrMessage?: string | null) => {
      switch (errorCodeOrMessage) {
        case 'USER_NOT_FOUND':
          return t('auth.userNotFound');
        case 'INVALID_PASSWORD':
          return t('auth.invalidPassword');
        case 'ACCOUNT_DEACTIVATED':
          return t('auth.accountDeactivated');
        case 'INVALID_CREDENTIALS':
          return t('auth.invalidCredentials');
        default:
          return t('auth.loginTryAgain');
      }
    },
    [t],
  );

  const LoginSchema = useMemo(
    () =>
      Yup.object().shape({
        email: Yup.string()
          .email(t('validation.emailInvalid'))
          .required(t('validation.emailRequired')),
        password: Yup.string()
          .min(6, t('validation.passwordMinLength'))
          .required(t('validation.passwordRequired')),
      }),
    [t],
  );

  React.useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleLogin = async (values: { email: string; password: string }) => {
    const result = await dispatch(loginUser(values));
    if (loginUser.rejected.match(result)) {
      Alert.alert(t('auth.loginFailed'), getLoginErrorMessage(result.payload as string));
    }
  };

  return (
    <Screen scrollable avoidKeyboard padded={false}>
      <Header title={t('auth.welcomeBack')} showBack />

      <View style={styles.content}>
        <Text style={[styles.subtitle, { textAlign }]}>{t('auth.signInSubtitle')}</Text>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={[styles.errorText, { textAlign }]}>
              {getLoginErrorMessage(error)}
            </Text>
          </View>
        )}

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={LoginSchema}
          onSubmit={handleLogin}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.form}>
              <Input
                label={t('auth.email')}
                icon="mail-outline"
                placeholder={t('auth.enterYourEmail')}
                keyboardType="email-address"
                autoCapitalize="none"
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                error={touched.email && errors.email ? errors.email : undefined}
              />

              <Input
                label={t('auth.password')}
                icon="lock-closed-outline"
                placeholder={t('auth.enterYourPassword')}
                isPassword
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                error={touched.password && errors.password ? errors.password : undefined}
              />

              <Button
                title={t('auth.signIn')}
                onPress={() => handleSubmit()}
                loading={isLoading}
                size="lg"
                style={styles.submitButton}
              />
            </View>
          )}
        </Formik>

        <View style={[styles.footer, { flexDirection: rowDirection }]}>
          <Text style={styles.footerText}>{t('auth.dontHaveAccount')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>{t('auth.signUp')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing['2xl'],
  },
  errorBanner: {
    backgroundColor: colors.status.error + '12',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.base,
  },
  errorText: {
    ...typography.bodySm,
    color: colors.status.errorDark,
  },
  form: {
    gap: spacing.xs,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  footer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing['2xl'],
  },
  footerText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  footerLink: {
    ...typography.bodyMedium,
    color: colors.primary,
  },
});
