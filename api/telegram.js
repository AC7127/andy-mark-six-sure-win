// Vercel Function /api/telegram - 真實推送代理，解決瀏覽器CORS同Meta AI預覽擋API
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { token, chat_id, text } = req.body || {};
    if (!token || !chat_id || !text) {
      return res.status(400).json({ ok: false, error: '缺少 token / chat_id / text' });
    }
    // Server-side call to Telegram, no CORS
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text, parse_mode: 'HTML' })
    });
    const tgData = await tgRes.json();
    return res.status(tgRes.status).json(tgData);
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}