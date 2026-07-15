import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { io } from "socket.io-client";


type Notification = {
  id: number;
  title: string;
  message: string;
  time: string;
};

export default function notifications() {
  const apiUrl = process.env.API_URL;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    const loadNotifications = async () => {
      const stored = await AsyncStorage.getItem("notifications");
      if (stored) setNotifications(JSON.parse(stored));
    };
    loadNotifications();
  }, []);

  useEffect(() => {
  const socket = io(`${apiUrl}`);

  socket.on("newNotification", async (data: Notification) => {
      setNotifications((prev) => {
        const updated = [data, ...prev];
        AsyncStorage.setItem("notifications", JSON.stringify(updated)); 
        return updated;
      });
    });

  // cleanup function
  return () => {
    socket.disconnect();
  };
}, []);

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200 bg-white shadow-sm">
        <Text className="text-lg font-bold text-gray-800">การแจ้งเตือน</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="gray" />
        </TouchableOpacity>
      </View>
    <ScrollView className="p-4">
      {notifications.map((item) => (
        <TouchableOpacity
            key={item.id}
            className="mb-3 p-4 rounded-xl bg-gray-100 shadow-sm"
            onPress={() => console.log("กดแจ้งเตือน", item.title)}
          >
          <View className="flex-row items-start space-x-3">
            <Ionicons name="notifications" size={24} color="#3b82f6" />
            <View className="flex-1">
              <Text className="font-semibold text-gray-800">{item.title}</Text>
              <Text className="text-gray-600 text-sm">{item.message}</Text>
              <Text className="text-gray-400 text-xs mt-1">{item.time}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
       {notifications.length === 0 && (
          <Text className="text-gray-400 text-center mt-4">
            ไม่มีการแจ้งเตือน
          </Text>
        )}
    </ScrollView>
    </View>
  );
}
