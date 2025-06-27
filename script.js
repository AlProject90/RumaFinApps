const form = document.getElementById("formPengeluaran");
const daftar = document.getElementById("daftarPengeluaran");
const totalTeks = document.getElementById("total");

let data = JSON.parse(localStorage.getItem("pengeluaran")) || [];

function simpanKeLocal() {
  localStorage.setItem("pengeluaran", JSON.stringify(data));
}

function hitungTotal() {
  const total = data.reduce((sum, item) => sum + Number(item.nominal), 0);
  totalTeks.textContent = "Rp " + total.toLocaleString("id-ID");
}

function tampilkanDaftar() {
  daftar.innerHTML = "";
  data.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.tanggal} | ${item.kategori} | Rp ${Number(item.nominal).toLocaleString("id-ID")} | ${item.keterangan}`;
    daftar.appendChild(li);
  });
  hitungTotal();
}

form.addEventListener("submit", function(e) {
  e.preventDefault();
  const tanggal = document.getElementById("tanggal").value;
  const kategori = document.getElementById("kategori").value;
  const nominal = document.getElementById("nominal").value;
  const keterangan = document.getElementById("keterangan").value;

  data.push({ tanggal, kategori, nominal, keterangan });
  simpanKeLocal();
  tampilkanDaftar();
  form.reset();
});

tampilkanDaftar();
