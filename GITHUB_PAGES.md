# 公開展示與 GitHub Pages

此網站可獨立部署至 GitHub Pages，訪客不需登入 ChatGPT 或 GitHub。所有交易均為模擬，不會扣款。

## 本機開啟

1. 雙擊 `start-preview.cmd`，保持啟動視窗開啟。
2. 用同一台電腦的瀏覽器開啟 http://127.0.0.1:4173 。
3. 結束預覽時，在啟動視窗按 Ctrl+C。

`127.0.0.1` 代表開啟網址者自己的電腦，不能當成公開分享網址。如果關閉伺服器視窗，就必須重新啟動。

## GitHub Pages 部署目標

- GitHub 帳號：`ruichen0626`
- 預計使用的公開儲存庫：`save-and-earn`
- 預期發布網址：`https://ruichen0626.github.io/save-and-earn/`

上述網址必須在建立儲存庫並完成部署後才會生效；準備本機檔案不代表網站已經發布。

## 一次性設定

1. 登入 `ruichen0626`，建立公開的 `save-and-earn` 儲存庫。若已有同名儲存庫，先確認內容，避免覆蓋其他專案。
2. 將整理好的專案檔案推送到該儲存庫的 `main` 分支，包含 `.github/workflows/deploy-pages.yml`、`dist` 及說明文件。
3. 到儲存庫 **Settings → Pages → Build and deployment → Source**，選擇 **GitHub Actions**。
4. 到 **Actions → Deploy Save and Earn to GitHub Pages → Run workflow**，選 `main` 並執行。
5. 等待工作流程成功，使用部署結果回傳的 Pages 網址分享。後續推送到 `main` 會自動更新網站。

部署工作流程只會發布 `dist` 的網站檔案，不會發布本機伺服器或測試程式。原 Sites 的 `.openai` 設定與 Git 記錄不包含在公開用的乾淨副本中。

## 展示範圍

收藏、上架及訂單資料各自保存在訪客的瀏覽器，不會跨裝置、跨網址或跨使用者同步。AI、付款與物流均為原型示範。

參考：[GitHub 官方自動部署說明](https://docs.github.com/en/get-started/start-your-journey/deploying-your-website-automatically)。
