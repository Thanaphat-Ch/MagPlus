import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import AlertModal from "../components/AlertModal";
import { h4, page, pageBody } from "../styles/tw";

export default function DriverRegisterScreen() {
  const [idCard, setIdCard] = useState("");
  const [phone, setPhone] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('แจ้งเตือน');
  const [alertMessage2, setAlertMessage2] = useState('');
  const [isFormValid , setIsFormValid ] = useState(true);
   
  
  const [idCardError, setIdCardError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [licenseError, setLicenseError] = useState("");
  const router = useRouter();

  const apiUrl = process.env.API_URL;

  useEffect(() => {
    const isValid =
      idCard.length === 13 &&
      phone.length === 10 &&
      licensePlate.length === 9 &&
      idCardError === "" &&
      phoneError === "" &&
      licenseError === "";
  
    setIsFormValid(isValid);
  }, [idCard, phone, licensePlate, idCardError, phoneError, licenseError]);

  const handleSave = async () => {
    if (!idCard || !phone || !licensePlate) {
      setAlertMessage("ข้อมูลไม่ครบ");
      setAlertMessage2("กรุณากรอกข้อมูลให้ครบถ้วน");
      setAlertVisible(true);
      return;
    }

    // const username = await AsyncStorage.getItem('saved_username');
    const username = phone;
    await AsyncStorage.setItem("U_ID", phone);
    console.log({ username, idCard, phone, licensePlate });
        try {
          const response = await axios.post(`${apiUrl}/api/forgot`, {
            username,
            idCard,
            phone,
            licensePlate
          });
          console.log("forget success", response.data.message)
          router.replace("/");
        } 
        catch (error:any) {
          setAlertMessage("เข้าสู่ระบบไม่สำเร็จ");
          setAlertMessage2("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
          if (error.response?.data?.message) {
            setAlertMessage2(error.response.data.message);
          }
          setAlertVisible(true);
        }
    setAlertVisible(true);
  };




  return (
    <View className={`${page}`}>
      <View className={`${pageBody} `}>
      <TouchableOpacity onPress={() => router.replace('/')} className="absolute top-2 left-3 px-3 py-1 rounded-full z-10" >
          <Text className="text-gray-800 text-3xl font-bold">←</Text>
      </TouchableOpacity>
      <Text className="text-4xl font-bold text-center mb-10">ลืมรหัสผ่าน</Text>

      <Text className={h4}>เลขบัตรประชาชน</Text>
      <TextInput
        className="border border-black rounded-xl px-4 py-3 mb-1"
        keyboardType="numeric"
        maxLength={13}
        value={idCard}
        onChangeText={(text) => {
          if (/^\d*$/.test(text)) {
                  setIdCard(text);
                  setIdCardError(text.length < 13 ? "เลขบัจรประชาชนไม่ครบ 13 ตัว" : "");
        }}}
      />
      {idCardError !== "" && <Text className="text-red-500 mb-2">{idCardError}</Text>}

      <Text className={h4}>เบอร์โทรศัพท์</Text>
      <TextInput
        className="border border-black rounded-xl px-4 py-3 mb-1"
        keyboardType="phone-pad"
        maxLength={10}
        value={phone}
        onChangeText={(text) => {
              if (/^\d*$/.test(text)) {
                  setPhone(text);
                  setPhoneError(text.length < 10 ? "เบอร์โทรศัพท์ไม่ครบ 10 ตัว" : "");
          }}}
      />
      {phoneError !== "" && <Text className="text-red-500 mb-2">{phoneError}</Text>}

      <Text className={h4}>ทะเบียนรถ</Text>
      <TextInput
        className="border border-black rounded-xl px-4 py-3 mb-2"
        value={licensePlate}
        maxLength={9}
        onChangeText={(text) => {
              if (/^[\w\dก-ฮ-]*$/.test(text)) {
                  setLicensePlate(text);
                  setLicenseError(text.length < 9 ? "เลขทะเบียนรถรวมขีดมี 9 ตัว" : "");
          }}}
      />
      {licenseError !== "" && <Text className="text-red-500 mb-2">{licenseError}</Text>}

      <View className="flex-row justify-between mt-8">
        <TouchableOpacity
          onPress={() => {
            setIdCard("");
            setPhone("");
            setLicensePlate("");
            setIdCardError("");
            setPhoneError("");
            setLicenseError("");
          }}
          className="flex-1 bg-gray-400 py-4 rounded-full items-center mr-2"
        >
          <Text className="text-white text-lg font-semibold">ล้าง</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {if(isFormValid){handleSave()}}}
          className="flex-1 bg-blue-600 py-4 rounded-full items-center ml-2"
        >
            <Text className="text-white text-lg font-semibold"  >บันทึก</Text>
        </TouchableOpacity>
        <AlertModal visible={alertVisible} message={alertMessage} message2={alertMessage2} onClose={() => setAlertVisible(false)} />
      </View>
      </View>
    </View>
  );
}