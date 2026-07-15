import React, { useState, useEffect, useCallback, useMemo } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import { FiSearch, FiTruck } from "react-icons/fi"
import { StatusBadge } from "../../components/StatusBadges"
import ShipmentDetailModal from "./components/ShipmentDetailModal"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-24">
    <svg className="animate-spin h-12 w-12 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4zm2 5.29A7.96 7.96 0 014 12H0c0 3.04 1.13 5.82 3 7.94l3-2.65z"></path>
    </svg>
  </div>
)

const EmptyState = () => (
  <div className="text-center py-24">
    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100">
      <FiTruck className="h-10 w-10 text-indigo-500" />
    </div>
    <h3 className="mt-6 text-xl font-semibold text-gray-800">ไม่มีรายการจอง</h3>
    <p className="mt-2 text-base text-gray-500">ยังไม่มีการจองเข้ามาในระบบ ณ ขณะนี้</p>
  </div>
)

const FilteredEmptyState = () => (
  <div className="text-center py-24">
    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
      <FiSearch className="h-10 w-10 text-gray-500" />
    </div>
    <h3 className="mt-6 text-xl font-semibold text-gray-800">ไม่พบรายการที่ตรงกัน</h3>
    <p className="mt-2 text-base text-gray-500">ไม่พบข้อมูลตามเงื่อนไขการค้นหาของคุณ</p>
  </div>
)

const getTodayISO = () => {
    const today = new Date()
    return today.toISOString().split("T")[0] // YYYY-MM-DD
  }

const Orderbooking = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("0")
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState(getTodayISO())
    const [endDate, setEndDate] = useState(getTodayISO())
  const [selectedBooking, setSelectedBooking] = useState(null) // สำหรับ modal

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      const response = await axios.get("https://app.magnitudetms.com/api/bookings")
      const rawData = Array.isArray(response.data) ? response.data : []
      rawData.sort((a, b) => new Date(b.date) - new Date(a.date))
      setBookings(rawData)
      // console.log("Fetched bookings:", rawData)
    } catch (error) {
      console.error("Error fetching bookings:", error)
      setBookings([])
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: "ไม่สามารถโหลดข้อมูลการจองได้" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      // Filter by OrSt ตรง ๆ
      const statusMatch = filterStatus === "all" || String(booking.statusID) === filterStatus

      // Filter by search term
      const licensePlate = String(booking.LC_H || "")
        .trim()
        .toLowerCase()
      const searchMatch = searchTerm.trim() === "" || licensePlate.includes(searchTerm.trim().toLowerCase())

      // Filter by date
      const bookingDate = new Date(booking.date)
      const start = startDate ? new Date(startDate) : null
      const end = endDate ? new Date(endDate) : null
      if (end) end.setHours(23, 59, 59, 999)
      const dateMatch = (!start || bookingDate >= start) && (!end || bookingDate <= end)

      return statusMatch && searchMatch && dateMatch
    })
  }, [bookings, filterStatus, searchTerm, startDate, endDate])

  const tableHeaders = ["เลขที่ออเดอร์", "วันที่", "ทะเบียนรถ", "เลขที่ใบสั่งงาน", "คนขับ", "ชื่อผู้จอง", "ประเภทรถ", "ต้นทาง", "ปลายทาง", "สถานะ"]

const formatDateDMY = (dateStr) => {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d) // ผลลัพธ์: 17/12/2025
}


  return (
    <main className="flex-1 p-4 md:p-8">
      <div className="max-w-screen-2xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200/80">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-gray-200 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">รายการจอง (Booking)</h2>
            <p className="text-gray-500 mt-1">แสดงรายละเอียดการจองทั้งหมดในระบบ</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <input type="text" className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-3 pl-10" placeholder="ค้นหาทะเบียนรถ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div className="flex items-center gap-2">
              {/* <div className="relative flex flex-col">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2" />

                {startDate && <span className="text-xs text-gray-500 mt-1">วันที่เริ่มต้น: {formatDateDMY(startDate)}</span>}
              </div> */}
              <DatePicker
                selected={startDate ? new Date(startDate) : null}
                onChange={(date) => setStartDate(date.toISOString().split("T")[0])}
                dateFormat="dd/MM/yyyy"
                className="border border-gray-300 rounded-lg px-4 py-2 w-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                calendarClassName="bg-white shadow-lg rounded-xl border border-gray-200 p-2"
                placeholderText="เลือกวันที่"
              />

              <span className="whitespace-nowrap">ถึง</span>

              {/* <div className="relative flex flex-col">
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2" />
                {endDate && <span className="text-xs text-gray-500 mt-1">วันที่สิ้นสุด: {formatDateDMY(endDate)}</span>}
              </div> */}
              <DatePicker
                selected={endDate ? new Date(endDate) : null}
                onChange={(date) => setEndDate(date.toISOString().split("T")[0])}
                dateFormat="dd/MM/yyyy"
                className="border border-gray-300 rounded-lg px-4 py-2 w-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                calendarClassName="bg-white shadow-lg rounded-xl border border-gray-200 p-2"
                placeholderText="เลือกวันที่"
              />
            </div>

            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="block w-full sm:w-56 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base py-3 px-4">
              <option value="all">สถานะทั้งหมด</option>
              <option value="0">{"รอตอบรับ"}</option>
              <option value="1">{"กำลังขนส่ง"}</option>
              <option value="3">{"งานที่เสร็จสิ้น"}</option>
              <option value="2">{"งานที่ปฏิเสธ"}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <LoadingSpinner />
          ) : bookings.length === 0 ? (
            <EmptyState />
          ) : filteredBookings.length > 0 ? (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 hidden md:table-header-group">
                <tr>
                  {tableHeaders.map((header) => (
                    <th key={header} className="px-6 py-4 text-left font-semibold text-gray-600 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBookings.map((b, index) => {
                  return (
                    <tr key={`${b.id}-${index}`} className="block md:table-row border-b md:border-none p-4 md:p-0 mb-4 md:mb-0 cursor-pointer hover:bg-gray-50" onClick={() => setSelectedBooking(b)}>
                      <td data-label="เลขที่ออเดอร์" className="px-6 py-2 md:py-4 text-gray-600 block md:table-cell text-right md:text-left">
                        {b.id}
                      </td>
                      <td data-label="วันที่" className="px-6 py-2 md:py-4 text-gray-600 block md:table-cell text-right md:text-left">
                        {new Date(b.date).toLocaleDateString("th-TH")}
                      </td>
                      <td data-label="ทะเบียนรถ" className="px-6 py-2 md:py-4 text-gray-600 block md:table-cell text-right md:text-left">
                        {b.LC_H}
                      </td>
                      <td data-label="เลขที่ใบสั่งงาน" className="px-6 py-2 md:py-4 text-gray-600 block md:table-cell text-right md:text-left">
                        {b.S_Code}
                      </td>
                      <td data-label="คนขับ" className="px-6 py-2 md:py-4 text-gray-600 block md:table-cell text-right md:text-left">
                        {b.driver || "-"}
                      </td>
                      <td data-label="ชื่อผู้จอง" className="px-6 py-2 md:py-4 font-semibold text-gray-900 block md:table-cell text-right md:text-left text-sm md:text-xs">
                        {b.name}
                      </td>
                      <td data-label="ประเภทรถ" className="px-6 py-2 md:py-4 text-gray-600 block md:table-cell text-right md:text-left">
                        {b.car}
                      </td>
                      <td data-label="ต้นทาง" className="px-6 py-2 md:py-4 text-gray-600 block md:table-cell text-right md:text-left">
                        {b.origin}
                      </td>
                      <td data-label="ปลายทาง" className="px-6 py-2 md:py-4 text-gray-600 block md:table-cell text-right md:text-left">
                        {b.destination}
                      </td>
                      <td data-label="สถานะ" className="px-6 py-2 md:py-4 flex justify-between items-center md:table-cell md:text-left">
                        <StatusBadge status={b.status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <FilteredEmptyState />
          )}
        </div>
      </div>

      {/* Shipment Detail Modal */}
      {selectedBooking && <ShipmentDetailModal open={!!selectedBooking} onClose={() => setSelectedBooking(null)} id={selectedBooking.id} lc_h={selectedBooking.LC_H} />}
    </main>
  )
}

export default Orderbooking
