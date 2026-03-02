import { Azkar_DATA, DhikrItem } from '@/constants/adhkar-data';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import {
    ArrowLeft,
    Check,
    Copy,
    Moon,
    Plus,
    Share2,
    Sun,
    Undo2,
    X,
    ZoomIn,
    ZoomOut
} from 'lucide-react-native';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const getCustomAdhkarKey = (categoryId: string) => `@adhkar_custom_${categoryId}_v1`;

interface AdhkarDetailsScreenProps {
    categoryId: string;
    categoryTitle: string;
}

export default function AdhkarDetailsScreen({ categoryId, categoryTitle }: AdhkarDetailsScreenProps) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [adhkar, setAdhkar] = useState<DhikrItem[]>([]);

    // UI State
    const [fontSize, setFontSize] = useState(16);
    const [showCompleted, setShowCompleted] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [theme, setTheme] = useState<'purple' | 'blue'>('purple');

    // New Dhikr Form State
    const [newDhikrText, setNewDhikrText] = useState('');
    const [newDhikrCount, setNewDhikrCount] = useState('3');
    const [editingItem, setEditingItem] = useState<DhikrItem | null>(null);

    // Progress State
    const [progress, setProgress] = useState<Record<string, number>>({});
    // History Stack for Undo: Array of item IDs that were incremented
    const [history, setHistory] = useState<string[]>([]);

    // Refs for stable handlers
    const progressRef = useRef(progress);
    const adhkarRef = useRef(adhkar);

    useEffect(() => {
        progressRef.current = progress;
    }, [progress]);

    useEffect(() => {
        adhkarRef.current = adhkar;
    }, [adhkar]);

    useEffect(() => {
        loadData();
    }, [categoryId]);

    const loadData = async () => {
        // 1. Load Static Data
        const staticData = Azkar_DATA[categoryId] || [];

        // 2. Load Custom Data
        let customData: DhikrItem[] = [];
        try {
            const savedCustom = await AsyncStorage.getItem(getCustomAdhkarKey(categoryId));
            if (savedCustom) {
                customData = JSON.parse(savedCustom);
            }
        } catch (e) {
            console.error("Failed to load custom adhkar", e);
        }

        const combinedData = [...customData, ...staticData];
        setAdhkar(combinedData);

        // 3. Load Progress (Reset to 0)
        const initial: Record<string, number> = {};
        combinedData.forEach(item => initial[item.id] = 0);
        setProgress(initial);
    };



    const handlePress = useCallback((item: DhikrItem) => {
        const currentProgress = progressRef.current;
        const current = currentProgress[item.id] || 0;

        if (current < item.count) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const newCount = current + 1;
            const newProgress = { ...currentProgress, [item.id]: newCount };

            // Update State
            setProgress(newProgress);
            setHistory(prev => [...prev, item.id]); // Push to history

            if (newCount === item.count) {
                // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        }
    }, []);

    const handleUndo = () => {
        if (history.length === 0) return;

        const lastId = history[history.length - 1];
        const currentCount = progress[lastId] || 0;
        const item = adhkar.find(i => i.id === lastId);

        // If item is completed, reset fully (User request: bring back with default count)
        if (item && currentCount >= item.count) {
            const newProgress = { ...progress, [lastId]: 0 };
            setProgress(newProgress);
            // Remove ALL instances this ID from history so we don't have phantom undos
            setHistory(prev => prev.filter(id => id !== lastId));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            return;
        }

        const newHistory = history.slice(0, -1);

        if (currentCount > 0) {
            const newProgress = { ...progress, [lastId]: currentCount - 1 };
            setProgress(newProgress);
            setHistory(newHistory);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
            // Should not happen if history matches progress, but safe guard
            setHistory(newHistory);
        }
    };

    const handleAddNewDhikr = async () => {
        if (!newDhikrText.trim()) {
            Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: 'يرجى إدخال نص الذكر',
                position: 'bottom',
            });
            return;
        }

        const count = parseInt(newDhikrCount) || 3;

        try {
            // Get existing custom
            const savedCustom = await AsyncStorage.getItem(getCustomAdhkarKey(categoryId));
            let currentCustom: DhikrItem[] = savedCustom ? JSON.parse(savedCustom) : [];
            let updatedCustom: DhikrItem[];
            let newAdhkarList: DhikrItem[];

            if (editingItem) {
                // UPDATE EXISTING
                const updatedItem = { ...editingItem, zkar_text1: newDhikrText, count: count };
                updatedCustom = currentCustom.map(item => item.id === editingItem.id ? updatedItem : item);

                // Update State List
                newAdhkarList = adhkar.map(item => item.id === editingItem.id ? updatedItem : item);

                Toast.show({
                    type: 'success',
                    text1: 'تم تعديل الذكر',
                    position: 'bottom',
                });
            } else {
                // CREATE NEW
                const newItem: DhikrItem = {
                    id: `custom_${Date.now()}`,
                    zkar_text1: newDhikrText,
                    zkar_text2: '',
                    count: count,

                };
                updatedCustom = [newItem, ...currentCustom];
                newAdhkarList = [newItem, ...adhkar];

                // Initialize progress for new item
                const newProgress = { ...progress, [newItem.id]: 0 };
                setProgress(newProgress);

                Toast.show({
                    type: 'success',
                    text1: 'تم إضافة الذكر',
                    position: 'bottom',
                });
            }

            // Save Custom
            await AsyncStorage.setItem(getCustomAdhkarKey(categoryId), JSON.stringify(updatedCustom));

            // Update State
            setAdhkar(newAdhkarList);

            // Cleanup UI
            setNewDhikrText('');
            setNewDhikrCount('3');
            setEditingItem(null);
            setIsModalVisible(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        } catch (e) {
            Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: 'فشل حفظ التغييرات',
                position: 'bottom',
            });
        }
    };

    const handleDeleteDhikr = useCallback(async (id: string) => {
        try {
            // Get existing custom
            const savedCustom = await AsyncStorage.getItem(getCustomAdhkarKey(categoryId));
            if (savedCustom) {
                let currentCustom: DhikrItem[] = JSON.parse(savedCustom);
                const updatedCustom = currentCustom.filter(item => item.id !== id);
                await AsyncStorage.setItem(getCustomAdhkarKey(categoryId), JSON.stringify(updatedCustom));
            }

            // Update State
            setAdhkar(prev => prev.filter(item => item.id !== id));

            // Remove from progress (optional but clean)
            setProgress(prev => {
                const { [id]: _, ...newProgress } = prev;
                return newProgress;
            });

            Toast.show({
                type: 'success',
                text1: 'تم حذف الذكر',
                position: 'bottom',
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
            Toast.show({
                type: 'error',
                text1: 'خطأ',
                text2: 'فشل حذف الذكر',
                position: 'bottom',
            });
        }
    }, [categoryId]);

    const handleLongPress = useCallback((item: DhikrItem) => {
        if (!item.id.startsWith('custom_')) {
            Toast.show({
                type: 'info',
                text1: 'تنبيه',
                text2: 'لا يمكن تعديل أو حذف الأذكار الأساسية',
                position: 'bottom',
            });
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        Alert.alert(
            'خيارات الذكر',
            'اختر الإجراء المطلوب',
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: () => {
                        Alert.alert(
                            'تأكيد الحذف',
                            'هل أنت متأكد من حذف هذا الذكر؟',
                            [
                                { text: 'إلغاء', style: 'cancel' },
                                { text: 'حذف', style: 'destructive', onPress: () => handleDeleteDhikr(item.id) }
                            ]
                        );
                    }
                },
                {
                    text: 'تعديل',
                    onPress: () => {
                        setEditingItem(item);
                        setNewDhikrText(item.zkar_text1);
                        setNewDhikrCount(item.count.toString());
                        setIsModalVisible(true);
                    }
                },
            ]
        );
    }, [handleDeleteDhikr]);

    const handleCopy = useCallback(async (text: string) => {
        await Clipboard.setStringAsync(text);
        Haptics.selectionAsync();
        Toast.show({
            type: 'success',
            text1: 'تم النسخ',
            position: 'bottom',
        });
    }, []);

    const handleShare = useCallback(async (text: string) => {
        try {
            await Share.share({ message: text });
        } catch (error) {
            console.error(error);
        }
    }, []);

    const increaseFontSize = () => {
        setFontSize(prev => Math.min(prev + 4, 42));
        Haptics.selectionAsync();
    };

    const decreaseFontSize = () => {
        setFontSize(prev => Math.max(prev - 4, 18));
        Haptics.selectionAsync();
    };

    const toggleShowCompleted = () => {
        setShowCompleted(!showCompleted);
        Haptics.selectionAsync();
    };



    const toggleTheme = () => {
        setTheme(prev => prev === 'purple' ? 'blue' : 'purple');
        Haptics.selectionAsync();
    };



    return (
        <LinearGradient
            colors={theme === 'purple' ? ['#4A1C40', '#E8AF8C'] : ['#141E30', '#243B55']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>


                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>{categoryTitle}</Text>
                    <Text style={styles.headerSubtitle}>حصن المسلم</Text>
                </View>

                {/* Spacer for balance */}
                <View style={styles.placeholderIcon} />
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.toolbarContainer}>
                <View style={styles.toolbarContent}>
                    {/* Right: Add Button */}
                    {/* Right: Add Button */}
                    <TouchableOpacity
                        style={styles.addDhikrBtn}
                        onPress={() => {
                            setEditingItem(null);
                            setNewDhikrText('');
                            setNewDhikrCount('3');
                            setIsModalVisible(true);
                        }}
                    >
                        <Text style={styles.addDhikrText}>ذكر جديد</Text>
                        <Plus size={20} color="#fff" />
                    </TouchableOpacity>

                    {/* Left: Undo & Zoom */}
                    <View style={styles.leftToolbarGroup}>
                        <TouchableOpacity
                            style={[styles.toolIconBtn, history.length === 0 && { opacity: 0.5 }]}
                            onPress={handleUndo}
                            disabled={history.length === 0}
                        >
                            <Undo2 size={20} color="#fff" />
                        </TouchableOpacity>

                        <View style={styles.fontSizeControls}>
                            <TouchableOpacity style={styles.toolIconBtnSmall} onPress={toggleTheme}>
                                {theme === 'blue' ? <Moon size={20} color="#fff" /> : <Sun size={20} color="#fff" />}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.toolIconBtnSmall} onPress={increaseFontSize}>
                                <ZoomIn size={20} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.toolIconBtnSmall} onPress={decreaseFontSize}>
                                <ZoomOut size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            <FlatList
                data={adhkar}
                renderItem={({ item }) => (
                    <DhikrCard
                        item={item}
                        currentCount={progress[item.id] || 0}
                        showCompleted={showCompleted}
                        fontSize={fontSize}
                        onPress={handlePress}
                        onLongPress={handleLongPress}
                        onShare={handleShare}
                        onCopy={handleCopy}
                    />
                )}
                keyExtractor={item => item.id}
                contentContainerStyle={[
                    styles.listContent,
                    { paddingBottom: insets.bottom + 40 }
                ]}
                extraData={{ progress, showCompleted, fontSize, theme }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {showCompleted || adhkar.length === 0 ? "لا توجد أذكار" : "أتممت جميع الأذكار! تقبل الله"}
                        </Text>
                    </View>
                }
            />

            {/* Add Dhikr Modal */}
            <Modal
                transparent={true}
                visible={isModalVisible}
                animationType="slide"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: theme === 'purple' ? '#2A1028' : '#1B2A41' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingItem ? 'تعديل الذكر' : 'إضافة ذكر جديد'}</Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>نص الذكر</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="اكتب الذكر هنا..."
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                multiline
                                value={newDhikrText}
                                onChangeText={setNewDhikrText}
                                textAlign="right"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>العدد</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="3"
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                keyboardType="number-pad"
                                value={newDhikrCount}
                                onChangeText={setNewDhikrCount}
                                textAlign="right"
                            />
                        </View>

                        <TouchableOpacity style={styles.addButton} onPress={handleAddNewDhikr}>
                            <Text style={styles.addButtonText}>{editingItem ? 'حفظ التعديلات' : 'إضافة'}</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
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
        paddingBottom: 25,
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
        color: 'rgba(234, 179, 8, 0.9)', // Gold accent
        fontFamily: 'ReadexPro_400Regular',
    },
    // Toolbar
    toolbarContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
        alignItems: 'center',
    },
    toolbarContent: {
        flexDirection: 'row-reverse',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 400,
    },
    leftToolbarGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    toolIconBtn: {
        padding: 10,
        borderRadius: 12,
        backgroundColor: 'transparent',
    },
    toolIconBtnSmall: {
        padding: 8,
        borderRadius: 10,
    },
    addDhikrBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(234, 179, 8, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    addDhikrText: {
        color: '#fff',
        fontFamily: 'ReadexPro_600SemiBold',
        fontSize: 12,
    },
    fontSizeControls: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 8,
    },

    // List & Cards
    listContent: {
        padding: 20,
    },
    card: {
        backgroundColor: 'rgba(10, 10, 10, 0.2)',
        borderRadius: 24,
        padding: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.09)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        // elevation: 5,
    },
    cardCompleted: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(74, 222, 128, 0.3)',
        opacity: 0.8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 16,
    },
    iconBtn: {
        padding: 4,
        opacity: 0.8,
    },
    counterContainer: {},
    counterPill: {
        backgroundColor: 'rgba(234, 179, 8, 0.15)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(234, 179, 8, 0.3)',
        // minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    counterPillCompleted: {
        backgroundColor: 'rgba(74, 222, 128, 0.2)',
        borderColor: 'rgba(74, 222, 128, 0.4)',
    },
    counterText: {
        color: '#fff',
        fontFamily: 'ReadexPro_700Bold',
        fontSize: 16,
    },
    counterTextCompleted: {
        color: '#4ADE80',
    },
    zkar_text1Text: {
        color: '#fff',
        fontFamily: 'ReadexPro_600SemiBold',
        textAlign: 'center',
        lineHeight: 30,
        paddingVertical: 10,
        paddingHorizontal: 4,
        marginBottom: 5,
    },
    zkar_text2Text: {
        color: 'rgba(255,255,255,0.7)',
        fontFamily: 'ReadexPro_400Regular',
        textAlign: 'center',
        fontSize: 14,
        marginTop: 5,
        marginBottom: 5,
        lineHeight: 22,
    },
    progressBarContainer: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 3,
        marginBottom: 12,
        overflow: 'hidden',
        width: '100%',
        flexDirection: 'row-reverse',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#EAB308',
        borderRadius: 3,
    },
    tapLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        fontFamily: 'ReadexPro_400Regular',
        textAlign: 'center',
        marginTop: 4,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.8)',
        fontFamily: 'ReadexPro_600SemiBold',
        textAlign: 'center',
        fontSize: 18,
        marginBottom: 20,
    },
    showBtn: {
        backgroundColor: 'rgba(234, 179, 8, 0.2)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    showBtnText: {
        color: '#EAB308',
        fontFamily: 'ReadexPro_600SemiBold',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#1B2A41', // Overridden dynamically
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: 400,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    modalHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontFamily: 'ReadexPro_700Bold',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 10,
        textAlign: 'right',
        fontFamily: 'ReadexPro_600SemiBold',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        fontFamily: 'ReadexPro_400Regular',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        textAlignVertical: 'top'
    },
    addButton: {
        backgroundColor: '#EAB308',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        marginTop: 10,
    },
    addButtonText: {
        color: '#000',
        fontSize: 18,
        fontFamily: 'ReadexPro_700Bold',
    }
});

const DhikrCard = memo(({
    item,
    currentCount,
    showCompleted,
    fontSize,
    onPress,
    onLongPress,
    onShare,
    onCopy
}: {
    item: DhikrItem;
    currentCount: number;
    showCompleted: boolean;
    fontSize: number;
    onPress: (item: DhikrItem) => void;
    onLongPress: (item: DhikrItem) => void;
    onShare: (text: string) => void;
    onCopy: (text: string) => void;
}) => {
    const isCompleted = currentCount >= item.count;

    // Hide if completed and "Show Completed" is false
    if (isCompleted && !showCompleted) {
        return null;
    }

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onPress(item)}
            onLongPress={() => onLongPress(item)}
            delayLongPress={500}
            style={[styles.card, isCompleted && styles.cardCompleted]}
        >
            <Text style={[styles.zkar_text1Text, { fontSize: fontSize }]}>{item.zkar_text1}</Text>
            {item.zkar_text2 ? (
                <Text style={styles.zkar_text2Text}>{item.zkar_text2}</Text>
            ) : null}

            <View style={styles.cardHeader}>
                <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={() => onShare(item.zkar_text1)} style={styles.iconBtn}>
                        <Share2 size={20} color="rgba(255,255,255,0.9)" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onCopy(item.zkar_text1)} style={styles.iconBtn}>
                        <Copy size={20} color="rgba(255,255,255,0.9)" />
                    </TouchableOpacity>
                </View>
                <View style={styles.counterContainer}>
                    <View style={[styles.counterPill, isCompleted && styles.counterPillCompleted]}>
                        <Text style={[styles.counterText, isCompleted && styles.counterTextCompleted]}>
                            {isCompleted ? <Check size={16} color="#fff" /> : `${item.count - currentCount}`}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
});
