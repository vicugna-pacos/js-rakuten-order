const fs = require("fs");
const readline = require("readline");
const {google} = require("googleapis");
const config = require("config");

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];    // 読み書き可
const TOKEN_PATH = "token.json";    // トークン保存場所
const CREDENTIALS_PATH = "credentials.json";    // アプリ側の認証情報

let oAuth2Client = null;    // API実行に必要な認証情報

/**
 * モジュール初期化。
 * token.jsonがあればそれを読込み、無ければユーザーに認証を求める。
 */
module.exports.init = async function() {
    // 認証
    let credentialContent = fs.readFileSync(CREDENTIALS_PATH);
    let credentials = JSON.parse(credentialContent);
    oAuth2Client = new google.auth.OAuth2(
        credentials.installed.client_id
        , credentials.installed.client_secret
        , credentials.installed.redirect_uris[0]);
    
    if (!fs.existsSync(TOKEN_PATH)) {
        await getNewToken();
    }

    let tokenContent = fs.readFileSync(TOKEN_PATH);
    let token = JSON.parse(tokenContent);
    
    oAuth2Client.setCredentials(token);

};

/**
 * 新しいトークンを取得する
 */
async function getNewToken() {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES});
    
    console.log("このURLへアクセスしてアプリを承認してください：", authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(function(resolve, reject) {
        rl.question("承認後に表示されたコードを入力してください：", async (code) => {
            rl.close();
            let token = await oAuth2Client.getToken(code);
            // tokenを保存する
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
            console.log("トークンを以下のファイルへ保存しました。", TOKEN_PATH);
        });
    
    });
}

/**
 * 買うものリスト取得
 */
module.exports.getTodo = async function() {
    return await getSheetData(config.spreadsheet.todo.sheetName);
}

/**
 * シート全体のデータを取得
 * @param {string} sheetName 
 */
async function getSheetData(sheetName){
    const sheets = google.sheets({version: "v4"});
    const param = {
        spreadsheetId: config.spreadsheet.id,
        range: sheetName,
        auth : oAuth2Client
    };

    let response = await sheets.spreadsheets.values.get(param);
    return response.data;
}

module.exports.updateTodo = async function(rowIndex) {
    const sheetName = config.spreadsheet.todo.sheetName;
    const range = sheetName + "!A" + String(rowIndex + 1);
    const sheets = google.sheets({version: "v4"});
    const param = {
        spreadsheetId: config.spreadsheet.id,
        range: range,
        valueInputOption: "USER_ENTERED",
        resource : {
            values : [["FALSE"]]
        },
        auth : oAuth2Client
    };

    await sheets.spreadsheets.values.update(param);

};
