import { GradientBackground } from '@/components/home/GradientBackground';
import { Header } from '@/components/home/Header';
import { PrayerTimer } from '@/components/home/PrayerTimer';
import { QuickAccess } from '@/components/home/QuickAccess';
import { QuranSheet } from '@/components/home/QuranSheet';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <GradientBackground>
      <Header />
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 10 }]} showsVerticalScrollIndicator={false}>
        <PrayerTimer />
        <QuickAccess />
        {/* <View style={styles.spacer} /> */}
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
  // spacer: {
  //   // height: 40,
  // },
});
