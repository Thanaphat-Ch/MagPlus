import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Navfooter from "../components/NavFooter";

export default function Myjob() {
  const [selectedTab, setSelectedTab] = useState<"up" | "down">("up");
  const router = useRouter();
   const [historyJob, setHistoryJob] = useState([
          { id: '1', jobName: 'ส่งของไป Big C', price: '150', status: 'กำลังทำ', dateTime: 'วันนี้ 12:30', review: '*****'},
          { id: '2', jobName: 'ส่งเอกสารไป ธนาคาร', price: '250', status: 'รับงานแล้ว', dateTime: 'วันนี้ 14:40', review: '****'},
          
      ]);

  const jobs = [
    {
      id: 1,
      title: "Big C วงสว่าง ชั้น 3",
      status: "รอดำเนินการ",
      time: "2 ชม.",
      icon: "cube-outline",
      color: "#ef4444",
      type: "up",
    },
    {
      id: 2,
      title: "Tesco Lotus แจ้งวัฒนะ",
      status: "กำลังเดินทาง",
      time: "30 นาที",
      icon: "document-text-outline",
      color: "#facc15",
      type: "down",
    },
    {
      id: 3,
      title: "Central รัตนาธิเบศร์",
      status: "รอรับ",
      time: "1 ชม.",
      icon: "fast-food-outline",
      color: "#fb923c",
      type: "up",
    },
  ];

  const filteredJobs = jobs.filter((job) => job.type === selectedTab);

  return (
    
    <View className="flex-1 bg-white">
      <View className="flex-row bg-gray-200 p-1 mx-4 mt-4 rounded-full">
        <TouchableOpacity
          onPress={() => setSelectedTab("up")}
          className={`flex-1 items-center py-2 rounded-full ${
            selectedTab === "up" ? "bg-blue-600" : ""
          }`}
        >
          <Text className={`${selectedTab === "up" ? "text-white" : "text-gray-600"} font-semibold`}>
            ขึ้นสินค้า
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedTab("down")}
          className={`flex-1 items-center py-2 rounded-full ${
            selectedTab === "down" ? "bg-blue-600" : ""
          }`}
        >
          <Text className={`${selectedTab === "down" ? "text-white" : "text-gray-600"} font-semibold`}>
            ลงสินค้า
          </Text>
        </TouchableOpacity>
      </View>


      {/* Job List */}
      <ScrollView showsVerticalScrollIndicator={false} className="p-4 flex-1">
        {filteredJobs.map((job) => (
          <Link
            key={job.id}
            href={{ pathname: "../pages/jobdetailscreen", query: { jobId: job.id } }}
            asChild
          >
            <TouchableOpacity className="bg-white p-4 rounded-xl mb-4 shadow">
              <View className="flex-row items-center mb-2">
                <Ionicons
                  name={job.icon as any}
                  size={20}
                  color={job.color}
                />
                <Text className="ml-2 font-semibold text-gray-800 text-base">
                  {job.title}
                </Text>
              </View>
              <Text className="text-gray-600 text-sm">
                {job.status} • {job.time}
              </Text>
            </TouchableOpacity>
          </Link>
        ))}
      </ScrollView>
      <Navfooter/>
    </View>
  );
}