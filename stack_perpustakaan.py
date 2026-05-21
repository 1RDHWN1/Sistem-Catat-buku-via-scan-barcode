class StackPerpustakaan:
    def __init__(self):
        self.stack = []

    def push(self, judul_buku):
        self.stack.append(judul_buku)
        print(f"Buku '{judul_buku}' berhasil ditambahkan ke sistem.")

    def pop(self):
        if not self.is_empty():
            buku_dihapus = self.stack.pop()
            print(f"Buku '{buku_dihapus}' telah dihapus dari tumpukan.")
            return buku_dihapus

        print("Peringatan: Tumpukan kosong, tidak ada buku untuk dihapus.")
        return None

    def is_empty(self):
        return len(self.stack) == 0

    def tampilkan_stack(self):
        print("\nDaftar buku di stack saat ini:")

        if self.is_empty():
            print("Belum ada data buku.")
        else:
            for nomor, judul in enumerate(self.stack, start=1):
                print(f"{nomor}. {judul}")

        print(f"Total buku: {len(self.stack)}\n")


def tampilkan_menu():
    print("=== Sistem Scan Buku Perpustakaan ===")
    print("1. Input Buku")
    print("2. Hapus Buku Terakhir")
    print("3. Tampilkan Data")
    print("4. Selesai")


def main():
    sistem = StackPerpustakaan()

    while True:
        tampilkan_menu()
        pilihan = input("Pilih opsi (1-4): ").strip()

        if pilihan == "1":
            judul_buku = input("Masukkan judul buku: ").strip()

            if judul_buku:
                sistem.push(judul_buku)
            else:
                print("Judul buku tidak boleh kosong.")
        elif pilihan == "2":
            sistem.pop()
        elif pilihan == "3":
            sistem.tampilkan_stack()
        elif pilihan == "4":
            print("Program selesai.")
            break
        else:
            print("Opsi tidak valid. Silakan pilih angka 1 sampai 4.")

        print()


if __name__ == "__main__":
    main()
