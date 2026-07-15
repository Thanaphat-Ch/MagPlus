import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";


const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Login";
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {

  const response = await fetch('https://app.magnitudetms.com/api/login', { 
    method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }), });
  const data = await response.json();
    if (!response.ok) {
      throw new Error(`Server error: ${data.message || 'Unknown error'}`);
    }

    if (!data.token) {
      throw new Error('Token missing in server response');
    }

    localStorage.setItem("token", data.token);
    navigate("/admin");


  } catch (error) {
    console.error("Error loading data:", error);
    alert(`Login failed: ${error.message}`);
  }
  };

  // const handleGoogleLoginSuccess = async (credentialResponse) => {
  //   try {
  //     const decoded = jwt_decode(credentialResponse.credential);
  //     // console.log("Google User:", decoded);

  //     const res = await fetch("https://app.magnitudetms.com/api/google-login", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ token: credentialResponse.credential }),
  //     });

  //     const result = await res.json();

  //     if (res.ok) {
  //       localStorage.setItem("token", result.token);
  //       navigate("/dashboard");
  //     } else {
  //       setError(result.message || "Google Login failed");
  //     }
  //   } catch (err) {
  //     console.error("Google login error:", err);
  //     setError("Google Login failed");
  //   }
  // };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="text-red-500 bg-red-100 p-2 rounded">{error}</div>
          )}
          <div>
            <label className="block mb-1 text-sm font-medium">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
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
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
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
  );
};

export default Login;
