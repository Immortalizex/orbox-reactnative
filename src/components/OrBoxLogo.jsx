import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699796dd50ed905adc64cbea/b77565cc4_Artboard1copy14.png';

export function OrBoxIcon({ size = 32 }) {
  return (
    <Image
      source={{ uri: LOGO_URL }}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

export function OrBoxLogoFull({ height = 36 }) {
  return (
    <View style={styles.row}>
      <Image
        source={{ uri: LOGO_URL }}
        style={{ width: height, height }}
        resizeMode="contain"
      />
      <Text style={[styles.fitText, { fontSize: height * 0.45 }]}>Fit</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fitText: { fontWeight: '800', color: '#BFFF00', letterSpacing: -0.5 },
});

export default OrBoxIcon;
