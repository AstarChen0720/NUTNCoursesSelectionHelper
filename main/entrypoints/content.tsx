//將按鈕注入到查詢按鈕的下面
//這個函式用來注入按鈕到查詢按鈕的下面
//注入的按鈕是用來觸發抓取課程的函式

import { createRoot } from "react-dom/client";
import { PeriodQueryPanel } from "../components/PeriodQueryPanel";
import { TestButton } from "../components/TestButton";
import { CourseDetailPanel } from "../components/CourseDetailPanel";

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

// 注入右側課程詳情面板
function injectSidePanel() {
  console.log("嘗試注入側邊面板...");
  const accordionGroup = document.getElementById("accordionGroup");
  if (!accordionGroup) {
    console.warn("找不到 #accordionGroup，取消注入側邊欄");
    return;
  }

  // 如果已經注入過了就跳過
  if (document.getElementById("nutn-side-panel-root")) return;

  // 建立面板容器
  const sidePanelRoot = document.createElement("div");
  sidePanelRoot.id = "nutn-side-panel-root";
  sidePanelRoot.className = "col-12 col-md-8"; // 改成 col-md-8 讓它更寬 (搭配左邊縮成 col-md-4)

  // 插入到列表容器的後面
  accordionGroup.insertAdjacentElement("afterend", sidePanelRoot);
  console.log("側邊面板容器已插入");

  const root = createRoot(sidePanelRoot);
  root.render(<CourseDetailPanel />);
}

// 解析既有 DOM 卡片資料的輔助函式
function extractCardData(card: HTMLElement) {
  // 1. 抓選課號
  // 結構是 <a href="../preview_detail.aspx?syear=114&term=2&cour_no=112037" ...>課程大綱</a>
  // 從連結中提取 cour_no
  let cour_no = "";
  const syllabusLink = card.querySelector("a[href*='preview_detail.aspx']");
  if (syllabusLink) {
    const href = syllabusLink.getAttribute("href");
    if (href) {
      // match cour_no=xxxxxx
      const match = href.match(/cour_no=([^&]+)/);
      if (match && match[1]) {
        cour_no = match[1];
      }
    }
  }

  // 2. 抓老師名字
  // 結構是 <span ... data-bs-original-title="授課教師"><a ...>李郁緻</a></span>
  // 或是直接文字，我們找 data-bs-original-title="授課教師" 的 span
  let teacher = "Unknown";
  // 嘗試找有 "授課教師" title 的 span
  const teacherSpan = card.querySelector(
    'span[data-bs-original-title="授課教師"]',
  );
  if (teacherSpan) {
    teacher = teacherSpan.textContent?.trim() || "Unknown";
  } else {
    // Fallback: 嘗試舊方法或根據結構找
    // 你提供的 HTML 中老師名字是在一個 span 裡面，可能包著 a tag
    // <span class="fw-bold " ... data-bs-original-title="授課教師"><a ...>李郁緻</a></span>
    // 上面的 selector 應該抓得到
  }

  return { cour_no, teacher };
}

// 監聽原生網站的卡片渲染
function initNativeCardObserver() {
  const cardContainer = document.getElementById("cardContainer");
  if (!cardContainer) {
    return;
  }

  console.log("👀 開始監聽原生卡片變化...");

  // 定義處理函式
  const handleNewCards = () => {
    // 找出所有還沒被綁定的卡片
    // :not(.js-nutn-helper-bound) 排除掉我們自己渲染器產生的卡片
    const newCards = cardContainer.querySelectorAll(
      ".card:not(.js-nutn-helper-bound)",
    );

    if (newCards.length > 0) {
      console.log(` 偵測到 ${newCards.length} 張原生卡片，正在綁定事件...`);

      newCards.forEach((card) => {
        // 標記為已綁定
        card.classList.add("js-nutn-helper-bound");

        // 綁定點擊事件
        card.addEventListener("click", (e) => {
          // 阻止點擊到裡面的詳細資訊按鈕時觸發
          const target = e.target as HTMLElement;
          // 修改: 原本的 collapse 按鈕可能有不同的 class 或結構，這裡加寬鬆一點
          // 排除連結(a tag)、按鈕(button)、摺疊圖示(i tag, toggle-text)
          if (
            target.closest("a") ||
            target.closest("button") ||
            target.closest(".toggle-text") ||
            target.closest(".bi-caret-down-fill")
          ) {
            return;
          }

          console.log("原生卡片被點擊！");

          // 解析資料
          const { cour_no, teacher } = extractCardData(card as HTMLElement);

          // 抓取學年期
          const sessionSelect = document.getElementById(
            "lstAcadeSession",
          ) as HTMLSelectElement;
          let syear = "113";
          let term = "2";
          if (sessionSelect && sessionSelect.value) {
            const val = sessionSelect.value;
            if (val.length >= 2) {
              term = val.slice(-1);
              syear = val.slice(0, val.length - 1);
            }
          }

          // 發送事件
          const event = new CustomEvent("NUTN_COURSE_CLICK", {
            detail: {
              year: syear,
              term: term,
              cour_no: cour_no,
              teacher: teacher,
            },
          });
          window.dispatchEvent(event);
        });
      });
    }
  };

  // 建立 Observer
  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    mutations.forEach((m) => {
      if (m.type === "childList") shouldCheck = true;
    });
    if (shouldCheck) handleNewCards();
  });

  // 開始監聽，並先執行一次以防已有卡片
  observer.observe(cardContainer, { childList: true, subtree: true });
  handleNewCards();
}

export default defineContentScript({
  // [重要] 加上 * 以確保即使網址後面有參數也能運作
  matches: ["https://academics.nutn.edu.tw/Course/Qry/cos*"],
  main(ctx) {
    console.log("🚀 選課助手 Content Script 已啟動");

    // // 1. 建立並注入測試按鈕 UI
    // //document是網頁的總管,所有跟網頁有關的東西都從這裡下手
    // //建立一個div
    // const uiContainer = document.createElement("div");
    // //把這div的id設成nutn-helper-root
    // uiContainer.id = "nutn-helper-root";
    // //把這個div掛載到網頁的body下面
    // document.body.appendChild(uiContainer);
    // //createRoot是react的功能,可以讓這個元件變成智慧渲染顯示
    // const root = createRoot(uiContainer);
    // //把restbottom選染到這個智慧div裡面
    // root.render(<TestButton />);

    // 2. 輪詢並注入「節數查詢」按鈕到網頁特定位置
    //setInterval是每隔一段時間就執行一次,這裡是每500毫秒執行一次,需要用clearInterval來停止
    //如果20次內成功注入就停止,超過20次就放棄
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const result = injectApp();
      injectSidePanel();

      // 嘗試啟動原生監聽器 (只要找到 container 就算成功)
      if (document.getElementById("cardContainer")) {
        // 為了避免重複啟動，可以用一個全域變數或屬性檢查
        if (!document.body.dataset.nutnObserverStarted) {
          initNativeCardObserver();
          document.body.dataset.nutnObserverStarted = "true";
        }
      }

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
