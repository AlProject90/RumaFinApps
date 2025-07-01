
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

// 🧠 State Data
let data = {}; // pengeluaran
let penghasilanBulanan = {}; // penghasilan per bulan
const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// 🔐 Google Login
window.login = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err => alert("Login gagal: " + err.message));
};

window.logout = () => auth.signOut();

// ➕ Tambah Baris Kosong Input
window.tambahBaris = () => {
  const row = document.createElement("tr");
  row.innerHTML = \`
    <td><input type="date" class="w-full border p-1"></td>
    <td><input type="text" placeholder="Kategori" class="w-full border p-1"></td>
    <td><input type="number" placeholder="Nominal" class="w-full border p-1"></td>
    <td><input type="text" placeholder="Keterangan" class="w-full border p-1"></td>
    <td class="text-center"><button onclick="this.closest('tr').remove()" class="text-red-500 hover:underline">Hapus</button></td>
  \`;
  document.getElementById("inputRows").appendChild(row);
};

// 💾 Simpan Semua Input ke State dan Database
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

// 💰 Simpan Penghasilan Bulanan
window.simpanPenghasilanPerBulan = () => {
  const bulan = document.getElementById("inputPenghasilanBulan").value;
  const tahun = document.getElementById("inputPenghasilanTahun").value;
  const nominal = Number(document.getElementById("inputPenghasilanNominal").value);

  if (!bulan || !tahun || isNaN(nominal)) {
    return alert("Isi bulan, tahun, dan nominal dengan benar");
  }

  const key = \`\${tahun}-\${String(Number(bulan) + 1).padStart(2, "0")}\`;
  penghasilanBulanan[key] = nominal;
  simpanKeDatabase();
  tampilkanData();
  hitungRingkasan();
};

// 🔁 Simpan Data ke Firebase
function simpanKeDatabase() {
  const user = auth.currentUser;
  if (user) {
    database.ref("pengeluaran/" + user.uid).set({
      penghasilan: penghasilanBulanan,
      ...data
    });
  }
}

// 🔄 Reset Filter
window.resetFilter = () => {
  ["searchInput", "filterTahun", "startDate", "endDate", "filterBulan"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  tampilkanData();
};

// 🔍 Tampilkan Data Berdasarkan Filter
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
        dataFiltered.push({ ...item, tanggal: tglStr, index: \`\${tglStr}_\${i}\` });
      }
    });
  });

  // Grouping dan Tampilkan
  const grupPerBulan = {};
  dataFiltered.forEach(item => {
    const date = new Date(item.tanggal);
    const key = \`\${date.getFullYear()}-\${String(date.getMonth() + 1).padStart(2, "0")}\`;
    if (!grupPerBulan[key]) grupPerBulan[key] = [];
    grupPerBulan[key].push(item);
  });

  for (const key in grupPerBulan) {
    const items = grupPerBulan[key];
    const bulan = +key.split("-")[1] - 1;
    const card = document.createElement("div");
    card.className = "bg-white p-4 rounded shadow mb-4";
    let content = \`<h2 class="font-semibold text-indigo-700 mb-2">\${NAMA_BULAN[bulan]} \${key.split("-")[0]}</h2>\`;
    let total = items.reduce((acc, cur) => acc + Number(cur.nominal), 0);
    content += \`
      <table class="min-w-full text-sm text-gray-700 border">
        <thead><tr class="bg-gray-100">
          <th class="border p-2">Tanggal</th>
          <th class="border p-2">Kategori</th>
          <th class="border p-2">Nominal</th>
          <th class="border p-2">Keterangan</th>
          <th class="border p-2">Aksi</th>
        </tr></thead>
        <tbody id="bulan-\${key}"></tbody>
        <tfoot>
          <tr>
            <td colspan="2" class="text-right font-semibold p-2">Total:</td>
            <td class="font-bold text-blue-700 p-2">Rp \${total.toLocaleString("id-ID")}</td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
    \`;
    card.innerHTML = content;
    container.appendChild(card);

    // Render Baris
    const tbody = card.querySelector(\`#bulan-\${key}\`);
    items.forEach((item, idx) => {
      const row = document.createElement("tr");
      row.innerHTML = \`
        <td class="border p-1">\${item.tanggal}</td>
        <td class="border p-1">\${item.kategori}</td>
        <td class="border p-1">Rp \${Number(item.nominal).toLocaleString("id-ID")}</td>
        <td class="border p-1">\${item.keterangan || '-'}</td>
        <td class="border p-1 text-center">
          <button onclick="editData('\${item.tanggal}', \${idx})" class="text-yellow-600 hover:underline">Edit</button>
          <button onclick="hapusData('\${item.tanggal}', \${idx})" class="text-red-600 hover:underline">Hapus</button>
        </td>
      \`;
      tbody.appendChild(row);
    });
  }

  hitungRingkasan();
};
