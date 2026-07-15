import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert, Dimensions, Image,
  Modal,
  Platform, ScrollView, Text, TextInput,
  TouchableOpacity, View,
} from "react-native";
import SignatureScreen from "react-native-signature-canvas";
import SignatureCanvas from "react-signature-canvas";
import NavFooter from "../components/NavFooter";

export default function Productloading() {
  const router = useRouter();
  const handleStartDelivery = () => {
     router.push("/pages/jobSummaryPage")
  };
  const [modalVisible, setModalVisible] = useState(false);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const handleImagePress = (uri: string) => {
    setPreviewUri(uri);
    setPreviewVisible(true);
  };

  const [job, setJob] = useState<{
    title: string;
    pickup: string;
    dropoff: string;
    distance: number;
    price: number;
  } | null>(null);

  const [showSignature, setShowSignature] = useState(false);

  const screenWidth = Dimensions.get("window").width;
  const webSigRef = useRef<any>(null);
  // เวลาเช็คอิน
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const handleCheckIn = () => {
    setCheckInTime(new Date());
  };

  useEffect(() => {
    const init = async () => {
      const saved = await AsyncStorage.getItem("ProductImageUris");
      if (saved) setImageUris(JSON.parse(saved));

      const jobData = {
        title: "ส่งของไป Big C วงสว่าง",
        pickup: "ถนน. วงสว่าง 123",
        dropoff: "Big C วงสว่าง ชั้น 3",
        distance: 5.2,
        price: 150,
      };

      setJob(jobData);
    };
    init();
  }, []);


  //ช่องใส่รูปสินค้า
  const [tempImageUris, setTempImageUris] = useState<string[]>([]);

  // --- เพิ่ม state เก็บ metadata รูปสินค้า ---
  const [photoMetadata, setPhotoMetadata] = useState<
    { uri: string; latitude: number; longitude: number }[]
  >([]);

  // --- เพิ่ม state เก็บ metadata รูปเลขไมล์ ---
  const [mileagePhotoMetadata, setMileagePhotoMetadata] = useState<
    { uri: string; latitude: number; longitude: number }[]
  >([]);

  // --- ฟังก์ชันถ่ายรูปพร้อมบันทึกพิกัด สำหรับรูปสินค้า ---
  const pickImageFromModalWithLocation = async () => {
    if (tempImageUris.length >= 5) {
      Alert.alert("จำกัดรูปภาพ", "คุณสามารถเพิ่มรูปได้สูงสุด 5 รูปเท่านั้น");
      return;
    }

     const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("ขอพิกัดไม่สำเร็จ", "ไม่ได้รับสิทธิ์ใช้งาน GPS");
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setPhotoMetadata((prev) => [
          ...prev,
          {
            uri,
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          },
        ]);
      } catch (err) {
        console.log("❌ เกิดข้อผิดพลาดขณะดึงพิกัด", err);
      }

      setTempImageUris((prev) => [...prev, uri]);
    }
  };

  // --- ฟังก์ชันถ่ายรูปพร้อมบันทึกพิกัด สำหรับรูปเลขไมล์ ---
  const takeMileagePhotoWithLocation = async () => {
    if (tempMileageImages.length >= 5) {
      Alert.alert("จำกัดจำนวนรูป", "สามารถใส่รูปได้สูงสุด 5 รูป");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("ขอพิกัดไม่สำเร็จ", "ไม่ได้รับสิทธิ์ใช้งาน GPS");
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setMileagePhotoMetadata((prev) => [
          ...prev,
          {
            uri,
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          },
        ]);
      } catch (err) {
        console.log("❌ เกิดข้อผิดพลาดขณะดึงพิกัด", err);
      }

      setTempMileageImages((prev) => [...prev, uri]);
    }
  };

  // --- ฟังก์ชันลบรูปสินค้า พร้อมลบ metadata ---
  const handleRemoveImage = (index: number) => {
    const updatedUris = [...tempImageUris];
    const removedUri = updatedUris.splice(index, 1)[0];
    setTempImageUris(updatedUris);

    setPhotoMetadata((prev) => prev.filter((item) => item.uri !== removedUri));
  };

  // --- ฟังก์ชันลบรูปเลขไมล์ พร้อมลบ metadata ---
  const handleRemoveMileageImage = (index: number) => {
    const updatedUris = [...tempMileageImages];
    const removedUri = updatedUris.splice(index, 1)[0];
    setTempMileageImages(updatedUris);

    setMileagePhotoMetadata((prev) =>
      prev.filter((item) => item.uri !== removedUri)
    );
  };

  // รูปสินค้า
  const saveImages = async () => {
    setImageUris(tempImageUris);
    await AsyncStorage.setItem("ProductImageUris", JSON.stringify(tempImageUris));
    setModalVisible(false);
    Alert.alert("บันทึกแล้ว", "รูปภาพถูกบันทึกเรียบร้อยแล้ว");
  };

  // รูปเลขไมล์
  const saveMileageImages = () => {
    setMileageImageUris(tempMileageImages);
    setMileageModalVisible(false);
    Alert.alert("บันทึกแล้ว", "รูปเลขไมล์ถูกบันทึกแล้ว");
  };



  // เปิดโมเดล แล้วก็ย้ายรูปปัจจุบันไปเก็บใน temp
  const openModal = () => {
    setTempImageUris(imageUris); // โหลดรูปที่บันทึกล่าสุดเข้า temp
    setModalVisible(true);
  };


  // ปุ่มเพิ่มรูปใหม่ (ใน Modal) แก้ไขให้เพิ่มใน tempImageUris แทน imageUris
  const pickImageFromModal = async () => {
    if (tempImageUris.length >= 5) {
      Alert.alert("จำกัดรูปภาพ", "คุณสามารถเพิ่มรูปได้สูงสุด 5 รูปเท่านั้น");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const updatedUris = [...tempImageUris, uri];
      setTempImageUris(updatedUris);
    }
  };
  //เลขไมล์
  const [mileageModalVisible, setMileageModalVisible] = useState(false);
  const [mileageImageUris, setMileageImageUris] = useState<string[]>([]);
  const [tempMileageImages, setTempMileageImages] = useState<string[]>([]);
  const [mileageText, setMileageText] = useState("");

  // ใบสั่งงาน
  const [orderImageUris, setOrderImageUris] = useState<string[]>([]);
  const [tempOrderImageUris, setTempOrderImageUris] = useState<string[]>([]);
  const [orderModalVisible, setOrderModalVisible] = useState(false);

  const takeOrderPhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("กรุณาอนุญาตการใช้กล้อง");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.5,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setTempOrderImageUris((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const takeMileagePhoto = async () => {
    if (tempMileageImages.length >= 5) {
      Alert.alert("จำกัดจำนวนรูป", "สามารถใส่รูปได้สูงสุด 5 รูป");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setTempMileageImages([...tempMileageImages, uri]);
    }
  };

  const handleSignature = (sig: string) => {
    setSignature(sig);
    setShowSignature(false);
  };

  const handleSubmit = async () => {
    try {
      if (!signature || imageUris.length === 0) {
        Alert.alert("กรุณาถ่ายรูป และเซ็นชื่อให้ครบ");
        return;
      }

      const formData = new FormData();
      imageUris.forEach((uri, index) => {
        const filename = uri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename || "");
        const type = match ? `image/${match[1]}` : `image`;

        formData.append("images", {
          uri,
          name: filename,
          type,
        } as any);
      });

      formData.append("signature", signature);

      const response = await fetch("http://192.168.1.74:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      console.log("📦 อัปโหลดเสร็จแล้ว:", result);
      Alert.alert("สำเร็จ", "ส่งข้อมูลเรียบร้อยแล้ว");

      // เคลียร์รูป ลายเซ็น และตำแหน่งหลังส่งเสร็จ
      setImageUris([]);
      setSignature(null);
      await AsyncStorage.removeItem("ProductImageUris");
    } catch (error) {
      console.error("❌ ส่งข้อมูลล้มเหลว:", error);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถส่งข้อมูลได้");
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 bg-blue-50 p-4">
        <Text className="text-xl font-bold text-blue-600 text-center mb-4">
          รายละเอียดการส่งงาน
        </Text>
        {job && (
          <View className="bg-white rounded-xl p-4 mb-4 shadow">
            <Text className="text-base font-semibold text-blue-500 mb-1">
              {job.title}
            </Text>
            <Text className="text-sm text-gray-700">
              📍 จุดรับ: {job.pickup}
            </Text>
            <Text className="text-sm text-gray-700">
              📦 จุดส่ง: {job.dropoff}
            </Text>
            <Text className="text-sm text-gray-700">
              📏 ระยะทาง: {job.distance} กม.
            </Text>
            <Text className="text-sm text-gray-700">
              💰 ค่าจ้าง: {job.price} บาท
            </Text>
          </View>
        )}

        <View className="bg-white rounded-xl p-4 shadow mb-10">
          <Text className="text-base font-semibold text-blue-500 mb-2">
            ถึงจุดส่งงานแล้ว
          </Text>
          <Text className="text-black-500">กรุณาถ่ายรูปลงสินค้า</Text>

          {/* กล่องแตะเพื่อเปิด Modal ดูรูปทั้งหมด */}
          <TouchableOpacity
            onPress={openModal}
            className="bg-gray-100 h-40 rounded-lg justify-center items-center mb-4"
          >
            <Text className="text-gray-500">แตะเพื่อดูรูปภาพ</Text>
          </TouchableOpacity>

          {/* แสดงรูปภาพทั้งหมดที่บันทึกไว้ (imageUris) */}
          {imageUris.length > 0 && (
            <ScrollView horizontal className="mb-4">
    {tempImageUris.length > 0 ? (
      tempImageUris.map((uri, index) => {
        const meta = photoMetadata.find((item) => item.uri === uri);
        return (
          <View key={index} className="relative mr-2 items-center">
            <Image
              source={{ uri }}
              className="w-28 h-28 rounded-lg"
              resizeMode="cover"
            />
            <TouchableOpacity
              className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
              onPress={() => handleRemoveImage(index)}
            >
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
            {meta && (
              <Text className="text-xs text-gray-600 mt-1 text-center">
                📍 {meta.latitude.toFixed(5)}, {meta.longitude.toFixed(5)}
              </Text>
            )}
          </View>
        );
      })
    ) : (
      <Text className="text-gray-400 self-center">ยังไม่มีรูปภาพ</Text>
    )}
  </ScrollView>
              
          )}

          {/* Modal */}
          <Modal visible={modalVisible} animationType="slide">
            <View className="flex-1 bg-white p-4">
              <Text className="text-center font-bold text-lg mb-4">
                รูปภาพทั้งหมด
              </Text>

               <TouchableOpacity
    className="bg-blue-100 py-3 rounded-lg mb-4"
    onPress={pickImageFromModalWithLocation}
  >
    <Text className="text-blue-700 font-medium text-center">➕ ใส่รูปภาพ</Text>
  </TouchableOpacity>

              <ScrollView horizontal className="mb-4">
    {tempImageUris.length > 0 ? (
      tempImageUris.map((uri, index) => {
        const meta = photoMetadata.find((item) => item.uri === uri);
        return (
          <View key={index} className="relative mr-2 items-center">
            <Image
              source={{ uri }}
              className="w-28 h-28 rounded-lg"
              resizeMode="cover"
            />
            <TouchableOpacity
              className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
              onPress={() => handleRemoveImage(index)}
            >
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
            
          </View>
        );
      })
    ) : (
      <Text className="text-gray-400 self-center">ยังไม่มีรูปภาพ</Text>
    )}
  </ScrollView>
              
              <View className="mt-auto">
                <TouchableOpacity
                  className="bg-blue-600 py-3 rounded-lg mb-3"
                  onPress={saveImages}
                >
                  <Text className="text-white font-bold text-center">
                    บันทึก
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-gray-300 py-3 rounded-lg"
                  onPress={() => setModalVisible(false)}
                >
                  <Text className="text-black text-center font-medium">
                    ปิด
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <View>
            <Text className="text-black-500">กรุณาถ่ายรูปเลขไมล์</Text>
          </View>

          {/* กล่องใส่รูปเลขไมล์ */}
          <TouchableOpacity
            onPress={() => {
              setTempMileageImages(mileageImageUris);
              setMileageModalVisible(true);
            }}
            className="bg-gray-100 h-40 rounded-lg justify-center items-center mb-2"
          >
            {/* ไม่แสดงรูปในกล่องนี้เลย */}
            <Text className="text-gray-500">แตะเพื่อใส่รูปเลขไมล์</Text>
          </TouchableOpacity>

          {/* แสดงรูปทั้งหมดใต้กล่อง */}
          {mileageImageUris.length > 0 && (
            <ScrollView horizontal className="mb-4">
    {tempMileageImages.length > 0 ? (
      tempMileageImages.map((uri, index) => {
        const meta = mileagePhotoMetadata.find((item) => item.uri === uri);
        return (
          <View key={index} className="relative mr-2 items-center">
            <Image
              source={{ uri }}
              className="w-28 h-28 rounded-lg"
              resizeMode="cover"
            />
            <TouchableOpacity
              className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
              onPress={() => handleRemoveMileageImage(index)}
            >
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
            {meta && (
              <Text className="text-xs text-gray-600 mt-1 text-center">
                📍 {meta.latitude.toFixed(5)}, {meta.longitude.toFixed(5)}
              </Text>
            )}
          </View>
        );
      })
    ) : (
      <Text className="text-gray-400 self-center">ยังไม่มีรูป</Text>
    )}
  </ScrollView>
          )}

          {/* ✅ ช่องกรอกเลขไมล์ */}
          <View className="mb-4">
            <Text className="font-medium mb-1">กรุณากรอกเลขไมล์</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2"
              placeholder="เลขไมล์"
              keyboardType="numeric"
              value={mileageText}
              onChangeText={setMileageText}
            />
          </View>
          <Modal visible={mileageModalVisible} animationType="slide">
            <View className="flex-1 bg-white p-4">
              <Text className="text-center font-bold text-lg mb-4">
                รูปเลขไมล์
              </Text>

              {/* ปุ่มถ่ายรูปใหม่ */}
               <TouchableOpacity
    className="bg-blue-100 py-3 rounded-lg mb-4"
    onPress={takeMileagePhotoWithLocation}
  >
    <Text className="text-blue-700 font-medium text-center">➕ ถ่ายรูปใหม่</Text>
  </TouchableOpacity>
              {/* แสดงรูปที่ถ่าย (temp) */}
             <ScrollView horizontal className="mb-4">
    {tempMileageImages.length > 0 ? (
      tempMileageImages.map((uri, index) => {
        const meta = mileagePhotoMetadata.find((item) => item.uri === uri);
        return (
          <View key={index} className="relative mr-2 items-center">
            <Image
              source={{ uri }}
              className="w-28 h-28 rounded-lg"
              resizeMode="cover"
            />
            <TouchableOpacity
              className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
              onPress={() => handleRemoveMileageImage(index)}
            >
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
            
          </View>
        );
      })
    ) : (
      <Text className="text-gray-400 self-center">ยังไม่มีรูป</Text>
    )}
  </ScrollView>

              {/* ปุ่มบันทึก */}
              <TouchableOpacity
                className="bg-blue-600 py-3 rounded-lg mb-3"
                onPress={() => {
                  setMileageImageUris(tempMileageImages); // ✅ ย้ายรูปมาจริงตอนนี้
                  setMileageModalVisible(false);
                  Alert.alert("บันทึกแล้ว", "รูปเลขไมล์ถูกบันทึกแล้ว");
                }}
              >
                <Text className="text-white font-bold text-center">บันทึก</Text>
              </TouchableOpacity>

              {/* ปุ่มปิด */}
              <TouchableOpacity
                className="bg-gray-300 py-3 rounded-lg"
                onPress={() => setMileageModalVisible(false)}
              >
                <Text className="text-black text-center font-medium">ปิด</Text>
              </TouchableOpacity>
            </View>
          </Modal>

          <TouchableOpacity
            className="bg-blue-100 py-2 px-4 rounded mb-4"
            onPress={() => setShowSignature(true)}
          >
            <Text className="text-blue-700 font-semibold text-center">
              เซ็นชื่อรับของ
            </Text>
          </TouchableOpacity>

          <View className="w-full h-40 overflow-hidden rounded-lg bg-white">
            {signature && (
              <Image
                source={{ uri: `data:image/png;base64,${signature}` }}
                className="w-full h-full object-contain"
              />
            )}
          </View>

           <View className="p-4">
      <TouchableOpacity
        onPress={handleCheckIn}
        className="bg-green-600 rounded-md px-4 py-3 flex-1 mr-2 items-center"
      >
        <Text className="text-white font-medium text-sm">เวลาลงสินค้า</Text>
      </TouchableOpacity>

      {checkInTime && (
        <Text className="text-sm text-green-700 mb-2">
          ลงสินค้าเวลา: {checkInTime.toLocaleTimeString()}
        </Text>
      )}
    </View>

          <TouchableOpacity
            className="bg-blue-600 py-3 rounded-lg mt-4"
            onPress={handleStartDelivery}
          >
            <Text className="text-white font-bold text-center">
              ส่งงานเรียบร้อย
            </Text>
          </TouchableOpacity>
        </View>
        {showSignature && (
          <Modal
            visible={showSignature}
            animationType="slide"
            transparent={false} // พื้นหลังขาวเต็มจอ
            onRequestClose={() => setShowSignature(false)} // ปิด modal บนอุปกรณ์ Android
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "white",
                padding: 16,
              }}
            >
              {/* ❌ ปุ่มปิด popup */}
              <TouchableOpacity
                onPress={() => setShowSignature(false)}
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  backgroundColor: "#00000066",
                  borderRadius: 20,
                  padding: 6,
                  zIndex: 9999,
                }}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>

              <Text className="text-center font-bold text-lg mb-2">
                เซ็นในกรอบด้านล่าง
              </Text>

              {Platform.OS === "web" ? (
                <>
                  <SignatureCanvas
                    ref={(ref) => {
                      webSigRef.current = ref;
                    }}
                    penColor="black"
                    backgroundColor="#fff"
                    canvasProps={{
                      width: screenWidth - 32,
                      height: 200,
                      className: "sigCanvas",
                    }}
                  />

                  <View className="flex-row justify-around mt-4">
                    <TouchableOpacity
                      onPress={() => webSigRef.current.clear()}
                      className="bg-gray-200 px-4 py-2 rounded"
                    >
                      <Text>ล้าง</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        if (!webSigRef.current || webSigRef.current.isEmpty()) {
                          Alert.alert("กรุณาเซ็นก่อนบันทึก");
                        } else {
                          const canvas = webSigRef.current.getTrimmedCanvas?.();
                          if (!canvas) {
                            Alert.alert("ไม่สามารถบันทึกลายเซ็นได้");
                            return;
                          }
                          const base64 = canvas
                            .toDataURL("image/png")
                            .replace("data:image/png;base64,", "");
                          setSignature(base64);
                          setShowSignature(false);
                        }
                      }}
                      className="bg-blue-600 px-4 py-2 rounded"
                    >
                      <Text className="text-white">บันทึก</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <SignatureScreen
                  onOK={handleSignature}
                  onEmpty={() => Alert.alert("กรุณาเซ็นให้เรียบร้อย")}
                  descriptionText="เซ็นในกรอบด้านล่าง"
                  clearText="ล้าง"
                  confirmText="บันทึก"
                  webStyle={`.m-signature-pad--footer {display: none; margin: 0px;}`}
                />
              )}
            </View>
          </Modal>
        )}
        <Modal visible={previewVisible} transparent animationType="fade">
          <View className="flex-1 bg-black justify-center items-center">
            <Image
              source={{ uri: previewUri as any }}
              style={{
                width: "100%",
                height: "80%",
                resizeMode: "contain",
              }}
            />
            <TouchableOpacity
              onPress={() => setPreviewVisible(false)}
              className="absolute top-10 right-4"
            >
              <Ionicons name="close" size={36} color="white" />
            </TouchableOpacity>
          </View>
        </Modal>
      </ScrollView>
      <NavFooter/>
    </View>
  );
}