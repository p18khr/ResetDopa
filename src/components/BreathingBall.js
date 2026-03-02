import React, { useEffect, useRef } from 'react';
import { View, Animated, Text } from 'react-native';
import { speakBreathingPhase } from '../utils/audioUtils';

/**
 * BreathingBall - Animated breathing guide with TTS
 * Expands/contracts to guide user through breathwork cycles
 * Also speaks breathing instructions aloud
 */
export default function BreathingBall({ isActive, color = '#3B82F6' }) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const phaseRef = useRef('pause');

  useEffect(() => {
    if (!isActive) {
      scaleAnim.setValue(0.5);
      return;
    }

    // Breathing cycle phases: Inhale (4s) → Hold (2s) → Exhale (4s) → Pause (2s) = 12s total
    const phases = [
      { phase: 'inhale', duration: 4000, toValue: 1.5 },
      { phase: 'hold', duration: 2000, toValue: 1.5 },
      { phase: 'exhale', duration: 4000, toValue: 0.5 },
      { phase: 'pause', duration: 2000, toValue: 0.5 },
    ];

    const cycle = Animated.sequence(
      phases.map(({ phase, duration, toValue }) => {
        // Speak the phase at the start
        if (phaseRef.current !== phase) {
          phaseRef.current = phase;
          speakBreathingPhase(phase, Math.round(duration / 1000));
        }

        return Animated.timing(scaleAnim, {
          toValue,
          duration,
          useNativeDriver: true,
        });
      })
    );

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
