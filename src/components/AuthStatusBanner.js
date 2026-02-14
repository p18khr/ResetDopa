// src/components/AuthStatusBanner.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

function AuthStatusBanner({ visible, onLoginPress }) {
  const { isDarkMode, colors } = useTheme();
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
      <View style={[styles.banner, { backgroundColor: colors.surfacePrimary, borderColor: colors.border }]}>
        <Text style={[styles.text, { color: colors.text }]}>Not signed in — progress is local only</Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.accent }]} onPress={onLoginPress}>
          <Text style={[styles.btnText, { color: '#fff' }]}>Log in</Text>
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
    borderRadius: 12,
    borderWidth: 1,
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
  text: { fontSize: 13, marginRight: 12 },
  btn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  btnText: { fontWeight: '700' },
});

// Memoize to prevent unnecessary re-renders when props haven't changed
export default React.memo(AuthStatusBanner);
