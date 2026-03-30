import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { fonts } from '../theme/colors';

export default function GradientButton({
  onPress,
  disabled = false,
  style,
  contentStyle,
  textStyle,
  children,
  row = false,
  ...rest
}) {
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
      <View
        style={[
          styles.shadowWrap,
          typeof contentStyle?.borderRadius === 'number' && { borderRadius: contentStyle.borderRadius },
        ]}
      >
        <View style={[styles.surface, contentStyle, disabled && styles.surfaceDisabled]}>
          <View style={[styles.inner, row && styles.innerRow]} pointerEvents="none">
            {content}
          </View>
        </View>
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.28,
        shadowRadius: 18,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  surface: {
    borderRadius: 9999,
    overflow: 'hidden',
    backgroundColor: '#f89b14',
    paddingVertical: 16,
    paddingHorizontal: 36,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  surfaceDisabled: {
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
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
