import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import chaptersDataRaw from '../assets/data/chapters.json';
import quranDataRaw from '../assets/data/quran.json';

type VerseData = {
    id: number;
    verseKey: string;
    text: string;
    page: number;
    juz: number;
    hizb: number;
    rub: number;
    chapterId: number;
    verseNumber: number;
};

const quranData = quranDataRaw as VerseData[];
const chaptersData = chaptersDataRaw as { id: number; name: string; versesCount: number }[];

export function useQuranReader(initialPage = 1) {
    const [currentPage, setCurrentPage] = useState(initialPage);

    const getVersesForPage = useCallback((page: number) => {
        return quranData.filter(v => v.page === page);
    }, []);

    const verses = useMemo(() => {
        return getVersesForPage(currentPage);
    }, [currentPage, getVersesForPage]);

    const getPageMetaForPage = useCallback((pageVerses: VerseData[]) => {
        if (pageVerses.length > 0) {
            const firstVerse = pageVerses[0];
            const chapterInfo = chaptersData.find(c => c.id === firstVerse.chapterId);
            return {
                juzNumber: firstVerse.juz,
                rubElHizbNumber: firstVerse.rub,
                surahName: chapterInfo?.name || '',
            };
        }
        return null;
    }, []);

    const pageMeta = useMemo(() => {
        return getPageMetaForPage(verses);
    }, [verses, getPageMetaForPage]);

    const [savedPage, setSavedPage] = useState<number | null>(null);
    const [fontSize, setFontSize] = useState<number>(24);

    // Load saved page and font size on mount
    useEffect(() => {
        async function loadSavedPage() {
            try {
                const value = await AsyncStorage.getItem('@quran_reader_last_page');
                if (value !== null) {
                    const parsed = JSON.parse(value);
                    setSavedPage(parsed.lastPage);
                    if (initialPage === 1) { // Only override if the initial is the default
                        setCurrentPage(parsed.lastPage);
                    }
                }

                const savedFontSize = await AsyncStorage.getItem('@quran_reader_font_size');
                if (savedFontSize !== null) {
                    setFontSize(parseInt(savedFontSize, 10));
                }
            } catch (e) {
                console.error('Failed to load saved page', e);
            }
        }
        loadSavedPage();
    }, [initialPage]);

    const savePage = async (page: number) => {
        try {
            const dataToSave = {
                lastPage: page,
                updatedAt: Date.now()
            };
            await AsyncStorage.setItem('@quran_reader_last_page', JSON.stringify(dataToSave));
            setSavedPage(page);
        } catch (e) {
            console.error('Failed to save page', e);
        }
    };

    const goToPage = (page: number) => {
        if (page >= 1 && page <= 604) {
            setCurrentPage(page);
            savePage(page);
        }
    };

    const nextPage = () => goToPage(currentPage + 1);
    const prevPage = () => goToPage(currentPage - 1);

    const changeFontSize = async (delta: number) => {
        try {
            const newSize = Math.max(16, Math.min(60, fontSize + delta));
            setFontSize(newSize);
            await AsyncStorage.setItem('@quran_reader_font_size', newSize.toString());
        } catch (e) {
            console.error('Failed to save font size', e);
        }
    };

    return {
        currentPage,
        verses,
        pageMeta,
        savedPage,
        isLoading: false, // Always false since offline
        error: null,      // Never an error for offline load
        goToPage,
        nextPage,
        prevPage,
        fontSize,
        changeFontSize,
        getVersesForPage,
        getPageMetaForPage
    };
}
