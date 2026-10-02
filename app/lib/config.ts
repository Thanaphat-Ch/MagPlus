import Constants from 'expo-constants';

// แกะค่า apiUrl ออกมาจาก extra คอนฟิกของ Expo
export const API_URL = 
  Constants.expoConfig?.extra?.apiUrl || 
  Constants.expoInitialConfig?.extra?.apiUrl || 
  "http://localhost:5000"; // 🛡️ ตัวช่วยชีวิต: ถ้าทุกอย่างพัง ให้วิ่งมาที่นี่ แอปจะไม่ระเบิด