const config = require('config');

// ログインURL
const RAKUTEN_URL = "https://www.rakuten.co.jp/";

/**
 * ログイン
 */
module.exports.login = async function(page) {
    // トップページ
    await page.goto(RAKUTEN_URL, {waitUntil:"domcontentloaded"});
    await page.waitFor(2000);

    const loginBtns = await page.$x("//button/div[contains(text(), 'ログイン')]");

    if (loginBtns.length == 0) {
        throw "ログインボタンなし";
    }

    await Promise.all([
        page.waitForNavigation({"waitUntil":"domcontentloaded"}),
        loginBtns[0].click()
    ]);

    // ログインページ
    await page.waitForSelector("#loginInner_u",{"visible":true});
    await page.waitForSelector("#loginInner_p",{"visible":true});
    await page.waitFor(3000);

    // IDとパスワードを入力する
    await page.type("#loginInner_u", config.rakuten.user_id);
    await page.type("#loginInner_p", config.rakuten.password);

    // ログインボタンを押す
    await Promise.all([
        page.waitForNavigation({"waitUntil":"domcontentloaded"}),
        page.click("input[name=submit].loginButton")
    ]);
    await page.waitFor(5000);
};

/**
 * トップページからお気に入り一覧を開く
 */
module.exports.openBookMark = async function(page) {
    // トップページからお気に入りへ行く
    await Promise.all([
        page.waitForNavigation({"waitUntil":"domcontentloaded"}),
        page.click("a.header-link.bookmark")
    ]);
    await page.waitFor(3000);

    // ブックマークリストから目的のリストを選ぶ
    const lists = await page.$("div#bookmark-lists");
    const list = await lists.$x("//div[contains(text(), '消耗品')]");

    if (list.length == 0) {
        throw "ブックマークリストなし";
    }

    await Promise.all([
        page.waitForNavigation({"waitUntil":"domcontentloaded"}),
        list[0].click()
    ]);

    await page.waitFor(3000);

    // 並び順を「登録日時が古い順」へ変える
    await page.select("span[class*=sortSelector] select");
    await page.waitFor(3000);
};

/**
 * お気に入りページにて、1ページ目へのリンクを押す
 */
module.exports.gotoFirstPage = async function(page) {
    const div = await page.$("div.pagination");
    const links = await div.$x("//a[contains(text(), '1')]");

    if (links.length == 0) {
        throw "1ページ目へのリンクなし";
    }

    await links[0].click();
    await page.waitFor(3000);
};

/**
 * 
 */
module.exports.searchBookmark = async function(browser, page, key) {

    let succeed = false;
    while (true) {
        await page.waitForSelector("#bookmark-main div.Collapsible", {"visible":true});
        let containers = await page.$$("#bookmark-main div.Collapsible");

        for (let container of containers) {
            let bookmark = {"key":null, "units":1};

            // メモ欄取得
            let memoArea = await container.$("div[class*=memoLeft]");
            if (memoArea != null) {
                let memo = await memoArea.evaluate((node) => node.innerText);
                bookmark = parseMemo(memo, bookmark);
            }

            // 売り切れチェック
            const soldoutText = await container.$("span[class*=soldOutTxt]");
            let isSoldOut = false;
            if (soldoutText != null) {
                isSoldOunt = await page.evaluate((elm)=>{
                    if (elm.style.visible == "none" || elm.style.visibility == "hidden") {
                        return false;
                    }
                    return true;
                }, soldoutText);
            }

            if (isSoldOut || key != bookmark.key) {
                continue;
            }

            // キー一致
            succeed = await addCart(browser, page, container, bookmark);
            if (!succeed) {
                continue;
            }

            break;
        }

        if (succeed) {
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
        await page.waitFor(3000);
    }

    return succeed;
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
async function addCart(browser, page, container, param) {

    try {
        // 商品ページへ行く
        const link = await container.$("p[class*=title] a");
        if (link == null) {
            console.log("リンクが見つからない");
            return false;
        }

        await page.waitFor(3000);
        
        // Ctrlキーを押す(ControlRight)でもOK)
        await page.keyboard.down("ControlLeft");
        // リンクを押す
        await link.click();
        // Ctrlキーを話す
        await page.keyboard.up("ControlLeft");

        // 開いたタブを最前面にする
        const pages = await browser.pages();
        const newPage = pages[pages.length-1];
        await newPage.bringToFront();

        await newPage.waitFor(3000);

        await Promise.all([
            newPage.waitForSelector("select[name=units]", {"visible":true})
            , newPage.waitForSelector("button.cart-button.add-cart", {"visible":true})
        ]);
        
        // 数量の選択
        if (param.units > 1) {
            await newPage.select("select[name=units]", String(param.units));
        }

        // 注文を押す
        const addcart_selector = "button.cart-button.add-cart";
        const addcart_button = await newPage.$(addcart_selector);
        if (addcart_button == null) {
            console.log("購入できない状態");
            return false;
        }
        await newPage.click(addcart_selector);
        
        // カートに追加しました　が出るまで待つ
        // ※↑を待つと妙に遅いので、3秒待つ
        //await page.waitForSelector("div.add-cart-success", {"visible":true});
        await newPage.waitFor(3000);

        await newPage.close();

    } catch(e) {
        console.log(e);
        return false;
    }

    return true;
};
