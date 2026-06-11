import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 拦截 JS，不让应用写入
  await page.route('**/*.js', route => route.abort());
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // 读取数据库内容
  const data = await page.evaluate(async () => {
    const dbs = await indexedDB.databases();
    const result = {};
    for (const dbInfo of dbs) {
      const entries = [];
      const req = indexedDB.open(dbInfo.name);
      entries.push(await new Promise((resolve, reject) => {
        req.onsuccess = () => {
          const db = req.result;
          const storeNames = Array.from(db.objectStoreNames);
          const promises = storeNames.map(storeName => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            return new Promise(resolveStore => {
              const all = [];
              store.openCursor().onsuccess = e => {
                const cursor = e.target.result;
                if (cursor) {
                  all.push({ key: cursor.key, value: cursor.value });
                  cursor.continue();
                } else {
                  resolveStore(all);
                }
              };
            });
          });
          Promise.all(promises).then(storeData => {
            const map = {};
            storeNames.forEach((name, i) => { map[name] = storeData[i]; });
            resolve(map);
          });
        };
        req.onerror = () => reject(req.error);
      }));
      result[dbInfo.name] = entries[0];
    }
    return result;
  });

  console.log('数据库内容:', JSON.stringify(data, null, 2));
  await browser.close();
}

main().catch(err => {
  console.error('❌ 失败:', err);
  process.exit(1);
});
