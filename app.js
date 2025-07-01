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

// 🧠 State Global
let data = {};
let penghasilanBulanan = {};
const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// 🔐 Login/Logout
window.login = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err => alert("Login gagal: " + err.message));
};

window.logout = () => auth.signOut();

// 🔄 Load Data dari Firebase
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

// 🔁 Simpan ke Database
function simpanKeDatabase() {
  const user = auth.currentUser;
  if (user) {
    database.ref("pengeluaran/" + user.uid).set({
      penghasilan: penghasilanBulanan,
      ...data
    });
  }
}

// ➕ Tambah Baris Kosong
window.tambahBaris = () => {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="date" class="form-control"></td>
    <td><input type="text" placeholder="Kategori" class="form-control"></td>
    <td><input type="number" placeholder="Nominal" class="form-control"></td>
    <td><input type="text" placeholder="Keterangan" class="form-control"></td>
    <td><button onclick="this.closest('tr').remove()" class="btn btn-sm btn-danger">Hapus</button></td>
  `;
  document.getElementById("inputRows").appendChild(row);
};

// 💾 Simpan Semua Data
window.simpanSemua = () => {
  const rows = document.querySelectorAll("#inputRows tr");
  rows.forEach(row => {
    const inputs = row.querySelectorAll("input");
    const tanggal = inputs[0].value;
    const kategori = inputs[1].value;
    const nominal = inputs[2].value;
    const keterangan = inputs[3].value;
    if (tanggal && kategori && nominal) {
      if (!data[tanggal]) data[tanggal] = [];
      data[tanggal].push({ tanggal, kategori, nominal, keterangan });
    }
  });
  document.getElementById("inputRows").innerHTML = "";
  simpanKeDatabase();
  tampilkanData();
};

// 💰 Simpan Penghasilan
window.simpanPenghasilanPerBulan = () => {
  const bulan = document.getElementById("inputPenghasilanBulan").value;
  const tahun = document.getElementById("inputPenghasilanTahun").value;
  const nominal = Number(document.getElementById("inputPenghasilanNominal").value);
  if (!bulan || !tahun || isNaN(nominal)) {
    return alert("Mohon lengkapi bulan, tahun, dan nominal penghasilan.");
  }
  const key = `${tahun}-${String(Number(bulan) + 1).padStart(2, "0")}`;
  penghasilanBulanan[key] = nominal;
  simpanKeDatabase();
  tampilkanData();
};

// 🔍 Filter dan Tampilkan
window.tampilkanData = () => {
  const container = document.getElementById("bulanContainer");
  container.innerHTML = "";

  const tahunFilter = document.getElementById("filterTahun").value;
  const bulanFilter = document.getElementById("filterBulan").value;
  const search = document.getElementById("searchInput").value.toLowerCase();
  const startDate = document.getElementById("startDate").valueAsDate;
  const endDate = document.getElementById("endDate").valueAsDate;

  const hasil = [];

  Object.keys(data).forEach(tanggal => {
    const list = data[tanggal];
    const tgl = new Date(tanggal);
    const tahun = tgl.getFullYear();
    const bulan = tgl.getMonth();

    if (tahunFilter && tahun != +tahunFilter) return;
    if (bulanFilter !== "" && bulan !== +bulanFilter) return;
    if (startDate && tgl < startDate) return;
    if (endDate && tgl > endDate) return;

    list.forEach((item, index) => {
      const cocok = !search || item.kategori.toLowerCase().includes(search) || item.keterangan.toLowerCase().includes(search);
      if (cocok) hasil.push({ ...item, index, tanggal });
    });
  });

  const grup = {};
  hasil.forEach(item => {
    const tgl = new Date(item.tanggal);
    const key = `${tgl.getFullYear()}-${String(tgl.getMonth() + 1).padStart(2, "0")}`;
    if (!grup[key]) grup[key] = [];
    grup[key].push(item);
  });

  for (const key in grup) {
    const list = grup[key];
    const bulan = +key.split("-")[1] - 1;
    const tahun = key.split("-")[0];

    const card = document.createElement("div");
    card.className = "card p-3 mb-4";
    let html = `<h5>${NAMA_BULAN[bulan]} ${tahun}</h5>`;
    html += `
      <table class="table table-bordered">
        <thead>
          <tr><th>Tanggal</th><th>Kategori</th><th>Nominal</th><th>Keterangan</th><th>Aksi</th></tr>
        </thead><tbody id="bulan-${key}"></tbody>
      </table>
    `;
    card.innerHTML = html;
    container.appendChild(card);

    const tbody = card.querySelector(`#bulan-${key}`);
    list.forEach((item, i) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.tanggal}</td>
        <td>${item.kategori}</td>
        <td>Rp ${Number(item.nominal).toLocaleString("id-ID")}</td>
        <td>${item.keterangan || "-"}</td>
        <td>
          <button onclick="editData('${item.tanggal}', ${i})" class="btn btn-sm btn-warning">Edit</button>
          <button onclick="hapusData('${item.tanggal}', ${i})" class="btn btn-sm btn-danger">Hapus</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  hitungRingkasan();
};
