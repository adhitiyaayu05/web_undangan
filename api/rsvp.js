/**
 * ================================================================
 * api/rsvp.js — Vercel Serverless Function
 * Menerima data RSVP dari form → kirim ke WhatsApp pengantin
 * Nomor WA pengantin TIDAK terlihat di HTML, tersimpan aman di sini
 * ================================================================
 *
 * CARA SETUP (baca sebelum deploy):
 *
 * LANGKAH 1 — Setup CallMeBot (WA gratis):
 *   1. Buka WhatsApp pengantin
 *   2. Simpan nomor +34 644 52 48 23 sebagai kontak
 *   3. Kirim pesan persis: "I allow callmebot to send me messages"
 *   4. Tunggu balasan dari CallMeBot (biasanya <5 menit)
 *   5. Catat API KEY yang dikirim CallMeBot
 *
 * LANGKAH 2 — Set Environment Variables di Vercel:
 *   Login Vercel → project kamu → Settings → Environment Variables
 *   Tambahkan 2 variabel baru:
 *     Nama: WA_PHONE   | Value: 6285133797125  (nomor pengantin, format 62xxx)
 *     Nama: WA_APIKEY  | Value: (API key dari CallMeBot, contoh: 1234567)
 *   Klik Save → klik Redeploy
 *
 * LANGKAH 3 — Struktur folder project di Vercel:
 *   project/
 *     index.html       ← file undangan (rename dari undangan-dilla-majid.html)
 *     api/
 *       rsvp.js        ← file ini
 *
 * Setelah deploy, form RSVP di web akan otomatis kirim ke /api/rsvp
 * dan pesan WA masuk ke HP pengantin. Pengunjung TIDAK tahu nomornya.
 * ================================================================
 */

export default async function handler(req, res) {
  // Allow CORS agar bisa dipanggil dari browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Hanya terima POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ambil data dari body request
  const { name, phone, att, guest } = req.body || {};

  // Validasi data
  if (!name || !att || !guest) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }

  // Ambil nomor WA & API key dari environment variables Vercel
  const waPhone = process.env.WA_PHONE;
  const apiKey  = process.env.WA_APIKEY;

  // Buat isi pesan WA
  const waktu = new Date().toLocaleString('id-ID', {
    timeZone : 'Asia/Jakarta',
    weekday  : 'long',
    day      : 'numeric',
    month    : 'long',
    year     : 'numeric',
    hour     : '2-digit',
    minute   : '2-digit'
  });

  const pesanWA =
    `🎊 *RSVP Pernikahan Dilla & Majid*\n\n` +
    `Nama       : ${name}\n` +
    `No. HP     : ${phone || '-'}\n` +
    `Kehadiran  : ${att}\n` +
    `Jml. Tamu  : ${guest}\n` +
    `Waktu kirim: ${waktu}`;

  // Kirim ke WhatsApp via CallMeBot
  if (waPhone && apiKey) {
    try {
      const callUrl =
        `https://api.callmebot.com/whatsapp.php` +
        `?phone=${encodeURIComponent(waPhone)}` +
        `&text=${encodeURIComponent(pesanWA)}` +
        `&apikey=${encodeURIComponent(apiKey)}`;

      const callRes = await fetch(callUrl, { method: 'GET' });
      const callText = await callRes.text();
      console.log('CallMeBot response:', callText);
    } catch (err) {
      // Log error tapi tetap balas sukses ke browser
      console.error('CallMeBot error:', err.message);
    }
  } else {
    // Environment variables belum diset — log untuk debug
    console.warn('WA_PHONE atau WA_APIKEY belum dikonfigurasi di Vercel.');
  }

  // Selalu balas sukses ke browser — pengunjung tidak tahu detailnya
  return res.status(200).json({ success: true });
}