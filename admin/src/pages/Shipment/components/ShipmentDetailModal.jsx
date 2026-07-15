// ShipmentDetailModal.jsx
import React, { useState, useEffect } from "react"
import axios from "axios"
import { MapPin, Truck, User, Package, Gauge, Coins, CircleDot, Clock } from "lucide-react"
import { FileText } from "lucide-react"

const InfoRow = ({ icon: Icon, label, value, highlight = false }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
    <div className={`mt-0.5 ${highlight ? "text-blue-600" : "text-gray-400"}`}>
      <Icon size={20} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className={`text-sm font-medium ${highlight ? "text-gray-900" : "text-gray-700"}`}>{value}</div>
    </div>
  </div>
)

const LoadUnloadModal = ({ open, onClose, type, detail }) => {
  const [previewSrc, setPreviewSrc] = useState(null)
  useEffect(() => {
    setPreviewSrc(null)
  }, [type, detail])

  if (!open) return null

  const isPick = type === "pick"

  const signature = isPick ? detail.PickupSignature : detail.DeliveryRecipientSignature
  const productImages = isPick ? detail.PickupProductImages || [] : detail.DeliveryUnloadingImages || []

  const workOrderImages = isPick ? detail.PickupWorkOrderImages || [] : detail.DeliveryReceiptImages || []

  const time = isPick ? detail.PickupDepartureTime : detail.DeliveryCompletionTime
  const signerName = isPick ? detail.PickupSignerName : detail.DeliveryRecipientName
  const mile = isPick ? detail.PickupMileage : detail.DeliveryMileage

  // gps
  const lat = isPick ? detail.PickupLat : detail.DeliveryLat
  const lng = isPick ? detail.PickupLon : detail.DeliveryLon

  const openPreview = (src) => setPreviewSrc(src)
  const closePreview = () => setPreviewSrc(null)
  const handleClose = () => {
    setPreviewSrc(null) // เคลียร์รูป preview
    onClose?.() // ปิด modal ย่อย
  }

  return (
    <>
      {/* ========== MAIN MODAL ========== */}
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white w-[90%] max-w-md max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl relative">
          {/* Close Button */}
          <button onClick={handleClose} className="absolute right-4 top-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-black transition-colors">
            ✕
          </button>

          {/* Header */}
          <div className={`${isPick ? "bg-gradient-to-r from-green-600 to-green-700" : "bg-gradient-to-r from-red-600 to-red-700"} px-6 py-5 rounded-t-2xl pr-14`}>
            <div className="flex items-center gap-2 text-white/90 mb-1">
              <MapPin size={16} />
              <span className="text-xs font-medium">{isPick ? "ต้นทาง" : "ปลายทาง"}</span>
            </div>
            <h2 className="text-lg font-bold text-white">{isPick ? "ข้อมูลโหลดของ" : "ข้อมูลลงของ"}</h2>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
            {/* เวลา - ใช้ InfoRow */}
            <InfoRow icon={Clock} label="เวลา" value={time ? new Date(time).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "—"} highlight />
            {/* gps */}
            <InfoRow
              icon={MapPin}
              label="ตำแหน่ง"
              value={
                lat && lng ? (
                  <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                    {lat}, {lng}
                  </a>
                ) : (
                  "—"
                )
              }
            />

            <InfoRow icon={Gauge} label="เลขไมล์" value={mile ? `${mile} km` : "—"} highlight />

            {/* ลายเซ็น */}
            <div className="border-2 border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="text-purple-600" size={20} />
                <span className="font-semibold text-gray-900">ลายเซ็น</span>
              </div>
              {signature ? (
                <div className="space-y-2">
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-3 inline-block cursor-pointer hover:border-purple-400 transition-colors" onClick={() => openPreview(signature)}>
                    <img src={signature} alt="ลายเซ็น" className="w-40 h-auto" />
                  </div>
                  {signerName && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <User size={14} /> {signerName}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">ไม่มีลายเซ็น</p>
              )}
            </div>
            {/* รูปสินค้า */}
            <div className="border-2 border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="text-blue-600" size={20} />
                <span className="font-semibold text-gray-900">รูปสินค้า</span>
                {productImages.length > 0 && <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{productImages.length} รูป</span>}
              </div>

              {productImages.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto py-2">
                  {productImages.map((img, i) => (
                    <div key={i} className="relative flex-shrink-0 group cursor-pointer" onClick={() => openPreview(img)}>
                      <img src={img} alt={`รูปสินค้า ${i + 1}`} className="w-40 h-40 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors" />
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">{i + 1}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">ไม่มีรูปสินค้า</p>
              )}
            </div>

            {/* รูปใบงาน */}
            <div className="border-2 border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="text-orange-600" size={20} />
                <span className="font-semibold text-gray-900">รูปใบงาน</span>
                {workOrderImages.length > 0 && <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">{workOrderImages.length} รูป</span>}
              </div>

              {workOrderImages.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto py-2">
                  {workOrderImages.map((img, i) => (
                    <div key={i} className="relative flex-shrink-0 group cursor-pointer" onClick={() => openPreview(img)}>
                      <img src={img} alt={`รูปใบงาน ${i + 1}`} className="w-40 h-40 object-cover rounded-lg border-2 border-gray-200 hover:border-orange-400 transition-colors" />
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">เอกสาร {i + 1}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">ไม่มีรูปใบงาน</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========== PREVIEW MODAL ========== */}
      {previewSrc && <ImagePreviewModal src={previewSrc} field="preview-image" onClose={closePreview} />}
    </>
  )
}

const ImagePreviewModal = ({ src, onClose }) => {
  if (!src) return null

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose} // คลิกที่ background ปิด modal
    >
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt="preview" className="max-h-[90vh] max-w-[90vw] rounded shadow-lg" />
        <button onClick={onClose} className="absolute top-2 right-2 text-white bg-black/50 rounded-full p-1 hover:bg-black/70">
          ✕
        </button>
      </div>
    </div>
  )
}

export default function ShipmentDetailModal({ open, onClose, id, lc_h }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [openLoadModal, setOpenLoadModal] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState(null)

  // โหลดรายละเอียด shipment
  useEffect(() => {
    if (!open || !id) return

    const fetchDetail = async () => {
      setLoading(true)
      setError("")
      try {
        const res = await axios.get(`http://localhost:5000/api/shipmentQ?id=${id}&lc_h=${lc_h}`)
        setDetail(res.data)
      } catch (err) {
        setError("โหลดข้อมูลไม่สำเร็จ : " + (err.response?.data?.message || err.message))
      } finally {
        setLoading(false)
      }
    }

    fetchDetail()
  }, [open, id, lc_h])

  const handleOpenLoadModal = (type) => {
    setSelectedPoint(type)
    setOpenLoadModal(true)
  }

  if (!open) return null
  if (!detail)
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-lg">กำลังโหลดข้อมูล...</div>
      </div>
    )

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[90%] max-w-lg max-h-[75%] rounded-xl overflow-hidden shadow-lg relative">
        {/* CLOSE BUTTON */}
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-600 hover:text-black bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center">
          ✕
        </button>

        {/* Loading */}
        {loading && <p className="p-6 text-center">กำลังโหลด...</p>}
        {error && <p className="p-6 text-center text-red-500">{error}</p>}

        {detail && (
          <div className="space-y-2 text-sm ">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="text-xs text-blue-100 mb-1">เลขที่ใบงาน</div>
              <div className="text-xl font-bold text-white">{detail.S_Code}</div>
            </div>

            <div className="p-6 space-y-1 overflow-y-auto max-h-[60vh]">
              {/* รถ */}
              <div className="grid grid-cols-2 gap-1 ">
                <InfoRow icon={Truck} label="ทะเบียนรถ" value={detail.LC_H || "-"} highlight />
                <InfoRow icon={CircleDot} label="สถานะ" value={detail.OrStDesc} />
              </div>

              {/* คนขับ - ลูกค้า */}
              <div className="grid grid-cols-2 gap-1 ">
                <InfoRow icon={User} label="ชื่อคนขับ" value={detail.DriverName || "-"} />
                <InfoRow icon={User} label="ชื่อลูกค้า" value={detail.CusName || "-"} />
              </div>

              {/* ข้อมูลสินค้า */}
              <div className="bg-blue-50 rounded-xl p-4 my-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="text-blue-600" size={20} />
                  <span className="font-semibold text-gray-900">ข้อมูลสินค้า</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">ชนิดสินค้า</div>
                    <div className="text-sm font-medium text-gray-900">{detail.ProName || "-"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">น้ำหนัก</div>
                    <div className="text-sm font-medium text-gray-900">
                      {detail.ProQty || "-"} {detail.ProUnit || "-"}
                    </div>
                  </div>
                </div>
              </div>

              {/* ระยะทาง */}
              <InfoRow icon={Gauge} label="ระยะทาง" value={`${detail.km || "-"} กม.`} />

              {/* ค่าใช้จ่าย */}
              <div className="grid grid-cols-2 gap-1 bg-blue-50 rounded-xl p-4 my-4">
                <InfoRow icon={Coins} label="เรต" value={`${detail.Rate || "-"}`} />
                <InfoRow icon={Coins} label="ค่าเที่ยว" value={`${detail.TripRate || "-"} บาท`} />
                <InfoRow icon={Coins} label="ค่าเชื้อเพลิง" value={`${detail.Fule || "-"} บาท`} />
                <InfoRow icon={Coins} label="รายได้" value={`${detail.Income || "-"} บาท`} />
                <InfoRow icon={Coins} label="price" value={`${detail.price || "-"} บาท`} />
                <InfoRow icon={Coins} label="รวม" value={`${detail.total || "-"} บาท`} />
              </div>

              {/* จุดรับสินค้า */}
              <div className="mt-6 space-y-3">
                {/* ต้นทาง */}
                <div onClick={() => handleOpenLoadModal("pick")} className="cursor-pointer p-4 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="text-green-600 mt-0.5">
                      <MapPin size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-green-700 mb-1 font-medium">ต้นทาง (คลิกเพื่อดูรายละเอียด)</div>
                      <div className="text-sm font-medium text-gray-900 group-hover:text-green-700 transition-colors">{detail.PickPoint}</div>
                    </div>
                  </div>
                </div>

                {/* ปลายทาง */}
                <div onClick={() => handleOpenLoadModal("drop")} className="cursor-pointer p-4 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="text-red-600 mt-0.5">
                      <MapPin size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-red-700 mb-1 font-medium">ปลายทาง (คลิกเพื่อดูรายละเอียด)</div>
                      <div className="text-sm font-medium text-gray-900 group-hover:text-red-700 transition-colors">{detail.DropPoint}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal รูป โหลดของ / ลงของ */}
      <LoadUnloadModal open={openLoadModal} onClose={() => setOpenLoadModal(false)} type={selectedPoint} detail={detail} />
    </div>
  )
}
