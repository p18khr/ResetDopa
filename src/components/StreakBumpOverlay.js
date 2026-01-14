// src/components/StreakBumpOverlay.js
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

export default function StreakBumpOverlay({ bumpSeq }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const localSeq = useRef(0);

  useEffect(() => {
    if (typeof bumpSeq !== 'number') return;
    if (bumpSeq === localSeq.current) return;
    localSeq.current = bumpSeq;

    opacity.setValue(0);
    translateY.setValue(14);
    scale.setValue(0.9);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 160, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -8, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.1, duration: 160, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.0, duration: 180, easing: Easing.inOut(Easing.cubic), useNativeDriver: true })
      ])
    ]).start(() => {
      Animated.timing(opacity, { toValue: 0, duration: 260, delay: 250, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start();
    });
  }, [bumpSeq]);

  return (
    <Animated.View pointerEvents="none" style={[styles.container, { opacity, transform: [{ translateY }, { scale }] }] }>
      <View style={styles.badge}><Text style={styles.text}>+1</Text><Text style={styles.small}> Streak</Text></View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 90,
    alignSelf: 'center',
    zIndex: 9998,
  },
  badge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'baseline',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 5,
  },
  text: { color: 'white', fontWeight: '800', fontSize: 18 },
  small: { color: 'white', fontWeight: '700', fontSize: 14 },
});
