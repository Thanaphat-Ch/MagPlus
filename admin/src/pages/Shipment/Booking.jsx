import React, { useState, useEffect, useCallback, useMemo } from "react"
import Swal from "sweetalert2"
import { FiSearch, FiTruck, FiCalendar } from "react-icons/fi"
import { StatusBadge } from "../../components/StatusBadges"
import ShipmentDetailModal from "./components/ShipmentDetailModal"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import api from "../../api"

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-24">
    <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4zm2 5.29A7.96 7.96 0 014 12H0c0 3.04 1.13 5.82 3 7.94l3-2.65z"></path>
    </svg>
  </div>
)

const EmptyState = () => (
  <div className="text-center py-24">
    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-500">
      <FiTruck className="h-10 w-10" />
    </div>
    <h3 className="mt-6 text-xl font-semibold text-slate-800">ไม่มีรายการจอง</h3>
    <p className="mt-2 text-sm text-slate-500">ยังไม่มีการจองเข้ามาในระบบ ณ ขณะนี้</p>
  </div>
)

const FilteredEmptyState = () => (
  <div className="text-center py-24">
    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-500">
      <FiSearch className="h-10 w-10" />
    </div>
    <h3 className="mt-6 text-xl font-semibold text-slate-800">ไม่พบรายการที่ตรงกัน</h3>
    <p className="mt-2 text-sm text-slate-500">ไม่พบข้อมูลตามเงื่อนไขการค้นหาของคุณ</p>
  </div>
)

const formatDateToYMD = (date) => {
  if (!date) return ""
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

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

const tableHeaders = ["เลขที่ออเดอร์", "วันที่", "ทะเบียนรถ", "เลขที่ใบสั่งงาน", "คนขับ", "ชื่อผู้จอง", "ประเภทรถ", "ต้นทาง", "ปลายทาง", "สถานะ"]

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

      const licensePlate = String(booking.LC_H || "")
        .trim()
        .toLowerCase()
      const orderId = String(booking.id || "")
        .trim()
        .toLowerCase()
      const clientName = String(booking.name || "")
        .trim()
        .toLowerCase()
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
    <main className="flex-1 p-4 md:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="max-w-screen-2xl mx-auto bg-white shadow-sm rounded-2xl overflow-hidden border border-slate-200/80">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-6 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">รายการจอง (Booking)</h2>
            <p className="text-sm text-slate-500 mt-1">แสดงรายละเอียดการจองคิวรถทั้งหมดในระบบ</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
              <input type="text" className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ค้นหาทะเบียน, ออเดอร์, ผู้จอง..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  calendarClassName="bg-white shadow-xl rounded-2xl border border-slate-200 p-2"
                  placeholderText="เริ่มวันที่"
                />
              </div>

              <span className="text-xs text-slate-400">ถึง</span>

              <div className="relative">
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  calendarClassName="bg-white shadow-xl rounded-2xl border border-slate-200 p-2"
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
                  className="text-xs text-rose-500 hover:underline px-1"
                >
                  ล้างวันที่
                </button>
              )}
            </div>

            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full sm:w-44 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">สถานะทั้งหมด</option>
              <option value="0">รอตอบรับ</option>
              <option value="1">กำลังขนส่ง</option>
              <option value="3">งานที่เสร็จสิ้น</option>
              <option value="2">งานที่ปฏิเสธ</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <LoadingSpinner />
          ) : bookings.length === 0 ? (
            <EmptyState />
          ) : filteredBookings.length > 0 ? (
            <table className="min-w-full text-sm divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider hidden md:table-header-group">
                <tr>
                  {tableHeaders.map((header) => (
                    <th key={header} className="px-5 py-3.5 text-left whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredBookings.map((b, index) => (
                  <tr key={b.id ? `${b.id}-${index}` : index} className="block md:table-row border-b md:border-none p-4 md:p-0 mb-3 md:mb-0 cursor-pointer hover:bg-slate-50/80 transition-colors" onClick={() => setSelectedBooking(b)}>
                    <td className="px-5 py-2 md:py-3.5 font-mono text-slate-500 block md:table-cell text-right md:text-left">
                      <span className="md:hidden float-left font-semibold text-slate-700">เลขที่ออเดอร์:</span>
                      {b.id}
                    </td>
                    <td className="px-5 py-2 md:py-3.5 text-slate-600 block md:table-cell text-right md:text-left whitespace-nowrap">
                      <span className="md:hidden float-left font-semibold text-slate-700">วันที่:</span>
                      {formatDateDMY(b.date)}
                    </td>
                    <td className="px-5 py-2 md:py-3.5 font-medium text-slate-800 block md:table-cell text-right md:text-left">
                      <span className="md:hidden float-left font-semibold text-slate-700">ทะเบียนรถ:</span>
                      {b.LC_H || "-"}
                    </td>
                    <td className="px-5 py-2 md:py-3.5 font-mono text-xs text-slate-500 block md:table-cell text-right md:text-left">
                      <span className="md:hidden float-left font-semibold text-slate-700">ใบสั่งงาน:</span>
                      {b.S_Code || "-"}
                    </td>
                    <td className="px-5 py-2 md:py-3.5 text-slate-600 block md:table-cell text-right md:text-left">
                      <span className="md:hidden float-left font-semibold text-slate-700">คนขับ:</span>
                      {b.driver || "-"}
                    </td>
                    <td className="px-5 py-2 md:py-3.5 font-medium text-slate-800 block md:table-cell text-right md:text-left">
                      <span className="md:hidden float-left font-semibold text-slate-700">ผู้จอง:</span>
                      {b.name || "-"}
                    </td>
                    <td className="px-5 py-2 md:py-3.5 text-slate-600 block md:table-cell text-right md:text-left">
                      <span className="md:hidden float-left font-semibold text-slate-700">ประเภทรถ:</span>
                      {b.car || "-"}
                    </td>
                    <td className="px-5 py-2 md:py-3.5 text-slate-600 block md:table-cell text-right md:text-left">
                      <span className="md:hidden float-left font-semibold text-slate-700">ต้นทาง:</span>
                      {b.origin || "-"}
                    </td>
                    <td className="px-5 py-2 md:py-3.5 text-slate-600 block md:table-cell text-right md:text-left">
                      <span className="md:hidden float-left font-semibold text-slate-700">ปลายทาง:</span>
                      {b.destination || "-"}
                    </td>
                    <td className="px-5 py-2 md:py-3.5 block md:table-cell text-right md:text-left">
                      <span className="md:hidden float-left font-semibold text-slate-700">สถานะ:</span>
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <FilteredEmptyState />
          )}
        </div>
      </div>

      {selectedBooking && <ShipmentDetailModal open={!!selectedBooking} onClose={() => setSelectedBooking(null)} id={selectedBooking.id} lc_h={selectedBooking.LC_H} />}
    </main>
  )
}

export default Orderbooking
