import NavFooter from "@/app/components/NavFooter";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { FC, useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import DropDownPicker, { ItemType } from "react-native-dropdown-picker";

interface CrossPlatformDateTimePickerProps {
  label: string;
  value: Date | null;
  onChange: (event: any, selectedDate?: Date) => void;
}

const CrossPlatformDateTimePicker: FC<CrossPlatformDateTimePickerProps> = ({
  label,
  value,
  onChange,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const onNativeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(Platform.OS === "ios");
    if (selectedDate) {
      onChange(event, selectedDate);
    } else {
      setShowPicker(false);
    }
  };

  const onWebChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.value) return;
    const selectedDate = new Date(event.target.value);
    onChange(event, selectedDate);
  };

  const formatDisplayDate = (date: Date | null): string => {
    if (!date) return label;
    return (
      date.toLocaleString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " น."
    );
  };

  const formatForWebInput = (date: Date | null): string => {
    if (!date) return "";
    const tempDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    );
    return tempDate.toISOString().slice(0, 16);
  };

  if (Platform.OS === "web") {
    return (
      <View className="flex-1">
        <input
          type="datetime-local"
          value={formatForWebInput(value)}
          onChange={onWebChange}
          className="w-full h-[50px] border border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800"
        />
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        className="flex-1 flex-row items-center justify-between border border-gray-200 rounded-xl p-3 h-[50px] bg-gray-50"
      >
        <Text className="text-gray-800">{formatDisplayDate(value)}</Text>
        <Ionicons name="calendar-outline" size={20} color="#6b7280" />
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode="datetime"
          display="default"
          onChange={onNativeChange}
        />
      )}
    </>
  );
};

export default function ServicePage() {
  const [repairTypeOpen, setRepairTypeOpen] = useState(false);
  const [repairType, setRepairType] = useState<string>("air_conditioner");
  const [repairTypeItems, setRepairTypeItems] = useState<ItemType<string>[]>([
    { label: "ซ่อมแอร์", value: "air_conditioner" },
    { label: "ซ่อมระบบไฟฟ้า", value: "electrical" },
    { label: "ซ่อมระบบประปา", value: "plumbing" },
    { label: "ซ่อมเฟอร์นิเจอร์", value: "furniture" },
    { label: "อื่นๆ", value: "other" },
  ]);
  const [serviceDate, setServiceDate] = useState<Date | null>(new Date());
  const [reason, setReason] = useState("");
  const [serviceImages, setServiceImages] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadUserId = async () => {
      const id = await AsyncStorage.getItem("userId");
      if (id) setUserId(id);
    };
    loadUserId();
  }, []);

  const handleServiceSubmit = async () => {
    if (!serviceDate || !reason)
      return Alert.alert(
        "ข้อมูลไม่ครบ",
        "กรุณาระบุวันที่, เวลา และเหตุผลการแจ้งซ่อม"
      );
    if (!userId) return Alert.alert("ผิดพลาด", "ไม่พบข้อมูลผู้ใช้");

    // --- 🔽 [เพิ่ม/แก้ไข Logic ทั้งหมดด้านล่างนี้] ---


    const apiUrl = process.env.API_URL;

    // 2. ดึง Token สำหรับยืนยันตัวตน

    const token = await AsyncStorage.getItem("token");
    if (!token)
      return Alert.alert("ผิดพลาด", "ไม่พบ Token, กรุณาเข้าสู่ระบบใหม่");

    setIsLoading(true);

    try {
      // 3. สร้าง FormData
      const formData = new FormData();

      // 4. เพิ่มข้อมูล Text
      formData.append("repairType", repairType);
      formData.append("reason", reason);
      formData.append("serviceDate", serviceDate.toISOString()); 

      // 5. เพิ่มรูปภาพ (จัดการแยก Platform)
      for (const uri of serviceImages) {
        if (Platform.OS === "web") {
          // สำหรับ Web (URI เป็น blob:)
          const response = await fetch(uri);
          const blob = await response.blob();
          formData.append("images", blob, uri.split("/").pop() || "image.jpg");
        } else {
          // สำหรับ Native (URI เป็น file://)
          const filename = uri.split("/").pop();
          const match = /\.(\w+)$/.exec(filename || "");
          const type = match ? `image/${match[1]}` : `image/jpeg`;

          formData.append("images", {
            uri: uri,
            name: filename,
            type: type,
          } as any);
        }
      }

      // 6. ส่ง Request ไปยัง API
      const response = await fetch(`${apiUrl}/api/service2`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const text = await response.text();
      console.log("📥 Raw response:", text);

      let result;
      try {
        result = JSON.parse(text);
      } catch {
        result = { error: "ไม่สามารถแปลง JSON ได้", raw: text };
      }

      setIsLoading(false);


      // 7. จัดการผลลัพธ์
      if (response.ok) {
        Alert.alert("ส่งสำเร็จ", "ส่งเรื่องแจ้งซ่อมเรียบร้อยแล้ว", [
          {
            text: "ตกลง",
            onPress: () => {
              // ล้างฟอร์ม
              setReason("");
              setServiceImages([]);
              setServiceDate(new Date());
              setRepairType("air_conditioner");
            },
          },
        ]);
      } else {
        Alert.alert("เกิดข้อผิดพลาด", result.error || "ไม่สามารถส่งข้อมูลได้");
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Submit service error:", error);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
    
  };

  const handlePickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted)
      return Alert.alert(
        "การเข้าถึงถูกปฏิเสธ",
        "กรุณาอนุญาตให้เข้าถึงคลังรูปภาพ"
      );

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      allowsMultipleSelection: true,
      selectionLimit: 5 - serviceImages.length,
    });

    if (!result.canceled && result.assets) {
      const uris = result.assets.map((asset) => asset.uri);
      setServiceImages((prev) => [...prev, ...uris].slice(0, 5));
    }
  };

  const handleRemoveImage = (uri: string) => {
    setServiceImages((prev) => prev.filter((img) => img !== uri));
  };

  const onServiceDateChange = (_: any, selectedDate?: Date) => {
    if (selectedDate) {
      setServiceDate(selectedDate);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between p-4 shadow-xl">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800 ml-4">
            แจ้งซ่อม
          </Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >

        <View className="bg-white rounded-2xl shadow-sm p-5 mb-10 border border-gray-100">
          <Text className="text-xl font-bold text-gray-800 mb-2 text-center">
            📝 ฟอร์มแจ้งซ่อม
          </Text>
          <View className="h-px bg-gray-200 mb-6" />

          <Text className="text-sm font-medium mb-2 text-gray-700">
            ประเภทงานซ่อม
          </Text>
          <View style={{ zIndex: 1000, marginBottom: 16 }}>
            <DropDownPicker
              open={repairTypeOpen}
              value={repairType}
              items={repairTypeItems}
              setOpen={setRepairTypeOpen}
              setValue={setRepairType}
              setItems={setRepairTypeItems}
              style={{
                borderColor: "#e5e7eb",
                borderRadius: 12,
                minHeight: 52,
                backgroundColor: "#f9fafb",
              }}
              dropDownContainerStyle={{
                borderColor: "#e5e7eb",
                borderRadius: 12,
              }}
              placeholder="เลือกประเภทงานซ่อม"
            />
          </View>

          <Text className="text-sm font-medium mb-2 text-gray-700">
            วันที่และเวลาที่สะดวก
          </Text>
          <View className="flex-row justify-between mb-4">
            <CrossPlatformDateTimePicker
              label="เลือกวันและเวลา"
              value={serviceDate}
              onChange={onServiceDateChange}
            />
          </View>
          <Text className="text-sm font-medium mb-2 text-gray-700">
            สาเหตุ / อาการเบื้องต้น
          </Text>
          <TextInput
            className="border border-gray-200 rounded-xl mb-4 p-3 text-gray-800 bg-gray-50 h-28"
            style={{ textAlignVertical: "top" }}
            multiline
            placeholder="กรอกอาการเสียโดยละเอียด..."
            placeholderTextColor="#9ca3af"
            value={reason}
            onChangeText={setReason}
          />

          <Text className="text-sm font-medium mb-2 text-gray-700">
            แนบรูปภาพประกอบ (สูงสุด 5 รูป)
          </Text>
          <TouchableOpacity
            onPress={handlePickImage}
            className="flex-row items-center justify-center border border-dashed border-gray-300 rounded-xl p-4 mb-4 bg-gray-50 active:bg-gray-100"
          >
            <Ionicons name="add-circle-outline" size={24} color="#6b7280" />
            <Text className="text-gray-700 ml-2 font-medium">เพิ่มรูปภาพ</Text>
          </TouchableOpacity>

          {serviceImages.length > 0 && (
            <FlatList
              horizontal
              data={serviceImages}
              keyExtractor={(item) => item}
              contentContainerStyle={{ paddingBottom: 10 }}
              renderItem={({ item }) => (
                <View className="mr-3 relative">
                  <TouchableOpacity onPress={() => setPreviewImage(item)}>
                    <Image
                      source={{ uri: item }}
                      className="w-24 h-24 rounded-lg border border-gray-200"
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveImage(item)}
                    className="absolute -top-2 -right-2 bg-red-600 w-6 h-6 rounded-full items-center justify-center shadow-sm"
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}

          <TouchableOpacity
            onPress={handleServiceSubmit}
            disabled={isLoading}
            className={`rounded-full py-4 mt-6 shadow-md shadow-indigo-400/50 ${
              isLoading ? "bg-indigo-400" : "bg-indigo-600 active:bg-indigo-700"}`}
          >
            <Text className="text-center text-white font-bold text-lg">
              {isLoading ? "กำลังส่ง..." : "ส่งเรื่องแจ้งซ่อม"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {previewImage && (
        <Modal visible={!!previewImage} transparent animationType="fade">
          <View className="flex-1 bg-black/90 justify-center items-center">
            <TouchableOpacity
              className="absolute top-12 right-6 z-10"
              onPress={() => setPreviewImage(null)}
            >
              <Ionicons name="close-circle" size={40} color="white" />
            </TouchableOpacity>
            <Image
              source={{ uri: previewImage }}
              className="w-11/12 h-[80%] rounded-lg"
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
      <NavFooter />
    </View>
  );
}