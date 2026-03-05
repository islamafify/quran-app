import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import Slider from '@react-native-community/slider';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Directory, File, Paths } from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, DeviceEventEmitter, Dimensions, FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { CHAPTERS, RECATIONS } from '../../constants/quranData';

const { width } = Dimensions.get('window');

const colors = {
    primary: '#D4AF37',
    bgDark: '#4A1C40',
    bgDarker: '#1E1528',
    glass: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    textLight: '#f1f5f9',
    textMuted: '#D1D5DB',
};

// Reciter images from assets
const RECITER_IMAGES: { [key: number]: any } = {
    1: require('../../assets/Reciters/abdulbasit.png'),
    2: require('../../assets/Reciters/abdulbasit.png'),
    3: require('../../assets/Reciters/sudais.jpg'),
    4: require('../../assets/Reciters/shatri.jpg'),
    5: require('../../assets/Reciters/rifai.jpg'),
    6: require('../../assets/Reciters/husary.jpg'),
    7: require('../../assets/Reciters/afasy.jpg'),
    8: require('../../assets/Reciters/minshawi.jpg'),
    9: require('../../assets/Reciters/minshawi.jpg'),
    10: require('../../assets/Reciters/shuraim.jpg'),
    11: require('../../assets/Reciters/tablawi.jpeg'),
    12: require('../../assets/Reciters/husary.jpg'),
    1001: require('../../assets/Reciters/minshawi.jpg'),
    1002: require('../../assets/Reciters/faris.jpg'),
    1003: require('../../assets/Reciters/maher.jpg'),
    1004: require('../../assets/Reciters/yasser.jpg'),
    1005: require('../../assets/Reciters/ghamdi.jpg'),
    1006: require('../../assets/Reciters/ajami.jpg'),
    1007: require('../../assets/Reciters/jibril.jpg'),
};

interface Reciter {
    id: number;
    reciter_name: string;
    style: string | null;
    translated_name: { name: string; language_name: string };
    folder?: string;
}

const NEW_RECITERS: Reciter[] = [
    { id: 1001, reciter_name: "محمد صديق المنشاوي", style: null, translated_name: { name: "محمد صديق المنشاوي", language_name: "arabic" }, folder: "minsh" },
    { id: 1002, reciter_name: "فارس عباد", style: null, translated_name: { name: "فارس عباد", language_name: "arabic" }, folder: "frs_a" },
    { id: 1003, reciter_name: "ماهر المعيقلي", style: null, translated_name: { name: "ماهر المعيقلي", language_name: "arabic" }, folder: "maher" },
    { id: 1004, reciter_name: "ياسر الدوسري", style: null, translated_name: { name: "ياسر الدوسري", language_name: "arabic" }, folder: "yasser" },
    { id: 1005, reciter_name: "سعد الغامدي", style: null, translated_name: { name: "سعد الغامدي", language_name: "arabic" }, folder: "s_gmd" },
    { id: 1006, reciter_name: "أحمد بن علي العجمي", style: null, translated_name: { name: "أحمد بن علي العجمي", language_name: "arabic" }, folder: "ajm" },
    { id: 1007, reciter_name: "محمد جبريل", style: null, translated_name: { name: "محمد جبريل", language_name: "arabic" }, folder: "jbrl" },
];

interface Chapter {
    id: number;
    name_arabic: string;
    name_simple: string;
    verses_count: number;
    translated_name: { name: string };
}

export default function ListenQuranScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [reciters, setReciters] = useState<Reciter[]>([]);
    const [chapters, setChapters] = useState<Chapter[]>([]);

    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOffline(state.isConnected === false);
        });
        return () => unsubscribe();
    }, []);

    const [selectedReciter, setSelectedReciter] = useState<Reciter | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [showPlayer, setShowPlayer] = useState(false);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [showAllReciters, setShowAllReciters] = useState(false);

    const reciterListRef = React.useRef<FlatList>(null);

    const [downloadedChapters, setDownloadedChapters] = useState<string[]>([]);
    const [downloadingChapters, setDownloadingChapters] = useState<string[]>([]);
    const downloadAbortControllers = React.useRef<Record<string, AbortController>>({});
    const [hasTriggeredNext, setHasTriggeredNext] = useState(false);
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekValue, setSeekValue] = useState(0);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const { recitations } = RECATIONS;

                // Filter out Minshawi (id: 8, 9) and Group by reciter name to avoid consecutive duplicates
                const grouped = new Map<string, Reciter[]>();
                const excludeIds = [8, 9];

                recitations.forEach((r: Reciter) => {
                    if (excludeIds.includes(r.id)) return; // Exclude Minshawi

                    const name = r.translated_name.name;
                    if (!grouped.has(name)) grouped.set(name, []);
                    grouped.get(name)!.push(r);
                });

                // Distribute reciters
                const distributed: Reciter[] = [];
                let hasMore = true;
                while (hasMore) {
                    hasMore = false;
                    for (const [name, list] of grouped.entries()) {
                        if (list.length > 0) {
                            distributed.push(list.shift()!);
                            hasMore = true;
                        }
                    }
                }

                const allReciters = [...NEW_RECITERS, ...distributed];

                setReciters(allReciters);
                const savedId = await AsyncStorage.getItem('selectedReciterId');
                if (savedId) {
                    const saved = allReciters.find((r: Reciter) => r.id.toString() === savedId);
                    if (saved) {
                        setSelectedReciter(saved);
                    } else {
                        setSelectedReciter(allReciters[0]);
                    }
                } else {
                    setSelectedReciter(allReciters[0]);
                }
            } catch (err) {
                console.error(err);
            }

            try {
                setChapters(CHAPTERS.chapters as any);
            } catch (err) {
                console.error(err);
            }
        };

        loadInitialData();
    }, []);

    useEffect(() => {
        const loadDownloads = async () => {
            try {
                const destination = new Directory(Paths.document, 'quran_audio');
                if (!destination.exists) {
                    await destination.create({ idempotent: true });
                }
                const files = await destination.list();
                const downloaded: string[] = [];
                for (const file of files) {
                    if (file.name.startsWith('quran_audio_') && file.name.endsWith('.mp3')) {
                        const parts = file.name.replace('quran_audio_', '').replace('.mp3', '').split('_');
                        if (parts.length === 2) {
                            downloaded.push(`${parts[0]}_${parts[1]}`);
                        }
                    }
                }
                setDownloadedChapters(downloaded);
            } catch (e) { console.error(e); }
        };
        loadDownloads();
    }, []);

    const hasDownloads = downloadedChapters.length > 0;
    const recitersWithDownloads = reciters.filter(r => downloadedChapters.some(key => key.startsWith(`${r.id}_`)));

    // Always show all reciters — dim them if offline with no downloads
    const displayedReciters = reciters;

    // Auto-select first available reciter when going offline with downloads
    useEffect(() => {
        if (isOffline && hasDownloads && selectedReciter) {
            const currentHasDownloads = downloadedChapters.some(key => key.startsWith(`${selectedReciter.id}_`));
            if (!currentHasDownloads && recitersWithDownloads.length > 0) {
                handleSelectReciter(recitersWithDownloads[0]);
                Toast.show({
                    type: 'info',
                    text1: 'وضع عدم الاتصال',
                    text2: `تم اختيار ${recitersWithDownloads[0].translated_name.name} (متوفر أوفلاين)`,
                    position: 'bottom'
                });
            }
        }
    }, [isOffline, hasDownloads]);

    const isReciterAvailableOffline = (reciterId: number) => {
        if (!isOffline) return true;
        return downloadedChapters.some(key => key.startsWith(`${reciterId}_`));
    };

    const isSurahAvailableOffline = (chapterId: number) => {
        if (!isOffline) return true;
        if (!selectedReciter) return false;
        return downloadedChapters.includes(`${selectedReciter.id}_${chapterId}`);
    };

    const handleSelectReciter = async (reciter: Reciter) => {
        setSelectedReciter(reciter);
        setShowAllReciters(false);
        try {
            await AsyncStorage.setItem('selectedReciterId', reciter.id.toString());
        } catch (e) {
            console.error('Error saving reciter', e);
        }

        const index = displayedReciters.findIndex(r => r.id === reciter.id);
        if (index !== -1 && reciterListRef.current) {
            reciterListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
        }
    };

    useEffect(() => {
        if (displayedReciters.length > 0 && selectedReciter && reciterListRef.current) {
            const index = displayedReciters.findIndex(r => r.id === selectedReciter.id);
            if (index !== -1) {
                // small delay to ensure flatlist layout
                setTimeout(() => {
                    reciterListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
                }, 500);
            }
        }
    }, [reciters, selectedReciter?.id, isOffline, downloadedChapters]);

    const player = useAudioPlayer(null);
    const status = useAudioPlayerStatus(player);
    const isPlaying = status.playing;

    useEffect(() => {
        const sub = DeviceEventEmitter.addListener('stop_all_audio', (sourceId) => {
            if (sourceId !== 'listen') {
                if (isPlaying && player) {
                    player.pause();
                    if (typeof player.setActiveForLockScreen === 'function') {
                        player.setActiveForLockScreen(false);
                    }
                }
            }
        });
        return () => sub.remove();
    }, [isPlaying, player]);

    const downloadAudio = async (chapter: Chapter) => {
        if (!selectedReciter) return;
        const downloadKey = `${selectedReciter.id}_${chapter.id}`;
        if (downloadingChapters.includes(downloadKey) || downloadedChapters.includes(downloadKey)) return;

        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
            Toast.show({
                type: 'error',
                text1: 'لا يوجد اتصال بالإنترنت',
                text2: 'يرجى التحقق من اتصالك بالإنترنت للتحميل.',
                position: 'bottom',
            });
            return;
        }

        setDownloadingChapters(prev => [...prev, downloadKey]);

        // Create an AbortController for this download
        const abortController = new AbortController();
        downloadAbortControllers.current[downloadKey] = abortController;

        try {
            let url = '';
            if (selectedReciter.folder) {
                url = `https://alquran-alkarim.com/audio/${selectedReciter.folder}/${String(chapter.id).padStart(3, '0')}.mp3`;
            } else {
                const res = await fetch(`https://api.quran.com/api/v4/chapter_recitations/${selectedReciter.id}/${chapter.id}`, { signal: abortController.signal });
                const data = await res.json();
                if (data?.audio_file?.audio_url) {
                    url = data.audio_file.audio_url;
                }
            }

            if (url) {
                const destinationFolder = new Directory(Paths.document, 'quran_audio');
                if (!destinationFolder.exists) {
                    await destinationFolder.create({ idempotent: true });
                }

                const targetFile = new File(destinationFolder, `quran_audio_${downloadKey}.mp3`);
                await File.downloadFileAsync(url, targetFile);

                // Check if cancelled during download
                if (!abortController.signal.aborted) {
                    setDownloadedChapters(prev => [...prev, downloadKey]);
                } else {
                    // Delete partial file if cancelled
                    try { if (targetFile.exists) targetFile.delete(); } catch (_) { }
                }
            }
        } catch (error: any) {
            if (error?.name === 'AbortError') {
                // Download was cancelled by user, clean up partial file
                try {
                    const destinationFolder = new Directory(Paths.document, 'quran_audio');
                    const targetFile = new File(destinationFolder, `quran_audio_${downloadKey}.mp3`);
                    if (targetFile.exists) targetFile.delete();
                } catch (_) { }
            } else {
                console.error('Error downloading audio: ', error);
            }
        } finally {
            setDownloadingChapters(prev => prev.filter(key => key !== downloadKey));
            delete downloadAbortControllers.current[downloadKey];
        }
    };

    const cancelDownload = async (chapter: Chapter) => {
        if (!selectedReciter) return;
        const downloadKey = `${selectedReciter.id}_${chapter.id}`;

        // Abort the download
        if (downloadAbortControllers.current[downloadKey]) {
            downloadAbortControllers.current[downloadKey].abort();
        }

        // Clean up partial file
        try {
            const destinationFolder = new Directory(Paths.document, 'quran_audio');
            const targetFile = new File(destinationFolder, `quran_audio_${downloadKey}.mp3`);
            if (targetFile.exists) targetFile.delete();
        } catch (_) { }

        setDownloadingChapters(prev => prev.filter(key => key !== downloadKey));
        delete downloadAbortControllers.current[downloadKey];
    };

    const playAudio = async (chapter: Chapter) => {
        if (!selectedReciter) return;
        DeviceEventEmitter.emit('stop_all_audio', 'listen');
        setSelectedChapter(chapter);
        setShowPlayer(true);
        setIsLoadingAudio(true);
        setHasTriggeredNext(false);
        try {
            await setAudioModeAsync({
                playsInSilentMode: true,
                shouldPlayInBackground: true,
                interruptionMode: 'doNotMix',
            });
            const destinationFolder = new Directory(Paths.document, 'quran_audio');
            const targetFile = new File(destinationFolder, `quran_audio_${selectedReciter.id}_${chapter.id}.mp3`);

            let audioUrlToPlay = '';

            if (targetFile.exists) {
                audioUrlToPlay = targetFile.uri;
            } else {
                const netInfo = await NetInfo.fetch();
                if (!netInfo.isConnected) {
                    Toast.show({
                        type: 'error',
                        text1: 'لا يوجد اتصال',
                        text2: 'السورة غير محملة ولا يوجد اتصال لتشغيلها.',
                        position: 'bottom',
                    });
                    setIsLoadingAudio(false);
                    return;
                }

                if (selectedReciter.folder) {
                    audioUrlToPlay = `https://alquran-alkarim.com/audio/${selectedReciter.folder}/${String(chapter.id).padStart(3, '0')}.mp3`;
                } else {
                    const res = await fetch(`https://api.quran.com/api/v4/chapter_recitations/${selectedReciter.id}/${chapter.id}`);
                    const data = await res.json();
                    if (data?.audio_file?.audio_url) {
                        audioUrlToPlay = data.audio_file.audio_url;
                    }
                }
            }

            if (audioUrlToPlay) {
                player.replace(audioUrlToPlay);

                if (typeof player.setActiveForLockScreen === 'function') {
                    player.setActiveForLockScreen(true, {
                        title: `سورة ${chapter.name_arabic}`,
                        artist: selectedReciter.translated_name.name,
                    });
                }
                player.play();
            }
        } catch (error) {
            console.error('Error playing audio: ', error);
        } finally {
            setIsLoadingAudio(false);
        }
    };

    const playNextSurah = () => {
        if (!selectedChapter || chapters.length === 0) return;
        const currentIndex = chapters.findIndex(c => c.id === selectedChapter.id);

        let nextChapterToPlay = null;

        if (isOffline) {
            for (let i = currentIndex + 1; i < chapters.length; i++) {
                const c = chapters[i];
                const key = `${selectedReciter?.id}_${c.id}`;
                if (downloadedChapters.includes(key)) {
                    nextChapterToPlay = c;
                    break;
                }
            }
        } else {
            if (currentIndex >= 0 && currentIndex < chapters.length - 1) {
                nextChapterToPlay = chapters[currentIndex + 1];
            }
        }

        if (nextChapterToPlay) {
            playAudio(nextChapterToPlay);
        } else {
            Toast.show({
                type: 'info',
                text1: 'نهاية القائمة',
                text2: isOffline ? 'لا يوجد المزيد من السور المحملة' : 'لا يوجد المزيد من السور',
                position: 'bottom'
            });
        }
    };

    const playPrevSurah = () => {
        if (!selectedChapter || chapters.length === 0) return;
        const currentIndex = chapters.findIndex(c => c.id === selectedChapter.id);

        let prevChapterToPlay = null;

        if (isOffline) {
            for (let i = currentIndex - 1; i >= 0; i--) {
                const c = chapters[i];
                const key = `${selectedReciter?.id}_${c.id}`;
                if (downloadedChapters.includes(key)) {
                    prevChapterToPlay = c;
                    break;
                }
            }
        } else {
            if (currentIndex > 0) {
                prevChapterToPlay = chapters[currentIndex - 1];
            }
        }

        if (prevChapterToPlay) {
            playAudio(prevChapterToPlay);
        } else {
            Toast.show({
                type: 'info',
                text1: 'بداية القائمة',
                text2: isOffline ? 'لا يوجد سور محملة سابقة' : 'لا يوجد سور سابقة',
                position: 'bottom'
            });
        }
    };

    useEffect(() => {
        if (
            player.isLoaded &&
            !hasTriggeredNext &&
            status.duration > 0 &&
            status.currentTime >= status.duration - 0.5
        ) {
            setHasTriggeredNext(true);
            playNextSurah();
        }
    }, [status.currentTime, status.duration, player.isLoaded, hasTriggeredNext]);

    const togglePlayPause = () => {
        if (isPlaying) {
            player.pause();
            if (typeof player.setActiveForLockScreen === 'function') {
                player.setActiveForLockScreen(false);
            }
        } else {
            DeviceEventEmitter.emit('stop_all_audio', 'listen');
            if (!player.isLoaded && !isLoadingAudio) {
                // If audio is not loaded and not currently loading, try to play it
                if (selectedChapter) {
                    playAudio(selectedChapter);
                }
                return;
            }
            player.play();
            if (typeof player.setActiveForLockScreen === 'function') {
                player.setActiveForLockScreen(true, {
                    title: `سورة ${selectedChapter?.name_arabic || ''}`,
                    artist: selectedReciter?.translated_name.name || '',
                });
            }
        }
    };

    const handleSeek = (value: number) => {
        if (player.isLoaded) {
            player.seekTo(value);
        }
        setIsSeeking(false);
    };

    const handleValueChange = (value: number) => {
        setIsSeeking(true);
        setSeekValue(value);
    };

    const skipForward = () => {
        if (player.isLoaded) {
            player.seekTo(status.currentTime + 10);
        }
    };

    const skipBackward = () => {
        if (player.isLoaded) {
            player.seekTo(Math.max(0, status.currentTime - 10));
        }
    };

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return '00:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const getReciterStyleArabic = (style: string | null) => {
        if (!style) return 'مرتل';
        if (style.toLowerCase() === 'mujawwad') return 'مجود';
        if (style.toLowerCase() === 'murattal') return 'مرتل';
        if (style.toLowerCase() === 'muallim') return 'معلم';
        return style;
    };

    if (showPlayer) {
        const downloadKey = selectedChapter && selectedReciter ? `${selectedReciter.id}_${selectedChapter.id}` : '';
        const isCurrentlyDownloading = downloadingChapters.includes(downloadKey);
        const isCurrentlyDownloaded = downloadedChapters.includes(downloadKey);

        return (
            <LinearGradient colors={['#1E1528', '#4A1C40', '#633213']} locations={[0, 0.6, 1]} style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <Stack.Screen options={{ headerShown: false }} />

                    {/* Header */}
                    <View style={styles.playerHeader}>
                        <TouchableOpacity onPress={() => setShowPlayer(false)} style={styles.iconBtn}>
                            <MaterialIcons name="keyboard-arrow-down" size={32} color={colors.textLight} />
                        </TouchableOpacity>
                        <Text style={styles.playerHeaderTitle}>سماع القرآن</Text>
                        <View style={{ width: 48 }} />
                    </View>

                    {/* Artwork */}
                    <View style={styles.artworkContainer}>
                        <View style={styles.artworkOuterCircle}>
                            <View style={[styles.artworkInnerCircle, { overflow: 'hidden' }]}>
                                {selectedReciter ? (
                                    <>
                                        <Image
                                            source={RECITER_IMAGES[selectedReciter.id] || RECITER_IMAGES[1]}
                                            style={{ width: '100%', height: '100%', opacity: 0.8 }}
                                            resizeMode="cover"
                                        />
                                        {/* <View style={{ position: 'absolute', bottom: 10, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.primary }}>
                                            <Text style={{ color: colors.primary, fontFamily: 'UthmanicHafs', fontSize: 12 }}>
                                                {getReciterStyleArabic(selectedReciter.style)}
                                            </Text>
                                        </View> */}
                                    </>
                                ) : (
                                    <MaterialIcons name="menu-book" size={80} color={colors.primary} />
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Info */}
                    <View style={styles.infoContainer}>
                        <Text style={styles.infoReciterName}>{selectedReciter?.translated_name.name}</Text>
                        <Text style={styles.infoSurahAr}>سورة {selectedChapter?.name_arabic}</Text>
                        {isCurrentlyDownloading ? (
                            <View style={styles.downloadBtnCentered}>
                                <ActivityIndicator color={colors.primary} size="small" />
                                <Text style={styles.downloadBtnTextDone}>جاري التحميل...</Text>
                                <TouchableOpacity
                                    onPress={() => selectedChapter && cancelDownload(selectedChapter)}
                                    style={{ backgroundColor: 'rgba(255,50,50,0.1)', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,50,50,0.3)' }}
                                >
                                    <Text style={{ color: '#ff4444', fontFamily: 'UthmanicHafs', fontSize: 12 }}>إلغاء</Text>
                                </TouchableOpacity>
                            </View>
                        ) : isCurrentlyDownloaded ? (
                            <TouchableOpacity
                                style={styles.downloadBtnCentered}
                                disabled={true}
                            >
                                <MaterialIcons name="cloud-done" size={20} color={colors.primary} />
                                <Text style={styles.downloadBtnTextDone}>تم تنزيل السورة</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.downloadBtnCentered}
                                onPress={() => selectedChapter && downloadAudio(selectedChapter)}
                            >
                                <MaterialIcons name="cloud-download" size={20} color={colors.primary} />
                                <Text style={styles.downloadBtnText}>تنزيل السورة</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Progress */}
                    <View style={styles.playerProgressContainer}>
                        <View style={styles.timeRow}>
                            <Text style={styles.playerTimeText}>{formatTime(isSeeking ? seekValue : status.currentTime)}</Text>
                            <Text style={styles.playerTimeText}>{formatTime(status.duration)}</Text>
                        </View>
                        <Slider
                            style={styles.playerSlider}
                            minimumValue={0}
                            maximumValue={status.duration || 1}
                            value={isSeeking ? seekValue : (status.currentTime || 0)}
                            onValueChange={handleValueChange}
                            onSlidingComplete={handleSeek}
                            minimumTrackTintColor={colors.primary}
                            maximumTrackTintColor="rgba(255,255,255,0.2)"
                            thumbTintColor={colors.primary}
                        />
                    </View>

                    {/* Controls */}
                    <View style={styles.playerControls}>
                        <TouchableOpacity style={styles.secondaryControlBtn} onPress={playPrevSurah}>
                            <MaterialIcons name="skip-previous" size={28} color={colors.textLight} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryControlBtn} onPress={skipBackward}>
                            <MaterialIcons name="replay-10" size={28} color={colors.textLight} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.mainPlayBtn} onPress={togglePlayPause}>
                            {isLoadingAudio || player.isBuffering ? (
                                <ActivityIndicator color={colors.bgDark} size="large" />
                            ) : (
                                <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={48} color={colors.bgDark} />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryControlBtn} onPress={skipForward}>
                            <MaterialIcons name="forward-10" size={28} color={colors.textLight} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryControlBtn} onPress={playNextSurah}>
                            <MaterialIcons name="skip-next" size={28} color={colors.textLight} />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }



    const filteredChapters = chapters.filter(c => {
        const matchesSearch = c.name_arabic.includes(searchQuery) ||
            c.name_simple.toLowerCase().includes(searchQuery.toLowerCase());

        if (!selectedReciter) return matchesSearch;

        const isDownloaded = downloadedChapters.includes(`${selectedReciter.id}_${c.id}`);
        return matchesSearch && (!isOffline || isDownloaded);
    });



    return (
        <LinearGradient colors={['#1E1528', '#4A1C40', '#633213']} locations={[0, 0.6, 1]} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <Stack.Screen options={{ headerShown: false }} />

                {/* Header */}
                <View style={styles.header}>

                    <Text style={styles.headerTitle}>الاستماع للقرآن</Text>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
                        <MaterialIcons name="arrow-back-ios" size={24} color={colors.textLight} />
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchBox}>
                        <MaterialIcons name="search" size={24} color={colors.primary} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="ابحث عن سورة..."
                            placeholderTextColor={colors.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* Reciters List */}
                <View style={styles.recitersSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>القراء المميزون</Text>
                        <TouchableOpacity onPress={() => setShowAllReciters(true)}>
                            <Text style={styles.viewAllText}>عرض الكل</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        ref={reciterListRef}
                        horizontal
                        inverted
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.recitersScroll}
                        data={displayedReciters}
                        keyExtractor={item => item.id.toString()}
                        onScrollToIndexFailed={info => {
                            const wait = new Promise(resolve => setTimeout(resolve, 500));
                            wait.then(() => {
                                reciterListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
                            });
                        }}
                        renderItem={({ item: reciter }) => {
                            const isSelected = selectedReciter?.id === reciter.id;
                            const imageSource = RECITER_IMAGES[reciter.id] || RECITER_IMAGES[1];
                            return (
                                <TouchableOpacity
                                    key={reciter.id}
                                    style={[styles.reciterItem, isOffline && !isReciterAvailableOffline(reciter.id) && { opacity: 0.35 }]}
                                    onPress={() => {
                                        if (isOffline && !isReciterAvailableOffline(reciter.id)) {
                                            Toast.show({ type: 'info', text1: 'غير متوفر أوفلاين', text2: 'يجب الاتصال بالإنترنت للاستماع لهذا القارئ', position: 'bottom' });
                                            return;
                                        }
                                        handleSelectReciter(reciter);
                                    }}
                                >
                                    <View>
                                        <View style={[styles.reciterImgContainer, isSelected && styles.reciterImgContainerActive]}>
                                            <Image source={imageSource} style={styles.reciterImg} />
                                        </View>
                                        <View style={styles.reciterTypeBadge}>
                                            <Text style={styles.reciterTypeBadgeTxt}>{getReciterStyleArabic(reciter.style)}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.reciterName} numberOfLines={1}>{reciter.translated_name.name}</Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>

                {/* Surah List */}
                <View style={styles.surahSection}>
                    {/* <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>قائمة السور</Text>
                        <MaterialIcons name="sort" size={24} color={colors.textMuted} />
                    </View> */}
                    <FlatList
                        data={filteredChapters}
                        keyExtractor={item => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.surahListContent}
                        renderItem={({ item }) => {
                            const isActive = selectedChapter?.id === item.id;
                            return (
                                <TouchableOpacity
                                    style={[styles.surahCard, isActive && styles.surahCardActive, isOffline && !isSurahAvailableOffline(item.id) && { opacity: 0.35 }]}
                                    onPress={() => {
                                        if (isOffline && !isSurahAvailableOffline(item.id)) {
                                            Toast.show({ type: 'info', text1: 'غير متوفر أوفلاين', text2: 'يجب الاتصال بالإنترنت للاستماع لهذه السورة أو قم بتحميلها أولاً', position: 'bottom' });
                                            return;
                                        }
                                        playAudio(item);
                                    }}
                                >
                                    <View style={[styles.hexagonOuline, isActive && styles.hexagonFilled]}>
                                        <Text style={[styles.surahNumber, isActive && styles.surahNumberActive]}>{item.id}</Text>
                                    </View>

                                    <View style={styles.surahInfo}>
                                        <View style={styles.surahTitleRow}>
                                            <Text style={[styles.surahAr, isActive && styles.surahArActive]}>{item.name_arabic}</Text>
                                            <Text style={[styles.surahEn, isActive && styles.surahEnActive]}>{item.name_simple}</Text>
                                        </View>
                                        <Text style={[styles.surahSub, isActive && styles.surahSubActive]}>
                                            {item.translated_name?.name?.toUpperCase() || ''} • {item.verses_count} آيات
                                        </Text>
                                    </View>
                                    <View style={styles.playIconContainer}>
                                        {isActive && isPlaying ? (
                                            <MaterialIcons name="equalizer" size={24} color={colors.primary} />
                                        ) : (
                                            <MaterialIcons name="play-circle" size={28} color={isActive ? colors.primary : colors.textMuted} />
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>

                {/* All Reciters Modal */}
                <Modal visible={showAllReciters} animationType="slide" transparent={true}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={() => setShowAllReciters(false)} style={styles.iconBtn}>
                                    <MaterialIcons name="close" size={24} color={colors.textLight} />
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>جميع القراء</Text>
                                <View style={{ width: 40 }} />
                            </View>
                            <FlatList
                                data={displayedReciters}
                                keyExtractor={item => item.id.toString()}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                                renderItem={({ item }) => {
                                    const isSelected = selectedReciter?.id === item.id;
                                    const imageSource = RECITER_IMAGES[item.id] || RECITER_IMAGES[1];
                                    const isAvailable = isReciterAvailableOffline(item.id);
                                    return (
                                        <TouchableOpacity
                                            style={[styles.modalReciterItem, isSelected && styles.modalReciterItemActive, isOffline && !isAvailable && { opacity: 0.35 }]}
                                            onPress={() => {
                                                if (isOffline && !isAvailable) {
                                                    Toast.show({ type: 'info', text1: 'غير متوفر أوفلاين', text2: 'يجب الاتصال بالإنترنت للاستماع لهذا القارئ', position: 'bottom' });
                                                    return;
                                                }
                                                handleSelectReciter(item);
                                            }}
                                        >
                                            <View style={[styles.modalReciterImgContainer, isSelected && styles.modalReciterImgActive]}>
                                                <Image source={imageSource} style={styles.modalReciterImg} />
                                            </View>
                                            <View style={styles.modalReciterInfo}>
                                                <Text style={[styles.modalReciterNameTxt, isSelected && styles.modalReciterNameTxtActive]}>{item.translated_name.name}</Text>
                                                <Text style={styles.modalReciterStyleTxt}>{getReciterStyleArabic(item.style)}</Text>
                                            </View>
                                            {isSelected && <MaterialIcons name="check-circle" size={24} color={colors.primary} />}
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        </View>
                    </View>
                </Modal>

                {/* Mini Player Bar */}
                {selectedChapter && !showPlayer && (player.isLoaded || isLoadingAudio) && (
                    <TouchableOpacity
                        style={[styles.miniPlayer, { paddingBottom: 12 + insets.bottom }]}
                        onPress={() => setShowPlayer(true)}
                        activeOpacity={0.85}
                    >
                        <View style={styles.miniPlayerRight}>
                            <Image
                                source={RECITER_IMAGES[selectedReciter?.id || 1] || RECITER_IMAGES[1]}
                                style={styles.miniPlayerImg}
                            />
                            <View style={styles.miniPlayerInfo}>
                                <Text style={styles.miniPlayerSurah} numberOfLines={1}>سورة {selectedChapter.name_arabic}</Text>
                                <Text style={styles.miniPlayerReciter} numberOfLines={1}>{selectedReciter?.translated_name.name}</Text>
                            </View>
                        </View>
                        <View style={styles.miniPlayerControls}>
                            <TouchableOpacity onPress={togglePlayPause} style={styles.miniPlayBtn}>
                                {isLoadingAudio || player.isBuffering ? (
                                    <ActivityIndicator color={colors.primary} size="small" />
                                ) : (
                                    <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={32} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                )}
            </SafeAreaView>
        </LinearGradient >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    iconBtn: {
        padding: 8,
    },
    headerTitle: {
        color: colors.textLight,
        fontSize: 22,
        fontFamily: 'UthmanicHafs',
    },
    searchContainer: {
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    searchBox: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: colors.glass,
        borderColor: colors.glassBorder,
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 50,
    },
    searchIcon: {
        marginLeft: 10,
    },
    searchInput: {
        flex: 1,
        textAlign: 'right',
        color: colors.textLight,
        fontSize: 16,
        fontFamily: 'UthmanicHafs',
    },
    recitersSection: {
        marginBottom: 5,
    },
    sectionHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    sectionTitle: {
        color: colors.textLight,
        fontSize: 18,
        fontFamily: 'UthmanicHafs',
    },
    viewAllText: {
        color: colors.primary,
        fontSize: 16,
        fontFamily: 'UthmanicHafs',
    },
    recitersScroll: {
        paddingHorizontal: 16,
        gap: 16,
        paddingBottom: 10,
    },
    reciterItem: {
        alignItems: 'center',
        width: 70,
    },
    reciterImgContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: 'transparent',
        padding: 2,
        marginBottom: 8,
    },
    reciterImgContainerActive: {
        borderColor: 'rgba(212, 175, 55, 0.9)',
    },
    reciterImg: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
    },
    reciterName: {
        color: colors.textLight,
        fontSize: 10,
        fontFamily: 'UthmanicHafs',
        textAlign: 'center',
    },
    reciterTypeBadge: {
        position: 'absolute',
        bottom: 4,
        alignSelf: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.bgDark,
    },
    reciterTypeBadgeTxt: {
        color: colors.bgDark,
        fontSize: 8,
        fontFamily: 'UthmanicHafs',
        textAlign: 'center',
    },
    surahSection: {
        flex: 1,
    },
    surahListContent: {
        paddingHorizontal: 16,
        gap: 12,
        paddingBottom: 40,
    },
    surahCard: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: colors.glass,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: 16,
        padding: 16,
    },
    surahCardActive: {
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderColor: 'rgba(212, 175, 55, 0.5)',
    },
    hexagonOuline: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        borderColor: 'rgba(212, 175, 55, 0.4)',
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 16,
        // Using a rotated square as makeshift hexagon for simple React Native
        transform: [{ rotate: '45deg' }],
        borderRadius: 8,
    },
    hexagonFilled: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    surahNumber: {
        color: colors.primary,
        fontSize: 14,
        fontFamily: 'UthmanicHafs',
        transform: [{ rotate: '-45deg' }],
    },
    surahNumberActive: {
        color: colors.bgDark,
    },
    surahInfo: {
        flex: 1,
        alignItems: 'flex-end',
    },
    surahTitleRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
        width: '100%',
    },
    surahEn: {
        color: colors.textLight,
        fontSize: 15,
        fontFamily: 'UthmanicHafs',
        textAlign: 'left',
    },
    surahEnActive: {
        color: colors.primary,
    },
    surahAr: {
        color: colors.textLight,
        fontSize: 20,
        fontFamily: 'UthmanicHafs',
        textAlign: 'right',

    },
    surahArActive: {
        color: colors.primary,
    },
    surahSub: {
        color: colors.textMuted,
        fontSize: 12,
        fontFamily: 'UthmanicHafs',
        letterSpacing: 0.5,
        textAlign: 'right',
    },
    surahSubActive: {
        color: 'rgba(254, 255, 255, 0.7)',
    },
    playIconContainer: {
        marginRight: 16,
    },

    // Player Design
    playerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    playerHeaderTitle: {
        color: colors.textMuted,
        fontSize: 18,
        fontFamily: 'UthmanicHafs',
        letterSpacing: 0.5,
        marginBottom: 16,

    },
    artworkContainer: {

        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    artworkOuterCircle: {
        width: width * 0.75,
        height: width * 0.75,
        borderRadius: width * 0.375,
        backgroundColor: 'rgba(212, 175, 55, 0.03)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.1)',
    },
    artworkInnerCircle: {
        width: width * 0.6,
        height: width * 0.6,
        borderRadius: width * 0.3,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    infoContainer: {

        alignItems: 'center',
        paddingHorizontal: 30,
        marginBottom: 40,
    },
    infoSurahEn: {
        color: colors.textLight,
        fontSize: 24,
        fontFamily: 'UthmanicHafs',
        marginBottom: 6,
    },
    infoSurahAr: {
        color: colors.textLight,
        fontSize: 30,
        fontFamily: 'UthmanicHafs',
        marginBottom: 12,
    },
    infoReciterName: {
        color: colors.textMuted,
        fontSize: 16,
        fontFamily: 'UthmanicHafs',
        marginBottom: 8,
        marginTop: 12,
    },
    downloadBtnCentered: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.glass,
        borderColor: colors.glassBorder,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    downloadBtnText: {
        color: colors.textLight,
        fontFamily: 'UthmanicHafs',
        fontSize: 14,
    },
    downloadBtnTextDone: {
        color: colors.primary,
        fontFamily: 'UthmanicHafs',
        fontSize: 14,
    },
    playerProgressContainer: {
        paddingHorizontal: 30,
        marginBottom: 40,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: -10,
        paddingHorizontal: 15,
        zIndex: 1,
    },
    playerTimeText: {
        color: colors.textMuted,
        fontSize: 15,
        fontFamily: 'UthmanicHafs',
    },
    playerSlider: {
        width: '100%',
        height: 40,
    },
    playerControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 50,
        paddingHorizontal: 16,
    },
    mainPlayBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    secondaryControlBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.glass,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.bgDarker,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: colors.glassBorder,
    },
    modalHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.glassBorder,
    },
    modalTitle: {
        color: colors.textLight,
        fontSize: 16,
        fontFamily: 'UthmanicHafs',
    },
    modalReciterItem: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: colors.glass,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    modalReciterItemActive: {
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderColor: 'rgba(212, 175, 55, 0.5)',
    },
    modalReciterImgContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: 'transparent',
        padding: 2,
        marginLeft: 16,
    },
    modalReciterImgActive: {
        borderColor: colors.primary,
    },
    modalReciterImg: {
        width: '100%',
        height: '100%',
        borderRadius: 25,
    },
    modalReciterInfo: {
        flex: 1,
        alignItems: 'flex-end',
    },
    modalReciterNameTxt: {
        color: colors.textLight,
        fontSize: 14,
        fontFamily: 'UthmanicHafs',
        marginBottom: 4,
    },
    modalReciterNameTxtActive: {
        color: colors.primary,
    },
    modalReciterStyleTxt: {
        color: colors.textMuted,
        fontSize: 11,
        fontFamily: 'UthmanicHafs',
    },

    // Mini Player
    miniPlayer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(30, 21, 40, 0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(212, 175, 55, 0.3)',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    miniPlayerRight: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        flex: 1,
    },
    miniPlayerImg: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginLeft: 12,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.4)',
    },
    miniPlayerInfo: {
        flex: 1,
        alignItems: 'flex-end',
    },
    miniPlayerSurah: {
        color: colors.textLight,
        fontSize: 16,
        fontFamily: 'UthmanicHafs',
        marginBottom: 2,
    },
    miniPlayerReciter: {
        color: colors.textMuted,
        fontSize: 12,
        fontFamily: 'UthmanicHafs',
    },
    miniPlayerControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    miniPlayBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(212, 175, 55, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
