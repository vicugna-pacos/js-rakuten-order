const config = require('config');

// ログインURL
const LOGIN_URL = "https://grp01.id.rakuten.co.jp/rms/nid/vc?__event=login&service_id=top";
// 検索結果のURL　s=2は安い順
const SEARCH_URL = "https://search.rakuten.co.jp/search/mall/[word]/?s=2&sid=[sid]";

/**
 * 商品検索→カートに追加
 * 
 * @param page puppeteerのPageオブジェクト
 * @param param カートに入れたい商品の情報
 *   word : 検索ワード
 *   sid : ショップ番号
 *   units : 数量
*/
module.exports.addCart = async function(page, param) {

    try {
        // 検索
        let url = SEARCH_URL;
        url = url.replace("[word]", param["word"]);
        url = url.replace("[sid]", param["sid"]);

        await page.goto(url, {waitUntil:"domcontentloaded"});

        // 結果があるか確認する
        let first_item = await page.$("div.dui-container.searchresults > div > div:nth-child(1) > div.content.title > h2 > a");

        if (first_item == null) {
            return false;
        }

        // 最初の1件の商品ページへ移動する
        await first_item.click();
        await page.waitForNavigation({waitUntil:"domcontentloaded"});

        // 数量の選択
        if (param["units"] > 1) {
            await page.select("select[name=units]", String(param["units"]));
        }

        // 注文を押す
        await page.click("button.cart-button.add-cart");
        // カートに追加しました　が出るまで待つ
        await page.waitForSelector("div.add-cart-success", {visible:true});

    } catch(e) {
        console.log(e);
        return false;
    }

    return true;
};

/**
 * ログイン
 */
module.exports.login = async function(page) {
    await page.goto(LOGIN_URL, {waitUntil:"domcontentloaded"});

    // IDとパスワードを入力する
    await page.type("#loginInner_u", config.rakuten.user_id, {delay:200});
    await page.type("#loginInner_p", config.rakuten.user_id, {delay:200});

    // ログインボタンを押す
    await page.click("input[name=submit].loginButton");
    await page.waitForNavigation({waitUntil:"domcontentloaded"});
};
