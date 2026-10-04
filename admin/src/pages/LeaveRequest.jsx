import React, { useEffect, useState, useCallback, useMemo } from "react"
import LeaveRequestCard from "../components/LeaveRequestCard"
import LeaveRequestDetailModal from "../components/LeaveRequestDetailModal"
import api from "../api"

const FILTER_TEXTS = {
  all: "ทั้งหมด",
  pending: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
}

const ICONS = {
  pending: "🕒",
  approved: "✔️",
  rejected: "❌",
  total: "📊",
}

function StatCard({ title, value, type, loading }) {
  const colors = {
    pending: "border-amber-500",
    approved: "border-emerald-500",
    rejected: "border-rose-500",
    total: "border-blue-500",
  }

  return (
    <div className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-100 transition-all duration-200 hover:shadow-md border-l-4 ${colors[type] || "border-slate-300"}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {loading ? <div className="h-8 w-14 bg-slate-200 rounded-md animate-pulse mt-1.5"></div> : <p className="text-3xl font-bold tracking-tight text-slate-800 mt-1">{value}</p>}
        </div>
        <div className="text-3xl opacity-80">{ICONS[type]}</div>
      </div>
    </div>
  )
}

export default function LeaveRequest() {
  const [leaveRequests, setLeaveRequests] = useState([])
  const [filter, setFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    document.title = "Leave Management"
  }, [])

  // ดึงรายการขอลางานผ่าน api กลาง
  const fetchLeaveRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get("/leave", { silent: true })
      setLeaveRequests(res.data || [])
    } catch (err) {
      console.error("❌ ERROR fetching leave:", err)
      setError("ไม่สามารถโหลดข้อมูลคำขอลางานได้ กรุณาลองใหม่อีกครั้ง")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeaveRequests()
  }, [fetchLeaveRequests])

  // อัปเดตสถานะ (อนุมัติ / ปฏิเสธ)
  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await api.put(`/leave/${id}/status`, { status })

      // อัปเดตข้อมูลในตารางทันทีโดยไม่ต้อง fetch ใหม่ทั้งหมด
      setLeaveRequests((prev) => prev.map((req) => (req.id === id ? { ...req, ...res.data } : req)))
      setSelectedRequest(null)
    } catch (err) {
      console.error("❌ ERROR updating status:", err)
      const errorMsg = err.response?.data?.message || err.message || "เกิดข้อผิดพลาดในการอัปเดต"
      alert(`อัปเดตสถานะไม่สำเร็จ: ${errorMsg}`)
    }
  }

  // คำนวณสถิติ
  const stats = useMemo(() => {
    return {
      pending: leaveRequests.filter((r) => r.status === "pending").length,
      approved: leaveRequests.filter((r) => r.status === "approved").length,
      rejected: leaveRequests.filter((r) => r.status === "rejected").length,
      total: leaveRequests.length,
    }
  }, [leaveRequests])

  // ฟิลเตอร์ข้อมูลตามแท็บที่เลือก
  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((req) => (filter === "all" ? true : req.status === filter))
  }, [leaveRequests, filter])

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">ระบบอนุมัติการลางาน</h1>
        <button onClick={fetchLeaveRequests} disabled={loading} className="text-sm text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition disabled:opacity-50">
          {loading ? "กำลังรีเฟรช..." : "รีเฟรชข้อมูล"}
        </button>
      </div>

      {/* Grid บัตรสถิติ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="รออนุมัติ" value={stats.pending} type="pending" loading={loading} />
        <StatCard title="อนุมัติแล้ว" value={stats.approved} type="approved" loading={loading} />
        <StatCard title="ปฏิเสธ" value={stats.rejected} type="rejected" loading={loading} />
        <StatCard title="คำขอทั้งหมด" value={stats.total} type="total" loading={loading} />
      </div>

      {/* ส่วนรายการและแท็บ Filter */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-slate-800">รายการคำขอลางาน</h2>

          <div className="flex flex-wrap gap-2">
            {Object.keys(FILTER_TEXTS).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === f ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {FILTER_TEXTS[f]}
              </button>
            ))}
          </div>
        </div>

        {/* State การแสดงผล */}
        {loading && filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-medium">⏳ กำลังโหลดข้อมูลคำขอ...</div>
        ) : error ? (
          <div className="py-12 text-center text-rose-500 font-medium">{error}</div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <span className="text-3xl block mb-2">📋</span>
            ไม่มีคำขอลางานในหมวดหมู่นี้
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRequests.map((req) => (
              <LeaveRequestCard key={req.id} request={req} onCardClick={() => setSelectedRequest(req)} />
            ))}
          </div>
        )}
      </div>

      {/* Modal รายละเอียดคำขอ */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setSelectedRequest(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
            <LeaveRequestDetailModal
              request={selectedRequest}
              onClose={() => setSelectedRequest(null)}
              onUpdateStatus={handleUpdateStatus} // ✅ แก้ไขสะกดคำเชื่อมต่อ Event แล้ว
            />
          </div>
        </div>
      )}
    </main>
  )
}
