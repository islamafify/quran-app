import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

let currentSound: AudioPlayer | null = null;

export const playVerseAudio = async (verseKey: string, reciterId: number = 7) => {
    try {
        if (currentSound) {
            currentSound.release();
            currentSound = null;
        }

        // Configure audio session for background playback
        await setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
            shouldRouteThroughEarpiece: false,
            interruptionMode: 'doNotMix',
            allowsRecording: false
        });

        const res = await fetch(`https://api.quran.com/api/v4/recitations/${reciterId}/by_ayah/${verseKey}`);
        const data = await res.json();

        if (data.audio_files && data.audio_files.length > 0) {
            let url = data.audio_files[0].url;

            // Handle different URL formats from the API
            if (url.startsWith('//')) {
                url = 'https:' + url;
            } else if (!url.startsWith('http')) {
                url = `https://verses.quran.com/${url}`;
            }

            currentSound = createAudioPlayer(url);

            currentSound.addListener('playbackStatusUpdate', (status) => {
                if (status.didJustFinish) {
                    currentSound?.release();
                    currentSound = null;
                }
            });

            currentSound.play();

            return true;
        } else {
            throw new Error('لم يتم العثور على تلاوة لهذه الآية');
        }
    } catch (error) {
        console.error('Error playing audio', error);
        throw error;
    }
};

export const stopAudio = async () => {
    if (currentSound) {
        currentSound.release();
        currentSound = null;
    }
};
