// ==========================================================================
// QUẢN LÝ KHÁCH HÀNG THÂN THIẾT — script dùng chung phía client
// Vanilla JS, hiện đại, không phụ thuộc thư viện ngoài
// ==========================================================================

document.addEventListener('DOMContentLoaded', function () {
  khoiTaoSidebarToggle();
  khoiTaoXacNhanXoa();
  khoiTaoTuDongAnFlash();
  khoiTaoBangSanPham();
  khoiTaoKiemTraUuDai();
  khoiTaoDemoLoginAutofill();
  khoiTaoCopyQuery();
});

// ---------- Bật/tắt sidebar trên màn hình nhỏ ----------
function khoiTaoSidebarToggle() {
  var toggle = document.querySelector('.sidebar-toggle');
  var sidebar = document.querySelector('.sidebar');
  if (!toggle || !sidebar) return;

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    sidebar.classList.toggle('open');
  });

  // Bấm ra ngoài để đóng sidebar trên mobile
  document.addEventListener('click', function (e) {
    if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

// ---------- Tự động điền tài khoản demo trên trang đăng nhập ----------
function khoiTaoDemoLoginAutofill() {
  var chips = document.querySelectorAll('.demo-chip');
  var inputUser = document.querySelector('#tenDangNhap');
  var inputPass = document.querySelector('#matKhau');
  if (!chips.length || !inputUser || !inputPass) return;

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var u = chip.getAttribute('data-user');
      var p = chip.getAttribute('data-pass');
      inputUser.value = u || '';
      inputPass.value = p || '';

      // Hiệu ứng highlight nhẹ
      [inputUser, inputPass].forEach(function (inp) {
        inp.style.transition = 'background-color 0.3s ease';
        inp.style.backgroundColor = 'rgba(99, 102, 241, 0.3)';
        setTimeout(function () {
          inp.style.backgroundColor = '';
        }, 300);
      });
    });
  });
}

// ---------- Sao chép cú pháp pipeline truy vấn MongoDB ----------
function khoiTaoCopyQuery() {
  var btn = document.querySelector('#btn-copy-query');
  var codeEl = document.querySelector('#pipeline-code');
  if (!btn || !codeEl) return;

  btn.addEventListener('click', function () {
    var text = codeEl.innerText || codeEl.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = 'Đã chép ✔';
        setTimeout(function () { btn.textContent = 'Copy code'; }, 2000);
      });
    } else {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      btn.textContent = 'Đã chép ✔';
      setTimeout(function () { btn.textContent = 'Copy code'; }, 2000);
    }
  });
}

// ---------- Xác nhận trước khi xóa ----------
function khoiTaoXacNhanXoa() {
  document.querySelectorAll('form.form-confirm-delete').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      var msg = form.getAttribute('data-confirm') || 'Bạn có chắc chắn muốn xóa mục này?';
      if (!window.confirm(msg)) {
        e.preventDefault();
      }
    });
  });
}

// ---------- Tự động ẩn thông báo flash sau vài giây ----------
function khoiTaoTuDongAnFlash() {
  document.querySelectorAll('.alert[data-autohide]').forEach(function (el) {
    setTimeout(function () {
      el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateY(-6px)';
      setTimeout(function () { el.remove(); }, 400);
    }, 4500);
  });
}

// ---------- Bảng sản phẩm động trong form Giao dịch ----------
function khoiTaoBangSanPham() {
  var tbody = document.querySelector('#bang-san-pham tbody');
  if (!tbody) return;

  var btnThemDong = document.querySelector('#btn-them-dong-sp');
  var lblTongTien = document.querySelector('#lbl-tong-tien');
  var lblDiemNhan = document.querySelector('#lbl-diem-nhan');

  function taoDong(data) {
    data = data || {};
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td><input type="text" name="maSanPham" placeholder="VD: SP001" value="' + (data.MaSanPham || '') + '"></td>' +
      '<td><input type="text" name="tenSanPham" placeholder="Tên sản phẩm" value="' + (data.TenSanPham || '') + '" required></td>' +
      '<td><input type="number" name="soLuong" min="1" step="1" class="input-so-luong" value="' + (data.SoLuong || 1) + '"></td>' +
      '<td><input type="number" name="donGia" min="0" step="1000" class="input-don-gia" value="' + (data.DonGia || 0) + '"></td>' +
      '<td class="thanh-tien num" style="font-weight:600; color:var(--slate-800);">0 đ</td>' +
      '<td><button type="button" class="btn btn-sm btn-danger btn-xoa-dong" title="Xóa dòng này">Xóa</button></td>';
    tbody.appendChild(tr);
    ganSuKienDong(tr);
    tinhLai();
  }

  function ganSuKienDong(tr) {
    tr.querySelectorAll('.input-so-luong, .input-don-gia').forEach(function (input) {
      input.addEventListener('input', tinhLai);
    });
    tr.querySelector('.btn-xoa-dong').addEventListener('click', function () {
      tr.remove();
      tinhLai();
    });
  }

  function formatTien(so) {
    return Number(so || 0).toLocaleString('vi-VN') + ' đ';
  }

  function tinhLai() {
    var tong = 0;
    tbody.querySelectorAll('tr').forEach(function (tr) {
      var soLuong = parseFloat(tr.querySelector('.input-so-luong').value) || 0;
      var donGia = parseFloat(tr.querySelector('.input-don-gia').value) || 0;
      var thanhTien = soLuong * donGia;
      tr.querySelector('.thanh-tien').textContent = formatTien(thanhTien);
      tong += thanhTien;
    });
    if (lblTongTien) lblTongTien.textContent = formatTien(tong);
    if (lblDiemNhan) lblDiemNhan.textContent = Math.floor(tong / 10000);
  }

  // Gắn sự kiện cho các dòng đã có sẵn (khi sửa giao dịch)
  tbody.querySelectorAll('tr').forEach(ganSuKienDong);
  tinhLai();

  if (btnThemDong) {
    btnThemDong.addEventListener('click', function () { taoDong(); });
  }

  // Nếu form rỗng (thêm mới) thì tạo sẵn 1 dòng để người dùng nhập ngay
  if (tbody.children.length === 0) taoDong();
}

// ---------- Kiểm tra điều kiện đổi ưu đãi (gọi API không reload) ----------
function khoiTaoKiemTraUuDai() {
  var selectKh = document.querySelector('#select-khach-hang-uu-dai');
  var selectUd = document.querySelector('#select-uu-dai');
  var lblKetQua = document.querySelector('#lbl-dieu-kien-uu-dai');
  if (!selectKh || !selectUd || !lblKetQua) return;

  function kiemTra() {
    var maKh = selectKh.value;
    var maUd = selectUd.value;
    if (!maKh || !maUd) {
      lblKetQua.textContent = '';
      return;
    }
    lblKetQua.textContent = 'Đang kiểm tra điều kiện áp dụng...';
    lblKetQua.className = 'form-hint';
    fetch('/su-dung-uu-dai/kiem-tra?maKhachHang=' + encodeURIComponent(maKh) + '&maUuDai=' + encodeURIComponent(maUd))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        lblKetQua.textContent = data.thongBao;
        lblKetQua.className = data.hopLe ? 'form-hint hint-ok' : 'form-hint hint-error';
      })
      .catch(function () {
        lblKetQua.textContent = 'Không kiểm tra được điều kiện (lỗi kết nối).';
        lblKetQua.className = 'form-hint hint-error';
      });
  }

  selectKh.addEventListener('change', kiemTra);
  selectUd.addEventListener('change', kiemTra);
}
