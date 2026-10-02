import axios from "axios"

// ใช้ Environment Variable ก่อน ถ้าไม่มีค่อยถอยมา localhost
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : "http://localhost:5000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 วินาที
})

// ป้องกันการแจ้งเตือน 401 ซ้ำซ้อนเวลาหลาย API พังพร้อมกัน
let isRedirecting = false

// Request Interceptor: แนบ Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: จัดการ Response และ Errors
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status

    // 1. กรณี Token หมดอายุ หรือไม่มีสิทธิ์ยืนยันตัวตน (401)
    if (status === 401) {
      if (!isRedirecting) {
        isRedirecting = true
        localStorage.removeItem("token")
        
        const message = error.response?.data?.message || "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่"
        alert(message)

        // ป้องกัน redirect วนลูปถ้าอยู่ที่หน้าแรกอยู่แล้ว
        if (window.location.pathname !== "/") {
          window.location.href = "/"
        }
      }
      return Promise.reject(error)
    }

    // 2. ถ้าไม่ได้ตั้งค่า config.silent = true ให้แจ้งเตือน Error ทั่วไป
    if (!error.config?.silent) {
      if (error.code === "ECONNABORTED") {
        alert("⏱️ การเชื่อมต่อหมดเวลา (Timeout) กรุณาลองใหม่อีกครั้ง")
      } else if (error.code === "ERR_NETWORK" || !error.response) {
        alert("❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือสถานะเซิร์ฟเวอร์")
      } else if (status === 403) {
        alert(error.response.data?.message || "⛔ คุณไม่มีสิทธิ์เข้าถึงส่วนนี้")
      } else {
        const errorMsg =
          error.response.data?.message ||
          error.response.data?.error ||
          "⚠️ เกิดข้อผิดพลาดจากเซิร์ฟเวอร์"
        alert(errorMsg)
      }
    }

    return Promise.reject(error)
  }
)

export default api