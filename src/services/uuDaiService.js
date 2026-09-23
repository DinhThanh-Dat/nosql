const { getDB } = require('../config/db');
const COL = require('../config/collections');

async function tangSoLuongDaSuDung(maUuDai, soLuong = 1) {
  const db = getDB();
  await db.collection(COL.UU_DAI).updateOne({ _id: maUuDai }, { $inc: { SoLuongDaSuDung: soLuong } });
}

async function giamSoLuongDaSuDung(maUuDai, soLuong = 1) {
  const db = getDB();
  await db.collection(COL.UU_DAI).updateOne({ _id: maUuDai }, { $inc: { SoLuongDaSuDung: -soLuong } });
}

module.exports = { tangSoLuongDaSuDung, giamSoLuongDaSuDung };
