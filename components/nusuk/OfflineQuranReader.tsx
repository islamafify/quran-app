import { QuranPages } from '@/assets/quran_pages';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

const { width } = Dimensions.get('window');

const STORAGE_KEY = '@last_quran_page_v1';

export function OfflineQuranReader() {
    const [currentPage, setCurrentPage] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const [sliderValue, setSliderValue] = useState(0);
    const [showControls, setShowControls] = useState(false);
    const [initialIndex, setInitialIndex] = useState(0);

    const toggleControls = () => setShowControls(!showControls);

    useEffect(() => {
        const loadLastPage = async () => {
            try {
                const storedPage = await AsyncStorage.getItem(STORAGE_KEY);
                if (storedPage !== null) {
                    const pageIndex = parseInt(storedPage, 10);
                    if (!isNaN(pageIndex) && pageIndex >= 0 && pageIndex < QuranPages.length) {
                        setInitialIndex(pageIndex);
                        setCurrentPage(pageIndex);
                        setSliderValue(pageIndex);
                    }
                }
            } catch (e) {
                console.error('Failed to load last page', e);
            }
        };

        loadLastPage();
    }, []);

    const savePage = async (index: number) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, index.toString());
        } catch (e) {
            console.error('Failed to save page', e);
        }
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => (
        <TouchableWithoutFeedback onPress={toggleControls}>
            <View style={styles.pageContainer}>
                <Image
                    source={item}
                    style={styles.pageImage}
                    contentFit="contain"
                />
                <View style={styles.pageNumberContainer}>
                    <Text style={styles.pageNumberText}>صفحة {index + 1}</Text>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );

    const getItemLayout = (data: any, index: number) => ({
        length: width,
        offset: width * index,
        index,
    });

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            const index = viewableItems[0].index;
            setCurrentPage(index);
            setSliderValue(index);
            savePage(index);
        }
    }).current;

    const handleSliderChange = (value: number) => {
        setSliderValue(value);
    };

    const handleSliderComplete = (value: number) => {
        const index = Math.floor(value);
        flatListRef.current?.scrollToIndex({ index, animated: false });
    };

    if (!QuranPages || QuranPages.length === 0) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>جاري تحميل الصفحات...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={QuranPages}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => index.toString()}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                inverted={true} // Right-to-left for zkar_text1
                initialNumToRender={2}
                maxToRenderPerBatch={2}
                windowSize={3}
                getItemLayout={getItemLayout}
                initialScrollIndex={initialIndex}
                onScrollToIndexFailed={(info) => {
                    const wait = new Promise(resolve => setTimeout(resolve, 500));
                    wait.then(() => {
                        flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
                    });
                }}
            />

            {showControls && (
                <View style={styles.controlsContainer}>
                    <Text style={styles.pageNumberText}>صفحة {Math.floor(sliderValue) + 1}</Text>
                    <Slider
                        style={[styles.slider, { transform: [{ scaleX: -1 }] }]}
                        minimumValue={0}
                        maximumValue={QuranPages.length - 1}
                        value={sliderValue}
                        onValueChange={handleSliderChange}
                        onSlidingComplete={handleSliderComplete}
                        minimumTrackTintColor="#D4AF37"
                        maximumTrackTintColor="#000000"
                        thumbTintColor="#D4AF37"
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffffff',
    },
    pageContainer: {
        width: width,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    pageImage: {
        width: '100%',
        height: '90%',
        backgroundColor: '#fff',
    },
    pageNumberContainer: {
        height: '10%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 50,
    },
    controlsContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 15,

        padding: 10,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        // elevation: 5,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    pageNumberText: {
        fontSize: 16,
        color: '#333',
        fontFamily: 'ReadexPro_600SemiBold', // Updated font
        //  marginBottom: 5,
    }
});
