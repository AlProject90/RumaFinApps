// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCtXSM2NOuH4ruhasx7O7rzxTxxKfYdTts",
  authDomain: "rumafinapps.firebaseapp.com",
  projectId: "rumafinapps",
  storageBucket: "rumafinapps.appspot.com",
  messagingSenderId: "456685667439",
  appId: "1:456685667439:web:f1254845968302a084f99a"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

const NAMA_BULAN = ["JANUARI","FEBRUARI","MARET","APRIL","MEI","JUNI","JULI","AGUSTUS","SEPTEMBER","OKTOBER","NOVEMBER","DESEMBER"];
let data = [];

document.getElementById("btnLogin").addEventListener("click", login);
document.getElementById("btnLogout").addEventListener("click", logout);
document.getElementById("btnTambah").addEventListener("click", tambahBaris);
document.getElementById("btnSimpan").addEventListener("click", simpanSemua);
document.getElementById("btnExport").addEventListener("click", eksporExcel);
document.getElementById("btnReset").addEventListener("click", resetData);
document.getElementById("btnCari").addEventListener("click", tampilkanData);
document.getElementById("btnResetFilter").addEventListener("click", resetFilter);

auth.onAuthStateChanged(user => {
  const loginBtn = document.getElementById("btnLogin");
  const logoutBtn = document.getElementById("btnLogout");
  if (user) {
    document.getElementById("userName").textContent = `👋 Halo, ${user.displayName}`;
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    database.ref("pengeluaran/" + user.uid).once("value").then(snapshot => {
      data = snapshot.val() || [];
      tampilkanData();
      hitungSisa();
    });
  } else {
    document.getElementById("userName").textContent = "";
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    data = [];
    tampilkanData();
    hitungSisa();
  }
});

function login() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(error => alert("Login gagal: " + error.message));
}

function logout() {
  auth.signOut();
}

function tambahBaris() {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td class="border p-1"><input type="date" class="w-full border rounded p-1"></td>
    <td class="border p-1"><input type="text" placeholder="Kategori" class="w-full border rounded p-1"></td>
    <td class="border p-1"><input type="number" placeholder="Nominal" class="w-full border rounded p-1"></td>
    <td class="border p-1"><input type="text" placeholder="Keterangan" class="w-full border rounded p-1"></td>
    <td class="border p-1 text-center"><button onclick="this.closest('tr').remove()" class="text-red-500 hover:underline">Hapus</button></td>
  `;
  document.getElementById("inputRows").appendChild(row);
}

function simpanSemua() {
  const rows = document.querySelectorAll("#inputRows tr");
  rows.forEach(row => {
    const inputs = row.querySelectorAll("input");
    const tanggal = inputs[0].value;
    const kategori = inputs[1].value;
    const nominal = inputs[2].value;
    const keterangan = inputs[3].value;
    if (tanggal && kategori && nominal) {
      data.push({ tanggal, kategori, nominal, keterangan });
    }
  });
  simpanKeDatabase(data);
  document.getElementById("inputRows").innerHTML = "";
  tampilkanData();
  hitungSisa();
}

function hitungSisa() {
  const penghasilan = Number(document.getElementById("penghasilan").value);
  const total = data.reduce((sum, item) => sum + Number(item.nominal), 0);
  const sisa = penghasilan - total;
  document.getElementById("totalPengeluaran").value = `Rp ${total.toLocaleString("id-ID")}`;
  document.getElementById("sisaUang").value = `Rp ${sisa.toLocaleString("id-ID")}`;
}

function tampilkanData() {
  const container = document.getElementById("bulanContainer");
  container.innerHTML = "";
  const totalPerBulan = Array(12).fill(0);

  const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
  const bulanFilter = document.getElementById("filterBulan")?.value;
  const tahunFilter = document.getElementById("filterTahun")?.value;
  const startDate = document.getElementById("startDate")?.value ? new Date(document.getElementById("startDate").value) : null;
  const endDate = document.getElementById("endDate")?.value ? new Date(document.getElementById("endDate").value) : null;

  for (let i = 0; i < 12; i++) {
    const card = document.createElement("div");
    card.className = "bg-white p-4 rounded shadow-md";
    card.dataset.bulan = i;
    card.innerHTML = `
      <h2 class="text-lg font-semibold text-indigo-700 mb-2">${NAMA_BULAN[i]}</h2>
      <table class="min-w-full text-sm text-gray-700 border">
        <thead>
          <tr class="bg-gray-100">
            <th class="border p-2">Tanggal</th>
            <th class="border p-2">Kategori</th>
            <th class="border p-2">Nominal</th>
            <th class="border p-2">Keterangan</th>
          </tr>
        </thead>
        <tbody id="bulan-${i}"></tbody>
        <tfoot>
          <tr>
            <td colspan="2" class="text-right p-2 font-semibold">Total:</td>
            <td id="total-${i}" class="p-2 font-bold text-blue-700"></td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    `;
    container.appendChild(card);
  }

  data.filter(item => {
    const tgl = new Date(item.tanggal);
    const bulan = tgl.getMonth();
    const tahun = tgl.getFullYear();
    if (search && !(item.kategori.toLowerCase().includes(search) || item.keterangan?.toLowerCase().includes(search))) return false;
    if (bulanFilter !== "" && bulan != bulanFilter) return false;
    if (tahunFilter && tahun != tahunFilter) return false;
    if (startDate && tgl < startDate) return false;
    if (endDate && tgl > endDate) return false;
    return true;
  }).forEach(item => {
    const bulan = new Date(item.tanggal).getMonth();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="border p-1">${item.tanggal}</td>
      <td class="border p-1">${item.kategori}</td>
      <td class="border p-1">Rp ${Number(item.nominal).toLocaleString("id-ID")}</td>
      <td class="border p-1">${item.keterangan || '-'}</td>
    `;
    document.getElementById(`bulan-${bulan}`).appendChild(tr);
    totalPerBulan[bulan] += Number(item.nominal);
  });

  totalPerBulan.forEach((total, i) => {
    document.getElementById(`total-${i}`).textContent = `Rp ${total.toLocaleString("id-ID")}`;
  });
}

function eksporExcel() {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pengeluaran");
  XLSX.writeFile(wb, "pengeluaran_rumah_tangga.xlsx");
}

function resetData() {
  if (confirm("Yakin ingin menghapus semua data?")) {
    const user = auth.currentUser;
    if (user) database.ref("pengeluaran/" + user.uid).remove();
    data = [];
    tampilkanData();
    hitungSisa();
  }
}

function simpanKeDatabase(data) {
  const user = auth.currentUser;
  if (!user) return;
  database.ref("pengeluaran/" + user.uid).set(data);
}

function resetFilter() {
  document.getElementById("searchInput").value = "";
  document.getElementById("filterBulan").value = "";
  document.getElementById("filterTahun").value = "";
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  tampilkanData();
}

// Tambah opsi "Semua Bulan" saat halaman dimuat
window.addEventListener("DOMContentLoaded", () => {
  const bulanSelect = document.getElementById("filterBulan");
  const optionAll = document.createElement("option");
  optionAll.value = "";
  optionAll.textContent = "Semua Bulan";
  bulanSelect.appendChild(optionAll);

  for (let i = 0; i < 12; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = NAMA_BULAN[i];
    bulanSelect.appendChild(option);
  }
});
