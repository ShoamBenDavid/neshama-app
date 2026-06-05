import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
  StatusBar,
  StatusBarStyle,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import GradientBackground from '../layout/GradientBackground';

type GradientKey = keyof typeof colors.gradients;

interface ScreenProps {
  children: React.ReactNode;
  /** Render the screen with a gradient background. Pass a key from `colors.gradients`. */
  gradient?: GradientKey;
  /** Solid background when no `gradient` is set. Defaults to `surface.cream`. */
  background?: string;
  /** Whether the body should scroll. Default: true. */
  scrollable?: boolean;
  /** Horizontal padding on the body. Default: true. */
  padded?: boolean;
  /** Apply safe-area insets. Default top=true, bottom=false. */
  safeTop?: boolean;
  safeBottom?: boolean;
  /** Sticky element rendered above the scroll body (e.g. AppHeader). */
  header?: React.ReactNode;
  /** Status bar appearance. Default: 'dark-content' on cream, 'light-content' on night. */
  statusBar?: StatusBarStyle;
  /** Enable KeyboardAvoidingView wrap (for form screens). */
  avoidKeyboard?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * The redesign's screen shell. Wraps SafeArea + optional gradient + sticky
 * header + scrolling body. Uses a solid cream background by default; pass
 * `gradient` to render a named gradient from `colors.gradients` instead.
 */
export default function Screen({
  children,
  gradient,
  background,
  scrollable = true,
  padded = true,
  safeTop = true,
  safeBottom = false,
  header,
  statusBar,
  avoidKeyboard = false,
  style,
  contentContainerStyle,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const defaultBackground = colors.surfaces.cream;
  const bgColor = background ?? defaultBackground;
  const barStyle: StatusBarStyle =
    statusBar ?? (gradient === 'nightSky' ? 'light-content' : 'dark-content');
    const bottomSpace = Platform.OS === 'ios' ? 80 : 70;
  const innerPaddingTop = safeTop ? insets.top : 0;
  const innerPaddingBottom = safeBottom ? insets.bottom : 0;
  // Do not use `useBottomTabBarHeight` here: `Screen` is shared by tab,
  // stack, and auth screens, and that hook throws outside a bottom-tab context.
  const body = (
    <View style={[styles.flex, { paddingTop: innerPaddingTop, paddingBottom: innerPaddingBottom }]}>
      {header}
      {scrollable ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            padded && styles.padded,
            styles.scrollContent,
            {
              paddingBottom: bottomSpace,
            },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets={avoidKeyboard}
        >
          {children}
        </ScrollView>
      ) : (
        <View
        style={[
          styles.flex,
          padded && styles.padded,
          {
            paddingBottom: bottomSpace,
          },
          contentContainerStyle,
        ]}
      >
        {children}
      </View>
      )}
    </View>
  );

  const wrapped = avoidKeyboard && !scrollable ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  if (gradient) {
    return (
      <GradientBackground gradient={gradient} style={[styles.flex, style]}>
        <StatusBar barStyle={barStyle} backgroundColor="transparent" translucent />
        {wrapped}
      </GradientBackground>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: bgColor }, style]}>
      <StatusBar barStyle={barStyle} backgroundColor={bgColor} />
      {wrapped}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: {
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  paddingBottom: {
    paddingBottom: spacing.lg,
  },
});
