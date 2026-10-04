import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : "http://localhost:5000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 วินาที
})

// ป้องกันการเด้งซ้ำซ้อน
let isRedirecting = false

// ฟังก์ชันกลางสำหรับเคลียร์ค่าและเตะกลับหน้า Login
const handleForceLogout = (message) => {
  if (isRedirecting) return
  isRedirecting = true

  localStorage.removeItem("token")
  if (message) alert(message)

  if (window.location.pathname !== "/") {
    window.location.href = "/"
  } else {
    isRedirecting = false
  }
}

// Request Interceptor: บังคับว่าต้องมี Token ก่อนยิงทุกครั้ง
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (!token) {
      handleForceLogout("ไม่พบสิทธิ์การใช้งาน กรุณาเข้าสู่ระบบก่อน")
      return Promise.reject(new axios.Cancel("No token found. Request aborted."))
    }
    config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }

    const status = error.response?.status
    if (status === 401) {
      const message = error.response?.data?.message || "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่"
      handleForceLogout(message)
      return Promise.reject(error)
    }
    if (!error.config?.silent) {
      if (error.code === "ECONNABORTED") {
        alert("⏱️ การเชื่อมต่อหมดเวลา (Timeout) กรุณาลองใหม่อีกครั้ง")
      } else if (error.code === "ERR_NETWORK" || !error.response) {
        alert("❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือสถานะเซิร์ฟเวอร์")
      } else if (status === 403) {
        alert(error.response?.data?.message || "⛔ คุณไม่มีสิทธิ์เข้าถึงส่วนนี้")
      } else {
        const errorMsg =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "⚠️ เกิดข้อผิดพลาดจากเซิร์ฟเวอร์"
        alert(errorMsg)
      }
    }

    return Promise.reject(error)
  }
)

export default api