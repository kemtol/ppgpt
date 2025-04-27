let deferredPrompt;

// Hapus deklarasi ganda variabel isInStandaloneMode, biarkan hanya satu deklarasi
const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
const isInStandaloneMode = () => ('standalone' in navigator && navigator.standalone);

// Cek jika aplikasi belum diinstall
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // Mencegah dialog native dari browser
  deferredPrompt = e; // Menyimpan event supaya bisa dipanggil nanti

  // Tampilkan popup install jika aplikasi belum diinstall
  if (!isInStandaloneMode()) {
    console.log('Aplikasi belum diinstall. Tampilkan popup.');
    document.getElementById('install-popup').style.display = 'block';
  }
});

// Handle tombol install di popup
document.getElementById('install-button').addEventListener('click', () => {
  if (deferredPrompt) {
    deferredPrompt.prompt(); // Tampilkan prompt install
    deferredPrompt.userChoice.then((choiceResult) => {
      console.log(choiceResult.outcome); // hasil dari user (accepted atau dismissed)
      deferredPrompt = null; // Reset deferredPrompt setelah digunakan
    });
  }
});
