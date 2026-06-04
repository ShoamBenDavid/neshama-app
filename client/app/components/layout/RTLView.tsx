import React from 'react';
import { View, ViewProps, ViewStyle, StyleProp } from 'react-native';
import { useTranslation } from '../../i18n';

interface RTLViewProps extends ViewProps {
  /** Reverse the row direction in RTL (default: true). Pass false to keep LTR order. */
  reverseInRTL?: boolean;
  /** Render the row inline as a flex-row (default true). Pass false for plain View. */
  asRow?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Tiny utility that flips `flexDirection` based on the active language.
 * Use inside any "row of items" so children appear in reading order without
 * having to add ternaries everywhere.
 */
export default function RTLView({
  reverseInRTL = true,
  asRow = true,
  style,
  children,
  ...props
}: RTLViewProps) {
  const { isRTL } = useTranslation();
  const flexDirection: ViewStyle['flexDirection'] = asRow
    ? isRTL && reverseInRTL
      ? 'row-reverse'
      : 'row'
    : 'column';

  return (
    <View style={[{ flexDirection }, style]} {...props}>
      {children}
    </View>
  );
}
