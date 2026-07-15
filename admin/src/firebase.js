// src/firebase.js

import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import axios from 'axios';

const firebaseConfig = {
  apiKey: import.meta.env.FIREBASE_API_KEY,
  authDomain: "chatadmin-a2f3c.firebaseapp.com",
  projectId: "chatadmin-a2f3c",
  storageBucket: "chatadmin-a2f3c.firebasestorage.app",
  messagingSenderId: "457458148985",
  appId: "1:457458148985:web:d8be196847e42e8b7e16a8",
  measurementId: "G-QWKHRERD3L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

const API_URL = import.meta.env.API_URL;

export const requestForToken = (userId) => {
  return getToken(messaging, { vapidKey: 'BMKY39tQUtPUwBtR-GBQqPNhpjAT2pIyNnGv2ahooiGwbVZeVFFXIKvBPJb0zyE59EfvKgSu2n6khZEx5ERJMDM' })
    .then((currentToken) => {
      if (currentToken) {
        console.log('✅ FCM Token:', currentToken);
        // ส่ง Token ไปเก็บที่ Backend
        axios.post(`${API_URL}/api/register-fcm-token`, { token: currentToken, userId })
          .then(() => console.log('Token sent to server successfully.'))
          .catch(err => console.error('Error sending token to server:', err));
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    })
    .catch((err) => {
      console.log('An error occurred while retrieving token. ', err);
    });
};

let messageListenerRegistered = false;
if (!messageListenerRegistered) {
  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
  });
  messageListenerRegistered = true;
}