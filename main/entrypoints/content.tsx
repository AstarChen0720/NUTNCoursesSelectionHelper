//將按鈕注入到查詢按鈕的下面
//這個函式用來注入按鈕到查詢按鈕的下面
//注入的按鈕是用來觸發抓取課程的函式



import { createRoot } from "react-dom/client";
import { PeriodQueryPanel } from "../components/PeriodQueryPanel";
import { TestButton } from "../components/TestButton";

// --- 主要注入邏輯 ---
function injectApp() {
  console.log("正在尋找注入點...");

  // 1. 尋找原網站的「查詢」按鈕 (#btnQuery)
  const btnQuery = document.querySelector("#btnQuery");
  if (!btnQuery) {
    return "找不到 #btnQuery，網頁可能尚未載入完成";
  }

  // 2. 找到它外層叫"row"的class (確保我們是插在那個 row 的下面，而不是擠在裡面)
  //cloest是往上找符合條件的父元素,這裡是row分類
  const queryRow = btnQuery.closest(".row"); // 這是你提供的 HTML 中的 <div class="row justify-content-center mt-2">
  if (!queryRow) return "找不到 btnQuery 外層的 row";

  // 3. 檢查是否已經注入過
  if (document.getElementById("nutn-period-query-root")) return true;

  // 4. 建立容器並加上id 和className
  const appContainer = document.createElement("div");
  appContainer.id = "nutn-period-query-root";
  appContainer.className = "row justify-content-center"; // 保持版型一致

  // 插入到查詢按鈕 row 的後面
  //insertAdjacentElement是在特定位置插入元素,afterend是插在元素後面
  queryRow.insertAdjacentElement("afterend", appContainer);

  // 5. 把"用節數選課按鈕"渲染到 React 組件上
  const root = createRoot(appContainer);
  root.render(<PeriodQueryPanel />);

  return true;
}

export default defineContentScript({
  // [重要] 加上 * 以確保即使網址後面有參數也能運作
  matches: ["https://academics.nutn.edu.tw/Course/Qry/cos*"],
  main(ctx) {
    console.log("🚀 選課助手 Content Script 已啟動");

    // 1. 建立並注入測試按鈕 UI
    //document是網頁的總管,所有跟網頁有關的東西都從這裡下手
    //建立一個div
    const uiContainer = document.createElement("div");
    //把這div的id設成nutn-helper-root
    uiContainer.id = "nutn-helper-root";
    //把這個div掛載到網頁的body下面
    document.body.appendChild(uiContainer);
    //createRoot是react的功能,可以讓這個元件變成智慧渲染顯示
    const root = createRoot(uiContainer);
    //把restbottom選染到這個智慧div裡面
    root.render(<TestButton />);

    // 2. 輪詢並注入「節數查詢」按鈕到網頁特定位置
    //setInterval是每隔一段時間就執行一次,這裡是每500毫秒執行一次,需要用clearInterval來停止
    //如果20次內成功注入就停止,超過20次就放棄
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const result = injectApp();
      if (result === true) {
        console.log("✅ 成功插入節數查詢按鈕！");
        clearInterval(interval);
      } else if (attempts > 20) {
        console.warn("⚠️ 放棄注入：", result);
        clearInterval(interval);
      }
    }, 500);
  },
});
