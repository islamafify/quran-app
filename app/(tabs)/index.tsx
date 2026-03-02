import { GradientBackground } from '@/components/nusuk/GradientBackground';
import { Header } from '@/components/nusuk/Header';
import { PrayerTimer } from '@/components/nusuk/PrayerTimer';
import { QuickAccess } from '@/components/nusuk/QuickAccess';
import { QuranSheet } from '@/components/nusuk/QuranSheet';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <GradientBackground>
      <Header />
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]} showsVerticalScrollIndicator={false}>
        <PrayerTimer />
        <QuickAccess />
        <View style={styles.spacer} />
        <QuranSheet />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    // paddingBottom: 80, // Handled inline
  },
  spacer: {
    height: 40,
  },
});
