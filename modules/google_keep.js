const puppeteer = require("puppeteer-core");
const config = require("config");

/**
 * Google Keep のメモを開く
 * 
 * @param {Page} page
 */
module.exports.open = async function(page) {
	await page.goto(config.google_keep.url, {
		"waitUntil" : "domcontentloaded"
	});

	// ログイン
	await page.type("#identifierId", config.google_keep.user_id, {"delay":100});
	
	// 次へ
	await Promise.all([
		page.waitForNavigation({
			"waitUntil" : "networkidle0"
		}),
		page.click("#identifierNext")
	]);

	// パスワード入力
	await page.type("#password input", config.google_keep.password, {"delay":100});
	await page.waitFor(2000);

	// 次へ
	await Promise.all([
		page.waitForNavigation({
			"waitUntil" : "networkidle0"
		}),
		page.click("#passwordNext")
	]);

	// ログイン後、メモが自動で開かないのでもう一度メモのURLへ移動する
/*	await page.goto(config.google_keep.url, {
		"waitUntil" : "networkidle0"
	});
*/
	await page.waitFor(5000);
};
