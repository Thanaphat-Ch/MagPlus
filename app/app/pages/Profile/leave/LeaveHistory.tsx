import { ImagePreviewModal } from "@/app/components/ImagePreviewModal";
import { formatThaiDate } from "@/app/utils/formatters";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";

import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

interface LeaveRequest {
  id: number;
  date_requested: string;
  start_date: string;
  end_date: string;
  reason: string;
  leave_type: string;
  status: "pending" | "approved" | "rejected";
  images: string[];
  approved: string;
}
interface LeaveCounts {
  pending: number;
  approved: number;
  rejected: number;
}


export default function LeaveHistory({ navigation }: any) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [counts, setCounts] = useState<LeaveCounts>({ pending: 0, approved: 0, rejected: 0,});
  const [selectedItem, setSelectedItem] = useState<LeaveRequest | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        // Update URL to a placeholder since the original one is a local IP 
        const res = await axios.get("https://app.magnitudetms.com/api/leave-requests", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRequests(res.data.requests);
        setCounts(res.data.counts);
      } catch (error) {
        console.error("Error fetching leave requests:", error);
      }
    };
    fetchData();
  }, []);

  const groupByMonth = (data: LeaveRequest[]) => {
    const grouped: Record<string, LeaveRequest[]> = {};
    const sorted = [...data].sort(
      (a, b) =>
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );
    sorted.forEach((item) => {
      // Format month and year in Thai locale
      const month = new Date(item.start_date).toLocaleString("th-TH", {
        month: "long",
        year: "numeric",
      });
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(item);
    });
    return grouped;
  };

  const pending = requests.filter((r) => r.status === "pending");
  const approved = requests.filter((r) => r.status === "approved" || r.status === "rejected");
  // Grouping approved and rejected requests for "ประวัติการลา"
  const groupedHistory = groupByMonth(approved);

  const openModal = (item: LeaveRequest) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setModalVisible(false);
  };

  const statusColor = {
    pending: "border-yellow-500 bg-white shadow-md", // Use bg-white and shadow-md for cards
    approved: "border-green-500 bg-white shadow-md",
    rejected: "border-red-500 bg-white shadow-md",
  };

  const statusText = {
    pending: "รออนุมัติ",
    approved: "อนุมัติแล้ว",
    rejected: "ถูกปฏิเสธ",
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* ---------- Header ---------- */}
      <View
        className="flex-row items-center p-4 shadow-lg"
        style={{shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,  }} 
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back-outline" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-800 ml-4">ประวัติการลา</Text>
      </View>

      <ScrollView className="p-5 bg-gray-100 ">
        <View className="flex">
          <View 
            className="flex-row justify-between bg-white rounded-xl shadow-lg p-2 mb-4"
            style={{shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,  }} 
          >
            <Text className="text-lg font-bold text-gray-800 mt-2">ลางานแล้ว : </Text>
            <Text className="text-lg font-bold text-gray-800 mt-2"> {counts.approved} ครั้ง</Text>
          </View>
        </View>

        {/* ---------- รออนุมัติ ---------- */}
        <Text className="text-lg font-bold text-gray-800 mt-2">รออนุมัติ</Text>
        <View className="h-[1px] bg-gray-300 my-2" />
        {pending.length === 0 ? (
          <Text className="text-gray-500">ไม่มีรายการรออนุมัติ</Text>
        ) : (
          pending.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => openModal(item)} activeOpacity={0.8}>
              <View
                className={`rounded-xl p-4 my-2 border-l-4 ${statusColor[item.status]}`}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3, // สำหรับ Android
                }}
              >
                <View className="flex-row justify-between items-center">
                  <Text className="font-semibold text-gray-700 text-base">{item.leave_type}</Text>
                  <Text className={`font-semibold ${item.status === "pending" ? "text-yellow-600" : item.status === "approved" ? "text-green-600" : "text-red-600"}`}>{statusText[item.status]}</Text>
                </View>
                <Text className="text-gray-500 text-sm mt-1">
                  {formatThaiDate(item.start_date)} - {formatThaiDate(item.end_date)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* ---------- ประวัติการลา (อนุมัติแล้ว/ถูกปฏิเสธ) ---------- */}
        <Text className="text-lg font-bold text-gray-800 mt-6">ประวัติ</Text>
        <View className="h-[1px] bg-gray-300 my-2" />

        {Object.keys(groupedHistory).length === 0 ? (
          <Text className="text-gray-500">ยังไม่มีประวัติการลา</Text>
        ) : (
          Object.keys(groupedHistory).map((month) => (
            <View key={month} className="mb-4">
              <Text className="text-base font-semibold text-gray-700 mt-2">{month}</Text>
              {groupedHistory[month].map((item) => (
                <TouchableOpacity key={item.id} onPress={() => openModal(item)} activeOpacity={2}>
                  <View
                    className={`rounded-xl p-4 my-2 border-l-4 ${statusColor[item.status]}`}
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 3, // สำหรับ Android
                    }}
                  >
                    <View className="flex-row justify-between items-center">
                      <Text className="font-semibold text-gray-700 text-base">{item.leave_type}</Text>
                      <Text className={`font-semibold ${item.status === "pending" ? "text-yellow-600" : item.status === "approved" ? "text-green-600" : "text-red-600"}`}>{statusText[item.status]}</Text>
                    </View>
                    <Text className="text-gray-500 text-sm mt-1">
                      {formatThaiDate(item.start_date)} - {formatThaiDate(item.end_date)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
        <View className="pb-4" />
      </ScrollView>

      <ImagePreviewModal imageUri={previewImage} onClose={() => setPreviewImage(null)} />
      {/* ---------- Modal (Updated styling for white background and shadow) ---------- */}
      <Modal transparent animationType="fade" visible={modalVisible} onRequestClose={closeModal}>
        <View className="flex-1 bg-black/40 justify-center items-center p-6">
          <Pressable
            className="absolute inset-0"
            onPress={closeModal} // ปิดเฉพาะเมื่อกดพื้นหลัง
          />
          <View className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm max-h-[80%]" onStartShouldSetResponder={() => true}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedItem && (
                <>
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-xl font-bold text-gray-800">รายละเอียดการลา</Text>
                    <View className={selectedItem.status === "pending" ? "bg-yellow-100 px-3 py-1 rounded-full" : selectedItem.status === "approved" ? "bg-green-100 px-3 py-1 rounded-full" : "bg-red-100 px-3 py-1 rounded-full"}>
                      <Text className={selectedItem.status === "pending" ? "text-yellow-600 font-semibold" : selectedItem.status === "approved" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{statusText[selectedItem.status]}</Text>
                    </View>
                  </View>

                  <View className="h-[1px] bg-gray-300 mb-4" />

                  <View className="mb-4">
                    <View className="flex-row mb-2">
                      <View className="flex-1 pr-2 my-2">
                        <Text className="text-gray-700 text-center font-semibold mb-1">วันที่เริ่มลา</Text>
                        <View className="bg-gray-100 p-2 rounded-md">
                          <Text className="text-gray-800 text-center \">{formatThaiDate(selectedItem.start_date)}</Text>
                        </View>
                      </View>
                      <View className="flex-1 pl-2">
                        <Text className="text-gray-700 text-center font-semibold mb-1">วันที่สิ้นสุด</Text>
                        <View className="bg-gray-100 p-2 rounded-md">
                          <Text className="text-gray-800 text-center">{formatThaiDate(selectedItem.end_date)}</Text>
                        </View>
                      </View>
                    </View>

                    {/* ---------- ประเภทการลา ---------- */}
                    <View className="mb-2 my-2">
                      <Text className="text-gray-700 font-semibold mb-1">ประเภทการลา</Text>
                      <View className="bg-gray-100 p-2 rounded-md">
                        <Text className="text-gray-800">{selectedItem.leave_type}</Text>
                      </View>
                    </View>

                    {/* ---------- เหตุผล ---------- */}
                    <View className="mb-2 my-2">
                      <Text className="text-gray-700 font-semibold mb-1">เหตุผล</Text>
                      <View className="bg-gray-100 p-2 rounded-md max-h-32 overflow-auto">
                        <Text className="text-gray-800">{selectedItem.reason}</Text>
                      </View>
                    </View>
                  </View>

                  {selectedItem.images && Array.isArray(selectedItem.images) && selectedItem.images.length > 0 && (
                    <FlatList
                      horizontal
                      data={selectedItem.images}
                      keyExtractor={(item, index) => item + index}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingBottom: 10 }}
                      renderItem={({ item }) => (
                        <View className="mr-3 relative">
                          <TouchableOpacity
                            onPress={() => {
                              setPreviewImage(item)
                              console.log(item)
                            }}
                          >
                            <Image source={{ uri: item }} className="w-24 h-24 rounded-lg border border-gray-200" resizeMode="cover" />
                          </TouchableOpacity>
                        </View>
                      )}
                    />
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}