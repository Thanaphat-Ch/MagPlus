// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import React, { useState, useEffect } from "react";
// import { View, Text, TouchableOpacity, ScrollView, Modal, SafeAreaView, StatusBar, TextInput, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Pressable,} from "react-native";
// import { io } from "socket.io-client";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import NavFooter from "../components/NavFooter";
// import * as ImagePicker from "expo-image-picker";

// const SERVER =
//   Platform.OS === "android"
//     ? "https://app.magnitudetms.com" 
//     : "https://app.magnitudetms.com";

// const socket = io(SERVER, { transports: ["websocket"] });

// const JobCard = ({ job, onPress }: { job: any; onPress: () => void }) => (
//   <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
//     <View className="bg-white rounded-2xl shadow-md overflow-hidden mb-4 border border-slate-200">
//       <View className="p-4">
//         <View className="flex-row justify-between items-start">
//           <Text className="text-lg font-bold text-slate-800 w-4/5">
//             {job.CarType || "งานใหม่"}
//           </Text>
//           <View className="bg-indigo-100 px-2 py-1 rounded-full">
//             <Text className="text-indigo-600 text-xs font-bold">ใหม่</Text>
//           </View>
//         </View>
//         <View className="flex-row items-center mt-3">
//           <Ionicons name="map-outline" size={16} color="#64748b" />
//           <Text className="text-slate-600 ml-2">
//             {job.ProName || job.PickPoint}
//           </Text>
//         </View>
//         <View className="mt-4 pt-4 border-t border-slate-200">
//           <View className="flex-row items-center">
//             <View className="w-5 h-5 bg-green-500 rounded-full items-center justify-center">
//               <Ionicons name="arrow-up" size={12} color="white" />
//             </View>
//             <Text className="ml-3 text-slate-700">{job.PickPoint}</Text>
//           </View>
//           <View className="h-5 w-0.5 bg-slate-300 ml-[9px] my-1" />
//           <View className="flex-row items-center">
//             <View className="w-5 h-5 bg-red-500 rounded-full items-center justify-center">
//               <Ionicons name="arrow-down" size={12} color="white" />
//             </View>
//             <Text className="ml-3 text-slate-700">{job.DropPoint}</Text>
//           </View>
//         </View>
//       </View>
//     </View>
//   </TouchableOpacity>
// );

// const JobDetailModal = ({
//   job,
//   visible,
//   onClose,
//   onAccept,
//   onReject,
// }: {
//   job: any;
//   visible: boolean;
//   onClose: () => void;
//   onAccept: () => void;
//   onReject: () => void;
// }) => {
//   if (!job) return null;
//   return (
//     <Modal transparent visible={visible} onRequestClose={onClose}>
//       <View
//         style={{
//           flex: 1,
//           justifyContent: "flex-end",
//           backgroundColor: "rgba(0,0,0,0.6)",
//         }}
//       >
//         <View className="bg-slate-50 rounded-t-3xl p-6 shadow-2xl">
//           <TouchableOpacity
//             onPress={onClose}
//             className="absolute top-4 right-4 bg-slate-200 rounded-full p-1"
//           >
//             <Ionicons name="close" size={24} color="#475569" />
//           </TouchableOpacity>
//           <Text className="text-2xl font-extrabold text-indigo-900 mb-2">
//             {job.CarType}
//           </Text>
//           <Text className="text-slate-600 mb-6">{job.ProName}</Text>
//           <View className="flex-row justify-around bg-white p-4 rounded-2xl mb-6 border border-slate-200">
//             <View className="items-center">
//               <Text className="text-slate-500 text-sm">น้ำหนัก</Text>
//               <Text className="text-indigo-600 font-bold text-lg">
//                 {job.ProKg || 0} kg
//               </Text>
//             </View>
//             <View className="items-center">
//               <Text className="text-slate-500 text-sm">สินค้า</Text>
//               <Text className="text-indigo-600 font-bold text-lg">
//                 {job.ProName || "N/A"}
//               </Text>
//             </View>
//           </View>
//           <View>
//             <Text className="font-bold text-slate-700 mb-3">
//               รายละเอียดการเดินทาง
//             </Text>
//             <View className="flex-row items-start mb-4">
//               <Ionicons
//                 name="navigate-circle-outline"
//                 size={24}
//                 color="#16a34a"
//               />
//               <View className="ml-4 flex-1">
//                 <Text className="text-slate-500 text-sm">จุดรับของ</Text>
//                 <Text className="text-slate-900 font-semibold text-base">
//                   {job.PickPoint}
//                 </Text>
//               </View>
//             </View>
//             <View className="flex-row items-start">
//               <Ionicons name="flag-outline" size={24} color="#ef4444" />
//               <View className="ml-4">
//                 <Text className="text-slate-500 text-sm">จุดส่งของ</Text>
//                 <Text className="text-slate-900 font-semibold text-base">
//                   {job.DropPoint}
//                 </Text>
//               </View>
//             </View>
//           </View>
//           <View className="flex-row gap-4 mt-8">
//             <TouchableOpacity
//               onPress={onReject}
//               className="flex-1 bg-slate-200 py-4 rounded-full items-center justify-center"
//             >
//               <Text className="text-slate-700 font-bold text-base">ปฏิเสธ</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               onPress={onAccept}
//               className="flex-1 bg-indigo-600 py-4 rounded-full items-center justify-center shadow-lg shadow-indigo-400/50"
//             >
//               <Text className="text-white font-bold text-base">รับงานนี้</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// const REJECTION_REASONS = [
//   "ไม่สะดวกเดินทาง",
//   "งานซ้อน",
//   "ข้อมูลงานไม่ชัดเจน",
//   "อื่น ๆ",
// ];

// const RejectJobModal = ({
//   visible,
//   onClose,
//   onSubmit,
//   jobToReject,
//   state,
//   setStateFns,
// }) => {
//   const { selectedReason, otherReason, rejectImage, isLoading, error } = state;

//   const { setSelectedReason, setOtherReason, setRejectImage, pickImage, setError } =
//     setStateFns;

//   const handleReasonSelect = (reason: string) => {
//     setSelectedReason(reason);
//     if (reason !== "อื่น ๆ") setOtherReason("");
//     setError("");
//   };

//   return (
//     <Modal transparent visible={visible} onRequestClose={onClose}>
//       <KeyboardAvoidingView
//         style={{ flex: 1 }}
//         behavior={Platform.OS === "ios" ? "padding" : undefined}
//       >
//         <Pressable
//           style={{
//             flex: 1,
//             backgroundColor: "rgba(0,0,0,0.6)",
//             justifyContent: "flex-end",
//           }}
//           onPress={onClose}
//         >
//           <Pressable className="bg-white rounded-t-3xl shadow-2xl">
//             <ScrollView
//               contentContainerStyle={{ padding: 24 }}
//               keyboardShouldPersistTaps="handled"
//             >
//               <View className="flex-row items-center justify-between mb-6">
//                 <Text className="text-2xl font-bold text-slate-800">
//                   ปฏิเสธงาน
//                 </Text>
//                 <TouchableOpacity
//                   onPress={onClose}
//                   className="p-2 rounded-full bg-slate-100"
//                 >
//                   <Ionicons name="close-outline" size={24} color="#334155" />
//                 </TouchableOpacity>
//               </View>
//               <Text className="text-base text-slate-600 mb-6">
//                 กรุณาให้เหตุผลสำหรับการปฏิเสธงาน:{" "}
//                 <Text className="font-bold">
//                   {jobToReject?.PickPoint || "N/A"}
//                 </Text>
//               </Text>
//               <Text className="text-lg font-semibold text-slate-700 mb-3">
//                 เหตุผล
//               </Text>
//               <View className="flex-row flex-wrap gap-2 mb-4">
//                 {REJECTION_REASONS.map((reason) => (
//                   <TouchableOpacity
//                     key={reason}
//                     onPress={() => handleReasonSelect(reason)}
//                     className={`px-4 py-2 rounded-full border ${
//                       selectedReason === reason
//                         ? "bg-red-500 border-red-500"
//                         : "bg-white border-slate-300"
//                     }`}
//                   >
//                     <Text
//                       className={`font-semibold ${
//                         selectedReason === reason
//                           ? "text-white"
//                           : "text-slate-700"
//                       }`}
//                     >
//                       {reason}
//                     </Text>
//                   </TouchableOpacity>
//                 ))}
//               </View>
//               {selectedReason === "อื่น ๆ" && (
//                 <TextInput
//                   className="border border-slate-300 rounded-lg p-4 mb-4 text-base"
//                   placeholder="กรอกเหตุผลเพิ่มเติม..."
//                   value={otherReason}
//                   onChangeText={setOtherReason}
//                   multiline
//                 />
//               )}
//               <Text className="text-lg font-semibold text-slate-700 mb-3">
//                 ภาพประกอบ (ถ้ามี)
//               </Text>
//               <TouchableOpacity
//                 onPress={pickImage}
//                 className="border-2 border-dashed border-slate-300 p-6 rounded-lg mb-4 items-center justify-center bg-slate-50"
//               >
//                 <Ionicons name="camera-outline" size={32} color="#64748b" />
//                 <Text className="mt-2 font-semibold text-slate-600">
//                   {rejectImage ? "เปลี่ยนรูปภาพ" : "เลือกภาพประกอบ"}
//                 </Text>
//               </TouchableOpacity>
//               {rejectImage && (
//                 <View className="mb-4 relative">
//                   <Image
//                     source={{ uri: rejectImage.uri }}
//                     className="w-full h-48 rounded-lg"
//                   />
//                   <TouchableOpacity
//                     onPress={() => setRejectImage(null)}
//                     className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full"
//                   >
//                     <Ionicons name="close-outline" size={20} color="white" />
//                   </TouchableOpacity>
//                 </View>
//               )}
//               {error && (
//                 <Text className="text-red-500 text-center mb-4 font-semibold">
//                   {error}
//                 </Text>
//               )}
//               <View className="flex-row gap-4 mt-4">
//                 <TouchableOpacity
//                   onPress={onClose}
//                   className="flex-1 bg-slate-200 py-4 rounded-full items-center"
//                 >
//                   <Text className="font-bold text-slate-700 text-base">
//                     ยกเลิก
//                   </Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                   onPress={onSubmit}
//                   disabled={isLoading}
//                   className={`flex-1 py-4 rounded-full items-center ${
//                     isLoading ? "bg-red-300" : "bg-red-600"
//                   }`}
//                 >
//                   {isLoading ? (
//                     <ActivityIndicator size="small" color="white" />
//                   ) : (
//                     <Text className="font-bold text-white text-base">
//                       ยืนยันการปฏิเสธ
//                     </Text>
//                   )}
//                 </TouchableOpacity>
//               </View>
//             </ScrollView>
//           </Pressable>
//         </Pressable>
//       </KeyboardAvoidingView>
//     </Modal>
//   );
// };

// export default function Main() {
//   const router = useRouter();
//   const [jobs, setJobs] = useState<any[]>([]);
//   const [selectedJob, setSelectedJob] = useState<any>(null);
//   const [notifications, setNotifications] = useState<any[]>([]);

//   const [rejectModalVisible, setRejectModalVisible] = useState(false);
//   const [jobToReject, setJobToReject] = useState<any>(null);
//   const [selectedReason, setSelectedReason] = useState<any>(null);
//   const [otherReason, setOtherReason] = useState("");
//   const [rejectImage, setRejectImage] = useState<any>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const loadNotifications = async () => {
//       const stored = await AsyncStorage.getItem("notifications");
//       if (stored) setNotifications(JSON.parse(stored));
//     };
//     loadNotifications();
//   }, []);

//   useEffect(() => {
//     const fetchJobs = async () => {
//       try {
//         const driverId = await AsyncStorage.getItem("U_ID");
//         if (!driverId) return;
//         const res = await fetch(`${SERVER}/api/jobs/driver/${driverId}?status=0`);
//         const data = await res.json();
//         setJobs(data);
//       } catch (err) {
//         console.error("API Error:", err);
//       }
//     };

//     socket.on("connect", () => console.log("🟢 Socket connected:", socket.id));
//     socket.on("disconnect", () => console.log("🔴 Socket disconnected"));
//     socket.on("newShipment", (job) => setJobs((prev) => [job, ...prev]));
//     socket.on("newNotification", async (data) => {
//       setNotifications((prev) => {
//         const updated = [data, ...prev];
//         AsyncStorage.setItem("notifications", JSON.stringify(updated));
//         return updated;
//       });
//     });

//     fetchJobs();
//     return () => {
//       socket.off("connect");
//       socket.off("disconnect");
//       socket.off("newShipment");
//       socket.off("newNotification");
//     };
//   }, []);

//   const handleAccept = async (job: any) => {
//     try {
//       const driverId = await AsyncStorage.getItem("U_ID");
//       const driverName = (await AsyncStorage.getItem("U_NAME")) || undefined;
//       if (!driverId) throw new Error("ไม่พบรหัสผู้ขับในเครื่อง");

//       const res = await fetch(
//         `${SERVER}/api/order_shipment/skey/${job.S_Key}/status`,
//         {
//           method: "PUT",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             status: "in_progress",
//             driverId,
//             driverName,
//           }),
//         }
//       );
//       if (!res.ok) throw new Error(await res.text());

//       socket.emit("jobAccepted", { sKey: job.S_Key, driverId });
//       setJobs((prev) => prev.filter((j) => j.S_Key !== job.S_Key));
//       setSelectedJob(null);
//       router.push("/pages/historyPage");
//     } catch (err) {
//       console.error("❌ Accept error:", err);
//     }
//   };

//   const openRejectModal = (job: any) => {
//     setSelectedJob(null);
//     setJobToReject(job);
//     setSelectedReason(null);
//     setOtherReason("");
//     setRejectImage(null);
//     setError("");
//     setIsLoading(false);
//     setRejectModalVisible(true);
//   };

//   const closeRejectModal = () => {
//     setRejectModalVisible(false);
//     setJobToReject(null);
//   };

//   const pickImage = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       quality: 1,
//     });
//     if (!result.canceled) setRejectImage(result.assets[0]);
//   };

//   const buildRejectFormData = async (reason: string, image: any | null) => {
//   const fd = new FormData();
//   fd.append("reason", reason);

//   if (image?.uri) {
//     const filename =
//       image.fileName ||
//       image.uri.split("/").pop() ||
//       `image_${Date.now()}.jpg`;

//     if (Platform.OS === "web") {
//       const resp = await fetch(image.uri);
//       const blob = await resp.blob();
//       fd.append("image", blob, filename);
//     } else {
//       const ext = (filename.split(".").pop() || "jpg").toLowerCase();
//       const type = `image/${ext === "jpg" ? "jpeg" : ext}`;
//       fd.append("image", { uri: image.uri, name: filename, type } as any);
//     }
//   }

//   return fd;
// };

// const submitReject = async () => {
//   if (!selectedReason) {
//     setError("กรุณาเลือกเหตุผลการปฏิเสธ");
//     return;
//   }
//   if (selectedReason === "อื่น ๆ" && !otherReason.trim()) {
//     setError("กรุณากรอกเหตุผลเพิ่มเติม");
//     return;
//   }
//   if (!jobToReject) return;

//   setIsLoading(true);
//   setError("");

//   try {
//     const finalReason =
//       selectedReason === "อื่น ๆ" ? otherReason : selectedReason;

//     const formData = await buildRejectFormData(finalReason, rejectImage);

//     const res = await fetch(
//       `${SERVER}/api/shipment/reject/${jobToReject.S_Key}`,
//       {
//         method: "POST",
//         body: formData,
//       }
//     );

//     if (!res.ok) {
//       const txt = await res.text();
//       throw new Error(txt || `HTTP ${res.status}`);
//     }

//     socket.emit("jobRejected", { sKey: jobToReject.S_Key });
//     setJobs((prev) => prev.filter((j) => j.S_Key !== jobToReject.S_Key));
//     closeRejectModal();
//   } catch (err) {
//     console.error("❌ Reject error:", err);
//     setError("เกิดข้อผิดพลาดในการส่งข้อมูล");
//   } finally {
//     setIsLoading(false);
//   }
// };

//   return (
//     <SafeAreaView className="flex-1 bg-slate-50">
//       <StatusBar barStyle="dark-content" />
//       <View className="flex-row items-center px-4 py-3 bg-slate-50 relative">
//         <Text className="absolute left-0 right-0 text-center text-2xl font-extrabold text-slate-800">
//           MagPlus
//         </Text>
//         <TouchableOpacity
//           onPress={() => router.push("../pages/Notification")}
//           className="ml-auto"
//         >
//           <View>
//             <Ionicons name="notifications-outline" size={26} color="#1e293b" />
//             {notifications.length > 0 && (
//               <View className="absolute -top-2 -right-2 bg-red-500 rounded-full px-2 py-0.5">
//                 <Text className="text-white text-xs font-bold">
//                   {notifications.length}
//                 </Text>
//               </View>
//             )}
//           </View>
//         </TouchableOpacity>
//       </View>

//       <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
//         <View className="flex-row gap-4 p-4">
//           <View className="flex-1 bg-white/80 backdrop-blur-sm border border-white rounded-2xl p-4 shadow-sm">
//             <View className="flex-row items-center">
//               <Ionicons name="wallet" size={20} color="#16a34a" />
//               <Text className="text-sm text-slate-600 ml-2">รายได้วันนี้</Text>
//             </View>
//             <Text className="text-3xl font-bold text-slate-800 mt-2">฿1,200</Text>
//           </View>
//           <View className="flex-1 bg-white/80 backdrop-blur-sm border border-white rounded-2xl p-4 shadow-sm">
//             <View className="flex-row items-center">
//               <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
//               <Text className="text-sm text-slate-600 ml-2">งานที่สำเร็จ</Text>
//             </View>
//             <Text className="text-3xl font-bold text-slate-800 mt-2">0</Text>
//           </View>
//         </View>
//         <View className="p-4">
//           <Text className="text-xl font-bold text-slate-800 mb-4">
//             งานใหม่สำหรับคุณ ✨
//           </Text>
//           {jobs.length === 0 ? (
//             <View className="items-center justify-center mt-16">
//               <Ionicons name="briefcase-outline" size={60} color="#94a3b8" />
//               <Text className="text-slate-600 text-lg font-semibold mt-4">
//                 ยังไม่มีงานใหม่เข้ามา
//               </Text>
//               <Text className="text-slate-400 mt-1">
//                 เราจะแจ้งเตือนเมื่อมีงานใหม่
//               </Text>
//             </View>
//           ) : (
//             jobs.map((job) => (
//               <JobCard
//                 key={job.S_Key ?? job.Orderid}
//                 job={job}
//                 onPress={() => setSelectedJob(job)}
//               />
//             ))
//           )}
//         </View>
//       </ScrollView>

//       <JobDetailModal
//         job={selectedJob}
//         visible={!!selectedJob}
//         onClose={() => setSelectedJob(null)}
//         onAccept={() => handleAccept(selectedJob)}
//         onReject={() => openRejectModal(selectedJob)}
//       />
//       <RejectJobModal
//         visible={rejectModalVisible}
//         onClose={closeRejectModal}
//         onSubmit={submitReject}
//         jobToReject={jobToReject}
//         state={{ selectedReason, otherReason, rejectImage, isLoading, error }}
//         setStateFns={{
//           setSelectedReason,
//           setOtherReason,
//           setRejectImage,
//           pickImage,
//           setError,
//         }}
//       />
//       <NavFooter />
//     </SafeAreaView>
//   );
// }

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { io } from "socket.io-client";
import NavFooter from "../components/NavFooter";


const SERVER =
  Platform.OS === "android"
    ? "https://localhost:5000"
    : "http://localhost:5000";

const socket = io(SERVER, { transports: ["websocket"] });

const JobCard = ({ job, onPress }: { job: any; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <View className="bg-white rounded-2xl shadow-md overflow-hidden mb-4 border border-slate-200">
      <View className="p-4">
        <View className="flex-row justify-between items-start">
          <Text className="text-lg font-bold text-slate-800 w-4/5">
            {job.CarType || "งานใหม่"}
          </Text>
          <View className="bg-indigo-100 px-2 py-1 rounded-full">
            <Text className="text-indigo-600 text-xs font-bold">ใหม่</Text>
          </View>
        </View>
        <View className="flex-row items-center mt-3">
          <Ionicons name="map-outline" size={16} color="#64748b" />
          <Text className="text-slate-600 ml-2">
            {job.ProName || job.PickPoint}
          </Text>
        </View>
        <View className="mt-4 pt-4 border-t border-slate-200">
          <View className="flex-row items-center">
            <View className="w-5 h-5 bg-green-500 rounded-full items-center justify-center">
              <Ionicons name="arrow-up" size={12} color="white" />
            </View>
            <Text className="ml-3 text-slate-700">{job.PickPoint}</Text>
          </View>
          <View className="h-5 w-0.5 bg-slate-300 ml-[9px] my-1" />
          <View className="flex-row items-center">
            <View className="w-5 h-5 bg-red-500 rounded-full items-center justify-center">
              <Ionicons name="arrow-down" size={12} color="white" />
            </View>
            <Text className="ml-3 text-slate-700">{job.DropPoint}</Text>
          </View>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const JobDetailModal = ({ job, visible, onClose, onAccept, onReject, }: { job: any; visible: boolean; onClose: () => void; onAccept: () => void; onReject: () => void; }) => {
  if (!job) return null;
  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)", }}>
        <View className="bg-slate-50 rounded-t-3xl p-6 shadow-2xl">
          <TouchableOpacity onPress={onClose} className="absolute top-4 right-4 bg-slate-200 rounded-full p-1">
            <Ionicons name="close" size={24} color="#475569" />
          </TouchableOpacity>
          <Text className="text-2xl font-extrabold text-indigo-900 mb-2">{job.CarType}</Text>
          <Text className="text-slate-600 mb-6">{job.ProName}</Text>
          <View className="flex-row justify-around bg-white p-4 rounded-2xl mb-6 border border-slate-200">
            <View className="items-center">
              <Text className="text-slate-500 text-sm">น้ำหนัก</Text>
              <Text className="text-indigo-600 font-bold text-lg">{Number(job.ProKg || 0).toLocaleString()} kg</Text>
            </View>
            <View className="items-center">
              <Text className="text-slate-500 text-sm">สินค้า</Text>
              <Text className="text-indigo-600 font-bold text-lg">{job.ProName || "N/A"}</Text>
            </View>
          </View>
          <View>
            <Text className="font-bold text-slate-700 mb-3">รายละเอียดการเดินทาง</Text>
            <View className="flex-row items-start mb-4">
              <Ionicons name="navigate-circle-outline" size={24} color="#16a34a" />
              <View className="ml-4 flex-1">
                <Text className="text-slate-500 text-sm">จุดรับของ</Text>
                <Text className="text-slate-900 font-semibold text-base">{job.PickPoint}</Text>
              </View>
            </View>
            <View className="flex-row items-start">
              <Ionicons name="flag-outline" size={24} color="#ef4444" />
              <View className="ml-4">
                <Text className="text-slate-500 text-sm">จุดส่งของ</Text>
                <Text className="text-slate-900 font-semibold text-base">{job.DropPoint}</Text>
              </View>
            </View>
            <View className="flex flex-row mt-10">
              <View className="flex-row items-start mr-3">
                {/* <Ionicons name="wallet-outline" size={24} color="#ef4444" /> */}
                <View className="ml-4">
                  <Text className="text-slate-500 text-sm">ค่าเที่ยว</Text>
                  <Text className="text-slate-900 font-semibold text-base">xxxxx.xx</Text>
                </View>
              </View>
          
              <View className="flex-row items-start mr-3">
                {/* <Ionicons name="wallet-outline" size={24} color="#ef4444" /> */}
                <View className="ml-4">
                  <Text className="text-slate-500 text-sm">รายได้</Text>
                  <Text className="text-slate-900 font-semibold text-base">xxxxx.xx</Text>
                </View>
              </View>
            
              <View className="flex-row items-start mr-3">
                {/* <Ionicons name="wallet-outline" size={24} color="#ef4444" /> */}
                <View className="ml-4">
                  <Text className="text-slate-500 text-sm">ค่าเชื้อเพลิง</Text>
                  <Text className="text-slate-900 font-semibold text-base">xxxxx.xx</Text>
                </View>
              </View>
              <View className="flex-row items-start mr-3">
                {/* <Ionicons name="wallet-outline" size={24} color="#ef4444" /> */}
                <View className="ml-4">
                  <Text className="text-slate-500 text-sm">เรท</Text>
                  <Text className="text-slate-900 font-semibold text-base">xxxxx.xx</Text>
                </View>
              </View>
            </View>
          </View>
          <View className="flex-row gap-4 mt-8">
            <TouchableOpacity onPress={onReject} className="flex-1 bg-slate-200 py-4 rounded-full items-center justify-center">
              <Text className="text-slate-700 font-bold text-base">ปฏิเสธ</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onAccept} className="flex-1 bg-indigo-600 py-4 rounded-full items-center justify-center shadow-lg shadow-indigo-400/50">
              <Text className="text-white font-bold text-base">รับงานนี้</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const REJECTION_REASONS = ["ไม่สะดวกเดินทาง", "งานซ้อน", "ข้อมูลงานไม่ชัดเจน", "อื่น ๆ",];

const RejectJobModal = ({ visible, onClose, onSubmit, jobToReject, state, setStateFns, }: { visible: boolean; onClose: () => void; onSubmit: () => void; jobToReject: any; state: { selectedReason: string; otherReason: string; rejectImage: any; isLoading: boolean; error: string; }; setStateFns: { setSelectedReason: (reason: string) => void; setOtherReason: (reason: string) => void; setRejectImage: (image: any) => void; pickImage: () => void; setError: (error: string) => void; }; }) => {
  if (!jobToReject) return null;

  const { selectedReason, otherReason, rejectImage, isLoading, error } = state;
  const { setSelectedReason, setOtherReason, setRejectImage, pickImage, setError } = setStateFns;

  const handleReasonSelect = (reason: string) => {
    setSelectedReason(reason);
    if (reason !== "อื่น ๆ") setOtherReason("");
    setError("");
  };

  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end", }} onPress={onClose}>
          <Pressable className="bg-white rounded-t-3xl shadow-2xl">
            <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-2xl font-bold text-slate-800">ปฏิเสธงาน</Text>
                <TouchableOpacity onPress={onClose} className="p-2 rounded-full bg-slate-100">
                  <Ionicons name="close-outline" size={24} color="#334155" />
                </TouchableOpacity>
              </View>
              <Text className="text-base text-slate-600 mb-6">กรุณาให้เหตุผลสำหรับการปฏิเสธงาน:{" "}<Text className="font-bold">{jobToReject?.PickPoint || "N/A"}</Text></Text>
              <Text className="text-lg font-semibold text-slate-700 mb-3">เหตุผล</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {REJECTION_REASONS.map((reason) => (
                  <TouchableOpacity key={reason} onPress={() => handleReasonSelect(reason)} className={`px-4 py-2 rounded-full border ${selectedReason === reason ? "bg-red-500 border-red-500" : "bg-white border-slate-300"}`}>
                    <Text className={`font-semibold ${selectedReason === reason ? "text-white" : "text-slate-700"}`}>{reason}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {selectedReason === "อื่น ๆ" && (
                <TextInput className="border border-slate-300 rounded-lg p-4 mb-4 text-base" placeholder="กรอกเหตุผลเพิ่มเติม..." value={otherReason} onChangeText={setOtherReason} multiline />
              )}
              <Text className="text-lg font-semibold text-slate-700 mb-3">ภาพประกอบ (ถ้ามี)</Text>
              <TouchableOpacity onPress={pickImage} className="border-2 border-dashed border-slate-300 p-6 rounded-lg mb-4 items-center justify-center bg-slate-50">
                <Ionicons name="camera-outline" size={32} color="#64748b" />
                <Text className="mt-2 font-semibold text-slate-600">{rejectImage ? "เปลี่ยนรูปภาพ" : "เลือกภาพประกอบ"}</Text>
              </TouchableOpacity>
              {rejectImage && (
                <View className="mb-4 relative">
                  <Image source={{ uri: rejectImage.uri }} className="w-full h-48 rounded-lg" />
                  <TouchableOpacity onPress={() => setRejectImage(null)} className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full">
                    <Ionicons name="close-outline" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              )}
              {error && (<Text className="text-red-500 text-center mb-4 font-semibold">{error}</Text>)}
              <View className="flex-row gap-4 mt-4">
                <TouchableOpacity onPress={onClose} className="flex-1 bg-slate-200 py-4 rounded-full items-center">
                  <Text className="font-bold text-slate-700 text-base">ยกเลิก</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onSubmit} disabled={isLoading} className={`flex-1 py-4 rounded-full items-center ${isLoading ? "bg-red-300" : "bg-red-600"}`}>
                  {isLoading ? (<ActivityIndicator size="small" color="white" />) : (<Text className="font-bold text-white text-base">ยืนยันการปฏิเสธ</Text>)}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default function Main() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [completedJobsCount, setCompletedJobsCount] = useState<number>(0);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [jobToReject, setJobToReject] = useState<any>(null);
  const [selectedReason, setSelectedReason] = useState<any>(null);
  const [otherReason, setOtherReason] = useState("");
  const [rejectImage, setRejectImage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const initialize = async () => {
      const stored = await AsyncStorage.getItem("notifications");
      if (stored) setNotifications(JSON.parse(stored));
      fetchJobs();
      fetchCompletedJobsCount();
    };
    
    initialize();

    socket.on("connect", () => console.log("🟢 Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("🔴 Socket disconnected"));
    socket.on("newShipment", (job) => setJobs((prev) => [job, ...prev]));
    socket.on("newNotification", async (data) => {
      setNotifications((prev) => {
        const updated = [data, ...prev];
        AsyncStorage.setItem("notifications", JSON.stringify(updated));
        return updated;
      });
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("newShipment");
      socket.off("newNotification");
    };
  }, []);

  const fetchJobs = async () => {
    try {
      const driverId = await AsyncStorage.getItem("U_ID");
      if (!driverId) return;
      const res = await fetch(`${SERVER}/api/jobs/driver/${driverId}?status=0`);
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("API Error (Pending Jobs):", err);
    }
  };

  const fetchCompletedJobsCount = async () => {
    try {
      const driverId = await AsyncStorage.getItem("U_ID");
      if (!driverId) return;
      const res = await fetch(`${SERVER}/api/jobs/driver/${driverId}?status=3`);
      const data = await res.json();
      setCompletedJobsCount(Array.isArray(data) ? data.length : 0); 
    } catch (err) {
      console.error("API Error (Completed Jobs):", err);
      setCompletedJobsCount(0); 
    }
  };

  const handleAccept = async (job: any) => {
    try {
      const driverId = await AsyncStorage.getItem("U_ID");
      const driverName = (await AsyncStorage.getItem("U_NAME")) || undefined;
      if (!driverId) throw new Error("ไม่พบรหัสผู้ขับในเครื่อง");

      const res = await fetch(`${SERVER}/api/order_shipment/skey/${job.S_Key}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress", driverId, driverName, }),
      });
      if (!res.ok) throw new Error(await res.text());

      socket.emit("jobAccepted", { sKey: job.S_Key, driverId });
      setJobs((prev) => prev.filter((j) => j.S_Key !== job.S_Key));
      setSelectedJob(null);
      router.push("/pages/historyPage");
    } catch (err) {
      console.error("❌ Accept error:", err);
    }
  };

  const openRejectModal = (job: any) => {
    setSelectedJob(null);
    setJobToReject(job);
    setSelectedReason(null);
    setOtherReason("");
    setRejectImage(null);
    setError("");
    setIsLoading(false);
    setRejectModalVisible(true);
  };

  const closeRejectModal = () => {
    setRejectModalVisible(false);
    setJobToReject(null);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) setRejectImage(result.assets[0]);
  };

  const buildRejectFormData = async (reason: string, image: any | null) => {
    const fd = new FormData();
    fd.append("reason", reason);
    if (image?.uri) {
      const filename = image.fileName || image.uri.split("/").pop() || `image_${Date.now()}.jpg`;
      if (Platform.OS === "web") {
        const resp = await fetch(image.uri);
        const blob = await resp.blob();
        fd.append("image", blob, filename);
      } else {
        const ext = (filename.split(".").pop() || "jpg").toLowerCase();
        const type = `image/${ext === "jpg" ? "jpeg" : ext}`;
        fd.append("image", { uri: image.uri, name: filename, type } as any);
      }
    }
    return fd;
  };

  const submitReject = async () => {
    if (!selectedReason) {
      setError("กรุณาเลือกเหตุผลการปฏิเสธ");
      return;
    }
    if (selectedReason === "อื่น ๆ" && !otherReason.trim()) {
      setError("กรุณากรอกเหตุผลเพิ่มเติม");
      return;
    }
    if (!jobToReject) return;

    setIsLoading(true);
    setError("");
    try {
      const finalReason = selectedReason === "อื่น ๆ" ? otherReason : selectedReason;
      const formData = await buildRejectFormData(finalReason, rejectImage);
      const res = await fetch(`${SERVER}/api/shipment/reject/${jobToReject.S_Key}`, { method: "POST", body: formData });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      socket.emit("jobRejected", { sKey: jobToReject.S_Key });
      setJobs((prev) => prev.filter((j) => j.S_Key !== jobToReject.S_Key));
      closeRejectModal();
    } catch (err) {
      console.error("❌ Reject error:", err);
      setError("เกิดข้อผิดพลาดในการส่งข้อมูล");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" />
      <View className="flex-row items-center px-4 py-3 bg-slate-50 relative">
        <Text className="absolute left-0 right-0 text-center text-2xl font-extrabold text-slate-800">MagPlus</Text>
        <TouchableOpacity onPress={() => router.push("../pages/Notification")} className="ml-auto">
          <View>
            <Ionicons name="notifications-outline" size={26} color="#1e293b" />
            {notifications.length > 0 && (
              <View className="absolute -top-2 -right-2 bg-red-500 rounded-full px-2 py-0.5">
                <Text className="text-white text-xs font-bold">{notifications.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="flex-row gap-4 p-4">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={0.8}
            onPress={() => router.push("../pages/SummaryPage")}
          >
            <View className="bg-white/80 backdrop-blur-sm border border-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center">
                <Ionicons name="wallet" size={20} color="#16a34a" />
                <Text className="text-sm text-slate-600 ml-2">รายได้วันนี้</Text>
              </View>
              <Text className="text-3xl font-bold text-slate-800 mt-2">฿1,200</Text>
            </View>
          </TouchableOpacity>
          <View className="flex-1 bg-white/80 backdrop-blur-sm border border-white rounded-2xl p-4 shadow-sm">
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
              <Text className="text-sm text-slate-600 ml-2">งานที่สำเร็จ</Text>
            </View>
            <Text className="text-3xl font-bold text-slate-800 mt-2">{completedJobsCount}</Text>
          </View>
        </View>
        <View className="p-4">
          <Text className="text-xl font-bold text-slate-800 mb-4">งานใหม่สำหรับคุณ ✨</Text>
          {jobs.length === 0 ? (
            <View className="items-center justify-center mt-16">
              <Ionicons name="briefcase-outline" size={60} color="#94a3b8" />
              <Text className="text-slate-600 text-lg font-semibold mt-4">ยังไม่มีงานใหม่เข้ามา</Text>
              <Text className="text-slate-400 mt-1">เราจะแจ้งเตือนเมื่อมีงานใหม่</Text>
            </View>
          ) : (
            jobs.map((job) => (
              <JobCard key={job.S_Key ?? job.Orderid} job={job} onPress={() => setSelectedJob(job)} />
            ))
          )}
        </View>
      </ScrollView>
      <JobDetailModal job={selectedJob} visible={!!selectedJob} onClose={() => setSelectedJob(null)} onAccept={() => handleAccept(selectedJob)} onReject={() => openRejectModal(selectedJob)} />
      <RejectJobModal visible={rejectModalVisible} onClose={closeRejectModal} onSubmit={submitReject} jobToReject={jobToReject} state={{ selectedReason, otherReason, rejectImage, isLoading, error }} setStateFns={{ setSelectedReason, setOtherReason, setRejectImage, pickImage, setError, }} />
      <NavFooter />
    </SafeAreaView>
  );
}