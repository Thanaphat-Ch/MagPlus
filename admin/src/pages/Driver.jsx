import React, { useEffect, useState } from "react"
import ImageUploadPreview from "../components/ImageUploadPreview"
import { FileUploadPDF, FileUploadPreviewPDF, ImagePreview, InputField } from "../components/InputField"
import { FiAlertCircle, FiSearch, FiTrash2, FiEdit } from "react-icons/fi"
import { formatDate } from "../utils/formatDate"
import api from "../api"

export default function Driver() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState(null)
  const [formData, setFormData] = useState({})
  const [error, setError] = useState("")
  const [isViewOnly, setIsViewOnly] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  useEffect(() => {
    document.title = "User Management"
    fetchUsers()
  }, [])

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers(searchTerm)
    }, 400)

    return () => clearTimeout(delayDebounce)
  }, [searchTerm])

  const fetchUsers = async (search) => {
    setLoading(true)
    setError("")
    try {
      const response = await api.get(`/driver/read?search=${encodeURIComponent(search)}`,{ silent: true })
      setUsers(response.data)
    } catch (error) {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้")
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error.message)
    } finally {
      setLoading(false)
    }
  }

  // คำนวณการแบ่งหน้า
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(users.length / itemsPerPage)

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    let filteredValue = value
    if (type !== "date" && type !== "url") {
      filteredValue = value.replace(/[%&^#@\-_/+*';:,!_"`E~()=]/g, "")
    }
    setFormData((prev) => ({ ...prev, [name]: filteredValue }))
  }
  const addressInputChange = (e) => {
    const { name, value } = e.target
    const filteredValue = value.replace(/[%&^#@_+*';:,!_"`E~()=]/g, "")
    setFormData((prev) => ({ ...prev, [name]: filteredValue }))
  }
  const numInputChange = (e) => {
    const { name, value } = e.target
    const filteredValue = value.replace(/[^0-9]/g, "")
    setFormData((prev) => ({ ...prev, [name]: filteredValue }))
  }
  const LCInputChange = (e) => {
    const { name, value } = e.target
    const filteredValue = value.replace(/[^0-9/.]/g, "")
    setFormData((prev) => ({ ...prev, [name]: filteredValue }))
  }
  const imgInputChange = (e) => {
    const { name, value } = e.target
    if (value instanceof File) {
      setFormData((prev) => ({ ...prev, [name]: value }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: (value || "").toString().replace(/\s+/g, " "),
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loadingSubmit) return;  
    setLoadingSubmit(true);                          
    try {
      const form = new FormData();
      for (const key in formData) {
        form.append(key, formData[key]);
      }
      const url = selectedUser ? `/driver/update?id=${selectedUser.D_ID}` : "/driver/create";
      const method = selectedUser ? "put" : "post";
      await api({ method, url, data: form, headers: { "Content-Type": "multipart/form-data" }});
 
      await fetchUsers(searchTerm)
      setIsAddModalOpen(false)
      setSelectedUser(null)
      setFormData({})
    } catch (error) {
      console.error("เกิดข้อผิดพลาดขณะบันทึก:", error.response?.data || error)
    } finally {
      setLoading(false);
    }
  }
  
  const handleDelete = async (id) => {
    if (loading) return;
    if (!window.confirm("คุณต้องการลบข้อมูลนี้หรือไม่?")) return
    setLoading(true);
    try {
      await api.delete(`/driver/delete?id=${id}`)
      fetchUsers(searchTerm)
    } catch (error) {
      console.error("เกิดข้อผิดพลาดขณะลบ:", error.response.data)
    } finally {
      setLoadingSubmit(false);
    }
  }

  const ErrorState = ({ error }) => (
    <div className="text-center m-auto text-red-500">
      <FiAlertCircle className="w-16 h-16 mx-auto mb-4" />
      <h3 className="text-2xl font-semibold">เกิดข้อผิดพลาด</h3>
      <p className="text-gray-600 mt-2">{error}</p>
    </div>
  )


  return (
        <main className="flex-1 m-4 md:m-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-5 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold hidden md:block">ผู้ใช้งานทั้งหมด</h1>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="flex gap-2">
                <div className="relative flex-1 w-1/2">
                  <FiSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="ค้นหาชื่อ หรือเบอร์โทร..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                </div>

                <button
                  onClick={() => {
                    setIsAddModalOpen(true)
                    setFormData({}) // รีเซ็ตค่า
                    setSelectedUser(null), setIsViewOnly(false)
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white px-2 py-2 rounded shadow flex-1 max-w-1/3"
                >
                  + เพิ่มผู้ใช้ใหม่
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex bg-white p-4 h-[80vh] md:h-[85vh] text-center rounded-lg shadow-md">
              <p className="text-center py-6 justify-center">กำลังโหลดข้อมูล...</p>
            </div>
          ) : error ? (
            <div className="flex bg-white p-4 h-[80vh] md:h-[85vh] text-center rounded-lg shadow-md text-red-600">
              <ErrorState error={error} />
            </div>
          ) : (
            <div className="bg-white flex flex-col h-[80vh] md:h-[85vh] p-1 shadow-md rounded-lg ">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider"> ID </th>
                      <th className="pl-4 py-2 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider"> ชื่อ </th>
                      <th className="pl-4 py-2 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider"> นามสกุล </th>
                      <th className="pl-4 py-2 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider hidden md:table-cell"> เบอร์โทร(มือถือ) </th>
                      <th className="pl-4 py-2 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider hidden md:table-cell"> เลขบัตรประชาชน </th>
                      <th className="pl-4 py-2 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider hidden md:table-cell"> วันเกิด </th>
                      <th className="pl-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider"> การจัดการ </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentUsers.map((d, index) => (
                      <tr
                        key={d.D_ID || index}
                        className="hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          setFormData(d), setSelectedUser(d), setIsAddModalOpen(true), setIsViewOnly(true)
                        }}
                      >
                        {/* <td className="py-2 w-24 text-sm text-center text-gray-500">{indexOfFirstItem + index + 1}</td> */}
                        <td className="py-2 w-24 text-sm text-center text-gray-500">{d.D_ID}</td>
                        <td className="pl-4 py-2 w-48 text-sm font-semibold text-gray-800">{d.D_Name}</td>
                        <td className="pl-4 py-2 w-48 text-sm font-semibold text-gray-800">{d.D_SurName}</td>
                        <td className="pl-4 py-2 w-44 text-sm text-gray-500 hidden md:table-cell">{d.D_Tel}</td>
                        <td className="pl-4 py-2 w-44 text-sm text-gray-500 hidden md:table-cell">{d.D_IDCard}</td>
                        <td className="pl-4 py-2 w-44 text-sm text-gray-500 hidden md:table-cell">{formatDate(d.D_DateBirth)}</td>
                        <td className="pl-4 py-2  text-center">
                          <button
                            className="bg-blue-500 text-white px-2 py-1 mr-0.5 rounded hover:bg-blue-600"
                            onClick={(e) => { e.stopPropagation(), setFormData(d), setSelectedUser(d), setIsAddModalOpen(true), setIsViewOnly(false)}}
                          >
                            <FiEdit size={18} />
                          </button>
                          <button
                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                            onClick={(e) => { e.stopPropagation(), handleDelete(d.D_ID) }}
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* <div className="md:hidden space-y-4">
                  {currentUsers.map((d_driver, index) => (
                    <div key={d_driver.D_ID} className="bg-white p-4 rounded-lg shadow border border-gray-200" onClick={() => openDetailModal(d_driver)}>
                    <div className="flex justify-between items-start">
                    <div>
                    <p className="font-bold text-lg text-gray-800">{d_driver.D_Name} {d_driver.D_SurName}</p>
                    <p className="text-sm text-gray-500">{d_driver.D_Tel}</p>
                    </div>
                    <div className="text-right text-sm text-gray-400">#{indexOfFirstItem + index + 1}</div>
                    </div>
                    <div className="border-t mt-4 pt-3 flex justify-end gap-2">
                    <button className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(d_driver.D_ID); }}>ลบ</button>
                    <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600" onClick={(e) => { e.stopPropagation(); setFormData(d_driver); setSelectedUser(d_driver); setIsAddModalOpen(true); }}>แก้ไข</button>
                    </div>
                    </div>
                    ))}
                    </div> */}
              </div>
              <footer className="flex justify-center items-center gap-2 p-3">
                <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="w-22 px-3 py-1 rounded bg-white hover:bg-blue-300 disabled:opacity-50">
                  ก่อนหน้า
                </button>
                <span className="px-4">
                  {" "}
                  หน้า {currentPage} / {totalPages}
                </span>
                <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} className="w-22 px-3 py-1 rounded bg-white hover:bg-blue-300 disabled:opacity-50">
                  ถัดไป
                </button>
              </footer>
            </div>
          )}

          {isAddModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" {...(isViewOnly ? { onClick: () => {setIsAddModalOpen(false), setSelectedUser(null), setFormData({}), setIsViewOnly(false)},} : {})}>
              <div className="flex flex-col bg-gray-100 p-4 md:p-6 rounded-lg shadow-lg w-[90%] max-w-5xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-semibold mb-4">{isViewOnly ? "ข้อมูลคนขับ" : selectedUser ? "แก้ไขข้อมูลคนขับ" : "เพิ่มคนขับใหม่"}</h2>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-hidden">
                  <div className="bg-white p-1 flex flex-col gap-y-4 rounded shadow-md">
                    <div className="w-[100%] grid grid-cols-1">
                      <InputField label="ID" type="text" name="D_ID" value={formData.D_ID} onChange={numInputChange} maxLength={3} readOnly={true} className="max-w-24 text-center" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <InputField label="ชื่อ" type="text" name="D_Name" value={formData.D_Name} onChange={handleInputChange} maxLength={80} readOnly={isViewOnly} />
                      <InputField label="นามสกุล" type="text" name="D_SurName" value={formData.D_SurName} onChange={handleInputChange} maxLength={50} readOnly={isViewOnly} />
                      <InputField label="วันเกิด" type="date" name="D_DateBirth" value={formData.D_DateBirth?.split("T")[0] || ""} onChange={handleInputChange} readOnly={isViewOnly} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <InputField label="เบอร์โทร(บ้าน)" type="tel" name="D_Tel_Home" value={formData.D_Tel_Home} onChange={numInputChange} pattern="[0-9]{9}" maxLength={9} readOnly={isViewOnly} />
                      <InputField label="เบอร์โทร(มือถือ)" type="tel" name="D_Tel" value={formData.D_Tel} onChange={numInputChange} pattern="[0-9]{10}" maxLength={10} readOnly={isViewOnly} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="ที่อยู่" type="text" name="D_Add" value={formData.D_Add} onChange={addressInputChange} maxLength={80} readOnly={isViewOnly} className="h-18 overflow-y-scroll" />
                        <InputField label="ที่อยู่2" type="text" name="D_Add2" value={formData.D_Add2} onChange={addressInputChange} maxLength={80} readOnly={isViewOnly} className="h-18 overflow-y-scroll" />                      
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <InputField label="เลขบัตรประชาชน" type="text" name="D_IDCard" value={formData.D_IDCard} onChange={numInputChange} maxLength={13} readOnly={isViewOnly} />
                      <InputField label="เลขใบขับขี่" type="text" name="D_LC" value={formData.D_LC} onChange={LCInputChange} maxLength={10} readOnly={isViewOnly} />
                      <InputField label="วันหมดอายุใบขับขี่" type="date" name="D_DateLcEx" value={formData.D_DateLcEx?.split("T")[0] || ""} onChange={handleInputChange} readOnly={isViewOnly} />
                      <InputField label="วันเริ่มจ้าง" type="date" name="D_DateIn" value={formData.D_DateIn?.split("T")[0] || ""} onChange={handleInputChange} readOnly={isViewOnly} />
                      <InputField label="วันหมดอายุ" type="date" name="D_DateEx" value={formData.D_DateEx?.split("T")[0] || ""} onChange={handleInputChange} readOnly={isViewOnly} />
                      <div>
                        <label className="blockmb-0.5 text-sm font-medium">ประเภทใบขับขี่</label>
                        {isViewOnly ? (
                          <div className="border px-2 py-1.5 rounded bg-white text-gray-800 text-sm">{formData.D_Type || "ไม่ระบุ"}</div>
                        ) : (
                          <select name="D_Type" value={formData.D_Type || ""} onChange={handleInputChange} className="bg-white w-full border px-2 py-1.5 rounded text-sm shadow-xl">
                            <option value=" "> -- กรุณาเลือกประเภทใบขับขี่ -- </option>
                            <option value="ประเภท 1"> ใบขับขี่ประเภท 1 (บ.1, ท.1) </option>
                            <option value="ประเภท 2"> ใบขับขี่ประเภท 2 (บ.2, ท.2) </option>
                            <option value="ประเภท 3"> ใบขับขี่ประเภท 3 (บ.3, ท.3) </option>
                            <option value="ประเภท 4"> ใบขับขี่ประเภท 4 (บ.4, ท.4) </option>
                          </select>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
                      {isViewOnly ? (
                        <>
                          <div><p>รูปบัตรประชาชน : </p> <ImagePreview imgPath={selectedUser.img_id} fieldName="img_id" /></div>
                          <div><p>รูปใบขับขี่ : </p> <ImagePreview imgPath={selectedUser.img_lc} fieldName="img_lc" /></div>
                          <div><p>รูปทะเบียนบ้าน : </p> <ImagePreview imgPath={selectedUser.img_home} fieldName="img_home" /></div>
                          <div><p>รูปสมุดบัญชี : </p> <ImagePreview imgPath={selectedUser.img_acc} fieldName="img_acc" /></div>
                          <div><p>รูปพลาสปอร์ต : </p> <ImagePreview imgPath={selectedUser.D_Passport} fieldName="D_Passport" /></div>
                        </>
                      ) : (
                        <>
                          <ImageUploadPreview label="รูปบัตรประชาชน" name="img_id" value={formData.img_id} onChange={imgInputChange} />
                          <ImageUploadPreview label="รูปใบขับขี่" name="img_lc" value={formData.img_lc} onChange={imgInputChange} />
                          <ImageUploadPreview label="รูปทะเบียนบ้าน" name="img_home" value={formData.img_home} onChange={imgInputChange} />
                          <ImageUploadPreview label="รูปสมุดบัญชี" name="img_acc" value={formData.img_acc} onChange={imgInputChange} />
                          <ImageUploadPreview label="รูปพลาสปอร์ต" name="img_acc" value={formData.D_Passport} onChange={imgInputChange} />
                          {/* <InputField label="ไฟล์resume.pdf" type="file" accept="application/pdf" name="" value="" readOnly={isViewOnly} /> */}
                          <FileUploadPreviewPDF
  label="แนบไฟล์ PDF"
  name="contractFile"
  value={formData.contractFile} // อาจเป็น URL หรือ File object 
/>
                        </>
                      )}
                    </div>

                    {isViewOnly ? (
                      <></>
                    ) : (
                      <div className="flex justify-end space-x-2 mt-3">
                        <button type="button" onClick={() => {setIsAddModalOpen(false), setSelectedUser(null), setFormData({})}} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded">
                          ยกเลิก
                        </button>
                        <button type="submit" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded" disabled={loadingSubmit}>
                          {loadingSubmit ? "กำลังบันทึก..." : selectedUser ? "บันทึกการแก้ไข" : "เพิ่มผู้ใช้"}
                        </button>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
  )
}
