import React, { useState, useEffect, useMemo, useCallback } from "react"
import { FiSearch, FiTruck, FiAlertCircle, FiInbox, FiPackage, FiCheck, FiDownload } from "react-icons/fi"
import ShipmentDetailModal from "./components/ShipmentDetailModal"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import api from "../../api"

const LoadingState = () => (
  <div className="text-center py-24">
    <svg className="animate-spin mx-auto h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="mt-4 text-sm text-slate-500 font-medium">กำลังโหลดข้อมูล Shipment...</p>
  </div>
)

const ErrorState = ({ error }) => (
  <div className="text-center py-24 text-rose-500">
    <FiAlertCircle className="w-14 h-14 mx-auto mb-3" />
    <h3 className="text-xl font-bold text-slate-800">เกิดข้อผิดพลาด</h3>
    <p className="text-sm text-slate-500 mt-1">{error}</p>
  </div>
)

const EmptyState = ({ searchQuery }) => (
  <div className="text-center py-24 text-slate-400">
    <FiInbox className="w-14 h-14 mx-auto mb-3" />
    <h3 className="text-lg font-bold text-slate-700">ไม่พบข้อมูล</h3>
    <p className="text-sm text-slate-500 mt-1">{searchQuery ? `ไม่พบผลลัพธ์สำหรับ "${searchQuery}"` : "ยังไม่มีข้อมูล Shipment ในระบบ"}</p>
  </div>
)

const ShipmentTracker = ({ status }) => {
  const steps = [
    { id: "Pending", label: "รอรับงาน", icon: <FiPackage className="w-4 h-4" /> },
    { id: "in_progress", label: "กำลังขนส่ง", icon: <FiTruck className="w-4 h-4" /> },
    { id: "Delivered", label: "จัดส่งสำเร็จ", icon: <FiCheck className="w-4 h-4" /> },
  ]

  const statusOrder = { Pending: 0, in_progress: 1, Delivered: 2 }
  const currentStepValue = statusOrder[status] ?? -1

  if (status === "Cancelled") {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
        <FiAlertCircle className="w-3.5 h-3.5" />
        <span>ยกเลิกแล้ว</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center w-full max-w-[240px] mx-auto py-1">
      {steps.map((step, index) => {
        const isCompleted = index < currentStepValue
        const isCurrent = index === currentStepValue
        const isAllDone = status === "Delivered"

        let circleStyle = "bg-slate-100 text-slate-400 border-slate-200"
        let lineStyle = "border-slate-200"
        let labelStyle = "text-slate-400 font-normal"

        if (isCompleted || isAllDone) {
          circleStyle = "bg-emerald-500 text-white border-emerald-500"
          lineStyle = "border-emerald-500"
          labelStyle = "text-emerald-700 font-semibold"
        } else if (isCurrent) {
          circleStyle = "bg-blue-600 text-white border-blue-600 ring-4 ring-blue-100"
          labelStyle = "text-blue-700 font-semibold"
        }

        return (
          <React.Fragment key={step.id}>
            {index > 0 && <div className={`flex-1 border-t-2 transition-colors ${isCompleted || isCurrent || isAllDone ? lineStyle : "border-slate-200"}`} />}
            <div className="flex flex-col items-center flex-shrink-0 px-1" title={step.label}>
              <div className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${circleStyle}`}>{isCompleted || isAllDone ? <FiCheck className="w-3.5 h-3.5" /> : step.icon}</div>
              <span className={`text-[10px] text-center mt-1 whitespace-nowrap ${labelStyle}`}>{step.label}</span>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

const statusMap = {
  งานที่เสร็จสิ้น: "Delivered",
  กำลังขนส่ง: "in_progress",
  รอตอบรับ: "Pending",
  งานที่ปฏิเสธ: "Cancelled",
}

const formatDateTime = (dt) => {
  if (!dt) return "-"
  const d = new Date(dt)
  if (isNaN(d.getTime())) return "-"
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "short", timeStyle: "short" }).format(d)
}

const tableHeaders = [
  { key: "seq", label: "ลำดับ", align: "center" },
  { key: "jobNo", label: "เลขที่ใบงาน", align: "left" },
  { key: "license", label: "ทะเบียนรถ", align: "left" },
  { key: "pickupLoc", label: "สถานที่ขึ้นสินค้า", align: "left" },
  { key: "pickupTime", label: "เวลาขึ้นสินค้า", align: "left" },
  { key: "dropoffLoc", label: "สถานที่ลงสินค้า", align: "left" },
  { key: "dropoffTime", label: "เวลาลงสินค้า", align: "left" },
  { key: "status", label: "ติดตามสถานะ", align: "center" },
]

export default function Shipment() {
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedId, setSelectedId] = useState(null)
  const [selectedLC_H, setSelectedLC_H] = useState(null)

  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)

  const fetchShipments = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await api.get("/shipment", { silent: true })
      const rawData = Array.isArray(res.data) ? res.data : []
      const formattedData = rawData.map((item) => ({
        ...item,
        Status: statusMap[item.OrStDesc] || item.Status || "Pending",
        proofOfDeliveryUrl: item.OrStDesc === "งานที่เสร็จสิ้น" ? `https://via.placeholder.com/800x600.png?text=POD+${item.S_Code || "Image"}` : null,
      }))
      setShipments(formattedData)
    } catch (err) {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์เพื่อโหลดข้อมูล Shipment ได้")
      console.error("Fetch shipments error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = "การจัดการ Shipment"
    fetchShipments()
  }, [fetchShipments])

  const openDetailModal = (id, LC_H) => {
    setSelectedId(id)
    setSelectedLC_H(LC_H)
  }

  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      const query = searchQuery.trim().toLowerCase()
      const matchSearch = !query || s.PickPoint?.toLowerCase().includes(query) || s.DropPoint?.toLowerCase().includes(query) || s.Status?.toLowerCase().includes(query) || s.LC_H?.toLowerCase().includes(query) || s.S_Code?.toLowerCase().includes(query)

      if (!startDate && !endDate) return matchSearch

      const rawDateStr = s.DateDesc || s.PickupDepartureTime || s.date
      const shipDate = rawDateStr ? new Date(rawDateStr) : null

      if (!shipDate || isNaN(shipDate.getTime())) return matchSearch

      if (startDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        if (shipDate < start) return false
      }

      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        if (shipDate > end) return false
      }

      return matchSearch
    })
  }, [shipments, searchQuery, startDate, endDate])

  const renderContent = () => {
    if (loading) return <LoadingState />
    if (error) return <ErrorState error={error} />
    if (filteredShipments.length === 0) return <EmptyState searchQuery={searchQuery} />

    return (
      <div>
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                {tableHeaders.map((header) => (
                  <th key={header.key} className={`px-5 py-3.5 ${header.align === "center" ? "text-center" : "text-left"} text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap`}>
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100 text-sm">
              {filteredShipments.map((s, idx) => (
                <tr key={s.Orderid || s.id || idx} className="hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={() => openDetailModal(s.Orderid || s.id, s.LC_H)}>
                  <td className="px-5 py-3.5 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800 font-mono text-xs">{s.S_Code || "-"}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-700">{s.LC_H || "-"}</td>
                  <td className="px-5 py-3.5 text-slate-700">{s.PickPoint || "-"}</td>
                  <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{formatDateTime(s.PickupDepartureTime)}</td>
                  <td className="px-5 py-3.5 text-slate-700">{s.DropPoint || "-"}</td>
                  <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{formatDateTime(s.DeliveryCompletionTime)}</td>
                  <td className="px-5 py-3.5 text-center">
                    <ShipmentTracker status={s.Status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-slate-100 p-2">
          {filteredShipments.map((s, idx) => (
            <div key={s.Orderid || s.id || idx} className="p-4 rounded-xl hover:bg-slate-50 cursor-pointer space-y-3" onClick={() => openDetailModal(s.Orderid || s.id, s.LC_H)}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-slate-800 text-base">Shipment #{idx + 1}</span>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">{s.S_Code || "-"}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">{s.LC_H || "-"}</span>
              </div>

              <div className="py-2 border-y border-slate-100">
                <ShipmentTracker status={s.Status} />
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-start justify-between">
                  <span className="text-slate-400 font-medium">ต้นทาง:</span>
                  <div className="text-right">
                    <span className="text-slate-700 font-medium">{s.PickPoint || "-"}</span>
                    <p className="text-[11px] text-slate-400">{formatDateTime(s.PickupDepartureTime)}</p>
                  </div>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-slate-400 font-medium">ปลายทาง:</span>
                  <div className="text-right">
                    <span className="text-slate-700 font-medium">{s.DropPoint || "-"}</span>
                    <p className="text-[11px] text-slate-400">{formatDateTime(s.DeliveryCompletionTime)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <main className="flex-1 p-4 md:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
              <FiTruck className="text-blue-600" />
              การจัดการ Shipment
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">ภาพรวมและติดตามสถานะการจัดส่งสินค้าทั้งหมดในระบบ</p>
          </div>

          <button onClick={fetchShipments} disabled={loading} className="self-start sm:self-auto text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm transition disabled:opacity-50">
            {loading ? "กำลังรีเฟรช..." : "🔄 รีเฟรชข้อมูล"}
          </button>
        </div>

        <div className="bg-white shadow-sm rounded-2xl border border-slate-200/80 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="ค้นหาใบงาน, ทะเบียน, สถานที่..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="flex items-center gap-2">
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  calendarClassName="bg-white shadow-xl rounded-2xl border border-slate-200 p-2"
                  placeholderText="เริ่มวันที่"
                />

                <span className="text-xs text-slate-400">ถึง</span>

                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  calendarClassName="bg-white shadow-xl rounded-2xl border border-slate-200 p-2"
                  placeholderText="ถึงวันที่"
                />

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
            </div>
          </div>

          <div>{renderContent()}</div>
        </div>
      </div>

      <ShipmentDetailModal
        open={selectedId !== null}
        onClose={() => {
          setSelectedId(null)
          setSelectedLC_H(null)
        }}
        id={selectedId}
        lc_h={selectedLC_H}
      />
    </main>
  )
}
