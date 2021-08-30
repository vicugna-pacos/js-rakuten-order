const config = require('config');

// ログインURL
const LOGIN_URL = "https://grp01.id.rakuten.co.jp/rms/nid/vc?__event=login&service_id=top";

/**
 * ログイン
 */
module.exports.login = async function(page) {
    await page.goto(LOGIN_URL, {waitUntil:"domcontentloaded"});
    await page.waitForSelector("#loginInner_u",{"visible":true});
    await page.waitForSelector("#loginInner_p",{"visible":true});
    await page.waitForTimeout(2000);

    // IDとパスワードを入力する
    await page.type("#loginInner_u", config.rakuten.user_id);
    await page.type("#loginInner_p", config.rakuten.password);

    // ログインボタンを押す
    await Promise.all([
        page.waitForNavigation({"waitUntil":"domcontentloaded"}),
        page.click("input[name=submit].loginButton")
    ]);
    await page.waitForTimeout(2000);
};

module.exports.addCart = async function(page, todoKey) {
    let found = false;
    let succeed = false;

    console.log(todoKey);

    // ブックマークのページを開く
    await page.goto(config.rakuten.bookmark.url, {waitUntil:"domcontentloaded"});

    // ブックマークされている商品のループ
    while (true) {
        await page.waitForSelector("#bookmark-main div.Collapsible", {"visible":true});
        let containers = await page.$$("#bookmark-main div.Collapsible");

        for (let container of containers) {

            // メモ欄取得
            let memoArea = await container.$("div[class*=memoLeft]");
            if (memoArea == null) {
                continue;
            }
            let memo = await memoArea.evaluate((node) => node.innerText);

            if (memo != todoKey) {
                continue;
            }

            found = true;

            // 購入ボタン取得
            let link = await container.$x(".//a[contains(text(), '購入手続きへ')]");
            if (link.length == 0) {
                console.log("  購入ボタンなし");
                break;
            }

            // カートに入れる
            await Promise.all([
                page.waitForNavigation({"waitUntil":"domcontentloaded"}),
                link[0].click()
            ]);
            await page.waitForTimeout(2000);

            succeed = true;
            break;

        }

        if (found || succeed) {
            break;
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
        await page.waitForTimeout(2000);
    }

    if (!found) {
        console.log("  リストに登録なし");
    } else if (succeed) {
        console.log("  購入成功");
    }

    return succeed;
};
