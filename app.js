// ... [✅ Firebase config dan inisialisasi tetap seperti sebelumnya] ...

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
    const bulan = new
