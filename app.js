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

let data = {};
let penghasilanBulanan = {};

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

window.login = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err => alert("Login gagal: " + err.message));
};

window.logout = () => auth.signOut();

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
  document.getElementById("inputRows").innerHTML = "";
  simpanKeDatabase();
  tampilkanData();
  hitungRingkasan();
};

window.simpanPenghasilanPerBulan = () => {
  const bulan = document.getElementById("inputPenghasilanBulan").value;
  const tahun = document.getElementById("inputPenghasilanTahun").value;
  const nominal = Number(document.getElementById("inputPenghasilanNominal").value);

  if (!bulan || !tahun || isNaN(nominal)) {
    return alert("Isi bulan, tahun, dan nominal dengan benar");
  }

  const key = `${tahun}-${String(Number(bulan) + 1).padStart(2, "0")}`;
  penghasilanBulanan[key] = nominal;
  simpanKeDatabase();
  tampilkanData();
  hitungRingkasan();
};

function simpanKeDatabase() {
  const user = auth.currentUser;
  if (user) {
    database.ref("pengeluaran/" + user.uid).set({
      penghasilan: penghasilanBulanan,
      ...data
    });
  }
}

window.resetFilter = () => {
  ["searchInput", "filterTahun", "startDate", "endDate", "filterBulan"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  tampilkanData();
};

window.tampilkanData = function () {
  const container = document.getElementById("bulanContainer");
  container.innerHTML = "";

  const tahunFilter = document.getElementById("filterTahun").value;
  const bulanFilter = document.getElementById("filterBulan").value;
  const search = document.getElementById("searchInput").value.toLowerCase();
  const startDate = document.getElementById("startDate").valueAsDate;
  const endDate = document.getElementById("endDate").valueAsDate;

  const semuaTanggal = Object.keys(data).filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key));
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
      const cocok = !search || item.kategori?.toLowerCase().includes(search) || item.keterangan?.toLowerCase().includes(search);
      if (cocok) {
        dataFiltered.push({ ...item, tanggal: tglStr, index: `${tglStr}_${i}` });
      }
    });
  });

  const grupPerBulan = {};
  dataFiltered.forEach(item => {
    const date = new Date(item.tanggal);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!grupPerBulan[key]) grupPerBulan[key] = [];
    grupPerBulan[key].push(item);
  });

  for (const key in grupPerBulan) {
    const items = grupPerBulan[key];
    const bulan = +key.split("-")[1] - 1;

    const card = document.createElement("div");
    card.className = "bg-white p-4 rounded shadow mb-4";
    let content = `<h2 class="font-semibold text-indigo-700 mb-2">${NAMA_BULAN[bulan]} ${key.split("-")[0]}</h2>`;

    let total = items.reduce((acc, cur) => acc + Number(cur.nominal), 0);
    content += `
      <table class="min-w-full text-sm text-gray-700 border">
        <thead><tr class="bg-gray-100">
          <th class="border p-2">Tanggal</th>
          <th class="border p-2">Kategori</th>
          <th class="border p-2">Nominal</th>
          <th class="border p-2">Keterangan</th>
          <th class="border p-2">Aksi</th>
        </tr></thead>
        <tbody id="bulan-${key}"></tbody>
        <tfoot>
          <tr>
            <td colspan="2" class="text-right font-semibold p-2">Total:</td>
            <td class="font-bold text-blue-700 p-2">Rp ${total.toLocaleString("id-ID")}</td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
    `;

    card.innerHTML = content;
    container.appendChild(card);

    const tbody = card.querySelector(`#bulan-${key}`);
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

  hitungRingkasan();
};

function hitungRingkasan() {
  const tahunFilter = document.getElementById("filterTahun").value;
  const bulanFilter = document.getElementById("filterBulan").value;

  let pengeluaran = 0;
  for (const tanggal in data) {
    const date = new Date(tanggal);
    const tahun = date.getFullYear();
    const bulan = date.getMonth();
    if (tahunFilter && tahun != +tahunFilter) continue;
    if (bulanFilter !== "" && bulan !== +bulanFilter) continue;
    data[tanggal].forEach(item => {
      pengeluaran += Number(item.nominal);
    });
  }

  let key = "";
  if (tahunFilter && bulanFilter !== "") {
    const bulanPad = String(parseInt(bulanFilter) + 1).padStart(2, "0");
    key = `${tahunFilter}-${bulanPad}`;
  }

  const penghasilan = key && penghasilanBulanan[key] ? Number(penghasilanBulanan[key]) : 0;
  const sisa = penghasilan - pengeluaran;

  document.getElementById("ringkasanTotalPenghasilan").textContent = `Rp ${penghasilan.toLocaleString("id-ID")}`;
  document.getElementById("ringkasanTotalPengeluaran").textContent = `Rp ${pengeluaran.toLocaleString("id-ID")}`;
  document.getElementById("ringkasanSisaUang").textContent = `Rp ${sisa.toLocaleString("id-ID")}`;
}

window.editData = function (tanggal, index) {
  const item = data[tanggal][index];
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="date" value="${tanggal}" class="w-full border p-1"></td>
    <td><input type="text" value="${item.kategori}" class="w-full border p-1"></td>
    <td><input type="number" value="${item.nominal}" class="w-full border p-1"></td>
    <td><input type="text" value="${item.keterangan}" class="w-full border p-1"></td>
    <td class="text-center"><button onclick="simpanEdit('${tanggal}', ${index}, this)" class="text-green-600 hover:underline">Simpan</button></td>
  `;
  const tbody = document.getElementById(`bulan-${tanggal.slice(0, 7)}`);
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

async function loadDataDariDatabase() {
  const user = auth.currentUser;
  if (!user) return;
  const snapshot = await database.ref("pengeluaran/" + user.uid).once("value");
  const val = snapshot.val();
  penghasilanBulanan = val?.penghasilan || {};
  data = {};
  for (const key in val) {
    if (key === "penghasilan") continue;
    if (Array.isArray(val[key])) data[key] = val[key];
  }
  tampilkanData();
}

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("btnLogin").classList.add("hidden");
    document.getElementById("btnLogout").classList.remove("hidden");
    document.getElementById("userName").textContent = `👋 Halo, ${user.displayName}`;
    loadDataDariDatabase();
  } else {
    document.getElementById("btnLogin").classList.remove("hidden");
    document.getElementById("btnLogout").classList.add("hidden");
    document.getElementById("userName").textContent = "";
    data = {};
    penghasilanBulanan = {};
    tampilkanData();
  }
});

window.resetData = () => {
  const user = auth.currentUser;
  if (!user) return alert("Anda belum login.");
  if (confirm("Yakin ingin menghapus SEMUA data?")) {
    database.ref("pengeluaran/" + user.uid).remove().then(() => {
      data = {};
      penghasilanBulanan = {};
      tampilkanData();
      alert("✅ Semua data berhasil dihapus.");
    });
  }
};
