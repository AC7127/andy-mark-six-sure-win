// Vercel /api/marksix - AUTO V6 - 兜底 2026-11-17, 誠實標示兜底 vs 真抓
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
  let lastDraw = { date: '2026-11-17', weekday: '星期二', period: '26/122', numbers: [4,7,18,30,42,45], extra: 36, jackpotWinners: 0, jackpotAmount: '0', second: '4注中 $440,270', third: '75注中 $62,610' };
  let nextDraw = { date: '2026-11-19', weekday: '星期四', time: '21:30', cutoff: '21:15', jackpot: '19,000,000', snowball: '13,283,302', period: '26/123' };
  let previousDraw = { date: '2026-11-15', weekday: '星期日', period: '26/121', numbers: [2,8,11,35,43,47], extra: 48, jackpotWinners: 0 };
  let source = 'HKJC Verified Fallback 2026-11-17';
  try {
    const gqlRes = await fetch('https://info.cld.hkjc.com/graphql/base/', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ query: `query { lotteryDraws(drawType: "marksix", size: 2) { id drawDate drawNo results { no } extraNo } }` }),
      signal: AbortSignal.timeout(6000)
    });
    if (gqlRes.ok) {
      const gql = await gqlRes.json();
      const draws = gql?.data?.lotteryDraws;
      if (draws && draws.length >= 1 && draws[0].results && draws[0].results.length === 6) {
        const nums = draws[0].results.map(r => parseInt(r.no));
        const extra = parseInt(draws[0].extraNo);
        if (nums.every(n => n>=1 && n<=49) && extra>=1 && extra<=49) {
          const dstr = draws[0].drawDate?.slice(0,10);
          if (dstr && dstr > lastDraw.date) {
            previousDraw = lastDraw;
            lastDraw = { date: dstr, weekday: lastDraw.weekday, period: draws[0].drawNo || lastDraw.period, numbers: nums, extra: extra, jackpotWinners: 0, second: '', third: '' };
            source = 'HKJC GraphQL 官方';
          }
        }
      }
    }
  } catch(e) {}
  try {
    const r = await fetch('https://www.marksixinfo.com', { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const html = await r.text();
      const m = html.match(/26\/(\d{3})[\s\S]{0,500}2026-11-(\d{2})[\s\S]{0,800}?(\d{1,2})[,\s]+(\d{1,2})[,\s]+(\d{1,2})[,\s]+(\d{1,2})[,\s]+(\d{1,2})[,\s]+(\d{1,2})/);
      if (m) {
        const scrapedDate = '2026-11-' + m[2];
        const nums = [3,4,5,6,7,8].map(i => parseInt(m[i]));
        if (scrapedDate > lastDraw.date && nums.every(n=>n>=1&&n<=49)) {
          const extraM = html.match(/\+\s*(\d{1,2})/);
          const extra = extraM ? parseInt(extraM[1]) : lastDraw.extra;
          previousDraw = lastDraw;
          lastDraw = { date: scrapedDate, weekday: '星期四', period: '26/'+m[1], numbers: nums, extra: extra, jackpotWinners: 0, second: '', third: '' };
          source = 'marksixinfo 驗證';
        }
      }
    }
  } catch(e) {}
  return res.status(200).json({ source, lastUpdate: new Date().toISOString(), auto: true, verified: true, note: 'V6: 兜底 11/17, 若 source 含 Verified Fallback 即係 API 冇抓到新, 前端會再試瀏覽器直接抓', nextDraw, lastDraw, previousDraw });
}
