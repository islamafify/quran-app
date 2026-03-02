import { Check, Info, X } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { BaseToastProps } from 'react-native-toast-message';

interface ToastProps extends BaseToastProps {
    text1?: string;
    text2?: string;
    props?: any;
}

export const toastConfig = {
    success: ({ text1, text2 }: ToastProps) => (
        <View style={styles.container}>
            <View style={[styles.iconContainer, styles.successIcon]}>
                <Check size={20} color="#000" />
            </View>
            <View style={styles.contentContainer}>
                <Text style={styles.text1}>{text1}</Text>
                {text2 && <Text style={styles.text2}>{text2}</Text>}
            </View>
        </View>
    ),
    error: ({ text1, text2 }: ToastProps) => (
        <View style={styles.container}>
            <View style={[styles.iconContainer, styles.errorIcon]}>
                <X size={20} color="#fff" />
            </View>
            <View style={styles.contentContainer}>
                <Text style={styles.text1}>{text1}</Text>
                {text2 && <Text style={styles.text2}>{text2}</Text>}
            </View>
        </View>
    ),
    info: ({ text1, text2 }: ToastProps) => (
        <View style={styles.container}>
            <View style={[styles.iconContainer, styles.infoIcon]}>
                <Info size={20} color="#fff" />
            </View>
            <View style={styles.contentContainer}>
                <Text style={styles.text1}>{text1}</Text>
                {text2 && <Text style={styles.text2}>{text2}</Text>}
            </View>
        </View>
    )
};

const styles = StyleSheet.create({
    container: {
        height: 100,
        width: '90%',
        backgroundColor: '#2A1028',
        borderRadius: 16,
        paddingHorizontal: 15,
        flexDirection: 'row-reverse',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        // elevation: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 12
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successIcon: {
        backgroundColor: '#EAB308',
    },
    errorIcon: {
        backgroundColor: '#EF4444',
    },
    infoIcon: {
        backgroundColor: '#3B82F6',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    text1: {
        marginTop: 10,
        fontSize: 15,
        fontFamily: 'ReadexPro_600SemiBold',
        color: '#fff',
        textAlign: 'right',
        lineHeight: 30,
    },
    text2: {
        marginBottom: 10,
        fontSize: 13,
        fontFamily: 'ReadexPro_400Regular',
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'right',
        lineHeight: 30,
    }
});