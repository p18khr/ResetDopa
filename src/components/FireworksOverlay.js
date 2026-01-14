// src/components/FireworksOverlay.js
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

export default function FireworksOverlay({ onComplete, durationMs = 6000, lottieSpeed = 0.6 }) {
  const [active, setActive] = useState(true);
  const [secondBurst, setSecondBurst] = useState(false);
  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    const t = setTimeout(() => {
      setActive(false);
      onComplete && onComplete();
    }, durationMs);
    // Trigger a gentle second burst midway to extend the celebration
    const t2 = setTimeout(() => setSecondBurst(true), Math.max(1500, durationMs * 0.35));
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [durationMs, onComplete]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={styles.overlay}>
      {/* Lottie fireworks overlay */}
      <LottieView
        source={require('../../assets/animations/fireworks.json')}
        autoPlay
        loop={false}
        speed={lottieSpeed}
        enableMergePathsAndroidForKitKatAndAbove
        hardwareAccelerationAndroid
        style={styles.lottie}
      />
      {/* Left burst */}
      <ConfettiCannon
        fadeOut
        count={140}
        origin={{ x: 0, y: Platform.OS === 'ios' ? 0 : -10 }}
        autoStart
        explosionSpeed={300}
        fallSpeed={4200}
      />
      {/* Right burst */}
      <ConfettiCannon
        fadeOut
        count={140}
        origin={{ x: width, y: Platform.OS === 'ios' ? 0 : -10 }}
        autoStart
        explosionSpeed={300}
        fallSpeed={4200}
      />
      {/* Center upward burst for a fireworks feel */}
      <ConfettiCannon
        fadeOut
        count={100}
        autoStart
        origin={{ x: width / 2, y: height }}
        explosionSpeed={320}
        fallSpeed={4000}
      />
      {secondBurst && (
        <>
          <ConfettiCannon
            fadeOut
            count={90}
            origin={{ x: width * 0.25, y: 0 }}
            autoStart
            explosionSpeed={280}
            fallSpeed={4200}
          />
          <ConfettiCannon
            fadeOut
            count={90}
            origin={{ x: width * 0.75, y: 0 }}
            autoStart
            explosionSpeed={280}
            fallSpeed={4200}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  lottie: {
    ...StyleSheet.absoluteFillObject,
  }
});
