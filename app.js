// ✅ Firebase config & Inisialisasi
const firebaseConfig = {
  apiKey: "AIzaSyCtXSM2NOuH4ruhasx7O7rzxTxxKfYdTts",
  authDomain: "rumafinapps.firebaseapp.com",
  databaseURL: "https://rumafinapps-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rumafinapps",
  storageBucket: "rumafinapps.firebasestorage.app",
  messagingSenderId: "456685667439",
  appId: "1:456685667439:web:f1254845968302a084f99a"
};

// ✅ Firebase config dan inisialisasi
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

const NAMA_BULAN = ["JANUARI","FEBRUARI","MARET","APRIL","MEI","JUNI","JULI","AGUSTUS","SEPTEMBER","OKTOBER","NOVEMBER","DESEMBER"];
let data = [];
let penghasilan = 0;

// 🔐 Login & Logout
function login() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(error => alert("Login gagal: " + error.message));
}
function logout() {
  auth.signOut();
}

// ✅ Tambah Baris
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

// ✅ Simpan ke Database
function simpanSemua() {
  const rows = document.querySelectorAll("#inputRows tr");
  const tempData = [];
  rows.forEach(row => {
    const inputs = row.querySelectorAll("input");
    const tanggal = inputs[0].value;
    const kategori = inputs[1].value;
    const nominal = inputs[2].value;
    const keterangan = inputs[3].value;
    if (tanggal && kategori && nominal) {
      tempData.push({ tanggal, kategori, nominal, keterangan });
    }
  });
  if (tempData.length > 0) {
    data = data.concat(tempData);
    simpanKeDatabase();
    document.getElementById("inputRows").innerHTML = "";
    tampilkanData();
    hitungSisa();
  } else {
    alert("Isi minimal satu baris data pengeluaran sebelum disimpan.");
  }
}

function simpanKeDatabase() {
  const user = auth.currentUser;
  if (user) {
    database.ref("pengeluaran/" + user.uid).set({ penghasilan, data });
  }
}

// ✅ Hitung Sisa
function hitungSisa() {
  const total = data.reduce((sum, item) => sum + Number(item.nominal), 0);
  const sisa = penghasilan - total;
  document.getElementById("totalPengeluaran").value = `Rp ${total.toLocaleString("id-ID")}`;
  document.getElementById("sisaUang").value = `Rp ${sisa.toLocaleString("id-ID")}`;
}

// ✅ Tampilkan Data
function tampilkanData() {
  const container = document.getElementById("bulanContainer");
  container.innerHTML = "";

  const totalPerBulan = Array(12).fill(0);
  const search = document.getElementById("searchInput").value.toLowerCase();
  const tahunFilter = document.getElementById("filterTahun").value;
  const startDate = document.getElementById("startDate").value ? new Date(document.getElementById("startDate").value) : null;
  const endDate = document.getElementById("endDate").value ? new Date(document.getElementById("endDate").value) : null;

  // Filter data berdasarkan input pencarian dan tanggal
  const dataFiltered = data.map((item, index) => ({ ...item, index })).filter(item => {
    const tgl = new Date(item.tanggal);
    const tahun = tgl.getFullYear();

    if (search && !(item.kategori.toLowerCase().includes(search) || (item.keterangan || "").toLowerCase().includes(search))) return false;
    if (tahunFilter && tahun !== parseInt(tahunFilter)) return false;
    if (startDate && tgl < startDate) return false;
    if (endDate && tgl > endDate) return false;

    return true;
  });

  // Siapkan 12 bulan, bahkan jika tidak ada data
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
            <td id="total-${i}" class="p-2 font-bold text-blue-700"></td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
    `;
    container.appendChild(card);
  }

  dataFiltered.forEach(item => {
    const bulan = new Date(item.tanggal).getMonth();
    const tbody = document.getElementById(`bulan-${bulan}`);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="border p-1">${item.tanggal}</td>
      <td class="border p-1">${item.kategori}</td>
      <td class="border p-1">Rp ${Number(item.nominal).toLocaleString("id-ID")}</td>
      <td class="border p-1">${item.keterangan || '-'}</td>
      <td class="border p-1 text-center space-x-2">
        <button onclick="editData(${item.index})" class="text-yellow-600 hover:underline">Edit</button>
        <button onclick="hapusData(${item.index})" class="text-red-600 hover:underline">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
    totalPerBulan[bulan] += Number(item.nominal);
  });

  totalPerBulan.forEach((total, i) => {
    const td = document.getElementById(`total-${i}`);
    if (td) td.textContent = `Rp ${total.toLocaleString("id-ID")}`;
  });

  hitungSisa();
}
function simpanEdit(index, btn) {
  const row = btn.closest("tr");
  const inputs = row.querySelectorAll("input");
  const tanggal = inputs[0].value;
  const kategori = inputs[1].value;
  const nominal = inputs[2].value;
  const keterangan = inputs[3].value;

  if (tanggal && kategori && nominal) {
    data[index] = { tanggal, kategori, nominal, keterangan };
    simpanKeDatabase();
    tampilkanData();
    hitungSisa();
  } else {
    alert("Semua kolom harus diisi untuk menyimpan perubahan.");
  }
}

function hapusData(index) {
  if (confirm("Yakin ingin menghapus data ini?")) {
    data.splice(index, 1);
    simpanKeDatabase();
    tampilkanData();
    hitungSisa();
  }
}

// 🧠 Event Listener
window.onload = () => {
  document.getElementById("btnLogin").onclick = login;
  document.getElementById("btnLogout").onclick = logout;
  document.getElementById("btnTambah").onclick = tambahBaris;
  document.getElementById("btnSimpan").onclick = simpanSemua;
  document.getElementById("btnCari").onclick = tampilkanData;
  document.getElementById("btnResetFilter").onclick = () => {
    document.getElementById("searchInput").value = "";
    document.getElementById("filterBulan").value = "";
    document.getElementById("filterBulanAkhir").value = "";
    document.getElementById("filterTahun").value = "";
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";
    tampilkanData();
  };

  auth.onAuthStateChanged(user => {
    if (user) {
      document.getElementById("btnLogin").classList.add("hidden");
      document.getElementById("btnLogout").classList.remove("hidden");
      document.getElementById("userName").textContent = `👤 ${user.displayName}`;
      database.ref("pengeluaran/" + user.uid).once("value", snap => {
        if (snap.exists()) {
          data = snap.val().data || [];
          penghasilan = snap.val().penghasilan || 0;
        }
        document.getElementById("penghasilan").value = penghasilan;
        tampilkanData();
        hitungSisa();
      });
    } else {
      document.getElementById("btnLogin").classList.remove("hidden");
      document.getElementById("btnLogout").classList.add("hidden");
      document.getElementById("userName").textContent = "";
    }
  });

  document.getElementById("btnEditPenghasilan").onclick = () => {
    const nilai = parseInt(document.getElementById("penghasilan").value);
    if (!isNaN(nilai)) {
      penghasilan = nilai;
      simpanKeDatabase();
      hitungSisa();
    }
  };
};
