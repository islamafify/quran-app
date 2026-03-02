import { OfflineQuranReader } from '@/components/nusuk/OfflineQuranReader';
import NetInfo from '@react-native-community/netinfo';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function QuranWebScreen() {
    const insets = useSafeAreaInsets();
    const [isOffline, setIsOffline] = useState(false);
    const [isLoading, setIsLoading] = useState(!(global as any).isQuranPreloaded);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            if (state.isConnected !== null) {
                setIsOffline(!state.isConnected);
            }
        });
        return () => unsubscribe();
    }, []);

    const toggleMode = () => setIsOffline(!isOffline);

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <Stack.Screen
                options={{
                    headerTitle: 'القرآن الكريم',
                    headerBackTitle: 'عودة',
                    headerStyle: { backgroundColor: '#000' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { color: '#fff' },

                }}
            />

            {isOffline ? (
                <OfflineQuranReader />
            ) : (
                <View style={styles.webview}>
                    <WebView
                        source={{ uri: 'https://moshfy.com/p/quran/' }}
                        style={styles.webview}
                        domStorageEnabled={true}
                        cacheEnabled={true}
                        cacheMode="LOAD_CACHE_ELSE_NETWORK"
                        onError={() => setIsOffline(true)}
                        onHttpError={() => setIsOffline(true)}
                        onLoadEnd={() => {
                            setIsLoading(false);
                            (global as any).isQuranPreloaded = true;
                        }}
                    />
                    {isLoading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#D4AF37" />
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    webview: {
        flex: 1,
        // marginBottom: 20,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        // transparent so user sees something is happening behind?? No, make it opaque for clean loading.
        backgroundColor: '#ffffff',
    },
    headerButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        marginRight: 10,
    },
    headerButtonText: {
        fontSize: 14,
        color: '#374151',
        fontFamily: 'ReadexPro_600SemiBold', // Updated font
    },
});
