import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    document.title = "Login"
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")

    try {
      console.log("Attempting login with API_BASE_URL:", API_BASE_URL)
      const response = await axios.post(`${API_BASE_URL}/api/login`, { username, password })
      const data = response.data

      if (!data.token) {
        throw new Error("TOKEN_MISSING")
      }
      localStorage.setItem("token", data.token)
      navigate("/admin")
    } catch (error) {
      let msg = "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่"
      if (error.response) {
        const status = error.response.status
        const serverMessage = error.response.data?.message || error.response.data?.error
        if (serverMessage) {
          msg = serverMessage // ถ้าหลังบ้านส่งข้อความเฉพาะมา ให้ใช้ข้อความนั้น
        } else if (status === 400 || status === 401) {
          msg = "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
        } else if (status === 404) {
          msg = "ไม่พบเส้นทางเชื่อมต่อ กรุณาตรวจสอบ URL ของเซิร์ฟเวอร์"
        } else if (status >= 500) {
          msg = "เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่อีกครั้งในภายหลัง"
        }
      } else if (error.code === "ECONNABORTED") {
        msg = "การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง"
      } else if (error.code === "ERR_NETWORK" || !error.request) {
        msg = "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ต"
      } else if (error.message === "TOKEN_MISSING") {
        msg = "เข้าสู่ระบบสำเร็จแต่ไม่พบ Token ยืนยันตัวตน"
      }
      setError(msg)
    }
  }
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="text-red-500 bg-red-100 p-2 rounded">{error}</div>}
          <div>
            <label className="block mb-1 text-sm font-medium">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
            Login
          </button>
        </form>

        {/* <div className="my-4 border-t pt-4 text-center text-sm text-gray-500">
          หรือเข้าสู่ระบบด้วย Gmail
        </div> */}

        {/* <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={() => {
              setError("Google Login ล้มเหลว ");
            }}
          />
        </div> */}
      </div>
    </div>
  )
}

export default Login
