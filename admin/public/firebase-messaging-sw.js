// public/firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js");

const firebaseConfig = {
  apiKey: "AIzaSyALQGwnIhm3P0EUb7aUSC_jjizJmEzeyRo",
  authDomain: "chatadmin-a2f3c.firebaseapp.com",
  projectId: "chatadmin-a2f3c",
  storageBucket: "chatadmin-a2f3c.firebasestorage.app",
  messagingSenderId: "457458148985",
  appId: "1:457458148985:web:d8be196847e42e8b7e16a8",
  measurementId: "G-QWKHRERD3L"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  if (!payload.data) {
    console.log("No data payload in background message.");
    return;
  }

  // ดึงข้อมูลจาก "data" และแสดง Notification
  const { title, body } = payload.data;
  const notificationOptions = {
    body: body,
    icon: '/favicon.ico' // หรือ path รูปโลโก้ของคุณ
  };

  self.registration.showNotification(title, notificationOptions);
});