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
		// スプレッドシートから買い物リストと商品リストを取得
		await spreadsheet.init();

		let todos = await spreadsheet.getTodo();
		let items = await spreadsheet.getItems();

		// ブラウザを起動してログイン
		const page = await browser.newPage();
		await rakuten.login(page);

		// 買い物リストのループ
		for (let todo of todos.values) {
			if (todo[0] != "TRUE") {
				continue;
			}

			// 商品リストを探す
			let founds = searchItems(todo[1], items);

			for (let found of founds) {
				let succeed = await rakuten.addCart(page, found);

				if (succeed) {
					// TODO 完了にする
					break;
				}
			}
		}

	} finally {
		browser.close();
	}
})();

/**
 * 買い物リストのキーを使って商品リストを探す
 * 
 * @param {string} key 
 * @param {*} items 
 */
function searchItems(key, items) {
	let result = [];
	for (let item of items.values) {
		if (key == item[0]) {
			result.push({
				"word":item[2]
				,"sid":item[3]
				,"units":item[5]
			});
		}
	}
	return result;
}