import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

const GUEST_CREDENTIALS = {
  username: "guest",
  password: "guestpassword123"
}

const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = "Login"
  }, [])

  const submitLogin = async (loginUsername, loginPassword) => {
    setError("")
    setIsLoading(true)

    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, {
        username: loginUsername,
        password: loginPassword,
      })
      const data = response.data

      if (!data.token) {
        throw new Error("TOKEN_MISSING")
      }

      localStorage.setItem("token", data.token)
      localStorage.setItem("role", data.role || data.user?.role)
      navigate("/admin")
    } catch (error) {
      let msg = "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่"
      if (error.response) {
        const status = error.response.status
        const serverMessage = error.response.data?.message || error.response.data?.error
        if (serverMessage) {
          msg = serverMessage
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
    } finally {
      setIsLoading(false)
    }
  }

  // เข้าสู่ระบบแบบกรอกเอง
  const handleLogin = (e) => {
    e.preventDefault()
    submitLogin(username, password)
  }

  // เข้าสู่ระบบแบบ Guest ด้วย Credential อัตโนมัติ
  const handleGuestLogin = () => {
    submitLogin(GUEST_CREDENTIALS.username, GUEST_CREDENTIALS.password)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="text-red-500 bg-red-100 p-2 rounded">{error}</div>}
          <div>
            <label className="block mb-1 text-sm font-medium">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "กำลังตรวจสอบ..." : "Login"}
          </button>
        </form>

        {/* เส้นคั่นและปุ่มลิงก์ตัวอักษร Guest */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400 mb-2">หรือต้องการทดลองเข้าชมระบบ?</p>
          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={isLoading}
            className="text-sm font-medium text-gray-600 hover:text-blue-600 hover:underline transition-colors focus:outline-none disabled:opacity-50 cursor-pointer"
          >
            เข้าสู่ระบบด้วยบัญชีผู้เยี่ยมชม (Guest View)
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login