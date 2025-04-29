let deferredPrompt;

// Deteksi iOS
const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

// Deteksi apakah sudah PWA
const isInStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // Mencegah prompt langsung muncul
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
    console.log('✅ Sudah dalam mode PWA, tampilkan sapaan saja.');
    bubble.innerHTML = `<div>👋 Hai buddy! Welcome back!</div>`;
  } else {
    bubble.innerHTML = `<div>👋 Tekan di sini untuk menginstal aplikasi.</div>`;
    
    const installButton = document.createElement('button');
    installButton.id = 'install-button';
    installButton.className = 'btn btn-primary';
    installButton.textContent = 'Install App';

    installButton.addEventListener('click', () => {
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

    bubble.appendChild(installButton);
  }
  
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}