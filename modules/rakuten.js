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

    // IDとパスワードを入力する
    await page.type("#loginInner_u", config.rakuten.user_id, {delay:50});
    await page.type("#loginInner_p", config.rakuten.password, {delay:50});

    // ログインボタンを押す
    await Promise.all([
        page.waitForNavigation({"waitUntil":"domcontentloaded"}),
        page.click("input[name=submit].loginButton")
    ]);
    await page.waitFor(2000);
};

/**
 * お気に入りリストから、メモ欄と商品ページへのURLを取得する
 * 
 * @returns {{key:string, units:number, url:string}}
 */
module.exports.getBookmarks = async function(page) {
    let result = [];
    await page.goto(config.rakuten.bookmark.url, {waitUntil:"domcontentloaded"});

    while (true) {
        await page.waitForSelector("#bookmark-main div.Collapsible", {"visible":true});
        await page.waitFor(2000);
        let containers = await page.$$("#bookmark-main div.Collapsible");

        for (let container of containers) {
            let bookmark = {"key":null, "units":1, "url":null};

            // メモ欄取得
            let memoArea = await container.$("div[class*=memoLeft]");
            if (memoArea != null) {
                let memo = await memoArea.evaluate((node) => node.innerText);
                bookmark = parseMemo(memo, bookmark);
            }

            // 購入ページへのリンク取得
            let linkArea = await container.$("p[class*=title] > a");
            const soldout = await container.$("span[class*=soldOutTxt]");
            if (linkArea != null && soldout == null) {
                bookmark.url = await linkArea.evaluate((node) => node.href);
            }

            if (bookmark.key != null && bookmark.url != null) {
                result.push(bookmark);
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
 * お気に入りのメモ欄をパースする
 * 
 * @param {string}} memo 
 * @param {{key:string, units:number, url:string}} bookmark 
 */
function parseMemo(memo, bookmark) {
    if (memo.length == 0) {
        return bookmark;
    }
    if (memo.substring(0, 1) != "{") {
        bookmark.key = memo;
        return bookmark;
    }

    try {
        let obj = JSON.parse(memo);
        if (obj["key"]) {
            bookmark.key = obj.key;
        }
        if (obj["units"]) {
            bookmark.units = obj.units;
        }
    } catch (e) {
    }
    if (bookmark.key == null) {
        bookmark.key = memo;
    }

    return bookmark;
}

/**
 * カートに追加
 * 
 * @param page puppeteerのPageオブジェクト
 * @param {{key:string, units:number, url:string}} param カートに入れたい商品の情報
 * @returns {boolean} カート追加の成功or失敗
 */
module.exports.addCart = async function(page, param) {

    try {
        // 商品ページへ行く
        await page.goto(param.url, {waitUntil:"domcontentloaded"});
        await page.waitFor(2000);

        await Promise.all([
            page.waitForSelector("select[name=units]", {"visible":true})
            , page.waitForSelector("button.cart-button.add-cart", {"visible":true})
        ]);
        
        // 数量の選択
        if (param.units > 1) {
            await page.select("select[name=units]", String(param.units));
        }

        // 注文を押す
        const addcart_selector = "button.cart-button.add-cart";
        const addcart_button = await page.$(addcart_selector);
        if (addcart_button == null) {
            console.log("購入できない状態");
            return false;
        }
        await page.click(addcart_selector);
        
        // カートに追加しました　が出るまで待つ
        await page.waitForSelector("div.add-cart-success", {"visible":true});
        await page.waitFor(1000);

    } catch(e) {
        console.log(e);
        return false;
    }

    return true;
};
