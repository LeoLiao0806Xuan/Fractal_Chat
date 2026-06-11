import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. 先拦截所有 JS，不让应用代码跑起来
  await page.route('**/*.js', route => route.abort());

  // 2. 加载页面 HTML（但 JS 不执行，不会连 IndexedDB）
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // 3. 现在 IndexedDB 没有活跃连接，可以正常删除
  const dbs = await page.evaluate(async () => {
    const names = [];
    try {
      const databases = await indexedDB.databases();
      for (const db of databases) {
        names.push(db.name);
        await new Promise((resolve, reject) => {
          const req = indexedDB.deleteDatabase(db.name);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
          req.onblocked = () => resolve();
        });
      }
    } catch (e) {
      console.error('databases() error:', e);
    }
    localStorage.clear();
    sessionStorage.clear();
    return names;
  });

  console.log('已删除数据库:', dbs.length ? dbs : '(无)');

  // 4. 放开 JS 拦截，重新加载
  await page.unroute('**/*.js');
  await page.reload({ waitUntil: 'networkidle' });
  await new Promise(r => setTimeout(r, 2000));

  // 5. 验证
  await page.route('**/*.js', route => route.abort());
  await page.reload({ waitUntil: 'networkidle' });
  const verify = await page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    return dbs.map(d => d.name);
  });
  console.log('验证后数据库:', verify);

  await page.unroute('**/*.js');
  await browser.close();
  console.log('✅ 完成');
}

main().catch(err => {
  console.error('❌ 失败:', err);
  process.exit(1);
});
