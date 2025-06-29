// Inisialisasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCtXSM2NOuH4ruhasx7O7rzxTxxKfYdTts",
  authDomain: "rumafinapps.firebaseapp.com",
  databaseURL: "https://rumafinapps-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rumafinapps",
  storageBucket: "rumafinapps.firebasestorage.app",
  messagingSenderId: "456685667439",
  appId: "1:456685667439:web:f1254845968302a084f99a"
};
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// Referensi Elemen DOM
const userName = document.getElementById("userName");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const penghasilanInput = document.getElementById("penghasilan");
const penghasilanDisplay = document.getElementById("penghasilanDisplay");
const totalPengeluaran = document.getElementById("totalPengeluaran");
const sisaUang = document.getElementById("sisaUang");
const inputRows = document.getElementById("inputRows");
const bulanContainer = document.getElementById("bulanContainer");

let currentUser = null;

// Autentikasi Login Google
function login() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
}
function logout() {
  auth.signOut();
}
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    userName.textContent = `👋 Halo, ${user.displayName}`;
    btnLogin.classList.add("hidden");
    btnLogout.classList.remove("hidden");
    loadData();
  } else {
    currentUser = null;
    userName.textContent = "";
    btnLogin.classList.remove("hidden");
    btnLogout.classList.add("hidden");
    inputRows.innerHTML = "";
    bulanContainer.innerHTML = "";
  }
});

// Fungsi Tambah, Simpan, Edit, Hapus
function tambahBaris() {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="date" class="border p-1 rounded" /></td>
    <td><input type="text" class="border p-1 rounded" /></td>
    <td><input type="number" class="border p-1 rounded" /></td>
    <td><input type="text" class="border p-1 rounded" /></td>
    <td><button onclick="hapusBaris(this)" class="text-red-600">Hapus</button></td>
  `;
  inputRows.appendChild(row);
}

function hapusBaris(btn) {
  btn.closest("tr").remove();
}

function simpanSemua() {
  if (!currentUser) return alert("Harap login terlebih dahulu.");
  const rows = inputRows.querySelectorAll("tr");
  const uid = currentUser.uid;
  const updates = {};
  rows.forEach((row, i) => {
    const [tgl, kat, nom, ket] = row.querySelectorAll("input");
    if (!tgl.value || !kat.value || !nom.value) return;
    const tanggal = tgl.value;
    updates[`users/${uid}/pengeluaran/${tanggal}/${Date.now()}`] = {
      tanggal,
      kategori: kat.value,
      nominal: parseInt(nom.value),
      keterangan: ket.value || "-"
    };
  });
  db.ref().update(updates, err => {
    if (err) alert("Gagal menyimpan data");
    else {
      inputRows.innerHTML = "";
      loadData();
    }
  });
}

function resetData() {
  if (!currentUser) return;
  if (confirm("Yakin ingin menghapus semua data?")) {
    db.ref(`users/${currentUser.uid}/pengeluaran`).remove();
    loadData();
  }
}

// Fungsi Menampilkan Data
function loadData() {
  if (!currentUser) return;
  const uid = currentUser.uid;
  db.ref(`users/${uid}`).once("value", snapshot => {
    const data = snapshot.val() || {};
    const pengeluaran = data.pengeluaran || {};
    const penghasilan = data.penghasilan || 0;
    penghasilanInput.value = penghasilan;
    penghasilanDisplay.value = penghasilan;
    tampilkanData(pengeluaran);
  });
}

function tampilkanData(data = null) {
  if (!currentUser) return;
  const uid = currentUser.uid;
  if (!data) {
    db.ref(`users/${uid}/pengeluaran`).once("value", snap => tampilkanData(snap.val()));
    return;
  }

  // Ambil filter
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const tahun = document.getElementById("filterTahun").value;
  const bulan = document.getElementById("filterBulan").value;
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;

  const bulanMap = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const byBulan = {};
  let total = 0;

  for (const tanggal in data) {
    const records = data[tanggal];
    const bulanKe = new Date(tanggal).getMonth();
    const tahunKe = new Date(tanggal).getFullYear();
    if (tahun && tahunKe != tahun) continue;
    if (bulan !== "" && bulanKe != bulan) continue;
    if (start && new Date(tanggal) < new Date(start)) continue;
    if (end && new Date(tanggal) > new Date(end)) continue;

    for (const id in records) {
      const item = records[id];
      if (
        keyword &&
        !item.kategori.toLowerCase().includes(keyword) &&
        !item.keterangan.toLowerCase().includes(keyword)
      ) continue;

      if (!byBulan[bulanKe]) byBulan[bulanKe] = [];
      byBulan[bulanKe].push({ ...item, id });
      total += item.nominal;
    }
  }

  bulanContainer.innerHTML = "";
  for (let i = 0; i < 12; i++) {
    const items = byBulan[i] || [];
    const section = document.createElement("div");
    section.innerHTML = `
      <h2 class="font-bold text-lg mt-4 text-indigo-600">${bulanMap[i]}</h2>
      <table class="min-w-full text-sm text-gray-700 border">
        <thead class="bg-gray-100">
          <tr>
            <th class="border p-2">Tanggal</th>
            <th class="border p-2">Kategori</th>
            <th class="border p-2">Nominal</th>
            <th class="border p-2">Keterangan</th>
            <th class="border p-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              x => `
              <tr>
                <td class="border p-2">${x.tanggal}</td>
                <td class="border p-2">${x.kategori}</td>
                <td class="border p-2">Rp ${x.nominal.toLocaleString()}</td>
                <td class="border p-2">${x.keterangan}</td>
                <td class="border p-2 text-red-500">
                  <button onclick="hapusData('${x.tanggal}', '${x.id}')">Hapus</button>
                </td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>
      <p class="mt-1 font-semibold text-blue-700">Total: Rp ${items.reduce((s, x) => s + x.nominal, 0).toLocaleString()}</p>
    `;
    bulanContainer.appendChild(section);
  }

  totalPengeluaran.value = `Rp ${total.toLocaleString()}`;
  const penghasilan = parseInt(penghasilanDisplay.value || 0);
  sisaUang.value = `Rp ${(penghasilan - total).toLocaleString()}`;

  // Simpan penghasilan ke Firebase
  db.ref(`users/${uid}/penghasilan`).set(penghasilan);
}

function hapusData(tanggal, id) {
  if (!currentUser) return;
  const uid = currentUser.uid;
  db.ref(`users/${uid}/pengeluaran/${tanggal}/${id}`).remove();
  loadData();
}

function resetFilter() {
  document.getElementById("searchInput").value = "";
  document.getElementById("filterTahun").value = "";
  document.getElementById("filterBulan").value = "";
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  tampilkanData();
}

function exportToExcel() {
  alert("Export Excel belum diaktifkan. Fitur segera tersedia!");
}
