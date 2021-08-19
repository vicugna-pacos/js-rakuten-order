const puppeteer = require("puppeteer-core");
const config = require("config");
const rakuten = require("./modules/rakuten.js");
const spreadsheet = require("./modules/spreadsheet.js");

(async () => {

	// キャッチされなかったPromiseのエラー詳細を出してくれる
	process.on("unhandledRejection", console.dir);

	let LAUNCH_OPTION = {
		headless: false
		, executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe"
	};

	if (config["chrome"] && config["chrome"]["executablePath"] && config["chrome"]["executablePath"] != "") {
		LAUNCH_OPTION.executablePath = config.chrome.executablePath;
	}

	const browser = await puppeteer.launch(LAUNCH_OPTION);

	try {

		// スプレッドシートから買い物リストを取得
		await spreadsheet.init();
		let todos = await spreadsheet.getTodo();

		// ブラウザを起動してログイン＆お気に入りリスト取得
		const page = await browser.newPage();

		await page.evaluateOnNewDocument(() => {
			Object.defineProperty(navigator, 'webdriver', ()=>{});
			delete navigator.__proto__.webdriver;
		});

		await rakuten.login(page);
		let bookmarks = await rakuten.getBookmarks(page);

		console.log("=== bookmarks ===")
		console.log(bookmarks);

		// 買い物リストのループ
		for (let todoIndex = 0; todoIndex < todos.values.length; todoIndex++) {
			let todo = todos.values[todoIndex];

			if (todo[0] != "TRUE") {
				continue;
			}

			// 商品リストを探す
			let found = searchBookmark(todo[1], bookmarks);

			if (found != null) {
				let succeed = await rakuten.addCart(page, found);

				if (succeed) {
					// 完了にする
					await spreadsheet.updateTodo(todoIndex);
				}
			}
		}

	} finally {
		browser.close();
	}
})();

/**
 * お気に入りリストから、指定したキーを持つものを探す
 * @param {string} key 
 * @param {{key:string, units:number, url:string}} bookmarks 
 */
function searchBookmark(key, bookmarks) {
	for (let bookmark of bookmarks) {
		if (key == bookmark.key) {
			return bookmark;
		}
	}
	return null;
}