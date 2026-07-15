import { ImagePreviewModal } from '@/app/components/ImagePreviewModal';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DropDownPicker, { ItemType } from 'react-native-dropdown-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LeaveCounts {
  pending: number;
  approved: number;
  rejected: number;
}

interface CrossPlatformDatePickerProps {
    label: string;
    value: Date | null;
    onChange: (event: DateTimePickerEvent | React.ChangeEvent<HTMLInputElement>, selectedDate?: Date) => void;
    minimumDate?: Date;
    maximumDate?: Date;
}

const CrossPlatformDatePicker: React.FC<CrossPlatformDatePickerProps> = ({ label, value, onChange, minimumDate, maximumDate }) => {
    const [showPicker, setShowPicker] = useState(false);

    const onNativeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowPicker(Platform.OS === 'ios');
        if (selectedDate) {
            onChange(event, selectedDate);
        } else {
            setShowPicker(false);
        }
    };
    
    const onWebChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.value) return; 
        const [year, month, day] = event.target.value.split('-').map(Number);
        const selectedDate = new Date(year, month - 1, day);
        onChange(event, selectedDate);
    };

    const formatDate = (date: Date | null): string => {
        if (!date) return '';
        const tempDate = new Date(date);
        tempDate.setMinutes(tempDate.getMinutes() + tempDate.getTimezoneOffset());
        return tempDate.toISOString().split('T')[0];
    };

    if (Platform.OS === 'web') {
        return (
            <View className="flex-1">
                <input
                    type="date"
                    value={formatDate(value)}
                    onChange={onWebChange}
                    min={formatDate(minimumDate) || ''}
                    max={formatDate(maximumDate) || ''}
                    className="w-full h-[50px] border border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800"
                />
            </View>
        );
    }

    return (
        <>
            <TouchableOpacity
                onPress={() => setShowPicker(true)}
                className="flex-1 flex-row items-center justify-between border border-gray-200 rounded-xl p-3 h-[50px] bg-gray-50"
            >
                <Text className="text-gray-800">{value ? formatDate(value) : label}</Text>
                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
            </TouchableOpacity>
            {showPicker && (
                <DateTimePicker
                    value={value || new Date()}
                    mode="date"
                    display="default"
                    onChange={onNativeChange}
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                />
            )}
        </>
    );
};

export default function AttendanceLeave() {

    const [leaveTypeOpen, setLeaveTypeOpen] = useState(false);
    const [leaveType, setLeaveType] = useState<string>('ลากิจ');
    const [leaveTypeItems, setLeaveTypeItems] = useState<ItemType<string>[]>([
        { label: 'ลากิจ', value: 'ลากิจ' },
        { label: 'ลาป่วย', value: 'ลาป่วย' },
        { label: 'ลาพักร้อน', value: 'ลาพักร้อน' },
        { label: 'ลาอื่นๆ', value: 'ลาอื่นๆ' },
    ]);
    const [userId, setUserId] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [reason, setReason] = useState('');
    const [leaveImages, setLeaveImages] = useState<string[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [counts, setCounts] = useState<LeaveCounts>({ pending: 0, approved: 0, rejected: 0,});

    useEffect(() => {
        const loadUserId = async () => {
            try {
                const id = await AsyncStorage.getItem('userId');
                if (id) setUserId(id);
            } catch (error) {
                console.error('Error loading userId:', error);
            }
        };


        loadUserId();
        fetchPendingCount();
    }, []);

  const fetchPendingCount = async () => {
    try {
        const token = await AsyncStorage.getItem("token");
        const res = await axios.get(
       `https://app.magnitudetms.com/api/leave-requests`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
        );

        // setCounts(res.data.counts);
        setCounts(res.data.counts);

    } catch (error) {
        console.error("Error fetching pending count:", error);
    }
    };

  const handleLeaveSubmit = async () => {
    if (!startDate || !endDate || !reason) return Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกข้อมูลให้ครบถ้วน");
    if (!userId) return Alert.alert("ผิดพลาด", "ไม่พบข้อมูลผู้ใช้");

    try {
        const formData = new FormData();
        formData.append("user_id", userId);
        formData.append("leave_type", leaveType);
        formData.append("start_date", startDate.toISOString().split("T")[0]);
        formData.append("end_date", endDate.toISOString().split("T")[0]);
        formData.append("reason", reason);

        for (const uri of leaveImages) {
            const filename = uri.split("/").pop() || `image.jpg`;
            if (Platform.OS === "web") {
                const response = await fetch(uri);
                const blob = await response.blob();
                formData.append("images", blob, filename);
            } else {
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : "image/jpeg";
                formData.append("images", { uri, name: filename, type } as any);
            }
        }

        const { data } = await axios.post("https://app.magnitudetms.com/api/leave", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        Alert.alert("สำเร็จ", data.message);
        setReason("");
        setLeaveImages([]);
        setStartDate(null);
        setEndDate(null);
    } catch (error: any) {
        console.error("Error in handleLeaveSubmit:", error);
        Alert.alert("เกิดข้อผิดพลาด", error.response?.data?.error || error.message || "ไม่สามารถส่งคำขอลาได้");
    }
};

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) return Alert.alert('การเข้าถึงถูกปฏิเสธ', 'กรุณาอนุญาตให้เข้าถึงคลังรูปภาพ');

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.5,
            allowsMultipleSelection: true,
            selectionLimit: 5 - leaveImages.length, 
        });

        if (!result.canceled && result.assets) {
            const uris = result.assets.map((asset) => asset.uri);
            setLeaveImages((prev) => [...prev, ...uris].slice(0, 5));
        }
    };

    const handleRemoveImage = (uri: string) => {
        setLeaveImages((prev) => prev.filter((img) => img !== uri));
    };

    const onStartDateChange = (_: DateTimePickerEvent | React.ChangeEvent<HTMLInputElement>, selectedDate?: Date) => {
        if (selectedDate) {
            setStartDate(selectedDate);
            if (endDate && selectedDate > endDate) setEndDate(null);
        }
    };

    const onEndDateChange = (_: DateTimePickerEvent | React.ChangeEvent<HTMLInputElement>, selectedDate?: Date) => {
        if (selectedDate) {
            if (startDate && selectedDate < startDate) return Alert.alert('วันที่ไม่ถูกต้อง', 'วันที่สิ้นสุดต้องมากกว่าหรือเท่ากับวันที่เริ่มต้น');
            setEndDate(selectedDate);
        }
    };

    return (
      <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 shadow-xl">
              <View className="flex-row items-center">
                <TouchableOpacity onPress={() => router.back()}>
                  <Ionicons name="chevron-back-outline" size={24} color="black" />
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-gray-800 ml-4">
                  ลางาน
                </Text>
              </View>
              <View>  </View>
              {/* {isViewOnly && (
                <TouchableOpacity onPress={() => setIsViewOnly(false)}>
                  <Text className="text-base font-medium text-blue-600">แก้ไข</Text>
                </TouchableOpacity>
              )} */}
            </View>  

            <ScrollView keyboardShouldPersistTaps="handled" className='bg-slate-100 p-5'>

                <View className="flex-row items-center justify-between bg-white rounded-2xl shadow-lg p-2 mb-4">
                    <Text className="text-base font-bold text-slate-800 ml-2">ลางานทั้งหมด  {counts.approved} ครั้ง</Text>
                    {/* ปุ่ม ประวัติ */}
                    <TouchableOpacity onPress={() => router.push("/pages/Profile/leave/LeaveHistory")} className="flex-row items-center p-2 rounded-lg ">
                    <Text className="text-sm font-semibold text-indigo-600 mr-1">ประวัติ</Text>
                    <Feather name="chevron-right" size={16} color="#4f46e5" />
                    </TouchableOpacity>
                </View>

                <View className="bg-white rounded-2xl shadow-sm p-5 mb-10 border border-gray-100">
                    <Text className="text-xl font-bold text-gray-800 mb-2 text-center">📄 ฟอร์มขอลางาน</Text>
                    <View className="h-px bg-gray-200 mb-6" />

                    <Text className="text-sm font-medium mb-2 text-gray-700">ประเภทการลา</Text>
                    <View style={{ zIndex: 1000, marginBottom: 16 }}>
                        <DropDownPicker
                            open={leaveTypeOpen}
                            value={leaveType}
                            items={leaveTypeItems}
                            setOpen={setLeaveTypeOpen}
                            setValue={setLeaveType}
                            setItems={setLeaveTypeItems}
                            style={{
                                borderColor: '#e5e7eb',
                                borderRadius: 12,
                                minHeight: 52,
                                backgroundColor: '#f9fafb'
                            }}
                            dropDownContainerStyle={{
                                borderColor: '#e5e7eb',
                                borderRadius: 12,
                            }}
                            placeholder="เลือกประเภทการลา"
                        />
                    </View>

                    <Text className="text-sm font-medium mb-2 text-gray-700">ช่วงวันที่ลา</Text>
                    <View className="flex-row justify-between mb-4 gap-4">
                        <CrossPlatformDatePicker
                            label="วันที่เริ่ม"
                            value={startDate}
                            onChange={onStartDateChange}
                            maximumDate={endDate || undefined}
                        />
                        <CrossPlatformDatePicker
                            label="วันที่สิ้นสุด"
                            value={endDate}
                            onChange={onEndDateChange}
                            minimumDate={startDate || undefined}
                        />
                    </View>

                    <Text className="text-sm font-medium mb-2 text-gray-700">เหตุผลการลา</Text>
                    <TextInput
                        className="border border-gray-200 rounded-xl mb-4 p-3 text-gray-800 bg-gray-50 h-28"
                        style={{ textAlignVertical: 'top' }}
                        multiline
                        placeholder="กรอกเหตุผลโดยละเอียด..."
                        placeholderTextColor="#9ca3af"
                        value={reason}
                        onChangeText={setReason}
                    />

                    <Text className="text-sm font-medium mb-2 text-gray-700">แนบเอกสารประกอบ (สูงสุด 5 รูป)</Text>
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
                                        <Image source={{ uri: item }} className="w-24 h-24 rounded-lg border border-gray-200" resizeMode="cover" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleRemoveImage(item)} className="absolute -top-2 -right-2 bg-red-600 w-6 h-6 rounded-full items-center justify-center shadow-sm">
                                        <Ionicons name="close" size={16} color="white" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    )}

                    <TouchableOpacity onPress={handleLeaveSubmit} className="bg-indigo-600 rounded-full py-4 mt-6 shadow-md shadow-indigo-400/50 active:bg-indigo-700">
                        <Text className="text-center text-white font-bold text-lg">ส่งคำขอลา</Text>
                    </TouchableOpacity>
                    <ImagePreviewModal
                        imageUri={previewImage}
                        onClose={() => setPreviewImage(null)}
                    />
                </View>
            </ScrollView>

            {/* {previewImage && (
                <Modal visible={!!previewImage} transparent animationType="fade">
                    <View className="flex-1 bg-black/90 justify-center items-center">
                        <TouchableOpacity className="absolute top-12 right-6 z-10" onPress={() => setPreviewImage(null)}>
                            <Ionicons name="close-circle" size={40} color="white" />
                        </TouchableOpacity>
                        <Image source={{ uri: previewImage }} className="w-11/12 h-[80%] rounded-lg" resizeMode="contain" />
                    </View>
                </Modal>
            )} */}
            {/* <NavFooter /> */}

      </SafeAreaView>
    );
}

