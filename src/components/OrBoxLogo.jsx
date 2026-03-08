import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

const logoSource = require('../../assets/logo.png');

export function OrBoxIcon({ size = 32 }) {
  return (
    <Image
      source={logoSource}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

export function OrBoxLogoFull({ height = 36 }) {
  return (
    <View style={styles.row}>
      <Image
        source={logoSource}
        style={{ width: height, height }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});

export default OrBoxIcon;
