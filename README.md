# js-rakuten-order
日用品を楽天で検索してカートに入れる

# 機能概要

1. Google Keepにメモした買い物リストを読み取る
1. 別の場所にある商品リストを検索し、商品名を取得する(ティッシュ→鼻セレブ3箱など)
1. 楽天市場にアクセスし、ログインする
1. 楽天市場で検索してカートにいれる
1. カートに入れることができたものは、Keepでチェックマークを付ける

商品をカートに入れるが、注文はしない。
楽天の場合、ログインしてからカートへの追加をすれば、ブラウザを閉じてもカートの情報が保存される。
そのため、スクリプト実行後、自分で楽天市場へアクセスし、カートの中身を確認しつつ注文する。

# 商品リスト
Excel(タブ区切りの方がよい？)

|No|列名|説明|
|-|-|-|
|1|名前|買い物リストに登録するときの名前。「ティッシュ」や「洗濯洗剤」など|
|2|検索ワード|楽天の商品検索で使う名前。商品名や番号など|
|3|商品名|備考欄。何を買うつもりなのか分かるように|
|4|ショップ番号|注文するショップを指定する。ショップ内で検索したときのURLに現れるsid。<br> ![](doc/image01.png)|
|5|ショップ名|備考欄|
|6|数量|いくつ買うか|

「名前」が同一の行を複数設定できる。その場合、上から順番にカートに入れられるかどうかを試し、成功したらそこで終了する。
(あるお店で商品が品切れだった場合に、別のお店で注文するようにできる)

# 設定ファイル

```サンプル
{
    "rakuten" : {
        "user_id" : ""
        , "password" : ""
    }
    , "goods" : {
        "path" : "goods.xlsx"
    }
    , "chrome" : {
        "executablePath" : "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
    }
}
```