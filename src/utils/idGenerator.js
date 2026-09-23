/**
 * Sinh mã tiếp theo dạng PREFIX + số thứ tự đệm 0, ví dụ KH001, KH002,...
 * Dựa trên mã lớn nhất hiện có trong collection (đúng quy ước mã của dữ liệu mẫu đề tài).
 */
async function generateNextId(collection, prefix, padLength = 3) {
  const docs = await collection
    .find({ _id: { $regex: '^' + prefix } }, { projection: { _id: 1 } })
    .toArray();

  let max = 0;
  for (const doc of docs) {
    const suffix = String(doc._id).slice(prefix.length);
    const n = parseInt(suffix, 10);
    if (!Number.isNaN(n) && n > max) max = n;
  }
  return prefix + String(max + 1).padStart(padLength, '0');
}

module.exports = { generateNextId };
