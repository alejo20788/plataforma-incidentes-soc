const url = process.env.MEASURE_URL || 'http://localhost:3000/';
(async () => {
  const times = [];
  for (let i = 0; i < 10; i++) {
    const t = performance.now();
    const response = await fetch(url, { cache: 'no-store' });
    const bytes = Buffer.byteLength(await response.text());
    times.push(Number((performance.now() - t).toFixed(2)));
    if (i === 0) console.log('URL:', url, 'HTTP:', response.status, 'bytes:', bytes);
  }
  console.log('Duraciones (ms):', times);
  console.log('Promedio (ms):', Number((times.reduce((a,b)=>a+b,0)/times.length).toFixed(2)));
})().catch(e => { console.error(e.message); process.exitCode=1; });
