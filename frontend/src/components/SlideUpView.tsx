import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

export const SlideUpView: React.FC<{ children: React.ReactNode, style?: StyleProp<ViewStyle> }> = ({ children, style }) => {
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8
    }).start();
  }, []);

  return (
    <Animated.View style={[style, { transform: [{ translateY: slideAnim }] }]}>
      {children}
    </Animated.View>
  );
};
