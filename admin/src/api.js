import axios from "axios"

const api = axios.create({
  baseURL: "https://app.magnitudetms.com/api",
  timeout: 10000, // 10 วินาที
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ✅ เพิ่ม interceptor ดัก error
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response.status === 401) {
            alert(error.response.data.message || "กรุณาเข้าสู่ระบบใหม่")
            localStorage.removeItem("token")
            window.location.href = "/"
        } 
        else if (!error.config?.silent) {
            if (error.code === "ERR_NETWORK") alert("❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ตของคุณ")
            else if (error.code === "ECONNABORTED") alert("⏱️ หมดเวลาการเชื่อมต่อ กรุณาลองใหม่")
            else if (error.response) {
                // if (error.response.status === 401) {
                //     alert(error.response.data.message || "กรุณาเข้าสู่ระบบใหม่")
                //     localStorage.removeItem("token")
                //     window.location.href = "/"
                // } else
                if (error.response.status === 403) alert(error.response.data.message || "คุณไม่มีสิทธิ์ใช้งาน")
                else { 
                    alert(error.response.data.message || error.response.data.error || "⚠️ เกิดข้อผิดพลาดจากเซิร์ฟเวอร์")
                    // console.error(error.response.data)
                }
            } else alert("เกิดข้อผิดพลาดที่ไม่คาดคิด")
        }
        return Promise.reject(error) // ส่ง error กลับให้หน้าเรียกจัดการต่อได้
    }
)

export default api
