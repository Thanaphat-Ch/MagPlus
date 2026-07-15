// Profile.tsx
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NavFooter from "../../components/NavFooter";
import { ImageCropPreview } from "./components/ImageCropPreview";
import LeaveFormModal from "./components/LeaveFormModal";

interface Profile {
  username?: string;
  name?: string;
  lastName?: string;
  birthday?: string;
  gender?: string;
  phone?: string;
  idCard?: string;
  address?: string;
  driver_license_number?: string;
  car_type?: string;
  vehicle_registration?: string;
  profile?: string; // path รูป
}

export default function Profile() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [userId, setUserId] = useState<string | null>(null);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
  const [modalLeaveVisible, setModalLeaveVisible] = useState(false);
  const apiUrl = process.env.API_URL;
  
  const fetchProfile = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return router.replace("/");
  
    try {
      const res = await axios.get(`${apiUrl}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      router.replace("/");
    } finally {
      setLoading(false);
    }
  };
  const loadUserId = async () => {
    try {
      const id = await AsyncStorage.getItem('userId');
      if (id) setUserId(id);
    } catch (error) {
      console.error('Error loading userId:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
    loadUserId();
  }, []);

  // เลือกรูป + เปิด preview
  const pickImage = async () => {
    const permission =
      Platform.OS === "web"
        ? { granted: true }
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("กรุณาอนุญาตการเข้าถึงรูปภาพ");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImagePreview(result.assets[0].uri);
      setModalVisible(true);
    }
  };

  // อัปโหลดรูป รองรับ Web + Mobile
  const handleImageUpload = async (imageUri: string) => {
    setUploading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("U_ID"); // ✅ ดึงจาก AsyncStorage
      if (!userId) {
        Alert.alert("กรุณาล็อกอินใหม่");
        setUploading(false);
        return;
      }

      const formData = new FormData();
      if (Platform.OS === "web") {
        const blob = await fetch(imageUri).then((r) => r.blob());
        formData.append("files", blob, `profile_${Date.now()}.jpg`);
      } else {
        formData.append("files", {
          uri: imageUri,
          name: `profile_${Date.now()}.jpg`,
          type: "image/jpeg",
        } as any);
      }     
      formData.append("userId", userId);

      const res = await axios.post(
        `${apiUrl}/api/upload?Up_type=driver`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("✅ Upload success:", res.data);

      const profile = res.data.files?.[0]?.url;
      console.log("✅ Upload success:", profile);
      if (!profile) return console.log('!uploadedPath')

      await axios.put(`${apiUrl}/api/user/update`, { profile },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      await new Promise((r) => setTimeout(r, 500));
      fetchProfile();
      Alert.alert("เปลี่ยนสำเร็จ");
    } catch (err: any) {
      console.error("❌ error:", err.response?.data || err.message);
      Alert.alert("เปลี่ยนโปรไฟล์ไม่สำเร็จ", err.response?.data.message || '');
    } finally {
      setUploading(false);
      setModalVisible(false);
      setImagePreview(null);
    }
  };


  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        await axios.post(
          `${apiUrl}/api/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await AsyncStorage.removeItem("token");
      }
    } catch (err: any) {
      console.error("Logout failed:", err.response?.data || err.message);
    } finally {
      router.replace("/");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!profile) return null;

  const confirmPickImage = () => {
    if (Platform.OS === "web") {
      const confirm = window.confirm("คุณต้องการเปลี่ยนภาพโปรไฟล์ใช่หรือไม่?");
      if (confirm) pickImage();
    } else {
      Alert.alert(
        "แก้ไขโปรไฟล์",
        "คุณต้องการเปลี่ยนภาพโปรไฟล์ใช่หรือไม่?",
        [
          { text: "ยกเลิก", style: "cancel" },
          { text: "ตกลง", onPress: pickImage }
        ]
      );
    }
  };

  const handleCheckIn = async () => {
    if (!userId) return Alert.alert("ผิดพลาด", "ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินใหม่");
    const now = new Date();
    setCheckInTime(now);

    try {
        const { data } = await axios.post(`${apiUrl}/api/attendance/checkin`, {
            user_id: userId,
        });

        Alert.alert("เข้างานสำเร็จ", `เวลา: ${now.toLocaleTimeString()}\n${data.message}`);
    } catch (error: any) {
        console.error("Error in handleCheckIn:", error);
        Alert.alert("เกิดข้อผิดพลาด", error.response?.data?.error || error.message || "ไม่สามารถบันทึกเวลาเข้างานได้");
    }
  };

  const handleCheckOut = async () => {
    if (!userId) return Alert.alert("ผิดพลาด", "ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินใหม่");
    const now = new Date();
    setCheckOutTime(now);

    try {
        const { data } = await axios.post(`${apiUrl}/api/attendance/checkout`, {
            user_id: userId,
        });

        Alert.alert("ออกงานสำเร็จ", `เวลา: ${now.toLocaleTimeString()}\n${data.message}`);
    } catch (error: any) {
        console.error("Error in handleCheckOut:", error);
        Alert.alert("เกิดข้อผิดพลาด", error.response?.data?.error || error.message || "ไม่สามารถบันทึกเวลาออกงานได้");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 25 }}>
        <LinearGradient colors={["#3b82f6", "#6366f1"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="items-center justify-center px-4 rounded-b-3xl shadow-lg shadow-indigo-200 mb-6" style={{ paddingVertical: 32, alignItems: "center", marginBottom: 16 }}>
          <TouchableOpacity onPress={confirmPickImage} className="relative bottom-1 border-blue-950">
            {profile.profile ? (
              <Image source={{ uri: profile.profile }} className="w-32 h-32 rounded-full mb-3" />
            ) : (
              <View className="w-32 h-32 bg-white/30 rounded-full justify-center items-center mb-3 border-4 border-white">
                <Ionicons name="person-outline" size={56} color="white" />
              </View>
            )}

            {/* Edit Icon */}
            {/* <View className="absolute bottom-2 right-0 bg-gray-300/80 rounded-full p-2 shadow-lg">
              <Feather name="edit-2" size={18} color="#3b82f6" />
            </View> */}
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-white text-center">
            {profile.name} {profile.lastName}
          </Text>
          <Text className="text-base text-white/80 mt-1 text-center">@{profile.username}</Text>
        </LinearGradient>

        <View className="bg-white rounded-xl mx-4 mb-5 p-2 shadow-md shadow-slate-300 border border-slate-200">
          <View className="flex-row items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <Text className="text-base font-bold text-slate-800 ml-2">ลงงาน</Text>
            {/* ปุ่ม ประวัติ */}
            <TouchableOpacity onPress={() => router.push("/pages/Profile/profile")} className="flex-row items-center p-2 rounded-lg ">
              {/* <Text className="text-sm font-semibold text-indigo-600 mr-1">ประวัติ</Text> */}
              <Feather name="chevron-right" size={16} color="#4f46e5" />
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-around">
            <QuickActionButton label="เข้างาน" icon={<Ionicons name="log-in-outline" size={24} color="#10b981" />} onPress={handleCheckIn} />
            <QuickActionButton label="ออกงาน" icon={<Ionicons name="log-out-outline" size={24} color="#ef4444" />} onPress={handleCheckOut} />
            {/* <QuickActionButton
              label="ลางาน"
              icon={<Ionicons name="document-text-outline" size={24} color="#f97316" />}
              onPress={() => setModalLeaveVisible(true)}
              // onPress={() => router.push('/pages/Profile/LeaveFormPage')}
            />
            <QuickActionButton label="แจ้งซ่อม" icon={<MaterialIcons name="handyman" size={24} color="#3b82f6" />} onPress={() => router.push("/pages/Profile/personalDetail")} /> */}
          </View>
        </View>
        <LeaveFormModal visible={modalLeaveVisible} onClose={() => setModalLeaveVisible(false)} userId={userId} />

        {/* Info Section */}
        <View className="px-4">
          {/* ข้อมูลติดต่อ */}
          <InfoSection>
            <MenuItem icon={<MaterialIcons name="person-outline" size={24} color="#000000" />} label="ข้อมูลส่วนตัว" onPress={() => router.push(`/pages/Profile/personalDetail`)} />
            <MenuItem icon={<Ionicons name="document-text-outline" size={24} color="#000000" />} label="ลางาน" onPress={() => router.push(`/pages/Profile/leave/LeaveFormPage`)} />
            <MenuItem icon={<MaterialIcons name="handyman" size={24} color="#000000" />} label="แจ้งซ่อม" onPress={() => router.push(`/pages/Profile/Service`)} />
            {/* <MenuItem icon={<Ionicons name="settings-outline" size={24} color="#000000" />} label="ตั้งค่า" onPress={() => router.push(`/pages/Profile/profile`)} /> */}
          </InfoSection>

          <TouchableOpacity onPress={handleLogout} className="flex-row justify-center items-center bg-red-500 rounded-xl p-4 mt-4 shadow-lg shadow-red-200">
            <Feather name="log-out" size={20} color="white" />
            <Text className="text-white font-bold text-base ml-2">ออกจากระบบ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Preview Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent={false}>
        <View className="flex-1 bg-black">
          {/* Save */}
          <TouchableOpacity style={{ position: "absolute", top: 50, right: 25, zIndex: 20 }} onPress={() => imagePreview && handleImageUpload(imagePreview)}>
            <Text className="text-white text-lg font-bold">{uploading ? "กำลังบันทึก..." : "บันทึก"}</Text>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity
            onPress={() => {
              setModalVisible(false)
              setImagePreview(null)
            }}
            style={{ position: "absolute", top: 50, left: 25, zIndex: 20 }}
          >
            <Text className="text-white text-lg font-semibold">ยกเลิก</Text>
          </TouchableOpacity>

          {imagePreview && <ImageCropPreview uri={imagePreview} />}
        </View>
      </Modal>

      <NavFooter />
    </SafeAreaView>
  )
}

const QuickActionButton = ({ icon, label, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-1 items-center justify-center p-3"
  >
    {icon}
    <Text className="text-sm text-slate-700 mt-1 font-medium">{label}</Text>
  </TouchableOpacity>
);

// InfoItem & InfoSection
const MenuItem = ({ icon, label, value, onPress }: any) => (
  <TouchableOpacity
    className="flex-row items-center border-b border-slate-100 py-4 last:border-b-0"
    onPress={onPress}
  >
    {icon}
    <Text className="text-base text-slate-600 ml-4 font-medium">{label}</Text>
    <View className="flex-1 flex-row justify-end items-center">
      {value ? (
        <Text className="text-base text-slate-900 font-semibold mr-2" numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      <Ionicons name="chevron-forward-outline" size={20} color="#cbd5e1" />
    </View>
  </TouchableOpacity>
);
const InfoSection = ({ title='', children }: any) => (
  <View className="bg-white rounded-xl px-5 py-3 shadow-sm shadow-slate-200 border border-slate-200">
    {/* {title ? ( <></> ):( <Text className="text-lg font-bold text-blue-600 mb-2">{title}</Text> )} */}
    {children}
  </View>
);
