import { Platform } from 'react-native';

export const BACKEND_URL =
    Platform.OS === 'android'
        ? 'http://192.168.29.247:3001'
        : 'http://localhost:3001';