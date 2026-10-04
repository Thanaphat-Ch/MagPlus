import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : "http://localhost:5000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

let isRedirecting = false

const handleForceLogout = (message) => {
  if (isRedirecting) return
  isRedirecting = true

  localStorage.removeItem("token")
  localStorage.removeItem("role")
  if (message) alert(message)

  if (window.location.pathname !== "/") {
    window.location.href = "/"
  } else {
    isRedirecting = false
  }
}

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (!token) {
      handleForceLogout("ไม่พบสิทธิ์การใช้งาน กรุณาเข้าสู่ระบบก่อน")
      return Promise.reject(new axios.Cancel("No token found. Request aborted."))
    }

    const role = localStorage.getItem("role")
    const method = config.method?.toLowerCase()
    if (role === "guest" && method !== "get") {
      const blockedMsg = "🔒 สิทธิ์ Guest สามารถดูข้อมูลได้อย่างเดียว ไม่สามารถเพิ่ม แก้ไข หรือลบข้อมูลได้"
      if (!config.silent) {
        alert(blockedMsg)
      }
      return Promise.reject(new axios.Cancel(blockedMsg))
    }

    config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor
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