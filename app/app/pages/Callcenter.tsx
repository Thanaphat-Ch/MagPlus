// import React, { useEffect, useRef, useState } from "react";
// import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,} from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import Navfooter from "../components/NavFooter";
// import { jwtDecode } from "jwt-decode";
// import { io } from "socket.io-client";
// import axios from "axios";

// const socket = io("https://app.magnitudetms.com");
// const API_URL = "https://app.magnitudetms.com";

// type JWTPayload = {
//   id: number;
//   name: string;
//   exp: number;
// };

// type Message = {
//   id: number;
//   from_user: number;
//   to_user: number;
//   message: string;
//   sender_name?: string;
//   timestamp?: string | Date;
// };

// export default function Callcenter() {
//   const [userId, setUserId] = useState<number | null>(null);
//   const [chatMessages, setChatMessages] = useState<Message[]>([]);
//   const [chatInput, setChatInput] = useState("");
//   const [isLoading, setIsLoading] = useState(true);
//   const scrollViewRef = useRef<ScrollView>(null);

//   const adminId = 30;

//   useEffect(() => {
//     const loadData = async () => {
//       setIsLoading(true);
//       try {
//         const token = await AsyncStorage.getItem("token");
//         if (!token) {
//           console.error("❌ ไม่พบ Token");
//           return;
//         }

//         const decoded = jwtDecode<JWTPayload>(token);
//         const currentUserId = decoded.id;
//         setUserId(currentUserId);

//         const response = await axios.get(
//           `${API_URL}/api/messages/${currentUserId}/${adminId}`
//         );
//         setChatMessages(response.data);
//       } catch (err) {
//         console.error("❌ เกิดข้อผิดพลาดในการโหลดข้อมูล:", err);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     loadData();
//   }, []);

//   useEffect(() => {
//     if (!userId) return;

//     socket.emit("join", userId);

//     const handleMessage = (msg: Message) => {
//       if (
//         (msg.from_user === userId && msg.to_user === adminId) ||
//         (msg.from_user === adminId && msg.to_user === userId)
//       ) {
//         setChatMessages((prev) => {
//           if (prev.some((m) => m.id === msg.id)) return prev;
//           return [...prev, msg];
//         });
//         scrollViewRef.current?.scrollToEnd({ animated: true });
//       }
//     };

//     socket.on("newMessage", handleMessage);

//     return () => {
//       socket.off("newMessage", handleMessage);
//     };
//   }, [userId]);

//   const sendMessage = () => {
//     if (!chatInput.trim() || !userId) return;

//     const messageData = {
//       from_user: userId,
//       to_user: adminId,
//       message: chatInput,
//     };

//     socket.emit("sendMessage", messageData);
//     setChatInput("");
//   };

//   useEffect(() => {
//     scrollViewRef.current?.scrollToEnd({ animated: true });
//   }, [chatMessages]);

//   if (isLoading) {
//     return (
//       <View className="flex-1 justify-center items-center bg-gray-100">
//         <ActivityIndicator size="large" color="#2563EB" />
//         <Text className="mt-2 text-base text-gray-600">กำลังโหลดข้อมูล...</Text>
//       </View>
//     );
//   }

//   return (
//     <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}>
//       <View className="flex-1 p-4">
//         <Text className="text-2xl font-bold mb-4 text-gray-800">💬 แชทกับแอดมิน</Text>
//         <View className="flex-1 bg-gray-100 rounded-2xl p-3 mb-4 shadow-md">
//           <ScrollView ref={scrollViewRef} contentContainerStyle={{ paddingVertical: 8 }}>
//             {chatMessages.map((msg, index) => (
//               <View
//                 key={`${msg.id}-${index}`}
//                 className={`
//                   mb-2 max-w-[80%] p-3 rounded-xl flex-col
//                   ${
//                     msg.from_user === userId
//                       ? "self-end bg-blue-600"
//                       : "self-start bg-gray-300"
//                   }
//                 `}
//               >
//                 <Text className={msg.from_user === userId ? "text-white" : "text-black"}>
//                   {msg.message}
//                 </Text>
//                 {msg.timestamp && (
//                   <Text
//                     className={`
//                       mt-1 text-xs
//                       ${
//                         msg.from_user === userId
//                           ? "text-gray-200 text-right"
//                           : "text-gray-500 text-left"
//                       }
//                     `}
//                   >
//                     {new Date(msg.timestamp).toLocaleTimeString([], {
//                       hour: "2-digit",
//                       minute: "2-digit",
//                     })}
//                   </Text>
//                 )}
//               </View>
//             ))}
//           </ScrollView>
//         </View>

//         <View className="flex-row items-center p-2 rounded-3xl border border-gray-300 bg-white shadow-sm">
//           <TextInput className="flex-1 text-base h-10" placeholder="พิมพ์ข้อความ..." value={chatInput} onChangeText={setChatInput} multiline/>
//           <TouchableOpacity onPress={sendMessage} className="ml-2 px-3 py-1">
//             <Text className="text-blue-600 font-bold text-lg">ส่ง</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       <Navfooter />
//     </KeyboardAvoidingView>
//   );
// }

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { io } from "socket.io-client";
import Navfooter from "../components/NavFooter";

const API_URL = process.env.API_URL;

const socket = io(API_URL, {
  reconnection: true,
  reconnectionAttempts: 5,
});

type JWTPayload = {
  id: number;
  name: string;
  exp: number;
};

type Message = {
  id: number;
  from_user: number;
  to_user: number | null;
  message: string;
  senderName?: string;
  timestamp?: string | Date;
};

export default function Callcenter() {
  const [userId, setUserId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          return console.error("❌ ไม่พบ Token");
        }
        const decoded = jwtDecode<JWTPayload>(token);
        const currentUserId = decoded.id;
        setUserId(currentUserId);
        const response = await axios.get(`${API_URL}/api/messages/group/general_2`);
        setChatMessages(response.data);
      } catch (err) {
        console.error("❌ เกิดข้อผิดพลาดในการโหลดข้อมูล:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const handleConnect = () => socket.emit("join", userId);
    const handleMessage = (msg: Message) => {
      setChatMessages((prev) => {
        // ป้องกันข้อความซ้ำที่อาจมาจาก server
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };
    if (socket.connected) {
      handleConnect();
    } else {
      socket.on("connect", handleConnect);
    }

    socket.on("newMessage", handleMessage);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("newMessage", handleMessage);
    };
  }, [userId]);

  const sendMessage = () => {
    if (!chatInput.trim() || !userId) return;
    const messageData = {
      from_user: userId,
      message: chatInput,
    };

    socket.emit("sendMessage", messageData);
    setChatInput("");
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [chatMessages]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-2 text-base text-gray-600">กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold mb-4 text-gray-800">
          💬 แชทกับแอดมิน
        </Text>
        <View className="flex-1 bg-gray-100 rounded-2xl p-3 mb-4 shadow-md">
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{ paddingVertical: 8 }}
          >
            {chatMessages.map((msg, index) => {
              const isMe = msg.from_user === userId;
              return (
                <View
                  key={`${msg.id}-${index}`}
                  className={`mb-3 ${isMe ? "self-end" : "self-start"}`}
                >
                  {/* แสดงชื่อผู้ส่ง (ถ้าไม่ใช่เรา) */}
                  {!isMe && (
                    <Text className="text-xs text-gray-500 mb-1 ml-2">
                      {msg.senderName || "Admin"}
                    </Text>
                  )}

                  {/* กล่องข้อความ */}
                  <View
                    className={`
                      max-w-[25vh] p-3 rounded-2xl flex-col
                      ${isMe ? "bg-blue-600" : "bg-gray-300"}
                    `}
                  >
                    <Text className={isMe ? "text-white" : "text-black"}>
                      {msg.message}
                    </Text>
                  </View>
                </View>
              );
            })}
            
          </ScrollView>
         
        </View>
        
        <View className="flex-row items-center p-2 rounded-3xl border border-gray-300 bg-white shadow-sm">
          
          <TextInput
            className="flex-1 text-base h-10"
            style={{
              borderWidth: 0,
              outlineStyle: "none",
              paddingHorizontal: 8,
            }}
            placeholder="พิมพ์ข้อความ..."
            value={chatInput}
            onChangeText={setChatInput}
            multiline
          />
        
          <TouchableOpacity onPress={sendMessage} className="ml-2 px-3 py-1">  
            <Text className="text-blue-600 font-bold text-lg">ส่ง</Text>       
          </TouchableOpacity>
          
        </View>
        
      </View>
       <Navfooter />
    </KeyboardAvoidingView>
  );
}