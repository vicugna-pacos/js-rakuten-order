const config = require('config');

// ログインURL
const LOGIN_URL = "https://grp01.id.rakuten.co.jp/rms/nid/vc?__event=login&service_id=top";

/**
 * ログイン
 */
module.exports.login = async function(page) {
    await page.goto(LOGIN_URL, {waitUntil:"domcontentloaded"});

    // IDとパスワードを入力する
    await page.type("#loginInner_u", config.rakuten.user_id, {delay:50});
    await page.type("#loginInner_p", config.rakuten.password, {delay:50});

    // ログインボタンを押す
    await page.click("input[name=submit].loginButton");
    await page.waitFor(1000);
};

/**
 * お気に入りリストから、メモ欄と購入ページへのURLを取得する
 * 
 * @returns {{key:string, url:string}}
 */
module.exports.getBookmarks = async function(page) {
    let result = [];
    await page.goto(config.rakuten.bookmark.url, {waitUntil:"domcontentloaded"});

    while (true) {
        await page.waitForSelector("#bookmark-main div.Collapsible", {"visible":true});
        await page.waitFor(1000);
        let containers = await page.$$("#bookmark-main div.Collapsible");

        for (let container of containers) {
            // メモ欄取得
            let memoArea = await container.$("div[class*=memoLeft]");
            let memo = null;
            if (memoArea != null) {
                memo = await memoArea.evaluate((node) => node.innerText);
            }

            // 購入ページへのリンク取得
            let linkArea = await container.$("a[class*=cartBtn]");
            let url = null;
            if (linkArea != null) {
                url = await linkArea.evaluate((node) => node.href);
            }

            if (memo != null && url != null) {
                result.push({"key":memo, "url":url});
            }

        }

        // 次ページ
        let nextBtn = await page.$("a[class*=nextPageBtn]");
        if (nextBtn == null) {
            break;
        }

        await Promise.all([
            page.waitForNavigation({waitUntil:"domcontentloaded"}),
            nextBtn.click()
        ]);
    }

    return result;
};

/**
 * カートに追加
 * 
 * @param page puppeteerのPageオブジェクト
 * @param {{key:string, url:string}} param カートに入れたい商品の情報
 */
module.exports.addCart = async function(page, param) {

    try {
        await page.goto(param.url, {waitUntil:"domcontentloaded"});
        await page.waitFor(1000);

    } catch(e) {
        console.log(e);
        return false;
    }

    return true;
};
