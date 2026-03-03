import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, BookOpen, Search } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Data imports
import chaptersData from '@/assets/data/chapters.json';
import quranData from '@/assets/data/quran.json';
import tafsirData from '@/assets/data/tafsir-16.json';

const { width } = Dimensions.get('window');

interface Chapter {
    id: number;
    name: string;
    type?: string;
    versesCount: number;
    pages: number[];
}

interface Verse {
    id: number;
    verseKey: string;
    text: string;
    chapterId: number;
    verseNumber: number;
}

export default function TafsirScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [verses, setVerses] = useState<Verse[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // List of chapters
    const chapters = useMemo(() => {
        const sorted = [...chaptersData].sort((a, b) => a.id - b.id);
        if (!searchQuery) return sorted;

        return sorted.filter(c =>
            c.name.includes(searchQuery) ||
            c.id.toString() === searchQuery
        );
    }, [searchQuery]);

    // Load verses when a chapter is selected
    useEffect(() => {
        if (selectedChapter) {
            setIsLoading(true);
            // Simulate a tick to allow UI to update to loading state before heavy filtering
            setTimeout(() => {
                const chapterVerses = quranData.filter(v => v.chapterId === selectedChapter.id);
                setVerses(chapterVerses);
                setIsLoading(false);
            }, 50);
        } else {
            setVerses([]);
        }
    }, [selectedChapter]);

    // Render Surah Card
    const renderChapter = ({ item }: { item: Chapter }) => (
        <TouchableOpacity
            style={styles.chapterCard}
            onPress={() => setSelectedChapter(item)}
            activeOpacity={0.7}
        >
            <View style={styles.chapterIconContainer}>
                <Text style={styles.chapterNumber}>{item.id}</Text>
            </View>
            <View style={styles.chapterTextContainer}>
                <Text style={styles.chapterName}>سورة {item.name}</Text>
                <Text style={styles.chapterInfo}>{item.versesCount} آيات {item.type ? `• ${item.type === 'Meccan' ? 'مكية' : 'مدنية'}` : ''}</Text>
            </View>
        </TouchableOpacity>
    );

    // Render Verse and its Tafsir
    const renderVerse = ({ item }: { item: Verse }) => {
        // Strip HTML span tags from tafsir text
        const rawTafsir = (tafsirData as any)[item.verseKey] || 'التفسير غير متوفر.';
        const cleanTafsir = rawTafsir.replace(/<[^>]+>/g, '');

        return (
            <View style={styles.verseCard}>
                <View style={styles.verseHeader}>
                    <View style={styles.verseNumberBadge}>
                        <Text style={styles.verseNumberText}>{item.verseNumber}</Text>
                    </View>
                </View>

                <Text style={styles.verseText}>{item.text}</Text>

                <View style={styles.separator} />

                <View style={styles.tafsirContainer}>
                    <View style={styles.tafsirHeader}>
                        <BookOpen size={16} color="#EAB308" />
                        <Text style={styles.tafsirTitle}>التفسير الميسر</Text>
                    </View>
                    <Text style={styles.tafsirText}>{cleanTafsir}</Text>
                </View>
            </View>
        );
    };

    return (
        <LinearGradient
            colors={['#4A1C40', '#E8AF8C']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>
                        {selectedChapter ? `تفسير سورة ${selectedChapter.name}` : 'تفسير القرآن'}
                    </Text>
                    <Text style={styles.headerSubtitle}>التفسير الميسر</Text>
                </View>

                {/* Spacer for balance */}
                <View style={styles.placeholderIcon} />

                <TouchableOpacity
                    onPress={() => {
                        if (selectedChapter) {
                            setSelectedChapter(null);
                        } else {
                            router.back();
                        }
                    }}
                    style={styles.backButton}
                >
                    <ArrowLeft size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Content Area */}
            {!selectedChapter ? (
                // State 1: Search & Chapter List
                <View style={styles.contentContainer}>
                    <View style={styles.searchContainer}>
                        <Search size={20} color="rgba(255,255,255,0.5)" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="ابحث عن سورة (بالاسم أو الرقم)..."
                            placeholderTextColor="rgba(255,255,255,0.4)"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            textAlign="right"
                        />
                    </View>

                    <FlatList
                        data={chapters}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderChapter}
                        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
                        showsVerticalScrollIndicator={false}
                        initialNumToRender={15}
                    />
                </View>
            ) : (
                // State 2: Verse & Tafsir List
                <View style={styles.contentContainer}>
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#EAB308" />
                        </View>
                    ) : (
                        <FlatList
                            data={verses}
                            keyExtractor={(item) => item.verseKey}
                            renderItem={renderVerse}
                            contentContainerStyle={[styles.versesListContent, { paddingBottom: insets.bottom + 40 }]}
                            showsVerticalScrollIndicator={false}
                            initialNumToRender={5}
                            windowSize={5}
                        />
                    )}
                </View>
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    backButton: {
        width: 45,
        height: 45,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    placeholderIcon: {
        width: 45,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        color: '#fff',
        fontFamily: 'ReadexPro_700Bold',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(234, 179, 8, 0.9)',
        fontFamily: 'ReadexPro_400Regular',
    },
    contentContainer: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        height: 56,
    },
    searchIcon: {
        marginLeft: 12, // Since it's row-reverse
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontFamily: 'ReadexPro_400Regular',
        fontSize: 15,
        textAlign: 'right',
        height: '100%',
    },
    listContent: {
        paddingHorizontal: 20,
        gap: 12,
    },
    chapterCard: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: 'rgba(10, 10, 10, 0.2)',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    chapterIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(234, 179, 8, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 16,
    },
    chapterNumber: {
        color: '#EAB308',
        fontFamily: 'ReadexPro_700Bold',
        fontSize: 16,
    },
    chapterTextContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    chapterName: {
        color: '#fff',
        fontFamily: 'ReadexPro_600SemiBold',
        fontSize: 18,
        marginBottom: 4,
    },
    chapterInfo: {
        color: 'rgba(255,255,255,0.6)',
        fontFamily: 'ReadexPro_400Regular',
        fontSize: 13,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    versesListContent: {
        paddingHorizontal: 20,
        gap: 20,
    },
    verseCard: {
        backgroundColor: 'rgba(10, 10, 10, 0.2)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    verseHeader: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 16,
    },
    verseNumberBadge: {
        backgroundColor: 'rgba(234, 179, 8, 0.15)',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(234, 179, 8, 0.3)',
    },
    verseNumberText: {
        color: '#EAB308',
        fontFamily: 'ReadexPro_600SemiBold',
        fontSize: 14,
    },
    verseText: {
        color: '#fff',
        fontFamily: 'UthmanicHafs',
        fontSize: 26,
        lineHeight: 46,
        textAlign: 'center',
        writingDirection: 'rtl',
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 20,
    },
    tafsirContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        borderRadius: 16,
        padding: 16,
    },
    tafsirHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    tafsirTitle: {
        color: '#EAB308',
        fontFamily: 'ReadexPro_600SemiBold',
        fontSize: 14,
    },
    tafsirText: {
        color: 'rgba(255,255,255,0.85)',
        fontFamily: 'ReadexPro_400Regular',
        fontSize: 16,
        lineHeight: 28,
        textAlign: 'right',
        writingDirection: 'rtl',
    },
});
