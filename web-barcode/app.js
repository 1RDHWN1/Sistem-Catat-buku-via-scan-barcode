const defaultBooks = {
  BK001: "Matematika",
  BK002: "IPA",
  BK003: "Bahasa Indonesia",
  BK004: "Informatika",
  BK005: "Sejarah Indonesia",
};

let bookDatabase = loadBookDatabase();
let scanStack = [];
let scanner = null;
let isScanning = false;
let lastScan = { code: "", time: 0 };

const startScanBtn = document.querySelector("#startScanBtn");
const stopScanBtn = document.querySelector("#stopScanBtn");
const popBtn = document.querySelector("#popBtn");
const manualForm = document.querySelector("#manualForm");
const bookForm = document.querySelector("#bookForm");
const manualCodeInput = document.querySelector("#manualCode");
const bookCodeInput = document.querySelector("#bookCode");
const bookTitleInput = document.querySelector("#bookTitle");
const cameraStatus = document.querySelector("#cameraStatus");
const stackList = document.querySelector("#stackList");
const emptyState = document.querySelector("#emptyState");
const totalBooks = document.querySelector("#totalBooks");
const bookTable = document.querySelector("#bookTable");

function loadBookDatabase() {
  const stored = localStorage.getItem("bookDatabase");
  return stored ? JSON.parse(stored) : { ...defaultBooks };
}

function saveBookDatabase() {
  localStorage.setItem("bookDatabase", JSON.stringify(bookDatabase));
}

function normalizeCode(code) {
  return code.trim().toUpperCase();
}

function getBookTitle(code) {
  return bookDatabase[code] || "Kode belum terdaftar";
}

function pushBook(code, method) {
  const normalizedCode = normalizeCode(code);

  if (!normalizedCode) {
    return;
  }

  scanStack.push({
    code: normalizedCode,
    title: getBookTitle(normalizedCode),
    method,
    time: new Date(),
  });

  renderStack();
}

function popBook() {
  if (scanStack.length === 0) {
    alert("Stack masih kosong, tidak ada data yang bisa dihapus.");
    return;
  }

  scanStack.pop();
  renderStack();
}

function renderStack() {
  stackList.innerHTML = "";
  totalBooks.textContent = scanStack.length;
  emptyState.hidden = scanStack.length > 0;
  popBtn.disabled = scanStack.length === 0;

  [...scanStack].reverse().forEach((item, index) => {
    const listItem = document.createElement("li");
    listItem.className = "stack-item";

    const rank = document.createElement("span");
    rank.className = "stack-rank";
    rank.textContent = index === 0 ? "TOP" : String(index + 1);

    const content = document.createElement("div");
    const title = document.createElement("p");
    title.className = "stack-title";
    title.textContent = item.title;

    const meta = document.createElement("p");
    meta.className = "stack-meta";
    meta.textContent = `${item.code} | ${item.method} | ${formatTime(item.time)}`;

    content.append(title, meta);
    listItem.append(rank, content);
    stackList.appendChild(listItem);
  });
}

function renderBookTable() {
  bookTable.innerHTML = "";

  Object.entries(bookDatabase)
    .sort(([codeA], [codeB]) => codeA.localeCompare(codeB))
    .forEach(([code, title]) => {
      const row = document.createElement("tr");
      const codeCell = document.createElement("td");
      const titleCell = document.createElement("td");

      codeCell.textContent = code;
      titleCell.textContent = title;
      row.append(codeCell, titleCell);
      bookTable.appendChild(row);
    });
}

function formatTime(date) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

async function startScanner() {
  if (!window.Html5Qrcode) {
    cameraStatus.textContent =
      "Library scanner belum terbaca. Cek koneksi internet atau pakai input manual.";
    return;
  }

  if (isScanning) {
    return;
  }

  scanner = new Html5Qrcode("reader");

  try {
    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 150 } },
      handleScanSuccess,
      () => {}
    );

    isScanning = true;
    startScanBtn.disabled = true;
    stopScanBtn.disabled = false;
    cameraStatus.textContent = "Kamera aktif. Arahkan ke barcode buku.";
  } catch (error) {
    cameraStatus.textContent =
      "Kamera tidak bisa dibuka. Izinkan akses kamera atau gunakan input manual.";
  }
}

async function stopScanner() {
  if (!scanner || !isScanning) {
    return;
  }

  await scanner.stop();
  scanner.clear();
  scanner = null;
  isScanning = false;
  startScanBtn.disabled = false;
  stopScanBtn.disabled = true;
  cameraStatus.textContent = "Kamera dihentikan.";
}

function handleScanSuccess(decodedText) {
  const code = normalizeCode(decodedText);
  const now = Date.now();

  if (lastScan.code === code && now - lastScan.time < 1800) {
    return;
  }

  lastScan = { code, time: now };
  pushBook(code, "Scan kamera");
  cameraStatus.textContent = `Barcode ${code} berhasil masuk ke stack.`;
}

manualForm.addEventListener("submit", (event) => {
  event.preventDefault();
  pushBook(manualCodeInput.value, "Input manual");
  manualCodeInput.value = "";
  manualCodeInput.focus();
});

bookForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const code = normalizeCode(bookCodeInput.value);
  const title = bookTitleInput.value.trim();

  if (!code || !title) {
    return;
  }

  bookDatabase[code] = title;
  saveBookDatabase();
  renderBookTable();
  bookForm.reset();
  bookCodeInput.focus();
});

startScanBtn.addEventListener("click", startScanner);
stopScanBtn.addEventListener("click", stopScanner);
popBtn.addEventListener("click", popBook);

renderStack();
renderBookTable();
