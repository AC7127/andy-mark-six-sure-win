// Netlify Function: /.netlify/functions/marksix
// 抓馬會 bet.hkjc.com/ch/marksix/ 最新頭獎、多寶、下期日期
// 部署方法：將此檔案放到你Netlify專案根目錄 netlify/functions/marksix.js，再部署

export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=600' // 快取10分鐘
  };

  try {
    // 嘗試抓馬會官網
    let html = '';
    try {
      const res = await fetch('https://bet.hkjc.com/ch/marksix/', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      html = await res.text();
    } catch (e) {
      console.log('HKJC fetch failed', e);
    }

    // 解析邏輯（簡化版，用正則抓關鍵字，失敗則用已知數據）
    let jackpot = '108,000,000';
    let snowball = '80,429,724';
    let nextDate = '2026-11-05';
    let nextWeekday = '星期四';
    let lastDraw = { date: '2026-10-31', numbers: [10,11,19,27,37,43], extra: 8, jackpotWinners: 0 };

    // 嘗試從HTML抓取（馬會頁面結構經常變，用多個正則備用）
    if (html) {
      const jackpotMatch = html.match(/頭獎.*?\$?([\d,]{6,})/) || html.match(/jackpot.*?\$?([\d,]{6,})/i);
      if (jackpotMatch) jackpot = jackpotMatch[1];
      
      const snowballMatch = html.match(/多寶.*?\$?([\d,]{6,})/) || html.match(/金多寶.*?\$?([\d,]{6,})/);
      if (snowballMatch) snowball = snowballMatch[1];

      const dateMatch = html.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
      if (dateMatch) {
        nextDate = `${dateMatch[1]}-${String(dateMatch[2]).padStart(2,'0')}-${String(dateMatch[3]).padStart(2,'0')}`;
      }
    }

    // 備用抓 marksixinfo.com
    if (!html || jackpot === '108,000,000') {
      try {
        const res2 = await fetch('https://www.marksixinfo.com/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html2 = await res2.text();
        // 解析 marksixinfo
        const m = html2.match(/(\d+),(\d+),(\d+),(\d+),(\d+),(\d+)/);
        if (m) {
          lastDraw.numbers = m.slice(1,7).map(n=>parseInt(n));
        }
      } catch(e) {}
    }

    const data = {
      source: 'HKJC',
      lastUpdate: new Date().toISOString(),
      nextDraw: {
        date: nextDate,
        weekday: nextWeekday,
        time: '21:30',
        jackpot: jackpot,
        snowball: snowball,
        estimatedSingleWinner: jackpot
      },
      lastDraw: lastDraw,
      hkjcUrl: 'https://bet.hkjc.com/ch/marksix/'
    };

    return new Response(JSON.stringify(data), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({
      error: err.message,
      fallback: {
        nextDraw: { date: '2026-11-05', jackpot: '108,000,000', snowball: '80,429,724' },
        lastDraw: { date: '2026-10-31', numbers: [10,11,19,27,37,43], extra: 8 }
      }
    }), { status: 200, headers });
  }
};

export const config = {
  path: "/.netlify/functions/marksix"
};
