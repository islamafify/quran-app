// @ts-ignore
import { QuranClient } from '@quranjs/api';

let instance: QuranClient | null = null;

export const getQuranClient = () => {
    if (!instance) {
        instance = new QuranClient({
            clientId: '',
            clientSecret: ''
        });
    }
    return instance;
};
