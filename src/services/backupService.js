const fs = require('fs');
const { execFile } = require('child_process');
const { EJSON } = require('bson');
const { getDB } = require('../config/db');

/**
 * Chức năng Backup/Restore và Import/Export dữ liệu.
 *
 * 2 cách tiếp cận:
 * 1) mongodump/mongorestore (MongoDB Database Tools) — sao lưu/phục hồi TOÀN BỘ database,
 *    giống cách Studio 3T thực hiện.
 * 2) Export/Import từng Collection sang/từ 1 file JSON bằng chính MongoDB Node.js Driver
 *    (dùng EJSON để giữ đúng kiểu dữ liệu) — không cần công cụ ngoài.
 */

function chayLenh(filePath, args) {
  return new Promise((resolve, reject) => {
    execFile(filePath, args, { timeout: 60_000 }, (error, stdout, stderr) => {
      const log = (stdout || '') + (stderr ? '\n' + stderr : '');
      if (error) {
        reject(new Error(log || error.message));
      } else {
        resolve(log || '(Không có output)');
      }
    });
  });
}

function resolveToolPath(toolName, envVar) {
  const envVal = process.env[envVar];
  if (envVal && envVal !== toolName && fs.existsSync(envVal)) {
    return envVal;
  }
  const defaultWinPath = `C:\\Program Files\\MongoDB\\Tools\\100\\bin\\${toolName}.exe`;
  if (fs.existsSync(defaultWinPath)) {
    return defaultWinPath;
  }
  return envVal || toolName;
}

async function chayMongoDump(thuMucDich) {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
  const dbName = process.env.MONGODB_DBNAME || 'QLKhachHangThanThiet';
  const dumpPath = resolveToolPath('mongodump', 'MONGODUMP_PATH');
  return chayLenh(dumpPath, [`--uri=${uri}`, `--db=${dbName}`, `--out=${thuMucDich}`]);
}

async function chayMongoRestore(thuMucNguon) {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
  const dbName = process.env.MONGODB_DBNAME || 'QLKhachHangThanThiet';
  const restorePath = resolveToolPath('mongorestore', 'MONGORESTORE_PATH');
  return chayLenh(restorePath, [`--uri=${uri}`, `--nsInclude=${dbName}.*`, '--drop', thuMucNguon]);
}

/** Xuất toàn bộ document của 1 collection ra 1 file JSON (mảng document, giữ nguyên kiểu dữ liệu qua EJSON). */
async function exportCollectionToJson(tenCollection, duongDanFile) {
  const db = getDB();
  const docs = await db.collection(tenCollection).find({}).toArray();
  fs.writeFileSync(duongDanFile, EJSON.stringify(docs, null, 2), 'utf8');
  return docs.length;
}

/**
 * Nhập dữ liệu từ 1 file JSON (mảng document) vào collection.
 * Nếu xoaDuLieuCu = true, xóa toàn bộ dữ liệu hiện có trong collection trước khi nhập.
 * Dùng upsert theo _id để có thể chạy lại nhiều lần mà không lỗi trùng khóa.
 */
async function importCollectionFromJson(tenCollection, duongDanFile, xoaDuLieuCu) {
  const db = getDB();
  const col = db.collection(tenCollection);
  const json = fs.readFileSync(duongDanFile, 'utf8');
  const docs = EJSON.parse(json);

  if (xoaDuLieuCu) await col.deleteMany({});

  let count = 0;
  for (const doc of docs) {
    if (doc._id !== undefined) {
      await col.replaceOne({ _id: doc._id }, doc, { upsert: true });
    } else {
      await col.insertOne(doc);
    }
    count++;
  }
  return count;
}

module.exports = { chayMongoDump, chayMongoRestore, exportCollectionToJson, importCollectionFromJson };
