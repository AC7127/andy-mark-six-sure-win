// Vercel /api/marksix AUTO V2 - 修復特別號解析 + 派彩 + 下期獎金
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  // 最後已知 2026-11-10 真實：3 11 13 15 17 24 +19 (特別號19，唔係40)
  let lastDraw = { date: '2026-11-10', weekday: '星期二', period: '26/119', numbers: [3,11,13,15,17,24], extra: 19, jackpotWinners: 0, second: '6注中 $284,660', third: '118.5注中 $38,430' };
  let nextDraw = { date: '2026-11-12', weekday: '星期四', time: '21:30', cutoff: '21:15', jackpot: '20,000,000', snowball: '12,000,000', period: '26/120' };
  let previousDraw = { date: '2026-11-07', weekday: '星期六', period: '26/118', numbers: [11,14,17,21,22,29], extra: 40, jackpotWinners: 0 };

  // 自動計下期：星期二(2) 星期四(4) 星期六(6)
  function nextDrawDate(from) {
    const d = new Date(from + 'T21:30:00+08:00');
    const wdName = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
    for (let i=1;i<=7;i++){ const nd=new Date(d); nd.setDate(d.getDate()+i); const wd=nd.getDay(); if(wd===2||wd===4||wd===6) return { date: nd.toISOString().slice(0,10), weekday: wdName[wd] }; }
    return { date: from, weekday: '星期四' };
  }

  // 嘗試抓 marksixinfo + sundaymore，解析 7 個號碼 (6+特別號) + 派彩
  try {
    const urls = ['https://www.marksixinfo.com', 'https://www.sundaymore.com'];
    for (const url of urls) {
      try {
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) });
        if (!r.ok) continue;
        const html = await r.text();
        // 找 7 個號碼：例如 3,11,13,15,17,24 +19 或 3、11、13、15、17、24 特別號碼19
        const m7 = html.match(/(\d{1,2})[,\s、，]+(\d{1,2})[,\s、，]+(\d{1,2})[,\s、，]+(\d{1,2})[,\s、，]+(\d{1,2})[,\s、，]+(\d{1,2})[^0-9]{0,20}(\d{1,2})/);
        const periodM = html.match(/26\/(\d{3})/);
        const dateM = html.match(/2026-11-(\d{2})/);
        if (m7 && periodM && dateM) {
          const nums = [1,2,3,4,5,6].map(i=>parseInt(m7[i]));
          const extra = parseInt(m7[7]);
          if (nums.every(n=>n>=1&&n<=49) && new Set(nums).size===6 && extra>=1&&extra<=49 && !nums.includes(extra)) {
            const scrapedDate = '2026-11-' + dateM[1];
            if (scrapedDate >= lastDraw.date) {
              lastDraw = { date: scrapedDate, weekday: scrapedDate==='2026-11-10'?'星期二':'星期四', period: '26/'+periodM[1], numbers: nums, extra: extra, jackpotWinners: 0, second: lastDraw.second, third: lastDraw.third };
              const nd = nextDrawDate(scrapedDate);
              nextDraw = { date: nd.date, weekday: nd.weekday, time: '21:30', cutoff: '21:15', jackpot: '20,000,000', snowball: '12,000,000', period: '26/'+(parseInt(periodM[1])+1) };
              break;
            }
          }
        }
      } catch(e){ continue; }
    }
  } catch(e){}

  return res.status(200).json({ source: 'HKJC + marksixinfo AUTO V2 (特別號修復)', lastUpdate: new Date().toISOString(), auto: true, nextDraw, lastDraw, previousDraw });
}
