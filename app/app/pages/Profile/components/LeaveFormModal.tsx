import CrossPlatformDatePicker from "@/app/components/Datepicker";
import { ImagePreviewModal } from "@/app/components/ImagePreviewModal";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { FlatList, Image, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

const today = new Date();

interface LeaveFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function LeaveFormModal({ visible, onClose, onSubmit }: LeaveFormModalProps) {
  const [leaveTypeOpen, setLeaveTypeOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<string | null>(null);
  const [leaveTypeItems, setLeaveTypeItems] = useState([
    { label: "ลาป่วย", value: "sick" },
    { label: "ลากิจ", value: "personal" },
    { label: "ลาพักร้อน", value: "vacation" },
  ]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState("");
  const [leaveImages, setLeaveImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uris = result.assets.map((asset) => asset.uri);
      setLeaveImages((prev) => [...prev, ...uris].slice(0, 5));
    }
  };

  const handleRemoveImage = (uri: string) => {
    setLeaveImages((prev) => prev.filter((i) => i !== uri));
  };

  const handleSubmit = () => {
    onSubmit({
      leaveType,
      startDate,
      endDate,
      reason,
      leaveImages,
    });
    setLeaveType(null);
    setStartDate(null);
    setEndDate(null);
    setReason("");
    setLeaveImages([]);
    onClose();
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-center bg-black/60 p-4">
        <View className="bg-white rounded-2xl shadow-lg p-5">
          <Text className="text-xl font-bold text-gray-800 mb-2 text-center">
            📄 ฟอร์มขอลางาน
          </Text>
          <View className="h-px bg-gray-200 mb-6" />

          {/* Dropdown */}
          <Text className="text-sm font-medium mb-2 text-gray-700">ประเภทการลา</Text>
          <View style={{ zIndex: 1000, marginBottom: 16 }}>
            <DropDownPicker
              open={leaveTypeOpen}
              value={leaveType}
              items={leaveTypeItems}
              setOpen={setLeaveTypeOpen}
              setValue={setLeaveType}
              setItems={setLeaveTypeItems}
              placeholder="เลือกประเภทการลา"
              listMode="MODAL"
              style={{ borderColor: "#e5e7eb", borderRadius: 12, minHeight: 52, backgroundColor: "#f9fafb" }}
              dropDownContainerStyle={{ borderColor: "#e5e7eb", borderRadius: 12 }}
            />
          </View>

          {/* Date Picker */}
          <Text className="text-sm font-medium mb-2 text-gray-700">ช่วงวันที่ลา</Text>
          <View className="flex-row justify-between mb-4 gap-4">
            <CrossPlatformDatePicker
              label="วันที่เริ่มลางาน"
              value={startDate}
              onChange={setStartDate}
              minimumDate={today}
            />
            <CrossPlatformDatePicker
              label="วันที่สิ้นสุด"
              value={endDate}
              onChange={setEndDate}
              minimumDate={startDate || today}
            />
          </View>

          {/* Reason */}
          <Text className="text-sm font-medium mb-2 text-gray-700">เหตุผลการลา</Text>
          <TextInput
            className="border border-gray-200 rounded-xl mb-4 p-3 text-gray-800 bg-gray-50 h-28"
            style={{ textAlignVertical: "top" }}
            multiline
            placeholder="กรอกเหตุผลโดยละเอียด..."
            placeholderTextColor="#9ca3af"
            value={reason}
            onChangeText={setReason}
          />

          {/* Images */}
          <Text className="text-sm font-medium mb-2 text-gray-700">
            แนบเอกสารประกอบ (สูงสุด 5 รูป)
          </Text>
          <TouchableOpacity
            onPress={handlePickImage}
            className="flex-row items-center justify-center border border-dashed border-gray-300 rounded-xl p-4 mb-4 bg-gray-50 active:bg-gray-100"
          >
            <Ionicons name="add-circle-outline" size={24} color="#6b7280" />
            <Text className="text-gray-700 ml-2 font-medium">เพิ่มรูปภาพ</Text>
          </TouchableOpacity>

          {leaveImages.length > 0 && (
            <FlatList
              horizontal
              data={leaveImages}
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

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-indigo-600 rounded-full py-4 mt-6 shadow-md shadow-indigo-400/50 active:bg-indigo-700"
          >
            <Text className="text-center text-white font-bold text-lg">ส่งคำขอลา</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} className="absolute top-3 right-3">
            <Ionicons name="close" size={28} color="#6b7280" />
          </TouchableOpacity>

          <ImagePreviewModal imageUri={previewImage} onClose={() => setPreviewImage(null)} />
        </View>
      </View>
    </Modal>
  );
}
