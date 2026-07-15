import { ConfirmModal } from "@/app/components/AlertModal";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RowInput from "./components/RowInput";

interface DriverData {
  D_ID: string
  D_Name: string
  D_SurName: string
  D_Tel: string
  D_DateBirth: Date | null
  D_Add: string
  D_Add2: string
  D_IDCard: string
  D_LC: string
  D_DateLcEx: Date | null
  D_DateIn: Date | null
  D_DateEx: Date | null
  D_Type: string
}

const defaultDriverData: DriverData = {
  D_ID: "",
  D_Name: "",
  D_SurName: "",
  D_Tel: "",
  D_DateBirth: null,
  D_Add: "",
  D_Add2: "",
  D_IDCard: "",
  D_LC: "",
  D_DateLcEx: null,
  D_DateIn: null,
  D_DateEx: null,
  D_Type: "",
}

export default function ProfileScreen() {
  const [isViewOnly, setIsViewOnly] = useState(true)
  const [formData, setFormData] = useState<DriverData>(defaultDriverData)
  const [confirmVisible, setConfirmVisible] = useState(false)
  const apiUrl = process.env.API_URL;

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const token = await AsyncStorage.getItem("token")
    if (!token) return router.replace("/")

    try {
      const response = await axios.get(`${apiUrl}/api/driver/read`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const driver = response.data[0] || defaultDriverData;

      setFormData({
        ...driver,
        D_DateBirth: driver.D_DateBirth ? new Date(driver.D_DateBirth) : null,
        D_DateLcEx: driver.D_DateLcEx ? new Date(driver.D_DateLcEx) : null,
        D_DateIn: driver.D_DateIn ? new Date(driver.D_DateIn) : null,
        D_DateEx: driver.D_DateEx ? new Date(driver.D_DateEx) : null,
      })
    } catch (error: any) {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้")
      console.error(error?.response?.data || error)
    }
  }

  const handleChange = (name: keyof DriverData, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      setIsViewOnly(true)
      const token = await AsyncStorage.getItem("token") // ถ้ามีการใช้ Bearer Token
      if (!token) return router.replace("/")

      const response = await axios.put(`${apiUrl}/api/driver/update`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      Alert.alert("บันทึกสำเร็จ", "ข้อมูลได้รับการบันทึกแล้ว")
      console.log("อัปเดตข้อมูลสำเร็จ:", response.data)
    } catch (error) {
      console.error("อัปเดตข้อมูลล้มเหลว:", error)
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้")
    }
  }

  const handleCancel = () => {
    setIsViewOnly(true)
    fetchUsers();
  }

  const handleSaveWithConfirm = () => {
    setConfirmVisible(true)
  }

  const handleConfirm = () => {
    setConfirmVisible(false)
    handleSave()
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 shadow">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800 ml-4">ข้อมูลส่วนตัว</Text>
        </View>


        {/* ปุ่มด้านขวา */}
        {isViewOnly ? (
          <TouchableOpacity onPress={() => setIsViewOnly(false)} className="rounded-lg p-1">
            <Text className="text-base font-medium text-blue-600">แก้ไข</Text>
          </TouchableOpacity>
        ) : (
          <View className="flex-row gap-x-3">
            <TouchableOpacity onPress={handleCancel}  className="rounded-lg p-1">
              <Text className="text-base font-medium text-gray-500">ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveWithConfirm} className="rounded-lg p-1">
              <Text className="text-base font-medium text-blue-600">บันทึก</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView className="flex-1 bg-gray-100 py-5">
        {/* ข้อมูลทั่วไป */}
        <View className="bg-white rounded-lg p-4">
          {(
            [
              { label: "ชื่อ", key: "D_Name", keyboardType: "default" },
              { label: "นามสกุล", key: "D_SurName", keyboardType: "default" },
              { label: "เบอร์โทร", key: "D_Tel", keyboardType: "phone-pad" },
              { label: "ที่อยู่", key: "D_Add", keyboardType: "default" },
              { label: "ที่อยู่ 2", key: "D_Add2", keyboardType: "default" },
              // { label: "เลขบัตรประชาชน", key: "D_IDCard", keyboardType: "number-pad" },
              { label: "เลขใบขับขี่", key: "D_LC", keyboardType: "default" },
            ] as const
          ).map(({ label, key, keyboardType }) => (
            <RowInput key={key} label={label} value={formData[key]} onChange={(v) => handleChange(key, v)} editable={!isViewOnly} type="text" keyboardType={keyboardType} />
          ))}

          {/* วันที่ */}
          {(
            [
              { label: "วันเกิด", key: "D_DateBirth" },
              { label: "วันหมดอายุใบขับขี่", key: "D_DateLcEx" },
              // { label: "วันเริ่มจ้าง", key: "D_DateIn" },
              // { label: "วันหมดอายุ", key: "D_DateEx" },
            ] as const
          ).map(({ label, key }) => (
            <RowInput key={key} label={label} value={formData[key]} onChange={(d) => handleChange(key, d)} editable={!isViewOnly} type="date" />
          ))}

          {/* ประเภทใบขับขี่ */}
          <RowInput label="ประเภทใบขับขี่" value={formData.D_Type || "ไม่ระบุ"} editable={!isViewOnly} type="text" onPress={() => handleChange("D_Type", formData.D_Type === "ประเภท 2" ? "ประเภท 3" : "ประเภท 2")} />
          <ConfirmModal visible={confirmVisible} message="คุณแน่ใจหรือว่าต้องการบันทึกข้อมูล?" onConfirm={handleConfirm} onCancel={() => setConfirmVisible(false)} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
