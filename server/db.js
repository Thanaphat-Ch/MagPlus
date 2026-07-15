const mysql = require('mysql2');

const db = mysql.createConnection({
  host: '147.50.227.15',
  user: 'magnit_nick',
  password: 'driverapp#369#', 
  database: 'magnit_driver',
});

db.connect(err => {
  if (err) throw err;
  console.log('✅ MySQL (XAMPP) connected');
});

module.exports = db;
