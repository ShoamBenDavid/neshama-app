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
import { registerUser, clearError } from '../store/slices/authSlice';
import { useTranslation } from '../i18n';
import type { RootStackParamList } from '../navigation/StackNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const { t, isRTL } = useTranslation();

  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';

  const RegisterSchema = useMemo(
    () =>
      Yup.object().shape({
        name: Yup.string()
          .min(2, t('validation.nameMinLength'))
          .max(50)
          .required(t('validation.nameRequired')),
  
        email: Yup.string()
          .email(t('validation.emailInvalid'))
          .required(t('validation.emailRequired')),
  
        password: Yup.string()
          .min(8, t('validation.passwordMinLength'))
          .matches(/[a-z]/, t('validation.passwordLowercase'))
          .matches(/[A-Z]/, t('validation.passwordUppercase'))
          .matches(/[0-9]/, t('validation.passwordNumber'))
          .matches(/[^A-Za-z0-9]/, t('validation.passwordSpecialChar'))
          .required(t('validation.passwordRequired')),
  
        confirmPassword: Yup.string()
          .oneOf([Yup.ref('password')], t('validation.passwordsMustMatch'))
          .required(t('validation.confirmPasswordRequired')),
      }),
    [t],
  );

  React.useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleRegister = async (values: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    const result = await dispatch(
      registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
      }),
    );
    if (registerUser.rejected.match(result)) {
      Alert.alert(t('auth.registrationFailed'), result.payload as string);
    }
  };

  return (
    <Screen scrollable avoidKeyboard padded={false}>
      <Header title={t('auth.createAccount')} showBack />

      <View style={styles.content}>
        <Text style={[styles.subtitle, { textAlign }]}>{t('auth.createAccountSubtitle')}</Text>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={[styles.errorText, { textAlign }]}>{error}</Text>
          </View>
        )}

        <Formik
          initialValues={{ name: '', email: '', password: '', confirmPassword: '' }}
          validationSchema={RegisterSchema}
          validateOnChange={false}
          validateOnBlur
          onSubmit={handleRegister}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.form}>
              <Input
                label={t('auth.fullName')}
                icon="person-outline"
                placeholder={t('auth.enterYourName')}
                autoCapitalize="words"
                value={values.name}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                error={touched.name && errors.name ? errors.name : undefined}
              />

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
                placeholder={t('auth.createAPassword')}
                isPassword
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                error={touched.password && errors.password ? errors.password : undefined}
              />

              <Input
                label={t('auth.confirmPassword')}
                icon="lock-closed-outline"
                placeholder={t('auth.confirmYourPassword')}
                isPassword
                value={values.confirmPassword}
                onChangeText={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                error={
                  touched.confirmPassword && errors.confirmPassword
                    ? errors.confirmPassword
                    : undefined
                }
              />

              <Button
                title={t('auth.createAccount')}
                onPress={() => handleSubmit()}
                loading={isLoading}
                size="lg"
                style={styles.submitButton}
              />
            </View>
          )}
        </Formik>

        <View style={[styles.footer, { flexDirection: rowDirection }]}>
          <Text style={styles.footerText}>{t('auth.alreadyHaveAccount')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>{t('auth.signIn')}</Text>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
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
    marginTop: spacing.xl,
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
