import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CalmBackgroundProps {
  colors?: [string, string];
  style?: ViewStyle;
  children?: React.ReactNode;
  animated?: boolean;
}

export default function CalmBackground({
  colors: gradientColors = ['#DFE6E9', '#FBF8F3'],
  style,
  children,
  animated = true,
}: CalmBackgroundProps) {
  const opacity1 = useRef(new Animated.Value(1)).current;
  const opacity2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    const animate = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity1, { toValue: 0, duration: 6000, useNativeDriver: true }),
          Animated.timing(opacity2, { toValue: 1, duration: 6000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity1, { toValue: 1, duration: 6000, useNativeDriver: true }),
          Animated.timing(opacity2, { toValue: 0, duration: 6000, useNativeDriver: true }),
        ]),
      ]).start(animate);
    };

    animate();
  }, [animated]);

  return (
    <>
      <Animated.View style={[styles.layer, { opacity: opacity1 }]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, style]}
        />
      </Animated.View>
      <Animated.View style={[styles.layer, { opacity: opacity2 }]}>
        <LinearGradient
          colors={[gradientColors[1], gradientColors[0]]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[StyleSheet.absoluteFill, style]}
        />
      </Animated.View>
      {children}
    </>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});
