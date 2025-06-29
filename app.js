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

// ✅ Simpan Semua
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

// ✅ Simpan ke Firebase
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

// ✅ Hapus Data
function hapusData(index) {
  if (confirm("Yakin ingin menghapus data ini?")) {
    data.splice(index, 1);
    simpanKeDatabase();
    tampilkanData();
    hitungSisa();
  }
}

// ✅ Edit & Simpan Edit
function editData(index) {
  const item = data[index];
  const formRow = document.createElement("tr");
  formRow.innerHTML = `
    <td class="border p-1"><input type="date" value="${item.tanggal}" class="w-full border p-1"></td>
    <td class="border p-1"><input type="text" value="${item.kategori}" class="w-full border p-1"></td>
    <td class="border p-1"><input type="number" value="${item.nominal}" class="w-full border p-1"></td>
    <td class="border p-1"><input type="text" value="${item.keterangan || ''}" class="w-full border p-1"></td>
    <td class="border p-1 text-center">
      <button onclick="simpanEdit(${index}, this)" class="text-green-600 hover:underline">💾 Simpan</button>
    </td>
  `;

  const tbody = document.getElementById(`bulan-${new Date(item.tanggal).getMonth()}`);
  const oldRow = tbody.querySelectorAll("tr")[getRowIndexByIndex(index, dataFiltered)];
  oldRow.replaceWith(formRow);
}

function simpanEdit(index, button) {
  const row = button.closest("tr");
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
    alert("Semua data harus diisi!");
  }
}

function getRowIndexByIndex(targetIndex, filteredData) {
  return filteredData.findIndex(item => item.index === targetIndex);
}

// ✅ Tampilkan Data
function tampilkanData() {
  const container = document.getElementById("bulanContainer");
  container.innerHTML = "";

  const totalPerBulan = Array(12).fill(0);
  const search = document.getElementById("searchInput").value.toLowerCase();
  const bulanAwal = parseInt(document.getElementById("filterBulan").value);
  const bulanAkhir = parseInt(document.getElementById("filterBulanAkhir").value);
  const tahunFilter = document.getElementById("filterTahun").value;
  const startDate = document.getElementById("startDate").value ? new Date(document.getElementById("startDate").value) : null;
  const endDate = document.getElementById("endDate").value ? new Date(document.getElementById("endDate").value) : null;

  const dataFiltered = data.map((item, index) => ({ ...item, index })).filter(item => {
    const tgl = new Date(item.tanggal);
    const bulan = tgl.getMonth();
    const tahun = tgl.getFullYear();

    if (search && !(item.kategori.toLowerCase().includes(search) || (item.keterangan || "").toLowerCase().includes(search))) return false;
    if (!isNaN(bulanAwal) && bulan < bulanAwal) return false;
    if (!isNaN(bulanAkhir) && bulan > bulanAkhir) return false;
    if (tahunFilter && tahun !== parseInt(tahunFilter)) return false;
    if (startDate && tgl < startDate) return false;
    if (endDate && tgl > endDate) return false;

    return true;
  });

  const bulanUnik = [...new Set(dataFiltered.map(item => new Date(item.tanggal).getMonth()))];

  bulanUnik.forEach(i => {
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
  });

  dataFiltered.forEach(item => {
    const bulan = new Date(item.tanggal).getMonth();
    const tbody = document.getElementById(`bulan-${bulan}`);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="border p-2">${item.tanggal}</td>
      <td class="border p-2">${item.kategori}</td>
      <td class="border p-2">Rp ${Number(item.nominal).toLocaleString("id-ID")}</td>
      <td class="border p-2">${item.keterangan || ""}</td>
      <td class="border p-2 text-center">
        <button class="text-blue-500 hover:underline mr-2" onclick="editData(${item.index})">✏️ Edit</button>
        <button class="text-red-500 hover:underline" onclick="hapusData(${item.index})">🗑 Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);

    totalPerBulan[bulan] += Number(item.nominal);
  });

  bulanUnik.forEach(i => {
    document.getElementById(`total-${i}`).textContent = `Rp ${totalPerBulan[i].toLocaleString("id-ID")}`;
  });
}

// ✅ Event Listener
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnLogin").addEventListener("click", login);
  document.getElementById("btnLogout").addEventListener("click", logout);
  document.getElementById("btnTambah").addEventListener("click", tambahBaris);
  document.getElementById("btnSimpan").addEventListener("click", simpanSemua);
  document.getElementById("btnCari").addEventListener("click", tampilkanData);
  document.getElementById("btnResetFilter").addEventListener("click", () => {
    document.getElementById("searchInput").value = "";
    document.getElementById("filterBulan").value = "";
    document.getElementById("filterBulanAkhir").value = "";
    document.getElementById("filterTahun").value = "";
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";
    tampilkanData();
  });

  auth.onAuthStateChanged(user => {
    if (user) {
      document.getElementById("btnLogin").classList.add("hidden");
      document.getElementById("btnLogout").classList.remove("hidden");
      document.getElementById("userName").textContent = `👋 Halo, ${user.displayName}`;
      database.ref("pengeluaran/" + user.uid).once("value", snapshot => {
        const val = snapshot.val();
        if (val) {
          penghasilan = val.penghasilan || 0;
          data = val.data || [];
          document.getElementById("penghasilan").value = penghasilan;
          tampilkanData();
          hitungSisa();
        }
      });
    } else {
      document.getElementById("btnLogin").classList.remove("hidden");
      document.getElementById("btnLogout").classList.add("hidden");
      document.getElementById("userName").textContent = "";
    }
  });

  document.getElementById("btnEditPenghasilan").addEventListener("click", () => {
    penghasilan = Number(document.getElementById("penghasilan").value);
    simpanKeDatabase();
    hitungSisa();
  });
});
