import React, { useEffect, useState } from "react";
import { formatDate } from "../utils/formatDate";
import { FiAlertCircle, FiMenu, FiSearch, FiTrash2, FiEdit } from 'react-icons/fi';
import ImageUploadPreview from '../components/ImageUploadPreview';
import { ImagePreview, InputField } from '../components/InputField';
import { StatusBadge } from '../components/StatusBadges';
import api from '../api';

export default function Truck() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [trucks, setTrucks] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const [selectedTruck, setSelectedTruck] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;
    const [formData, setFormData] = useState({});
    const [error, setError] = useState("");
    const [isViewOnly, setIsViewOnly] = useState(false)
    const [loadingSubmit, setLoadingSubmit] = useState(false);

    useEffect(() => {
      document.title = "Truck Management";
      fetchTrucks();
    }, []);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
          fetchTrucks(searchTerm);
        }, 400);
    
        return () => clearTimeout(delayDebounce);
      }, [searchTerm]);

    const fetchTrucks = async (search) => {
      setLoading(true);
        try {
          const response = await api.get(`/truck/read?search=${encodeURIComponent(search)}`,{ silent: true })
          setTrucks(response.data);
        } catch (error) {
          setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
          console.error("เกิดข้อผิดพลาดในการดึงข้อมูล:", error.message);
        } finally {
        setLoading(false);
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (loadingSubmit) return; 
      setLoadingSubmit(true);
        try {
          const form = new FormData();
          for (const key in formData) {
            form.append(key, formData[key]);
          }
         
          const url = selectedTruck ? `/truck/update?id=${selectedTruck.T_ID}` : "/truck/create";
          const method = selectedTruck ? "put" : "post";
          await api({ method, url, data: form, headers: { "Content-Type": "multipart/form-data" }});
    
          await fetchTrucks(searchTerm);
          setIsAddModalOpen(false);
          setSelectedTruck(null);
          setFormData({});
        } catch (error) {
          if(error.response.data.error.sqlMessage) console.log(error.response.data.error.sqlMessage)
          console.error("เกิดข้อผิดพลาดขณะบันทึก:", error.response?.data || error.response.data.error.sqlMessage);
        } finally {
          setLoading(false);
        }
    };

    const handleDelete = async (id) => {
      if (loading) return;
      if (!window.confirm("คุณต้องการลบข้อมูลนี้หรือไม่?")) return;
      setLoading(true);
        try {
          await api.delete(`/truck/delete?id=${id}`)
          fetchTrucks(searchTerm);
        } catch (error) {
          console.error("เกิดข้อผิดพลาดขณะลบ:", error.message);
        } finally {
          setLoadingSubmit(false);
        }
    };

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const numInputChange = (e) => {
      const { name, value } = e.target;
      const filteredValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, [name]: filteredValue }));
    };

    const LCInputChange = (e) => {
      const { name, value } = e.target;
      const firstTwoChars = value.slice(0, 2);
      const rest = value.slice(2);
      const filteredRest = rest.replace(/[^0-9/-]/g, "");
      const filteredValue = firstTwoChars + filteredRest;
      setFormData((prev) => ({ ...prev, [name]: filteredValue }));
    };


    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTrucks = trucks.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(trucks.length / itemsPerPage);
    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    const closeDetailModal = () => {
      setSelectedTruck(null);
      setIsDetailModalOpen(false);
    };

    const imgInputChange = (e) => {
      const { name, value } = e.target;
      if (value instanceof File) {
        setFormData(prev => ({ ...prev, [name]: value }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: (value || "").toString().replace(/\s+/g, " "),
        }));
      }
    };

    const ErrorState = ({ error }) => (
          <div className="text-center m-auto text-red-500">
              <FiAlertCircle className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold">เกิดข้อผิดพลาด</h3>
              <p className="text-gray-600 mt-2">{error}</p>
          </div>
      );

  return (
          <main className="flex-1 p-4 md:p-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
              <h1 className="text-2xl md:text-3xl font-bold hidden md:block">จัดการข้อมูลรถ</h1>
              <div className="flex gap-2">
                <div className="relative flex-1 w-1/2">
                  <FiSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="ค้นหาทะเบียนรถ" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                </div>
                <button
                  onClick={() => {
                    setIsAddModalOpen(true)
                    setFormData({})
                    setSelectedTruck(null)
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white px-2 py-2 rounded shadow flex-1 max-w-1/3"
                >
                  +เพิ่มรถใหม่
                </button>
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
                        <th className="pl-4 py-2 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider "> ทะเบียนรถ </th>
                        <th className="pl-4 py-2 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider hidden md:table-cell"> ยี่ห้อ </th>
                        <th className="pl-4 py-2 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider hidden md:table-cell"> รุ่น </th>
                        <th className="pl-4 py-2 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider hidden md:table-cell"> ประเภท </th>
                        <th className="pl-4 py-2 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider "> คนขับ </th>
                        <th className="pl-4 py-2 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider hidden md:table-cell"> สถานะ </th>
                        <th className="pl-4 py-2 text-sm font-semibold text-gray-800 uppercase tracking-wider"> การจัดการ </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentTrucks.map((t, index) => (
                        <tr
                          key={t.T_ID || index}
                          className="hover:bg-gray-50 transition-colors"
                          onClick={() => {
                            setFormData(t), setSelectedTruck(t), setIsAddModalOpen(true), setIsViewOnly(true)
                          }}
                        >
                          {/* <td className="py-2 w-24 text-sm text-center text-gray-500">{indexOfFirstItem + index + 1}</td> */}
                          <td className="py-2 w-12 md:24 text-sm text-center text-gray-500">{t.T_ID}</td>
                          <td className="pl-4 py-2 w-36 text-sm text-gray-800 ">{t.T_No}</td>
                          <td className="pl-4 py-2 w-28 text-sm font-semibold text-gray-500 hidden md:table-cell">{t.T_Brand}</td>
                          <td className="pl-4 py-2 w-32 text-sm font-semibold text-gray-500 hidden md:table-cell">{t.T_Modal}</td>
                          <td className="pl-4 py-2 w-56 text-sm text-gray-500 hidden md:table-cell">{t.T_TypeTruck}</td>
                          {/* <td className="pl-4 py-2 w-48 text-sm text-gray-500 hidden md:table-cell">{t.T_Driver}</td> */}
                          <td className="pl-4 py-2 w-32 text-sm text-gray-500">{t.T_Driver_ID}</td>
                          <td className="pl-4 py-2 w-44 text-sm text-gray-500 hidden md:table-cell">
                            <StatusBadge status={t.t_status} />
                          </td>
                          <td className="pl-4 py-2  text-center">
                            <button
                              className="bg-blue-500 text-white px-2 py-1 mr-0.5 rounded hover:bg-blue-600"
                              onClick={(e) => {
                                e.stopPropagation(), setFormData(t), setSelectedTruck(t), setIsAddModalOpen(true), setIsViewOnly(false)
                              }}
                            >
                              <FiEdit size={18} />
                            </button>
                            <button
                              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                              onClick={(e) => {
                                e.stopPropagation(), handleDelete(t.T_ID)
                              }}
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* <div className="md:hidden space-y-4">
                            {currentTrucks.map((truck, index) => (
                              <div key={truck.T_ID} className="bg-white p-4 rounded-lg shadow border border-gray-200" onClick={() => openDetailModal(truck)}>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-bold text-lg text-gray-800">{truck.T_Brand} {truck.T_Modal}</p>
                                    <p className="text-sm text-gray-600">ทะเบียน: {truck.T_No}</p>
                                    <p className="text-sm text-gray-500">{truck.T_TypeTruck}</p>
                                  </div>
                                  <div className="text-right text-sm text-gray-400">#{indexOfFirstItem + index + 1}</div>
                                </div>
                                <div className="border-t mt-4 pt-3 flex justify-end gap-2">
                                  <button className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(truck.T_ID); }}>ลบ</button>
                                  <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600" onClick={(e) => { e.stopPropagation(); setFormData(truck); setSelectedTruck(truck); setIsAddModalOpen(true); }}>แก้ไข</button>
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
                    หน้า {currentPage} / {totalPages}
                  </span>
                  <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} className="w-22 px-3 py-1 rounded bg-white hover:bg-blue-300 disabled:opacity-50">
                    ถัดไป
                  </button>
                </footer>
              </div>
            )}

            {isDetailModalOpen && selectedTruck && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
                  <h2 className="text-xl font-semibold mb-4">รายละเอียดรถ</h2>
                  <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 overflow-y-auto pr-2">
                    <p>
                      <strong>ID รถ:</strong> {selectedTruck.T_ID}
                    </p>
                    <p>
                      <strong>เจ้าของ:</strong> {selectedTruck.T_Owner}
                    </p>
                    <p>
                      <strong>ยี่ห้อ:</strong> {selectedTruck.T_Brand}
                    </p>
                    <p>
                      <strong>รุ่นรถ:</strong> {selectedTruck.T_Modal}
                    </p>
                    <p className="md:col-span-3">
                      <strong>ประเภทรถบรรทุก:</strong> {selectedTruck.T_TypeTruck}
                    </p>
                    <p>
                      <strong>เลขทะเบียนรถ:</strong> {selectedTruck.T_No}
                    </p>
                    <p>
                      <strong>ชื่อคนขับ:</strong> {selectedTruck.T_Driver}
                    </p>
                    <p>
                      <strong>สถานะรถ:</strong> {selectedTruck.t_status}
                    </p>
                    <p>
                      <strong>วันหมดอายุทะเบียน:</strong> {formatDate(selectedTruck.T_Date_Car)}
                    </p>
                    <p>
                      <strong>วันหมดอายุ พรบ:</strong> {formatDate(selectedTruck.T_Date_Plb)}
                    </p>
                    <p>
                      <strong>วันหมดอายุประกัน:</strong> {formatDate(selectedTruck.T_Date_Pro)}
                    </p>
                    <p>
                      <strong>เลขไมล์:</strong> {selectedTruck.t_mile}
                    </p>
                    <p>
                      <strong>น้ำหนัก:</strong> {selectedTruck.T_Weight}
                    </p>
                    <p>
                      <strong>บรรทุกสูงสุด:</strong> {selectedTruck.T_TruckLoad}
                    </p>
                    {/* รูปภาพ */}
                    <div>
                      <strong>รูปหน้ารถ (URL) : </strong>
                      <ImagePreview imgPath={selectedTruck.T_PicCover1} fieldName="T_PicCover1" />
                    </div>
                    <div>
                      <strong>รูปด้านข้าง (URL) : </strong>
                      <ImagePreview imgPath={selectedTruck.T_PicCover2} fieldName="T_PicCover2" />
                    </div>
                    <div>
                      <strong>รูปด้านหลัง (URL) : </strong>
                      <ImagePreview imgPath={selectedTruck.T_PicCover3} fieldName="T_PicCover3" />
                    </div>
                  </div>
                  <div className="mt-6 text-right border-t pt-4">
                    <button onClick={closeDetailModal} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded">
                      ปิด
                    </button>
                  </div>
                </div>
              </div>
            )}
            {isAddModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                {...(isViewOnly ? {onClick: () => { setIsAddModalOpen(false), setSelectedTruck(null), setFormData({}), setIsViewOnly(false)},} : {} )}
              >
                <div className="flex flex-col bg-gray-100 p-4 md:p-6 rounded-lg shadow-lg w-[90%] max-w-5xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  <h2 className="text-xl font-semibold mb-4">{isViewOnly ? "ข้อมูลรถ" : selectedTruck ? "แก้ไขข้อมูลรถ" : "เพิ่มรถใหม่"}</h2>
                  <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-hidden">
                    <div className="bg-white p-1 flex flex-col gap-y-4 rounded shadow-md">
                      <InputField label="ID" type="text" name="T_ID" value={formData.T_ID} onChange={numInputChange} maxLength={5} readOnly={true} className="max-w-24 text-center" />
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <InputField label="Owner ID" type="text" name="T_Owner_ID" value={formData.T_Owner_ID} onChange={numInputChange} maxLength={5} readOnly={isViewOnly} />
                        <InputField label="เจ้าของ" type="text" name="T_Owner" value={formData.T_Owner} onChange={handleInputChange} maxLength={20} readOnly={isViewOnly} />
                        <InputField label="ID คนขับ" type="text" name="T_Driver_ID" value={formData.T_Driver_ID} onChange={numInputChange} maxLength={4} readOnly={isViewOnly} />
                        <InputField label="ชื่อคนขับ" type="text" name="T_Driver" value={formData.T_Driver} onChange={handleInputChange} maxLength={50} readOnly={isViewOnly} />
                        <InputField label="ประเภท" type="text" name="T_Type" value={formData.T_Type} onChange={numInputChange} maxLength={1} readOnly={isViewOnly} />
                        <div>
                          <label className="block text-sm font-medium mb-1">ยี่ห้อ</label>
                          {isViewOnly ? (
                            <div className="border px-2 py-1.5 rounded bg-white text-gray-800 text-sm">{formData.T_Brand || ""}</div>
                          ) : (
                            <select name="T_Brand" value={formData.T_Brand || ""} onChange={handleInputChange} className="bg-white w-full border px-2 py-1.5 rounded text-sm shadow-xl">
                              <option value="">-- เลือก --</option>
                              <option value="HINO">HINO</option>
                              <option value="ISUZU">ISUZU</option>
                            </select>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">รุ่นรถ</label>
                          {isViewOnly ? (
                            <div className="border px-2 py-1.5 rounded bg-white text-gray-800 text-sm">{formData.T_Modal || ""}</div>
                          ) : (
                            <select name="T_Modal" value={formData.T_Modal || ""} onChange={handleInputChange} className="bg-white w-full border px-2 py-1.5 rounded text-sm shadow-md">
                              <option value="">-- เลือก --</option>
                              <option value="victor">Victor</option>
                              <option value="victorเก่า">Victor (เก่า)</option>
                            </select>
                          )}
                        </div>
                        <InputField label="เลขทะเบียนรถ" type="text" name="T_No" value={formData.T_No} onChange={LCInputChange} maxLength={9} readOnly={isViewOnly} />
                        <InputField label="เลขที่ใบอนุญาต" type="text" name="T_LC" value={formData.T_LC} onChange={LCInputChange} maxLength={15} readOnly={isViewOnly} />
                        <InputField label="ท้ายใบอนุญาต" type="text" name="T_LC_Tail" value={formData.T_LC_Tail} onChange={LCInputChange} maxLength={15} readOnly={isViewOnly} />
                        <div>
                          <label className="block text-sm font-medium mb-1">ประเภทรถบรรทุก</label>
                          <input type="text" name="T_TypeTruck" maxLength={30} value={formData.T_TypeTruck || ""} onChange={handleInputChange} className="bg-white w-full border px-2 py-1.5 rounded text-sm shadow-md" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">เชื้อเพลิง</label>
                          {isViewOnly ? (
                            <div className="border px-2 py-1.5 rounded bg-white text-gray-800 text-sm">{formData.T_Fuel || ""}</div>
                          ) : (
                            <select name="T_Fuel" value={formData.T_Fuel || ""} onChange={handleInputChange} className="bg-white w-full border px-2 py-1.5 rounded text-sm shadow-md">
                              <option value="">-- เลือก --</option>
                              <option value="ดีเซล">ดีเซล</option>
                              <option value="NGV">NGV</option>
                            </select>
                          )}
                        </div>
                        <InputField label="น้ำหนัก (กก.)" type="number" name="T_Weight" value={formData.T_Weight} onChange={handleInputChange} readOnly={isViewOnly} min="0" step="1" />
                        <InputField label="บรรทุกสูงสุด (กก.)" type="number" name="T_TruckLoad" value={formData.T_TruckLoad} onChange={handleInputChange} readOnly={isViewOnly} min="0" step="1" />
                        <InputField label="ปีรถ (ค.ศ.)" type="number" name="T_ModalYear" value={formData.T_ModalYear} onChange={LCInputChange} maxLength={4} readOnly={isViewOnly} min="1900" step="1" />
                        <InputField label="วันหมดอายุใบขับขี่" type="date" name="T_Date_LC" value={formData.T_Date_LC?.split("T")[0] || ""} onChange={handleInputChange} readOnly={isViewOnly} />
                        <InputField label="วันหมดอายุ พรบ." type="date" name="T_Date_Plb" value={formData.T_Date_Plb?.split("T")[0] || ""} onChange={handleInputChange} readOnly={isViewOnly} />
                        <InputField label="วันหมดอายุทะเบียน" type="date" name="T_Date_Car" value={formData.T_Date_Car?.split("T")[0] || ""} onChange={handleInputChange} readOnly={isViewOnly} />
                        <InputField label="วันหมดอายุประกัน" type="date" name="T_Date_Pro" value={formData.T_Date_Pro?.split("T")[0] || ""} onChange={handleInputChange} readOnly={isViewOnly} />
                        <div>
                          <label className="block text-sm font-medium mb-1">สถานะรถ</label>
                          {isViewOnly ? (
                            <div className="border px-2 py-1.5 rounded bg-white text-gray-800 text-sm">{formData.t_status || "ไม่ระบุ"}</div>
                          ) : (
                            <select name="t_status" value={formData.t_status || ""} onChange={handleInputChange} className="bg-white w-full border px-2 py-1.5 rounded text-sm shadow-md">
                              <option value="">-- เลือก --</option>
                              <option value="พร้อมใช้งาน">พร้อมใช้งาน</option>
                              <option value="อุบัติเหตุ">อุบัติเหตุ</option>
                              <option value="ซ่อมบำรุง">ซ่อมบำรุง</option>
                            </select>
                          )}
                        </div>
                        <InputField label="เลขไมล์" type="number" name="t_mile" value={formData.t_mile} onChange={numInputChange} readOnly={isViewOnly} />
                      </div>
                      
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
                        {isViewOnly ? (
                          <>
                            <div><p>รูปหน้ารถ (URL) </p> <ImagePreview imgPath={formData.T_PicCover1} fieldName="T_PicCover1" /></div>
                            <div><p>รูปด้านข้าง (URL)</p> <ImagePreview imgPath={formData.T_PicCover2} fieldName="T_PicCover2" /></div>
                            <div><p>รูปด้านหลัง (URL)</p> <ImagePreview imgPath={formData.T_PicCover3} fieldName="T_PicCover3" /></div>
                          </>
                        ) : (
                          <>
                            <ImageUploadPreview label="รูปหน้ารถ (URL)" name="T_PicCover1" value={formData.T_PicCover1} onChange={imgInputChange} />
                            <ImageUploadPreview label="รูปใบขับขี่" name="T_PicCover2" value={formData.T_PicCover2} onChange={imgInputChange} />
                            <ImageUploadPreview label="รูปทะเบียนบ้าน" name="T_PicCover3" value={formData.T_PicCover3} onChange={imgInputChange} />
                          </>
                        )}
                      </div>

                      {/* <div><label className="block text-sm font-medium mb-1">ID รถ</label><input type="text" name="T_ID" maxLength={5} value={formData.T_ID || ""} onChange={numInputChange} className="w-full border rounded p-2" readOnly/></div> */}
                      {/* <div><label className="block text-sm font-medium mb-1">Owner ID</label><input type="text" name="T_Owner_ID" maxLength={5} value={formData.T_Owner_ID || ""} onChange={numInputChange} className="w-full border rounded p-2"/></div> */}
                      {/* <div><label className="block text-sm font-medium mb-1">เจ้าของ</label><input type="text" name="T_Owner" maxLength={20} value={formData.T_Owner || ""} onChange={handleInputChange} className="w-full border rounded p-2"/></div> */}
                      {/* <div><label className="block text-sm font-medium mb-1">ประเภท</label><input type="text" name="T_Type" maxLength={1} value={formData.T_Type || ""} onChange={numInputChange} className="w-full border rounded p-2"/></div> */}
                      {/* <div><label className="block text-sm font-medium mb-1">ยี่ห้อ</label><select name="T_Brand" value={formData.T_Brand || ""} onChange={handleInputChange} className="w-full border rounded p-2"><option value="">-- เลือก --</option><option value="HINO">HINO</option><option value="ISUZU">ISUZU</option></select></div>
                                  <div><label className="block text-sm font-medium mb-1">รุ่นรถ</label><select name="T_Modal" value={formData.T_Modal || ""} onChange={handleInputChange} className="w-full border rounded p-2"><option value="">-- เลือก --</option><option value="victor">Victor</option><option value="victorเก่า">Victor (เก่า)</option></select></div> */}
                      {/* <div><label className="block text-sm font-medium mb-1">เลขทะเบียนรถ</label><input type="text" name="T_No" maxLength={9} value={formData.T_No || ""} onChange={LCInputChange} className="w-full border rounded p-2"/></div> */}
                      {/* <div><label className="block text-sm font-medium mb-1">เลขที่ใบอนุญาต</label><input type="text" name="T_LC" maxLength={15} value={formData.T_LC || ""} onChange={LCInputChange} className="w-full border rounded p-2"/></div> */}
                      {/* <div className='md:col-span-2'><label className="block text-sm font-medium mb-1">ท้ายใบอนุญาต</label><input type="text" name="T_LC_Tail" maxLength={30} value={formData.T_LC_Tail || ""} onChange={LCInputChange} className="w-full border rounded p-2"/></div> */}
                      {/* <div className='md:col-span-2'><label className="block text-sm font-medium mb-1">ประเภทรถบรรทุก</label><input type="text" name="T_TypeTruck" maxLength={30} value={formData.T_TypeTruck || ""} onChange={handleInputChange} className="w-full border rounded p-2"/></div> */}
                      {/* <div><label className="block text-sm font-medium mb-1">เชื้อเพลิง</label><select name="T_Fuel" value={formData.T_Fuel || ""} onChange={handleInputChange} className="w-full border rounded p-2"><option value="">-- เลือก --</option><option value="ดีเซล">ดีเซล</option><option value="NGV">NGV</option></select></div> */}
                      {/* <div><label className="block text-sm font-medium mb-1">น้ำหนัก (กก.)</label><input type="number" name="T_Weight" min="0" step="1" value={formData.T_Weight || ""} onChange={handleInputChange} className="w-full border rounded p-2"/></div> */}
                      {/* <div><label className="block text-sm font-medium mb-1">บรรทุกสูงสุด (กก.)</label><input type="number" name="T_TruckLoad" min="0" step="1" value={formData.T_TruckLoad || ""} onChange={handleInputChange} className="w-full border rounded p-2"/></div> */}
                      {/* <div><label className="block text-sm font-medium mb-1">ปีรถ (ค.ศ.)</label><input type="number" name="T_ModalYear" maxLength={4} min="1900" step="1" value={formData.T_ModalYear || ""} onChange={numInputChange} className="w-full border rounded p-2"/></div> */}
                      {/* <div><label className="block text-sm font-medium mb-1">ID คนขับ</label><input type="text" name="T_Driver_ID" maxLength={4} value={formData.T_Driver_ID || ""} onChange={numInputChange} className="w-full border rounded p-2"/></div> */}
                      {/* <div className='md:col-span-2'><label className="block text-sm font-medium mb-1">ชื่อคนขับ</label><input type="text" name="T_Driver" maxLength={50} value={formData.T_Driver || ""} onChange={handleInputChange} className="w-full border rounded p-2"/></div> */}
                      {/* <div><label className="block text-sm font-medium mb-1">วันหมดอายุใบขับขี่</label><input type="date" name="T_Date_LC" value={formData.T_Date_LC?.split("T")[0] || ""} onChange={handleInputChange} className="w-full border rounded p-2"/></div> */}
                      {/* <div><label className="block text-sm font-medium mb-1">วันหมดอายุ พรบ.</label><input type="date" name="T_Date_Plb" value={formData.T_Date_Plb?.split("T")[0] || ""} onChange={handleInputChange} className="w-full border rounded p-2"/></div> */}
                      {/* <div><label className="block text-sm font-medium mb-1">วันหมดอายุทะเบียน</label><input type="date" name="T_Date_Car" value={formData.T_Date_Car?.split("T")[0] || ""} onChange={handleInputChange} className="w-full border rounded p-2"/></div> */}
                      {/* <div><label className="block text-sm font-medium mb-1">วันหมดอายุประกัน</label><input type="date" name="T_Date_Pro" value={formData.T_Date_Pro?.split("T")[0] || ""} onChange={handleInputChange} className="w-full border rounded p-2"/></div> */}
                      {/* <div><label className="block text-sm font-medium mb-1">สถานะรถ</label><select name="t_status" value={formData.t_status || ""} onChange={handleInputChange} className="w-full border rounded p-2"><option value="">-- เลือก --</option><option value="พร้อมใช้งาน">พร้อมใช้งาน</option><option value="อุบัติเหตุ">อุบัติเหตุ</option><option value="ซ่อมบำรุง">ซ่อมบำรุง</option></select></div> */}
                      {/* <div><label className="block text-sm font-medium mb-1">เลขไมล์</label><input type="number" name="t_mile" value={formData.t_mile || ""} onChange={numInputChange} className="w-full border rounded p-2"/></div> */}
                      {/* <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ImageUploadPreview label="รูปหน้ารถ (URL)" name="T_PicCover1" value={formData.T_PicCover1} onChange={imgInputChange} />
                        <ImageUploadPreview label="รูปด้านข้าง (URL)" name="T_PicCover2" value={formData.T_PicCover2} onChange={imgInputChange} />
                        <ImageUploadPreview label="รูปด้านหลัง (URL)" name="T_PicCover3" value={formData.T_PicCover3} onChange={imgInputChange} />
                      </div> */}
                    {isViewOnly ? (
                      <></>
                    ) : (
                      <div className="flex justify-end space-x-2 mt-3">
                        <button type="button" onClick={() => {setIsAddModalOpen(false), setSelectedTruck(null), setFormData({})}} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded">
                          ยกเลิก
                        </button>
                        <button type="submit" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded" disabled={loadingSubmit}>
                          {loadingSubmit ? "กำลังบันทึก..." : selectedTruck ? "บันทึกการแก้ไข" : "เพิ่มรถ"}
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