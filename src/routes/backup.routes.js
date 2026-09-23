const express = require('express');
const path = require('path');
const router = express.Router();
const { requireAdmin } = require('../middlewares/auth');
const { flashSuccess, flashError } = require('../utils/flash');
const backupService = require('../services/backupService');
const sampleDataService = require('../services/sampleDataService');
const COL = require('../config/collections');

const DANH_SACH_COLLECTION = Object.values(COL);

router.get('/', requireAdmin, (req, res) => {
  res.render('backup/index', {
    title: 'Sao lưu / Phục hồi / Import - Export',
    danhSachCollection: DANH_SACH_COLLECTION,
    log: null,
  });
});

router.post('/mongodump', requireAdmin, async (req, res) => {
  const thuMuc = (req.body.thuMucDich || '').trim();
  if (!thuMuc) {
    flashError(req, 'Vui lòng nhập đường dẫn thư mục lưu bản sao lưu (trên máy chủ chạy server).');
    return res.redirect('/sao-luu-phuc-hoi');
  }
  try {
    const log = await backupService.chayMongoDump(thuMuc);
    res.render('backup/index', {
      title: 'Sao lưu / Phục hồi / Import - Export',
      danhSachCollection: DANH_SACH_COLLECTION,
      log: '== SAO LƯU ==\n' + log,
    });
  } catch (err) {
    res.render('backup/index', {
      title: 'Sao lưu / Phục hồi / Import - Export',
      danhSachCollection: DANH_SACH_COLLECTION,
      log:
        'Lỗi: ' + err.message +
        '\n\nKiểm tra: mongodump đã được cài đặt (MongoDB Database Tools) và có trong PATH,' +
        ' hoặc cập nhật MONGODUMP_PATH trong file .env.',
    });
  }
});

router.post('/mongorestore', requireAdmin, async (req, res) => {
  const thuMuc = (req.body.thuMucNguon || '').trim();
  if (!thuMuc) {
    flashError(req, 'Vui lòng nhập đường dẫn thư mục chứa bản sao lưu cần phục hồi.');
    return res.redirect('/sao-luu-phuc-hoi');
  }
  try {
    const log = await backupService.chayMongoRestore(thuMuc);
    res.render('backup/index', {
      title: 'Sao lưu / Phục hồi / Import - Export',
      danhSachCollection: DANH_SACH_COLLECTION,
      log: '== PHỤC HỒI ==\n' + log,
    });
  } catch (err) {
    res.render('backup/index', {
      title: 'Sao lưu / Phục hồi / Import - Export',
      danhSachCollection: DANH_SACH_COLLECTION,
      log:
        'Lỗi: ' + err.message +
        '\n\nKiểm tra: mongorestore đã được cài đặt (MongoDB Database Tools) và có trong PATH,' +
        ' hoặc cập nhật MONGORESTORE_PATH trong file .env.',
    });
  }
});

router.get('/export/:collection', requireAdmin, async (req, res, next) => {
  try {
    const { collection } = req.params;
    if (!DANH_SACH_COLLECTION.includes(collection)) return res.status(400).send('Collection không hợp lệ.');

    const tmpFile = path.join(require('os').tmpdir(), `${collection}_export_${Date.now()}.json`);
    const count = await backupService.exportCollectionToJson(collection, tmpFile);

    res.download(tmpFile, `${collection}.json`, (err) => {
      if (err) console.error('Lỗi gửi file export:', err);
      require('fs').unlink(tmpFile, () => {});
    });
    console.log(`[EXPORT] ${collection}: ${count} document`);
  } catch (err) {
    next(err);
  }
});

router.post('/import/:collection', requireAdmin, async (req, res, next) => {
  // Nhận đường dẫn file JSON trên máy chủ (đơn giản hóa, không cần thư viện upload multipart).
  try {
    const { collection } = req.params;
    if (!DANH_SACH_COLLECTION.includes(collection)) return res.status(400).send('Collection không hợp lệ.');

    const duongDan = (req.body.duongDanFile || '').trim();
    const xoaDuLieuCu = req.body.xoaDuLieuCu === 'on';
    if (!duongDan) {
      flashError(req, 'Vui lòng nhập đường dẫn file JSON cần import (trên máy chủ chạy server).');
      return res.redirect('/sao-luu-phuc-hoi');
    }

    const count = await backupService.importCollectionFromJson(collection, duongDan, xoaDuLieuCu);
    flashSuccess(req, `Đã nhập ${count} document vào Collection ${collection}.`);
    res.redirect('/sao-luu-phuc-hoi');
  } catch (err) {
    next(err);
  }
});

router.post('/nhap-du-lieu-mau', requireAdmin, async (req, res, next) => {
  try {
    const log = await sampleDataService.nhapDuLieuMau();
    res.render('backup/index', {
      title: 'Sao lưu / Phục hồi / Import - Export',
      danhSachCollection: DANH_SACH_COLLECTION,
      log: '== NHẬP DỮ LIỆU MẪU ==\n' + log,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
