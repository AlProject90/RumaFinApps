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
let penghasilan = 0;

// 🔐 Login & Logout
function login() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(error => alert("Login gagal: " + error.message));
}
function logout() {
  auth.signOut();
}

// ➕ Tambah Baris Input
function tambahBaris() {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="date" class="w-full border p-1"></td>
    <td><input type="text" placeholder="Kategori" class="w-full border p-1"></td>
    <td><input type="number" placeholder="Nominal" class="w-full border p-1"></td>
    <td><input type="text" placeholder="Keterangan" class="w-full border p-1"></td>
    <td class="text-center"><button onclick="this.closest('tr').remove()" class="text-red-500 hover:underline">Hapus</button></td>
  `;
  document.getElementById("inputRows").appendChild(row);
}

// 💾 Simpan Input ke Firebase
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
      data[tanggal].push({ tanggal, kategori, nominal, keterangan });
    }
  });

  simpanKeDatabase();
  document.getElementById("inputRows").innerHTML = "";
  tampilkanData();
  hitungSisa();
}

function simpanKeDatabase() {
  const user = auth.currentUser;
  if (user) {
    database.ref("pengeluaran/" + user.uid).set({ penghasilan, ...data })
      .then(() => console.log("✅ Data disimpan"))
      .catch(err => console.error("❌ Gagal simpan:", err));
  }
}

function hitungSisa() {
  let total = 0;
  for (const tanggal in data) {
    for (const item of data[tanggal]) {
      total += Number(item.nominal);
    }
  }
  const sisa = penghasilan - total;
  document.getElementById("totalPengeluaran").textContent = `Rp ${total.toLocaleString("id-ID")}`;
  document.getElementById("sisaUang").textContent = `Rp ${sisa.toLocaleString("id-ID")}`;
}

function resetFilter() {
  document.getElementById("searchInput").value = "";
  document.getElementById("filterTahun").value = "";
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  tampilkanData();
}

function resetData() {
  if (!confirm("Yakin ingin menghapus semua data?")) return;
  const user = auth.currentUser;
  if (user) {
    database.ref("pengeluaran/" + user.uid).remove()
      .then(() => {
        data = {};
        penghasilan = 0;
        document.getElementById("penghasilan").value = 0;
        tampilkanData();
        hitungSisa();
        alert("✅ Semua data berhasil direset");
      })
      .catch(err => alert("❌ Gagal mereset: " + err.message));
  }
}

function tampilkanData() {
  const container = document.getElementById("bulanContainer");
  container.innerHTML = "";

  const totalPerBulan = Array(12).fill(0);
  const search = document.getElementById("searchInput").value.toLowerCase();
  const tahunFilter = document.getElementById("filterTahun").value;
  const startDateVal = document.getElementById("startDate").value;
  const endDateVal = document.getElementById("endDate").value;

  const startDate = startDateVal ? new Date(startDateVal) : null;
  const endDate = endDateVal ? new Date(endDateVal) : null;

  const semuaTanggal = Object.keys(data || {}).filter(key => /^\d{4}-\d{2}-\d{2}$/.test(key));
  const dataFiltered = [];

  semuaTanggal.forEach(tglStr => {
    const items = data[tglStr];
    if (!Array.isArray(items)) return;

    const tgl = new Date(tglStr);
    const bulan = tgl.getMonth();
    const tahun = tgl.getFullYear();

    if (tahunFilter && tahun != parseInt(tahunFilter)) return;
    if (startDate && tgl < startDate) return;
    if (endDate && tgl > endDate) return;

    items.forEach((item, i) => {
      const cocokCari = !search || (
        item.kategori?.toLowerCase().includes(search) ||
        item.keterangan?.toLowerCase().includes(search)
      );
      if (cocokCari) {
        dataFiltered.push({ ...item, tanggal: tglStr, index: `${tglStr}_${i}` });
      }
    });
  });

  const grupPerBulan = {};
  dataFiltered.forEach(item => {
    const bulan = new Date(item.tanggal).getMonth();
    if (!grupPerBulan[bulan]) grupPerBulan[bulan] = [];
    grupPerBulan[bulan].push(item);
    totalPerBulan[bulan] += Number(item.nominal);
  });

  for (let i = 0; i < 12; i++) {
    const items = grupPerBulan[i] || [];
    const card = document.createElement("div");
    card.className = "bg-white dark:bg-gray-800 p-4 rounded shadow mb-4";
    card.innerHTML = `
      <h2 class="font-semibold text-indigo-700 dark:text-indigo-300 mb-2">${NAMA_BULAN[i]}</h2>
      <table class="min-w-full text-sm text-gray-700 dark:text-gray-200 border">
        <thead>
          <tr class="bg-gray-100 dark:bg-gray-700">
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
            <td class="p-2 font-bold text-blue-700 dark:text-blue-300">Rp ${totalPerBulan[i].toLocaleString("id-ID")}</td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
    `;
    container.appendChild(card);

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
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  hitungSisa();
}

function exportToExcel() {
  let all = [];
  Object.keys(data).forEach(tgl => {
    data[tgl].forEach(item => {
      all.push({ Tanggal: tgl, Kategori: item.kategori, Nominal: item.nominal, Keterangan: item.keterangan });
    });
  });
  const ws = XLSX.utils.json_to_sheet(all);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data Pengeluaran");
  XLSX.writeFile(wb, "data_pengeluaran.xlsx");
}

function editData(tanggal, index) {
  const item = data[tanggal][index];
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="date" value="${tanggal}" class="w-full border p-1"></td>
    <td><input type="text" value="${item.kategori}" class="w-full border p-1"></td>
    <td><input type="number" value="${item.nominal}" class="w-full border p-1"></td>
    <td><input type="text" value="${item.keterangan}" class="w-full border p-1"></td>
    <td class="text-center">
      <button onclick="simpanEdit('${tanggal}', ${index}, this)" class="text-green-600 hover:underline">Simpan</button>
    </td>
  `;
  const tbody = document.getElementById(`bulan-${new Date(tanggal).getMonth()}`);
  const rows = Array.from(tbody.children);
  tbody.replaceChild(row, rows[index]);
}

function simpanEdit(tanggal, index, button) {
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
}

function hapusData(tanggal, index) {
  if (confirm("Yakin ingin menghapus data ini?")) {
    data[tanggal].splice(index, 1);
    if (data[tanggal].length === 0) delete data[tanggal];
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
        if (key === "penghasilan") return;
        if (Array.isArray(value)) {
          const fixedItems = value.map(item => ({ ...item, tanggal: item.tanggal || key }));
          data[key] = fixedItems;
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
    console.error("❌ Gagal mengambil data:", err);
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
    await loadDataDariDatabase();
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

document.getElementById("penghasilan")?.addEventListener("change", e => {
  penghasilan = Number(e.target.value);
  simpanKeDatabase();
  hitungSisa();
});
