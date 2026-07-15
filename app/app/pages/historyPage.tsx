import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosResponse } from 'axios';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Linking, Platform, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import NavFooter from "../components/NavFooter";

const CLIENT_ID = '208662';
const CLIENT_SECRET = 'cHBsQHRoYWkuY29tK3dlYmFwaTIwMTc=';
const AUTH_URL = 'https://webapi.forthtrack.com/authorizationserver/token';
const TRACKING_URL = 'https://webapi.forthtrack.com/trackingresource/api/tracking';

interface AuthResponse { access_token: string; }
interface VehicleStatus { Latitude: number; Longitude: number; addressT: string; poi: string; }

const getForthTrackToken = async (): Promise<string | null> => {
    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);

        const authResponse: AxiosResponse<AuthResponse> = await axios.post(
            AUTH_URL,
            params.toString(), 
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        return authResponse.data.access_token;
    } catch (error) { 
        console.error("ForthTrack Token Error:", error);
        return null; 
    }
};

const fetchVehicleStatus = async (token: string): Promise<VehicleStatus | null> => {
    try {
        const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
        const response: AxiosResponse<VehicleStatus[]> = await axios.get(TRACKING_URL, { headers });
        if (response.data && response.data.length > 0) return response.data[0];
        return null;
    } catch (error) { return null; }
};
// ==========================================

type ShipmentStatus = "in_progress" | "completed" | "cancelled";

type Shipment = {
  Orderid: number;
  D_Key: string;
  OrSt: string;
  OrStDesc?: string;
  S_Code: string;
  PickPoint?: string;
  DropPoint?: string;
  StSM?: string; 
  StSMDesc?: string;
};

const TABS: { key: ShipmentStatus; label: string }[] = [
  { key: "in_progress", label: "กำลังขนส่ง" },
  { key: "completed", label: "งานที่เสร็จสิ้น" },
  { key: "cancelled", label: "งานที่ปฏิเสธ" },
];

const STATUS_MAP: Record<ShipmentStatus, string> = {
  in_progress: "1",
  cancelled: "2",
  completed: "3",
};

const StatusText = ({ status }: { status: ShipmentStatus }) => {
  const config = {
    in_progress: { label: "กำลังขนส่ง", color: "#2563eb", icon: "truck" },
    completed: { label: "งานเสร็จสิ้น", color: "#16a34a", icon: "check-circle" },
    cancelled: { label: "งานที่ปฏิเสธ", color: "#dc2626", icon: "close-circle" },
  };
  const { label, color, icon } = config[status];
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <MaterialCommunityIcons name={icon as any} size={20} color={color} />
      <Text style={{ fontWeight: "bold", marginLeft: 6, color, fontSize: 16 }}>{label}</Text>
    </View>
  );
};

const ShipmentCard = ({ item, onPress }: { item: Shipment; onPress: () => void }) => {
  const statusKey: ShipmentStatus =
    item.OrSt === "3" ? "completed" : item.OrSt === "2" ? "cancelled" : "in_progress";

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View className="p-4 mb-4 bg-white rounded-2xl shadow-md border border-slate-200 flex-row items-center justify-between">
        <StatusText status={statusKey} />
        <View className="items-end">
          <Text className="text-lg font-bold text-slate-800">Order #{item.Orderid}</Text>
          <Text className="text-sm text-slate-500 mt-1">ใบงานเลขที่ {item.S_Code}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState<ShipmentStatus>("in_progress");
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  
  const [carLocation, setCarLocation] = useState<{lat: number, lng: number} | null>(null);

  const router = useRouter();

  const openGoogleMaps = (destinationName: string | undefined) => {
    if (!destinationName) return;
    
    const destQuery = encodeURIComponent(destinationName);
    let originParam = "";
    if (carLocation) {
        originParam = `&origin=${carLocation.lat},${carLocation.lng}`;
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${destQuery}${originParam}&travelmode=driving`;

    Linking.openURL(url).catch((err) => {
        if (Platform.OS !== 'web') Alert.alert("ข้อผิดพลาด", "ไม่สามารถเปิด Google Maps ได้");
    });
  };

  const fetchCarLocation = async () => {
      const token = await getForthTrackToken();
      if (token) {
          const status = await fetchVehicleStatus(token);
          if (status) {
              setCarLocation({ lat: status.Latitude, lng: status.Longitude });
          }
      }
  };

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setLoading(true);
        const currentDriverId = await AsyncStorage.getItem("U_ID");
        if (!currentDriverId) {
            setLoading(false);
            if (Platform.OS !== 'web') Alert.alert("ข้อผิดพลาด", "ไม่พบรหัสคนขับ");
            return;
        }
        setDriverId(currentDriverId); 
        fetchCarLocation(); 

        const statusParam = STATUS_MAP[activeTab];
        const url = `http://localhost:5000/api/jobs/driver/${currentDriverId}?status=${statusParam}`;
 
        const res = await fetch(url);
        if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลงานได้');
        const data = await res.json();
        setShipments(data);
      } catch (err) {
        if (Platform.OS !== 'web') Alert.alert("เกิดข้อผิดพลาด", (err as Error).message);
      } finally {
        setLoading(false);
      }
    }; 
    fetchShipments();
  }, [activeTab]);

  if (selectedShipment) {
    const statusKey: ShipmentStatus =
      selectedShipment.OrSt === "3" ? "completed" : selectedShipment.OrSt === "2" ? "cancelled" : "in_progress";

    const isPickupCompleted = selectedShipment.StSM === "1";
    const buttonLabel = isPickupCompleted ? "ลงสิ้นค้า" : "ดำเนินการต่อ";
    const targetPath = isPickupCompleted ? "../pages/Loading" : "../pages/Pickup";
    const buttonColor = isPickupCompleted ? "bg-green-600 shadow-lg shadow-green-500/50" : "bg-blue-600 shadow-lg shadow-blue-500/50";

    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <StatusBar barStyle="light-content" />
        <View className="bg-blue-600">
          <View className="flex-row items-center justify-center h-16 px-4 relative mt-6">
            <TouchableOpacity onPress={() => setSelectedShipment(null)} className="absolute left-4 p-2">
              <MaterialCommunityIcons name="arrow-left" size={26} color="#fff" />
            </TouchableOpacity>
            <Text className="text-xl font-semibold text-white">รายละเอียดงาน</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 20 }}>
          <View className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 mb-5">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-slate-800">Order #{selectedShipment.Orderid}</Text>
              <View className="items-end">
                  <StatusText status={statusKey} /> 
                  {selectedShipment.StSM === "1" && selectedShipment.StSMDesc && (
                        <View className="mt-1 items-end">
                            <Text className="text-xs text-green-600 font-medium">สถานะ:</Text>
                            <Text className="text-sm text-slate-700 font-semibold">{selectedShipment.StSMDesc}</Text>
                        </View>
                    )}
              </View>
            </View>
            <View className="mb-4">
              <Text className="text-slate-500">รหัสงาน</Text>
              <Text className="text-lg font-semibold">{selectedShipment.S_Code}</Text>
            </View>
            <View className="mt-4">
              <Text className="text-slate-500 mb-2 font-medium">เส้นทาง</Text>
              
              {/* จุดส่งของ (Drop Point) */}
              <View className="flex-row items-center justify-between mt-2">
                <View className="flex-row items-center flex-1 mr-2">
                    <MaterialCommunityIcons name="flag-checkered" size={22} color="#dc2626" className="mt-1"/>
                    <Text className="ml-3 text-base text-slate-800 flex-1">{selectedShipment.DropPoint || "-"}</Text>
                </View>
                {/* 🎨 ปรับดีไซน์ปุ่มนำทาง (Drop Point) */}
                <TouchableOpacity 
                    onPress={() => openGoogleMaps(selectedShipment.DropPoint)} 
                    className="bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg flex-row items-center"
                >
                    <MaterialCommunityIcons name="google-maps" size={16} color="#dc2626" />
                    <Text className="text-red-700 text-xs font-bold ml-1">นำทาง</Text>
                </TouchableOpacity>
              </View>

              <View className="h-5 w-0.5 bg-slate-300 ml-[10px] my-1" />

              {/* จุดรับสินค้า (Pick Point) */}
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center flex-1 mr-2">
                    <MaterialCommunityIcons name="map-marker-radius-outline" size={22} color="#2563eb" className="mt-1" />
                    <Text className="ml-3 text-base text-slate-800 flex-1">{selectedShipment.PickPoint || "-"}</Text>
                </View>
                {/* 🎨 ปรับดีไซน์ปุ่มนำทาง (Pick Point) */}
                <TouchableOpacity 
                    onPress={() => openGoogleMaps(selectedShipment.PickPoint)} 
                    className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg flex-row items-center"
                >
                    <MaterialCommunityIcons name="google-maps" size={16} color="#2563eb" />
                    <Text className="text-blue-700 text-xs font-bold ml-1">นำทาง</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          {statusKey === "in_progress" && (
            <TouchableOpacity
              onPress={() => {
                if (selectedShipment?.D_Key && driverId) {
                  router.push({
                        pathname: targetPath,
                        params: { jobId: selectedShipment.D_Key, driverId: driverId },
                    });
                } else {
                  Alert.alert("เกิดข้อผิดพลาด", "ไม่พบรหัสงานหรือรหัสคนขับสำหรับไปต่อ");
               }
              }}
                className={`py-4 rounded-xl flex-row items-center justify-center mt-2 ${buttonColor}`}
              >
              <MaterialCommunityIcons name="cube-send" size={22} color="white" className="mr-2" />
              <Text className="text-white text-base font-bold">{buttonLabel}</Text>
            </TouchableOpacity>
           )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-100">
      <StatusBar barStyle="dark-content" />
      <View className="bg-white shadow-sm">
        <View className="flex-row pt-2">
          {TABS.map((tab) => (
            <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key)} className="flex-1 items-center py-3">
              <Text className={`text-base font-bold ${activeTab === tab.key ? "text-blue-600" : "text-slate-400"}`}>{tab.label}</Text>
              {activeTab === tab.key && (<View className="w-12 h-1 bg-blue-600 rounded-full mt-2" />)}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={{ marginTop: 10, color: '#64748b' }}>กำลังโหลด...</Text>
        </View>
        ) : (
        <FlatList
          data={shipments}
         keyExtractor={(item) => item.Orderid.toString()}
           renderItem={({ item }) => (
            <ShipmentCard item={item} onPress={() => setSelectedShipment(item)} />
          )}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 }}>
              <MaterialCommunityIcons name="format-list-bulleted" size={60} color="#cbd5e1" />
              <Text style={{ fontSize: 18, color: '#94a3b8', fontWeight: '600', marginTop: 16 }}>ไม่พบรายการงาน</Text>
            </View>
          }
        />
      )}
      <NavFooter />
    </SafeAreaView>
  );
}