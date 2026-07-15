import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Dimensions, Image, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, } from "react-native";
import SignatureScreen from "react-native-signature-canvas";
import SignatureCanvas from "react-signature-canvas";
import NavFooter from "../components/NavFooter";

export default function JobDetailScreen() {
  const router = useRouter();
  const handleStartDelivery = () => {
    router.push("/pages/Productloading");
  };
  const [modalVisible, setModalVisible] = useState(false);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const handleImagePress = (uri: string) => {
    setPreviewUri(uri);
    setPreviewVisible(true);
  };

  const [signature, setSignature] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [job, setJob] = useState<{
    title: string;
    pickup: string;
    dropoff: string;
    distance: number;
    price: number;
  } | null>(null);

  const [refreshingLocation, setRefreshingLocation] = useState(false);
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
      const saved = await AsyncStorage.getItem("jobImageUris");
      if (saved) setImageUris(JSON.parse(saved));
      await getLocation();

      // mock job data (เปลี่ยนเป็น fetch จริงได้)
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

  const [tempImageUris, setTempImageUris] = useState<string[]>([]);

  const openModal = () => {
    setTempImageUris(imageUris);
    setModalVisible(true);
  };

  // ปุ่มบันทึกใน Modal
  const saveImages = async () => {
    setImageUris(tempImageUris); // เซ็ตรูปข้างนอก = รูปใน temp
    await AsyncStorage.setItem("jobImageUris", JSON.stringify(tempImageUris));
    setModalVisible(false);
    Alert.alert("บันทึกแล้ว", "รูปภาพถูกบันทึกเรียบร้อยแล้ว");
  };

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
  const [mileagePhotoMetadata, setMileagePhotoMetadata] = useState<
    { uri: string; latitude: number; longitude: number }[]
  >([]);
  const [tempMileageImages, setTempMileageImages] = useState<string[]>([]);
  const [mileageText, setMileageText] = useState("");

  // ใบสั่งงาน
  const [orderImageUris, setOrderImageUris] = useState<string[]>([]);
  const [tempOrderImageUris, setTempOrderImageUris] = useState<string[]>([]);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [orderPhotoMetadata, setOrderPhotoMetadata] = useState<
    { uri: string; latitude: number; longitude: number }[]
  >([]); // เก็บพิกัดแต่ละรูป (metadata)

  // ถ่ายรูปใบสั่งงาน///////
  const takeOrderPhoto = async () => {
    // ขอ permission กล้อง + ตำแหน่ง
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: locationStatus } =
      await Location.requestForegroundPermissionsAsync();

    if (status !== "granted" || locationStatus !== "granted") {
      Alert.alert("Permission required", "ต้องอนุญาตกล้องและตำแหน่ง");
      return;
    }

    // ถ่ายรูป
    const photo = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });

    if (!photo.canceled) {
      const uri = photo.assets[0].uri;

      // ดึงพิกัดตอนถ่าย
      const location = await Location.getCurrentPositionAsync({});
      const metadata = {
        uri,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // เก็บรูปใน temp พร้อมพิกัด
      setTempOrderImageUris((prev) => [...prev, uri]);
      setOrderPhotoMetadata((prev) => [...prev, metadata]);
    }
  };

  ////รูปเลขไมล์พร้อมพิกัด
  const takeMileagePhoto = async () => {
    if (tempMileageImages.length >= 5) {
      Alert.alert("จำกัดรูปภาพ", "สามารถเพิ่มได้สูงสุด 5 รูปเท่านั้น");
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
        console.log(
          "📍 พิกัดของรูปเลขไมล์:",
          loc.coords.latitude,
          loc.coords.longitude
        );

        // เก็บพิกัดไว้
        setMileagePhotoMetadata((prev) => [
          ...prev,
          {
            uri,
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          },
        ]);

        // เก็บรูปไว้แสดง
        setTempMileageImages((prev) => [...prev, uri]);
      } catch (err) {
        console.log("❌ เกิดข้อผิดพลาดขณะดึงพิกัดเลขไมล์", err);
      }
    }
  };

  const getLocation = async () => {
    try {
      setRefreshingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "ไม่ได้รับสิทธิ์ใช้งานตำแหน่ง",
          "กรุณาเปิด GPS และอนุญาตแอปในการใช้งานตำแหน่ง\n" +
            "ไปที่การตั้งค่า > แอป > สิทธิ์ตำแหน่ง และเปิดสิทธิ์ GPS"
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (error) {
      console.log("Location error:", error);
      Alert.alert(
        "เกิดข้อผิดพลาดในการรับตำแหน่ง",
        "โปรดลองอีกครั้งหรือเปิด GPS ก่อนใช้งาน"
      );
    } finally {
      setRefreshingLocation(false);
    }
  };

  const handleSignature = (sig: string) => {
    setSignature(sig);
    setShowSignature(false);
  };

  const openGoogleMaps = () => {
    if (location) {
      const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      Linking.openURL(url);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!signature || imageUris.length === 0 || !location) {
        Alert.alert("กรุณาถ่ายรูป เซ็นชื่อ และรับพิกัดให้ครบ");
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
      formData.append("latitude", location.latitude.toString());
      formData.append("longitude", location.longitude.toString());

      const response = await fetch("http://app.magnitudetms.com/api/upload", {
        method: "POST",
        
        body: formData,
      });

      const result = await response.json();
      console.log("📦 อัปโหลดเสร็จแล้ว:", result);
      Alert.alert("สำเร็จ", "ส่งข้อมูลเรียบร้อยแล้ว");

      setImageUris([]);
      setSignature(null);
      setLocation(null);
      await AsyncStorage.removeItem("jobImageUris");
    } catch (error) {
      console.error("❌ ส่งข้อมูลล้มเหลว:", error);
      Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถส่งข้อมูลได้");
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedTempUris = [...tempImageUris];
    const removedUri = updatedTempUris.splice(index, 1)[0];
    setTempImageUris(updatedTempUris);

    // ลบ metadata ของรูปที่ตรงกันด้วย
    setPhotoMetadata((prev) => prev.filter((item) => item.uri !== removedUri));
  };

  // รูปภาพขึ้นสินค้าพร้อมพิกัด
  const [photoMetadata, setPhotoMetadata] = useState<
    { uri: string; latitude: number; longitude: number }[]
  >([]);

  const ImageLocationFromModal = async () => {
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
        console.log(
          "📍 พิกัดของรูปนี้:",
          loc.coords.latitude,
          loc.coords.longitude
        );

        // 👇 เก็บ metadata ถ้ายังไม่ได้เก็บ
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

      const updatedUris = [...tempImageUris, uri];
      setTempImageUris(updatedUris);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 bg-blue-50 p-4">
        <Text className="text-xl font-bold text-blue-600 text-center mb-4">
          รายละเอียดงาน
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
        <View className="bg-white rounded-xl overflow-hidden mb-4 shadow">
          {location ? (
            Platform.OS === "web" ? (
              <View style={{ width: "100%", height: 200 }}>
                <iframe
                  src={`https://maps.google.com/maps?q=${location.latitude},${location.longitude}&z=15&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  title="map"
                ></iframe>
              </View>
            ) : (
              <TouchableOpacity onPress={openGoogleMaps}>
                <View className="h-48 bg-gray-200 justify-center items-center">
                  <Ionicons name="map" size={28} color="#333" />
                  <Text className="text-blue-600 mt-1">
                    เปิดดูบน Google Maps
                  </Text>
                </View>
              </TouchableOpacity>
            )
          ) : (
            <View className="items-center justify-center py-6">
              <Ionicons name="map" size={28} color="#aaa" />
              <Text className="text-sm text-gray-600 mt-2">
                ยังไม่ได้รับพิกัด
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={getLocation}
            className="bg-blue-100 py-2 items-center"
            disabled={refreshingLocation}
          >
            <Text className="text-blue-700 font-medium">
              {refreshingLocation ? "🔄 กำลังรีเฟรช..." : "🔄 รีเฟรชตำแหน่ง"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-xl p-4 shadow mb-10">
          <Text className="text-base font-semibold text-blue-500 mb-2">
            ถึงจุดรับงานแล้ว
          </Text>
          <Text className="text-black-500">กรุณาถ่ายรูปสินค้า</Text>

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
              {tempImageUris.map((uri, index) => {
                // หา metadata ของรูปนั้น
                const meta = photoMetadata.find((item) => item.uri === uri);

                return (
                  <View key={index} className="relative mr-2 items-center">
                    <Image source={{ uri }} className="w-28 h-28 rounded-lg" />

                    {/* แสดงพิกัดใต้รูป */}
                    {meta && (
                      <Text className="text-xs text-gray-600 mt-1 text-center">
                        📍 {meta.latitude.toFixed(5)},{" "}
                        {meta.longitude.toFixed(5)}
                      </Text>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Modal */}
          <Modal visible={modalVisible} animationType="slide">
            <View className="flex-1 bg-white p-4">
              <Text className="text-center font-bold text-lg mb-4">
                รูปภาพทั้งหมด
              </Text>

              <TouchableOpacity
                className="bg-green-100 py-3 rounded-lg mb-4"
                onPress={ImageLocationFromModal}
              >
                <Text className="text-green-700 font-medium text-center">
                  ถ่ายรูปพร้อมบันทึกพิกัด
                </Text>
              </TouchableOpacity>

              <ScrollView horizontal className="mb-4">
                {tempImageUris.length > 0 ? (
                  tempImageUris.map((uri, index) => (
                    <View key={index} className="relative mr-2">
                      <Image
                        source={{ uri }}
                        className="w-28 h-28 rounded-lg"
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
                        onPress={async () => {
                          const updated = tempImageUris.filter(
                            (_, i) => i !== index
                          );
                          setTempImageUris(updated);
                        }}
                      >
                        <Ionicons name="close" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text className="text-gray-400 self-center">
                    ยังไม่มีรูปภาพ
                  </Text>
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
            <Text className="text-gray-500">แตะเพื่อใส่รูปเลขไมล์</Text>
          </TouchableOpacity>

          {/* แสดงรูปทั้งหมดใต้กล่อง พร้อมพิกัดใต้รูป */}
          {mileageImageUris.length > 0 && (
            <ScrollView horizontal className="mb-4">
              {mileageImageUris.map((uri, index) => {
                const meta = mileagePhotoMetadata.find(
                  (item) => item.uri === uri
                );

                return (
                  <View key={index} className="items-center mr-2">
                    <TouchableOpacity onPress={() => handleImagePress(uri)}>
                      <Image
                        source={{ uri }}
                        className="w-28 h-28 rounded-lg"
                        resizeMode="cover"
                      />
                    </TouchableOpacity>

                    {/* แสดงพิกัดใต้รูป */}
                    {meta && (
                      <Text className="text-xs text-gray-600 mt-1 text-center">
                        📍 {meta.latitude.toFixed(5)},{" "}
                        {meta.longitude.toFixed(5)}
                      </Text>
                    )}
                  </View>
                );
              })}
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

          {/* Modal ถ่ายรูปเลขไมล์ */}
          <Modal visible={mileageModalVisible} animationType="slide">
            <View className="flex-1 bg-white p-4">
              <Text className="text-center font-bold text-lg mb-4">
                รูปเลขไมล์
              </Text>

              {/* ปุ่มถ่ายรูปใหม่ */}
              <TouchableOpacity
                className="bg-blue-100 py-3 rounded-lg mb-4"
                onPress={takeMileagePhoto}
              >
                <Text className="text-blue-700 font-medium text-center">
                  ➕ ถ่ายรูปใหม่
                </Text>
              </TouchableOpacity>

              {/* แสดงรูปที่ถ่าย (temp) */}
              <ScrollView horizontal className="mb-4">
                {tempMileageImages.length > 0 ? (
                  tempMileageImages.map((uri, index) => {
                    const metadata = mileagePhotoMetadata.find(
                      (item) => item.uri === uri
                    );

                    return (
                      <View key={index} className="relative mr-2">
                        <Image
                          source={{ uri }}
                          className="w-28 h-28 rounded-lg"
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
                          onPress={() => {
                            // ลบทั้งรูปและ metadata ที่เกี่ยวข้อง
                            const updatedImages = tempMileageImages.filter(
                              (_, i) => i !== index
                            );
                            setTempMileageImages(updatedImages);
                            setMileagePhotoMetadata((prev) =>
                              prev.filter((item) => item.uri !== uri)
                            );
                          }}
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
                  setMileageImageUris(tempMileageImages);
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
          {/* 📄 ใบสั่งงาน */}
          <View>
            <Text className="text-base font-semibold text-blue-500 mb-2">
              ใบสั่งงาน
            </Text>
            <Text className="text-black-500">กรุณาถ่ายรูปใบสั่งงาน</Text>

            {/* กล่องแสดงภาพข้างนอก */}
            <TouchableOpacity
              onPress={() => {
                setTempOrderImageUris(orderImageUris);
                setOrderModalVisible(true);
              }}
              className="bg-gray-100 h-40 rounded-lg justify-center items-center mb-4"
            >
              {/* ไม่แสดงรูปในกล่องนี้เลย */}
              <Text className="text-gray-500">แตะเพื่อถ่ายรูปใบสั่งงาน</Text>
            </TouchableOpacity>

            {orderImageUris.length > 0 && (
              <ScrollView horizontal className="mb-4">
                {orderImageUris.map((uri, index) => {
                  // หา metadata ของรูปนี้
                  const meta = orderPhotoMetadata.find(
                    (item) => item.uri === uri
                  );
                  return (
                    <View key={index} className="items-center mr-2">
                      <TouchableOpacity onPress={() => handleImagePress(uri)}>
                        <Image
                          source={{ uri }}
                          className="w-24 h-24 rounded-lg"
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                      {meta && (
                        <Text className="text-xs text-gray-600 mt-1 text-center">
                          📍 {meta.latitude.toFixed(5)},{" "}
                          {meta.longitude.toFixed(5)}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            )}

            {/* Modal สำหรับถ่ายใบสั่งงาน */}
            <Modal visible={orderModalVisible} animationType="slide">
              <View className="flex-1 bg-white p-4">
                <Text className="text-center font-bold text-lg mb-4">
                  รูปใบสั่งงาน
                </Text>

                <TouchableOpacity
                  className="bg-blue-100 py-3 rounded-lg mb-4"
                  onPress={takeOrderPhoto}
                >
                  <Text className="text-blue-700 font-medium text-center">
                    ➕ ถ่ายรูปใหม่
                  </Text>
                </TouchableOpacity>

                <ScrollView horizontal className="mb-4">
                  {tempOrderImageUris.length > 0 ? (
                    tempOrderImageUris.map((uri, index) => {
                      const meta = orderPhotoMetadata.find(
                        (item) => item.uri === uri
                      );
                      return (
                        <View
                          key={index}
                          className="relative mr-2 items-center"
                        >
                          <Image
                            source={{ uri }}
                            className="w-28 h-28 rounded-lg"
                            resizeMode="cover"
                          />
                          <TouchableOpacity
                            className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
                            onPress={() => {
                              // ลบรูปและพิกัด
                              const updatedUris = tempOrderImageUris.filter(
                                (_, i) => i !== index
                              );
                              setTempOrderImageUris(updatedUris);

                              const updatedMetadata = orderPhotoMetadata.filter(
                                (item) => item.uri !== uri
                              );
                              setOrderPhotoMetadata(updatedMetadata);
                            }}
                          >
                            <Ionicons name="close" size={16} color="white" />
                          </TouchableOpacity>
                        </View>
                      );
                    })
                  ) : (
                    <Text className="text-gray-400 self-center">
                      ยังไม่มีรูป
                    </Text>
                  )}
                </ScrollView>

                <TouchableOpacity
                  className="bg-blue-600 py-3 rounded-lg mb-3"
                  onPress={() => {
                    setOrderImageUris(tempOrderImageUris);
                    // เก็บเฉพาะพิกัดของรูปที่ยังอยู่
                    const filteredMetadata = orderPhotoMetadata.filter((meta) =>
                      tempOrderImageUris.includes(meta.uri)
                    );
                    setOrderPhotoMetadata(filteredMetadata);

                    setOrderModalVisible(false);
                    Alert.alert("บันทึกแล้ว", "รูปใบสั่งงานถูกบันทึกแล้ว");
                  }}
                >
                  <Text className="text-white font-bold text-center">
                    บันทึก
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-gray-300 py-3 rounded-lg"
                  onPress={() => setOrderModalVisible(false)}
                >
                  <Text className="text-black text-center font-medium">
                    ปิด
                  </Text>
                </TouchableOpacity>
              </View>
            </Modal>
          </View>

          <TouchableOpacity
            className="bg-blue-100 py-2 px-4 rounded mb-4"
            onPress={() => setShowSignature(true)}
          >
            <Text className="text-blue-700 font-semibold text-center">
              เซ็นชื่อ
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

          {refreshingLocation ? (
            <Text className="text-sm text-gray-400 italic">
              📍 กำลังโหลดตำแหน่ง...
            </Text>
          ) : location ? (
            <Text className="text-sm text-gray-500">
              📍 {location.latitude.toFixed(6)}°N,{" "}
              {location.longitude.toFixed(6)}
              °E
            </Text>
          ) : (
            <Text className="text-sm text-gray-400 italic">
              📍 ยังไม่ได้รับตำแหน่ง
            </Text>
          )}

          <View className="p-4">
            <TouchableOpacity
              onPress={handleCheckIn}
              className="bg-green-600 rounded-md px-4 py-3 flex-1 mr-2 items-center"
            >
              <Text className="text-white font-medium text-sm">
                เวลาขึ้นสินค้า
              </Text>
            </TouchableOpacity>

            {checkInTime && (
              <Text className="text-sm text-green-700 mb-2">
                ขึ้นสินค้าเวลา: {checkInTime.toLocaleTimeString()}
              </Text>
            )}
          </View>

          <TouchableOpacity
            disabled={!signature}
            onPress={handleStartDelivery}
            className={`${
              !signature ? "bg-gray-400" : "bg-blue-600"
            } py-3 rounded-lg mt-4`}
          >
            <Text
              className={`font-bold text-center ${
                !signature ? "text-gray-300" : "text-white"
              }`}
            >
              รับงานเรียบร้อย - เริ่มส่ง
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
              onPress={() => {
                setPreviewVisible(false);
              }}
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