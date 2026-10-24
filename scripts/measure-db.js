require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const samples = [];
  for (let i = 0; i < 10; i++) {
    const t = performance.now();
    await prisma.incidente.findMany({ orderBy: { createdAt: 'desc' } });
    samples.push(Number((performance.now() - t).toFixed(2)));
  }
  console.log(JSON.stringify({ operation: 'findMany', repetitions: 10, ms: samples, averageMs: Number((samples.reduce((a,b)=>a+b,0)/samples.length).toFixed(2)) }, null, 2));
})().catch(e => { console.error(e.message); process.exitCode=1; }).finally(() => prisma.$disconnect());
