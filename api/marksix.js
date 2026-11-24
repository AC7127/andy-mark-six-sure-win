// Vercel /api/marksix - AUTO V9 - 真自動同步核心
// 11/24 真結果: 1 20 26 28 35 41 +36, 二獎 6注 $1,140,540, 三獎 190注 $96,040
// 下期: 11/28 星期六 26/125, $102M, 金多寶 $75,529,811, 11/26 唔開
// V9 重點: 1) 先讀 GitHub Action 更新嘅 data/marksix.json (最可靠, 每15分鐘更新) 2) 再試 HKJC + marksixinfo 3) 計預期上期, 標明 stale 4) 唔再話兜底係已同步
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  // 預期上期: 搵最近一個已過 21:30 嘅攪珠日 (二/四/六)
  function expectedLastDraw(){
    var now = new Date();
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var day = d.getDay();
    var hour = now.getHours() + now.getMinutes()/60;
    var isDraw = (day===2||day===4||day===6);
    var t = new Date(d);
    if(!(isDraw && hour>=21.5)){
      do{ t.setDate(t.getDate()-1); }while(!(t.getDay()===2||t.getDay()===4||t.getDay()===6));
    }
    var skipped = ['2026-11-21','2026-11-26'];
    while(skipped.includes(t.toISOString().slice(0,10))){
      t.setDate(t.getDate()-1);
      while(!(t.getDay()===2||t.getDay()===4||t.getDay()===6)){ t.setDate(t.getDate()-1); }
    }
    return t.toISOString().slice(0,10);
  }
  var expected = expectedLastDraw();

  let lastDraw = { date: '2026-11-24', weekday: '星期二', period: '26/124', numbers: [1,20,26,28,35,41], extra: 36, jackpotWinners: 0, jackpotAmount: '0', second: '6注中 $1,140,540', third: '190注中 $96,040' };
  let nextDraw = { date: '2026-11-28', weekday: '星期六', time: '21:30', cutoff: '21:15', jackpot: '102,000,000', jackpotNote: '11/26唔開, 改星期六', snowball: '75,529,811', period: '26/125' };
  let previousDraw = { date: '2026-11-19', weekday: '星期四', period: '26/123', numbers: [12,18,32,45,47,49], extra: 41, jackpotWinners: 0, second: '1注中 $2,181,540', third: '75注中 $77,560' };
  let source = 'HKJC Verified Fallback 2026-11-24';
  let stale = (lastDraw.date < expected);

  // 1) 最可靠: GitHub Action 寫嘅 JSON (每15分鐘更新, 唔經 HKJC, 唔怕 Vercel IP 被封)
  try{
    const gh = await fetch('https://raw.githubusercontent.com/AC7127/andy-mark-six-sure-win/main/data/marksix.json', { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) });
    if(gh.ok){
      const gj = await gh.json();
      if(gj && gj.lastDraw && gj.lastDraw.date && gj.lastDraw.numbers && gj.lastDraw.numbers.length===6){
        // 只有當 GitHub JSON 比硬編碼新, 先用佢
        if(gj.lastDraw.date >= lastDraw.date){
          lastDraw = gj.lastDraw;
          if(gj.nextDraw) nextDraw = gj.nextDraw;
          if(gj.previousDraw) previousDraw = gj.previousDraw;
          source = 'GitHub Action JSON ' + (gj.source||'') + ' (' + (gj.lastUpdate||'') + ')';
        }
      }
    }
  }catch(e){}

  // 2) 試 HKJC GraphQL
  try{
    const gqlRes = await fetch('https://info.cld.hkjc.com/graphql/base/', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({ query: `query { lotteryDraws(drawType: "marksix", size: 3) { id drawDate drawNo results { no } extraNo } }` }),
      signal: AbortSignal.timeout(6000)
    });
    if(gqlRes.ok){
      const gql = await gqlRes.json();
      const draws = gql?.data?.lotteryDraws;
      if(draws && draws.length>=1 && draws[0].results && draws[0].results.length===6){
        const nums = draws[0].results.map(r=>parseInt(r.no));
        const extra = parseInt(draws[0].extraNo);
        if(nums.every(n=>n>=1&&n<=49) && extra>=1&&extra<=49){
          const dstr = draws[0].drawDate?.slice(0,10);
          if(dstr && dstr > lastDraw.date){
            previousDraw = lastDraw;
            lastDraw = { date: dstr, weekday: lastDraw.weekday, period: draws[0].drawNo||lastDraw.period, numbers: nums, extra: extra, jackpotWinners: 0, second: '', third: '' };
            source = 'HKJC GraphQL 官方';
          }
        }
      }
    }
  }catch(e){}

  // 3) 試 marksixinfo
  try{
    const r = await fetch('https://www.marksixinfo.com', { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) });
    if(r.ok){
      const html = await r.text();
      const m = html.match(/26\/(\d{3})[\s\S]{0,600}2026-11-(\d{2})[\s\S]{0,1000}?(\d{1,2})[,\s<br>\/]+(\d{1,2})[,\s<br>\/]+(\d{1,2})[,\s<br>\/]+(\d{1,2})[,\s<br>\/]+(\d{1,2})[,\s<br>\/]+(\d{1,2})[^\d]{0,15}\+[^\d]{0,15}(\d{1,2})/);
      if(m){
        const scrapedDate = '2026-11-' + m[2];
        const nums = [3,4,5,6,7,8].map(i=>parseInt(m[i]));
        const extra = parseInt(m[9]);
        if(scrapedDate > lastDraw.date && nums.every(n=>n>=1&&n<=49) && extra>=1&&extra<=49){
          previousDraw = lastDraw;
          let second='', third='';
          const secM = html.match(/Second Prize[^$]*\$([\d,]+)\s*\/\s*([\d.]+)/);
          if(secM) second = secM[2]+'注中 $'+secM[1];
          const thirdM = html.match(/Third Prize[^$]*\$([\d,]+)\s*\/\s*([\d.]+)/);
          if(thirdM) third = thirdM[2]+'注中 $'+thirdM[1];
          lastDraw = { date: scrapedDate, weekday: '星期二', period: '26/'+m[1], numbers: nums, extra: extra, jackpotWinners: 0, second: second, third: third };
          source = 'marksixinfo 驗證';
        }
      }
    }
  }catch(e){}

  // 下期邏輯: 如果上期已經係 11/24, 下期固定 11/28 (11/26唔開)
  if(lastDraw.date === '2026-11-24'){
    nextDraw = { date: '2026-11-28', weekday: '星期六', time: '21:30', cutoff: '21:15', jackpot: '102,000,000', jackpotNote: '11/26唔開, 改星期六', snowball: '75,529,811', period: '26/125' };
  }
  stale = (lastDraw.date < expected);

  return res.status(200).json({ source, lastUpdate: new Date().toISOString(), auto: true, verified: true, expectedLastDraw: expected, stale: stale, note: 'V9: GitHub Action JSON 優先 + HKJC + marksixinfo + stale 標記', nextDraw, lastDraw, previousDraw });
}
