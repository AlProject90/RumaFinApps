// ✅ Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCtXSM2NOuH4ruhasx7O7rzxTxxKfYdTts",
  authDomain: "rumafinapps.firebaseapp.com",
  databaseURL: "https://rumafinapps-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rumafinapps",
  storageBucket: "rumafinapps.appspot.com",
  messagingSenderId: "456685667439",
  appId: "1:456685667439:web:f1254845968302a084f99a"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

const NAMA_BULAN = ["JANUARI","FEBRUARI","MARET","APRIL","MEI","JUNI","JULI","AGUSTUS","SEPTEMBER","OKTOBER","NOVEMBER","DESEMBER"];
let data = {};
let penghasilan = 0;

// 🔐 Login & Logout
function login() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err => alert("Login gagal: " + err.message));
}
function logout() {
  auth.signOut();
}

// ➕ Tambah Baris
function tambahBaris() {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="date" class="w-full border p-1"></td>
    <td><input type="text" placeholder="Kategori" class="w-full border p-1"></td>
    <td><input type="number" placeholder="Nominal" class="w-full border p-1"></td>
    <td><input type="text" placeholder="Keterangan" class="w-full border p-1"></td>
    <td class="text-center"><button onclick="this.closest('tr').remove()" class="text-red-500 hover:underline">Hapus</button></td>
  `;
  document.getElementById("inputRows").appendChild(row);
}

// 💾 Simpan Semua
function simpanSemua() {
  const rows = document.querySelectorAll("#inputRows tr");
  rows.forEach(row => {
    const inputs = row.querySelectorAll("input");
    const tanggal = inputs[0].value;
    const kategori = inputs[1].value.trim();
    const nominal = inputs[2].value;
    const keterangan = inputs[3].value.trim();

    if (tanggal && kategori && nominal) {
      if (!data[tanggal]) data[tanggal] = [];
      data[tanggal].push({ tanggal, kategori, nominal, keterangan });
    }
  });

  simpanKeDatabase();
  document.getElementById("inputRows").innerHTML = "";
  tampilkanData();
  hitungSisa();
}

// 🔄 Simpan ke Firebase
function simpanKeDatabase() {
  const user = auth.currentUser;
  if (user) {
    database.ref("pengeluaran/" + user.uid).set({ penghasilan, ...data });
  }
}

// 🔁 Reset Filter
function resetFilter() {
  document.getElementById("searchInput").value = "";
  document.getElementById("filterTahun").value = "";
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  document.getElementById("filterBulan").value = "";
  tampilkanData();
}

// 🔁 Reset Semua Data
function resetData() {
  if (confirm("Yakin ingin hapus semua data?")) {
    const user = auth.currentUser;
    if (user) {
      database.ref("pengeluaran/" + user.uid).remove().then(() => {
        data = {};
        penghasilan = 0;
        document.getElementById("penghasilan").value = 0;
        tampilkanData();
        hitungSisa();
      });
    }
  }
}

// ⬇️ Export ke Excel
function exportToExcel() {
  const rows = [["Tanggal", "Kategori", "Nominal", "Keterangan"]];
  Object.values(data).flat().forEach(item => {
    rows.push([item.tanggal, item.kategori, item.nominal, item.keterangan]);
  });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Pengeluaran");
  XLSX.writeFile(wb, "pengeluaran_rumafin.xlsx");
}

// 💰 Hitung Sisa
function hitungSisa() {
  let total = 0;
  for (const tanggal in data) {
    data[tanggal].forEach(item => {
      total += Number(item.nominal);
    });
  }
  const sisa = penghasilan - total;
  document.getElementById("totalPengeluaran").textContent = `Rp ${total.toLocaleString("id-ID")}`;
  document.getElementById("sisaUang").textContent = `Rp ${sisa.toLocaleString("id-ID")}`;
}

// 📊 Tampilkan Data
function tampilkanData() {
  const container = document.getElementById("bulanContainer");
  container.innerHTML = "";

  const search = document.getElementById("searchInput").value.toLowerCase();
  const tahunFilter = document.getElementById("filterTahun").value;
  const bulanFilter = document.getElementById("filterBulan").value;
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;

  const semuaTanggal = Object.keys(data || {}).filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key));
  const dataFiltered = [];

  semuaTanggal.forEach(tglStr => {
    const items = data[tglStr];
    if (!Array.isArray(items)) return;

    const tgl = new Date(tglStr);
    const bulan = tgl.getMonth();
    const tahun = tgl.getFullYear();

    if (tahunFilter && tahun != tahunFilter) return;
    if (bulanFilter !== "" && bulan != bulanFilter) return;
    if (start && tgl < new Date(start)) return;
    if (end && tgl > new Date(end)) return;

    items.forEach((item, i) => {
      const cocok = !search || item.kategori?.toLowerCase().includes(search) || item.keterangan?.toLowerCase().includes(search);
      if (cocok) dataFiltered.push({ ...item, tanggal: tglStr, index: `${tglStr}_${i}` });
    });
  });

  const grupPerBulan = {};
  const totalPerBulan = Array(12).fill(0);

  dataFiltered.forEach(item => {
    const bulan = new Date(item.tanggal).getMonth();
    if (!grupPerBulan[bulan]) grupPerBulan[bulan] = [];
    grupPerBulan[bulan].push(item);
    totalPerBulan[bulan] += Number(item.nominal);
  });

  for (let i = 0; i < 12; i++) {
    const items = grupPerBulan[i] || [];
    const card = document.createElement("div");
    card.className = "bg-white p-4 rounded shadow mb-4";
    card.innerHTML = `
      <h2 class="font-semibold text-indigo-700 mb-2">${NAMA_BULAN[i]}</h2>
      <table class="min-w-full text-sm text-gray-700 border">
        <thead>
          <tr class="bg-gray-100">
            <th class="border p-2">Tanggal</th>
            <th class="border p-2">Kategori</th>
            <th class="border p-2">Nominal</th>
            <th class="border p-2">Keterangan</th>
            <th class="border p-2">Aksi</th>
          </tr>
        </thead>
        <tbody id="bulan-${i}"></tbody>
        <tfoot>
          <tr>
            <td colspan="2" class="text-right p-2 font-semibold">Total:</td>
            <td class="p-2 font-bold text-blue-700">Rp ${totalPerBulan[i].toLocaleString("id-ID")}</td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
    `;
    container.appendChild(card);

    const tbody = card.querySelector(`#bulan-${i}`);
    items.forEach((item, idx) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="border p-1">${item.tanggal}</td>
        <td class="border p-1">${item.kategori}</td>
        <td class="border p-1">Rp ${Number(item.nominal).toLocaleString("id-ID")}</td>
        <td class="border p-1">${item.keterangan || '-'}</td>
        <td class="border p-1 text-center">
          <button onclick="editData('${item.tanggal}', ${idx})" class="text-yellow-600 hover:underline">Edit</button>
          <button onclick="hapusData('${item.tanggal}', ${idx})" class="text-red-600 hover:underline">Hapus</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  hitungSisa();
}

// ✏️ Edit & Simpan
function editData(tanggal, index) {
  const item = data[tanggal][index];
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="date" value="${tanggal}" class="w-full border p-1"></td>
    <td><input type="text" value="${item.kategori}" class="w-full border p-1"></td>
    <td><input type="number" value="${item.nominal}" class="w-full border p-1"></td>
    <td><input type="text" value="${item.keterangan}" class="w-full border p-1"></td>
    <td class="text-center">
      <button onclick="simpanEdit('${tanggal}', ${index}, this)" class="text-green-600 hover:underline">Simpan</button>
    </td>
  `;
  const tbody = document.getElementById(`bulan-${new Date(tanggal).getMonth()}`);
  const rows = Array.from(tbody.children);
  tbody.replaceChild(row, rows[index]);
}
function simpanEdit(tanggal, index, btn) {
  const row = btn.closest("tr");
  const inputs = row.querySelectorAll("input");
  const newTanggal = inputs[0].value;
  const kategori = inputs[1].value;
  const nominal = inputs[2].value;
  const keterangan = inputs[3].value;

  data[tanggal].splice(index, 1);
  if (data[tanggal].length === 0) delete data[tanggal];
  if (!data[newTanggal]) data[newTanggal] = [];
  data[newTanggal].push({ tanggal: newTanggal, kategori, nominal, keterangan });

  simpanKeDatabase();
  tampilkanData();
}
function hapusData(tanggal, index) {
  if (confirm("Yakin ingin menghapus data ini?")) {
    data[tanggal].splice(index, 1);
    if (data[tanggal].length === 0) delete data[tanggal];
    simpanKeDatabase();
    tampilkanData();
  }
}

// 🚀 Load Data
async function loadDataDariDatabase() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const snapshot = await database.ref("pengeluaran/" + user.uid).once("value");
    const val = snapshot.val();
    if (val) {
      penghasilan = val.penghasilan || 0;
      document.getElementById("penghasilan").value = penghasilan;
      data = {};
      Object.entries(val).forEach(([key, value]) => {
        if (key === "penghasilan") return;
        if (Array.isArray(value)) {
          data[key] = value.map(item => ({ ...item, tanggal: item.tanggal || key }));
        }
      });
    }
    tampilkanData();
    hitungSisa();
  } catch (err) {
    console.error("❌ Gagal ambil data:", err);
  }
}

// 🔁 Cek Login
auth.onAuthStateChanged(async user => {
  document.getElementById("btnLogin").classList.toggle("hidden", !!user);
  document.getElementById("btnLogout").classList.toggle("hidden", !user);
  document.getElementById("userName").textContent = user ? `👋 Halo, ${user.displayName}` : "";
  if (user) await loadDataDariDatabase();
  else {
    data = {};
    penghasilan = 0;
    document.getElementById("penghasilan").value = 0;
    tampilkanData();
    hitungSisa();
  }
});

// 💵 Ubah Penghasilan
document.getElementById("penghasilan").addEventListener("change", e => {
  penghasilan = Number(e.target.value);
  simpanKeDatabase();
  hitungSisa();
});

// 🌍 Fungsi Global agar bisa diakses dari HTML
window.login = login;
window.logout = logout;
window.tambahBaris = tambahBaris;
window.simpanSemua = simpanSemua;
window.exportToExcel = exportToExcel;
window.resetFilter = resetFilter;
window.resetData = resetData;
window.tampilkanData = tampilkanData;
window.editData = editData;
window.simpanEdit = simpanEdit;
window.hapusData = hapusData;
