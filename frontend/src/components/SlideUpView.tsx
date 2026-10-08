import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleProp, ViewStyle, Dimensions } from 'react-native';

interface SlideUpViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  draggable?: boolean;
  minimizedOffset?: number; // How far down it translates when minimized
  initialMinimized?: boolean;
}

export const SlideUpView: React.FC<SlideUpViewProps> = ({ children, style, draggable, minimizedOffset = 200, initialMinimized = false }) => {
  const [isMinimized, setIsMinimized] = useState(initialMinimized);
  const isMinimizedRef = useRef(isMinimized);
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    isMinimizedRef.current = isMinimized;
  }, [isMinimized]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: initialMinimized ? minimizedOffset : 0,
      useNativeDriver: false,
      tension: 50,
      friction: 8
    }).start();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !!draggable && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (!draggable) return;
        const baseOffset = isMinimizedRef.current ? minimizedOffset : 0;
        let newOffset = baseOffset + gestureState.dy;
        if (newOffset < 0) newOffset = 0; // Prevent dragging above original position
        slideAnim.setValue(newOffset);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!draggable) return;
        let minimize = isMinimizedRef.current;
        if (gestureState.dy > 50 || gestureState.vy > 0.5) {
          minimize = true;
        } else if (gestureState.dy < -50 || gestureState.vy < -0.5) {
          minimize = false;
        }
        setIsMinimized(minimize);
        Animated.spring(slideAnim, {
          toValue: minimize ? minimizedOffset : 0,
          useNativeDriver: false,
          tension: 50,
          friction: 8
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(slideAnim, {
          toValue: isMinimizedRef.current ? minimizedOffset : 0,
          useNativeDriver: false,
          tension: 50,
          friction: 8
        }).start();
      }
    })
  ).current;

  return (
    <Animated.View {...(draggable ? panResponder.panHandlers : {})} style={[style, { transform: [{ translateY: slideAnim }] }]}>
      {children}
    </Animated.View>
  );
};
