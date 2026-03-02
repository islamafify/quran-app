import AdhkarDetailsScreen from '@/screens/AdhkarDetailsScreen';
import { useLocalSearchParams } from 'expo-router';

export default function AdhkarDetailsRoute() {
    const { id } = useLocalSearchParams();

    // Find title from data keys or predefined map (simple lookup)
    // Since Azkar_DATA keys are 'morning', 'evening', etc.
    const categoryId = typeof id === 'string' ? id : '';

    // Simple title mapping (could be improved)
    const titleMap: Record<string, string> = {
        'evening': 'أذكار المساء',
        'morning': 'أذكار الصباح',
        'prophetic': 'أدعية نبوية',
        'quranic': 'أدعية قرآنية',
        'comprehensive': 'جوامع الدعاء',
        'istighfar': 'أدعية الاستغفار',
         'prayer': 'أذكار الصلاة',
        'sleep': 'أذكار النوم',
               'waking': 'أذكار الاستيقاظ',

        'travel': 'أذكار السفر',
        'hajj': 'الحج والعمرة',
        'quran_khatm': 'دعاء ختم القران',
        'dead': 'أدعية للميت',
        'ruqyah': 'الرقية الشرعية',
       
    };


    const categoryTitle = titleMap[categoryId] || 'الأذكار';

    return <AdhkarDetailsScreen categoryId={categoryId} categoryTitle={categoryTitle} />;
}
