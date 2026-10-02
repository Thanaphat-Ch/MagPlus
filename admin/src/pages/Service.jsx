import React, { useEffect, useState, useCallback, useMemo } from "react"
import Sidebar from "../components/Sidebar"
import ServiceCard from "../components/ServiceCard"
import ServiceDetailModal from "../components/ServiceDetailModal"
import { io } from "socket.io-client"
import api from "../api"

const SOCKET_URL = import.meta.env.VITE_API_URL ? new URL(import.meta.env.VITE_API_URL).origin : "http://localhost:5000"

const FILTER_TEXTS = {
  all: "ทั้งหมด",
  pending: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
}

export default function Service() {
  const [serviceRequests, setServiceRequests] = useState([])
  const [filter, setFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    document.title = "Repair Service Requests"
  }, [])

  // ดึงข้อมูลคำขอซ่อมผ่าน api กลาง
  const fetchServiceRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get("/service", { silent: true })
      setServiceRequests(res.data || [])
    } catch (err) {
      console.error("❌ ERROR fetching service requests:", err)
      setError("โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")
    } finally {
      setLoading(false)
    }
  }, [])

  // เชื่อมต่อ Socket และดึงข้อมูล
  useEffect(() => {
    fetchServiceRequests()

    const socket = io(SOCKET_URL)

    socket.on("newRepairRequest", (newReq) => {
      setServiceRequests((prev) => [newReq, ...prev])
    })

    return () => {
      socket.off("newRepairRequest")
      socket.disconnect()
    }
  }, [fetchServiceRequests])

  // อัปเดตสถานะการซ่อม
  const handleUpdateStatus = async (id, status) => {
    try {
      // ปรับ path ให้ตรงกับ API ของระบบ
      const res = await api.put(`/service-request/${id}/status`, { status })

      setServiceRequests((prev) => prev.map((req) => (req.id === id ? { ...req, ...(res.data || { status }) } : req)))
      setSelectedRequest(null)
    } catch (err) {
      console.error("❌ ERROR updating status:", err)
      const errorMsg = err.response?.data?.message || err.message || "เกิดข้อผิดพลาดในการอัปเดต"
      alert(`อัปเดตสถานะไม่สำเร็จ: ${errorMsg}`)
    }
  }

  // คำนวณสรุปสถิติ
  const stats = useMemo(() => {
    return {
      pending: serviceRequests.filter((r) => r.status === "pending").length,
      approved: serviceRequests.filter((r) => r.status === "approved").length,
      rejected: serviceRequests.filter((r) => r.status === "rejected").length,
      total: serviceRequests.length,
    }
  }, [serviceRequests])

  // กรองข้อมูลตามแท็บ
  const filteredRequests = useMemo(() => {
    return serviceRequests.filter((req) => (filter === "all" ? true : req.status === filter))
  }, [serviceRequests, filter])

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* เมนูด้านข้าง Sidebar */}
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">ระบบอนุมัติการซ่อมบำรุง</h1>
            <p className="text-sm text-slate-500 mt-1">จัดการรายการแจ้งซ่อมและประวัติการอนุมัติงานซ่อมรถ</p>
          </div>

          <button onClick={fetchServiceRequests} disabled={loading} className="self-start sm:self-auto text-sm text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm transition disabled:opacity-50">
            {loading ? "กำลังรีเฟรช..." : "🔄 รีเฟรชข้อมูล"}
          </button>
        </div>

        {/* การ์ดสถิติคำขอซ่อม */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm border-l-4 border-amber-500">
            <span className="text-xs font-medium text-slate-500">รออนุมัติ</span>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm border-l-4 border-emerald-500">
            <span className="text-xs font-medium text-slate-500">อนุมัติแล้ว</span>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.approved}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm border-l-4 border-rose-500">
            <span className="text-xs font-medium text-slate-500">ปฏิเสธ</span>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.rejected}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm border-l-4 border-blue-500">
            <span className="text-xs font-medium text-slate-500">คำขอทั้งหมด</span>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
          </div>
        </div>

        {/* ส่วนเนื้อหาหลักและ Filter */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-slate-800">รายการแจ้งซ่อม</h2>
            <div className="flex flex-wrap gap-2">
              {Object.keys(FILTER_TEXTS).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === f ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {FILTER_TEXTS[f]}
                </button>
              ))}
            </div>
          </div>

          {/* สภาพการโหลดและแสดงผล */}
          {loading && filteredRequests.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-medium">⏳ กำลังโหลดข้อมูลคำขอซ่อม...</div>
          ) : error ? (
            <div className="py-12 text-center text-rose-500 font-medium">{error}</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <span className="text-3xl block mb-2">🔧</span>
              ไม่มีคำขอซ่อมในหมวดหมู่นี้
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRequests.map((req) => (
                <ServiceCard key={req.id} request={req} onCardClick={() => setSelectedRequest(req)} />
              ))}
            </div>
          )}
        </div>

        {/* Modal รายละเอียดคำขอซ่อม */}
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setSelectedRequest(null)}>
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
              <ServiceDetailModal request={selectedRequest} onClose={() => setSelectedRequest(null)} onUpdateStatus={handleUpdateStatus} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
