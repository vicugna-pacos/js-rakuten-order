const puppeteer = require("puppeteer-core");
const config = require("config");
const rakuten = require("./modules/rakuten.js");
const gkeep = require("./modules/google_keep.js");

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

		const pageKeep = await browser.newPage();
		await gkeep.open(pageKeep);

		//const pageRakuten = await browser.newPage();

/*

		await rakuten.login(page);

		// 買い物リストのループ
		for (let todoIndex = 0; todoIndex < todos.values.length; todoIndex++) {
			let todo = todos.values[todoIndex];

			if (todo[0] != "TRUE") {
				continue;
			}

			// 商品リストを探す
			let founds = searchItems(todo[1], items);

			for (let found of founds) {
				let succeed = await rakuten.addCart(page, found);

				if (succeed) {
					// TODO 完了にする
					await spreadsheet.updateTodo(todoIndex);
					break;
				}
			}
		}
*/

	} finally {
		browser.close();
	}
})();

