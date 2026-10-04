import React, { useState, useEffect, useCallback, useMemo } from "react"
import Swal from "sweetalert2"
import { FiSearch, FiTruck, FiX } from "react-icons/fi"
import { StatusBadge } from "../../components/StatusBadges"
import ShipmentDetailModal from "./components/ShipmentDetailModal"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import api from "../../api"

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-20">
    <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4zm2 5.29A7.96 7.96 0 014 12H0c0 3.04 1.13 5.82 3 7.94l3-2.65z"></path>
    </svg>
  </div>
)

const EmptyState = () => (
  <div className="text-center py-16 px-4">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500">
      <FiTruck className="h-8 w-8" />
    </div>
    <h3 className="mt-4 text-lg font-semibold text-slate-800">ไม่มีรายการจอง</h3>
    <p className="mt-1 text-sm text-slate-500">ยังไม่มีการจองเข้ามาในระบบ ณ ขณะนี้</p>
  </div>
)

const FilteredEmptyState = () => (
  <div className="text-center py-16 px-4">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
      <FiSearch className="h-8 w-8" />
    </div>
    <h3 className="mt-4 text-lg font-semibold text-slate-800">ไม่พบรายการที่ตรงกัน</h3>
    <p className="mt-1 text-sm text-slate-500">ไม่พบข้อมูลตามเงื่อนไขการค้นหาของคุณ</p>
  </div>
)

const formatDateDMY = (dateStr) => {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return "-"
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

const tableHeaders = [
  "เลขที่ออเดอร์",
  "วันที่",
  "ทะเบียนรถ",
  "เลขที่ใบสั่งงาน",
  "คนขับ",
  "ชื่อผู้จอง",
  "ประเภทรถ",
  "ต้นทาง",
  "ปลายทาง",
  "สถานะ",
]

const Orderbooking = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get("/bookings", { silent: true })
      const rawData = Array.isArray(response.data) ? response.data : []
      rawData.sort((a, b) => new Date(b.date) - new Date(a.date))
      setBookings(rawData)
    } catch (error) {
      console.error("Error fetching bookings:", error)
      setBookings([])
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: "ไม่สามารถโหลดข้อมูลการจองได้" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = "รายการจองรถ"
    fetchBookings()
  }, [fetchBookings])

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const statusMatch = filterStatus === "all" || String(booking.statusID ?? booking.OrSt ?? "") === filterStatus

      const licensePlate = String(booking.LC_H || "").trim().toLowerCase()
      const orderId = String(booking.id || "").trim().toLowerCase()
      const clientName = String(booking.name || "").trim().toLowerCase()
      const searchKey = searchTerm.trim().toLowerCase()
      const searchMatch = !searchKey || licensePlate.includes(searchKey) || orderId.includes(searchKey) || clientName.includes(searchKey)

      if (!startDate && !endDate) return statusMatch && searchMatch

      const bDate = new Date(booking.date)
      if (isNaN(bDate.getTime())) return false

      if (startDate) {
        const s = new Date(startDate)
        s.setHours(0, 0, 0, 0)
        if (bDate < s) return false
      }

      if (endDate) {
        const e = new Date(endDate)
        e.setHours(23, 59, 59, 999)
        if (bDate > e) return false
      }

      return statusMatch && searchMatch
    })
  }, [bookings, filterStatus, searchTerm, startDate, endDate])

  return (
    // จุดสำคัญ 1: w-full min-w-0 max-w-full ป้องกัน Layout แม่โดนลูกดัน
    <main className="w-full min-w-0 max-w-full min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      <div className="w-full min-w-0 max-w-7xl mx-auto bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header & Filter Controls */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">รายการจอง (Booking)</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">แสดงรายละเอียดการจองคิวรถทั้งหมดในระบบ</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 lg:bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ค้นหาทะเบียน, ออเดอร์, ผู้จอง..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Date Pickers */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <div className="flex-1 sm:w-36">
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-3 py-2 bg-slate-50 lg:bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="เริ่มวันที่"
                />
              </div>

              <span className="text-xs text-slate-400 shrink-0">ถึง</span>

              <div className="flex-1 sm:w-36">
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-full px-3 py-2 bg-slate-50 lg:bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholderText="ถึงวันที่"
                />
              </div>

              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate(null)
                    setEndDate(null)
                  }}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg shrink-0 transition-colors"
                  title="ล้างวันที่"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Select */}
            <div className="lg:w-44">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 lg:bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="0">รอตอบรับ</option>
                <option value="1">กำลังขนส่ง</option>
                <option value="3">งานที่เสร็จสิ้น</option>
                <option value="2">งานที่ปฏิเสธ</option>
              </select>
            </div>

          </div>
        </div>

        {/* จุดสำคัญ 2 & 3: ครอบด้วย overflow-x-auto + min-w-0 และบังคับ table ขั้นต่ำ (min-w) */}
        <div className="w-full min-w-0 max-w-full overflow-x-auto">
          {loading ? (
            <LoadingSpinner />
          ) : bookings.length === 0 ? (
            <EmptyState />
          ) : filteredBookings.length === 0 ? (
            <FilteredEmptyState />
          ) : (
            <table className="w-full min-w-[960px] text-sm divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  {tableHeaders.map((header) => (
                    <th key={header} className="px-4 py-3.5 whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredBookings.map((b, index) => (
                  <tr
                    key={b.id ? `${b.id}-${index}` : index}
                    onClick={() => setSelectedBooking(b)}
                    className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-3.5 font-mono text-slate-500 whitespace-nowrap">{b.id}</td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{formatDateDMY(b.date)}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-800 whitespace-nowrap">{b.LC_H || "-"}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">{b.S_Code || "-"}</td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{b.driver || "-"}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-800 whitespace-nowrap">{b.name || "-"}</td>
                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{b.car || "-"}</td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-[160px] truncate" title={b.origin}>{b.origin || "-"}</td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-[160px] truncate" title={b.destination}>{b.destination || "-"}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {selectedBooking && (
        <ShipmentDetailModal
          open={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          id={selectedBooking.id}
          lc_h={selectedBooking.LC_H}
        />
      )}
    </main>
  )
}

export default Orderbooking