import React, { useEffect, useState, useMemo } from "react"
import { FiAlertCircle, FiSearch, FiTrash2, FiEdit } from "react-icons/fi"
import ImageUploadPreview from "../components/ImageUploadPreview"
import { ImagePreview, InputField } from "../components/InputField"
import { StatusBadge } from "../components/StatusBadges"
import api from "../api"

export default function Truck() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [trucks, setTrucks] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTruck, setSelectedTruck] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25
  const [formData, setFormData] = useState({})
  const [error, setError] = useState("")
  const [isViewOnly, setIsViewOnly] = useState(false)

  useEffect(() => {
    document.title = "Truck Management"
  }, [])

  // ค้นหาแบบ Debounce 400ms พร้อมดึงหน้ากลับไปที่หน้า 1 เสมอ
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTrucks(searchTerm)
      setCurrentPage(1)
    }, 400)

    return () => clearTimeout(delayDebounce)
  }, [searchTerm])

  const fetchTrucks = async (search = "") => {
    setLoading(true)
    setError("")
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : ""
      const response = await api.get(`/truck/read${query}`, { silent: true })
      setTrucks(response.data || [])
    } catch (err) {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้")
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", err.message)
    } finally {
      setLoading(false)
    }
  }

  // จัดการการแบ่งหน้า
  const totalPages = Math.ceil(trucks.length / itemsPerPage) || 1
  const currentTrucks = useMemo(() => {
    const first = (currentPage - 1) * itemsPerPage
    return trucks.slice(first, first + itemsPerPage)
  }, [trucks, currentPage, itemsPerPage])

  const closeModal = () => {
    setIsAddModalOpen(false)
    setSelectedTruck(null)
    setFormData({})
    setIsViewOnly(false)
  }

  const openModal = (truck = null, viewOnly = false) => {
    setSelectedTruck(truck)
    setFormData(truck ? { ...truck } : {})
    setIsViewOnly(viewOnly)
    setIsAddModalOpen(true)
  }

  // ฟังก์ชันจัดระเบียบ Input Data
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const numInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value.replace(/[^0-9]/g, "") }))
  }

  const LCInputChange = (e) => {
    const { name, value } = e.target
    const firstTwoChars = value.slice(0, 2)
    const rest = value.slice(2).replace(/[^0-9/-]/g, "")
    setFormData((prev) => ({ ...prev, [name]: firstTwoChars + rest }))
  }

  const imgInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // ส่งบันทึกข้อมูล
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loadingSubmit) return
    setLoadingSubmit(true)

    try {
      const form = new FormData()
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          form.append(key, formData[key])
        }
      })

      const url = selectedTruck ? `/truck/update?id=${selectedTruck.T_ID}` : "/truck/create"
      const method = selectedTruck ? "put" : "post"

      await api({
        method,
        url,
        data: form,
        headers: { "Content-Type": "multipart/form-data" },
      })

      await fetchTrucks(searchTerm)
      closeModal()
    } catch (err) {
      const errMsg = err.response?.data?.error?.sqlMessage || err.response?.data?.message || err.message
      console.error("เกิดข้อผิดพลาดขณะบันทึก:", errMsg)
    } finally {
      setLoadingSubmit(false)
    }
  }

  // ลบข้อมูลรถ
  const handleDelete = async (id) => {
    if (loading) return
    if (!window.confirm("คุณต้องการลบข้อมูลรถคันนี้หรือไม่?")) return

    setLoading(true)
    try {
      await api.delete(`/truck/delete?id=${id}`)
      await fetchTrucks(searchTerm)
    } catch (err) {
      console.error("เกิดข้อผิดพลาดขณะลบ:", err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex-1 p-4 md:p-8">
      {/* ส่วนหัว และการค้นหา */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 hidden md:block">จัดการข้อมูลรถ</h1>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="ค้นหาทะเบียนรถ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>
          <button onClick={() => openModal(null, false)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium whitespace-nowrap shadow transition">
            + เพิ่มรถใหม่
          </button>
        </div>
      </div>

      {/* เนื้อหาตารางข้อมูล */}
      {loading && trucks.length === 0 ? (
        <div className="flex bg-white p-4 h-[80vh] items-center justify-center rounded-xl shadow-sm">
          <p className="text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      ) : error ? (
        <div className="flex bg-white p-8 h-[80vh] items-center justify-center rounded-xl shadow-sm text-center">
          <div>
            <FiAlertCircle className="w-14 h-14 mx-auto mb-3 text-rose-500" />
            <h3 className="text-xl font-semibold text-gray-800">เกิดข้อผิดพลาด</h3>
            <p className="text-gray-500 mt-1">{error}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white flex flex-col h-[80vh] md:h-[85vh] shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ทะเบียนรถ</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">ยี่ห้อ</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">รุ่น</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">ประเภท</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">คนขับ</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">สถานะ</th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">จัดการ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentTrucks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      ไม่พบข้อมูลรถบรรทุก
                    </td>
                  </tr>
                ) : (
                  currentTrucks.map((t) => (
                    <tr key={t.T_ID} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => openModal(t, true)}>
                      <td className="py-3 px-4 text-sm text-center font-mono text-gray-500">{t.T_ID}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-800">{t.T_No}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 hidden md:table-cell">{t.T_Brand || "-"}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 hidden md:table-cell">{t.T_Modal || "-"}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 hidden md:table-cell">{t.T_TypeTruck || "-"}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{t.T_Driver || t.T_Driver_ID || "-"}</td>
                      <td className="py-3 px-4 text-sm hidden md:table-cell">
                        <StatusBadge status={t.t_status} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button title="แก้ไข" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition" onClick={() => openModal(t, false)}>
                            <FiEdit size={16} />
                          </button>
                          <button title="ลบ" className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition" onClick={() => handleDelete(t.T_ID)}>
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <footer className="flex justify-between items-center px-6 py-3 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">
              แสดงผล {(currentPage - 1) * itemsPerPage + (currentTrucks.length ? 1 : 0)} ถึง {(currentPage - 1) * itemsPerPage + currentTrucks.length} จากทั้งหมด {trucks.length} รายการ
            </span>
            <div className="flex items-center gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="px-3 py-1.5 text-sm rounded bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                ก่อนหน้า
              </button>
              <span className="text-sm px-2 text-gray-700">
                หน้า {currentPage} / {totalPages}
              </span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="px-3 py-1.5 text-sm rounded bg-white border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                ถัดไป
              </button>
            </div>
          </footer>
        </div>
      )}

      {/* Modal View / Create / Edit */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="flex flex-col bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">{isViewOnly ? "รายละเอียดข้อมูลรถ" : selectedTruck ? "แก้ไขข้อมูลรถ" : "เพิ่มรถใหม่"}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* ข้อมูลพื้นฐาน */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedTruck && <InputField label="รหัสรถ (ID)" type="text" name="T_ID" value={formData.T_ID || ""} readOnly className="bg-gray-100 font-mono" />}
                <InputField label="เลขทะเบียนรถ" type="text" name="T_No" value={formData.T_No || ""} onChange={LCInputChange} maxLength={9} readOnly={isViewOnly} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ยี่ห้อ</label>
                  {isViewOnly ? (
                    <div className="border px-3 py-2 rounded-lg bg-gray-50 text-gray-800 text-sm">{formData.T_Brand || "ไม่ระบุ"}</div>
                  ) : (
                    <select name="T_Brand" value={formData.T_Brand || ""} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">-- เลือก --</option>
                      <option value="HINO">HINO</option>
                      <option value="ISUZU">ISUZU</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รุ่นรถ</label>
                  {isViewOnly ? (
                    <div className="border px-3 py-2 rounded-lg bg-gray-50 text-gray-800 text-sm">{formData.T_Modal || "ไม่ระบุ"}</div>
                  ) : (
                    <select name="T_Modal" value={formData.T_Modal || ""} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">-- เลือก --</option>
                      <option value="victor">Victor</option>
                      <option value="victorเก่า">Victor (เก่า)</option>
                    </select>
                  )}
                </div>
              </div>

              {/* ข้อมูลเจ้าของและคนขับ */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InputField label="Owner ID" type="text" name="T_Owner_ID" value={formData.T_Owner_ID || ""} onChange={numInputChange} maxLength={5} readOnly={isViewOnly} />
                <InputField label="เจ้าของ" type="text" name="T_Owner" value={formData.T_Owner || ""} onChange={handleInputChange} maxLength={20} readOnly={isViewOnly} />
                <InputField label="ID คนขับ" type="text" name="T_Driver_ID" value={formData.T_Driver_ID || ""} onChange={numInputChange} maxLength={4} readOnly={isViewOnly} />
                <InputField label="ชื่อคนขับ" type="text" name="T_Driver" value={formData.T_Driver || ""} onChange={handleInputChange} maxLength={50} readOnly={isViewOnly} />
              </div>

              {/* ข้อมูลสมรรถนะและสเปกรถ */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InputField label="ประเภทรถบรรทุก" type="text" name="T_TypeTruck" value={formData.T_TypeTruck || ""} onChange={handleInputChange} maxLength={30} readOnly={isViewOnly} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เชื้อเพลิง</label>
                  {isViewOnly ? (
                    <div className="border px-3 py-2 rounded-lg bg-gray-50 text-gray-800 text-sm">{formData.T_Fuel || "ไม่ระบุ"}</div>
                  ) : (
                    <select name="T_Fuel" value={formData.T_Fuel || ""} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">-- เลือก --</option>
                      <option value="ดีเซล">ดีเซล</option>
                      <option value="NGV">NGV</option>
                    </select>
                  )}
                </div>
                <InputField label="น้ำหนัก (กก.)" type="number" name="T_Weight" value={formData.T_Weight || ""} onChange={handleInputChange} readOnly={isViewOnly} min="0" />
                <InputField label="บรรทุกสูงสุด (กก.)" type="number" name="T_TruckLoad" value={formData.T_TruckLoad || ""} onChange={handleInputChange} readOnly={isViewOnly} min="0" />
                <InputField label="ปีรถ (ค.ศ.)" type="number" name="T_ModalYear" value={formData.T_ModalYear || ""} onChange={numInputChange} maxLength={4} readOnly={isViewOnly} min="1900" />
                <InputField label="เลขไมล์" type="number" name="t_mile" value={formData.t_mile || ""} onChange={numInputChange} readOnly={isViewOnly} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">สถานะรถ</label>
                  {isViewOnly ? (
                    <div className="border px-3 py-2 rounded-lg bg-gray-50 text-gray-800 text-sm">{formData.t_status || "ไม่ระบุ"}</div>
                  ) : (
                    <select name="t_status" value={formData.t_status || ""} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">-- เลือก --</option>
                      <option value="พร้อมใช้งาน">พร้อมใช้งาน</option>
                      <option value="อุบัติเหตุ">อุบัติเหตุ</option>
                      <option value="ซ่อมบำรุง">ซ่อมบำรุง</option>
                    </select>
                  )}
                </div>
              </div>

              {/* ข้อมูลใบอนุญาตและวันหมดอายุ */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InputField label="เลขที่ใบอนุญาต" type="text" name="T_LC" value={formData.T_LC || ""} onChange={LCInputChange} maxLength={15} readOnly={isViewOnly} />
                <InputField label="ท้ายใบอนุญาต" type="text" name="T_LC_Tail" value={formData.T_LC_Tail || ""} onChange={LCInputChange} maxLength={15} readOnly={isViewOnly} />
                <InputField label="วันหมดอายุใบอนุญาต" type="date" name="T_Date_LC" value={formData.T_Date_LC?.split("T")[0] || ""} onChange={handleInputChange} readOnly={isViewOnly} />
                <InputField label="วันหมดอายุ พรบ." type="date" name="T_Date_Plb" value={formData.T_Date_Plb?.split("T")[0] || ""} onChange={handleInputChange} readOnly={isViewOnly} />
                <InputField label="วันหมดอายุทะเบียน" type="date" name="T_Date_Car" value={formData.T_Date_Car?.split("T")[0] || ""} onChange={handleInputChange} readOnly={isViewOnly} />
                <InputField label="วันหมดอายุประกัน" type="date" name="T_Date_Pro" value={formData.T_Date_Pro?.split("T")[0] || ""} onChange={handleInputChange} readOnly={isViewOnly} />
              </div>

              {/* รูปภาพตัวรถ */}
              <div className="pt-2 border-t">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">รูปภาพตัวรถ</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {isViewOnly ? (
                    <>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">รูปหน้ารถ</p>
                        <ImagePreview imgPath={formData.T_PicCover1} fieldName="T_PicCover1" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">รูปด้านข้าง</p>
                        <ImagePreview imgPath={formData.T_PicCover2} fieldName="T_PicCover2" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">รูปด้านหลัง</p>
                        <ImagePreview imgPath={formData.T_PicCover3} fieldName="T_PicCover3" />
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageUploadPreview label="รูปหน้ารถ" name="T_PicCover1" value={formData.T_PicCover1} onChange={imgInputChange} />
                      <ImageUploadPreview label="รูปด้านข้างรถ" name="T_PicCover2" value={formData.T_PicCover2} onChange={imgInputChange} />
                      <ImageUploadPreview label="รูปด้านหลังรถ" name="T_PicCover3" value={formData.T_PicCover3} onChange={imgInputChange} />
                    </>
                  )}
                </div>
              </div>

              {/* ปุ่มยืนยัน / ยกเลิก */}
              {!isViewOnly && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                    ยกเลิก
                  </button>
                  <button type="submit" disabled={loadingSubmit} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition">
                    {loadingSubmit ? "กำลังบันทึก..." : selectedTruck ? "บันทึกการแก้ไข" : "เพิ่มรถ"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
