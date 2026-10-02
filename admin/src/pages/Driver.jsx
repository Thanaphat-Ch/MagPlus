import React, { useEffect, useState, useMemo } from "react"
import ImageUploadPreview from "../components/ImageUploadPreview"
import { FileUploadPreviewPDF, ImagePreview, InputField } from "../components/InputField"
import { FiAlertCircle, FiSearch, FiTrash2, FiEdit } from "react-icons/fi"
import { formatDate } from "../utils/formatDate"
import api from "../api"

export default function Driver() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [users, setUsers] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState(null)
  const [formData, setFormData] = useState({})
  const [error, setError] = useState("")
  const [isViewOnly, setIsViewOnly] = useState(false)

  useEffect(() => {
    document.title = "User Management"
  }, [])

  // ค้นหาพร้อม Debounce (400ms) และรีเซ็ตกลับหน้า 1
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers(searchTerm)
      setCurrentPage(1)
    }, 400)

    return () => clearTimeout(delayDebounce)
  }, [searchTerm])

  const fetchUsers = async (search = "") => {
    setLoading(true)
    setError("")
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : ""
      const response = await api.get(`/driver/read${query}`, { silent: true })
      setUsers(response.data || [])
    } catch (err) {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้")
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", err.message)
    } finally {
      setLoading(false)
    }
  }

  // คำนวณ Pagination
  const totalPages = Math.ceil(users.length / itemsPerPage) || 1
  const currentUsers = useMemo(() => {
    const first = (currentPage - 1) * itemsPerPage
    return users.slice(first, first + itemsPerPage)
  }, [users, currentPage, itemsPerPage])

  const closeModal = () => {
    setIsAddModalOpen(false)
    setSelectedUser(null)
    setFormData({})
    setIsViewOnly(false)
  }

  const openModal = (user = null, viewOnly = false) => {
    setSelectedUser(user)
    setFormData(user ? { ...user } : {})
    setIsViewOnly(viewOnly)
    setIsAddModalOpen(true)
  }

  // Input Sanitization Handlers
  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    const filteredValue = type !== "date" && type !== "url" ? value.replace(/[%&^#@\-_/+*';:,!_"`E~()=]/g, "") : value
    setFormData((prev) => ({ ...prev, [name]: filteredValue }))
  }

  const addressInputChange = (e) => {
    const { name, value } = e.target
    const filteredValue = value.replace(/[%&^#@_+*';:,!_"`E~()=]/g, "")
    setFormData((prev) => ({ ...prev, [name]: filteredValue }))
  }

  const numInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value.replace(/[^0-9]/g, "") }))
  }

  const LCInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value.replace(/[^0-9/.]/g, "") }))
  }

  const fileInputChange = (name, fileOrValue) => {
    setFormData((prev) => ({ ...prev, [name]: fileOrValue }))
  }

  // Submit Handler
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

      const url = selectedUser ? `/driver/update?id=${selectedUser.D_ID}` : "/driver/create"
      const method = selectedUser ? "put" : "post"

      await api({
        method,
        url,
        data: form,
        headers: { "Content-Type": "multipart/form-data" },
      })

      await fetchUsers(searchTerm)
      closeModal()
    } catch (err) {
      console.error("เกิดข้อผิดพลาดขณะบันทึก:", err.response?.data || err)
    } finally {
      setLoadingSubmit(false)
    }
  }

  // Delete Handler
  const handleDelete = async (id) => {
    if (loading) return
    if (!window.confirm("คุณต้องการลบข้อมูลนี้หรือไม่?")) return

    setLoading(true)
    try {
      await api.delete(`/driver/delete?id=${id}`)
      await fetchUsers(searchTerm)
    } catch (err) {
      console.error("เกิดข้อผิดพลาดขณะลบ:", err.response?.data || err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex-1 m-4 md:m-8">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-5 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold hidden md:block">ผู้ใช้งานทั้งหมด</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <FiSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="ค้นหาชื่อ หรือเบอร์โทร..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>

            <button onClick={() => openModal(null, false)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow font-medium whitespace-nowrap transition">
              + เพิ่มผู้ใช้ใหม่
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading && users.length === 0 ? (
        <div className="flex bg-white p-4 h-[80vh] items-center justify-center rounded-lg shadow-sm">
          <p className="text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      ) : error ? (
        <div className="flex bg-white p-8 h-[80vh] items-center justify-center rounded-lg shadow-sm text-center">
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
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ชื่อ</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">นามสกุล</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">เบอร์มือถือ</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">เลขบัตร ปชช.</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">วันเกิด</th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">จัดการ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      ไม่พบข้อมูลผู้ขับขี่
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((d) => (
                    <tr key={d.D_ID} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => openModal(d, true)}>
                      <td className="py-3 px-4 text-sm text-center font-mono text-gray-500">{d.D_ID}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-800">{d.D_Name}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-800">{d.D_SurName}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 hidden md:table-cell">{d.D_Tel || "-"}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 font-mono hidden md:table-cell">{d.D_IDCard || "-"}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 hidden md:table-cell">{formatDate(d.D_DateBirth)}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button title="แก้ไข" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition" onClick={() => openModal(d, false)}>
                            <FiEdit size={16} />
                          </button>
                          <button title="ลบ" className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition" onClick={() => handleDelete(d.D_ID)}>
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
              แสดงผล {(currentPage - 1) * itemsPerPage + (currentUsers.length ? 1 : 0)} ถึง {(currentPage - 1) * itemsPerPage + currentUsers.length} จากทั้งหมด {users.length} รายการ
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

      {/* Modal View / Form */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="flex flex-col bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">{isViewOnly ? "รายละเอียดข้อมูลคนขับ" : selectedUser ? "แก้ไขข้อมูลคนขับ" : "เพิ่มคนขับใหม่"}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* ส่วนข้อมูลทั่วไป */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedUser && <InputField label="รหัส (ID)" type="text" name="D_ID" value={formData.D_ID || ""} readOnly className="bg-gray-100 font-mono" />}
                <InputField label="ชื่อ" type="text" name="D_Name" value={formData.D_Name || ""} onChange={handleInputChange} maxLength={80} readOnly={isViewOnly} />
                <InputField label="นามสกุล" type="text" name="D_SurName" value={formData.D_SurName || ""} onChange={handleInputChange} maxLength={50} readOnly={isViewOnly} />
                <InputField label="วันเกิด" type="date" name="D_DateBirth" value={formData.D_DateBirth?.split("T")[0] || ""} onChange={handleInputChange} readOnly={isViewOnly} />
              </div>

              {/* เบอร์ติดต่อ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="เบอร์โทรศัพท์มือถือ" type="tel" name="D_Tel" value={formData.D_Tel || ""} onChange={numInputChange} maxLength={10} readOnly={isViewOnly} />
                <InputField label="เบอร์โทรศัพท์บ้าน" type="tel" name="D_Tel_Home" value={formData.D_Tel_Home || ""} onChange={numInputChange} maxLength={9} readOnly={isViewOnly} />
              </div>

              {/* ที่อยู่ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="ที่อยู่ตามทะเบียนบ้าน" type="text" name="D_Add" value={formData.D_Add || ""} onChange={addressInputChange} readOnly={isViewOnly} />
                <InputField label="ที่อยู่ปัจจุบัน" type="text" name="D_Add2" value={formData.D_Add2 || ""} onChange={addressInputChange} readOnly={isViewOnly} />
              </div>

              {/* ข้อมูลใบขับขี่และเอกสาร */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InputField label="เลขบัตรประจำตัวประชาชน" type="text" name="D_IDCard" value={formData.D_IDCard || ""} onChange={numInputChange} maxLength={13} readOnly={isViewOnly} />
                <InputField label="เลขที่ใบอนุญาตขับขี่" type="text" name="D_LC" value={formData.D_LC || ""} onChange={LCInputChange} maxLength={10} readOnly={isViewOnly} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทใบขับขี่</label>
                  {isViewOnly ? (
                    <div className="border px-3 py-2 rounded-lg bg-gray-50 text-gray-800 text-sm">{formData.D_Type || "ไม่ระบุ"}</div>
                  ) : (
                    <select name="D_Type" value={formData.D_Type || ""} onChange={handleInputChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">-- กรุณาเลือกประเภท --</option>
                      <option value="ประเภท 1">ประเภท 1 (บ.1, ท.1)</option>
                      <option value="ประเภท 2">ประเภท 2 (บ.2, ท.2)</option>
                      <option value="ประเภท 3">ประเภท 3 (บ.3, ท.3)</option>
                      <option value="ประเภท 4">ประเภท 4 (บ.4, ท.4)</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField label="วันหมดอายุใบขับขี่" type="date" name="D_DateLcEx" value={formData.D_DateLcEx?.split("T")[0] || ""} onChange={handleInputChange} readOnly={isViewOnly} />
                <InputField label="วันเริ่มจ้างงาน" type="date" name="D_DateIn" value={formData.D_DateIn?.split("T")[0] || ""} onChange={handleInputChange} readOnly={isViewOnly} />
                <InputField label="วันสิ้นสุดสัญญา" type="date" name="D_DateEx" value={formData.D_DateEx?.split("T")[0] || ""} onChange={handleInputChange} readOnly={isViewOnly} />
              </div>

              {/* อัปโหลด / ดูไฟล์รูปภาพ */}
              <div className="pt-2 border-t">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">เอกสารประกอบ</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {isViewOnly ? (
                    <>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">บัตร ปชช.</p>
                        <ImagePreview imgPath={formData.img_id} fieldName="img_id" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">ใบขับขี่</p>
                        <ImagePreview imgPath={formData.img_lc} fieldName="img_lc" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">ทะเบียนบ้าน</p>
                        <ImagePreview imgPath={formData.img_home} fieldName="img_home" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">สมุดบัญชี</p>
                        <ImagePreview imgPath={formData.img_acc} fieldName="img_acc" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">พาสปอร์ต</p>
                        <ImagePreview imgPath={formData.D_Passport} fieldName="D_Passport" />
                      </div>
                    </>
                  ) : (
                    <>
                      <ImageUploadPreview label="บัตร ปชช." name="img_id" value={formData.img_id} onChange={(e) => fileInputChange("img_id", e.target.value)} />
                      <ImageUploadPreview label="ใบขับขี่" name="img_lc" value={formData.img_lc} onChange={(e) => fileInputChange("img_lc", e.target.value)} />
                      <ImageUploadPreview label="ทะเบียนบ้าน" name="img_home" value={formData.img_home} onChange={(e) => fileInputChange("img_home", e.target.value)} />
                      <ImageUploadPreview label="สมุดบัญชี" name="img_acc" value={formData.img_acc} onChange={(e) => fileInputChange("img_acc", e.target.value)} />
                      <ImageUploadPreview label="พาสปอร์ต" name="D_Passport" value={formData.D_Passport} onChange={(e) => fileInputChange("D_Passport", e.target.value)} />
                    </>
                  )}
                </div>
              </div>

              {/* แนบสัญญา PDF */}
              {!isViewOnly && (
                <div className="pt-2">
                  <FileUploadPreviewPDF label="เอกสารสัญญาจ้าง (PDF)" name="contractFile" value={formData.contractFile} onChange={(file) => fileInputChange("contractFile", file)} />
                </div>
              )}

              {/* ปุ่มบันทึก/ยกเลิก */}
              {!isViewOnly && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
                    ยกเลิก
                  </button>
                  <button type="submit" disabled={loadingSubmit} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition">
                    {loadingSubmit ? "กำลังบันทึก..." : selectedUser ? "บันทึกการแก้ไข" : "เพิ่มผู้ใช้"}
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
