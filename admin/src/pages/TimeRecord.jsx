import React, { useEffect, useState, useMemo } from "react"
import { FiClock, FiSearch } from "react-icons/fi"
import Sidebar from "../components/Sidebar"
import api from "../api"

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-violet-100 text-violet-700 border-violet-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
]

const getInitialsColor = (str = "") => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const InitialsCircle = ({ name = "", surname = "" }) => {
  const initials = `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase() || "?"
  const colorClass = useMemo(() => getInitialsColor(name + surname), [name, surname])

  return (
    <div
      className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 select-none ${colorClass}`}
    >
      {initials}
    </div>
  )
}

function TimeRecord() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState("")

  useEffect(() => {
    document.title = "ประวัติการลงเวลา"
    fetchAttendance()
  }, [])

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const res = await api.get("/attendance", { silent: true })
      setRecords(res.data || [])
    } catch (error) {
      console.error("Error fetching attendance:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return null
    return new Date(dateTimeString).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (dateString) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const fullName = `${r.name || ""} ${r.surname || ""} ${r.user_id || ""}`.toLowerCase()
      const matchSearch = fullName.includes(searchTerm.toLowerCase().trim())
      
      let matchDate = true
      if (selectedDate && r.date) {
        matchDate = r.date.startsWith(selectedDate)
      }

      return matchSearch && matchDate
    })
  }, [records, searchTerm, selectedDate])

  return (
    <div className="flex flex-1 min-h-screen bg-slate-50">
      <main className="flex-1 p-4 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
              <FiClock className="text-blue-600" />
              ประวัติการลงเวลา
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              ตรวจสอบเวลาเข้า-ออกงานของพนักงานทั้งหมด
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ หรือ User ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-56"
              />
            </div>

            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {(searchTerm || selectedDate) && (
              <button
                onClick={() => {
                  setSearchTerm("")
                  setSelectedDate("")
                }}
                className="text-xs text-rose-500 hover:underline px-2 py-1"
              >
                ล้างฟิลเตอร์
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 font-medium animate-pulse">
            กำลังโหลดข้อมูลบันทึกเวลา...
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto hidden md:block">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 text-left">พนักงาน</th>
                    <th className="px-6 py-3.5 text-left">วันที่</th>
                    <th className="px-6 py-3.5 text-center">เวลาเข้างาน</th>
                    <th className="px-6 py-3.5 text-center">เวลาออกงาน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <InitialsCircle name={record.name} surname={record.surname} />
                            <div>
                              <div className="font-semibold text-slate-800">
                                {record.name} {record.surname}
                              </div>
                              <div className="text-xs text-slate-400 font-mono">
                                ID: {record.user_id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-slate-600">
                          {formatDate(record.date)}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-center">
                          {formatTime(record.check_in_time) ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {formatTime(record.check_in_time)}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-center">
                          {formatTime(record.check_out_time) ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              {formatTime(record.check_out_time)}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                        ไม่พบข้อมูลการลงเวลา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-slate-100">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <div key={record.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <InitialsCircle name={record.name} surname={record.surname} />
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">
                            {record.name} {record.surname}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">ID: {record.user_id}</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {formatDate(record.date)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium mb-0.5">เข้างาน</p>
                        <p className="text-sm font-semibold text-emerald-600">
                          {formatTime(record.check_in_time) || "-"}
                        </p>
                      </div>
                      <div className="border-l border-slate-200">
                        <p className="text-[10px] text-slate-400 font-medium mb-0.5">ออกงาน</p>
                        <p className="text-sm font-semibold text-rose-600">
                          {formatTime(record.check_out_time) || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-12 text-center text-slate-400 text-sm">ไม่พบข้อมูลการลงเวลา</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default TimeRecord