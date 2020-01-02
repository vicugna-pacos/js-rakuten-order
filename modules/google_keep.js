const puppeteer = require("puppeteer-core");
const config = require("config");
const fs = require("fs");

/**
 * Google Keep のメモを開く
 * 
 * @param {Page} page
 */
module.exports.open = async function(page) {
/*
	let content = fs.readFileSync("cookie.json");
	let cookie = JSON.parse(content);

	await page.setCookie(...cookie);
*/
	await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36");

	await page.goto(config.google_keep.url, {
		"waitUntil" : "domcontentloaded"
	});

	// ログイン
	await page.type("#identifierId", config.google_keep.user_id);
	await page.waitFor(2000);

	await page.click("#identifierNext");
	await page.waitForNavigation({"waitUntil" : "networkidle0"});

	// パスワード入力
	await page.waitForSelector("#password input", {"visible":true});
	await page.type("#password input", config.google_keep.password);
	await page.waitFor(2000);

	await page.click("#passwordNext");
	await page.waitForNavigation({"waitUntil" : "networkidle0"});

	/*
	// ログイン後、メモが自動で開かないのでもう一度メモのURLへ移動する
	await page.goto(config.google_keep.url, {
		"waitUntil" : "networkidle0"
	});
	*/

	await page.waitFor(10000);
};
