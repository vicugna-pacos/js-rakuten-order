const xlsx = require("xlsx");
const config = require("config");

// 商品リスト
const list = null;

/**
 * 商品リストを開き、変数に保持する
 */
module.exports.open = function() {
    let book = xlsx.readFile(config.goods.path);
    let sheet = book.Sheets["Sheet1"];
    list = [];

    // 2行目から明細が始まる
    for (let row = 1; row < 1000; row++) {
        let key = sheet[xlsx.utils.encode_cell({r:row, c:1})];
        let word = sheet[xlsx.utils.encode_cell({r:row, c:2})];
        let goodsName = sheet[xlsx.utils.encode_cell({r:row, c:2})];
        let sid = sheet[xlsx.utils.encode_cell({r:row, c:4})];
        let shopName = sheet[xlsx.utils.encode_cell({r:row, c:5})];
        let units = sheet[xlsx.utils.encode_cell({r:row, c:6})];

        if (key == null || key == "") {
            break;
        }

        list.push({
            "key":key
            , "word":word
            , "goodsName":goodsName
            , "sid":sid
            , "shopName":shopName
            , "units":units
        });
    }
    
};

/**
 * 引数で指定したキーに一致する行を返す
 */
module.exports.search = function(key) {
    let result = [];

    for (row in list) {
        if (key == row.key) {
            result.push(row);
        }
    }

    return result;
};
