import TasbihScreen from '@/screens/TasbihScreen';
import { Stack } from 'expo-router';

export default function TasbihRoute() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <TasbihScreen />
        </>
    );
}
