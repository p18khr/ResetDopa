// src/components/AuthStatusBanner.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Platform } from 'react-native';

export default function AuthStatusBanner({ visible, onLoginPress }) {
  const [mounted, setMounted] = React.useState(false);
  const slide = React.useRef(new Animated.Value(60)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(slide, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(slide, { toValue: 60, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slide }], opacity }]}> 
      <View style={styles.banner}>
        <Text style={styles.text}>Not signed in — progress is local only</Text>
        <TouchableOpacity style={styles.btn} onPress={onLoginPress}>
          <Text style={styles.btnText}>Log in</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: Platform.select({ ios: 24, android: 18, default: 20 }),
    zIndex: 9999,
    elevation: 10,
  },
  banner: {
    backgroundColor: '#111827EE',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  text: { color: 'white', fontSize: 13, marginRight: 12 },
  btn: { backgroundColor: '#4A90E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  btnText: { color: 'white', fontWeight: '700' },
});
