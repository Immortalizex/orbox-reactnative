import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const CARD_GRADIENT = ['rgba(28,28,28,0.95)', 'rgba(18,18,18,0.98)'];
const CARD_GRADIENT_ACCENT = ['rgba(35,28,18,0.95)', 'rgba(25,20,12,0.98)'];

const ICON_GREEN = '#4ade80';
const ICON_BLUE = '#60a5fa';

export default function QuickStatCard({ icon, iconName, label, value, accent, green, blue, white }) {
  const name = iconName || 'stats-chart';
  const iconColor = accent ? '#f7941d' : green ? ICON_GREEN : blue ? ICON_BLUE : white ? '#fff' : 'rgba(255,255,255,0.5)';
  return (
    <View style={[styles.cardOuter, accent && styles.cardOuterAccent, green && styles.cardOuterGreen, blue && styles.cardOuterBlue]}>
      <LinearGradient
        colors={accent ? CARD_GRADIENT_ACCENT : CARD_GRADIENT}
        style={[styles.card, accent && styles.cardAccent, green && styles.cardGreen, blue && styles.cardBlue]}
      >
        <View style={[styles.iconWrap, accent && styles.iconWrapAccent, green && styles.iconWrapGreen, blue && styles.iconWrapBlue]}>
          <Ionicons name={name} size={24} color={iconColor} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.label}>{label}</Text>
          <Text style={[styles.value, accent && styles.valueAccent]}>{value}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    flex: 1,
    minWidth: 0,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.4)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  cardOuterAccent: {
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(247,148,29,0.35)',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  cardOuterGreen: {
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(74,222,128,0.3)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  cardOuterBlue: {
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(96,165,250,0.3)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,220,180,0.06)',
    overflow: 'hidden',
  },
  cardAccent: {
    borderColor: 'rgba(247,148,29,0.12)',
  },
  cardGreen: {},
  cardBlue: {
    borderColor: 'rgba(96,165,250,0.15)',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapAccent: {
    backgroundColor: 'rgba(247,148,29,0.2)',
  },
  iconWrapGreen: {
    backgroundColor: 'rgba(74,222,128,0.2)',
  },
  iconWrapBlue: {
    backgroundColor: 'rgba(96,165,250,0.2)',
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  valueAccent: {
    color: '#f7941d',
  },
});
