const puppeteer = require("puppeteer-core");
const config = require("config");
const rakuten = require("./modules/rakuten.js");
const spreadsheet = require("./modules/spreadsheet.js");

(async () => {

	// キャッチされなかったPromiseのエラー詳細を出してくれる
	process.on("unhandledRejection", console.dir);

	let LAUNCH_OPTION = {
		headless: false
		, executablePath: "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
	};

	if (config["chrome"] && config["chrome"]["executablePath"] && config["chrome"]["executablePath"] != "") {
		LAUNCH_OPTION.executablePath = config.chrome.executablePath;
	}

	const browser = await puppeteer.launch(LAUNCH_OPTION);

	try {

		// スプレッドシートから買い物リストを取得
		await spreadsheet.init();
		let todos = await spreadsheet.getTodo();

		// ブラウザを起動してログイン
		const page = await browser.newPage();
		await rakuten.login(page);

		// お気に入りを開く
		await rakuten.openBookMark(page);

		let first = true;

		// 買い物リストのループ
		for (let todoIndex = 0; todoIndex < todos.values.length; todoIndex++) {
			let todo = todos.values[todoIndex];

			if (todo[0] != "TRUE") {
				continue;
			}

			if (first) {
				first = false;
			} else {
				// 1ページ目へ戻る
				await rakuten.gotoFirstPage(page);
			}

			// 商品リストを探す
			let succeed = await rakuten.searchBookmark(browser, page, todo[1]);

			if (succeed) {
				// 完了にする
				await spreadsheet.updateTodo(todoIndex);
			}
		}

	} finally {
		browser.close();
	}
})();

async function test(browser, page) {
	await page.goto("https://www.rakuten.co.jp/", {waitUntil:"domcontentloaded"});
	await page.waitFor(2000);

	// Ctrlキーを押す(ControlRight)でもOK)
	await page.keyboard.down("ControlLeft");
	// リンクを押す
	await page.click("a[sc_linkname=\"grayheader01\"]");
	// Ctrlキーを話す
	await page.keyboard.up("ControlLeft");
	
	// 開いたタブを最前面にする
	const pages = await browser.pages();
	const newPage = pages[pages.length-1];
	await newPage.bringToFront();

	await page.waitFor(10000);

}