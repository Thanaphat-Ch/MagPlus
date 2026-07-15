import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View, } from "react-native";
import NavFooter from "../components/NavFooter";

const SERVER = Platform.OS === "android" 
    ? "${apiUrl}" 
    : "${apiUrl}";

interface DailyIncome {
  date: string; 
  amount: number;
  trips: number;
}

const MOCK_INCOME_DATA: DailyIncome[] = [
  { date: "2025-10-12", amount: 1200, trips: 5 },
  { date: "2025-10-11", amount: 950, trips: 4 },
  { date: "2025-10-10", amount: 1500, trips: 7 },
  { date: "2025-10-09", amount: 750, trips: 3 },
  { date: "2025-10-05", amount: 880, trips: 4 },
  { date: "2025-10-04", amount: 1320, trips: 6 },
  { date: "2025-10-01", amount: 900, trips: 4 },
  { date: "2025-09-28", amount: 1150, trips: 5 },
];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
};

const Header = () => {
  const router = useRouter();
  return (
    <View className="relative flex-row items-center justify-between px-4 py-3 bg-slate-100 border-b border-slate-200">
      <TouchableOpacity onPress={() => router.back()} className="p-2 z-10">
        <Ionicons name="arrow-back-outline" size={26} color="#1e2d42" />
      </TouchableOpacity>
      <View className="absolute left-0 right-0 items-center">
        <Text className="text-xl font-bold text-slate-800">สรุปรายได้</Text>
      </View>
      <View className="w-10 h-10" />
    </View>
  );
};

const TimePeriodFilter = ({ period, setPeriod, titles }: { period: string; setPeriod: (p: any) => void; titles: any; }) => (
  <View className="px-4 py-3 bg-slate-100">
    <View className="flex-row bg-slate-200/70 p-1 rounded-full">
      {(['day', 'week', 'month'] as const).map((p) => (
        <TouchableOpacity
          key={p}
          onPress={() => setPeriod(p)}
          className={`flex-1 py-2.5 rounded-full transition-all duration-300 ${period === p ? "bg-white shadow-md" : ""}`}
        >
          <Text className={`text-center font-bold ${period === p ? "text-indigo-600" : "text-slate-500"}`}>
            {titles[p]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const TotalIncomeCard = ({ totalIncome, periodTitle }: { totalIncome: number; periodTitle: string; }) => (
  <View className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl p-6 shadow-xl shadow-green-900/20">
    <View className="flex-row items-center mb-2">
      <Ionicons name="wallet-outline" size={20} color="white" />
      <Text className="text-white/80 text-base ml-2">รายได้รวม ({periodTitle})</Text>
    </View>
    <Text className="text-white text-4xl font-extrabold tracking-tight">
      ฿{totalIncome.toLocaleString()}
    </Text>
  </View>
);

const IncomeCard = ({ item }: { item: DailyIncome }) => (
  <TouchableOpacity activeOpacity={0.8} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200 active:scale-95 transition-transform duration-150">
    <View className="p-4 flex-row justify-between items-center">
      <View className="flex-1 pr-3">
        <Text className="text-base font-bold text-slate-800" numberOfLines={1}>{formatDate(item.date)}</Text>
        <Text className="text-sm text-slate-500 mt-1">{item.trips} เที่ยว</Text>
      </View>
      <Text className="text-xl font-extrabold text-emerald-600">
        ฿{item.amount.toLocaleString()}
      </Text>
    </View>
  </TouchableOpacity>
);

const EmptyState = ({ icon, title, message }: { icon: any; title: string; message: string; }) => (
  <View className="items-center justify-center bg-white/60 rounded-2xl p-8 mt-4">
    <Ionicons name={icon} size={50} color="#94a3b8" />
    <Text className="text-slate-600 text-lg font-semibold mt-4">{title}</Text>
    <Text className="text-slate-400 mt-1 text-center">{message}</Text>
  </View>
);

const IncomeList = ({ isLoading, error, data, periodTitle }: { isLoading: boolean; error: string | null; data: DailyIncome[]; periodTitle: string; }) => {
  if (isLoading) {
    return <ActivityIndicator size="large" color="#4f46e5" className="mt-20" />;
  }
  if (error) {
    return <EmptyState icon="cloud-offline-outline" title="เกิดข้อผิดพลาด" message={error} />;
  }
  if (data.length === 0) {
    return <EmptyState icon="receipt-outline" title="ไม่พบข้อมูลรายได้" message="ไม่มีรายการในช่วงเวลานี้" />;
  }
  return (
    <View className="space-y-3">
      {data.map((item) => <IncomeCard key={item.date} item={item} />)}
    </View>
  );
};

export default function SummaryPage() {
  const [timePeriod, setTimePeriod] = useState<'day' | 'week' | 'month'>("day");
  const [allIncomeData, setAllIncomeData] = useState<DailyIncome[]>([]);
  const [displayedData, setDisplayedData] = useState<DailyIncome[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const periodTitles = { day: "วันนี้", week: "สัปดาห์นี้", month: "เดือนนี้" };

  useEffect(() => {
    const fetchAllIncomeData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const driverId = await AsyncStorage.getItem("U_ID");
        if (!driverId) throw new Error("ไม่พบรหัสผู้ขับ โปรดเข้าสู่ระบบใหม่");
        await new Promise(resolve => setTimeout(resolve, 500)); 
        setAllIncomeData(MOCK_INCOME_DATA);
      } catch (err: any) {
        setError(err.message || "เกิดข้อผิดพลาดบางอย่าง");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllIncomeData();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const today = new Date("2025-10-12T12:00:00"); 
    today.setHours(0, 0, 0, 0);
    let filtered: DailyIncome[] = [];
    switch (timePeriod) {
      case "day":
        filtered = allIncomeData.filter(item => new Date(item.date).toDateString() === today.toDateString());
        break;
      case "week":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
        startOfWeek.setHours(0, 0, 0, 0);
        filtered = allIncomeData.filter(item => new Date(item.date) >= startOfWeek && new Date(item.date) <= today);
      break;
      case "month":
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        filtered = allIncomeData.filter(item => new Date(item.date) >= startOfMonth && new Date(item.date) <= today);
      break;
    }
    setDisplayedData(filtered);
    setTotalIncome(filtered.reduce((sum, item) => sum + item.amount, 0));
  }, [timePeriod, allIncomeData, isLoading]);

  return (
    <SafeAreaView className="flex-1 bg-slate-100">
      <StatusBar barStyle="dark-content" />
      <Header />
      <TimePeriodFilter period={timePeriod} setPeriod={setTimePeriod} titles={periodTitles} />
      
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="p-4 space-y-6">
          <TotalIncomeCard totalIncome={totalIncome} periodTitle={periodTitles[timePeriod]} />
          
          <View>
            <Text className="text-lg font-bold text-slate-700 mb-4">
              ประวัติรายได้ ({periodTitles[timePeriod]})
            </Text>
            <IncomeList 
              isLoading={isLoading} 
              error={error} 
              data={displayedData}
              periodTitle={periodTitles[timePeriod]} 
            />
          </View>
        </View>
      </ScrollView>
      <NavFooter />
    </SafeAreaView>
  );
}