

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Image, Modal, Text, TouchableOpacity, View } from "react-native";
import AlertModal from "./components/AlertModal";
import { connSocket } from "./services/socket";

interface Notifications {
    id: number;
    message: string;
  }

export default function LoginPinScreen() {
  const [pin, setPin] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [notifications, setNotifications] = useState<Notifications[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  const router = useRouter();
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('แจ้งเตือน');
  const [alertMessage2, setAlertMessage2] = useState('');
  const socketRef = useRef<any>(null);


  useEffect(() => {
    socketRef.current = connSocket(`https://app.magnitudetms.com`);
    socketRef.current.on('sendMessage_admin', (data: any) => {
      console.log('reply success', data)
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          message: `รหัสยืนยัน: ${data.message}`
        },
      ]);
      AsyncStorage.setItem("replyMessage", data.message);
    });

    return () => {
    };
  }, []);


  const handlePress = (value: string) => {
    if (pin.length < 6) {
      const newPin = pin + value;
      setPin(newPin);

      if (newPin.length === 6) {
        handleSubmit(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };
  const handleSubmit = async (password: string) => {
    const username = await AsyncStorage.getItem('saved_username');
    try {
      const response = await axios.post(`https://app.magnitudetms.com/api/login`, {
        username,
        password,
      });
      console.log("login success", response.data);
      await AsyncStorage.setItem("token", response.data.token);
      await AsyncStorage.setItem("userId", response.data.user.id.toString());
      await AsyncStorage.setItem("user",JSON.stringify(response.data.user));
      await AsyncStorage.setItem("U_ID", response.data.user.U_ID.toString());
      
      console.log (response) 
      router.replace('./pages/Main');
      }
      catch (error: any) {
        setAlertMessage('ล็อกอินไม่สำเร็จ')
        setAlertMessage2('เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
        if (error.response?.data?.message) {
          if(error.response.data.message === 'ชื่อผู้ใช้ไม่ถูกต้อง'){
          setAlertMessage2('กรุณาตั้งค่ารหัสผ่านใหม่');
        } else {
          setAlertMessage2(error.response.data.message);
        }}
        setAlertVisible(true);
        setPin('');
      }
    };

  const renderPinDots = () => (
    <View className="flex-row space-x-3 mb-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <View
          key={i}
          className={`w-4 h-4 rounded-full ${
            i < pin.length ? "bg-blue-400" : "bg-gray-300"
          }`}
        />
      ))}
    </View>
  );

  const renderKey = (keyValue: string, onPress: () => void, className = "") => (
    <TouchableOpacity
      key={keyValue}
      onPress={onPress}
      className={`w-16 h-16 bg-white rounded-full justify-center items-center shadow md:w-20h-20`}
    >
      <Text className="text-lg font-bold text-gray-800 md:text-xl">{keyValue}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 items-center justify-center">

      {notifications.length > 0 && (
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          className="absolute top-3 self-center flex-row items-center bg-gray-200 px-3 py-2 rounded-full shadow z-50"
        >
          <Text className="text-2xl">🔔</Text>
          <View className="bg-red-600 rounded-full w-5 h-5 ml-1 items-center justify-center">
            <Text className="text-white text-xs font-bold">{notifications.length}</Text>
          </View>
        </TouchableOpacity>
      )}
      
      <AlertModal visible={alertVisible} message={alertMessage} message2={alertMessage2} onClose={() => setAlertVisible(false)} />

      {/* ✅ Modal แจ้งเตือน */}
      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-center px-5">
          <View className="bg-white rounded-xl p-5 max-h-[70%]">
            <Text className="text-lg font-bold mb-2">ข้อความตอบกลับจาก Admin</Text>

            {notifications.map((item) => ( 
              <View key={item.id} className="border-b border-gray-300 py-2">
                <Text>{item.message}</Text>
              </View>
            ))}

            <View className="flex-row justify-end mt-4">
              <TouchableOpacity
                onPress={() => {
                  setShowModal(false);
                  setNotifications([]);
                  router.replace('/screens/resetpassword');
                }}
                className="bg-green-600 px-4 py-2 rounded-md"
              >
                <Text className="text-white font-bold">ตกลง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* titel */}    
      <Image
        source={require('../assets/images/Logo-app.png')}
        className="self-center mt-6"
        style={{ width: 120, height: 90 }}
        resizeMode="contain"
      />
      <Text className="text-2xl font-bold text-blue-800 mb-5">
        MagPlus
      </Text>
      <Text className="text-lg font-semibold text-gray-600 mb-5">
        ใส่รหัส PIN
      </Text>

      {/* PIN Input */}
      {renderPinDots()}

      <View className="gap-3 mt-4">
        <View className="flex-row justify-center gap-5">
          {["1", "2", "3"].map((n) => renderKey(n, () => handlePress(n)))}
        </View>
        <View className="flex-row justify-center gap-5">
          {["4", "5", "6"].map((n) => renderKey(n, () => handlePress(n)))}
        </View>
        <View className="flex-row justify-center gap-5">
          {["7", "8", "9"].map((n) => renderKey(n, () => handlePress(n)))}
        </View>
        <View className="flex-row justify-center gap-5">
          <View className="w-16 h-16 md:w-20h-20" />
          {renderKey("0", () => handlePress("0"))}
          {renderKey("⌫", handleDelete, "bg-red-300")}
        </View>
      </View>

      <TouchableOpacity className="mt-10" onPress={() => router.push("/screens/setpassword")}>
        <Text className={`text-sm text-primary font-semibold`}>ตั้งค่ารหัสผ่านใหม่</Text>
        {/* <Text className={`text-sm text-primary font-semibold`}>เปลี่ยนบัญชี</Text> */}
      </TouchableOpacity>

      <TouchableOpacity className="mt-2" onPress={() => setShowForgotModal(true)}>
        <Text className={`text-sm text-primary font-semibold`}>ลืม PIN</Text>
      </TouchableOpacity>

      <Modal
        transparent
        visible={showForgotModal}
        animationType="fade"
        onRequestClose={() => setShowForgotModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-6 rounded-2xl w-80 shadow-xl">
            <Text className="text-xl font-bold text-gray-800 mb-4">ลืมรหัสผ่าน?</Text>
            <Text className="text-gray-600 mb-6">
              หากคุณลืมรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ หรือไปที่หน้ากู้คืนรหัสผ่าน
            </Text>
            <View className="flex-row justify-end space-x-4">
              <TouchableOpacity onPress={() => setShowForgotModal(false)}>
                <Text className="text-danger font-semibold">ปิด</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                setShowForgotModal(false);
                router.push("/screens/forgotpassword");
              }}>
                <Text className="text-primary font-semibold">ไปต่อ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}