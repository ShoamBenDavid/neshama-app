import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/ui';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { useTranslation } from '../i18n';
import type { RootStackParamList } from '../navigation/StackNavigator';

const { height } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();

  const features: { icon: keyof typeof Ionicons.glyphMap; key: string }[] = [
    { icon: 'journal-outline', key: 'welcome.featureJournal' },
    { icon: 'chatbubble-ellipses-outline', key: 'welcome.featureAI' },
    { icon: 'people-outline', key: 'welcome.featureCommunity' },
  ];

  return (
    <LinearGradient
      colors={colors.gradients.dawn as unknown as [string, string, ...string[]]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoSection}>
   
              <Image source={require('../assets/logo.png')} style={styles.logoImage} />
            
          <Text style={styles.appName}>{t('welcome.appName')}</Text>
          <Text style={styles.tagline}>{t('welcome.tagline')}</Text>
        </View>



       

        <View style={styles.buttons}>
          <Button
            title={t('auth.getStarted')}
            onPress={() => navigation.navigate('Register')}
            size="lg"
          />
          <Button
            title={t('auth.iAlreadyHaveAccount')}
            variant="ghost"
            onPress={() => navigation.navigate('Login')}
            size="md"
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingTop: height * 0.08,
    paddingBottom: spacing['3xl'],
  },
  logoSection: {
    alignItems: 'center',
  },

  appName: {
    ...typography.h1,
    color: colors.text.primary,
    letterSpacing: 1,
    fontWeight: '700',
    fontFamily: 'Poppins-ExtraBold',
    fontSize: 40,
  },
  tagline: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    fontWeight: '700',
    fontFamily: 'Poppins-Regular',
    fontSize: 20
  },
  illustrationArea: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  decorCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryLight + '15',
  },
  decorCircle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.secondaryLight + '10',
    left: -20,
  },
  decorCircle3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentLight + '15',
    right: 20,
    top: 10,
  },
  centralIcon: {
    zIndex: 1,
  },
  features: {
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  buttons: {
    gap: spacing.sm,
  },
  logoImage: {
    width: 400 ,
    height: 400,
    resizeMode: 'contain',
  },
});
