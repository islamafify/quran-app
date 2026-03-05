import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, LibraryBig, Moon, Search, Sun } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import RenderHtml from 'react-native-render-html';
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
    const { width } = useWindowDimensions();

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
    const renderChapter = ({ item, index }: { item: Chapter, index: number }) => (
        <View>
            <TouchableOpacity
                style={styles.chapterCard}
                onPress={() => setSelectedChapter(item)}
                activeOpacity={0.7}
            >
                <View style={styles.chapterLeftInfo}>
                    {item.type === 'Meccan' ? (
                        <Moon size={16} color="#EAB308" opacity={0.7} />
                    ) : (
                        <Sun size={16} color="#EAB308" opacity={0.7} />
                    )}
                    <View style={styles.versesCountBadge}>
                        <Text style={styles.versesCountText}>{item.versesCount} آية</Text>
                    </View>
                </View>

                <View style={styles.chapterTextContainer}>
                    <Text style={styles.chapterName}>سورة {item.name}</Text>
                    <Text style={styles.chapterTypeInfo}>{item.type === 'Meccan' ? 'مكية' : 'مدنية'}</Text>
                </View>

                <View style={styles.chapterIconContainer}>
                    <Text style={styles.chapterNumber}>{item.id}</Text>
                </View>
            </TouchableOpacity>
        </View>
    );

    // Helper to get tafsir text, falling back to previous verse if grouped
    const getTafsirForVerse = (chapterId: number, verseNumber: number) => {
        const key = `${chapterId}:${verseNumber}`;
        const tafsir = (tafsirData as any)[key];

        if (tafsir) return tafsir;

        // If tafsir is missing, it might be grouped with a previous verse (e.g., 18:2 and 18:3 are grouped under 18:2)
        // Scan backwards to find the nearest previous verse's tafsir
        for (let i = verseNumber - 1; i >= 1; i--) {
            const prevKey = `${chapterId}:${i}`;
            if ((tafsirData as any)[prevKey]) {
                return (tafsirData as any)[prevKey];
            }
        }

        return 'التفسير غير متوفر.';
    };

    // Render Verse and its Tafsir
    const renderVerse = ({ item, index }: { item: Verse, index: number }) => {
        // Get tafsir
        const rawTafsir = getTafsirForVerse(item.chapterId, item.verseNumber);

        return (
            <View
                style={styles.verseCard}
            >
                {/* Verse Section */}
                <View style={styles.verseSection}>
                    <View style={styles.verseHeader}>
                        <View style={styles.verseNumberBadge}>
                            <Text style={styles.verseNumberText}>آية {item.verseNumber}</Text>
                        </View>
                    </View>
                    <Text style={styles.verseText}>{item.text}</Text>
                </View>

                {/* Tafsir Section */}
                <View style={styles.tafsirSection}>
                    <View style={styles.tafsirHeader}>
                        <LibraryBig size={18} color="#EAB308" />
                        <Text style={styles.tafsirTitle}>التفسير الميسر</Text>
                    </View>
                    <RenderHtml
                        contentWidth={width - 48}
                        source={{ html: `<div dir="rtl">${rawTafsir}</div>` }}
                        baseStyle={{
                            textAlign: 'right',
                            writingDirection: 'rtl',
                            color: 'rgba(255,255,255,0.9)',
                            fontFamily: 'hafssmart',
                            fontSize: 16,
                            lineHeight: 30,
                        }}
                        tagsStyles={{
                            body: {
                                textAlign: 'right',
                                writingDirection: 'rtl',
                            },
                            div: {
                                textAlign: 'right',
                                writingDirection: 'rtl',
                            },
                            span: {
                                color: '#EAB308',
                                fontFamily: 'ReadexPro_600SemiBold',
                                fontSize: 16,
                            }
                        }}
                    />
                </View>
            </View>
        );
    };

    return (
        <LinearGradient
            colors={['#1E1528', '#4A1C40', '#633213ff']}
            locations={[0, 0.6, 1]}
            style={styles.container}
        >
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>
                        {selectedChapter ? `سورة ${selectedChapter.name}` : 'تفسير القرآن'}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        {selectedChapter ? 'التفسير الميسر' : 'اختر سورة لقراءة التفسير'}
                    </Text>
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
                        <Search size={22} color="rgba(255,255,255,0.6)" style={styles.searchIcon} />
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
                            <Text style={styles.loadingText}>جاري تحميل التفسير...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={verses}
                            keyExtractor={(item) => item.verseKey}
                            renderItem={renderVerse}
                            contentContainerStyle={[styles.versesListContent, { paddingBottom: insets.bottom + 40 }]}
                            showsVerticalScrollIndicator={true}
                            indicatorStyle="white"
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
        paddingBottom: 24,
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    placeholderIcon: {
        width: 48,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        color: '#fff',
        fontFamily: 'ReadexPro_700Bold',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#EAB308',
        fontFamily: 'hafssmart',
    },
    contentContainer: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 20,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        height: 60,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    searchIcon: {
        marginLeft: 12,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontFamily: 'hafssmart',
        fontSize: 16,
        textAlign: 'right',
        height: '100%',
    },
    listContent: {
        paddingHorizontal: 20,
        gap: 16,
    },
    chapterCard: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 18,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    chapterIconContainer: {
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: 'rgba(234, 179, 8, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 16,
        borderWidth: 1,
        borderColor: 'rgba(234, 179, 8, 0.3)',
    },
    chapterNumber: {
        color: '#EAB308',
        fontFamily: 'ReadexPro_700Bold',
        fontSize: 18,
    },
    chapterTextContainer: {
        flex: 1,
        alignItems: 'flex-end',
        marginRight: 8,
    },
    chapterName: {
        color: '#fff',
        fontFamily: 'hafssmart',
        fontSize: 19,
        marginBottom: 4,
    },
    chapterTypeInfo: {
        color: 'rgba(255,255,255,0.6)',
        fontFamily: 'hafssmart',
        fontSize: 13,
    },
    chapterLeftInfo: {
        alignItems: 'center',
        gap: 8,
    },
    versesCountBadge: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    versesCountText: {
        color: 'rgba(255,255,255,0.8)',
        fontFamily: 'hafssmart',
        fontSize: 12,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#EAB308',
        marginTop: 16,
        fontFamily: 'ReadexPro_500Medium',
        fontSize: 16,
    },
    versesListContent: {
        paddingHorizontal: 20,
        gap: 24,
    },
    verseCard: {
        overflow: 'hidden',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    verseSection: {
        padding: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    verseHeader: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    verseNumberBadge: {
        backgroundColor: 'rgba(234, 179, 8, 0.15)',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 24,
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
        fontFamily: 'hafssmart',
        fontSize: 28,
        lineHeight: 52,
        textAlign: 'center',
        writingDirection: 'rtl',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    tafsirSection: {
        padding: 24,
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    tafsirHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
        minHeight: 30,
    },
    tafsirTitle: {
        color: '#EAB308',
        fontFamily: 'ReadexPro_600SemiBold',
        fontSize: 16,
        lineHeight: 28,
        includeFontPadding: true,
    },
    tafsirText: {
        color: 'rgba(255,255,255,0.9)',
        fontFamily: 'hafssmart',
        fontSize: 16,
        lineHeight: 30,
        textAlign: 'right',
        writingDirection: 'rtl',
    },
});
