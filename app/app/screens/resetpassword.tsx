import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import AlertModal from "../components/AlertModal";

export default function ResetPasswordScreen() {
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState<string | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('แจ้งเตือน');
  const [alertMessage2, setAlertMessage2] = useState('');
  const [isFormValid , setIsFormValid ] = useState(true);
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });
  const apiUrl = process.env.API_URL;

  useEffect(() => {
    if (params?.code) {
      setCode(String(params.code));
    }
    const loadConfirmPass = async () => {
      const reply = await AsyncStorage.getItem("replyMessage");
      setConfirmPass(reply);
    };
    loadConfirmPass();
  }, [params]);

  useEffect(() => {
  validate();
}, [password, confirmPassword]);

  const validate = () => {
    const newErrors = { password: "", confirmPassword: "" };
    let valid = true;

    if (password.length !== 6) {
      newErrors.password = "รหัสผ่านต้องมี 6 หลัก";
      valid = false;
      
    }

    if (confirmPassword.length !== 6) {
      newErrors.confirmPassword = "ยืนยันรหัสต้องมี 6 หลัก";
      valid = false;


    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "รหัสไม่ตรงกัน";
      valid = false;

    }
    setIsFormValid(valid)
    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const username = await AsyncStorage.getItem('saved_username');

      try {
        await axios.put(`${apiUrl}/api/set-pin`, {username, password});
        console.log("newset แล้ว")
      } catch (err) {
        console.error('❌ Update failed:', err);
      }
      setAlertMessage('สำเร็จ')
      setAlertMessage2('บันทึกสำเร็จ ตั้งค่ารหัสผ่านเรียบร้อย');
      setAlertVisible(true);
      router.replace("/");
    } 
    catch (error: any) {
      setAlertMessage('เกิดข้อผิดพลาด');
      setAlertMessage2('ไม่สามารถบันทึกข้อมูลได้')
      if (error.response?.data?.message) {
        setAlertMessage(error.response.data.message);
      }
      setAlertVisible(true);
      console.error(error);
    }
  };

  const handleNumericInput = (text: string, setter: (val: string) => void) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 6);
    setter(cleaned);
  };

  return (
    <View className="flex-1 bg-gray-100 px-6 pt-20">
      <TouchableOpacity
        onPress={() => router.replace('/')}
        className="absolute top-6 left-6 bg-gray-200 px-3 py-1 rounded-full z-10"
      >
        <Text className="text-gray-800 text-base font-bold">←</Text>
      </TouchableOpacity>

      <Text className="text-3xl font-bold text-gray-800 mb-6 text-center">
        เปลี่ยนรหัสผ่าน
      </Text>

      <Text className="text-gray-700 mb-2">กรุณากรอกรหัสยืนยัน</Text>
      <TextInput
        className="bg-white rounded-xl p-4 mb-4 border border-gray-300 text-gray-500"
        value={confirmPass ?? ""}
        editable={false}
      />

      <Text className="text-gray-700 mb-2">รหัสผ่านใหม่</Text>
      <TextInput
        className="bg-white rounded-xl p-4 border border-gray-300"
        keyboardType="numeric"
        value={password}
        onChangeText={(text) => handleNumericInput(text, setPassword)}
      />
      {errors.password ? (
        <Text className="text-red-500 mt-1">{errors.password}</Text>
      ) : null}

      <Text className="text-gray-700 mt-6 mb-2">ยืนยันรหัสผ่านใหม่</Text>
      <TextInput
        className="bg-white rounded-xl p-4 border border-gray-300"
        keyboardType="numeric"
        value={confirmPassword}
        onChangeText={(text) => handleNumericInput(text, setConfirmPassword)}
      />
      {errors.confirmPassword ? (
        <Text className="text-red-500 mt-1">{errors.confirmPassword}</Text>
      ) : null}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={!isFormValid}
        className={`rounded-xl mt-10 px-6 py-4 w-full items-center ${isFormValid ? "bg-blue-500" : "bg-gray-400"}`}

      >
        <Text className="text-white font-bold text-lg">ยืนยัน</Text>
      </TouchableOpacity>
      <AlertModal
        visible={alertVisible}
        message={alertMessage}
        message2={alertMessage2}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
}