import React, { useState, useEffect, useMemo } from "react"
import axios from "axios"
import { FiPlus, FiSearch, FiTruck, FiAlertCircle, FiInbox, FiMenu, FiPackage, FiCheck, FiDownload } from "react-icons/fi"
import ShipmentDetailModal from "./components/ShipmentDetailModal"
import DatePicker from "react-datepicker"

const LoadingState = () => (
  <div className="text-center py-24">
    <svg className="animate-spin mx-auto h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="mt-4 text-lg text-gray-600">กำลังโหลดข้อมูล...</p>
  </div>
)

const ErrorState = ({ error }) => (
  <div className="text-center py-24 text-red-500">
    <FiAlertCircle className="w-16 h-16 mx-auto mb-4" />
    <h3 className="text-2xl font-semibold">เกิดข้อผิดพลาด</h3>
    <p className="text-gray-600 mt-2">{error}</p>
  </div>
)

const EmptyState = ({ searchQuery }) => (
  <div className="text-center py-24 text-gray-400">
    <FiInbox className="w-16 h-16 mx-auto mb-4" />
    <h3 className="text-2xl font-semibold">ไม่พบข้อมูล</h3>
    <p className="text-gray-600 mt-2">{searchQuery ? `ไม่พบผลลัพธ์สำหรับ "${searchQuery}"` : "ยังไม่มีข้อมูล Shipment ในระบบ"}</p>
  </div>
)

const ShipmentTracker = ({ status }) => {
  const steps = [
    { id: "Pending", label: "รอรับงาน", icon: <FiPackage className="w-5 h-5" /> },
    { id: "in_progress", label: "กำลังขนส่ง", icon: <FiTruck className="w-5 h-5" /> },
    { id: "Delivered", label: "จัดส่งสำเร็จ", icon: <FiCheck className="w-5 h-5" /> },
  ]

  const statusOrder = { Pending: 0, in_progress: 1, Delivered: 2 }
  const currentStepValue = statusOrder[status] ?? -1

  if (status === "Cancelled") {
    return (
      <div className="flex items-center justify-center p-2 rounded-lg bg-red-100 text-red-700">
        <FiAlertCircle className="w-5 h-5 mr-2" />
        <span className="font-semibold text-xs">ยกเลิกแล้ว</span>
      </div>
    )
  }

  return (
    <div className="flex items-start w-full max-w-xs md:max-w-sm py-2">
      {steps.map((step, index) => {
        const isStepCompleted = index < currentStepValue
        const isStepCurrent = index === currentStepValue
        const isStepFuture = index > currentStepValue
        const isAllDone = status === "Delivered"

        let iconBgClass = "bg-gray-100"
        let iconTextClass = "text-gray-500"
        let ringClass = ""
        let lineClass = "border-gray-300"

        if (isStepCompleted || isAllDone) {
          iconBgClass = "bg-green-100"
          iconTextClass = "text-green-700"
          lineClass = "border-green-600"
        } else if (isStepCurrent) {
          iconBgClass = "bg-blue-100"
          iconTextClass = "text-blue-700"
          ringClass = "ring-4 ring-blue-200"
          lineClass = "border-blue-600"
        }

        return (
          <React.Fragment key={step.id}>
            {index > 0 && (
              <div
                className={`flex-auto border-t-2 mt-5
                ${isStepCompleted || isStepCurrent || isAllDone ? lineClass : "border-gray-300"}
              `}
              />
            )}
            <div className="flex flex-col items-center flex-shrink-0 px-2" title={step.label}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
              ${iconBgClass} ${iconTextClass} ${ringClass}`}
              >
                {isStepCompleted || isAllDone ? <FiCheck className="w-6 h-6" /> : step.icon}
              </div>
              <span className={`text-xs text-center mt-2 font-medium w-20 transition-colors ${iconTextClass}`}>{step.label}</span>
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

const getTodayISO = () => {
    const today = new Date()
    return today.toISOString().split("T")[0] // YYYY-MM-DD
  }

export default function Shipment() {
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedId, setSelectedId] = useState(null)
  const [selectedLC_H, setSelectedLC_H] = useState(null)

  const [startDate, setStartDate] = useState(getTodayISO())
  const [endDate, setEndDate] = useState(getTodayISO())

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

  useEffect(() => {
    const fetchShipments = async () => {
      setLoading(true)
      setError("")
      try {
        const res = await axios.get("https://app.magnitudetms.com/api/shipment")
        const formattedData = res.data.map((item) => ({
          ...item,
          Status: statusMap[item.OrStDesc] || "Pending",
          proofOfDeliveryUrl: item.OrStDesc === "งานที่เสร็จสิ้น" ? `https://via.placeholder.com/800x600.png?text=POD+${item.S_Code || "Image"}` : null,
        }))
        setShipments(formattedData)
        console.log("Fetched Shipments:", formattedData)
      } catch (err) {
        setError("เกิดข้อผิดพลาด: ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchShipments()
  }, [])



  const filteredShipments = useMemo(() => {
    return shipments.filter((s) => {
      const matchSearch =
        !searchQuery ||
        s.PickPoint?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.DropPoint?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.Status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.LC_H?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.S_Code?.toLowerCase().includes(searchQuery.toLowerCase())

      // วันที่ใช้ฟิลเตอร์ (PickUp เวลา หรือ Drop เวลา?)
      const shipDate = s.DateDesc ? new Date(s.DateDesc) : null

      if (!shipDate) return false

      // ถ้ามี startDate ให้เช็ค
      if (startDate && shipDate < new Date(startDate)) {
        return false
      }

      // ถ้ามี endDate ให้เช็ค
      if (endDate && shipDate > new Date(endDate + "T23:59:59")) {
        return false
      }

      return matchSearch
    })
  }, [shipments, searchQuery, startDate, endDate])

  const formatDateTime = (dt) => {
    if (!dt) return "-"
    const d = new Date(dt)
    if (isNaN(d)) return "-"
    return new Intl.DateTimeFormat("th-TH", { dateStyle: "short", timeStyle: "short" }).format(d)
  }

  const DownloadButton = ({ shipment }) => {
    if (shipment.proofOfDeliveryUrl) {
      return (
        <a
          href={shipment.proofOfDeliveryUrl}
          download={`POD_${shipment.S_Code || "image"}.png`}
          target="_blank"
          rel="noopener noreferrer"
          title="ดาวน์โหลดรูปภาพ"
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <FiDownload className="w-5 h-5" />
        </a>
      )
    }
    return (
      <span title="ไม่มีรูปภาพ" className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-200 text-gray-400 cursor-not-allowed">
        <FiDownload className="w-5 h-5" />
      </span>
    )
  }

  const tableHeaders = [
    { key: "seq", label: "ลำดับ", align: "left" },
    { key: "jobNo", label: "เลขที่ใบงาน", align: "left" },
    { key: "license", label: "ทะเบียนรถ", align: "left" },
    { key: "pickupLoc", label: "สถานที่ขึ้นสินค้า", align: "left" },
    { key: "pickupTime", label: "เวลาขึ้นสินค้า", align: "left" },
    { key: "dropoffLoc", label: "สถานที่ลงสินค้า", align: "left" },
    { key: "dropoffTime", label: "เวลาลงสินค้า", align: "left" },
    { key: "status", label: "ติดตามสถานะ", align: "center" },
  ]

  const renderContent = () => {
    if (loading) return <LoadingState />
    if (error) return <ErrorState error={error} />
    if (filteredShipments.length === 0) return <EmptyState searchQuery={searchQuery} />
    return (
      <div>
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                {tableHeaders.map((header) => (
                  <th key={header.key} className={`px-6 py-3 ${header.align === "center" ? "text-center" : "text-left"} text-xs font-semibold text-gray-600 uppercase tracking-wider`}>
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredShipments.map((s, idx) => (
                <tr key={s.Orderid || idx} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openDetailModal(s.Orderid, s.LC_H)}>
                  <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{s.S_Code || "-"}</td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-800">{s.LC_H || "-"}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{s.PickPoint || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(s.PickupDepartureTime)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{s.DropPoint || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(s.DeliveryCompletionTime)}</td>
                  <td className="px-6 py-4">
                    <ShipmentTracker status={s.Status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden space-y-4">
          {filteredShipments.map((s, idx) => (
            <div key={s.Orderid || idx} className="bg-white p-4 rounded-lg shadow border border-gray-200 cursor-pointer" onClick={() => openDetailModal(s.Orderid, s.LC_H)}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="font-bold text-lg text-gray-800">Shipment #{idx + 1}</span>
                  <p className="text-sm text-gray-600">{s.S_Code || "-"}</p>
                </div>
              </div>
              <div className="mb-4 pb-4 border-b border-gray-200">
                <ShipmentTracker status={s.Status} />
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <strong className="font-semibold text-gray-700 w-24 inline-block">ทะเบียนรถ:</strong> {s.LC_H || "-"}
                </p>
                <p>
                  <strong className="font-semibold text-gray-700 w-24 inline-block">จาก:</strong> {s.PickPoint || "-"}
                </p>
                <p className="text-gray-500 text-xs pl-28 -mt-2">{formatDateTime(s.PickupDepartureTime)}</p>
                <p>
                  <strong className="font-semibold text-gray-700 w-24 inline-block">ไป:</strong> {s.DropPoint || "-"}
                </p>
                <p className="text-gray-500 text-xs pl-28 -mt-2">{formatDateTime(s.DeliveryCompletionTime)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const openDetailModal = (id, LC_H) => {
    setSelectedId(id)
    setSelectedLC_H(LC_H)
  }

  return (
    <main className="flex-1 flex flex-col">
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
                <FiTruck className="mr-3 text-blue-600" />
                <span>การจัดการ Shipment</span>
              </h1>
              <p className="text-gray-500 mt-2">ภาพรวมและจัดการรายการ Shipment ทั้งหมดในระบบ</p>
            </div>
          </div>
          <div className="bg-white shadow-lg rounded-xl">
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                {/* Search Input */}
                <input type="text" placeholder="ค้นหา..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-64" />

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
              </div>
            </div>
            <div>{renderContent()}</div>
          </div>
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
