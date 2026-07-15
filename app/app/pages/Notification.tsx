import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { io } from "socket.io-client";
import NavFooter from "../components/NavFooter";

type Notification = {
  id: number;
  title: string;
  message: string;
  time: string;
};

export default function NotificationScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const isFocused = useIsFocused();
  const [userId, setUserId] = useState<string | null>(null);
  const apiUrl = process.env.API_URL;


  useEffect(() => {
    AsyncStorage.getItem("userId").then((id) => setUserId(id));
    const loadNotifications = async () => {
      const storedNotifications = await AsyncStorage.getItem("notifications");
      const storedCount = await AsyncStorage.getItem("notificationCount");

      if (storedNotifications) setNotifications(JSON.parse(storedNotifications));
      if (storedCount) setCount(Number(storedCount));
    };
    loadNotifications();
  }, []);

  useEffect(() => {
    if (isFocused) {
      const resetCount = async () => {
        await AsyncStorage.setItem("notificationCount", "0");
        setCount(0);
      };
      resetCount();
    }
  }, [isFocused]);

  ////////////////////
  useEffect(() => {
    const connectSocket = async () => {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        console.log("Cannot connect: userId is missing.");
        return;
      }
      const socket = io(apiUrl, {
        transports: ["websocket"],
      });

      socket.on("connect", () => {
        console.log("Socket connected successfully, sending test ping.");
        socket.emit("register", userId);
      });

      console.log("Attempting to register:", userId);

      socket.on("newNotification", (data) => {
        setNotifications(prev => {
          const updated = [data, ...prev];
          AsyncStorage.setItem("notifications", JSON.stringify(updated));
          return updated;
        });

        setCount(prev => {
          const newCount = prev + 1;
          AsyncStorage.setItem("notificationCount", String(newCount));
          return newCount;
        });
      });

      return () => {
        socket.off("newNotification");
        socket.off("notificationCountUpdate");
      };
    };
    connectSocket();
  }, [userId]);

  const removeNotification = (id: number) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      AsyncStorage.setItem("notifications", JSON.stringify(updated));
      return updated;
    });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("../pages/Main");
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-4 border-b border-gray-200 bg-white shadow-sm">
        <TouchableOpacity onPress={handleBack} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="gray" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800">การแจ้งเตือน</Text>
      </View>
      <ScrollView className="p-4">
        {notifications.map(item => (
          <View
            key={item.id}
            className="mb-3 p-4 rounded-xl bg-gray-100 shadow-sm flex-row items-start"
          >
            <Ionicons name="notifications" size={24} color="#3b82f6" className="mr-3" />
            <View className="flex-1">
              <Text className="font-semibold text-gray-800">{item.title}</Text>
              <Text className="text-gray-600 text-sm">{item.message}</Text>
              <Text className="text-gray-400 text-xs mt-1">{item.time}</Text>
            </View>
            <TouchableOpacity onPress={() => removeNotification(item.id)}>
              <Ionicons name="close-circle" size={24} color="red" />
            </TouchableOpacity>
          </View>
        ))}
        {notifications.length === 0 && (
          <Text className="text-gray-400 text-center mt-4">ไม่มีการแจ้งเตือน</Text>
        )}
      </ScrollView>
      <NavFooter />
    </View>
  );
}



