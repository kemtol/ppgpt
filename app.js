
      // Manage menu ganti model
      //-------------------------
      function manageMenu(){
        // Letakkan event listener disini, sebelum atau sesudah fungsi submit chat
        $('#chat-menu').on('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          $('#modal-menu').toggle();
        });
      
      //-------------------------
      // Jalankan logic ketika document ready
      //-------------------------
      $(document).on('click', function (e) {
        if (!$(e.target).closest('#modal-menu, #chat-menu').length) {
          $('#modal-menu').hide();
        }
      });
    }
    

    //-----------------------
    // ketika document ready
    //-----------------------
    $(document).ready(function () {
      //init
      let sessionStartTime = Date.now(); // Waktu awal sesi chat
      let nerdMode = false;
      let history = [];
      let lastScrollTop = 0;
      const $chatHeader = $(".chat-header");
      const $chatWindow = $(".chat-window");
      const windowHeight = $(window).height();

      // PWA encforce
      // Helper: cek apakah user sudah register (sesuaikan dengan mekanisme kamu)
      function isRegistered() {
        // Contoh: cek flag di localStorage
        return localStorage.getItem('registered') === 'true';
      }

      // Setelah DOM ready…
      setTimeout(function() {
        // 1) Bubble welcome
        const askMe = `
          <div class="chat-bubble ai-bubble mb-3" id="ask-me-bubble">
            <p class="mb-0">Anyway, what can i do for you?</p>
          </div>
        `;
        $("#chat-window").append(askMe);

        // 2) Kalau belum register → tampilkan bubble register
        if (!isRegistered()) {
          const registerBubble = `
            <div class="chat-bubble ai-bubble mb-3" id="register-bubble">
              <p class="mb-0">
                Sepertinya kamu belum terdaftar. 
                <a href="/register" class="text-primary">Klik di sini untuk registrasi</a>
              </p>
            </div>
          `;
          $("#chat-window").append(registerBubble);
        }

        // Scroll ke bawah
        $("#chat-window").scrollTop($("#chat-window")[0].scrollHeight);
      }, 2500);

      
      // Mendeteksi ukuran layar
      const width = $(window).width();
      let triggerPoint = windowHeight * 0.1; // 10% dari tinggi window
      $("#chat-input").focus();

      manageMenu();

      function escapeHTML(str) {
        return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      function countTokens(text) {
        return text.trim().split(/\s+/).length;
      }

      function updateNerdStats() {
        if (!nerdMode) return;

        const tokens = history.reduce(
          (sum, msg) => sum + countTokens(msg.content),
          0
        );
        const cost = (tokens * 0.02 * 17000 * 1.05) / 1000; // Tarif GPT-4o (adjust sesuai model)
        const durationSec = Math.floor(
          (Date.now() - sessionStartTime) / 1000
        );

        $("#stat-tokens").text(`Tokens: ${tokens}`);
        $("#stat-cost").text(`Cost: ${cost.toFixed(2)} IDR`);
        $("#stat-messages").text(`Messages: ${history.length}`);
        $("#stat-duration").text(`Duration: ${durationSec}s`);
      }

      const savedAudit = localStorage.getItem("chat_audit");
      if (savedAudit) {
        history = JSON.parse(savedAudit);
        history.forEach((msg) => {
          if (msg.role === "user") {
            $("#chat-window").append(`
              <div class="chat-bubble user-bubble">${DOMPurify.sanitize(
                msg.content
              )}</div>
            `);
          } else if (msg.role === "assistant") {
            const html = DOMPurify.sanitize(marked.parse(msg.content));
            $("#chat-window").append(`
              <div class="chat-bubble ai-bubble">
                ${html}
              </div>
            `);
          }
        });
        hljs.highlightAll();

        if (width > 768) {
          // 768px adalah ukuran layar desktop
          $("#chat-input").focus(); // Fokus ke textarea hanya untuk desktop
        }
      }

      // Mengatur visibility header dengan efek fade
      $chatWindow.scroll(function () {
        const scrollTop = $chatWindow.scrollTop();
        if (scrollTop < lastScrollTop && scrollTop <= triggerPoint) {
          $chatHeader.css("opacity", 1);
        } else {
          $chatHeader.css("opacity", 0);
        }
        lastScrollTop = scrollTop;
      });

      //Apakah content berupa code
      function isProbablyCode(text) {
          const codeIndicators = [
            "<",
            ">",
            "{",
            "}",
            ";",
            "function",
            "const",
            "let",
            "var",
            "if",
            "else",
            "</",
          ];
          return (
            codeIndicators.some((keyword) => text.includes(keyword)) ||
            text.includes("\n")
          );
        }

      // Scroll otomatis ke bagian bawah chat window
      const scrollToBottom = () =>
        $("#chat-window").scrollTop($("#chat-window")[0].scrollHeight);


      // conversation LOGIC start request and fetch
      // ------------------------------------------
      $("#chat-form").submit(async function (e) {
        e.preventDefault();
        const message = $("#chat-input").val().trim();
        const file = $("#file-input")[0].files[0];
        if (!message && !file) return;
        let payload = {};

        // Proses markdown jadi HTML + sanitize
        const html = DOMPurify.sanitize(marked.parse(message));
        
        // URL Model list
        const textWorkerURL = "https://round-cake-a592.mkemalw.workers.dev"; 
        const dalleWorkerURL = "https://reverse.paypergpt.chat/generate-image";

        const isDallePrompt = /\b(gambarkan|lukisan|ilustrasi|gambar(?:kan)?|buat(?:kan)? gambar|visualisasikan|sketsa|render|generate(?: an?)? image|create(?: an?)? image|draw(?: an?)? image|KATA_YANG_SALAH?)\b/i.test(message.toLowerCase());

        // start to request if its file, text or dalle
        if (file) {
          // ... (kode untuk file tetap sama) ...
          const image = await toBase64(file);
          const safeMessage = escapeHTML(message);
          const formattedMessage = isProbablyCode(message)
            ? `<pre>${safeMessage}</pre>`
            : `<div>${safeMessage}</div>`;

          $("#chat-window").append(`
          <img src="${image}" alt="User image" class="m-2 rounded" style="max-width: 320px; align-self: end;">
          <div class="chat-bubble user-bubble mb-3">
            ${formattedMessage}
          </div>
        `);

          payload.image_url = image;
          payload.prompt = message || "Analisis gambar ini";

        } else if (isDallePrompt){ // <--- KASUS DALL-E (DIPERBAIKI)
          // --- MULAI TAMBAHAN ---
          // Buat bubble user (sama seperti di blok 'else')
          const safeMessage = escapeHTML(message);
          const formattedMessage = isProbablyCode(message)
            ? `<pre>${safeMessage}</pre>`
            : `<div>${safeMessage}</div>`;
          // Append bubble user
          $("#chat-window").append(`
            <div class="chat-bubble mb-3 user-bubble">
              ${formattedMessage}
            </div>
          `);
            // --- AKHIR TAMBAHAN ---

          // Set payload DALL-E (tetap sama)
          payload = { prompt: message, mode: "image" };

          // Pertimbangkan: Apakah prompt DALL-E perlu masuk history?
          // Jika ya, tambahkan baris ini:
          // history.push({ role: "user", content: message });
          // Jika tidak, biarkan seperti ini.

        } else { // <--- KASUS TEKS BIASA (tetap sama)
          const safeMessage = escapeHTML(message);
          const formattedMessage = isProbablyCode(message)
            ? `<pre>${safeMessage}</pre>`
            : `<div>${safeMessage}</div>`;

          $("#chat-window").append(`
            <div class="chat-bubble mb-3 user-bubble">
              ${formattedMessage}
            </div>
          `);

          history.push({ role: "user", content: message });
          const userMessages = history.filter(
            (msg) => msg.role === "user"
          ).length;
          if (userMessages === 3) {
            showPGOverlay();
          }
          payload.messages = history;
        }

        console.log("--- Debug Routing ---");
        console.log("Pesan Input:", message);
        console.log("File Object:", file); // Lihat apakah ada objek file di sini
        console.log("Hasil isDallePrompt:", isDallePrompt); // Cek hasil tes regex

        // Tentukan URL worker berdasarkan jenis permintaan
        const workerURL = file ? textWorkerURL : (isDallePrompt ? dalleWorkerURL : textWorkerURL);
        console.log("Worker URL yang Dipilih:", workerURL); // Lihat URL mana yang akhirnya dipilih
        console.log("--- End Debug Routing ---");

        const loaderId = "loader-" + Date.now();
        showLoader(loaderId);

        // Reset input form setelah submit
        // ... (reset code) ...

        console.log("--- Debug Fetch ---");
        console.log("Mengirim ke URL:", workerURL);
        console.log("Dengan Payload:", JSON.stringify(payload));
        console.log("--- End Debug Fetch ---");

        // Reset input form setelah submit
        $("#chat-input").val("").css("height", "auto");
        $("#file-input").val("");
        $("#attachment-preview").empty();

        // AI membalas
        fetch(workerURL, { // <--- PERBAIKAN UTAMA DI SINI
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
          .then((res) => {
              // Cek jika respons tidak ok (misal status 4xx atau 5xx)
              if (!res.ok) {
                  // Coba baca error dari body jika ada, fallback ke status text
                  return res.json().catch(() => null).then(errBody => {
                    throw new Error(errBody?.error?.message || `HTTP error! status: ${res.status} ${res.statusText}`);
                  });
              }
              return res.json();
          })
          .then((data) => {
              $(`#${loaderId}`).remove(); // Pindahkan remove loader ke sini agar hilang saat sukses

              // --- Logika untuk Menampilkan Response ---
              // Cek apakah response adalah gambar (dari DALL-E) atau teks
              if (data.image_url) { // Asumsi DALL-E worker mengembalikan { image_url: "..." }
                  $("#chat-window").append(`
                      <div style="align-self: start;">
                        <img src="${data.image_url}" alt="Generated image" class="m-2 rounded" style="max-width: 50%;">
                        ${data.cost ? `<span class="cost-info response-cost">Cost: ${data.cost} using model: ${data.model || 'dall-e'}</span>` : ''}
                      </div>
                  `);
                  // Mungkin perlu push sesuatu ke history? Atau tidak?
              } else if (data.response) { // Asumsi Text worker mengembalikan { response: "...", cost: ..., model: ...}
                  const response = data.response;
                  const cost = data.cost; // Mengambil biaya dari backend
                  const model = data.model; // Mengambil informasi model
                  const tokenCount = data.tokenCount; // Mengambil info total token
                  const html = DOMPurify.sanitize(marked.parse(response));
                  const responseId = "response-" + Date.now();

                  $("#chat-window").append(`
                      <div class="chat-bubble mb-3 ai-bubble" id="${responseId}">
                          ${html}
                          ${cost ? `<span class="cost-info response-cost">Cost: ${cost} with total tokens : ${tokenCount}, using model: ${model}</span>` : ''}
                      </div>
                  `);
                  hljs.highlightAll(); // Highlight code block
                  history.push({ role: "assistant", content: response });
                  document.getElementById(responseId)?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                  });
              } else {
                  // Handle jika format response tidak sesuai ekspektasi
                  throw new Error("Format response tidak dikenal dari worker.");
              }

              //$(".sponsored-spinner").remove(); // Jika masih ada
              if (width > 768) {
                  $("#chat-input").focus();
              }
          })
          .catch((err) => {
              $(`#${loaderId}`).remove(); // Pastikan loader dihapus juga saat error
              console.error("❌ Error request ke worker:", err);
              $("#chat-window").append(
                  `<div class="chat-bubble ai-bubble text-danger mb-3">
                      ❌ Error dalam memproses request: ${err.message || err}
                  </div>`
              );
              scrollToBottom(); // Pastikan scroll ke bawah
              if (width > 768) {
                  $("#chat-input").focus();
              }
          });
    
      });

      // Fungsi untuk mengubah file menjadi base64
      const toBase64 = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
        });
      };

      // Menampilkan loader berupa iklan
      const showLoader = (id) => {
        $("#chat-window").append(
          `<div class="chat-bubble ads-bubble mb-3" id="${id}">
            <div class="d-flex ad-container align-items-center justify-content-center pt-2 pb-2">
              <div class="p-2"><img src="/img/ads-20250231.jpg" class="rounded-circle" alt="Iklan Loading" style="max-width: 75px;height: auto;/* border-radius: 0!important; */"></div>
              <div class="p-2 text-start">
                <strong class="mb-0">Cakra Autoworks</strong>
                <p class="small mb-0">Speeduino specialist, Jakarta</p>
                <a href="" class="small">Chat Now</a>
              </div>
            </div>
            <!-- Loading bar kecil di bawah -->
            <div class="sponsored-spinner mt-2 d-flex align-items-center justify-content-center gap-2">
              <div class="spinner-border text-secondary spinner-border-sm" role="status" aria-hidden="true"></div>
              <small class="text-light">Loading while me thinking..</small>
            </div>
          </div>`
        );
        scrollToBottom();
      };

      // Mengelola pratinjau file saat diunggah
      $("#file-input").change(function () {
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          $("#attachment-preview").html(`
            <div class="bg-dark p-2 text-light rounded d-flex align-items-center mb-2">
              <img src="${e.target.result}" style="width:50px;height:auto" class="rounded me-2"/>
              <button type="button" class="btn-close btn-close-white" id="remove-preview"></button>
            </div>`);
          $("#remove-preview").click(() => {
            $("#file-input").val("");
            $("#attachment-preview").empty();
            $("#chat-input").focus();
          });
          $("#chat-input").focus();
        };
        reader.readAsDataURL(file);
      });

      // Kelola enter key untuk mengirim form
      $("#chat-input")
        .keydown((e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            $("#chat-form").submit();
          }
        })
        .on("input", function () {
          $(this).css({ height: "auto", height: this.scrollHeight + "px" });
        });

      // Reset chat
      $("#resetChat").click(() => {
        $("#chat-window").empty();
        history = [];
        localStorage.removeItem("chat_audit"); // Clear local audit
        if (width > 768) {
          // 768px adalah ukuran layar desktop
          $("#chat-input").focus(); // Fokus ke textarea hanya untuk desktop
        }
      });

      // Hotkey handler (Ctrl + Shift + N)
      $(document).keydown(function (e) {
        if (
          e.ctrlKey &&
          e.shiftKey &&
          e.altKey &&
          e.key.toLowerCase() === "n"
        ) {
          nerdMode = !nerdMode;
          $("#nerd-stats").toggle(nerdMode);
          console.log(`🧠 Nerd Stat ${nerdMode ? "Aktif" : "Nonaktif"}`);
        }
      });
      setInterval(updateNerdStats, 1000);

      // Show PG topup
      function showPGOverlay() {
        fetch("https://get-country-location.mkemalw.workers.dev") // Ganti dengan URL kamu
          .then((res) => res.json())
          .then((data) => {
            const pg = data.pg || "paypal";
            const country = data.country || "Unknown";

            const content = `<small class="d-block mb-2" style="
  color: #aaa;
">its still free tho, just press close</small>
              <p class="d-none">🌍 ${country}</p>
              <a class="btn btn-primary m-2 doku-payment buy-button" data-amount="25000" href="#">Beli Voucher Rp 25.000</a>
              <a class="btn btn-primary m-2 doku-payment buy-button" data-amount="50000" href="#">Beli Voucher Rp 50.000</a>
              <hr />
              <ul class="list-unstyled">
                <li>Tau ga kalau 1 chat itu cuma 100 - 300 perak.</li>
                <li>Ga cuma <strong>GPT</strong>, model bisa pakai <strong>Gemini, DeepSeek, Claude</strong>, dan lainnya.</li>
                <li>Voucher mulai <strong>Rp25.000</strong> masa berlaku 3 bulan. 25.000 dibagi 100 perak itung aja deh.</li>
                <li>Ga ada batasan jumlah pertanyaan, tidak ada limit harian.</li>
                <li>Ada Mode Hemat, vision, DALL-E, no filter.</li>
              </ul>
            `;

            $("#pg-overlay-body").html(content);
            $("#pg-overlay").removeClass("d-none");
          })
          .catch(() => {
            $("#pg-overlay-body").html(
              `<p class="text-danger">Gagal mendeteksi lokasi.</p>`
            );
            $("#pg-overlay").removeClass("d-none");
          });
      }

      // Tutup overlay
      $(document).on("click", "#close-overlay", function () {
        $("#pg-overlay").addClass("d-none");
      });


// Add DOKU checkout page
      
      $("#buy-coin").on("click", function () {
          showPGOverlay();
      });


      // Function to generate a simple UUID for device ID
      function generateUUID() {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
          });
      }

      // Get or generate a device ID and store in localStorage
      let deviceId = localStorage.getItem('deviceId');
      if (!deviceId) {
          deviceId = generateUUID();
          localStorage.setItem('deviceId', deviceId);
      }

      $('#pg-overlay-body').on('click', '.buy-button', function () {
        const amount = $(this).data('amount');
        const buttonText = $(this).text(); // Get original button text
        const originalButton = $(this); // Reference to the clicked button

        // Optionally, add a message to the overlay or console
        console.log(`Processing ${buttonText} (Amount: ${amount})...`);

        // Disable all buttons within the overlay to prevent multiple clicks
        $('#pg-overlay-body .buy-button').prop('disabled', true);

        // Make AJAX call to your backend service
        $.ajax({
          url: 'https://backend-doku.psdo.capital-commerce.com/generate-payment-url', // Your actual backend URL
          method: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({
            amount: amount,
            device_id: deviceId // Send device ID to backend
          }),
          success: function (response) {
            if (response && response.payment_url) {
              console.log('Redirecting to DOKU...');
              // Option 1: Pop up DOKU Checkout
              if (typeof loadJokulCheckout === 'function') {
                loadJokulCheckout(response.payment_url);
              } else {
                console.error("DOKU Checkout JS not loaded correctly. Redirecting instead.");
                window.location.href = response.payment_url;
              }
            } else {
              console.error('Error: Could not get payment URL from backend. ' + (response.message || ''));
              $('#pg-overlay-body .buy-button').prop('disabled', false); // Re-enable buttons
            }
          },
          error: function (xhr, status, error) {
            console.error('Error connecting to backend: ' + error + '. Details: ' + (xhr.responseText || ''));
            $('#pg-overlay-body .buy-button').prop('disabled', false); // Re-enable buttons
          },
          complete: function () {
            // Re-enable buttons after DOKU popup/redirect (or error)
            // For a seamless UX, you might keep them disabled until a payment status is known
            // via a separate mechanism (e.g., polling your backend, websockets).
            // For this example, we re-enable on AJAX completion.
            $('#pg-overlay-body .buy-button').prop('disabled', false);
          }
        });
      });

      
    });

//      var checkoutButton = document.getElementById('buy-coin');
//        // Example: the payment page will show when the button is clicked
//        checkoutButton.addEventListener('click', function () {
//            loadJokulCheckout('https://jokul.doku.com/checkout/link/SU5WFDferd561dfasfasdfae123c20200510090550775'); // Replace it with the response.payment.url you retrieved from the response
//        });