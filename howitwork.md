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


1. 功能運作流程 (側邊欄為例)
當使用者點擊課程時，整個資料流是這樣跑的：

監聽 (Observe)：
initNativeCardObserver 函式會盯著學校的課程列表。一旦發現有新的課程卡片出現，它就會偷偷在上面裝一個「監聽器」。

觸發 (Trigger)：
當使用者點擊某張課程卡片時，我們的監聽器被觸發。它會分析那張卡片上的 HTML，抓出「選課代號」、「學年度」等資料。

廣播 (Dispatch)：
程式接著會發射一個自定義的訊號彈（Event）：NUTN_COURSE_CLICK，並把剛剛抓到的資料夾在訊號裡。

接收與渲染 (React Render)：
CourseDetailPanel.tsx 裡面有一個 useEffect 一直在聽這個訊號。

收到訊號：React 拿到資料，執行 setIsVisible(true)。
畫面更新：因為狀態變了 (isVisible 變成 true)，React 根據新的狀態重新繪製畫面，這時候那個含有 iframe 的側邊欄就會瞬間被計算出來並顯示在網頁右側。