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
let data = {}; // key: tanggal, value: array of items
let penghasilan = 0;

// 🔐 Login & Logout
function login() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(error => alert("Login gagal: " + error.message));
}
function logout() {
  auth.signOut();
}

// ➕ Tambah Baris
function tambahBaris() {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td class="border p-1"><input type="date" class="w-full border p-1"></td>
    <td class="border p-1"><input type="text" placeholder="Kategori" class="w-full border p-1"></td>
    <td class="border p-1"><input type="number" placeholder="Nominal" class="w-full border p-1"></td>
    <td class="border p-1"><input type="text" placeholder="Keterangan" class="w-full border p-1"></td>
    <td class="border p-1 text-center"><button onclick="this.closest('tr').remove()" class="text-red-500 hover:underline">Hapus</button></td>
  `;
  document.getElementById("inputRows").appendChild(row);
}
// 💾 Simpan Semua Input ke Struktur Data dan Firebase
function simpanSemua() {
  const rows = document.querySelectorAll("#inputRows tr");
  rows.forEach(row => {
    const inputs = row.querySelectorAll("input");
    const tanggal = inputs[0].value;
    const kategori = inputs[1].value.trim();
    const nominal = inputs[2].value;
    const keterangan = inputs[3].value.trim();

    if (tanggal && kategori && nominal) {
      if (!data[tanggal]) {
        data[tanggal] = [];
      }
      data[tanggal].push({ kategori, nominal, keterangan });
    }
  });

  simpanKeDatabase();
  document.getElementById("inputRows").innerHTML = "";
  tampilkanData();
  hitungSisa();
}

// 🚀 Simpan ke Firebase (struktur per tanggal)
function simpanKeDatabase() {
  const user = auth.currentUser;
  if (!user) {
    console.error("❗ Tidak ada user login saat simpanKeDatabase");
    return;
  }

  const ref = database.ref("pengeluaran/" + user.uid);
  const dataToSave = {
    penghasilan: penghasilan || 0,
    ...data // spread tanggal: [array pengeluaran]
  };

  ref.set(dataToSave)
    .then(() => console.log("✅ Data berhasil disimpan ke Firebase"))
    .catch(err => console.error("❌ Gagal menyimpan data:", err));
}

// 💰 Hitung Sisa Uang
function hitungSisa() {
  let total = 0;
  for (const tanggal in data) {
    for (const item of data[tanggal]) {
      total += Number(item.nominal);
    }
  }
  const sisa = penghasilan - total;
  document.getElementById("totalPengeluaran").value = `Rp ${total.toLocaleString("id-ID")}`;
  document.getElementById("sisaUang").value = `Rp ${sisa.toLocaleString("id-ID")}`;
}
function tampilkanData() {
  const container = document.getElementById("bulanContainer");
  container.innerHTML = "";

  const search = document.getElementById("searchInput").value.toLowerCase();
  const tahunFilter = document.getElementById("filterTahun").value;
  const startDate = document.getElementById("startDate").value ? new Date(document.getElementById("startDate").value) : null;
  const endDate = document.getElementById("endDate").value ? new Date(document.getElementById("endDate").value) : null;

  const dataPerBulan = {};
  const totalPerBulan = Array(12).fill(0);

  // Siapkan semua bulan (Januari - Desember) dengan array kosong
  for (let i = 0; i < 12; i++) {
    dataPerBulan[i] = [];
  }

  // Ubah struktur data jadi format tanggal & isi
  Object.entries(data).forEach(([tanggal, pengeluarans]) => {
    if (tanggal === "penghasilan") return;

    const tgl = new Date(tanggal);
    const bulan = tgl.getMonth();
    const tahun = tgl.getFullYear();

    // Filter berdasarkan tanggal dan tahun
    if (tahunFilter && tahun !== parseInt(tahunFilter)) return;
    if (startDate && tgl < startDate) return;
    if (endDate && tgl > endDate) return;

    pengeluarans.forEach((item, idx) => {
      const cocokSearch =
        item.kategori?.toLowerCase().includes(search) ||
        item.keterangan?.toLowerCase().includes(search);

      if (search && !cocokSearch) return;

      dataPerBulan[bulan].push({
        tanggal,
        ...item,
        index: tanggal + "_" + idx,
        tanggalKey: tanggal,
        idx
      });

      totalPerBulan[bulan] += Number(item.nominal);
    });
  });

  // Tampilkan semua bulan, meskipun datanya kosong
  for (let i = 0; i < 12; i++) {
    const card = document.createElement("div");
    card.className = "bg-white p-4 rounded shadow-md mb-4";
    card.innerHTML = `
      <h2 class="text-lg font-semibold text-indigo-700 mb-2">${NAMA_BULAN[i]}</h2>
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
            <td id="total-${i}" class="p-2 font-bold text-blue-700">Rp ${totalPerBulan[i].toLocaleString("id-ID")}</td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
    `;
    container.appendChild(card);

    const tbody = document.getElementById(`bulan-${i}`);
    dataPerBulan[i].forEach(item => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="border p-1">${item.tanggal}</td>
        <td class="border p-1">${item.kategori}</td>
        <td class="border p-1">Rp ${Number(item.nominal).toLocaleString("id-ID")}</td>
        <td class="border p-1">${item.keterangan || '-'}</td>
        <td class="border p-1 text-center space-x-2">
          <button onclick="editData('${item.tanggalKey}', ${item.idx})" class="text-yellow-600 hover:underline">Edit</button>
          <button onclick="hapusData('${item.tanggalKey}', ${item.idx})" class="text-red-600 hover:underline">Hapus</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  hitungSisa();
}
function editData(tanggalKey, index) {
  const item = data[tanggalKey][index];
  const bulan = new Date(tanggalKey).getMonth();
  const tbody = document.getElementById(`bulan-${bulan}`);
  const rows = Array.from(tbody.children);

  const targetRow = rows.find(row =>
    row.innerText.includes(item.kategori) &&
    row.innerText.includes(item.nominal)
  );

  if (targetRow) {
    const editRow = document.createElement("tr");
    editRow.innerHTML = `
      <td class="border p-1"><input type="date" value="${tanggalKey}" class="w-full border p-1"></td>
      <td class="border p-1"><input type="text" value="${item.kategori}" class="w-full border p-1"></td>
      <td class="border p-1"><input type="number" value="${item.nominal}" class="w-full border p-1"></td>
      <td class="border p-1"><input type="text" value="${item.keterangan}" class="w-full border p-1"></td>
      <td class="border p-1 text-center">
        <button onclick="simpanEdit('${tanggalKey}', ${index}, this)" class="text-green-600 hover:underline">Simpan</button>
      </td>
    `;
    tbody.replaceChild(editRow, targetRow);
  }
}
function simpanEdit(tanggalKey, index, button) {
  const row = button.closest("tr");
  const inputs = row.querySelectorAll("input");

  const tanggalBaru = inputs[0].value;
  const kategori = inputs[1].value;
  const nominal = inputs[2].value;
  const keterangan = inputs[3].value;

  // Jika tanggal berubah, pindahkan ke tanggal baru
  if (tanggalKey !== tanggalBaru) {
    const item = { kategori, nominal, keterangan };
    data[tanggalBaru] = data[tanggalBaru] || [];
    data[tanggalBaru].push(item);
    data[tanggalKey].splice(index, 1);
    if (data[tanggalKey].length === 0) delete data[tanggalKey];
  } else {
    data[tanggalKey][index] = { kategori, nominal, keterangan };
  }

  simpanKeDatabase();
  tampilkanData();
}
function hapusData(tanggalKey, index) {
  if (confirm("Yakin ingin menghapus data ini?")) {
    data[tanggalKey].splice(index, 1);
    if (data[tanggalKey].length === 0) delete data[tanggalKey];
    simpanKeDatabase();
    tampilkanData();
  }
}
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
        if (key === "penghasilan") return; // skip
        if (Array.isArray(value)) {
          data[key] = value;
        }
      });

    } else {
      data = {};
      penghasilan = 0;
      document.getElementById("penghasilan").value = 0;
    }

    tampilkanData();
    hitungSisa();

  } catch (err) {
    console.error("❌ Gagal mengambil data dari Firebase:", err);
  }
}
auth.onAuthStateChanged(async user => {
  const loginBtn = document.getElementById("btnLogin");
  const logoutBtn = document.getElementById("btnLogout");
  const userName = document.getElementById("userName");

  if (user) {
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    userName.textContent = `👋 Halo, ${user.displayName}`;
    await loadDataDariDatabase(); // 🔥 Panggil di sini
  } else {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    userName.textContent = "";
    data = {};
    penghasilan = 0;
    document.getElementById("penghasilan").value = 0;
    tampilkanData();
    hitungSisa();
  }
});

