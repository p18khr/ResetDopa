import React, { useEffect, useRef } from 'react';
import { View, Animated, Text } from 'react-native';

/**
 * BreathingBall - Animated breathing guide
 * Expands/contracts to guide user through breathwork cycles
 */
export default function BreathingBall({ isActive, color = '#3B82F6' }) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const labelAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) {
      scaleAnim.setValue(0.5);
      return;
    }

    // Continuous breathing cycle: Inhale 4s -> Hold 2s -> Exhale 4s -> Pause 2s
    const cycle = Animated.sequence([
      // Inhale: expand from 0.5 to 1.5
      Animated.timing(scaleAnim, {
        toValue: 1.5,
        duration: 4000,
        useNativeDriver: true,
      }),
      // Hold at max
      Animated.timing(scaleAnim, {
        toValue: 1.5,
        duration: 2000,
        useNativeDriver: true,
      }),
      // Exhale: contract from 1.5 to 0.5
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: 4000,
        useNativeDriver: true,
      }),
      // Pause at min
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]);

    // Loop continuously
    const loop = Animated.loop(cycle);
    loop.start();

    return () => {
      try {
        loop.stop();
      } catch {}
    };
  }, [isActive, scaleAnim]);

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
      }}
    >
      {/* Breathing Ball */}
      <Animated.View
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: color,
          opacity: 0.8,
          transform: [{ scale: scaleAnim }],
          marginBottom: 20,
        }}
      />

      {/* Guide Text - Changes with breathing phase */}
      <Text
        style={{
          fontSize: 16,
          fontWeight: '600',
          color: color,
          letterSpacing: 1,
          minHeight: 24,
        }}
      >
        {isActive ? 'Follow the rhythm' : 'Press Start to begin'}
      </Text>
    </View>
  );
}
