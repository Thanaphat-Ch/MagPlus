require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'magnit_driver',
  ssl: process.env.IS_LOCAL ? undefined : {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
});


db.connect(err => {
  if (err) throw err;
  console.log('✅ MariaDB Docker connected');
});

module.exports = db;
