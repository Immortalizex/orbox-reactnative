import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '../theme/colors';

const GRADIENT_COLORS = ['#d4881a', '#e99a18', '#ffb52e', '#e99a18', '#d4881a'];
const GRADIENT_START = { x: 0, y: 0.4 };
const GRADIENT_END = { x: 1, y: 0.4 };
const SHINE_DURATION = 2000;
const SHINE_PAUSE_MS = 700;

export default function GradientButton({
  onPress,
  disabled = false,
  style,
  contentStyle,
  textStyle,
  children,
  shine = true,
  row = false,
  ...rest
}) {
  const shineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!shine || disabled) return;
    const sweep = Animated.timing(shineAnim, {
      toValue: 1,
      duration: SHINE_DURATION,
      useNativeDriver: true,
    });
    const pause = Animated.delay(SHINE_PAUSE_MS);
    const loop = Animated.loop(Animated.sequence([sweep, pause]), {
      resetBeforeIteration: true,
    });
    loop.start();
    return () => loop.stop();
  }, [shine, disabled, shineAnim]);

  const shineTranslate = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-220, 420],
  });

  const content = typeof children === 'string' ? (
    <Text style={[styles.text, textStyle]}>{children}</Text>
  ) : (
    children
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.88}
      style={[styles.outer, style]}
      {...rest}
    >
      <View style={[styles.shadowWrap, typeof contentStyle?.borderRadius === 'number' && { borderRadius: contentStyle.borderRadius }]}>
        <LinearGradient
          colors={GRADIENT_COLORS}
          start={GRADIENT_START}
          end={GRADIENT_END}
          locations={[0, 0.35, 0.5, 0.65, 1]}
          style={[styles.gradient, contentStyle, disabled && styles.gradientDisabled]}
        >
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <LinearGradient
              colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.02)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
          <View style={[styles.inner, row && styles.innerRow]} pointerEvents="none">
            {content}
          </View>
          {shine && !disabled && (
            <Animated.View
              style={[
                styles.shineBand,
                {
                  transform: [{ translateX: shineTranslate }],
                },
              ]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={[
                  'transparent',
                  'rgba(255,255,255,0.15)',
                  'rgba(255,255,255,0.5)',
                  'rgba(255,255,255,0.15)',
                  'transparent',
                ]}
                start={{ x: 0, y: 0.3 }}
                end={{ x: 1, y: 0.7 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          )}
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignSelf: 'stretch',
  },
  shadowWrap: {
    borderRadius: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#f89b14',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  gradient: {
    borderRadius: 9999,
    overflow: 'hidden',
    paddingVertical: 16,
    paddingHorizontal: 36,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  gradientDisabled: {
    opacity: 0.6,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRow: {
    flexDirection: 'row',
    gap: 6,
  },
  text: {
    color: '#1a1a1a',
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  shineBand: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 180,
    left: 0,
  },
});
