import React, { useEffect, useState, useMemo } from "react"
import ImageUploadPreview from "../../components/ImageUploadPreview"
import FilterDropdown from "../../components/FilterDropdown"
import { InputField } from "../../components/InputField"
import { FiAlertCircle, FiSearch } from "react-icons/fi"

const initialFormState = {
  id: "",
  name: "",
  lot: "",
  qty: "",
  date: "",
  plate: "",
  img_id: null,
  transfer_reason: "",
  target_plate: "",
  target_name: "",
  transfer_date: "",
  transfer_qty: "",
}

const statusThemes = {
  อนุมัติ: "bg-emerald-50 text-emerald-700 border-emerald-200",
  รออนุมัติ: "bg-amber-50 text-amber-700 border-amber-200",
  ไม่อนุมัติ: "bg-rose-50 text-rose-700 border-rose-200",
}

export default function TranferAsset() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [formData, setFormData] = useState(initialFormState)
  const [error, setError] = useState("")
  const [isViewOnly, setIsViewOnly] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [assets, setAssets] = useState([])

  const [categoryFilter, setCategoryFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const categoryOptions = [
    { label: "หมวดทั้งหมด", value: "" },
    { label: "ยานพาหนะ", value: "vehicle" },
    { label: "เครื่องจักร", value: "machinery" },
    { label: "อุปกรณ์สำนักงาน", value: "office" },
  ]

  const typeOptions = [
    { label: "ประเภททั้งหมด", value: "" },
    { label: "รถบรรทุก", value: "truck" },
    { label: "รถกระบะ", value: "pickup" },
    { label: "เครื่องจักรกลหนัก", value: "heavy" },
  ]

  const statusOptions = [
    { label: "สถานะทั้งหมด", value: "" },
    { label: "รออนุมัติ", value: "รออนุมัติ" },
    { label: "อนุมัติแล้ว", value: "อนุมัติ" },
    { label: "ไม่อนุมัติ", value: "ไม่อนุมัติ" },
  ]

  useEffect(() => {
    document.title = "จัดการโอนย้ายสินทรัพย์"
    const mockAssets = [
      { id: 1, name: "รถบรรทุก 6 ล้อ", plate: "1กข 1234", qty: 2, lot: "LOT-2025A", date: "2025-05-12", status: "อนุมัติ" },
      { id: 2, name: "รถกระบะ", plate: "2ขค 5678", qty: 1, lot: "LOT-2025A", date: "2025-05-12", status: "รออนุมัติ" },
      { id: 3, name: "รถตู้ VIP", plate: "3งจ 9988", qty: 3, lot: "LOT-2025B", date: "2025-05-12", status: "ไม่อนุมัติ" },
      { id: 4, name: "เครื่องจักรขุดดิน", plate: "N/A", qty: 1, lot: "LOT-2025B", date: "2025-05-12", status: "อนุมัติ" },
      { id: 5, name: "โฟล์คลิฟท์", plate: "N/A", qty: 4, lot: "LOT-2025C", date: "2025-05-12", status: "รออนุมัติ" },
    ]
    setAssets(mockAssets)
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const filteredAssets = useMemo(() => {
    return assets.filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) || item.plate.toLowerCase().includes(searchTerm.toLowerCase().trim()) || item.lot.toLowerCase().includes(searchTerm.toLowerCase().trim())

      const matchStatus = statusFilter ? item.status === statusFilter : true

      return matchSearch && matchStatus
    })
  }, [assets, searchTerm, statusFilter])

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentAssets = filteredAssets.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage) || 1

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (fileOrValue) => {
    setFormData((prev) => ({ ...prev, img_id: fileOrValue }))
  }

  const handleOpenTransferModal = (asset) => {
    setSelectedAsset(asset)
    setFormData({
      ...initialFormState,
      id: asset.id,
      name: asset.name,
      lot: asset.lot,
      qty: asset.qty,
      date: asset.date,
      plate: asset.plate,
      transfer_qty: asset.qty,
      transfer_date: new Date().toISOString().split("T")[0],
    })
    setIsViewOnly(false)
    setIsAddModalOpen(true)
  }

  const handleOpenDetailModal = (asset) => {
    setSelectedAsset(asset)
    setFormData({
      ...initialFormState,
      ...asset,
    })
    setIsViewOnly(true)
    setIsAddModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsAddModalOpen(false)
    setSelectedAsset(null)
    setFormData(initialFormState)
    setIsViewOnly(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loadingSubmit) return
    setLoadingSubmit(true)

    try {
      setAssets((prev) => prev.map((item) => (item.id === selectedAsset.id ? { ...item, status: "รออนุมัติ", lot: formData.lot || item.lot } : item)))
      handleCloseModal()
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการบันทึกข้อมูล")
    } finally {
      setLoadingSubmit(false)
    }
  }

  return (
    <main className="flex-1 p-4 md:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">จัดการโอนย้ายสินทรัพย์</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">ตรวจสอบและดำเนินการโอนย้ายสินทรัพย์ระหว่างหน่วยงานหรือยานพาหนะ</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <FiSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="ค้นหาชื่อ, ทะเบียน, ล็อต..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>
          <FilterDropdown label="หมวด" options={categoryOptions} value={categoryFilter} onChange={setCategoryFilter} />
          <FilterDropdown label="ประเภท" options={typeOptions} value={typeFilter} onChange={setTypeFilter} />
          <FilterDropdown label="สถานะ" options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
        </div>
      </div>

      {loading ? (
        <div className="flex bg-white p-12 h-[70vh] items-center justify-center rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-400 font-medium animate-pulse">กำลังโหลดข้อมูลสินทรัพย์...</p>
        </div>
      ) : error ? (
        <div className="flex bg-white p-8 h-[70vh] items-center justify-center rounded-2xl shadow-sm border border-slate-200 text-center">
          <div>
            <FiAlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-slate-800">เกิดข้อผิดพลาด</h3>
            <p className="text-sm text-slate-500 mt-1">{error}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white flex flex-col shadow-sm rounded-2xl border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 text-center">ID</th>
                  <th className="py-3.5 px-4 text-left">ชื่อสินทรัพย์</th>
                  <th className="py-3.5 px-4 text-left">ทะเบียนรถ</th>
                  <th className="py-3.5 px-4 text-center hidden md:table-cell">จำนวน</th>
                  <th className="py-3.5 px-4 text-left hidden md:table-cell">ล็อต</th>
                  <th className="py-3.5 px-4 text-left hidden md:table-cell">วันที่</th>
                  <th className="py-3.5 px-4 text-center">สถานะ</th>
                  <th className="py-3.5 px-4 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {currentAssets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      ไม่พบข้อมูลสินทรัพย์ที่ตรงกับเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  currentAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50/80 cursor-pointer transition-colors" onClick={() => handleOpenDetailModal(asset)}>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-500">{asset.id}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{asset.name}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">{asset.plate}</td>
                      <td className="py-3.5 px-4 text-center text-slate-600 hidden md:table-cell">{asset.qty}</td>
                      <td className="py-3.5 px-4 text-slate-500 hidden md:table-cell font-mono">{asset.lot}</td>
                      <td className="py-3.5 px-4 text-slate-500 hidden md:table-cell">{asset.date}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${statusThemes[asset.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>{asset.status}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleOpenTransferModal(asset)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-semibold transition shadow-sm active:scale-95">
                          โอนย้าย
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-slate-100 bg-slate-50 gap-3">
            <span className="text-xs text-slate-500">
              แสดง {filteredAssets.length ? indexOfFirstItem + 1 : 0} ถึง {Math.min(indexOfLastItem, filteredAssets.length)} จาก {filteredAssets.length} รายการ
            </span>
            <div className="flex items-center gap-2">
              <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="px-3 py-1.5 text-xs rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                ก่อนหน้า
              </button>
              <span className="text-xs px-2 text-slate-600 font-medium">
                หน้า {currentPage} / {totalPages}
              </span>
              <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} className="px-3 py-1.5 text-xs rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                ถัดไป
              </button>
            </div>
          </footer>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
          <div className="flex flex-col bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">{isViewOnly ? "รายละเอียดข้อมูลสินทรัพย์" : "บันทึกการโอนย้ายสินทรัพย์"}</h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 text-xl leading-none">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-3">ข้อมูลต้นทาง</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InputField label="รหัสสินทรัพย์" type="text" name="id" value={formData.id} readOnly className="bg-slate-50 font-mono" />
                  <InputField label="ชื่อสินทรัพย์" type="text" name="name" value={formData.name} onChange={handleInputChange} readOnly={isViewOnly} />
                  <InputField label="ล็อตสินค้า" type="text" name="lot" value={formData.lot} onChange={handleInputChange} readOnly={isViewOnly} />
                  <InputField label="จำนวนปัจจุบัน" type="number" name="qty" value={formData.qty} onChange={handleInputChange} readOnly={isViewOnly} />
                  <InputField label="วันที่ตรวจนับ" type="date" name="date" value={formData.date} onChange={handleInputChange} readOnly={isViewOnly} />
                  <InputField label="ทะเบียนรถเดิม" type="text" name="plate" value={formData.plate} onChange={handleInputChange} readOnly={isViewOnly} />
                </div>
              </div>

              {!isViewOnly && (
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <h3 className="text-sm font-semibold text-blue-600">ข้อมูลปลายทางที่ต้องการโอนย้าย</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InputField label="ทะเบียนรถปลายทาง" type="text" name="target_plate" value={formData.target_plate} onChange={handleInputChange} placeholder="เช่น 1กข 9999" required />
                    <InputField label="ผู้รับโอน / พนักงาน" type="text" name="target_name" value={formData.target_name} onChange={handleInputChange} placeholder="ชื่อผู้ดูแลปลายทาง" required />
                    <InputField label="วันที่ต้องการโอน" type="date" name="transfer_date" value={formData.transfer_date} onChange={handleInputChange} required />
                    <InputField label="จำนวนที่ต้องการโอน" type="number" name="transfer_qty" value={formData.transfer_qty} onChange={handleInputChange} min="1" max={formData.qty} required />
                  </div>

                  <div>
                    <InputField label="สาเหตุการโอนย้าย" type="text" name="transfer_reason" value={formData.transfer_reason} onChange={handleInputChange} placeholder="ระบุเหตุผลการโอนย้ายสินทรัพย์ เช่น สับเปลี่ยนรถประจำการ" required />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">รูปภาพประกอบ</h3>
                <div className="max-w-xs">
                  <ImageUploadPreview label="รูปสภาพสินทรัพย์" name="img_id" value={formData.img_id} onChange={handleImageChange} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                  {isViewOnly ? "ปิด" : "ยกเลิก"}
                </button>
                {!isViewOnly && (
                  <button type="submit" disabled={loadingSubmit} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm disabled:opacity-50">
                    {loadingSubmit ? "กำลังบันทึก..." : "ยืนยันการโอนย้าย"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
