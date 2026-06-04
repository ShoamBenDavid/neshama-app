import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { useTranslation } from '../../i18n';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AccordionItemProps {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}

export default function AccordionItem({
  question,
  answer,
  defaultOpen = false,
}: AccordionItemProps) {
  const { isRTL } = useTranslation();
  const [expanded, setExpanded] = useState(defaultOpen);
  const rotation = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.timing(rotation, {
      toValue: expanded ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setExpanded((prev) => !prev);
  };

  const rotateZ = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const textAlign = isRTL ? 'right' : 'left';

  return (
    <TouchableOpacity
      style={[styles.container, expanded && styles.containerExpanded]}
      onPress={toggle}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.header,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
      >
        <Text style={[styles.question, { textAlign }]}>{question}</Text>
        <Animated.View style={{ transform: [{ rotateZ }] }}>
          <Ionicons name="chevron-down" size={20} color={colors.text.tertiary} />
        </Animated.View>
      </View>
      {expanded && <Text style={[styles.answer, { textAlign }]}>{answer}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  containerExpanded: {
    backgroundColor: colors.primary + '08',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  question: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
    marginEnd: spacing.md,
  },
  answer: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
    lineHeight: 22,
  },
});
