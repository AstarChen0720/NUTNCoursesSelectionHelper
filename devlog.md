# 開發紀錄

## 2026-02-02 爬蟲核心邏輯與 API 串接

### 1. API 逆向工程與資料來源確認
- **發現**：原本使用 `/Course/Qry/cos` (網頁查詢) 會回傳包含大量 HTML 標籤的字串，資料量大且難以解析。
- **改進**：改用 `/Course/api/Query/GetCourse` (API 查詢)，直接取得乾淨的 JSON 陣列資料。
- **參數分析**：
  - `acs`: 學期代碼 (固定 "1142")。
  - `ki`: 分類標籤 (2:大學部, 3:研究所, 4:通識, 5:師培, 6:其他)。
  - `dc`: 科系代碼 (大學/研究所需填)。
  - `ge`/`ta`/`ot`: 對應通識/師培/其他類別的細項代碼。

### 2. 安全性驗證 (CSRF Token) 處理
- **問題**：選課系統 API 需要 `x-csrf-token` 標頭驗證。
- **解決方案**：實作自動偵測函式 `getCsrfToken()`，依序從以下位置尋找 Token，確保 Content Script 能成功發送請求：
  1. `document.cookie` (若非 HttpOnly)。
  2. 頁面隱藏欄位 `<input name="__RequestVerificationToken">` (主要來源)。
  3. `<meta name="csrf-token">`。

### 3. 實作全站課程爬蟲 (Content Script)
- 在 `content.ts` 注入測試按鈕，實作五個獨立迴圈以抓取全校課程：
  1. **通識 (ki:4)**：遍歷 `geCodes` (A~AG)。
  2. **師培 (ki:5)**：遍歷 `taCodes`。
  3. **其他 (ki:6)**：遍歷 `otCodes`。
  4. **大學部 (ki:2)**：先跑迴圈 1~6 學院呼叫 `GetDept` 取得系所代碼，再遍歷系所抓課。
  5. **研究所 (ki:3)**：同上，參數 `t` 改為 3。
- **成果**：完成能夠真實發送請求、統計資料總筆數與 JSON 體積 (MB) 的測試程式。

### 下一步
- 評估資料大小，決定使用 LocalStorage 或 IndexedDB 儲存。
- 開發攔截/過濾機制，將篩選後的課程顯示在選課網頁上。