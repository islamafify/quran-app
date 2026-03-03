import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet } from 'react-native';

interface GradientBackgroundProps {
    children: React.ReactNode;
}

export function GradientBackground({ children }: GradientBackgroundProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'].nusuk;

    return (
        <LinearGradient
            colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0, 0.5, 1]}
            style={styles.container}>
            {children}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
