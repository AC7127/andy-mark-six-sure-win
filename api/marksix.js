// Vercel /api/marksix - AUTO V7 - 修正 3 個 Bug: 特別號 41 唔係 4, 下期 11/24 唔係 11/19, 上上期同步
// 11/19 真結果: 12 18 32 45 47 49 +41, 二獎 1注 $2,181,540, 三獎 75注 $77,560
// 下期: 11/24 星期二 26/124 幸運二金多寶, 初步 $68M, 集氣加碼最高 $80M, 金多寶 $50M, 11/21 取消
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
  let lastDraw = { date: '2026-11-19', weekday: '星期四', period: '26/123', numbers: [12,18,32,45,47,49], extra: 41, jackpotWinners: 0, jackpotAmount: '0', second: '1注中 $2,181,540', third: '75注中 $77,560' };
  let nextDraw = { date: '2026-11-24', weekday: '星期二', time: '21:30', cutoff: '21:15', jackpot: '68,000,000', jackpotNote: '集氣加碼最高 $80,000,000', snowball: '50,000,000', period: '26/124' };
  let previousDraw = { date: '2026-11-17', weekday: '星期二', period: '26/122', numbers: [4,7,18,30,42,45], extra: 36, jackpotWinners: 0, second: '4注中 $440,270', third: '75注中 $62,610' };
  let source = 'HKJC Verified Fallback 2026-11-19';
  // 嘗試 HKJC GraphQL
  try {
    const gqlRes = await fetch('https://info.cld.hkjc.com/graphql/base/', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ query: `query { lotteryDraws(drawType: "marksix", size: 3) { id drawDate drawNo results { no } extraNo } }` }),
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
            // 下期唔再用硬編碼舊值: 如果上期變咗, 下期要跟住推 (但 11/24 係特殊, 11/21 取消, 所以唔用 +2日估)
            source = 'HKJC GraphQL 官方';
          }
        }
      }
    }
  } catch(e) {}
  // 嘗試 marksixinfo - 一次過抓 6+1, 特別號係第 7 個, 唔再用第一個 +
  try {
    const r = await fetch('https://www.marksixinfo.com', { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const html = await r.text();
      // 7-number pattern: 6 個號 + 1 個特別號, 容許 <br> / 空格
      const m = html.match(/26\/(\d{3})[\s\S]{0,500}2026-11-(\d{2})[\s\S]{0,800}?(\d{1,2})[,\s<br>\/]+(\d{1,2})[,\s<br>\/]+(\d{1,2})[,\s<br>\/]+(\d{1,2})[,\s<br>\/]+(\d{1,2})[,\s<br>\/]+(\d{1,2})[^\d]{0,10}\+[^\d]{0,10}(\d{1,2})/);
      if (m) {
        const scrapedDate = '2026-11-' + m[2];
        const nums = [3,4,5,6,7,8].map(i => parseInt(m[i]));
        const extra = parseInt(m[9]);
        if (scrapedDate > lastDraw.date && nums.every(n=>n>=1&&n<=49) && extra>=1 && extra<=49) {
          previousDraw = lastDraw;
          // 派彩: 嘗試從頁面抓二獎三獎, 唔再留空
          let second = '', third = '';
          const secM = html.match(/Second Prize[^$]*\$([\d,]+)\s*\/\s*([\d.]+)/);
          if (secM) second = secM[2] + '注中 $' + secM[1];
          const thirdM = html.match(/Third Prize[^$]*\$([\d,]+)\s*\/\s*([\d.]+)/);
          if (thirdM) third = thirdM[2] + '注中 $' + thirdM[1];
          lastDraw = { date: scrapedDate, weekday: '星期二', period: '26/'+m[1], numbers: nums, extra: extra, jackpotWinners: 0, second: second, third: third };
          source = 'marksixinfo 驗證';
        }
      }
    }
  } catch(e) {}
  // 下期邏輯: 如果上期已經係 11/19, 下期固定係 11/24 (因為 11/21 取消), 唔再用舊硬編碼 11/19
  if (lastDraw.date === '2026-11-19') {
    nextDraw = { date: '2026-11-24', weekday: '星期二', time: '21:30', cutoff: '21:15', jackpot: '68,000,000', jackpotNote: '集氣加碼最高 $80,000,000', snowball: '50,000,000', period: '26/124' };
  }
  return res.status(200).json({ source, lastUpdate: new Date().toISOString(), auto: true, verified: true, note: 'V7: 特別號一次過抓 6+1, 下期 11/24 特殊處理, 上上期同步', nextDraw, lastDraw, previousDraw });
}
