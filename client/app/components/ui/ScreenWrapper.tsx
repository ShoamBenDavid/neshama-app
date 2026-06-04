import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  backgroundColor?: string;
  safeTop?: boolean;
  safeBottom?: boolean;
}

export default function ScreenWrapper({
  children,
  scrollable = true,
  padded = true,
  style,
  contentContainerStyle,
  backgroundColor = colors.background,
  safeTop = true,
  safeBottom = false,
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor,
    paddingTop: safeTop ? insets.top : 0,
    paddingBottom: safeBottom ? insets.bottom : 0,
  };

  if (scrollable) {
    return (
      <View style={[containerStyle, style]}>
        <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
        <ScrollView
          contentContainerStyle={[
            padded && styles.padded,
            styles.scrollContent,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[containerStyle, padded && styles.padded, style]}>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  padded: {
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingBottom: spacing['3xl'],
  },
});
