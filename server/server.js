const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');
const socketIo = require('socket.io');
const http = require('http');

const { OAuth2Client } = require('google-auth-library');
const CLIENT_ID = '751459675544-sklv91a38s83i2fuv56kalffdam1e59.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

const multer = require("multer");
const path = require("path");
const fs = require("fs");
//const sharp = require("sharp");
const { error } = require('console');

// const prefix = 'https://app.magnitudetms.com';
const prefix = 'http://localhost:5000';

const app = express();

app.use(cors());
app.use(express.json());
require('dotenv').config();
const JWT_SECRET = 'Th12345';

const dbPromise = db.promise();
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const uploadDir = path.join(__dirname, "uploads", "leave");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/leave";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const storageReject = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "uploads", "reject");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file?.originalname || "") || ".jpg"; 
    cb(null, "RJ_" + unique + ext);
  }
});
const uploadReject = multer({ storage: storageReject });

//จัดเก็บรูปภาพตอนเริ่มส่งของ
const storageStartdelovery = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "uploads", "startdelovery");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9); 
    const ext = path.extname(file?.originalname || "") || ".jpg";
    cb(null, "SD_" + unique + ext);
  }
});
const uploadStartdelovery = multer({ storage: storageStartdelovery });

//จัดเก็บรูปภาพตอนลงของ
const storageLoading = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "uploads", "loading");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9); 
    const ext = path.extname(file?.originalname || "") || ".jpg";
    cb(null, "LD_" + unique + ext);
  }
});
const uploadstorageLoading = multer({ storage: storageLoading });

const tempDir = path.join(__dirname, 'uploads', 'temp_images'); 

const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // สร้างโฟลเดอร์ temp_images ถ้ายังไม่มี
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file?.originalname || "") || ".jpg";
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const tempUpload = multer({ storage: tempStorage });




////
app.get('/api/v_user', (req, res) => {
 db.query('SELECT * FROM users', (err, result) => {
      if (err) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูล v_user:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล v_user' });
    }
    console.log(result)
    res.json(result);
    });  
}); 

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.use(cors({
  origin: [
    "https://driverback.magnitudeplus.com", 
    "https://driverapp.magnitudeplus.com"
  ],
  credentials: true
}));

// 2. สร้าง HTTP server จาก Express
const server = http.createServer(app);
// 3. สร้าง instance ของ Socket.IO
const io = socketIo(server, {
  cors: {
    origin: '*', 
  },
});
// 4. เก็บ mapping userId -> socket.id
const users = {};
// 5. เมื่อ client เชื่อมต่อ
io.on("connection", (socket) => {
  console.log("📲 Client connected:", socket.id);
  // 5a. ลงทะเบียน user (client ส่ง userId)
  socket.on('register', (userId) => { 
    socket.userId = userId;
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room user_${userId}`);
  });

  socket.on("join", async (userId) => {
    try {
      users[userId] = socket.id;
      console.log(`User ${userId} joined with socket ID: ${socket.id}`);

      const [userRows] = await dbPromise.query('SELECT role FROM users WHERE id = ?', [userId]);
      const role = userRows.length > 0 ? userRows[0].role : null;

      socket.join(String(userId)); 
      console.log(`User ${userId} joined room: ${userId}`);

      if (role === 'admin' || role === 'supervisor') {
        socket.join('admin_room');
        console.log(`👑 Admin/Supervisor ${userId} joined admin_room`);
      }
    } catch (error) {
      console.error("❌ Error joining user:", error);
    }
  });

  socket.on("sendMessage", async (data) => {
    // *** ID ของห้องแชทกลุ่ม (ต้องตรงกับใน API) ***
    const GROUP_CONVERSATION_ID = 1; 

    // [แก้ไข] รับแค่ from_user และ message
    const { from_user, message } = data;

    if (!from_user || !message) {
      return console.error("❌ sendMessage Error: Invalid data received.");
    }

    try {
      // 1. ดึงข้อมูลผู้ส่ง (Role และ Name)
      const [userRows] = await dbPromise.query(
        "SELECT role, name FROM users WHERE id = ?", [from_user]
      );
      if (userRows.length === 0) return console.error("Sender not found.");
      
      const senderRole = userRows[0].role;
      const senderName = userRows[0].name || "Unknown";
      const isDriverSending = (senderRole !== 'admin' && senderRole !== 'supervisor');

      // 2. บันทึกข้อความลง DB (ในห้องกลุ่ม)
      const [newMessage] = await dbPromise.query(
        "INSERT INTO messages (from_user, message, conversation_id, to_user) VALUES (?, ?, ?, NULL)",
        [from_user, message, GROUP_CONVERSATION_ID]
      );
      const messageId = newMessage.insertId;

      // 3. เตรียมข้อมูลส่ง Socket
      const msgData = {
        id: messageId,
        conversation_id: GROUP_CONVERSATION_ID,
        from_user,
        to_user: null,
        message,
        senderName: senderName,
        timestamp: new Date()
      };

      // 4. [สำคัญ] ส่งข้อความหา "ทุกคน" ที่ Online
      io.emit("newMessage", msgData);
      console.log(`📨 Group message sent by ${senderName}`);

      // 5. --- [โลจิกแจ้งเตือนที่คุณต้องการ] ---
      
      let targetRoleQuery;
      if (isDriverSending) {
          // ถ้าคนขับส่ง -> แจ้งเตือน Admin/Supervisor ที่ Offline
          targetRoleQuery = "role = 'admin' OR role = 'supervisor'";
      } else {
          // ถ้า Admin ส่ง -> แจ้งเตือน Driver ที่ Offline
          targetRoleQuery = "(role IS NULL OR (role != 'admin' AND role != 'supervisor'))";
      }

      // ดึง Token ของผู้รับทุกคน (ยกเว้นคนส่ง)
      const [recipientRows] = await dbPromise.query(
          `SELECT id, fcm_token FROM users WHERE fcm_token IS NOT NULL AND id != ? AND (${targetRoleQuery})`,
          [from_user]
      );
      
      if (recipientRows.length === 0) {
          console.log("No offline recipients to notify.");
          return; // จบการทำงาน
      }

      // เตรียม payload (เหมือนโค้ดของคุณ)
      const payload = {
          data: {
              title: `ข้อความใหม่จาก: ${senderName}`,
              body: message,
          },
          android: { notification: { sound: "default" } },
          apns: { payload: { aps: { sound: "default" } } },
      };

      let sentCount = 0;
      for (const recipient of recipientRows) {
          // [สำคัญ] เช็คว่า recipient "Offline" จริงๆ (ไม่อยู่ใน users map)
          if (!users[recipient.id]) { 
              try {
                  // ส่ง FCM
                  await admin.messaging().send({ ...payload, token: recipient.fcm_token });
                  sentCount++;
              } catch (e) {
                  console.error(`❌ Failed to send FCM to user ${recipient.id}:`, e.message);
              }
          }
      }
      
      if (sentCount > 0) {
          console.log(`🚀 Push notifications sent to ${sentCount} offline users.`);
      }

    } catch (error) {
      console.error("❌ A critical error occurred in group sendMessage handler:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
    const userId = Object.keys(users).find(key => users[key] === socket.id);
    if (userId) {
        delete users[userId];
        console.log(`User ${userId} unregistered (disconnected).`);
    }
  });
});

function broadcastActiveUsers() {
  db.query(
    //เพิ่ม
    "SELECT COUNT(*) AS activeUsers FROM users WHERE active = 1 AND (role IS NULL OR role NOT IN ('admin', 'supervisor'))",
    (err, results) => {
      if (!err) {
        const count = results[0].activeUsers;
        io.emit("activeUsers", count);
        console.log("📡 Broadcast activeUsers:", count);
      } else {
        console.error("❌ Error fetching active users:", err);
      }
    }
  );
}

app.get('/api/show', (req, res) => {
  res.send("3/11/68 1");
});

// login
app.post("/api/login", (req, res) => {
  console.log("📥 Login Request Received:", req.body);
  const { username, password } = req.body;

 db.query(
    "SELECT * FROM users WHERE username = ?", 
    [username],
    async (err, results) => {
      if (err)
        return res.status(500).json({ message: "Server error", error: err });
      if (results.length === 0)
        return res.status(400).json({ message: "ชื่อผู้ใช้ไม่ถูกต้อง" });

      const user = results[0];
      if (password !== user.password) { return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" }); }

      db.query(
        "UPDATE users SET active = 1 WHERE id = ? AND role NOT IN ('admin', 'supervisor');",
        [user.id],
        (updateErr) => {
          if (updateErr) {
            console.error("❌ Cannot update active status:", updateErr);
            return res.status(500).json({
              message: "เข้าสู่ระบบสำเร็จ แต่ไม่สามารถอัปเดตสถานะ active ได้",
            });
          }

          broadcastActiveUsers();

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role ,U_ID: user.U_ID},
        JWT_SECRET,
        { expiresIn: "1h" }
      );
      io.emit("login_user", { username });
      res.json({
        message: "Login successful",
        token,
        user: { id: user.id,
              U_ID: user.U_ID,
              username: user.username,
              role: user.role,
              active: 1, },
      });
      }
      );
    }
  );
});


app.get("/api/active-users", (req, res) => {
  db.query(
    "SELECT COUNT(*) AS activeUsers FROM users WHERE active = 1 AND (role IS NULL OR role NOT IN ('admin', 'supervisor'))",
    (err, results) => {
      if (err)
        return res
          .status(500)
          .json({ message: "Error fetching active users", error: err });
      res.json({ activeUsers: results[0].activeUsers });
    }
  );
});


app.post('/api/logout', authenticateToken, (req, res) => {
  db.query('UPDATE users SET active = 0 WHERE id = ?', [req.user.id], (err) => {
    if (err) return res.status(500).json({ message: 'ไม่สามารถอัปเดตสถานะ active ได้' });
    res.json({ message: 'ออกจากระบบสำเร็จ' });
  });
});

// Create
app.post('/api/create', (req, res) => {
  const { prefix, username, password, name, lastName, birthday, gender, phone, idCard, address, provinceId, districtId, subdistrictId, driver_license_number, car_type, vehicle_registration} = req.body;
  console.log('🧾 Create request body:', req.body);

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) return res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: err });
    if (results.length > 0) return res.status(400).json({ message: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' });

    db.query('INSERT INTO users (prefix, username, password, name, lastName, birthday, gender, phone, idCard, address, id_provinces, id_districts, id_subdistricts, driver_license_number, car_type, vehicle_registration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [prefix, username, password, name, lastName, birthday, gender, phone, idCard, address, provinceId, districtId, subdistrictId, driver_license_number,car_type,vehicle_registration], (err2, result) => {
      if (err2) return res.status(500).json({ message: 'ไม่สามารถบันทึกผู้ใช้ได้', error: err2 });
      io.emit('new_user', { username, name });
      res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ'});
    });
  });
});

// readall 
app.get('/api/readall', authenticateToken, authorizeAdmin, (req, res) => {
    db.query('SELECT * FROM users', (err, result) => {
      if (err) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูล readall:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล readall'});
    }
    res.json(result);
    });  
});

// Delete
app.delete('/api/delete/:id', (req, res) => {
  const userId = req.params.id;

  const sql = 'DELETE FROM users WHERE id = ?';

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error('❌ Delete error:', err);
      return res.status(500).send('Delete failed');
    }
    res.send('✅ User deleted successfully');
  });
});

app.put('/api/users/:userId/role', authenticateToken, authorizeAdmin, (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  // ป้องกันการตั้งค่า role แปลกๆ (อนุญาตแค่ admin กับ user)
  if (!role || !['admin', 'user'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Can only set to "admin" or "user".' });
  }

  const sql = 'UPDATE users SET role = ? WHERE id = ?';

  db.query(sql, [role, userId], (err, result) => {
    if (err) {
      console.error('Error updating user role:', err);
      return res.status(500).json({ message: 'Database error while updating role.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: 'User role updated successfully.' });
  });
});

//เพิ่มสร้าง admin
app.post('/api/users/create', authenticateToken, authorizeAdmin, (req, res) => {
  const { username, password, name, lastName } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ message: 'Username, password, and name are required.' });
  }

  db.query('SELECT id FROM users WHERE username = ?', [username], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (results.length > 0) {
      return res.status(409).json({ message: 'This username is already taken.' });
    }

    // แก้ไขคำสั่ง INSERT ให้ใส่ข้อมูลในคอลัมน์ที่จำเป็นครบ
    const sql = 'INSERT INTO users (username, password, name, lastname, role, U_ID, active, id_provinces, id_subdistricts, id_districts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    
    // ใส่ค่าเริ่มต้นสำหรับคอลัมน์ที่จำเป็น
    db.query(sql, [
      username,
      password,
      name,
      lastName || null, // แก้เป็น lastname (ตัวเล็ก) ให้ตรงกับฐานข้อมูล
      'admin',          // กำหนด role
      null,                // ใส่ค่าเริ่มต้นสำหรับ U_ID (สำคัญมาก, ดูหมายเหตุด้านล่าง)
      1,                // ตั้งค่า active เป็น 1 (ใช้งาน)
      0,                // ใส่ค่าเริ่มต้น
      0,                // ใส่ค่าเริ่มต้น
      0                 // ใส่ค่าเริ่มต้น
    ], (err2, result) => {
      if (err2) {
        // เพิ่ม console.error เพื่อให้เห็นข้อผิดพลาดที่ Terminal ชัดเจนขึ้น
        console.error("DATABASE INSERT ERROR:", err2);
        return res.status(500).json({ message: 'Could not create user.', error: err2 });
      }

      const newUser = {
        id: result.insertId,
        username,
        name,
        lastName: lastName || null,
        role: 'admin'
      };

      res.status(201).json({ message: 'Admin user created successfully', newUser });
    });
  });
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401).json({ message: "คุณยังไม่ได้เข้าสู่ระบบ กรุณา login" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    console.log('token load check')
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token หมดอายุ กรุณาเข้าสู่ระบบใหม่" });
      }
      return res.status(403).json({ message: "Token ไม่ถูกต้อง" });
    }
    req.user = user;
    next();
  });
}
//check admin
function authorizeAdmin(req, res, next) {
  if (req.user.role == "user") {
    return res.status(403).json({ message: "เฉพาะ admin" });
  }
  next();
}

//setpass
app.put('/api/update/:id', async (req, res) => {
  const userId = req.params.id;
  const { prefix, username, password, name, lastName, birthday, gender, phone,idCard,address ,driver_license_number,car_type,vehicle_registration } = req.body;
  const sql = `
    UPDATE users 
    SET prefix = ?, username = ?, password = ?, name = ?, lastName = ?, birthday = ?, gender = ?, phone = ?, idCard = ?, address  = ?, driver_license_number = ?, car_type = ?, vehicle_registration = ?
    WHERE id = ? `;

  db.query(sql, [prefix, username, password, name, lastName, birthday, gender, phone,idCard,address ,driver_license_number,car_type,vehicle_registration,userId], (err, result) => {
    if (err) {
      console.error('❌ Update error:', err);
      return res.status(500).send('Update failed');
    }
    io.emit('set_user', { username, name });
    res.send('✅ User updated successfully');
  });
});

app.put('/api/set-pin', async (req, res) => {
  const { username, password } = req.body;
  console.log('setpin',req.body)
  if (!username || !password) {
    return res.status(400).json({ message: 'กรุณาระบุชื่อผู้ใช้และ PIN' });
  }

  db.query('UPDATE users SET password = ? WHERE username = ?', [password, username], (err, result) => {
    if (err) return res.status(500).json({ message: 'อัปเดต PIN ล้มเหลว', error: err });
    if (result.affectedRows === 0) {
      
      db.query('SELECT D_ID, D_Name, D_SurName FROM d_driver WHERE D_Tel = ?', [username], (err2, driverResult) => {
        if (err2) return res.status(500).json({ message: 'ไม่มีข้อมูลเบอร์โทรนี้ในระบบ', error: err2 });
        if (driverResult.length === 0) return res.status(404).json({ message: 'ไม่พบ username ใน users หรือ d_driver' });

        const driverId = driverResult[0].D_ID;
        const driverName = driverResult[0].D_Name;
        const driverSurName = driverResult[0].D_SurName;
        const role = 'user'

        db.query('INSERT INTO users (U_ID, role, username, password, name, lastname) VALUES (?, ?, ?, ?, ?, ?)', [driverId, role, username, password, driverName, driverSurName], (err3, insertResult) => {
          if (err3) return res.status(500).json({ message: 'เพิ่ม user ใหม่ล้มเหลว', error: err3 });
              return res.json({ message: 'สร้าง user ใหม่สำเร็จจาก d_driver', userId: driverId });
        });
      });
    } else {
      res.json({ message: 'ตั้งค่า PIN สำเร็จ' });
    }
  });
});

app.post('/api/forgot', (req, res) => {
  const { username, idCard, phone, licensePlate } = req.body;
  console.log(req.body)

  if (!username || !idCard || !phone || !licensePlate) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
  }
  const sql = `
    SELECT u.*, d.D_IDCard, d.D_Tel, t.T_No
    FROM users u
    JOIN d_driver d ON u.U_ID = d.D_ID
    JOIN t_truck t ON d.D_ID = t.T_Driver_ID
    WHERE u.username = ?
  `;

  db.query(sql, [username, idCard, phone, licensePlate], (err, results) => {
    if (err) {
      console.error('DB Error:', err);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'ไม่พบชื่อผู้ใช้ในระบบ' });
    }

    const user = results[0];

    if (
      user.D_IDCard !== idCard ||
      user.D_Tel !== phone ||
      user.T_No !== licensePlate
    ) {
      return res.status(400).json({ message: 'ข้อมูลไม่ตรงกับที่ลงทะเบียนไว้' });
    }

    io.emit('forgot_user', { username });
    res.json({ message: 'ok' });
  });
});

app.post('/api/sendMessage', (req, res) => {
  const { message} = req.body;
  console.log(req.body)

    io.emit('sendMessage_admin', { message });
    res.json({message: 'ok-'})
});

// ✅ Provinces
app.get('/api/provinces',authenticateToken, (req, res) => {
  db.query('SELECT id, name_in_thai FROM provinces', (err, results) => {
    console.log(results)
    if (err) {
      console.error('❌ Get provinces error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    console.log(results)
    res.json(results);
  });
});

// read Profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.query('SELECT * FROM users WHERE id = ?',[userId],(err, results) => {
      if (err) return res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
      if (results.length === 0) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
      const user = results[0];
    
      if (user.profile) user.profile = addPrefix(user.profile);
      res.json(user);
    }
  );
});


app.get('/api/districts/:provinceId', (req, res) => {
  const { provinceId } = req.params;
  db.query('SELECT id, name_in_thai FROM districts WHERE province_id = ?', [provinceId], (err, results) => {
    if (err) {
      console.error('❌ Get districts error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    console.log(results)
    res.json(results);
  });
});

app.get('/api/subdistricts/:districtId', (req, res) => {
  const { districtId } = req.params;
  db.query('SELECT id, name_in_thai FROM subdistricts WHERE district_id = ?', [districtId], (err, results) => {
    if (err) {
      console.error('❌ Get subdistricts error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    console.log(results)
    res.json(results);
  });
});
//////////////////////////////// Bug dagg
// app.get('/api/messages/:userId/:adminId', (req, res) => {
//   const { userId, adminId } = req.params;

//   const sql = `
//     SELECT m.*, u.name AS sender_name 
//     FROM messages m
//     JOIN users u ON m.from_user = u.id
//     WHERE (m.from_user = ? AND m.to_user = ?)
//        OR (m.from_user = ? AND m.to_user = ?)
//     ORDER BY m.timestamp ASC
//   `;

//   db.query(sql, [userId, adminId, adminId, userId], (err, result) => {
//     if (err) return res.status(500).json({ error: err });
//     res.json(result);
//   });
// });


// app.post('/api/messages', (req, res) => {
//   const { from_user, to_user, message } = req.body;

//   const sql = "INSERT INTO messages (from_user, to_user, message) VALUES (?, ?, ?)";
//   db.query(sql, [from_user, to_user, message], (err, result) => {
//     if (err) return res.status(500).json({ error: err });

//     io.emit("newMessage", {
//       id: result.insertId,
//       from_user,
//       to_user,
//       message,
//       timestamp: new Date()
//     });

//     res.json({ success: true });
//   });
// });

// app.get("/api/chat-users/:adminId", (req, res) => {
//   const { adminId } = req.params;

//   const sql = `
//     SELECT DISTINCT u.id, u.name
//     FROM messages m
//     JOIN users u ON (u.id = m.from_user OR u.id = m.to_user)
//     WHERE (m.from_user = ? OR m.to_user = ?)
//       AND u.id != ?
//   `;

//   db.query(sql, [adminId, adminId, adminId], (err, results) => {
//     if (err) {
//       console.error("โหลดรายชื่อผู้ใช้ล้มเหลว:", err);
//       return res.status(500).json({ error: err });
//     }
//     res.json(results);
//   });
// });

app.get("/api/user/:userId", (req, res) => {
  const userId = req.params.userId;
  db.query("SELECT username FROM users WHERE id = ?", [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "User not found" });

    res.json({ username: results[0].username });
  });
});

const allowedAdmins = ['autosorat@gmail.com',];

app.post('/api/login-google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ message: 'Missing idToken' });

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email || !payload.sub) {
      return res.status(400).json({ message: 'Invalid token payload' });
    }

    const email = payload.email;
    const name = payload.name || '';
    const googleId = payload.sub;

    db.query('SELECT * FROM users WHERE username = ?', [email], (err, results) => {
      if (err) return res.status(500).json({ message: 'DB error', error: err });

      if (results.length === 0) {
        const sqlInsert = 'INSERT INTO users (username, name) VALUES (?, ?)';
        db.query(sqlInsert, [email, name], (err2, result) => {
          if (err2) return res.status(500).json({ message: 'Insert user failed', error: err2 });

          const token = jwt.sign({ id: result.insertId, username: email, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
          res.json({ message: 'Login success (new user)', token, user: { id: result.insertId, username: email, name } });
        });
      } else {
        const user = results[0];
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login success', token, user });
      }
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ message: 'Invalid Google ID token' });
  }
});

// เข้างาน
app.post("/api/attendance/checkin", (req, res) => {
  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ error: "กรุณาส่ง user_id" });
  }
  db.query(
    `SELECT id FROM attendance WHERE user_id = ? AND DATE(check_in_time) = CURDATE()`,
    [user_id],
    (err, existingRows) => {
      if (err) {
        console.error("Database Error on SELECT:", err);
        return res.status(500).json({ error: "เกิดข้อผิดพลาดในระบบ" });
      }

      if (existingRows.length > 0) {
        return res.status(409).json({ error: "คุณได้บันทึกเวลาเข้างานสำหรับวันนี้ไปแล้ว" });
      }
      
      db.query(
        "INSERT INTO attendance (user_id, check_in_time) VALUES (?, NOW())",
        [user_id],
        (err2, result) => {
          if (err2) {
            if (err2.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(404).json({ error: "ไม่พบผู้ใช้นี้ในระบบ" });
            }
            console.error("Database Error on INSERT:", err2);
            return res.status(500).json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
          }
          res.status(201).json({ message: "บันทึกเข้างานสำเร็จ" });
        }
      );
    }
  );
});


// ออกงาน
app.post("/api/attendance/checkout", (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: "กรุณาส่ง user_id" });

  db.query(
    `SELECT * FROM attendance WHERE user_id = ? AND DATE(check_in_time) = CURDATE()`,
    [user_id],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "เกิดข้อผิดพลาด" });
      }
      if (rows.length === 0) {
        return res.status(404).json({ error: "ไม่พบข้อมูลเช็คอินวันนี้" });
      }

      db.query(
        `UPDATE attendance 
         SET check_out_time = NOW() 
         WHERE user_id = ? 
         AND DATE(check_in_time) = CURDATE()
         AND check_out_time IS NULL`,
        [user_id],
        (err2, result) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json({ error: "เกิดข้อผิดพลาด" });
          }
          if (result.affectedRows === 0) {
            return res.status(400).json({ error: "ออกงานแล้วหรือไม่มีข้อมูลที่ต้องอัพเดต" });
          }
          res.json({ message: "บันทึกออกงานสำเร็จ" });
        }
      );
    }
  );
});

app.get("/api/attendance", (req, res) => {
  const sql = `
    SELECT 
      a.id, 
      a.user_id, 
      u.name, 
      u.lastname, 
      a.check_in_time, 
      a.check_out_time,
      DATE(a.check_in_time) AS date 
    FROM attendance AS a
    JOIN users AS u ON a.user_id = u.id
    ORDER BY a.check_in_time DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("❌ ERROR /api/attendance:", err);
      return res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล attendance" });
    }
    res.json(rows);
  });
});


app.post("/api/leave", upload.array("images", 5), (req, res) => {
  const { user_id, leave_type, start_date, end_date, reason } = req.body;

  console.log("📥 Received leave request body:", req.body);
  console.log("📥 Received files:", req.files);

  if (!user_id || !leave_type || !start_date || !end_date || !reason) {
    console.log("❌ Missing required fields");
    return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });
  }

  db.query("SELECT name FROM users WHERE id = ?", [user_id], (err, userRows) => {
    if (err) {
      console.error("❌ Error fetching user:", err);
      return res.status(500).json({ error: "เกิดข้อผิดพลาด" });
    }
    if (!userRows || userRows.length === 0) {
      console.log("❌ User not found:", user_id);
      return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    }

    const { name: first_name } = userRows[0];
    console.log("👤 Found user:", first_name);

    const imagePaths = req.files ? req.files.map(file => `/uploads/leave/${file.filename}`) : [];
    console.log("🖼 Uploaded image paths:", imagePaths);

    db.query(
      `INSERT INTO leave_requests 
        (user_id, name, leave_type, start_date, end_date, reason, images)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, first_name, leave_type, start_date, end_date, reason, JSON.stringify(imagePaths)],
      (err2) => {
        if (err2) {
          console.error("❌ Error inserting leave request:", err2);
          return res.status(500).json({ error: "เกิดข้อผิดพลาด" });
        }

        console.log("✅ Leave request saved successfully for user:", first_name);
        res.json({
          message: "บันทึกคำขอลาสำเร็จ",
          name: first_name,
          images: imagePaths,
        });
      }
    );
  });
});

app.get("/api/leave", (req, res) => {
  db.query("SELECT * FROM leave_requests ORDER BY start_date DESC", (err, rows) => {
    if (err) {
      console.error("❌ ERROR leave:", err);
      return res.status(500).json({ error: "เกิดข้อผิดพลาด" });
    }
    res.json(rows);
  });
});

// app.put("/api/leave/:id/status", (req, res) => {
//   const { id } = req.params;
//   const { status } = req.body;

//   if (!["pending", "approved", "rejected"].includes(status)) {
//     return res.status(400).json({ error: "Invalid status" });
//   }

//   db.query("UPDATE leave_requests SET status = ? WHERE id = ?", [status, id], (err) => {
//     if (err) return res.status(500).json({ error: err.message });

//     db.query("SELECT * FROM leave_requests WHERE id = ?", [id], (err, results) => {
//       if (err) return res.status(500).json({ error: err.message });
//       if (results.length === 0) return res.status(404).json({ error: "Request not found" });

//       const request = results[0];

//       io.emit("newNotification", {
//         id: Date.now(),
//         title: `คำขอในการลาล่วงหน้า ${status === "approved" ? "อนุมัติ" : "ปฏิเสธ"}`,
//         message: `${request.name} ${request.lastname} ถูก ${status === "approved" ? "อนุมัติ" : "ปฏิเสธ"}`,

//         time: "ตอนนี้",
//       });
//       res.json(request);
//     });
//   });
// });
app.put("/api/leave/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  db.query("UPDATE leave_requests SET status = ? WHERE id = ?", [status, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query("SELECT * FROM leave_requests WHERE id = ?", [id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(404).json({ error: "Request not found" });

      const request = results[0];

      io.emit("newNotification", {
        id: Date.now(),
        title: `คำขอลา ${status === "approved" ? "อนุมัติ" : "ปฏิเสธ"}`,
        message: `${request.name} ${request.lastname} ถูก ${status === "approved" ? "อนุมัติ" : "ปฏิเสธ"}`,
        time: "ตอนนี้",
      });

      res.json(request);
    });
  });
});

app.get("/api/total-trucks", (req, res) => {
  const sql = "SELECT COUNT(*) AS totalTrucks FROM t_truck";
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ totalTrucks: result[0].totalTrucks });
  });
});

app.get("/api/available-trucks", (req, res) => {
  const sql =
    "SELECT COUNT(*) AS availableTrucks FROM t_truck WHERE t_status = 'พร้อมใช้งาน'";
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ availableTrucks: result[0].availableTrucks });
  });
});


app.get("/api/trucks/maintenance", (req, res) => {
  const sql =
    "SELECT COUNT(*) AS maintenance FROM t_truck WHERE t_status = 'ซ่อมบำรุง'";

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ maintenance: result[0].maintenance });
  });
});

app.get("/api/trucks/accident", (req, res) => {
  const sql =
    "SELECT COUNT(*) AS accident FROM t_truck WHERE t_status = 'อุบัติเหตุ'";

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ accident: result[0].accident });
  });
});

app.get("/api/trucks/park", (req, res) => {
  const sql =
    "SELECT COUNT(*) AS park FROM t_truck WHERE t_status = 'รถจอด'";

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ park: result[0].park });
  });
});

app.get("/api/total-jobs", (req, res) => {
  const sql = "SELECT COUNT(*) AS totalJobs FROM order_shipment";

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ totalJobs: result[0].totalJobs });
  });
});

app.get("/api/jobs/summary", (req, res) => {
  const sql = `
    SELECT
      COUNT(*) AS totalJobs, 
      COUNT(CASE WHEN OrSt IN ('0', '1') THEN 1 END) AS activeJobs, 
      COUNT(CASE WHEN OrSt = '3' THEN 1 END) AS completedJobs, 
      COUNT(CASE WHEN OrSt = '2' THEN 1 END) AS cancelledJobs 
    FROM order_shipment;
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database error on jobs summary:", err);
      return res.status(500).json({ error: "Database error" });
    }
    // ส่งผลลัพธ์ทั้งหมดกลับไปใน object เดียว
    res.json(results[0]);
  });
});


///////////////////
const storage2 = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, "uploads", "temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
const upload2 = multer({ storage: storage2, 
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) return cb(new Error('ไม่อนุญาตให้อัปโหลดไฟล์ประเภทนี้ประเภทไฟล์ไม่ถูกต้อง — อนุญาตเฉพาะ JPG หรือ PNG เท่านั้น'));
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 } //จำกัดขนาดไฟล์ 5MB
}).fields([
  { name: 'img_id_upload', maxCount: 1 },
  { name: 'img_lc_upload', maxCount: 1 },
  { name: 'img_home_upload', maxCount: 1 },
  { name: 'img_acc_upload', maxCount: 1 },
  { name: 'D_Passport_upload', maxCount: 1 },
  { name: 'T_PicCover1_upload', maxCount: 1 },
  { name: 'T_PicCover2_upload', maxCount: 1 },
  { name: 'T_PicCover3_upload', maxCount: 1 },
  { name: 'files', maxCount: 10 },
]);

// read driver
app.get('/api/driver/read', authenticateToken, (req, res) => {
  const search = req.query.search ? req.query.search.trim() : "";
  let sql = "SELECT * FROM d_driver";
  let params = [];
  
  if (req.user.role == 'user') {
    const driverid = req.user.U_ID
    sql += " WHERE D_ID LIKE ?"
    params = [driverid]
  }

  if (search !== "") {
    sql += " WHERE D_ID LIKE ? OR D_Name LIKE ? OR D_SurName LIKE ? OR D_Tel LIKE ?";
    const keyword = `%${search}%`;
    params = [keyword, keyword, keyword, keyword];
  }

  sql += " ORDER BY D_ID";

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูล คนขับ", err);
      return res
        .status(500)
        .json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล คนขับ" });
    }
    const updatedResult = result.map(item => ({
      ...item,
      img_id: item.img_id ? addPrefix(item.img_id) : null,
      img_lc: item.img_lc ? addPrefix(item.img_lc) : null,
      img_home: item.img_home ? addPrefix(item.img_home) : null,
      img_acc: item.img_acc ? addPrefix(item.img_acc) : null,
      D_Passport: item.D_Passport ? addPrefix(item.D_Passport) : null,
    }));

    res.json(updatedResult);
  });
});

// create driver
app.post('/api/driver/create', authenticateToken, authorizeAdmin, upload2, (req, res) => {
  db.query('SELECT * FROM d_driver WHERE D_Tel = ?', [req.body.D_Tel], (err, results) => {
    console.log('check tel')
    if (err) return res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: err });
    if (results.length > 0) return res.status(400).json({ message: 'เบอร์โทรศัพท์นี้ ถูกใช้แล้ว' });
    
    db.query('SELECT MAX(D_ID) AS lastId FROM d_driver', (err, rows) => {
    if (err) throw err;
      console.log('create D_ID')
      const newId = (rows[0].lastId || 0) + 1; 
      const driver = { D_ID: newId, ...req.body };

      const fields = Object.keys(driver); 
      const values = Object.values(driver); 

      const placeholders = fields.map(() => '?').join(', ');

      const sql = `INSERT INTO d_driver (${fields.join(', ')}) VALUES (${placeholders})`;

      db.query(sql, values, (err, result) => {
        if (err) {
          console.error('❌ Create driver error:', err);
          return res.status(500).json({ message: 'ไม่สามารถสร้างผู้ขับขี่ได้', error: err });
        }
        io.emit('new_driver', { driver }); 
        res.status(201).json({ message: 'สร้างผู้ขับขี่สำเร็จ', driverId: result.insertId });
      });
  });
  });
});


// update driver
app.put('/api/driver/update', authenticateToken, upload2, async (req, res) => {
  const driverId = req.user.role === 'user' ? req.user.U_ID : req.query.id;
  if (!driverId) return res.status(400).json({ message: 'Missing driver ID in URL' });
  
  const driver = req.body;
  const imageFields = ['img_id','img_lc','img_home','img_acc','D_Passport'];

  try {
    for (const field of imageFields) {
      driver[field] = stripPrefix(driver[field]);
      // const uploadFile  = req.files?.find(f => f.fieldname === `${field}_upload`);
      const uploadFile  = req.files?.[`${field}_upload`] || [];
      const removedPath = driver[`${field}_removed`];
      // console.log(uploadFile)
      
      if (uploadFile) {
        try{
          let newFilePaths = [];
          try {
            newFilePaths = moveAndRenameFiles(uploadFile, {
                userId: driverId,
                upfolder: 'driver',
              });
            // console.log('newFilePaths :',newFilePaths)
          } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message || "Upload failed" });
          }

          if (newFilePaths.length > 0) driver[field] = newFilePaths[0].url; 
          if (removedPath) deleteFile(removedPath);
          delete driver[`${field}_upload`];
          delete driver[`${field}_removed`];
          
        } catch (err) {
          console.error(`❌ Upload failed for ${field}:`, err);
          return res.status(500).json({ message: `Upload failed for ${field}`, error: err.toString() });
        }
      } else if (removedPath) {
        deleteFile(removedPath);
        delete driver[`${field}_removed`];
      }
    }
  
    const fields = Object.keys(driver);
    const values = Object.values(driver);
    if (fields.length === 0) return res.status(400).json({ message: 'ไม่มีข้อมูลที่จะแก้ไข' });
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const sql = `UPDATE d_driver SET ${setClause} WHERE D_ID = ?`;
    db.query(sql, [...values, driverId], (err, result) => {
      if (err) {
        console.error('❌ Update driver error:', err);
        return res.status(500).json({ message: 'ไม่สามารถแก้ไขผู้ขับขี่ได้', error: err });
      }
      io.emit('update_driver', { driverId, driver });
      res.json({ message: 'แก้ไขผู้ขับขี่สำเร็จ' });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed', error: err.toString() });
  }
});

// Delete
app.delete('/api/driver/delete', authenticateToken, authorizeAdmin, (req, res) => {
  const Id = req.query.id;

  const sql = 'DELETE FROM d_driver WHERE D_ID = ?';

  db.query(sql, [Id], (err, result) => {
    if (err) {
      console.error('❌ Delete error:', err);
      return res.status(500).send('Delete failed');
    }
    console.log('✅ Driver deleted successfully')
    res.send('✅ Driver deleted successfully');
  });
});

// read truck
app.get('/api/truck/read', authenticateToken, (req, res) => {
  const search = req.query.search ? req.query.search.trim() : "";
  let sql = "SELECT * FROM t_truck";
  let params = [];

  // ✅ ถ้ามีคำค้นหา ให้เพิ่มเงื่อนไข WHERE
  if (search !== "") {
    sql += " WHERE T_ID LIKE ? OR T_No LIKE ? OR T_Lc LIKE ?";
    const keyword = `%${search}%`;
    params = [keyword, keyword, keyword];
  }
  sql += " ORDER BY T_ID";

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูล รถบรรทุก", err);
      return res
        .status(500)
        .json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล รถบรรทุก" });
    }

    const updatedResult = result.map(item => ({
      ...item,
      T_PicCover1: item.T_PicCover1 ? addPrefix(item.T_PicCover1) : null,
      T_PicCover2: item.T_PicCover2 ? addPrefix(item.T_PicCover2) : null,
      T_PicCover3: item.T_PicCover3 ? addPrefix(item.T_PicCover3) : null,
    }));

    res.json(updatedResult);
  });
});

// create truck
app.post('/api/truck/create', authenticateToken, authorizeAdmin, upload2, (req, res) => {
  db.query('SELECT MAX(T_ID) AS lastId FROM t_truck', (err, rows) => {
    if (err) {
      console.error('❌ Select max ID error:', err);
      return res.status(500).json({ message: 'ไม่สามารถดึง ID ล่าสุดได้', error: err });
    }
    const newId = (rows[0].lastId || 0) + 1;
    const truck = { T_ID: newId, ...req.body };

    const fields = Object.keys(truck); // ดึงชื่อคอลัมน์จาก body
    const values = Object.values(truck); // ดึงค่า

    const placeholders = fields.map(() => '?').join(', ');

    const sql = `INSERT INTO t_truck (${fields.join(', ')}) VALUES (${placeholders})`;

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('❌ Create truck error:', err);
        return res.status(500).json({ message: 'ไม่สามารถสร้างผู้ขับขี่ได้', error: err });
      }
      io.emit('new_truck', { truck }); 
      res.status(201).json({ message: 'สร้างรถสำเร็จ', truckId: result.insertId });
    });
  });
});

// update truck
app.put('/api/truck/update', authenticateToken, upload2, (req, res) => {
  const truckId = req.user.role === 'user' ? req.user.U_ID : req.query.id;
  if (!truckId) return res.status(400).json({ message: 'Missing truck ID in URL' });
  
  const truck = req.body;
  const imageFields = ['T_PicCover1','T_PicCover2','T_PicCover3'];

  try {
    for (const field of imageFields) {
      truck[field] = stripPrefix(truck[field]);
      const uploadFile  = req.files?.[`${field}_upload`] || [];
      const removedPath = truck[`${field}_removed`];
      
      if (uploadFile) {
        try{
          let newFilePaths = [];
          try {
            newFilePaths = moveAndRenameFiles(uploadFile, {userId: truckId, upfolder: 'truck',});
          } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message || "Upload failed" });
          }
          if (newFilePaths.length > 0) truck[field] = newFilePaths[0].url; 
          if (removedPath) deleteFile(removedPath);
          delete truck[`${field}_upload`];
          delete truck[`${field}_removed`];
        } catch (err) {
          console.error(`❌ Upload failed for ${field}:`, err);
          return res.status(500).json({ message: `Upload failed for ${field}`, error: err.toString() });
        }
      } else if (removedPath) {
        deleteFile(removedPath);
        delete truck[`${field}_removed`];
      }
    }

    const fields = Object.keys(truck);
    const values = Object.values(truck);
    if (fields.length === 0) return res.status(400).json({ message: 'ไม่มีข้อมูลที่จะแก้ไข' });
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const sql = `UPDATE t_truck SET ${setClause} WHERE T_ID = ? `;

    db.query(sql, [...values, truckId], (err, result) => {
      if (err) {
        console.error('❌ Update truck error:', err);
        return res.status(500).json({ message: 'ไม่สามารถแก้ไขข้อมูลรถได้', error: err });
      }
      io.emit('update_truck', { truckId, truck });
      res.json({ message: 'แก้ไขผู้ขับขี่สำเร็จ' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed', error: err.toString() });
  }
});

// Delete 
app.delete('/api/truck/delete', authenticateToken, authorizeAdmin, (req, res) => {
  const Id = req.query.id;

  const sql = 'DELETE FROM t_truck WHERE T_ID = ?';

  db.query(sql, [Id], (err, result) => {
    if (err) {
      console.error('❌ Delete error:', err);
      return res.status(500).send('Delete failed');
    }
    console.log('✅ Driver deleted successfully')
    res.send('✅ Driver deleted successfully');
  });
});

const upload3 = multer({ storage: storage2 }).array('files', 10);
app.post("/api/upload", authenticateToken, async (req, res) => {
  upload3 (req, res, async function (err) {
    if (err instanceof multer.MulterError) { // file size เกิน
      return res.status(400).json({ error: err.message });
    } else if (err) { // ประเภทไฟล์ไม่ถูกต้อง
      return res.status(400).json({ error: err.message });
    }
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: "ไม่พบไฟล์ที่อัปโหลด" });
    // console.log('files :',req.files)
    // console.log('query :',req.query)

    try {
      const newFilePaths = moveAndRenameFiles(req.files, {
            userId: req.user.U_ID,
            upfolder: req.query.Up_type,
            subfolder: req.query.subfolder
          });
      // console.log('newFilePaths :',newFilePaths)
      res.json({ files: newFilePaths });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message || "Upload failed" });
    }
    // try {
    //   const Up_type = req.query.Up_type;
    //   const subfolder = req.query.subfolder || ""; 
    //   let userId = '';

    //   if (req.user?.role === "user") {
    //     userId = req.user.U_ID;
    //   } else {
    //     userId = req.body.userId;
    //   }
    //   if (!/^[a-zA-Z0-9_-]+$/.test(userId)) return res.status(400).json({ error: "userId ไม่ถูกต้อง" }); //ป้องกัน sql injec

    //   const allowedTypes = ['driver', 'truck', 'leave', 'service'];
    //   const allowedSubTypes = ['',];
    //   if (!allowedTypes.includes(Up_type)) return res.status(400).json({ error: "Up_type ชื่อโฟลเดอร์อัพโหลด ไม่ถูกต้อง" });
    //   if (!allowedSubTypes.includes(subfolder)) return res.status(400).json({ error: "subfolder ชื่อโฟลเดอร์อัพโหลดย่อย ไม่ถูกต้อง" });
    //   if (userId === undefined ) return res.status(400).json({ error: "No file uploaded" });

    //   // กัน path traversal
    //   const safeType = Up_type.replace(/\.\./g, "");
    //   const safeSub = subfolder ? subfolder.replace(/\.\./g, "") : "";

    //   const baseDir = path.join(__dirname, "uploads", safeType, userId, safeSub);
    //   const rootUpload = path.join(__dirname, "uploads");
    //   if (!baseDir.startsWith(rootUpload)) return res.status(400).json({ error: "path อัพโหลดไม่ถูกต้อง" });
    //   // const userDir = path.join(__dirname, "uploads", Up_type, userId);
    //   if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

    //   const uploadedFiles = []
    //   for (const file of req.files) {
    //     const newName = `${userId}-${file.filename}`
    //     const outputPath = path.join(baseDir, newName)
    //     try {
    //       fs.renameSync(file.path, outputPath);
    //     } catch (err) {
    //       console.error("❌ Move file failed:", err);
    //       continue; // ข้ามไฟล์นี้ไปแทนที่จะ crash
    //     }
    //     // const fileUrl = `/${Up_type}/${userId}/D_${userId}-${file.filename}`;
    //     const fileUrl = `uploads/${safeType}/${userId}/${safeSub ? safeSub + "/" : ""}${newName}`
    //     uploadedFiles.push({ url: fileUrl, img_id: "resized-" + file.filename })
    //   }
    //   res.json({ files: uploadedFiles })

    // } catch (error) {
    //   console.error(error);
    //   res.status(500).json({ error: " upload failed"});
    // }
  });
});


const moveAndRenameFiles = (files, options) => {
  const { userId, upfolder, fileName = '', subfolder = '' } = options;
  const uploadedFiles = []
  const userIdStr = String(userId);
  try {
    if (!files || files.length === 0) return [];
    if (!userIdStr) throw new Error("No userId provided");
    if (!/^[a-zA-Z0-9_-]+$/.test(userIdStr)) throw new Error("userId ไม่ถูกต้อง");

    const allowedTypes = ['driver', 'truck', 'leave', 'service'];
    const allowedSubTypes = ['', 'sub1', 'sub2'];
    if (!allowedTypes.includes(upfolder)) throw new Error("Up_type ไม่ถูกต้อง");
    if (!allowedSubTypes.includes(subfolder)) throw new Error("subfolder ไม่ถูกต้อง");

      // กัน path traversal
      const safeType = upfolder.replace(/\.\./g, "");
      const safeSub = subfolder ? subfolder.replace(/\.\./g, "") : "";

      const baseDir = path.join(__dirname, "uploads", safeType, userIdStr, safeSub);
      const rootUpload = path.join(__dirname, "uploads");
      if (!baseDir.startsWith(rootUpload)) throw new Error("path อัพโหลดไม่ถูกต้อง");
      // const userDir = path.join(__dirname, "uploads", upfolder, userId);
      if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

      for (const file of files) {
        const newName = `${userIdStr}-${file.filename}`
        const outputPath = path.join(baseDir, newName)
        try {
          fs.renameSync(file.path, outputPath);
        } catch (err) {
          console.error("❌ Move file failed:", err);
          continue; 
        }
        const fileUrl = `uploads/${safeType}/${userIdStr}/${safeSub ? safeSub + "/" : ""}${newName}`
        uploadedFiles.push({ url: fileUrl, img_id: "resized-" + file.filename })
      }
  } catch (error) {
      console.error(error);
  }
  return uploadedFiles;
}

app.get("/api/bookings", (req, res) => {
  const sql = "SELECT * FROM order_shipment ORDER BY DateDesc DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching bookings:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    const bookings = results.map(b => ({
      id: b.Orderid,
      LC_H:b.LC_H,
      S_Code:b.S_Code,
      name: b.OwnerName,
      car: b.CarType,
      driver: b.DriverName,
      productType: b.CusName,
      weight: b.Weight,
      date: b.DateDesc ? b.DateDesc.toISOString().split("T")[0] : "-",
      time: b.DateDesc ? b.DateDesc.toISOString().split("T")[1].split(".")[0] : "-",
      origin: b.PickPoint,
      destination: b.DropPoint,
      status: b.OrStDesc,
      statusID: b.OrSt,
    }));

    res.json(bookings);
  });
});

app.get('/api/jobs/driver2/:userID', (req, res) => {
  const driverId = req.params.userID;
  const status = req.query.status;

  const allowedTypes = ['0', '1', '2', '3'];
  // if (!allowedTypes.includes(status)) {
  //   return res.status(400).json({ error: "Invalid status" });
  // }

  const sql = `
    SELECT 
      s.OrderID,
      s.OrderNo,
      s.OrSt,
      s.OrDate,
      s.CustomerName,
      t.T_Driver_ID,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'RootID', r.RootID,
          'RootName', r.RootName,
          'RootType', r.RootType,
          'Address', r.Address,
          'Lat', r.Lat,
          'Lng', r.Lng
        )
      ) AS roots
    FROM order_shipment s
    JOIN t_truck t ON s.LC_H = t.T_LC
    LEFT JOIN order_root r ON s.OrderID = r.OrderID
    WHERE t.T_Driver_ID = ? AND s.OrSt = ?
    GROUP BY s.OrderID
    ORDER BY s.OrderDate DESC
  `;

  db.query(sql, [driverId, status], (err, results) => {
    if (err) {
      console.error("SQL Error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

app.get('/api/jobs/driver/:userID', (req, res) => {
  const driverId = req.params.userID;
  // console.log("Driver ID:", driverId);

  const status = req.query.status;

  const allowedTypes = ['0', '1', '2', '3'];
  if (!allowedTypes.includes(status)) return res.status(400).json({ error: "type upload error" });

  const sql = `
    SELECT *
    FROM order_shipment s
    JOIN t_truck t ON s.LC_H = t.T_LC
    WHERE t.T_Driver_ID = ? AND s.OrSt = '${status}'
  `;
  db.query(sql, [driverId], (err, results) => {
    if (err) {
      console.log("SQL Error:", err);
      return res.status(500).json({ error: err });
    }
    // console.log("Results:", results);
    res.json(results);
  });
});

const mapStatus = (status) => {
  switch ((status || "").toLowerCase()) {
    case "accepted":    return { OrSt: "1", OrStDesc: "รับงาน" };
    case "in_progress": return { OrSt: "1", OrStDesc: "กำลังขนส่ง" };
    case "cancelled":   return { OrSt: "2", OrStDesc: "งานที่ปฏิเสธ" };
    case "rejected":    return { OrSt: "2", OrStDesc: "งานที่ปฏิเสธ" };
    case "completed":   return { OrSt: "3", OrStDesc: "งานที่เสร็จสิ้น" };
    case "waiting":
    default:            return { OrSt: "0", OrStDesc: "รอรับงาน" };
  }
};

app.put("/api/order_shipment/skey/:sKey/status", (req, res) => {

  try {
    const { sKey } = req.params;
    const { status = "in_progress", driverId, driverName } = req.body;

    const statusResult = mapStatus(status);

    if (!statusResult) {
      return res.status(400).json({ error: `Invalid status value: ${status}` });
    }
    
    const { OrSt, OrStDesc } = statusResult;

    db.query("SELECT LC_H, LC_L FROM order_shipment WHERE S_Key = ? LIMIT 1", [sKey], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(404).json({ error: "ไม่พบงาน" });

      const { LC_H, LC_L } = rows[0];
      const nextLC_L = (LC_L === "รอรับงาน" || LC_L == null) ? LC_H : LC_L;

      const sql = `
        UPDATE order_shipment
        SET OrSt = ?, OrStDesc = ?, DriverID = COALESCE(?, DriverID), DriverName = COALESCE(?, DriverName), LC_L = ?
        WHERE S_Key = ?
      `;

      db.query(sql, [OrSt, OrStDesc, driverId || null, driverName || null, nextLC_L, sKey], (err2, result) => {
        if (err2) return res.status(500).json({ error: err2.message });
        
        if (io) {
            io.emit("jobAccepted", { sKey, driverId, OrSt, OrStDesc });
        }
        
        res.json({ success: true, affected: result.affectedRows, sKey, OrSt, OrStDesc });
      });
    });
  } catch (error) {
    console.error("CRITICAL ERROR in PUT /status:", error); 
    res.status(500).json({
      error: "An unexpected error occurred on the server.",
      details: error.message 
    });
  }
});

app.post("/api/shipment/reject/:sKey",(req, res, next) => 
  uploadReject.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ error: "อัปโหลดรูปไม่สำเร็จ", detail: err.message });
    next();
  }),
  (req, res) => {
    const sKey = String(req.params.sKey || "").trim();
    const { reason } = req.body;

    console.log("➡ content-type:", req.headers["content-type"]);
    console.log("➡ body.reason:", reason);
    console.log("➡ file:", req.file);

    const fileUrl = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/reject/${req.file.filename}`
      : null;

    const { OrSt, OrStDesc } = mapStatus("rejected");

    db.query("SELECT S_Key FROM order_shipment WHERE S_Key = ? LIMIT 1", [sKey], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows.length) return res.status(404).json({ error: "ไม่พบงาน" });

      const sql = `
        UPDATE order_shipment
        SET OrSt = ?, OrStDesc = ?, reject_reason = ?, reject_image = ?
        WHERE S_Key = ?
      `;
      db.query(sql, [OrSt, OrStDesc, reason || null, fileUrl, sKey], (err2, result) => {
        if (err2) return res.status(500).json({ error: err2.message });
        io.emit("jobRejected", { sKey, reason, image: fileUrl });
        res.json({ success: true, affected: result.affectedRows, image: fileUrl });
      });
    });
  }
);

app.get("/api/order_shipment/history", (req, res) => {
  const sql = `
    SELECT 
      Orderid,
      PickPoint,
      DropPoint,
      OrStDesc,
      DateDesc
    FROM order_shipment
    ORDER BY DateDesc DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("❌ Query error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.get("/api/shipment", (req, res) => {
  const sql = `
    SELECT 
      *
    FROM order_shipment 
    WHERE OrSt = '1'
    ORDER BY DateDesc DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error fetching in-transit shipments:", err);
      return res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
    }
    res.json(results);
  });
});

app.get("/api/shipmentQ", (req, res) => {
  const id = req.query.id || '';
  const lc_h = req.query.lc_h || '';
  if (!id && !lc_h) {
    return res.status(400).json({ error: "Missing id and lc_h parameter" });
  }
  // console.log("Fetching shipment for ID:", id);
  // console.log("LC_H parameter:", lc_h);
  const sql = `
    SELECT *
    FROM order_shipment 
    WHERE Orderid = '${id}' AND LC_H = '${lc_h}'
    ORDER BY DateDesc DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error fetching in-transit shipments:", err);
      return res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
    }

    if (results.length === 0) return res.json({});

    let data = results[0];

    // -------------------------
    // ต่อ prefix ให้กับฟิลด์รูป
    // -------------------------
    data.PickupSignature = addPrefix(data.PickupSignature);
    data.DeliveryRecipientSignature = addPrefix(data.DeliveryRecipientSignature);

    data.PickupProductImages = addPrefix(data.PickupProductImages);
    data.PickupWorkOrderImages = addPrefix(data.PickupWorkOrderImages);

    data.DeliveryUnloadingImages = addPrefix(data.DeliveryUnloadingImages);
    data.DeliveryReceiptImages = addPrefix(data.DeliveryReceiptImages);


    res.json(data);
  });
});




app.get("/api/service", (req, res) => {
    const sql = `SELECT s.*, u.name FROM service s JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to load service data" });
        res.json(results);
    });
});

app.put("/api/service-request/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!["pending", "approved", "rejected"].includes(status)) return res.status(400).json({ error: "Invalid status" });
    db.query("UPDATE service SET status = ? WHERE id = ?", [status, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        db.query("SELECT * FROM service WHERE id = ?", [id], (err2, rows) => {
            if (err2) return res.status(500).json({ error: err2.message });
            if (rows.length === 0) return res.status(404).json({ error: "Request not found" });
            res.json(rows[0]);
        });
    });
});

 app.get("/api/leave-requests", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  let query = "SELECT * FROM leave_requests WHERE user_id = ?";
  const params = [userId];

  if (status && status !== "all") {
    query += " AND status = ?";
    params.push(status);
  }

  db.query(query, params, (err, requests) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
    const formattedRequests = requests.map((item) => {
      item.images = addPrefix(item.images);
      return item;
    });

    // นับจำนวนแต่ละ status
    db.query(
      "SELECT status, COUNT(*) as count FROM leave_requests WHERE user_id = ? GROUP BY status",
      [userId],
      (err2, counts) => {
        if (err2) {
          console.error(err2);
          return res.status(500).json({ error: "Server error" });
        }

        const countMap = { pending: 0, approved: 0, rejected: 0 };
        counts.forEach((row) => {
          countMap[row.status] = row.count;
        });

        res.json({ requests: formattedRequests, counts: countMap });
      }
    );
  });
});

 app.get("/api/sum-leave-requests", authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.query(
    `SELECT COUNT(*) AS total FROM leave_requests WHERE user_id = ? AND status = 'pending'`,
    [userId],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      // ส่งกลับเป็นตัวเลขล้วน เช่น 5
      res.json(result[0]?.total || 0);
    }
  );
});

//group

app.post('/api/register-fcm-token', (req, res) => {
    const { token, userId } = req.body;
    if (!token || !userId) return res.status(400).json({ error: "Token and userId are required" });

    db.query('UPDATE users SET fcm_token = ? WHERE id = ?', [token, userId], (err) => {
        if (err) {
            console.error("Failed to save FCM token:", err);
            return res.status(500).json({ error: "Failed to save token" });
        }
        console.log(`✅ FCM Token for user ${userId} has been updated.`);
        res.json({ success: true });
    });
});

app.get('/api/messages/group/general', async (req, res) => {
  // *** กำหนด ID ของห้องแชทกลุ่ม (เช่น 1) ***
  const GROUP_CONVERSATION_ID = 1; 
    console.log('GROUP_CONVERSATION_ID',GROUP_CONVERSATION_ID)
  try {
    const [messages] = await dbPromise.query(
      `SELECT 
         m.id, 
         m.from_user, 
         m.message, 
         m.timestamp, 
         m.conversation_id,
         COALESCE(u.name, 'Unknown') AS senderName 
       FROM messages m
       LEFT JOIN users u ON m.from_user = u.id
       WHERE m.conversation_id = ? 
       ORDER BY m.timestamp ASC`,
      [GROUP_CONVERSATION_ID]
    );
    res.json(messages);
  } catch (error) {
    console.error("Error fetching group messages:", error);
    res.status(500).json({ error: "Database error" });
  }
});


const uploadServiceDir = path.join(__dirname, "uploads", "service");
if (!fs.existsSync(uploadServiceDir)) fs.mkdirSync(uploadServiceDir, { recursive: true });
const uploadService = multer({ storage: multer.memoryStorage() });

// app.post("/api/service2", authenticateToken, uploadService.array("images", 5), async (req, res) => {
//   try {
//     // 1. ดึงข้อมูล
//     const { repairType, reason, serviceDate } = req.body;
//     const userId = req.user.id;
//     console.log("📥 [Service] Received request body:", req.body);
//     console.log("📥 [Service] Received files:", req.files ? req.files.length : 0);
//     // 2. ตรวจสอบข้อมูล
//     if (!userId || !repairType || !reason || !serviceDate) {
//       console.log("❌ [Service] Missing required fields");
//       return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });
//     }
//     // 3. ค้นหาชื่อผู้ใช้ (ใช้ dbPromise ที่คุณมีอยู่แล้ว)
//     const [userRows] = await dbPromise.query("SELECT name FROM users WHERE id = ?", [userId]);
//     if (!userRows || userRows.length === 0) {
//       console.log("❌ [Service] User not found:", userId);
//       return res.status(404).json({ error: "ไม่พบผู้ใช้" });
//     }
//     const userName = userRows[0].name;
//     console.log("👤 [Service] Found user:", userName);
//     // --- ⭐️ [ส่วนที่เพิ่มเข้ามา: การประมวลผล Sharp] ---
//     // 4. ประมวลผลและบันทึกรูปภาพ
//     const imagePaths = [];
//     if (req.files && req.files.length > 0) {
      
//       for (const file of req.files) {
//         // file.buffer คือข้อมูลรูปภาพที่อยู่ใน RAM
//         // สร้างชื่อไฟล์ใหม่ (บังคับ .jpeg)
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         const newFilename = `SERVICE-${uniqueSuffix}.jpeg`; // <-- บังคับ .jpeg
//         // path ที่จะบันทึกไฟล์จริง
//         const outputPath = path.join(uploadServiceDir, newFilename);
//         // ใช้ sharp เพื่อ
//         // 1. resize (แนะนำ)
//         // 2. แปลงเป็น .jpeg (compress)
//         // 3. บันทึกลงดิสก์
//         await sharp(file.buffer)
//           .resize({ width: 800 }) // (แนะนำให้ resize รูปไม่ให้ใหญ่เกินไป)
//           .jpeg({ quality: 80 })  // (บังคับแปลงเป็น jpeg คุณภาพ 80%)
//           .toFile(outputPath);   // (บันทึกไฟล์)

//         // เก็บ path ใหม่สำหรับบันทึกลง DB
//         imagePaths.push(`/uploads/service/${newFilename}`);
//       }
//     }
//     console.log("🖼 [Service] Saved JPEG paths:", imagePaths);
//     // --- ⭐️ [สิ้นสุดส่วนที่เพิ่ม] ---

//     // 5. บันทึกลงฐานข้อมูล (ใช้ dbPromise)
//     const sql = `
//       INSERT INTO service (user_id, name, issue, type, service_date, images, status)
//       VALUES (?, ?, ?, ?, ?, ?, 'pending')
//     `;
//     const values = [
//       userId,
//       userName,
//       reason,
//       repairType,
//       serviceDate,
//       JSON.stringify(imagePaths) // <-- ใช้ imagePaths ที่ได้จาก Sharp
//     ];
//     // (ใช้ dbPromise.query แทน db.query callback)
//     const [result] = await dbPromise.query(sql, values);
//     const insertId = result.insertId;
//     // 6. ส่ง Socket
//     io.emit("new_service_request", {
//       id: insertId,
//       name: userName,
//       type: repairType,
//       status: 'pending'
//     });
    
//     console.log("✅ [Service] Service request saved successfully for user:", userName);
//     res.status(201).json({
//       message: "บันทึกคำแจ้งซ่อมสำเร็จ",
//       serviceId: insertId,
//       images: imagePaths,
//     });
//   } catch (error) {
//     // จัดการ Error ทั้งหมดที่เกิดขึ้น (ทั้ง DB และ Sharp)
//     console.error("❌ [Service] A critical error occurred:", error);
//     if (error.code) { // (DB error)
//        return res.status(500).json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล", sqlError: error.message });
//     }
//     return res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์", details: error.message });
//   }
// });

app.post("/api/service2", authenticateToken, uploadService.array("images", 5), async (req, res) => {
  try {
    // 1. ดึงข้อมูล
    const { repairType, reason, serviceDate } = req.body;
    const userId = req.user.id;
    console.log("📥 [Service] Received request body:", req.body);
    console.log("📥 [Service] Received files:", req.files ? req.files.length : 0);

    // 2. ตรวจสอบข้อมูล
    if (!userId || !repairType || !reason || !serviceDate) {
      console.log("❌ [Service] Missing required fields");
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });
    }

    // 3. ค้นหาชื่อผู้ใช้
    const [userRows] = await dbPromise.query("SELECT name FROM users WHERE id = ?", [userId]);
    if (!userRows || userRows.length === 0) {
      console.log("❌ [Service] User not found:", userId);
      return res.status(404).json({ error: "ไม่พบผู้ใช้" });
    }
    const userName = userRows[0].name;
    console.log("👤 [Service] Found user:", userName);

    // --- 🧾 เก็บ path ของรูปภาพตามเดิมจาก multer ---
    const imagePaths = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // multer เก็บไฟล์ไว้ในโฟลเดอร์ uploadServiceDir แล้ว
        // ให้เก็บ path ที่จะใช้แสดงใน frontend เช่น /uploads/service/ชื่อไฟล์
        imagePaths.push(`/uploads/service/${file.filename}`);
      }
    }

    console.log("🖼 [Service] Saved image paths:", imagePaths);

    // 5. บันทึกลงฐานข้อมูล
    const sql = `
      INSERT INTO service (user_id, name, issue, type, service_date, images, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `;
    const values = [
      userId,
      userName,
      reason,
      repairType,
      serviceDate,
      JSON.stringify(imagePaths),
    ];

    const [result] = await dbPromise.query(sql, values);
    const insertId = result.insertId;

    // 6. ส่ง Socket แจ้ง admin
    io.emit("new_service_request", {
      id: insertId,
      name: userName,
      type: repairType,
      status: "pending",
    });

    console.log("✅ [Service] Service request saved successfully for user:", userName);
    res.status(201).json({
      message: "บันทึกคำแจ้งซ่อมสำเร็จ",
      serviceId: insertId,
      images: imagePaths,
    });

  } catch (error) {
    console.error("❌ [Service] A critical error occurred:", error);
    if (error.code) {
      return res.status(500).json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล", sqlError: error.message });
    }
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์", details: error.message });
  }
});

app.post('/api/delivery/start-delivery', 
  uploadStartdelovery.fields([
    { name: 'productImages', maxCount: 5 },
    { name: 'workOrderImages', maxCount: 5 }
  ]), 
  (req, res) => {
    try {
      const { 
        signature, departureTime, driverId, jobId, status, signerName, mileage,
        productImageUrls, 
        workOrderImageUrls,
        StSM, 
        StSMDesc,
        pickupLatitude,
        pickupLongitude
      } = req.body;
          
      let signaturePath,productImagePathList, workOrderImagePathList;
      
      if (productImageUrls && workOrderImageUrls) {
        try {
          const productUrls = JSON.parse(productImageUrls);
          const workOrderUrls = JSON.parse(workOrderImageUrls);

          signaturePath = moveAndCleanTempFiles([signature]);
          productImagePathList = moveAndCleanTempFiles(productUrls);
          workOrderImagePathList = moveAndCleanTempFiles(workOrderUrls);

        } catch (e) {
          console.error("Error parsing image URLs from body:", e);
          return res.status(400).json({ error: "Invalid image URL data format." });
        }
      } else {
          const productImages = req.files.productImages || [];
          const workOrderImages = req.files.workOrderImages || [];
          productImagePathList = productImages.map(file => `/uploads/startdelovery/${file.filename}`); 
          workOrderImagePathList = workOrderImages.map(file => `/uploads/startdelovery/${file.filename}`);
      }
      
      const productImagesJson = JSON.stringify(productImagePathList);
      const workOrderImagesJson = JSON.stringify(workOrderImagePathList);
      // เอา prefix ออกก่อนบันทึกลง DB
      const cleanSignature = stripPrefix(signaturePath);
 

      const { OrSt, OrStDesc } = mapStatus(status || 'in_progress');

      if (!jobId || !driverId || !signerName || !mileage) {
        return res.status(400).json({ error: 'Missing required fields: JobID, DriverID, SignerName, or Mileage.' });
      }

      const sql = `
        UPDATE order_shipment 
        SET 
          PickupSignature = ?,
          PickupDepartureTime = ?,
          PickupProductImages = ?,
          PickupWorkOrderImages = ?,
          OrSt = ?, 
          OrStDesc = ?,
          PickupMileage = ?,
          PickupSignerName = ?,
          StSM = COALESCE(?, StSM), 
          StSMDesc = COALESCE(?, StSMDesc),
          PickupLat = ?,
          PickupLon = ?
        WHERE 
          D_Key = ? AND DriverID = ?
      `;

      const values = [
        cleanSignature, 
        departureTime, 
        productImagesJson,
        workOrderImagesJson,
        OrSt, 
        OrStDesc, 
        mileage, 
        signerName,
        StSM || null,
        StSMDesc || null,
        pickupLatitude || null,
        pickupLongitude || null,
        jobId, 
        driverId
      ];

      console.log("With Values:", values);

      db.query(sql, values, (err, result) => {
        if (err) {
          console.error("Database operation failed for start-delivery:", err);
          return res.status(500).json({ error: "Database operation failed.", details: err.message });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Job not found with the specified D_Key and DriverID." });
        }
        res.status(200).json({ success: true, message: "Delivery started successfully." });
      });

    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ error: 'An unexpected server error occurred.' });
    }
});

//API Loading complete delivery with multiple file uploads
app.post('/api/delivery/complete', 
  uploadstorageLoading.fields([
    { name: 'unloadingImages', maxCount: 5 }, 
    { name: 'receiptImages', maxCount: 5 },
    { name: 'recipientSignature', maxCount: 1 }
  ]), 
  (req, res) => {
    console.log("Request Body (Non-File Fields):", req.body); 
    console.log("Request Files (Uploaded Paths):", req.files); 

    const COMPLETE_STATUS = {
      OrSt: "3",
      OrStDesc: "งานที่เสร็จสิ้น"
    }

    try {
      const { 
        completionTime, 
        jobId, 
        driverId, 
        deliveryMileage,
        recipientName,
        DeliveryLat, 
        DeliveryLon,
        StSM,        
        StSMDesc     
      } = req.body;
      
      const unloadingFiles = req.files['unloadingImages'] || []; 
      const receiptFiles = req.files['receiptImages'] || [];
      const signatureFile = req.files['recipientSignature'] ? req.files['recipientSignature'][0] : null;

      const unloadingImageUrls = unloadingFiles.map(file => `/uploads/loading/${file.filename}`); 
      const receiptImageUrls = receiptFiles.map(file => `/uploads/loading/${file.filename}`);
      const recipientSignatureUrl = signatureFile ? `/uploads/loading/${signatureFile.filename}` : null;

      const unloadingImagesJson = JSON.stringify(unloadingImageUrls);
      const receiptImagesJson = JSON.stringify(receiptImageUrls);
      
      
      if (!jobId || !driverId || !completionTime || !recipientSignatureUrl || !deliveryMileage || !recipientName) {
        console.error("400 Error: Missing required non-file or file URL data.");
        return res.status(400).json({ error: 'Missing required data: Job info, completion time, Signature URL (upload failed?), mileage, or recipient name.' });
      }

      if (!DeliveryLat || !DeliveryLon) {
          console.error("400 Error: Missing DeliveryLat or DeliveryLon.");
          return res.status(400).json({ error: 'Missing required data: DeliveryLat or DeliveryLon.' });
      }

      const sql = `
        UPDATE order_shipment 
        SET 
          DeliveryCompletionTime = ?,
          DeliveryRecipientSignature = ?,
          DeliveryUnloadingImages = ?,
          DeliveryReceiptImages = ?,
          DeliveryMileage = ?,
          DeliveryRecipientName = ?,
          OrSt = ?, 
          OrStDesc = ?,
          StSM = COALESCE(?, StSM) , 
          StSMDesc = COALESCE(?, StSMDesc),
          DeliveryLat = ?,
          DeliveryLon = ?
        WHERE 
          D_Key = ? AND DriverID = ?
      `;

        const values = [
        completionTime, 
        recipientSignatureUrl,
        unloadingImagesJson,    
        receiptImagesJson,     
        deliveryMileage,
        recipientName,
        COMPLETE_STATUS.OrSt,
        COMPLETE_STATUS.OrStDesc,
        StSM || null, 
        StSMDesc || null, 
        DeliveryLat || null,
        DeliveryLon || null,
        jobId,
        driverId
      ];

      console.log("With Values:", values);

      db.query(sql, values, (err, result) => {
        if (err) {
          console.error("Database query failed:", err);
          return res.status(500).json({ error: "Database operation failed.", details: err.message });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Job not found with the specified D_Key and DriverID." });
        }
        res.status(200).json({ success: true, message: "Delivery completed and recorded successfully." });
      });

    } catch (error) {
      console.error("Server error on /api/delivery/complete:", error);

      res.status(500).json({ error: 'An unexpected server error occurred.' });
    }
});

const moveAndCleanTempFiles = (imageUrls = []) => {
    const finalPaths = [];

    const tempDir = path.join(__dirname, 'uploads', 'temp_images');
    const destDir = path.join(__dirname, 'uploads', 'startdelovery');

    // ✅ สร้างโฟลเดอร์ปลายทางก่อน
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    for (const url of imageUrls) {
        try {
            const filename = path.basename(url);

            const tempPath = path.join(tempDir, filename);
            const finalPath = path.join(destDir, filename);
            const relativeFinalPath = `/uploads/startdelovery/${filename}`;

            if (!fs.existsSync(tempPath)) {
                console.warn(`⚠️ Temp file not found: ${tempPath}`);
                // ❌ ไม่ push path ปลายทาง เพราะไฟล์ไม่มีจริง
                continue;
            }

            fs.renameSync(tempPath, finalPath);
            finalPaths.push(relativeFinalPath);

        } catch (error) {
            console.error(`❌ Error moving file ${url}:`, error);
            // ❌ ไม่ควร push URL เดิม เพราะ storage คนละที่
        }
    }

    return finalPaths;
};


app.post('/api/upload/temp-image', tempUpload.single('image'), (req, res) => {
    console.log("📥 Received temp image upload request.");
    
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const imageUrl = `http://localhost:5000/uploads/temp_images/${req.file.filename}`;
        
        console.log(`✅ Temp image saved. URL to return: ${imageUrl}`);

        res.status(200).json({ 
            success: true, 
            message: "Image uploaded temporarily.", 
            imageUrl: imageUrl,
        });

    } catch (error) {
        console.error("❌ Server error on /api/upload/temp-image:", error);
        res.status(500).json({ error: 'An unexpected server error occurred during upload.' });
    }
});



















function addPrefix(input, newprefix) {
  const Prefix = newprefix || prefix;
  if (!input) return typeof input === "string" ? "" : [];

  try {
    const parsed = JSON.parse(input);
    if (Array.isArray(parsed)) {
      // คืน array ของ URL
      return parsed.map(
        (img) => `${Prefix.replace(/\/$/, "")}/${img.replace(/^\//, "")}`
      );
    } else if (typeof parsed === "string") {
      // คืน string เดี่ยว
      return `${Prefix.replace(/\/$/, "")}/${parsed.replace(/^\//, "")}`;
    } else {
      return typeof input === "string" ? "" : [];
    }
  } catch (err) {
    // ถ้า parse ไม่ได้ แปลว่าเป็น path เดี่ยว
    return `${Prefix.replace(/\/$/, "")}/${input.replace(/^\//, "")}`;
  }
}

function stripPrefix(path) {
  if (!path) return null;
  const regex = new RegExp("^" + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (Array.isArray(path)) {   // ถ้า path เป็น array → map ทุก element
    return path.map(p => {
      if (typeof p !== 'string') return p; // ถ้าไม่ใช่ string คืนค่าเดิม
      let newPath = p.startsWith(prefix) ? p.replace(regex, "") : p;
      return newPath.replace(/^\/+/, "");
    });
  }
  if (typeof path === 'string') {  // ถ้า path เป็น string
    let newPath = path.startsWith(prefix) ? path.replace(regex, "") : path;
    return newPath.replace(/^\/+/, "");
  }
  return path;// ถ้าไม่ใช่ string หรือ array → คืนค่าเดิม
}

function deleteFile(filePath) {
  if (!filePath) return false;
  try {
    // const regex = new RegExp("^" + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    // const newFilePath = filePath.startsWith(prefix) ? filePath.replace(regex, "") : filePath;
    // const fullPath = path.join(__dirname, newFilePath.replace(/^\/+/, ""));
    const fullPath = path.join(__dirname, stripPrefix(filePath));
    const uploadsRoot = path.join(__dirname, "uploads");
    if (!fullPath.startsWith(uploadsRoot)) {console.warn("🚫 ห้ามลบนอก uploads:", fullPath); return false;}

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log("🗑️ ลบไฟล์แล้ว:", fullPath);
      return true;
    } else {
      console.log(`⚠️ ไม่พบไฟล์, skipping: ${filePath} // ${fullPath}`);
      return false;
    }
  } catch (err) {
    console.error(`❌ ลบไฟล์ไม่สำเร็จ:${filePath} `, err);
    return false;
  }
}

server.listen(5000, () => console.log('🚀 Server running on http://localhost:5000'));