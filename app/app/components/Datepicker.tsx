import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";

interface Props {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

export default function CrossPlatformDatePicker({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);

  // สำหรับ web ใช้ input แบบเดิม
  if (Platform.OS === "web") {
    const handleWebChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedDate = e.target.value ? new Date(e.target.value) : null;
      if (selectedDate) onChange(selectedDate);
    };

    return (
      <View className="flex-1">
        <Text className="text-sm mb-1">{label}</Text>
        <input
          type="date"
          value={value ? value.toISOString().split("T")[0] : ""}
          min={minimumDate ? minimumDate.toISOString().split("T")[0] : undefined}
          max={maximumDate ? maximumDate.toISOString().split("T")[0] : undefined}
          onChange={handleWebChange}
          className="border border-gray-300 rounded-xl p-2 w-full"
        />
      </View>
    );
  }

  // สำหรับ Android / iOS
  return (
    <View className="flex-1">
      <Text className="text-sm mb-1">{label}</Text>

      {/* ปุ่มแสดงวันที่ */}
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        className="border border-gray-300 rounded-xl p-2"
      >
        <Text>{value ? value.toLocaleDateString() : "เลือกวันที่"}</Text>
      </TouchableOpacity>

      {/* แสดง picker เฉพาะตอนเปิด */}
      {showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) onChange(selectedDate);
          }}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </View>
  );
}
