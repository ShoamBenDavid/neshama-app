import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  size: number;
  startX: number;
  duration: number;
}

interface FloatingParticlesProps {
  count?: number;
  color?: string;
}

export default function FloatingParticles({
  count = 12,
  color = 'rgba(255,255,255,0.3)',
}: FloatingParticlesProps) {
  const particles = useRef<Particle[]>(
    Array.from({ length: count }, () => {
      const startX = Math.random() * width;
      return {
        x: new Animated.Value(startX),
        y: new Animated.Value(height + 20),
        opacity: new Animated.Value(0),
        size: 4 + Math.random() * 8,
        startX,
        duration: 8000 + Math.random() * 6000,
      };
    }),
  ).current;

  useEffect(() => {
    particles.forEach((p, i) => {
      const delay = i * 600;
      const animate = () => {
        p.y.setValue(height + 20);
        p.x.setValue(p.startX + (Math.random() - 0.5) * 60);
        p.opacity.setValue(0);

        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(p.y, {
              toValue: -20,
              duration: p.duration,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(p.opacity, {
                toValue: 0.8,
                duration: p.duration * 0.3,
                useNativeDriver: true,
              }),
              Animated.timing(p.opacity, {
                toValue: 0,
                duration: p.duration * 0.7,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]).start(animate);
      };
      animate();
    });
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: color,
              opacity: p.opacity,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
  },
});
