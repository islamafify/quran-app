import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FontAwesome5 } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'].nusuk;
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.gold,
        tabBarInactiveTintColor: '#9CA3AF', // Gray-400
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            bottom: 0,
            borderTopWidth: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            backgroundColor: '#ffffff',
            height: 50 + insets.bottom,
            paddingTop: 10,
          },
          default: {
            borderTopWidth: 0,
            // elevation: 10,
            backgroundColor: '#ffffff',
            height: 50 + insets.bottom,
            paddingTop: 10,
            paddingBottom: 10 + insets.bottom,
          },
        }),
      }}>

      {/* 3. Home (Center/Main - Hexagon) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color }) => (
            <FontAwesome5
              name="home"
              size={24}
              color={color}
            // fill={focused ? theme.gold : 'transparent'}
            // strokeWidth={focused ? 0 : 1.5}
            />
          ),
        }}
      />

      {/* 1. Qibla */}
      <Tabs.Screen
        name="qibla"
        options={{
          title: 'القبلة',
          tabBarIcon: ({ color }) => <FontAwesome5 name="kaaba" size={20} color={color} />,
        }}
      />

      {/* 2. Prayer Times */}
      <Tabs.Screen
        name="prayers"
        options={{
          title: 'الصلاة',
          tabBarIcon: ({ color }) => <FontAwesome5 name="mosque" size={20} color={color} />,
        }}
      />





      {/* 3.5. Azkar (BookOpen) */}
      <Tabs.Screen
        name="azkar"
        options={{
          title: 'الأذكار',
          tabBarIcon: ({ color }) => <FontAwesome5 name="praying-hands" size={20} color={color} />,
        }}
      />

      {/* 4. Favorites (Star) */}
      {/* <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color }) => <Star size={24} color={color} strokeWidth={1.5} />,
        }}
      /> */}

      {/* 5. Listen Quran */}
      <Tabs.Screen
        name="listen"
        options={{
          title: 'الاستماع',
          tabBarIcon: ({ color }) => <FontAwesome5 name="headphones" size={20} color={color} />,
          tabBarStyle: { display: 'none' },
        }}
      />

      {/* 6. Explore (Grid/Right) */}

    </Tabs>
  );
}
