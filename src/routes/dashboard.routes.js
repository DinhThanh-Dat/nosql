const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middlewares/auth');
const truyVan = require('../services/truyVanService');

router.get('/', (req, res) => {
  res.redirect(req.session.user ? '/dashboard' : '/login');
});

router.get('/dashboard', requireLogin, async (req, res, next) => {
  try {
    const [tongDoanhThuArr, tongKhachHang, doanhThuThang, topKhachHang, phanBoHang, topUuDai] = await Promise.all([
      truyVan.query07(),
      truyVan.query05(),
      truyVan.query15(),
      truyVan.query09(5),
      truyVan.query12(),
      truyVan.query14(5),
    ]);

    const tongDoanhThu = tongDoanhThuArr.length > 0 ? tongDoanhThuArr[0].TongDoanhThu : 0;

    res.render('dashboard', {
      title: 'Thống kê tổng quan',
      tongDoanhThu,
      tongKhachHang,
      doanhThuThang,
      topKhachHang,
      phanBoHang,
      topUuDai,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
