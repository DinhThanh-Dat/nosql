const { MongoClient } = require('mongodb');

let client = null;
let db = null;

/**
 * Kết nối tới MongoDB dựa trên biến môi trường MONGODB_URI / MONGODB_DBNAME.
 * Gọi 1 lần khi khởi động server (xem server.js).
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
  const dbName = process.env.MONGODB_DBNAME || 'QLKhachHangThanThiet';

  client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  // Ping thử để chắc chắn kết nối thật sự hoạt động (không chỉ tạo được client)
  await client.db(dbName).command({ ping: 1 });
  db = client.db(dbName);
  console.log(`[MongoDB] Đã kết nối tới database "${dbName}" (${uri})`);
  return db;
}

/**
 * Lấy đối tượng Database dùng chung trong toàn bộ ứng dụng.
 * Ném lỗi rõ ràng nếu chưa kết nối được (thay vì lỗi "Cannot read property of null" khó hiểu).
 */
function getDB() {
  if (!db) {
    throw new Error('Chưa kết nối được MongoDB. Vui lòng kiểm tra MongoDB Server và file .env.');
  }
  return db;
}

function isConnected() {
  return db !== null;
}

module.exports = { connectDB, getDB, isConnected };
