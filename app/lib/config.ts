import Constants from 'expo-constants';

const configuredApiUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  Constants.expoInitialConfig?.extra?.apiUrl;

if (!configuredApiUrl) {
  throw new Error(
    'Express API URL is missing. Set EXPO_PUBLIC_API_URL or API_URL before starting the app.',
  );
}

export const API_URL = configuredApiUrl.replace(/\/+$/, '');