const defaultBooks = window.defaultBookDatabase || {};

let bookDatabase = loadBookDatabase();
let scanStack = [];
let scanner = null;
let isScanning = false;
let lastScan = { code: "", time: 0 };
let lastNotice = { message: "", time: 0 };
let scanCooldownUntil = 0;
let audioContext = null;
let toastTimer = null;
let lastToneTime = 0;

const startScanBtn = document.querySelector("#startScanBtn");
const stopScanBtn = document.querySelector("#stopScanBtn");
const popBtn = document.querySelector("#popBtn");
const manualForm = document.querySelector("#manualForm");
const bookForm = document.querySelector("#bookForm");
const generateCodeBtn = document.querySelector("#generateCodeBtn");
const manualCodeInput = document.querySelector("#manualCode");
const bookCodeInput = document.querySelector("#bookCode");
const bookTitleInput = document.querySelector("#bookTitle");
const cameraStatus = document.querySelector("#cameraStatus");
const stackList = document.querySelector("#stackList");
const emptyState = document.querySelector("#emptyState");
const totalBooks = document.querySelector("#totalBooks");
const bookTable = document.querySelector("#bookTable");
const toast = document.querySelector("#toast");

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

function getNextBookCode() {
  const usedNumbers = Object.keys(bookDatabase)
    .map((code) => code.match(/^BK(\d+)$/))
    .filter(Boolean)
    .map((match) => Number(match[1]));
  const nextNumber = usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : 1;
  return `BK${String(nextNumber).padStart(3, "0")}`;
}

function hasBookInStack(code) {
  return scanStack.some((item) => item.code === code);
}

function pushBook(code, method) {
  const normalizedCode = normalizeCode(code);

  if (!normalizedCode) {
    notify("Kode barcode tidak boleh kosong.", "warning");
    playTone("warning");
    return false;
  }

  if (!window.canEncodeCode128(normalizedCode)) {
    notify("Kode hanya boleh memakai huruf, angka, spasi, atau simbol ASCII.", "warning");
    playTone("warning");
    return false;
  }

  if (!bookDatabase[normalizedCode]) {
    notify(`Kode ${normalizedCode} belum terdaftar di database.`, "warning");
    playTone("warning");
    return false;
  }

  if (hasBookInStack(normalizedCode)) {
    notify(`Kode ${normalizedCode} sudah ada di stack.`, "warning");
    playTone("warning");
    return false;
  }

  scanStack.push({
    code: normalizedCode,
    title: bookDatabase[normalizedCode],
    method,
    time: new Date(),
  });

  renderStack();
  notify(`${bookDatabase[normalizedCode]} berhasil masuk ke stack.`, "success");
  playTone("success");
  return true;
}

function popBook() {
  if (scanStack.length === 0) {
    notify("Stack masih kosong, tidak ada data yang bisa dihapus.", "warning");
    playTone("warning");
    return;
  }

  const removedBook = scanStack.pop();
  renderStack();
  notify(`${removedBook.title} dihapus dari stack.`, "warning");
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
      const barcodeCell = document.createElement("td");
      const barcodePreview = document.createElement("div");

      codeCell.textContent = code;
      titleCell.textContent = title;
      barcodePreview.className = "barcode-preview";
      barcodePreview.innerHTML = window.renderCode128Svg(code, title, {
        moduleWidth: 1,
        barHeight: 38,
        quietZone: 10,
      });
      barcodeCell.appendChild(barcodePreview);
      row.append(codeCell, titleCell, barcodeCell);
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

function unlockAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    return;
  }

  if (!audioContext) {
    audioContext = new AudioContext();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function playTone(type) {
  const timestamp = Date.now();

  if (!audioContext || timestamp - lastToneTime < 800) {
    return;
  }

  lastToneTime = timestamp;

  if (navigator.vibrate) {
    navigator.vibrate(type === "success" ? 80 : [80, 60, 80]);
  }

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;

  oscillator.type = "sine";
  oscillator.frequency.value = type === "success" ? 880 : 220;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.18);
}

function notify(message, type = "success") {
  const now = Date.now();

  if (lastNotice.message === message && now - lastNotice.time < 1600) {
    return;
  }

  lastNotice = { message, time: now };
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.hidden = false;

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

async function startScanner() {
  unlockAudio();
  if (!window.Html5Qrcode) {
    cameraStatus.textContent =
      "Library scanner belum terbaca. Cek koneksi internet atau pakai input manual.";
    notify("Library scanner belum terbaca. Gunakan input manual.", "warning");
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
    notify("Kamera tidak bisa dibuka. Cek izin kamera browser.", "error");
    playTone("warning");
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

  if (now < scanCooldownUntil) {
    return;
  }

  lastScan = { code, time: now };
  const added = pushBook(code, "Scan kamera");

  if (added) {
    scanCooldownUntil = now + 1800;
    cameraStatus.textContent = `Barcode ${code} berhasil masuk ke stack.`;
  } else {
    cameraStatus.textContent = `Barcode ${code} tidak dimasukkan ke stack.`;
  }
}

manualForm.addEventListener("submit", (event) => {
  event.preventDefault();
  unlockAudio();
  pushBook(manualCodeInput.value, "Input manual");
  manualCodeInput.value = "";
  manualCodeInput.focus();
});

bookForm.addEventListener("submit", (event) => {
  event.preventDefault();
  unlockAudio();
  const code = normalizeCode(bookCodeInput.value);
  const title = bookTitleInput.value.trim();

  if (!code || !title) {
    return;
  }

  if (!window.canEncodeCode128(code)) {
    notify("Kode barcode hanya boleh memakai karakter ASCII.", "warning");
    playTone("warning");
    return;
  }

  bookDatabase[code] = title;
  saveBookDatabase();
  renderBookTable();
  notify(`Data buku ${code} berhasil disimpan dan barcode otomatis dibuat.`, "success");
  playTone("success");
  bookForm.reset();
  bookCodeInput.focus();
});

generateCodeBtn.addEventListener("click", () => {
  bookCodeInput.value = getNextBookCode();
  bookTitleInput.focus();
});

startScanBtn.addEventListener("click", startScanner);
stopScanBtn.addEventListener("click", stopScanner);
popBtn.addEventListener("click", popBook);

renderStack();
renderBookTable();
