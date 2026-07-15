import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { FC, ReactNode, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, Image, Modal, Platform, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import SignatureScreen from "react-native-signature-canvas";
import SignatureCanvas from "react-signature-canvas";
import NavFooter from "../components/NavFooter";

const screenWidth = Dimensions.get("window").width;
const thumbnailSize = (screenWidth - 32 - 16) / 3;

interface SectionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: ReactNode;
}

const SectionCard: FC<SectionCardProps> = ({ icon, title, children }) => (
  <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
    <View className="flex-row items-center mb-3">
      <Ionicons name={icon} size={22} color="#1E3A8A" />
      <Text className="text-lg font-semibold text-blue-800 ml-2">{title}</Text>
    </View>
    <View>{children}</View>
  </View>
);

const ActionButton: FC<{ title: string; onPress: () => void; disabled?: boolean }> = ({ title, onPress, disabled }) => (
    <TouchableOpacity
      className={`py-3.5 rounded-xl items-center ${disabled ? "bg-gray-400" : "bg-blue-600"}`}
      disabled={disabled}
      onPress={onPress}
    >
      <Text className="text-white text-base font-bold">{title}</Text>
    </TouchableOpacity>
);

export default function Pickup() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { jobId } = params;
  const [driverId, setDriverId] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [tempProductImages, setTempProductImages] = useState<string[]>([]);
  const [workOrderImages, setWorkOrderImages] = useState<string[]>([]);
  const [tempWorkOrderImages, setTempWorkOrderImages] = useState<string[]>([]);
  const [productModalVisible, setProductModalVisible] = useState<boolean>(false);
  const [workOrderModalVisible, setWorkOrderModalVisible] = useState<boolean>(false);
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [signerName, setSignerName] = useState<string>("");
  const [mileage, setMileage] = useState<string>(""); 
  const [signatureModalVisible, setSignatureModalVisible] = useState<boolean>(false);
  const [departureTime, setDepartureTime] = useState<Date | null>(null);
  const webSigRef = useRef<SignatureCanvas | null>(null);
  const [imageSourceModalVisible, setImageSourceModalVisible] = useState<boolean>(false);
  const [currentImageType, setCurrentImageType] = useState<"product" | "workOrder" | null>(null);
  const [loading, setLoading] = useState(false);
  
  const apiUrl = process.env.API_URL;

  useEffect(() => {
    (async () => {
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();

    const fetchDriverId = async () => {
      const id = await AsyncStorage.getItem("U_ID");
      if (id) {
        setDriverId(id);
      } else {
        console.error("ไม่พบ Driver ID ใน AsyncStorage");
        Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถระบุ ID ของผู้ขับได้ กรุณาล็อกอินใหม่อีกครั้ง");
      }
    };
    fetchDriverId();
  }, []);

  const openImageSourceModal = (imageType: "product" | "workOrder") => {
    const imageLimit = 9;
    const currentImageCount = imageType === "product" ? tempProductImages.length : tempWorkOrderImages.length;
    if (currentImageCount >= imageLimit) {
      Alert.alert(`จำกัด ${imageLimit} รูป`, `คุณสามารถอัปโหลดรูปภาพได้สูงสุด ${imageLimit} รูป`);
      return;
    }
    setCurrentImageType(imageType);
    setImageSourceModalVisible(true);
  };

  const handleImageSelection = (result: ImagePicker.ImagePickerResult, imageType: "product" | "workOrder") => {
    if (!result.canceled && result.assets) {
      const uri = result.assets[0].uri;
      if (imageType === "product") {
        setTempProductImages((prev) => [...prev, uri]);
      } else {
        setTempWorkOrderImages((prev) => [...prev, uri]);
      }
    }
  };

  const handleTakePhoto = async () => {
    if (!currentImageType) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: false });
    setImageSourceModalVisible(false);
    handleImageSelection(result, currentImageType);
    setCurrentImageType(null);
  };

  const handlePickFromGallery = async () => {
    if (!currentImageType) return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
    setImageSourceModalVisible(false);
    handleImageSelection(result, currentImageType);
    setCurrentImageType(null);
  };

  const handleImagePress = (uri: string): void => {
    setPreviewUri(uri);
    setPreviewVisible(true);
  };

  const saveProductImages = (): void => {
    setProductImages(tempProductImages);
    setProductModalVisible(false);
  };

  const saveWorkOrderImages = (): void => {
    setWorkOrderImages(tempWorkOrderImages);
    setWorkOrderModalVisible(false);
  };

  const handleSignature = (sig: string): void => {
    if (!signerName.trim()) {
      Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกชื่อผู้รับผิดชอบ");
      return;
    }
    setSignature(sig);
    setSignatureModalVisible(false);
  };

  const handleWebSignature = (): void => {
    if (!signerName.trim()) {
      Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกชื่อผู้รับผิดชอบ");
      return;
    }
    if (webSigRef.current?.isEmpty()) {
      Alert.alert("ผิดพลาด", "กรุณาเซ็นชื่อก่อนบันทึก");
      return;
    }
    const base64 = webSigRef.current?.getTrimmedCanvas().toDataURL("image/png") || "";
    setSignature(base64);
    setSignatureModalVisible(false);
  };

  const handleStartDelivery = async (): Promise<void> => {
    if (!signature || !signerName || productImages.length === 0 || workOrderImages.length === 0) {
      Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกชื่อผู้รับผิดชอบ, เพิ่มรูปภาพ และลายเซ็นให้ครบถ้วน");
      return;
    }
    if (!jobId || !driverId) {
      Alert.alert("ข้อมูลไม่ถูกต้อง", "ไม่พบรหัสงาน (JobID) หรือรหัสผู้ขับ (DriverID)");
      return;
    }

    setLoading(true);
    const now = new Date();
    const formData = new FormData();

    formData.append("signature", signature);
    formData.append("signerName", signerName);
    formData.append("departureTime", now.toISOString());
    formData.append("jobId", jobId as string);
    formData.append("driverId", driverId as string);
    formData.append("status", "in_progress");

    if (Platform.OS === 'web') {
        const fetchAsBlob = (uri: string) => fetch(uri).then((res) => res.blob());
        await Promise.all([
            ...productImages.map(async (uri, index) => {
                const blob = await fetchAsBlob(uri);
                formData.append('productImages', blob, `product_${index}.jpg`);
            }),
            ...workOrderImages.map(async (uri, index) => {
                const blob = await fetchAsBlob(uri);
                formData.append('workOrderImages', blob, `workorder_${index}.jpg`);
            })
        ]);

    } else {
        productImages.forEach((uri) => {
            const uriParts = uri.split("/");
            const fileName = uriParts.pop() || "image.jpg";
            const fileType = `image/${fileName.split(".").pop()}`;
            formData.append("productImages", {
                uri: uri,
                name: fileName,
                type: fileType,
            } as any);
        });

        workOrderImages.forEach((uri) => {
            const uriParts = uri.split("/");
            const fileName = uriParts.pop() || "image.jpg";
            const fileType = `image/${fileName.split(".").pop()}`;
            formData.append("workOrderImages", {
                uri: uri,
                name: fileName,
                type: fileType,
            } as any);
        });
    }
    
    try {
        const response = await fetch(`${apiUrl}/api/delivery/start-delivery`, {
            method: "POST",
            body: formData,
        });
        const result = await response.json();

        if (response.ok) {
            setDepartureTime(now);
            Alert.alert(
                "เริ่มการจัดส่งสำเร็จ",
                `บันทึกเวลาเริ่มงาน: ${now.toLocaleString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.`
            );
        } else {
            throw new Error(result.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
    } catch (error) {
        console.error("Failed to start delivery:", error);
        Alert.alert("เกิดข้อผิดพลาด", (error as Error).message);
    } finally {
        setLoading(false);
    }
  };

  const handleArrival = (): void => {
    if (!jobId || !driverId) {
      Alert.alert("เกิดข้อผิดพลาด", "ไม่พบข้อมูลงาน (Job ID) หรือคนขับ (Driver ID)");
      return;
    }

    const now = new Date();
    console.log(`Arrived at destination at: ${now.toISOString()}`);
    Alert.alert(
      "ถึงที่หมาย",
      `บันทึกเวลาถึงที่หมาย: ${now.toLocaleString("th-TH", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })} น.`
    );
    router.push({
      pathname: "../pages/Loading",
      params: { 
        jobId: jobId as string, 
        driverId: driverId
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 bg-slate-100">
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <View className="p-4">
            <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">บันทึกการขึ้นสินค้า</Text>

            <SectionCard icon="camera" title="รูปภาพสินค้า">
              {productImages.length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {productImages.map((uri, index) => (
                    <TouchableOpacity key={index} onPress={() => handleImagePress(uri)}>
                      <Image source={{ uri }} style={{ width: thumbnailSize, height: thumbnailSize, borderRadius: 12 }} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text className="text-base text-gray-500 text-center my-5">ยังไม่มีรูปภาพสินค้า</Text>
              )}
              <TouchableOpacity
                className="bg-blue-50 rounded-lg py-2.5 mt-4 items-center"
                onPress={() => {
                  setTempProductImages(productImages);
                  setProductModalVisible(true);
                }}
              >
                <Text className="text-blue-700 font-semibold">{productImages.length > 0 ? "แก้ไขรูปภาพ" : "เพิ่มรูปภาพ"}</Text>
              </TouchableOpacity>
            </SectionCard>

            <SectionCard icon="clipboard" title="ใบสั่งงาน">
              {workOrderImages.length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {workOrderImages.map((uri, index) => (
                    <TouchableOpacity key={index} onPress={() => handleImagePress(uri)}>
                      <Image source={{ uri }} style={{ width: thumbnailSize, height: thumbnailSize, borderRadius: 12 }} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text className="text-base text-gray-500 text-center my-5">ยังไม่มีรูปภาพใบสั่งงาน</Text>
              )}
              <TouchableOpacity
                className="bg-blue-50 rounded-lg py-2.5 mt-4 items-center"
                onPress={() => {
                  setTempWorkOrderImages(workOrderImages);
                  setWorkOrderModalVisible(true);
                }}
              >
                <Text className="text-blue-700 font-semibold">{workOrderImages.length > 0 ? "แก้ไขรูปภาพ" : "เพิ่มรูปภาพ"}</Text>
              </TouchableOpacity>
            </SectionCard>

            <SectionCard icon="pencil" title="ลายเซ็นผู้รับผิดชอบ">
              {signature ? (
                <Image source={{ uri: signature }} className="w-full h-36 bg-gray-50 border border-gray-200 rounded-lg" resizeMode="contain" />
              ) : (
                <Text className="text-base text-gray-500 text-center my-5">ยังไม่มีลายเซ็น</Text>
              )}
              <TouchableOpacity
                className="bg-blue-50 rounded-lg py-2.5 mt-4 items-center"
                onPress={() => setSignatureModalVisible(true)}
              >
                <Text className="text-blue-700 font-semibold">{signature ? "แก้ไขลายเซ็น" : "เพิ่มลายเซ็น"}</Text>
              </TouchableOpacity>
            </SectionCard>

            <SectionCard icon="speedometer-outline" title="เลขไมล์ (กม.)">
              <TextInput
                className="border border-gray-300 rounded-lg p-3 text-base"
                placeholder="กรอกเลขไมล์ปัจจุบัน"
                value={mileage}
                onChangeText={setMileage}
                keyboardType="number-pad"
              />
            </SectionCard>
          </View>
        </ScrollView>
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          {departureTime ? (
            <View className="items-center">
              <Text className="text-gray-600 font-medium mb-2">
                ออกเดินทางเมื่อ: {departureTime.toLocaleString("th-TH", {
                  year: 'numeric', month: 'short', day: 'numeric',
                  hour: "2-digit", minute: "2-digit",
                })} น.
              </Text>
              <TouchableOpacity
                onPress={handleArrival}
                className="w-full py-3.5 rounded-xl items-center bg-green-600"
              >
                <Text className="text-white text-base font-bold">ถึงจุดลงสินค้า</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className={`py-3.5 rounded-xl items-center flex-row justify-center ${!signature || productImages.length === 0 || workOrderImages.length === 0 || loading ? "bg-gray-400" : "bg-blue-600"}`}
              disabled={!signature || productImages.length === 0 || workOrderImages.length === 0 || loading}
              onPress={handleStartDelivery}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text className="text-white text-base font-bold ml-2">กำลังบันทึก...</Text>
                </>
              ) : (
                <Text className="text-white text-base font-bold">เริ่มส่งของ</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
        <Modal visible={productModalVisible} animationType="slide" onRequestClose={() => setProductModalVisible(false)}>
          <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-xl font-bold">จัดการรูปภาพสินค้า</Text>
              <TouchableOpacity onPress={() => setProductModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <TouchableOpacity className="flex-row items-center justify-center bg-green-50 border border-green-200 rounded-xl py-3 mb-4" onPress={() => openImageSourceModal('product')}>
                <Ionicons name="add-circle-outline" size={24} color="#166534" />
                <Text className="text-green-800 text-base font-semibold ml-2">เพิ่มรูปภาพ</Text>
              </TouchableOpacity>
              <View className="flex-row flex-wrap gap-2">
                {tempProductImages.map((uri, index) => (
                  <View key={index}>
                    <Image source={{ uri }} style={{ width: thumbnailSize, height: thumbnailSize, borderRadius: 12 }} />
                    <TouchableOpacity
                      className="absolute -top-1.5 -right-1.5"
                      onPress={() => {
                        const updated = tempProductImages.filter((_, i) => i !== index);
                        setTempProductImages(updated);
                      }}
                    >
                      <Ionicons name="close-circle" size={26} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
            <View className="p-4 border-t border-gray-200">
              <ActionButton title="บันทึกรูปภาพ" onPress={saveProductImages} />
            </View>
          </SafeAreaView>
        </Modal>
        <Modal visible={workOrderModalVisible} animationType="slide" onRequestClose={() => setWorkOrderModalVisible(false)}>
          <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-xl font-bold">จัดการรูปภาพใบสั่งงาน</Text>
              <TouchableOpacity onPress={() => setWorkOrderModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <TouchableOpacity className="flex-row items-center justify-center bg-green-50 border border-green-200 rounded-xl py-3 mb-4" onPress={() => openImageSourceModal('workOrder')}>
                <Ionicons name="add-circle-outline" size={24} color="#166534" />
                <Text className="text-green-800 text-base font-semibold ml-2">เพิ่มรูปภาพ</Text>
              </TouchableOpacity>
              <View className="flex-row flex-wrap gap-2">
                {tempWorkOrderImages.map((uri, index) => (
                  <View key={index}>
                    <Image source={{ uri }} style={{ width: thumbnailSize, height: thumbnailSize, borderRadius: 12 }} />
                    <TouchableOpacity
                      className="absolute -top-1.5 -right-1.5"
                      onPress={() => {
                        const updated = tempWorkOrderImages.filter((_, i) => i !== index);
                        setTempWorkOrderImages(updated);
                      }}
                    >
                      <Ionicons name="close-circle" size={26} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
            <View className="p-4 border-t border-gray-200">
              <ActionButton title="บันทึกรูปภาพ" onPress={saveWorkOrderImages} />
            </View>
          </SafeAreaView>
        </Modal>

        <Modal visible={signatureModalVisible} animationType="slide" onRequestClose={() => setSignatureModalVisible(false)}>
          <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-xl font-bold">ลายเซ็นและชื่อผู้รับผิดชอบ</Text>
              <TouchableOpacity onPress={() => setSignatureModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <View className="mb-4">
                  <Text className="text-base font-semibold text-gray-700 mb-2">ชื่อผู้รับผิดชอบ</Text>
                  <TextInput
                      className="border border-gray-300 rounded-lg p-3 text-base"
                      placeholder="กรอกชื่อ-นามสกุล"
                      value={signerName}
                      onChangeText={setSignerName}
                  />
              </View>
              {Platform.OS === 'web' ? (
                <>
                  <SignatureCanvas
                    ref={webSigRef}
                    penColor="black"
                    backgroundColor="#F3F4F6"
                    canvasProps={{ width: screenWidth - 32, height: 250, className: "rounded-lg" }}
                  />
                  <View className="flex-row justify-around mt-5 gap-4">
                    <TouchableOpacity className="flex-1 py-3 bg-gray-200 rounded-lg items-center" onPress={() => webSigRef.current?.clear()}>
                    <Text className="font-semibold text-gray-700">ล้าง</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 py-3 bg-blue-600 rounded-lg items-center" onPress={handleWebSignature}>
                    <Text className="font-semibold text-white">บันทึก</Text>
                    </TouchableOpacity>
                  </View>
                </>
                ) : (
                  <SignatureScreen
                  onOK={handleSignature}
                  descriptionText=""
                  clearText="ล้าง"
                  confirmText="บันทึก"
                  webStyle={`.m-signature-pad { box-shadow: none; border: 1px solid #E5E7EB; border-radius: 12px; }`}
                />
                )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
        <Modal visible={previewVisible} transparent animationType="fade" onRequestClose={() => setPreviewVisible(false)}>
          <View className="flex-1 bg-black/80 justify-center items-center">
            <Image source={{ uri: previewUri! }} className="w-full h-4/5" resizeMode="contain" />
            <TouchableOpacity className="absolute top-12 right-5" onPress={() => setPreviewVisible(false)}>
              <Ionicons name="close-circle" size={40} color="white" />
            </TouchableOpacity>
          </View>
        </Modal>

        <Modal
          visible={imageSourceModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setImageSourceModalVisible(false)}
        >
          <TouchableOpacity style={{flex: 1}} activeOpacity={1} onPressOut={() => setImageSourceModalVisible(false)}>
            <View className="flex-1 justify-end" pointerEvents="box-none">
              <View className="bg-white rounded-t-2xl p-4 shadow-lg">
                <Text className="text-lg font-bold text-center mb-4 text-gray-800">เลือกช่องทาง</Text>
                <TouchableOpacity
                  className="flex-row items-center bg-blue-50 rounded-lg p-3.5 mb-3"
                  onPress={handleTakePhoto}
                >
                  <Ionicons name="camera-outline" size={24} color="#1E3A8A" />
                  <Text className="text-blue-800 font-semibold ml-3 text-base">ถ่ายรูป</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-row items-center bg-blue-50 rounded-lg p-3.5 mb-4"
                  onPress={handlePickFromGallery}
                >
                  <Ionicons name="image-outline" size={24} color="#1E3A8A" />
                  <Text className="text-blue-800 font-semibold ml-3 text-base">เลือกจากอัลบั้ม</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-gray-200 rounded-lg py-3 items-center"
                  onPress={() => setImageSourceModalVisible(false)}
                >
                  <Text className="text-gray-800 font-bold">ยกเลิก</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
      <NavFooter />
    </SafeAreaView>
  );
}