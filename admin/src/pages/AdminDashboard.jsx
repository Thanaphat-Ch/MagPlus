import React, { useEffect, useState } from "react"
import axios from "axios"
import io from "socket.io-client"
import { Pie, Line } from "react-chartjs-2"
import { Chart, ArcElement, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, Filler } from "chart.js"

Chart.register(ArcElement, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, Filler)

const lineOptions = {
  responsive: true,
  plugins: {
    legend: { position: "top" },
    tooltip: { mode: "index", intersect: false },
  },
  interaction: { mode: "nearest", axis: "x", intersect: false },
  scales: { y: { beginAtZero: true } },
}

const AdminDashboard = () => {
  const [users, setUsers] = useState([])
  const [activeUsers, setActiveUsers] = useState(0)

  const [summaryData, setSummaryData] = useState({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    cancelledJobs: 0,
    totalTrucks: 0,
    availableTrucks: 0,
    maintenance: 0,
    accident: 0,
    parkTruck: 0,
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [availableTruckList, setAvailableTruckList] = useState([])

  useEffect(() => {
    const socket = io("https://app.magnitudetms.com")
    axios
      .get("https://app.magnitudetms.com/api/active-users")
      .then((res) => setActiveUsers(res.data.activeUsers || 0))
      .catch((err) => console.error("Error loading active users:", err))
    socket.on("activeUsers", (count) => setActiveUsers(count))
    return () => socket.off("activeUsers")
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem("token")
        if (!token) throw new Error("Authentication token not found")

        const [usersRes, activeRes, jobsSummaryRes, trucksRes, availableRes, maintenanceRes, accidentRes, parkRes] = await Promise.all([
          axios.get("https://app.magnitudetms.com/api/readall", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("https://app.magnitudetms.com/api/active-users", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("https://app.magnitudetms.com/api/jobs/summary"),
          axios.get("https://app.magnitudetms.com/api/total-trucks"),
          axios.get("https://app.magnitudetms.com/api/available-trucks"),
          axios.get("https://app.magnitudetms.com/api/trucks/maintenance"),
          axios.get("https://app.magnitudetms.com/api/trucks/accident"),
          axios.get("https://app.magnitudetms.com/api/trucks/park"),
        ])

        setUsers(usersRes.data || [])
        setActiveUsers(activeRes.data?.activeUsers || 0)

        setSummaryData({
          totalJobs: jobsSummaryRes.data.totalJobs || 0,
          activeJobs: jobsSummaryRes.data.activeJobs || 0,
          completedJobs: jobsSummaryRes.data.completedJobs || 0,
          cancelledJobs: jobsSummaryRes.data.cancelledJobs || 0,
          totalTrucks: trucksRes.data.totalTrucks || 0,
          availableTrucks: availableRes.data.availableTrucks || 0,
          maintenance: maintenanceRes.data.maintenance || 0,
          accident: accidentRes.data.accident || 0,
          parkTruck: parkRes.data.park || 0,
        })
      } catch (err) {
        console.error("Data fetch error:", err)
        setError(err.message || "Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    document.title = "Admin Dashboard"
  }, [])

  useEffect(() => {
    // จำลอง API response
    const mockData = [
      { id: 1, plate_number: "1กข 1234", driver_name: "สมชาย ใจดี", driver_assigned: true },
      { id: 2, plate_number: "2ขจ 4567", driver_name: "ประเสริฐ ขยัน", driver_assigned: true },
      { id: 3, plate_number: "4คจ 1122", driver_name: null, driver_assigned: false },
      { id: 4, plate_number: "5ขม 3344", driver_name: null, driver_assigned: false },
    ]
    setAvailableTruckList(mockData)
  }, [])

  const { availableTrucks, maintenance, accident } = summaryData

  const pieData = {
    labels: ["รถพร้อมใช้งาน", "รถซ่อมบำรุง", "รถเกิดอุบัติเหตุ"],
    datasets: [
      {
        label: "Overview",
        data: [availableTrucks, maintenance, accident],
        backgroundColor: ["rgba(160, 231, 226, 1)", "rgba(235, 216, 71, 0.7)", "rgba(226, 109, 109, 0.7)"],
        borderColor: ["rgba(95, 199, 192, 1)", "rgba(162, 145, 16, 0.7)", "rgba(199, 48, 48, 0.7)"],
        borderWidth: 1,
      },
    ],
  }

  const lineData = {
    labels: ["งานทั้งหมด", "งานที่เสร็จสิ้น", "งานที่ยกเลิก"],
    datasets: [
      {
        label: "สถิติการทำงาน",
        data: [summaryData.totalJobs, summaryData.completedJobs, summaryData.cancelledJobs],
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        tension: 0.3,
        fill: true,
      },
    ],
  }

  const StatCard = ({ title, value, icon, colorTheme, onClick }) => {
    const colorClasses = {
      blue: { bg: "bg-blue-100", text: "text-blue-600", iconText: "text-blue-500", valueText: "text-blue-800" },
      green: { bg: "bg-green-100", text: "text-green-600", iconText: "text-green-500", valueText: "text-green-800" },
      orange: { bg: "bg-orange-100", text: "text-orange-600", iconText: "text-orange-500", valueText: "text-orange-800" },
      teal: { bg: "bg-teal-100", text: "text-teal-600", iconText: "text-teal-500", valueText: "text-teal-800" },
      yellow: { bg: "bg-yellow-100", text: "text-yellow-600", iconText: "text-yellow-500", valueText: "text-yellow-800" },
      red: { bg: "bg-red-100", text: "text-red-600", iconText: "text-red-500", valueText: "text-red-800" },
      indigo: { bg: "bg-indigo-100", text: "text-indigo-600", iconText: "text-indigo-500", valueText: "text-indigo-800" },
    }
    const theme = colorClasses[colorTheme] || colorClasses.blue

    return (
      <div className={` ${theme.bg} rounded-2xl shadow-md p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`} onClick={onClick}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-lg font-medium ${theme.text}`}>{title}</h2>
            <p className={`text-4xl font-bold ${theme.valueText} mt-1`}>{value}</p>
          </div>
          <div className={`bg-white rounded-full p-4 shadow-inner ${theme.iconText}`}>{icon}</div>
        </div>
      </div>
    )
  }

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="hidden md:block text-3xl font-bold text-gray-800">Admin Dashboard</h1>

      {/* ✅ FIXED: Changed variable references to use the summaryData state object */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatCard
          title="จำนวนรถทั้งหมด"
          value={summaryData.totalTrucks}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8a1 1 0 001-1z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18h1a1 1 0 001-1v-3.05a1 1 0 00-.4-.8L16 11.45V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v10" />
            </svg>
          }
          colorTheme="orange"
        />
        <StatCard
          title="รถจอด"
          value={summaryData.availableTrucks}
          onClick={() => setIsModalOpen(true)}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          colorTheme="teal"
        />
        <StatCard
          title="รถจอดพร้อมใช้งาน"
          value={summaryData.parkTruck}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          colorTheme="teal"
        />
        <StatCard
          title="จำนวนรถที่เกิดอุบัติเหตุ"
          value={summaryData.accident}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L4.34 16c-.77 1.333.012 3 1.732 3z" />
            </svg>
          }
          colorTheme="red"
        />
        <StatCard
          title="จำนวนรถที่ซ่อมบำรุง"
          value={summaryData.maintenance}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          colorTheme="yellow"
        />
        <StatCard
          title="งานที่กำลังดำเนินการ"
          value={summaryData.activeJobs}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          colorTheme="indigo"
        />
        <StatCard
          title="ผู้ใช้งานออนไลน์"
          value={activeUsers}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-1.414v.001M9 12h.01M15 12h.01M12 9v.01M12 15v.01" />
            </svg>
          }
          colorTheme="green"
        />
        <StatCard
          title="ผู้ใช้งานทั้งหมด"
          value={users.length}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          colorTheme="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">Dashboard Overview</h2>
          <Line data={lineData} options={lineOptions} />
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">Overall View</h2>
          <Pie data={pieData} />
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 "
          onClick={() => {
            setIsModalOpen(false)
          }}
          // {...(isViewOnly ? {onClick: () => { setIsAddModalOpen(false), setSelectedTruck(null), setFormData({}), setIsViewOnly(false)},} : {} )}
        >
          <div className="flex flex-col bg-gray-100 p-4 md:p-6 rounded-lg shadow-lg w-[90%] md:w-[85%]  h-[80vh] md:h-[90vh] max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">รถที่พร้อมใช้งาน</h2>
            <div className="overflow-y-auto flex-1 space-y-8">
<div className="flex flex-1 flex-col md:flex-row gap-6">
              {/* ตารางรถที่มีคนขับพร้อม */}
              <div className="flex-1/2">
                <h3 className="text-lg font-semibold mb-2 text-green-700">🚛 รถพร้อมใช้งาน (มีคนขับพร้อม)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300 rounded-lg">
                    <thead className="bg-green-100">
                      <tr>
                        <th className="px-4 py-2 border">ทะเบียนรถ</th>
                        <th className="px-4 py-2 border">ชื่อคนขับ</th>
                        <th className="px-4 py-2 border">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableTruckList
                        .filter((truck) => truck.driver_assigned === true)
                        .map((truck, index) => (
                          <tr key={index} className="text-center hover:bg-green-50">
                            <td className="px-4 py-2 border">{truck.plate_number}</td>
                            <td className="px-4 py-2 border">{truck.driver_name || "-"}</td>
                            <td className="px-4 py-2 border text-green-600 font-medium">พร้อมใช้งาน</td>
                          </tr>
                        ))}
                      {availableTruckList.filter((t) => t.driver_assigned).length === 0 && (
                        <tr>
                          <td colSpan={3} className="text-center py-4 text-gray-500">
                            ไม่มีข้อมูลรถพร้อมใช้งานที่มีคนขับ
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ตารางรถที่คนขับไม่พร้อม */}
                <div  className="flex-1/2">
                  <h3 className="text-lg font-semibold mb-2 text-yellow-700">🚛 รถพร้อมใช้งาน (ไม่มีคนขับ)</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300 rounded-lg">
                      <thead className="bg-yellow-100">
                        <tr>
                          <th className="px-4 py-2 border">ทะเบียนรถ</th>
                          <th className="px-4 py-2 border">ชื่อคนขับ</th>
                          <th className="px-4 py-2 border">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableTruckList
                          .filter((truck) => !truck.driver_assigned)
                          .map((truck, index) => (
                            <tr key={index} className="text-center hover:bg-yellow-50">
                              <td className="px-4 py-2 border">{truck.plate_number}</td>
                              <td className="px-4 py-2 border text-gray-500 italic">ไม่มีคนขับ</td>
                              <td className="px-4 py-2 border text-yellow-600 font-medium">รอคนขับ</td>
                            </tr>
                          ))}
                        {availableTruckList.filter((t) => !t.driver_assigned).length === 0 && (
                          <tr>
                            <td colSpan={3} className="text-center py-4 text-gray-500">
                              ไม่มีข้อมูลรถพร้อมใช้งานที่ไม่มีคนขับ
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default AdminDashboard
