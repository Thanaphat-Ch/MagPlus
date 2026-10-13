import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { isAxiosError } from 'axios';
import { API_URL } from './config';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<{ error?: string; message?: string }>(error)) {
    const responseData = error.response?.data;
    if (responseData?.error) return responseData.error;
    if (responseData?.message) return responseData.message;
  }

  return error instanceof Error ? error.message : fallback;
}

export default api;
