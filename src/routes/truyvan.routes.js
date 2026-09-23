const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middlewares/auth');
const { DANH_SACH_TRUY_VAN } = require('../services/truyVanService');

router.get('/', requireLogin, async (req, res, next) => {
  try {
    const maChon = req.query.q || 'q1';
    const cauTruyVan = DANH_SACH_TRUY_VAN.find((c) => c.ma === maChon) || DANH_SACH_TRUY_VAN[0];
    const ketQua = await cauTruyVan.run();

    res.render('truyvan/index', {
      title: '15 câu truy vấn MongoDB',
      danhSach: DANH_SACH_TRUY_VAN,
      cauTruyVan,
      ketQua: Array.isArray(ketQua) ? ketQua : [ketQua],
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
