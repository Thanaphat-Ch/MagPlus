import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function NavFooter() {
  const router = useRouter();
  const pathname = usePathname();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const loadCount = async () => {
      const stored = await AsyncStorage.getItem("notificationCount");
      setNotificationCount(stored ? Number(stored) : 0);
    };

    // โหลดตอน mount และอัพเดตทุก 1 วินาที (หรือใช้ event system/Context จะดีกว่า)
    const interval = setInterval(loadCount, 1000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { name: "หน้าหลัก", icon: <Ionicons name="home" size={24} />, href: "/pages/Main" },
    { name: "งาน", icon: <Ionicons name="cube" size={24} />, href: "/pages/historyPage" },
    // { name: "แจ้งเตือน", icon: <Ionicons name="notifications-outline" size={24} />, href: "/pages/Notification" },
    { name: "ติดต่อ", icon: <MaterialIcons name="phone" size={24} />, href: "/pages/Callcenter" },
    { name: "โปรไฟล์", icon: <Ionicons name="person-circle" size={24} />, href: "/pages/Profile/profile" },
  ];

  return (
    <View className="flex-row justify-around bg-white py-3 border-t border-gray-200 shadow-lg rounded-t-2xl pb-6">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <TouchableOpacity
            key={tab.href}
            onPress={() => pathname !== tab.href && router.replace(tab.href)}
            className="items-center flex-1"
            activeOpacity={0.7}
          >
            <View className="relative">
              {React.cloneElement(tab.icon, { color: isActive ? "#2563eb" : "#6b7280" })}

              {/* จุดแดงสำหรับแจ้งเตือน */}
              {tab.name === "แจ้งเตือน" && notificationCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -10,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "red",
                  }}
                />
              )}
            </View>

            <Text className={`text-xs font-semibold ${isActive ? "text-blue-600" : "text-gray-500"}`}>
              {tab.name}
            </Text>

            {isActive && <View className="h-1 w-6 bg-blue-600 rounded-full mt-1" />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
