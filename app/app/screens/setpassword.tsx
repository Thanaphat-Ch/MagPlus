
import { API_URL } from "@/lib/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Keyboard, Text, TextInput, TouchableOpacity, View } from "react-native";
import AlertModal from "../components/AlertModal";
import { h4, inputTextclass, page, pageBody } from "../styles/tw";

export default function SetPasswordScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isFormValid , setIsFormValid ] = useState(true);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertMessage2, setAlertMessage2] = useState('');
  const apiUrl = process.env.API_URL;
  const router = useRouter();

  useEffect(() => {
  const isValid =
    username.length === 10 &&
    password.length === 6 &&
    confirmPassword.length === 6 &&
    password === confirmPassword &&
    usernameError === "" &&
    passwordError === "" &&
    confirmPasswordError === "";

  setIsFormValid(isValid);
}, [username, password, confirmPassword, usernameError, passwordError, confirmPasswordError]);

  const handleSave = async () => {
    Keyboard.dismiss();
    console.log({API_URL})
    try {
      await AsyncStorage.setItem("saved_username", username);
      await AsyncStorage.setItem("saved_pin", password);

      try {
        await axios.put(`${apiUrl}/api/set-pin`, {username, password});
        console.log("set แล้ว")
        Alert.alert("บันทึกสำเร็จ", "ตั้งค่ารหัสผ่านเรียบร้อย");
        router.replace("/");
      } catch (err: any) {
        console.error('❌ Update failed:', err);
        setAlertMessage('เกิดข้อผิดพลาด')
        setAlertMessage2('ไม่สามารถเชื่อมต่อ server ได้')
        if (err.response?.data?.message) {
          setAlertMessage('บันทึกไม่สำเร็จ');
          setAlertMessage2(err.response.data.message);
        }
        setAlertVisible(true);
      }
    } catch (error) {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้");
      console.error(error);
    }
  };

  return (
    <View className={page}>
    
      <AlertModal visible={alertVisible} message={alertMessage} message2={alertMessage2} onClose={() => setAlertVisible(false)}/>

      <View className={`${pageBody} px-6`}>
        <TouchableOpacity onPress={() => router.replace('/')} className="absolute top-2 left-3 px-3 py-1 rounded-full z-10" >
          <Text className="text-gray-800 text-3xl font-bold">←</Text>
        </TouchableOpacity>
        <Text className="text-3xl font-bold text-gray-800 mt-8 mb-8 text-center">
          ตั้งค่ารหัส PIN
        </Text>
        <Text className={h4}>เบอร์โทร</Text>
        <TextInput
          value={username}
          onChangeText={(text) => {
              if (/^\d*$/.test(text)) {
                setUsername(text);
                setUsernameError(text.length < 10 ? "เบอร์โทรต้องมีอย่างน้อย 10 หลัก" : "");
          }}}
          keyboardType="numeric"
          maxLength={10}
          autoCapitalize="none"
          className={inputTextclass}
        />
        {usernameError ? (
          <Text className="text-red-500 mb-3 self-start">{usernameError}</Text>
        ) : (
          <View className="mb-3" />
        )}
        <Text className={h4}>
          ตั้งรหัส PIN (ตัวเลข 6 ตัว)
        </Text>
        <TextInput
          value={password}
          onChangeText={(text) => {
            if (/^\d*$/.test(text)) {
              setPassword(text);
              setPasswordError(
                text.length < 6 ? "รหัสต้องมีอย่างน้อย 6 หลัก" : ""
              );
              if (confirmPassword && text !== confirmPassword) {
                setConfirmPasswordError("รหัสผ่านไม่ตรงกัน");
              } else {
                setConfirmPasswordError("");
              }
            }
          }}
          keyboardType="numeric"
          maxLength={6}
          className={inputTextclass}
        />
        {passwordError ? (
          <Text className="text-red-500 mb-3 self-start">{passwordError}</Text>
        ) : (
          <View className="mb-3" />
        )}
        <Text className={h4}>
          ยืนยันรหัสผ่าน
        </Text>
        <TextInput
          value={confirmPassword}
          onChangeText={(text) => {
            if (/^\d*$/.test(text)) {
              setConfirmPassword(text);

              if (text.length < 6) {
                setConfirmPasswordError("กรุณากรอกให้ครบ 6 หลัก");
              } else if (password && text !== password) {
                setConfirmPasswordError("รหัสผ่านไม่ตรงกัน");
              } else {
                setConfirmPasswordError("");
              }
            }
          }}
          keyboardType="numeric"
          maxLength={6}
          className={inputTextclass}
        />
        {confirmPasswordError ? (
          <Text className="text-red-500 mb-6 self-start">{confirmPasswordError}</Text>
        ) : (
          <View className="mb-6" />
        )}
        <TouchableOpacity
          onPress={() => {if(isFormValid){handleSave()}}}
     
          className={`rounded-xl px-6 py-4 w-full bg-primary`}
        >
          <Text className="text-white text-center text-lg font-semibold">บันทึก</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
