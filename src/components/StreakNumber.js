// src/components/StreakNumber.js
import React, { useContext, useEffect, useRef } from 'react';
import { Animated, Easing, Text, StyleSheet } from 'react-native';
import { AppContext } from '../context/AppContext';

export default function StreakNumber({ style, suffix = ' Days' }) {
  const { streak, streakBumpSeq } = useContext(AppContext);
  const scale = useRef(new Animated.Value(1)).current;
  const prevSeq = useRef(0);
  const prevStreak = useRef(streak);

  useEffect(() => {
    const bumped = streakBumpSeq !== prevSeq.current || (typeof streak === 'number' && streak > (prevStreak.current || 0));
    prevSeq.current = streakBumpSeq;
    prevStreak.current = streak;
    if (!bumped) return;
    scale.setValue(1.18);
    Animated.timing(scale, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [streak, streakBumpSeq]);

  return (
    <Animated.Text style={[style, styles.text, { transform: [{ scale }] }]}>{streak}{suffix}</Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: { fontVariant: ['tabular-nums'] },
});
