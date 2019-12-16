const puppeteer = require("puppeteer-core");
const config = require("config");
const rakuten = require("./modules/rakuten.js");
const goods = require("./modules/goods.js");
const shopping_list = require("./modules/shopping_list.js");

(async () => {

	// キャッチされなかったPromiseのエラー詳細を出してくれる
	process.on("unhandledRejection", console.dir);
   
    let LAUNCH_OPTION = {
        headless : false
       ,executablePath : "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
    };

    if (config["chrome"] && config["chrome"]["executablePath"] && config["chrome"]["executablePath"] != "") {
        LAUNCH_OPTION.executablePath = config.chrome.executablePath;
    }

    const browser = await puppeteer.launch(LAUNCH_OPTION);
    
    try {
        const page = await browser.newPage();   // 新しいタブを開く

        // 楽天市場にログイン
        await rakuten.login(page);

        // 商品リストを開く
        goods.open();

        // 買い物リストを開く
        await shopping_list.open(page);

        let shopping_item = await shopping_list.next(page);

        while(shopping_item != null) {
            // 商品リストを探す
            let param = goods.search(shopping_item.key);
            //param["word"] = "ティッシュ";
            //param["sid"] = "261122";
            //param["units"] = 2;

            let succeed = await rakuten.addCart(page, param);

            if (succeed) {
                // 完了にする
                await shopping_list.done(page);
            }

            // 次
            shopping_item = await shopping_list.next(page);
        }

    } finally {
        browser.close();
    }
})();
