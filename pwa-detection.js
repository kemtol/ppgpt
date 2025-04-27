let deferredPrompt;

// Fungsi untuk mendeteksi apakah pengguna menggunakan perangkat mobile
const isMobileDevice = () => {
    return /android|iphone|ipad|ipod|windows phone/i.test(navigator.userAgent.toLowerCase());
};

// Cek apakah perangkat adalah iOS dan apakah aplikasi sudah diinstall
const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
const isInStandaloneMode = () => ('standalone' in navigator && navigator.standalone);

// Menangani event 'beforeinstallprompt' hanya di perangkat yang mendukung PWA (bukan iOS)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // Mencegah dialog default browser
  deferredPrompt = e; // Simpan event untuk digunakan nanti
  
  // Cek apakah aplikasi belum diinstall dan perangkat bukan iOS
  if (!isInStandaloneMode() && isMobileDevice() && !isIos) {
    console.log('Aplikasi belum diinstall. Tampilkan popup.');
    
    // Tampilkan popup untuk install jika aplikasi belum diinstall
    document.getElementById('install-popup').style.display = 'block';
  }
});

// Handle tombol install di popup
document.getElementById('install-button')?.addEventListener('click', () => {
  if (deferredPrompt) {
    deferredPrompt.prompt(); // Tampilkan prompt install
    
    deferredPrompt.userChoice.then((choiceResult) => {
      console.log(choiceResult.outcome); // Hasil dari user (accepted atau dismissed)
      deferredPrompt = null; // Reset deferredPrompt setelah digunakan
    });
  }
});

// Handle tombol close pada popup (opsional)
document.getElementById('close-popup')?.addEventListener('click', () => {
  document.getElementById('install-popup').style.display = 'none'; // Menutup popup
});
