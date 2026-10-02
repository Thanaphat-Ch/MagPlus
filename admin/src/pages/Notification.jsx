import React, { useEffect, useState } from "react"
import Sidebar from "../components/Sidebar"
import io from "socket.io-client"
import { FiBell, FiCheck, FiTrash2, FiClock } from "react-icons/fi"
import api from "../api"

// ดึง Base URL ของ Socket จาก Environment (หรือ fallback เป็น localhost)
const SOCKET_URL = import.meta.env.VITE_API_URL 
  ? new URL(import.meta.env.VITE_API_URL).origin 
  : "http://localhost:5000"

const Notification = () => {
  const [requests, setRequests] = useState([])
  const [loadingIds, setLoadingIds] = useState([]) // ติดตามรายการที่กำลังกดส่ง

  useEffect(() => {
    document.title = "Password Reset Requests"

    const socket = io(SOCKET_URL)

    // ฟัง event เมื่อมีผู้ใช้กดลืมรหัสผ่าน
    socket.on("forgot_user", (data) => {
      setRequests((prev) => [
        {
          id: data.id || Date.now(),
          username: data.username,
          confirmed: false,
          code: null,
          createdAt: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        },
        ...prev,
      ])
    })

    return () => {
      socket.off("forgot_user")
      socket.disconnect()
    }
  }, [])

  const handleConfirm = async (req) => {
    // ป้องกันการกดย้ำๆ
    if (loadingIds.includes(req.id)) return
    setLoadingIds((prev) => [...prev, req.id])

    try {
      // สุ่มรหัส 6 หลัก (หาก Backend ทำส่วนนี้เอง ให้ลบออกแล้วรับ code จาก res.data)
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString()

      const res = await api.post("/sendMessage", {
        username: req.username,
        message: generatedCode,
      })

      const finalCode = res.data?.code || generatedCode

      // อัปเดตสถานะเมื่อส่งสำเร็จจริงเท่านั้น
      setRequests((prev) =>
        prev.map((r) =>
          r.id === req.id ? { ...r, confirmed: true, code: finalCode } : r
        )
      )
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการส่งรหัส:", error)
      const errorMsg = error.response?.data?.message || "ส่งรหัสไม่สำเร็จ กรุณาลองใหม่"
      alert(`❌ ${errorMsg}`)
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== req.id))
    }
  }

  const handleDelete = (id) => {
    setRequests((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar เมนูด้านข้าง */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">คำขอเปลี่ยนรหัสผ่าน</h1>
            <p className="text-sm text-slate-500 mt-1">
              รายการแจ้งเตือนคำขอรีเซ็ตรหัสผ่านจากผู้ใช้งานแบบ Real-time
            </p>
          </div>
          <span className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Socket Live
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          {requests.length === 0 ? (
            <div className="text-center py-16">
              <FiBell className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">ยังไม่มีคำขอเปลี่ยนรหัสผ่านเข้ามาในขณะนี้</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {requests.map((req) => {
                const isLoading = loadingIds.includes(req.id)

                return (
                  <li
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-4 first:pt-0 last:pb-0 gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 text-base">
                          ผู้ใช้งาน: {req.username}
                        </span>
                        {req.createdAt && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <FiClock size={12} /> {req.createdAt}
                          </span>
                        )}
                      </div>

                      {req.confirmed ? (
                        <div className="mt-1 flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                          <FiCheck size={16} />
                          <span>ส่งรหัสชั่วคราวแล้ว:</span>
                          <span className="font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-emerald-700 tracking-wider">
                            {req.code}
                          </span>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-amber-600 flex items-center gap-1 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          รอแอดมินยืนยันและส่งรหัสชั่วคราว
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {!req.confirmed && (
                        <button
                          onClick={() => handleConfirm(req)}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-medium px-4 py-2 rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? "กำลังส่ง..." : "ยืนยันและส่งรหัส"}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(req.id)}
                        disabled={isLoading}
                        title="ลบคำขอ"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition disabled:opacity-40"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}

export default Notification