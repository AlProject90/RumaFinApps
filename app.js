// 🔧 Firebase Config
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

const NAMA_BULAN = [
  "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
  "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
];

let data = {};
let penghasilanPerBulan = {};

// 🔐 Login / Logout
window.login = function () {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(e => alert("Login gagal: " + e.message));
};

window.logout = function () {
  auth.signOut();
};

// ➕ Tambah Baris
window.tambahBaris = function () {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="date" class="w-full border p-1"></td>
    <td><input type="text" placeholder="Kategori" class="w-full border p-1"></td>
    <td><input type="number" placeholder="Nominal" class="w-full border p-1"></td>
    <td><input type="text" placeholder="Keterangan" class="w-full border p-1"></td>
    <td class="text-center"><button onclick="this.closest('tr').remove()" class="text-red-500 hover:underline">Hapus</button></td>
  `;
  document.getElementById("inputRows").appendChild(row);
};

// 💾 Simpan Semua
window.simpanSemua = function () {
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
  document.getElementById("inputRows").innerHTML = "";
  simpanKeDatabase();
  tampilkanData();
  hitungSisa();
};

// 📤 Simpan ke Firebase
function simpanKeDatabase() {
  const user = auth.currentUser;
  if (user) {
    database.ref("pengeluaran/" + user.uid).set({
      penghasilan: penghasilanPerBulan,
      ...data
    }).then(() => console.log("✅ Data disimpan"));
  }
}

// 🧮 Hitung Sisa Uang
function hitungSisa() {
  let total = 0;
  for (const tanggal in data) {
    data[tanggal].forEach(i => total += Number(i.nominal));
  }

  const filterTahun = document.getElementById("filterTahun").value;
  const filterBulan = document.getElementById("filterBulan").value;

  let tahun = new Date().getFullYear();
  let bulan = new Date().getMonth();
  if (filterTahun) tahun = +filterTahun;
  if (filterBulan !== "") bulan = +filterBulan;

  const kunci = `${tahun}-${String(bulan + 1).padStart(2, "0")}`;
  const penghasilan = Number(penghasilanPerBulan[kunci]) || 0;

  const sisa = penghasilan - total;

  document.getElementById("penghasilanView").textContent = `Rp ${penghasilan.toLocaleString("id-ID")}`;
  document.getElementById("totalPengeluaran").textContent = `Rp ${total.toLocaleString("id-ID")}`;
  document.getElementById("sisaUang").textContent = `Rp ${sisa.toLocaleString("id-ID")}`;
}

// 💾 Simpan Penghasilan Bulanan
window.simpanPenghasilanPerBulan = function () {
  const user = auth.currentUser;
  if (!user) return alert("Anda belum login");

  const bulan = document.getElementById("inputBulanPenghasilan").value;
  const nominal = Number(document.getElementById("inputNominalPenghasilan").value);
  if (!bulan || isNaN(nominal)) return alert("Isi bulan & nominal dengan benar");

  penghasilanPerBulan[bulan] = nominal;
  simpanKeDatabase();
  tampilkanData();
  hitungSisa();
};

// 🔄 Reset Filter
window.resetFilter = function () {
  ["searchInput", "filterTahun", "startDate", "endDate", "filterBulan"].forEach(id => document.getElementById(id).value = "");
  tampilkanData();
};

// 🔍 Tampilkan Data
window.tampilkanData = function () {
  const container = document.getElementById("bulanContainer");
  container.innerHTML = "";

  const search = document.getElementById("searchInput").value.toLowerCase();
  const tahunFilter = document.getElementById("filterTahun").value;
  const bulanFilter = document.getElementById("filterBulan").value;
  const startDate = document.getElementById("startDate").valueAsDate;
  const endDate = document.getElementById("endDate").valueAsDate;

  const semuaTanggal = Object.keys(data).filter(t => /^\d{4}-\d{2}-\d{2}$/.test(t));
  const dataFiltered = [];

  semuaTanggal.forEach(tglStr => {
    const tgl = new Date(tglStr);
    const tahun = tgl.getFullYear();
    const bulan = tgl.getMonth();
    if (tahunFilter && tahun != +tahunFilter) return;
    if (bulanFilter !== "" && bulan !== +bulanFilter) return;
    if (startDate && tgl < startDate) return;
    if (endDate && tgl > endDate) return;

    data[tglStr].forEach((item, i) => {
      const cocok = !search || item.kategori?.toLowerCase().includes(search) || item.keterangan?.toLowerCase().includes(search);
      if (cocok) dataFiltered.push({ ...item, tanggal: tglStr, index: `${tglStr}_${i}` });
    });
  });

  const grup = {};
  dataFiltered.forEach(item => {
    const bulan = new Date(item.tanggal).getMonth();
    if (!grup[bulan]) grup[bulan] = [];
    grup[bulan].push(item);
  });

  const bulanTampil = bulanFilter !== "" ? [+bulanFilter] : Array.from({ length: 12 }, (_, i) => i);
  bulanTampil.forEach(i => {
    const items = grup[i] || [];
    const card = document.createElement("div");
    card.className = "bg-white p-4 rounded shadow mb-4";

    let content = `<h2 class="font-semibold text-indigo-700 mb-2">${NAMA_BULAN[i]}</h2>`;
    if (items.length > 0) {
      let total = items.reduce((a, b) => a + Number(b.nominal), 0);
      content += `
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
              <td class="p-2 font-bold text-blue-700">Rp ${total.toLocaleString("id-ID")}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>`;
    } else {
      content += `<p class="text-gray-500 italic">Belum ada data di bulan ini.</p>`;
    }

    card.innerHTML = content;
    container.appendChild(card);

    const tbody = card.querySelector(`#bulan-${i}`);
    if (tbody) {
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
          </td>`;
        tbody.appendChild(row);
      });
    }
  });

  hitungSisa();
};

// ✏️ Edit & Simpan
window.editData = function (tanggal, index) {
  const item = data[tanggal][index];
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="date" value="${tanggal}" class="w-full border p-1"></td>
    <td><input type="text" value="${item.kategori}" class="w-full border p-1"></td>
    <td><input type="number" value="${item.nominal}" class="w-full border p-1"></td>
    <td><input type="text" value="${item.keterangan}" class="w-full border p-1"></td>
    <td class="text-center"><button onclick="simpanEdit('${tanggal}', ${index}, this)" class="text-green-600 hover:underline">Simpan</button></td>`;
  const tbody = document.getElementById(`bulan-${new Date(tanggal).getMonth()}`);
  const rows = Array.from(tbody.children);
  tbody.replaceChild(row, rows[index]);
};

window.simpanEdit = function (tanggal, index, btn) {
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
};

window.hapusData = function (tanggal, index) {
  if (confirm("Yakin ingin menghapus data ini?")) {
    data[tanggal].splice(index, 1);
    if (data[tanggal].length === 0) delete data[tanggal];
    simpanKeDatabase();
    tampilkanData();
  }
};

// 🔃 Load Data
async function loadDataDariDatabase() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const snap = await database.ref("pengeluaran/" + user.uid).once("value");
    const val = snap.val();
    data = {};
    penghasilanPerBulan = val?.penghasilan || {};

    Object.entries(val || {}).forEach(([key, val]) => {
      if (key === "penghasilan") return;
      if (Array.isArray(val)) {
        data[key] = val.map(item => ({ ...item, tanggal: item.tanggal || key }));
      }
    });

    tampilkanData();
    hitungSisa();
  } catch (e) {
    console.error("Gagal load data:", e);
  }
}

// 🔄 Auth listener
auth.onAuthStateChanged(async user => {
  const loginBtn = document.getElementById("btnLogin");
  const logoutBtn = document.getElementById("btnLogout");
  const userName = document.getElementById("userName");

  if (user) {
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    userName.textContent = `👋 Halo, ${user.displayName}`;
    await loadDataDariDatabase();
  } else {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    userName.textContent = "";
    data = {};
    penghasilanPerBulan = {};
    tampilkanData();
    hitungSisa();
  }
});

// 📤 Export Excel
window.exportToExcel = function () {
  const wb = XLSX.utils.book_new();
  const ws_data = [["Tanggal", "Kategori", "Nominal", "Keterangan"]];
  for (const tanggal in data) {
    data[tanggal].forEach(item => {
      ws_data.push([item.tanggal, item.kategori, item.nominal, item.keterangan]);
    });
  }
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, "Pengeluaran");
  XLSX.writeFile(wb, "RumaFinData.xlsx");
};

// ❌ Reset Semua Data
window.resetData = function () {
  if (confirm("Yakin ingin menghapus SEMUA data?")) {
    const user = auth.currentUser;
    if (user) {
      database.ref("pengeluaran/" + user.uid).remove().then(() => {
        data = {};
        penghasilanPerBulan = {};
        tampilkanData();
        hitungSisa();
        alert("✅ Semua data berhasil dihapus.");
      });
    }
  }
};
