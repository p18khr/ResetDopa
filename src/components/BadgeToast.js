// src/components/BadgeToast.js
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

function BadgeToast({ badge, onHide }) {
  const { isDarkMode, colors } = useTheme();
  const slide = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!badge) return;
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ]).start();

    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slide, { toValue: -80, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true })
      ]).start(({ finished }) => { if (finished && onHide) onHide(); });
    }, 2500);
    return () => clearTimeout(t);
  }, [badge?.id]);

  if (!badge) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slide }], opacity }]}>
      <View style={[styles.toast, { backgroundColor: colors.surfacePrimary, borderColor: colors.border }]}>
        <Text style={styles.emoji}>🏅</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{badge.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{badge.message || 'Badge Unlocked!'}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.select({ ios: 60, android: 30, default: 40 }),
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 8,
  },
  toast: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  emoji: { fontSize: 22, marginRight: 10 },
  title: { fontWeight: '700', fontSize: 14 },
  subtitle: { fontSize: 13, marginTop: 2 },
});

// Memoize to prevent unnecessary re-renders when badge prop hasn't changed
export default React.memo(BadgeToast);
