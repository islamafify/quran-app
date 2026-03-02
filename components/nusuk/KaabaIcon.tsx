import React from 'react';
import { StyleSheet, View } from 'react-native';

interface KaabaIconProps {
    size?: number;
}

export function KaabaIcon({ size = 32 }: KaabaIconProps) {
    const scale = size / 32; // Base design on 32px

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* Main Cube */}
            <View style={[styles.cube, { borderRadius: 4 * scale }]} />

            {/* Gold Band */}
            <View style={[styles.goldBand, { top: 8 * scale, height: 4 * scale }]} />

            {/* Door */}
            <View style={[styles.door, { width: 8 * scale, height: 14 * scale, bottom: 0, right: 6 * scale }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    cube: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000000',
    },
    goldBand: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: '#D4AF37', // Gold
    },
    door: {
        position: 'absolute',
        backgroundColor: '#D4AF37', // Gold
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
    },
});
