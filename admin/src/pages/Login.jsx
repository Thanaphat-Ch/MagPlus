import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode"
import api from "../api"

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
      const response = await api.post("/login", { username, password })
      const data = response.data
      if (!data.token) { throw new Error("Token missing in server response")}

      localStorage.setItem("token", data.token)
      navigate("/admin")
    } catch (error) {
      // กรณี interceptor alert ไปแล้ว และไม่อยากให้ขึ้น alert ซ้ำสองรอบ
      // สามารถตั้ง state error ในหน้า UI ได้ตามปกติ
      const msg = error.response?.data?.message || error.message || "Login failed"
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
