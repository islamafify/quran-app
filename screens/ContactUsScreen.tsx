import NetInfo from '@react-native-community/netinfo';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ContactUsScreen() {
    const insets = useSafeAreaInsets();
    const [isLoading, setIsLoading] = useState(true);
    const [isConnected, setIsConnected] = useState<boolean | null>(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected);
        });
        return () => unsubscribe();
    }, []);

    if (isConnected === false) {
        return (
            <View style={[styles.container, { paddingBottom: insets.bottom }]}>
                <Stack.Screen
                    options={{
                        headerTitle: 'تواصل معنا',
                        headerBackTitle: 'عودة',
                        headerStyle: { backgroundColor: '#D4AF37' },
                        headerTintColor: '#fff',
                        headerTitleStyle: { color: '#fff', fontFamily: 'ReadexPro_600SemiBold' },
                    }}
                />
                <View style={styles.offlineContainer}>
                    <Text style={styles.offlineText}>لا يوجد اتصال بالانترنت</Text>
                    <Text style={styles.offlineSubText}>يرجى التحقق من اتصالك والمحاولة مرة أخرى</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <Stack.Screen
                options={{
                    headerTitle: 'تواصل معنا',
                    headerBackTitle: 'عودة',
                    headerStyle: { backgroundColor: '#D4AF37' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { color: '#fff', fontFamily: 'ReadexPro_600SemiBold' },
                }}
            />

            <WebView
                source={{ uri: 'https://forms.gle/nxrXcrCt3ACtdAS67' }}
                style={styles.webview}
                startInLoadingState={true}
                domStorageEnabled={true}
                cacheEnabled={true}
                cacheMode="LOAD_CACHE_ELSE_NETWORK"
                renderLoading={() => (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#D4AF37" />
                    </View>
                )}
                onLoadEnd={() => setIsLoading(false)}
            />
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
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    offlineContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    offlineText: {
        fontSize: 18,
        fontFamily: 'ReadexPro_600SemiBold',
        color: '#D4AF37',
        marginBottom: 8,
    },
    offlineSubText: {
        fontSize: 14,
        fontFamily: 'ReadexPro_400Regular',
        color: '#666',
        textAlign: 'center',
    },
});
