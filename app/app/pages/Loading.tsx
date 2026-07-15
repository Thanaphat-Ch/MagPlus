import { Ionicons } from "@expo/vector-icons";
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

interface ActionButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean; 
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

const ActionButton: FC<ActionButtonProps> = ({ title, onPress, disabled = false, isLoading = false }) => (
  <TouchableOpacity
    className={`py-3.5 rounded-xl items-center flex-row justify-center ${disabled || isLoading ? "bg-gray-400" : "bg-blue-600"}`}
    disabled={disabled || isLoading}
    onPress={onPress}
  >
    {isLoading && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
    <Text className="text-white text-base font-bold">{title}</Text>
  </TouchableOpacity>
);

export default function Loading() {
  const router = useRouter();
  const { jobId, driverId } = useLocalSearchParams<{ jobId: string, driverId: string }>();

  const [unloadingImages, setUnloadingImages] = useState<string[]>([]);
  const [tempUnloadingImages, setTempUnloadingImages] = useState<string[]>([]);
  const [receiptImages, setReceiptImages] = useState<string[]>([]);
  const [tempReceiptImages, setTempReceiptImages] = useState<string[]>([]);
  const [recipientSignature, setRecipientSignature] = useState<string | null>(null);
  const [completionTime, setCompletionTime] = useState<Date | null>(null);
  const [deliveryMileage, setDeliveryMileage] = useState<string>("");
  const [unloadingModalVisible, setUnloadingModalVisible] = useState<boolean>(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState<boolean>(false);
  const [signatureModalVisible, setSignatureModalVisible] = useState<boolean>(false);
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [imageSourceModalVisible, setImageSourceModalVisible] = useState<boolean>(false);
  
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [currentImageType, setCurrentImageType] = useState<'unloading' | 'receipt' | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false); 

  const webSigRef = useRef<SignatureCanvas | null>(null);

  useEffect(() => {
    (async () => {
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  const openImageSourceModal = (imageType: 'unloading' | 'receipt') => {
    const imageLimit = 5;
    const currentImageCount = imageType === 'unloading' ? tempUnloadingImages.length : tempReceiptImages.length;
    if (currentImageCount >= imageLimit) {
      Alert.alert(`จำกัด ${imageLimit} รูป`, `คุณสามารถอัปโหลดรูปภาพได้สูงสุด ${imageLimit} รูป`);
      return;
    }
    setCurrentImageType(imageType);
    setImageSourceModalVisible(true);
  };

  const handleImageSelection = (uri: string) => {
    if (currentImageType === 'unloading') {
        setTempUnloadingImages(prev => [...prev, uri]);
    } else {
        setTempReceiptImages(prev => [...prev, uri]);
    }
    setCurrentImageType(null);
  };

  const handleTakePhoto = async () => {
    if (!currentImageType) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    setImageSourceModalVisible(false);
    if (!result.canceled && result.assets) {
      handleImageSelection(result.assets[0].uri);
    }
  };

  const handlePickFromGallery = async () => {
    if (!currentImageType) return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6, allowsMultipleSelection: false });
    setImageSourceModalVisible(false);
    if (!result.canceled && result.assets) {
      handleImageSelection(result.assets[0].uri);
    }
  };

  const handleImagePress = (uri: string): void => {
    setPreviewUri(uri);
    setPreviewVisible(true);
  };
  
  const saveUnloadingImages = (): void => {
    setUnloadingImages(tempUnloadingImages);
    setUnloadingModalVisible(false);
  };

  const saveReceiptImages = (): void => {
    setReceiptImages(tempReceiptImages);
    setReceiptModalVisible(false);
  };

  const handleSignature = (sig: string): void => {
    setRecipientSignature(sig);
    setSignatureModalVisible(false);
  };

  const handleWebSignature = (): void => {
    if (webSigRef.current?.isEmpty()) {
      Alert.alert("ผิดพลาด", "กรุณาเซ็นชื่อก่อนบันทึก");
      return;
    }
    const base64 = webSigRef.current?.getTrimmedCanvas().toDataURL("image/png") || "";
    setRecipientSignature(base64);
    setSignatureModalVisible(false);
  };

  const handleCompleteDelivery = async (): Promise<void> => {
    if (!recipientSignature || unloadingImages.length === 0 || receiptImages.length === 0) {
      Alert.alert("ข้อมูลไม่ครบ", "กรุณาเพิ่มรูปภาพและลายเซ็นผู้รับสินค้าให้ครบถ้วน");
      return;
    }

    setIsLoading(true);
    const now = new Date();
    const formData = new FormData();

    formData.append('recipientSignature', recipientSignature);
    formData.append('completionTime', now.toISOString());
    formData.append('jobId', jobId as string);
    formData.append('driverId', driverId as string);

    if (Platform.OS === 'web') {
      const fetchAsBlob = (uri: string) => fetch(uri).then((res) => res.blob());
        
      try {
        await Promise.all([
          ...unloadingImages.map(async (uri, index) => {
            const blob = await fetchAsBlob(uri);
            formData.append('unloadingImages', blob, `unloading_${index}.jpg`);
          }),
          ...receiptImages.map(async (uri, index) => {
            const blob = await fetchAsBlob(uri);
            formData.append('receiptImages', blob, `receipt_${index}.jpg`);
          })
        ]);
      } catch (error) {
          console.error("Error fetching images as blob:", error);
          Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถแปลงไฟล์รูปภาพสำหรับเว็บได้");
          setIsLoading(false);
          return;
      }

    } else {
      unloadingImages.forEach((uri, index) => {
        const uriParts = uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('unloadingImages', {
          uri,
          name: `unloading_${index}.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      });

      receiptImages.forEach((uri, index) => {
        const uriParts = uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('receiptImages', {
          uri,
          name: `receipt_${index}.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      });
    }

    try {
      const apiUrl = process.env.API_URL || 'http://localhost:3000';
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
       });
      const result = await response.json();

        if (response.ok) {
          router.push('../pages/historyPage');
        } else {
          throw new Error(result.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }

    } catch (error) {
      console.error("Failed to complete delivery:", error);
      Alert.alert("เกิดข้อผิดพลาด", (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 bg-slate-100">
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <View className="p-4">
            <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">บันทึกการลงสินค้า</Text>
            <SectionCard icon="camera" title="รูปภาพสินค้า (หลังลงของ)">
              {unloadingImages.length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {unloadingImages.map((uri, index) => (
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
                onPress={() => { setTempUnloadingImages(unloadingImages); setUnloadingModalVisible(true); }}
              >
                <Text className="text-blue-700 font-semibold">{unloadingImages.length > 0 ? "แก้ไขรูปภาพ" : "เพิ่มรูปภาพ"}</Text>
              </TouchableOpacity>
            </SectionCard>
            <SectionCard icon="document-text" title="ใบรับสินค้า/เอกสาร">
              {receiptImages.length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {receiptImages.map((uri, index) => (
                    <TouchableOpacity key={index} onPress={() => handleImagePress(uri)}>
                      <Image source={{ uri }} style={{ width: thumbnailSize, height: thumbnailSize, borderRadius: 12 }} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text className="text-base text-gray-500 text-center my-5">ยังไม่มีรูปภาพใบรับสินค้า</Text>
              )}
              <TouchableOpacity
                className="bg-blue-50 rounded-lg py-2.5 mt-4 items-center"
                onPress={() => { setTempReceiptImages(receiptImages); setReceiptModalVisible(true); }}
              >
                <Text className="text-blue-700 font-semibold">{receiptImages.length > 0 ? "แก้ไขรูปภาพ" : "เพิ่มรูปภาพ"}</Text>
              </TouchableOpacity>
            </SectionCard>

            <SectionCard icon="pencil" title="ลายเซ็นผู้รับสินค้า">
              {recipientSignature ? (
                <Image source={{ uri: recipientSignature }} className="w-full h-36 bg-gray-50 border border-gray-200 rounded-lg" resizeMode="contain" />
              ) : (
                <Text className="text-base text-gray-500 text-center my-5">ยังไม่มีลายเซ็น</Text>
              )}
              <TouchableOpacity className="bg-blue-50 rounded-lg py-2.5 mt-4 items-center" onPress={() => setSignatureModalVisible(true)}>
                <Text className="text-blue-700 font-semibold">{recipientSignature ? "แก้ไขลายเซ็น" : "เพิ่มลายเซ็น"}</Text>
              </TouchableOpacity>
            </SectionCard>

            <SectionCard icon="speedometer" title="เลขไมล์ (กม.)">
              <TextInput
                className="border border-gray-300 rounded-lg p-3 text-base bg-white"
                placeholder="กรอกเลขไมล์เมื่อถึงที่หมาย"
                value={deliveryMileage}
                onChangeText={setDeliveryMileage}
                keyboardType="number-pad"
              />
            </SectionCard>

          </View>
        </ScrollView>
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          {completionTime ? (
            <View className="items-center py-2">
              <Text className="text-green-700 font-bold">งานเสร็จสิ้นแล้วเมื่อ:</Text>
              <Text className="text-gray-800 font-semibold text-lg">
                {completionTime.toLocaleString("th-TH", {
                  year: 'numeric', month: 'short', day: 'numeric', 
                  hour: '2-digit', minute: '2-digit'
                })} น.
              </Text>
            </View>
          ) : (
            <ActionButton
              title={isLoading ? "กำลังบันทึก..." : "ยืนยันการลงสินค้า"}
              disabled={!recipientSignature || unloadingImages.length === 0 || receiptImages.length === 0}
              onPress={handleCompleteDelivery}
              isLoading={isLoading}
            />
          )}
        </View>
        <Modal visible={unloadingModalVisible} animationType="slide" onRequestClose={() => setUnloadingModalVisible(false)}>
          <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-xl font-bold">จัดการรูปภาพสินค้า (หลังลงของ)</Text>
              <TouchableOpacity onPress={() => setUnloadingModalVisible(false)}><Ionicons name="close" size={28} color="#333" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <TouchableOpacity className="flex-row items-center justify-center bg-green-50 border border-green-200 rounded-xl py-3 mb-4" onPress={() => openImageSourceModal('unloading')}>
                <Ionicons name="add-circle-outline" size={24} color="#166534" /><Text className="text-green-800 text-base font-semibold ml-2">เพิ่มรูปภาพ</Text>
              </TouchableOpacity>
              <View className="flex-row flex-wrap gap-2">
                {tempUnloadingImages.map((uri, index) => (
                  <View key={index}>
                    <Image source={{ uri }} style={{ width: thumbnailSize, height: thumbnailSize, borderRadius: 12 }} />
                    <TouchableOpacity className="absolute -top-1.5 -right-1.5" onPress={() => setTempUnloadingImages(tempUnloadingImages.filter((_, i) => i !== index))}>
                      <Ionicons name="close-circle" size={26} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
            <View className="p-4 border-t border-gray-200"><ActionButton title="บันทึกรูปภาพ" onPress={saveUnloadingImages} /></View>
          </SafeAreaView>
        </Modal>
        <Modal visible={receiptModalVisible} animationType="slide" onRequestClose={() => setReceiptModalVisible(false)}>
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                    <Text className="text-xl font-bold">จัดการรูปภาพใบรับสินค้า</Text>
                    <TouchableOpacity onPress={() => setReceiptModalVisible(false)}><Ionicons name="close" size={28} color="#333" /></TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    <TouchableOpacity className="flex-row items-center justify-center bg-green-50 border border-green-200 rounded-xl py-3 mb-4" onPress={() => openImageSourceModal('receipt')}>
                        <Ionicons name="add-circle-outline" size={24} color="#166534" /><Text className="text-green-800 text-base font-semibold ml-2">เพิ่มรูปภาพ</Text>
                    </TouchableOpacity>
                    <View className="flex-row flex-wrap gap-2">
                        {tempReceiptImages.map((uri, index) => (
                            <View key={index}>
                                <Image source={{ uri }} style={{ width: thumbnailSize, height: thumbnailSize, borderRadius: 12 }} />
                                <TouchableOpacity className="absolute -top-1.5 -right-1.5" onPress={() => setTempReceiptImages(tempReceiptImages.filter((_, i) => i !== index))}>
                                    <Ionicons name="close-circle" size={26} color="#DC2626" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </ScrollView>
                <View className="p-4 border-t border-gray-200"><ActionButton title="บันทึกรูปภาพ" onPress={saveReceiptImages} /></View>
            </SafeAreaView>
        </Modal>
        <Modal visible={signatureModalVisible} animationType="slide" onRequestClose={() => setSignatureModalVisible(false)}>
          <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-xl font-bold">เซ็นชื่อผู้รับสินค้า</Text>
              <TouchableOpacity onPress={() => setSignatureModalVisible(false)}><Ionicons name="close" size={28} color="#333" /></TouchableOpacity>
            </View>
            <View className="flex-1 p-4">
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
            </View>
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
                <TouchableOpacity className="flex-row items-center bg-blue-50 rounded-lg p-3.5 mb-3" onPress={handleTakePhoto}>
                  <Ionicons name="camera-outline" size={24} color="#1E3A8A" />
                  <Text className="text-blue-800 font-semibold ml-3 text-base">ถ่ายรูป</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center bg-blue-50 rounded-lg p-3.5 mb-4" onPress={handlePickFromGallery}>
                  <Ionicons name="image-outline" size={24} color="#1E3A8A" />
                  <Text className="text-blue-800 font-semibold ml-3 text-base">เลือกจากอัลบั้ม</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-gray-200 rounded-lg py-3 items-center" onPress={() => setImageSourceModalVisible(false)}>
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