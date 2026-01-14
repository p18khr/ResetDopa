// src/components/Logo.js
import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Circle, Path } from 'react-native-svg';

export default function Logo({ size = 72, style }) {
  const radius = size / 2;
  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#4A90E2" stopOpacity="1" />
            <Stop offset="100%" stopColor="#3B82F6" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Background circle */}
        <Circle cx="50" cy="50" r="46" fill="url(#grad)" />

        {/* Lightning bolt */}
        <Path
          d="M57 18 L40 45 L53 45 L45 82 L72 50 L57 50 Z"
          fill="#FFFFFF"
        />

        {/* Reset arc accent */}
        <Path
          d="M22 50 A28 28 0 0 1 78 50"
          stroke="#FFFFFF"
          strokeOpacity="0.4"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
