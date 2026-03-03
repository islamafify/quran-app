import { ReadexPro_300Light, ReadexPro_400Regular, ReadexPro_500Medium, ReadexPro_600SemiBold, ReadexPro_700Bold, useFonts } from '@expo-google-fonts/readex-pro';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import '@/utils/notifications'; // تسجيل اعدادات التنبيهات
import { I18nManager, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';

// Force LTR layout (since the design relies on manual row-reverse)
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

import { toastConfig } from '@/components/ui/Toast';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// علم عام لمعرفة ما إذا تم تحميل القرآن في الخلفية بنجاح
(global as any).isQuranPreloaded = false;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    ReadexPro_300Light,
    ReadexPro_400Regular,
    ReadexPro_500Medium,
    ReadexPro_600SemiBold,
    ReadexPro_700Bold,
    UthmanicHafs: require('../assets/fonts/uthmanic_hafs_v22.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      {/* <StatusBar style="auto" /> */}
      <Toast config={toastConfig} />

      {/* تحميل مسبق في الخلفية لصفحة القرآن لكي تفتح فوراً عند الطلب */}
      <View style={{ width: 1, height: 1, opacity: 0.01, position: 'absolute', top: -9999, left: -9999 }} pointerEvents="none">
        <WebView
          source={{ uri: 'https://alquran-alkarim.com/apps/' }}
          domStorageEnabled={true}
          cacheEnabled={true}
          cacheMode="LOAD_CACHE_ELSE_NETWORK"
          onLoadEnd={() => { (global as any).isQuranPreloaded = true; }}
        />
      </View>
    </ThemeProvider>
  );
}
