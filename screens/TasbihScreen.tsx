import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Pen, RotateCcw, Smartphone, Trash2, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    Vibration,
    View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// --- Types ---
interface Dhikr {
    id: string;
    text: string;     // zkar_text1 text
    target: number;
    count: number;    // Current stored count
}

const DEFAULT_DHIKRS: Dhikr[] = [
    { id: '1', text: 'سبحان الله', target: 33, count: 0 },
    { id: '2', text: 'الحمد لله', target: 33, count: 0 },
    { id: '3', text: 'الله أكبر', target: 33, count: 0 },
    { id: '4', text: 'استغفر الله', target: 100, count: 0 },
];

const STORAGE_KEY_DHIKRS = '@tasbih_custom_dhikrs_v3';
const STORAGE_KEY_SELECTED = '@tasbih_selected_id_v3';

export default function TasbihScreen() {
    const router = useRouter();
    // --- State ---
    const [dhikrs, setDhikrs] = useState<Dhikr[]>(DEFAULT_DHIKRS);
    const [selectedId, setSelectedId] = useState<string>(DEFAULT_DHIKRS[0].id);
    const [isVibrationEnabled, setIsVibrationEnabled] = useState(true);
    const insets = useSafeAreaInsets();

    // Modal State
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingDhikr, setEditingDhikr] = useState<Dhikr | null>(null); // null means adding new
    const [modalText, setModalText] = useState('');
    const [modalTarget, setModalTarget] = useState('33');

    // Animations
    const scale = useSharedValue(1);

    const activeDhikr = dhikrs.find(d => d.id === selectedId) || dhikrs[0];

    // --- Effects ---
    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        saveData();
    }, [dhikrs, selectedId]);

    // --- Data Management ---
    const loadData = async () => {
        try {
            const savedDhikrs = await AsyncStorage.getItem(STORAGE_KEY_DHIKRS);
            const savedSelectedId = await AsyncStorage.getItem(STORAGE_KEY_SELECTED);

            if (savedDhikrs) {
                setDhikrs(JSON.parse(savedDhikrs));
            }
            if (savedSelectedId) {
                setSelectedId(savedSelectedId);
            }
        } catch (e) {
            console.error("Failed to load tasbih data", e);
        }
    };

    const saveData = async () => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY_DHIKRS, JSON.stringify(dhikrs));
            await AsyncStorage.setItem(STORAGE_KEY_SELECTED, selectedId);
        } catch (e) {
            console.error("Failed to save tasbih data", e);
        }
    };

    // --- Handlers ---
    const handleCount = () => {
        if (isVibrationEnabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (Platform.OS === 'android') {
                Vibration.vibrate(10);
            }
        }

        // Animate
        scale.value = withSequence(
            withSpring(0.95),
            withSpring(1)
        );

        // Update Data
        setDhikrs(prev => prev.map(d => {
            if (d.id === selectedId) {
                // Check if target reached
                if (d.count + 1 === d.target) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                return { ...d, count: d.count + 1 };
            }
            return d;
        }));
    };

    const handleReset = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setDhikrs(prev => prev.map(d => {
            if (d.id === selectedId) return { ...d, count: 0 };
            return d;
        }));
    };

    const toggleVibration = () => {
        Haptics.selectionAsync();
        setIsVibrationEnabled(!isVibrationEnabled);
    };

    // --- CRUD Modal Handlers ---
    const openAddModal = () => {
        setEditingDhikr(null);
        setModalText('');
        setModalTarget('33');
        setIsModalVisible(true);
    };

    const openEditModal = (dhikr: Dhikr) => {
        setEditingDhikr(dhikr);
        setModalText(dhikr.text);
        setModalTarget(dhikr.target.toString());
        setIsModalVisible(true);
    };

    const saveModal = () => {
        const targetNum = parseInt(modalTarget) || 33;

        if (editingDhikr) {
            // Edit existing
            setDhikrs(prev => prev.map(d => d.id === editingDhikr.id ? {
                ...d,
                text: modalText,
                target: targetNum
            } : d));
        } else {
            // Add new
            const newDhikr: Dhikr = {
                id: Date.now().toString(),
                text: modalText || 'ذكر جديد',
                target: targetNum,
                count: 0
            };
            setDhikrs(prev => [...prev, newDhikr]);
            setSelectedId(newDhikr.id);
        }
        setIsModalVisible(false);
    };

    const deleteDhikr = (id: string) => {
        if (dhikrs.length <= 1) return; // Don't delete last one
        const newDhikrs = dhikrs.filter(d => d.id !== id);
        setDhikrs(newDhikrs);
        if (selectedId === id) {
            setSelectedId(newDhikrs[0].id);
        }
    };

    // --- Render Helpers ---
    const animatedCircleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    return (
        <LinearGradient
            colors={['#4A1C40', '#E8AF8C']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>التسبيح</Text>
                    <Text style={styles.headerSubtitle}>الذكر والدعاء</Text>
                </View>

                <View style={styles.placeholderIcon} />
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.replace('/(tabs)')}
                    activeOpacity={0.7}
                >
                    <ArrowLeft size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>

                {/* Main Counter Ring */}
                <View style={styles.ringContainer}>
                    {/* Background Ring */}
                    <View style={styles.ringBackground} />

                    {/* Active Ring Visual (Static for now as no SVG) */}
                    <View style={[styles.ringActive, {
                        borderColor: activeDhikr.count >= activeDhikr.target ? '#4ADE80' : '#EAB308'
                    }]} />

                    {/* Interactive Button */}
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={handleCount}
                        style={styles.counterButton}
                    >
                        <Animated.View style={[styles.innerCircle, animatedCircleStyle]}>
                            <Text style={styles.countText}>{activeDhikr.count}</Text>
                            <Text style={styles.labelCount}>العدد</Text>
                        </Animated.View>
                    </TouchableOpacity>
                </View>

                {/* Actions Row */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleReset}>
                        <View style={styles.iconCircle}>
                            <RotateCcw size={20} color="rgba(255,255,255,0.8)" />
                        </View>
                        <Text style={styles.actionText}>إعادة</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.targetPill}
                        onPress={() => openEditModal(activeDhikr)}
                    >
                        <Text style={styles.targetText}>
                            الهدف: <Text style={styles.targetValue}>{activeDhikr.target}</Text>
                        </Text>
                        <View style={styles.editIconParams}>
                            <Pen size={12} color="rgba(255,255,255,0.9)" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={toggleVibration}>
                        <View style={[styles.iconCircle, !isVibrationEnabled && styles.disabledIcon]}>
                            <Smartphone size={20} color={isVibrationEnabled ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)"} />
                        </View>
                        <Text style={styles.actionText}>اهتزاز</Text>
                    </TouchableOpacity>
                </View>
            </View>



            {/* Edit/Add Modal */}
            <Modal
                visible={isModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingDhikr ? 'تعديل الذكر' : 'إضافة ذكر جديد'}
                            </Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                <X size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>نص الذكر</Text>
                            <TextInput
                                style={styles.input}
                                value={modalText}
                                onChangeText={setModalText}
                                placeholder="سبحان الله"
                                textAlign="right"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>الهدف</Text>
                            <TextInput
                                style={styles.input}
                                value={modalTarget}
                                onChangeText={setModalTarget}
                                keyboardType="number-pad"
                                placeholder="33"
                                textAlign="right"
                            />
                        </View>

                        <View style={styles.modalActions}>
                            {editingDhikr && (
                                <TouchableOpacity
                                    style={styles.deleteBtn}
                                    onPress={() => {
                                        deleteDhikr(editingDhikr.id);
                                        setIsModalVisible(false);
                                    }}
                                >
                                    <Trash2 size={20} color="#EF4444" />
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity style={styles.saveBtn} onPress={saveModal}>
                                <Text style={styles.saveBtnText}>حفظ</Text>
                            </TouchableOpacity>
                        </View>
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
        width: '100%',
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        zIndex: 10,

    },
    headerTitleContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        lineHeight: 50,
        fontSize: 24,
        color: '#fff',
        fontFamily: 'ReadexPro_700Bold',
        textAlign: 'right',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontFamily: 'ReadexPro_400Regular',
        textAlign: 'right',
    },
    placeholderIcon: {
        width: 40,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    activeDhikrInfo: {
        alignItems: 'center',
        marginBottom: 40,
    },

    // Ring & Counter
    ringContainer: {
        width: 280,
        height: 280,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 50,
        position: 'relative',
    },
    ringBackground: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 140,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    ringActive: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 140,
        borderWidth: 4,
        borderColor: '#EAB308', // Gold
        opacity: 0.8,
    },
    counterButton: {
        width: 250,
        height: 250,
        borderRadius: 125,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,

    },
    innerCircle: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    countText: {
        fontSize: 80,
        color: '#fff',
        includeFontPadding: false,
        fontFamily: 'ReadexPro_700Bold',
        textAlign: 'center',
        lineHeight: 100,
    },
    labelCount: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 5,
        fontFamily: 'ReadexPro_400Regular',
    },

    // Actions
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 20,
    },
    actionBtn: {
        alignItems: 'center',
        opacity: 0.9,
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    disabledIcon: {
        opacity: 0.5,
    },
    actionText: {
        color: '#fff',
        fontSize: 12,
        opacity: 0.8,
        fontFamily: 'ReadexPro_400Regular',
    },
    targetPill: {
        backgroundColor: 'rgba(0,0,0,0.1)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    targetText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontFamily: 'ReadexPro_400Regular',
    },
    targetValue: {
        color: '#EAB308',
        fontSize: 16,
        fontFamily: 'ReadexPro_700Bold',
    },
    editIconParams: {
        marginLeft: 4,
        opacity: 0.6
    },

    // Bottom Section
    bottomSection: {
    },
    sectionTitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        marginHorizontal: 24,
        marginBottom: 10,
        textAlign: 'right',
        fontFamily: 'ReadexPro_400Regular',
    },
    listContainer: {
        paddingHorizontal: 20,
        flexDirection: 'row-reverse', // RTL natural flow
        paddingBottom: 10,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
        padding: 12,
        minWidth: 140,
        marginRight: 10,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 10,
    },
    cardSelected: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderColor: 'rgba(234, 179, 8, 0.5)', // Gold border
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkCircleSelected: {
        backgroundColor: 'rgba(234, 179, 8, 0.5)',
    },
    cardTitle: {
        color: '#fff',
        fontSize: 14,
        textAlign: 'right',
        fontFamily: 'ReadexPro_600SemiBold',
    },
    addCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 12,
        minWidth: 80,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
    },
    addIconCircle: {
        marginBottom: 4,

    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FDFCF8',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        color: '#1F1F1F',
        fontFamily: 'ReadexPro_700Bold',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        textAlign: 'right',
        fontFamily: 'ReadexPro_400Regular',
    },
    input: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1F1F1F',
        textAlign: 'right',
        fontFamily: 'ReadexPro_400Regular',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    saveBtn: {
        flex: 1,
        backgroundColor: '#EAB308',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'ReadexPro_700Bold',
    },
    deleteBtn: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
