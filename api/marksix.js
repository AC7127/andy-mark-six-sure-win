export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const data = {
    source: 'HKJC',
    lastUpdate: new Date().toISOString(),
    nextDraw: { date: '2026-11-07', weekday: '星期六', time: '21:30', cutoff: '21:15', jackpot: '8,000,000', snowball: '0', period: '26/118' },
    lastDraw: { date: '2026-11-05', weekday: '星期四', period: '26/117', numbers: [11,20,28,29,42,47], extra: 46, jackpotWinners: '2.5注中 每注 $42,964,760', second: '6.5注中 $1,383,700', third: '407注中 $58,920' },
    previousDraw: { date: '2026-10-31', period: '26/116', numbers: [10,11,19,27,37,43], extra: 8, jackpotWinners: 0, second: '9.5注 $716,830', snowball: '80,429,724' }
  };
  return res.status(200).json(data);
}
