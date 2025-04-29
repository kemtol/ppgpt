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

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('📦 beforeinstallprompt event captured.');

    showInstallBubble();
});

// Fungsi untuk menampilkan bubble install di chat
function showInstallBubble() {
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble ai-bubble mb-3';

    if (isInStandaloneMode()) {
        // Kalau sudah PWA, cuma sapa saja
        console.log('✅ Sudah dalam mode PWA, tampilkan sapaan saja.');
        bubble.innerHTML = `
            <div>👋 Hai! Selamat datang di aplikasi kami!</div>
        `;
    } else {
        // Kalau belum PWA, tawarkan install
        console.log('⚠️ Belum dalam mode PWA, tawarkan install.');
        bubble.innerHTML = `
            <div>👋 Hai! Mau pasang aplikasi ini ke layar utama?</div>
            <button id="install-button" class="btn btn-success btn-sm mt-2">Install App</button>
        `;
    }

    chatWindow.appendChild(bubble);

    // Scroll ke bawah supaya kelihatan
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // Kalau belum install, pasang event listener ke tombol install
    if (!isInStandaloneMode()) {
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
            } else if (isIos) {
                alert("Untuk iPhone/iPad: Tekan tombol Bagikan ➔ Tambahkan ke Layar Utama.");
            } else {
                alert("Install prompt tidak tersedia. Coba lewat menu browser.");
            }
        });
    }
}