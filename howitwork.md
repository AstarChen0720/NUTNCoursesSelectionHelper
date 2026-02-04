### 1.2 詳細執行步驟與資料流
1. 初始化 (Initialization)
   
   - 觸發點 ：使用者進入 https://academics.nutn.edu.tw/Course/Qry/cos 。
   - 執行 ： content.tsx 的 main() 函式啟動。
   - 注入 ：
     - 建立 React Root，將 <TestButton /> 注入到 body 。
     - 輪詢偵測 #btnQuery 按鈕，將 <PeriodQueryPanel /> 注入到查詢區塊下方。
2. 資料抓取流程 (Data Fetching)
   
   - 觸發 ：使用者點擊「開始抓取」或「開始篩選」。
   - 控制 ：UI 元件呼叫 useCourseCrawler hook。
   - 服務調用 ：Hook 呼叫 CourseService.runCrawler() 。
   - 驗證 ： CourseService 向 Background Script 請求 CSRF Token。
   - API 請求 ： CourseService 依序並發送請求（科系 -> 主課程(分批) -> 通識/師培/其他）。
   - 狀態更新 ：Hook 將 progress (進度文字) 與 allData (課程資料) 更新回傳給 UI 顯示。
3. 篩選與渲染 (Filtering & Rendering)
   
   - 篩選 ： PeriodQueryPanel 根據使用者勾選的節數，對 allData 進行 filter。
   - DOM 操作 ：篩選後的陣列傳入 domRenderer.ts 。該模組會清空學校原本的 #cardContainer ，並生成符合學校原始樣式的 HTML Card 插入頁面。