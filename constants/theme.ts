/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */


const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    nusuk: {
      gold: '#D4AF37', // Gold matching the icon
      gradientStart: '#4A1C40', // Deep purple
      gradientMid: '#904D54', // Transition color
      gradientEnd: '#E8AF8C', // Peach/Orange
      cardBg: '#FFFFFF',
      textPrimary: '#1F2937', // Gray-800
      textSecondary: '#6B7280', // Gray-500
      accent: '#C27803', // Darker gold for active states
    },
    quranReader: {
      text: '#11181C',
      background: '#FFF9E6',
      controlsBg: 'rgba(255, 255, 255, 0.95)',
      verseText: '#000000',
      verseNumber: '#A17B3F',
      ayahMenuBg: '#FFFFFF',
      separator: '#E5E7EB',
    }
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    nusuk: {
      gold: '#D4AF37',
      gradientStart: '#4A1C40',
      gradientMid: '#904D54',
      gradientEnd: '#E8AF8C',
      cardBg: '#1F2937', // Dark mode card background
      textPrimary: '#F9FAFB', // Gray-50
      textSecondary: '#D1D5DB', // Gray-300
      accent: '#FCD34D', // Lighter gold
    },
    quranReader: {
      text: '#ECEDEE',
      background: '#151718',
      controlsBg: 'rgba(31, 41, 55, 0.95)',
      verseText: '#E5E7EB',
      verseNumber: '#D4AF37',
      ayahMenuBg: '#1F2937',
      separator: '#374151',
    }
  },
};

export const Fonts = {
  // We can just use the loaded font names directly
  regular: 'ReadexPro_400Regular',
  medium: 'ReadexPro_500Medium',
  semiBold: 'ReadexPro_600SemiBold',
  bold: 'ReadexPro_700Bold',
  light: 'ReadexPro_300Light',
};
