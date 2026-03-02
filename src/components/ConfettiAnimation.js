import React, { useEffect } from 'react';
import { View, Animated, Easing } from 'react-native';

/**
 * ConfettiAnimation - Pure UI component for task completion celebration
 * No side effects on streak/points/completion logic
 * Uses simple animated pulse effect as fallback (no Lottie dependency)
 */
export default function ConfettiAnimation({ isVisible, duration = 2500 }) {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isVisible) {
      scaleAnim.setValue(0);
      opacityAnim.setValue(1);

      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.delay(duration - 500),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [isVisible, duration]);

  if (!isVisible) {
    return null;
  }

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 999,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Animated success circle */}
      <Animated.View
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: '#10B981',
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View style={{ fontSize: 48 }}>
          <Animated.Text
            style={{
              fontSize: 48,
              fontWeight: 'bold',
              color: '#FFF',
            }}
          >
            ✓
          </Animated.Text>
        </View>
      </Animated.View>

      {/* Pulsing rings effect */}
      <Animated.View
        style={{
          position: 'absolute',
          width: 100,
          height: 100,
          borderRadius: 50,
          borderWidth: 3,
          borderColor: '#10B981',
          transform: [{ scale: Animated.add(scaleAnim, 0.5) }],
          opacity: Animated.multiply(opacityAnim, 0.5),
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          width: 140,
          height: 140,
          borderRadius: 70,
          borderWidth: 2,
          borderColor: '#10B981',
          transform: [{ scale: Animated.add(scaleAnim, 1) }],
          opacity: Animated.multiply(opacityAnim, 0.3),
        }}
      />
    </View>
  );
}
