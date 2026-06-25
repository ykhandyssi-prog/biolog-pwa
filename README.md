# biolog-pwa

体の日次記録（バイオログ）の個人用PWA。家計記録PWA（kakei-pwa）と同じ型。
設計の正本は Obsidian Vault の `70_Knowledge/バイオログPWA - 構想と設計方針.md`。

## 構成
- `index.html` — 本体（UI・ロジック・自前SVGグラフ・Firebase連携を内包、`type="module"`）
- `manifest.json` / `sw.js`（ネットワーク優先） / `icon.svg` / `icon-maskable.svg`

## データ
- Firestore `users/{uid}/days/{YYYY-MM-DD}`（1日1ドキュメント）、`users/{uid}/meta/settings`（flags語彙・vault名）
- 朝＝weight, sleep(1-5), onset, wake／夜＝mood(0-4), stress(0-4), nap, flags[]／共通＝memo
- 論理的な1日＝朝5時境界（00:00–04:59は前日扱い）

## エクスポート（二本立て）
- Firestore＝アプリ本体（同期・グラフ）
- Advanced URI＝「Obsidianへ送る」で `99_Attachments/biolog/data.md` に1日1行(JSON)を追記 → Obsidian Sync
- 保険としてJSON書き出しも有り

## セットアップ（初回・本人）
1. Firebase Console で新規プロジェクト `biolog-pwa` を作成
2. Authentication → Sign-in method → Google を有効化
3. Firestore Database を作成（本番モード・ロケーション asia-northeast1）、ルールを下記に
4. プロジェクト設定 → ウェブアプリを追加し、firebaseConfig を `index.html` の `firebaseConfig` に貼り替え（`REPLACE_ME` を置換）
5. Authentication → Settings → 承認済みドメインに `ykhandyssi-prog.github.io` を追加
6. 設定タブで Vault名 を入力（Advanced URI 用）

### Firestore ルール
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## 配信（GitHub Pages）
- リポジトリ `ykhandyssi-prog/biolog-pwa`（Public）、`index.html` を置いて Pages 有効化
- 公開URL `https://ykhandyssi-prog.github.io/biolog-pwa/`
- 更新はSWネットワーク優先で即反映（必要なら `sw.js` の `CACHE` 版数を上げる）
