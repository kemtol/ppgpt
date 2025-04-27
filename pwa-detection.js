let deferredPrompt;

// Fungsi untuk mendeteksi apakah perangkat mobile
const isMobileDevice = () => {
    return /android|iphone|ipad|ipod|windows phone/i.test(navigator.userAgent.toLowerCase());
};

// Deteksi iOS
const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

// Deteksi apakah sudah PWA
const isInStandaloneMode = () => (
    window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator.standalone === true)
);

// Fungsi untuk menampilkan popup install
function showInstallPopup() {
    const popup = document.getElementById('install-popup');
    if (popup) {
        popup.classList.remove('d-none');
        popup.style.display = 'block';
    }
}

// Fungsi untuk menyembunyikan popup install
function hideInstallPopup() {
    const popup = document.getElementById('install-popup');
    if (popup) {
        popup.style.display = 'none';
    }
}

// Kalau sudah PWA, tidak perlu apa-apa
if (isInStandaloneMode()) {
    console.log('✅ Sudah dalam mode PWA');
    hideInstallPopup();
} else {
    console.log('⚠️ Belum dalam mode PWA');

    if (isIos) {
        // iOS tidak support beforeinstallprompt
        console.log('📱 iOS detected. Tampilkan instruksi manual.');

        // Tampilkan popup khusus iOS
        showInstallPopup();

        // Ganti isi popup kalau mau kasih instruksi iOS
        document.getElementById('install-popup').querySelector('p').innerHTML = `
            Untuk iPhone/iPad: Tekan tombol <strong>Bagikan</strong> lalu pilih <strong>Tambahkan ke Layar Utama</strong>.
        `;
        document.getElementById('install-button').style.display = 'none'; // Hide tombol install karena iOS manual
    } else {
        // Android dan browser yang support beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            showInstallPopup();
        });

        // Jika 3 detik tidak ada beforeinstallprompt, tetap tampilkan popup
        setTimeout(() => {
            if (!deferredPrompt) {
                console.log('⏳ beforeinstallprompt tidak muncul, tetap tampilkan popup.');
                showInstallPopup();
            }
        }, 3000);
    }
}

// Tombol Install
document.getElementById('install-button')?.addEventListener('click', () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('✅ User accepted install');
            } else {
                console.log('❌ User dismissed install');
            }
            deferredPrompt = null;
        });
    }
    hideInstallPopup();
});