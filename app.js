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

const NAMA_BULAN = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
let data = {};
let penghasilan = {};

// 🔐 Login & Logout
window.login = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(error => alert("Login gagal: " + error.message));
};

window.logout = () => auth.signOut();

// ➕ Tambah Baris Input
window.tambahBaris = () => {
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

// 💾 Simpan Input ke Firebase
window.simpanSemua = () => {
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
};

// 🔄 Simpan ke Firebase
function simpanKeDatabase() {
  const user = auth.currentUser;
  if (user) {
    database.ref("pengeluaran/" + user.uid).set({ penghasilan, ...data });
  }
}

// 💰 Hitung Sisa Uang per bulan
function hitungSisa() {
  const pengeluaranPerBulan = {};
  for (const tanggal in data) {
    const bulanKey = tanggal.slice(0, 7);
    if (!pengeluaranPerBulan[bulanKey]) pengeluaranPerBulan[bulanKey] = 0;
    data[tanggal].forEach(item => {
      pengeluaranPerBulan[bulanKey] += Number(item.nominal);
    });
  }

  let totalPenghasilan = 0;
  let totalPengeluaran = 0;

  for (const bulan in pengeluaranPerBulan) {
    const pengeluaranBulan = pengeluaranPerBulan[bulan];
    const penghasilanBulan = penghasilan[bulan] || 0;
    totalPengeluaran += pengeluaranBulan;
    totalPenghasilan += penghasilanBulan;
  }

  const sisa = totalPenghasilan - totalPengeluaran;
  document.getElementById("totalPengeluaran").textContent = `Rp ${totalPengeluaran.toLocaleString("id-ID")}`;
  document.getElementById("sisaUang").textContent = `Rp ${sisa.toLocaleString("id-ID")}`;
}

// 🔁 Reset Filter
window.resetFilter = () => {
  ["searchInput", "filterTahun", "startDate", "endDate", "filterBulan"].forEach(id => document.getElementById(id).value = "");
  tampilkanData();
};

// 🧠 Tampilkan Data
window.tampilkanData = function () {
  const container = document.getElementById("bulanContainer");
  container.innerHTML = "";
  const totalPerBulan = Array(12).fill(0);
  const search = document.getElementById("searchInput").value.toLowerCase();
  const tahunFilter = document.getElementById("filterTahun").value;
  const bulanFilter = document.getElementById("filterBulan").value;
  const startDate = document.getElementById("startDate").valueAsDate;
  const endDate = document.getElementById("endDate").valueAsDate;
  const semuaTanggal = Object.keys(data || {}).filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key));
  const dataFiltered = [];

  semuaTanggal.forEach(tglStr => {
    const items = data[tglStr];
    if (!Array.isArray(items)) return;
    const tgl = new Date(tglStr);
    const bulan = tgl.getMonth();
    const tahun = tgl.getFullYear();
    if (tahunFilter && tahun != +tahunFilter) return;
    if (bulanFilter !== "" && bulan !== +bulanFilter) return;
    if (startDate && tgl < startDate) return;
    if (endDate && tgl > endDate) return;
    items.forEach((item, i) => {
      const cocokCari = !search || item.kategori?.toLowerCase().includes(search) || item.keterangan?.toLowerCase().includes(search);
      if (cocokCari) dataFiltered.push({ ...item, tanggal: tglStr, index: `${tglStr}_${i}` });
    });
  });

  const grupPerBulan = {};
  dataFiltered.forEach(item => {
    const bulan = new Date(item.tanggal).getMonth();
    if (!grupPerBulan[bulan]) grupPerBulan[bulan] = [];
    grupPerBulan[bulan].push(item);
    totalPerBulan[bulan] += Number(item.nominal);
  });

  const bulanYangDitampilkan = bulanFilter !== "" ? [+bulanFilter] : Array.from({ length: 12 }, (_, i) => i);
  bulanYangDitampilkan.forEach(i => {
    const items = grupPerBulan[i] || [];
    const card = document.createElement("div");
    card.className = "bg-white p-4 rounded shadow mb-4";
    let content = `<h2 class="font-semibold text-indigo-700 mb-2">${NAMA_BULAN[i]}</h2>`;
    if (items.length > 0) {
      content += `
        <table class="min-w-full text-sm text-gray-700 border">
          <thead><tr class="bg-gray-100">
              <th class="border p-2">Tanggal</th>
              <th class="border p-2">Kategori</th>
              <th class="border p-2">Nominal</th>
              <th class="border p-2">Keterangan</th>
              <th class="border p-2">Aksi</th>
          </tr></thead>
          <tbody id="bulan-${i}"></tbody>
          <tfoot>
            <tr>
              <td colspan="2" class="text-right p-2 font-semibold">Total:</td>
              <td class="p-2 font-bold text-blue-700">Rp ${totalPerBulan[i].toLocaleString("id-ID")}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>`;
    } else {
      content += `<p class="text-gray-500 italic">Belum ada data di bulan ini.</p>`;
    }
    card.innerHTML = content;
    container.appendChild(card);
    if (items.length > 0) {
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
          </td>`;
        tbody.appendChild(row);
      });
    }
  });

  hitungSisa();
};

// ✏️ Edit Data
window.editData = function (tanggal, index) {
  const item = data[tanggal][index];
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="date" value="${tanggal}" class="w-full border p-1"></td>
    <td><input type="text" value="${item.kategori}" class="w-full border p-1"></td>
    <td><input type="number" value="${item.nominal}" class="w-full border p-1"></td>
    <td><input type="text" value="${item.keterangan}" class="w-full border p-1"></td>
    <td class="text-center">
      <button onclick="simpanEdit('${tanggal}', ${index}, this)" class="text-green-600 hover:underline">Simpan</button>
    </td>`;
  const tbody = document.getElementById(`bulan-${new Date(tanggal).getMonth()}`);
  const rows = Array.from(tbody.children);
  tbody.replaceChild(row, rows[index]);
};

window.simpanEdit = function (tanggal, index, button) {
  const row = button.closest("tr");
  const inputs = row.querySelectorAll("input");
  const newTanggal = inputs[0].value;
  const kategori = inputs[1].value;
  const nominal = inputs[2].value;
  const keterangan = inputs[3].value;
  data[tanggal].splice(index, 1);
  if (data[tanggal].length === 0) delete data[tanggal];
  if (!data[newTanggal]) data[newTanggal] = [];
  data[newTanggal].push({ kategori, nominal, keterangan, tanggal: newTanggal });
  simpanKeDatabase();
  tampilkanData();
};

// 🗑️ Hapus Data
window.hapusData = function (tanggal, index) {
  if (confirm("Yakin ingin menghapus data ini?")) {
    data[tanggal].splice(index, 1);
    if (data[tanggal].length === 0) delete data[tanggal];
    simpanKeDatabase();
    tampilkanData();
  }
};

// ⬇️ Export Excel
window.exportToExcel = () => {
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

// 🔄 Load Data dari Firebase
async function loadDataDariDatabase() {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const snapshot = await database.ref("pengeluaran/" + user.uid).once("value");
    const val = snapshot.val() || {};
    penghasilan = val.penghasilan || {};
    document.getElementById("penghasilan").value = "";
    data = {};
    for (const key in val) {
      if (key === "penghasilan") continue;
      if (Array.isArray(val[key])) {
        data[key] = val[key];
      }
    }
    tampilkanData();
    hitungSisa();
  } catch (err) {
    console.error("❌ Gagal mengambil data:", err);
  }
}

// ⬆️ Simpan penghasilan bulanan
window.simpanPenghasilanBulanan = function () {
  const bulanSelect = document.getElementById("bulanPenghasilan");
  const nominalInput = document.getElementById("penghasilan");
  const bulanKey = bulanSelect.value;
  const nominal = Number(nominalInput.value);
  if (bulanKey && nominal > 0) {
    penghasilan[bulanKey] = nominal;
    simpanKeDatabase();
    hitungSisa();
  }
};

// 🔐 Auth Listener
auth.onAuthStateChanged(async user => {
  if (user) {
    document.getElementById("btnLogin").classList.add("hidden");
    document.getElementById("btnLogout").classList.remove("hidden");
    document.getElementById("userName").textContent = `👋 Halo, ${user.displayName}`;
    await loadDataDariDatabase();
  } else {
    document.getElementById("btnLogin").classList.remove("hidden");
    document.getElementById("btnLogout").classList.add("hidden");
    document.getElementById("userName").textContent = "";
    data = {};
    penghasilan = {};
    tampilkanData();
    hitungSisa();
  }
});

// 🗑️ Reset Semua Data
window.resetData = () => {
  if (confirm("Yakin ingin menghapus SEMUA data?")) {
    const user = auth.currentUser;
    if (user) {
      database.ref("pengeluaran/" + user.uid).remove()
        .then(() => {
          data = {};
          penghasilan = {};
          tampilkanData();
          hitungSisa();
          alert("✅ Semua data berhasil dihapus.");
        })
        .catch(err => alert("❌ Gagal menghapus data."));
    }
  }
};
