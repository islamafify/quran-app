# Wird Al-Mumin (ورد المؤمن)

Wird Al-Mumin is a comprehensive React Native application built with [Expo](https://expo.dev) that serves as a beautiful and featured-rich Islamic companion app. It offers tools for reading the Holy Quran, getting accurate prayer times, and finding the Qibla direction, designed with a focus on a serene user experience and modern UI constraints.

## ✨ Features

- **Quran Reader**: A smooth and performant reading experience utilizing Uthmani script and dynamic page rendering.
- **Prayer Times**: Accurate global prayer time calculations based on the user's location.
- **Qibla Direction**: Compass integration for finding the exact Qibla direction.
- **Background Audio**: Listen to Quran recitations seamlessly even when the app is in the background.
- **Push Notifications**: Receive timely reminders for prayer times.
- **Offline Support**: Stores necessary data locally for swift loading and offline access.
- **Modern & Responsive Design**: A refined, aesthetic UI optimized for both mobile and tablet devices.

## 🛠️ Tech Stack & Key Libraries

The application is built leveraging the modern React Native and Expo ecosystem:

### Core
- **[React Native]((https://reactnative.dev))** & **[Expo]((https://expo.dev))** (SDK 52+ / v54.x)
- **[Expo Router](https://docs.expo.dev/router/introduction/)**: File-based routing for navigation.

### Key Libraries
- **Quran & Islamic Tools**: 
  - [`@quranjs/api`](https://github.com/quran/api): Connecting with Quran.com APIs.
  - [`adhan`](https://github.com/batoulapps/adhan-js): Highly accurate prayer time calculation.
- **UI & Performance**:
  - [`@shopify/flash-list`](https://shopify.github.io/flash-list/): Fast and highly performant list rendering.
  - [`react-native-reanimated`](https://docs.swmansion.com/react-native-reanimated/): Fluid and buttery smooth animations.
  - [`react-native-safe-area-context`](https://docs.expo.dev/versions/latest/sdk/safe-area-context/): Handling device notches and home indicators.
  - [`@expo-google-fonts/readex-pro`](https://github.com/expo/google-fonts): Elegant Arabic typography.
  - [`lucide-react-native`](https://lucide.dev/) & [`@expo/vector-icons`](https://icons.expo.fyi/): Beautiful iconography.
- **Device & System Integration**:
  - [`expo-location`](https://docs.expo.dev/versions/latest/sdk/location/): Geo-location for accurate prayer times and Qibla.
  - [`expo-av`](https://docs.expo.dev/versions/latest/sdk/av/) / `expo-audio`: Audio playback for recitations.
  - [`expo-notifications`](https://docs.expo.dev/versions/latest/sdk/notifications/): Local push notifications.
  - [`@react-native-async-storage/async-storage`](https://react-native-async-storage.github.io/async-storage/): Persistent local data storage.

## 🚀 Getting Started

Follow these steps to run the project locally on your machine.

### Prerequisites

- Node.js (v18 or higher recommended)
- `npm` or `yarn` or `pnpm`
- [Expo Go](https://expo.dev/client) app installed on your iOS or Android device (for quick testing).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/quran-app.git
   cd quran-app
   ```

2. **Setup Environment Configuration:**
   For the project to run cleanly (and since the production `app.json` has Expo EAS configurations), copy the example configuration:
   ```bash
   cp app.example.json app.json
   ```
   *(On Windows, you can simply duplicate `app.example.json` and rename it to `app.json`).*

3. **Install Dependencies:**
   ```bash
   npm install
   ```
   *(If you use Yarn or PNPM, adapt accordingly, e.g., `yarn install`)*

### Running the App

Start the Expo development server:

```bash
npx expo start
```

- **Android:** Press `a` in the terminal to open the app on a connected Android device or emulator.
- **iOS:** Press `i` to open the app on an iOS simulator.
- **Expo Go:** Scan the QR code shown in the terminal using your phone's camera (iOS) or the Expo Go app (Android).

## 📄 License

This project is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute it.

---

*“Whoever guides someone to goodness will have a reward like one who did it.” (Hadith - Sahih Muslim)*
