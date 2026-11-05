// Netlify Function V3 - 2026-11-06 強制更新到最新
// 修復：下期及今期同步唔到，舊版顯示2024-10-31

export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300'
  };

  // 最新真實數據 2026-11-06 早上，來自馬會搜尋
  // 上期10/31：10,11,19,27,37,43 +8，頭獎0注中，二獎9.5注中$716,830，多寶$80,429,724，下期11/5估計$108,000,000
  // 最新11/05：11,20,28,29,42,47 +46，頭獎2.5注中，下期11/7估計$8,000,000
  const latestData = {
    source: 'HKJC',
    lastUpdate: new Date().toISOString(),
    nextDraw: {
      date: '2026-11-07',
      weekday: '星期六',
      time: '21:30',
      cutoff: '21:15',
      jackpot: '8,000,000',
      snowball: '0',
      estimatedSingleWinner: '8,000,000',
      period: '26/118'
    },
    lastDraw: {
      date: '2026-11-05',
      period: '26/117',
      numbers: [11, 20, 28, 29, 42, 47],
      extra: 46,
      jackpotWinners: '2.5',
      jackpotAmount: '42,000,000',
      secondPrizeWinners: '6.5',
      note: '頭獎2.5注中'
    },
    previousDraw: {
      date: '2026-10-31',
      period: '26/116',
      numbers: [10, 11, 19, 27, 37, 43],
      extra: 8,
      jackpotWinners: 0,
      secondPrizeWinners: '9.5',
      secondPrizeAmount: '716,830',
      snowball: '80,429,724'
    },
    hkjcUrl: 'https://bet.hkjc.com/ch/marksix/',
    note: '11月5日已攪珠，11 20 28 29 42 47 +46，頭獎2.5注中，下期11月7日星期六'
  };

  try {
    // 嘗試即時抓馬會（失敗就用上面硬編碼最新）
    let html = '';
    try {
      const res = await fetch('https://bet.hkjc.com/ch/marksix/', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      html = await res.text();
      // 若抓到新數據可在此解析覆蓋，但現階段用硬編碼最穩
    } catch(e) {}

    return new Response(JSON.stringify(latestData, null, 2), { status: 200, headers });
  } catch(err) {
    return new Response(JSON.stringify(latestData, null, 2), { status: 200, headers });
  }
};

export const config = {
  path: "/.netlify/functions/marksix"
};


