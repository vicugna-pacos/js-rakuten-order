const puppeteer = require('puppeteer-core');
const rakuten = require('./modules/rakuten.js');
const goods = require('./modules/goods.js');

(async () => {
    const LAUNCH_OPTION = {
        headless : false
       ,executablePath : 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
   };

	// キャッチされなかったPromiseのエラー詳細を出してくれる
	process.on('unhandledRejection', console.dir);
   
    const browser = await puppeteer.launch(LAUNCH_OPTION);
    try {
        const page = await browser.newPage();   // 新しいタブを開く

        // 商品リストを開く
        goods.open();

        // 楽天市場にログイン
        await rakuten.login(page);
        
        let param = {};
        param["word"] = "ティッシュ";
        param["sid"] = "261122";
        param["units"] = 2;

        await rakuten.order(page, param);

    } finally {
        browser.close();
    }
})();
