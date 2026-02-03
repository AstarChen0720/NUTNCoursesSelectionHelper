import { createRoot } from "react-dom/client";
import { fetchCourse } from "./components/fetchCourse";
import { useState } from "react";

declare global {
  interface Window {
    Choice: any;
    getTea: any;
    WeekSection: any;
    Room: any;
    Badges: any;
    Remark: any;
    getSyllabusUrl: any;
    initCardCollapse: any;
  }
}

// 這是我們用來渲染資料到學校原本介面的函式
function renderCoursesToSchoolPage(courses: any[]) {
  const cardContainer = document.getElementById("cardContainer");
  if (!cardContainer) {
    console.error("❌ 找不到 #cardContainer，無法渲染");
    alert("程式發生錯誤：找不到網頁上的課程列表容器 (#cardContainer)");
    return;
  }

  // 1. 強制顯示容器 (防止被 hidden 屬性隱藏)
  cardContainer.style.display = "block";
  cardContainer.style.opacity = "1";

  // 2. 清空容器
  cardContainer.innerHTML = "";

  if (courses.length === 0) {
    cardContainer.innerHTML = `<div class="alert alert-warning text-center">沒有符合篩選條件的課程</div>`;
    return;
  }

  // --- 定義本地版 Helper (完全手寫邏輯，不調用 window) ---

  // 處理必修/選修標籤
  const localChoice = (val: string) => {
    let colorClass = "bg-secondary";
    if (val && val.includes("必")) colorClass = "bg-primary";
    else if (val && val.includes("選")) colorClass = "bg-success";
    return `<span class="badge ${colorClass} me-1">${val || ""}</span>`;
  };

  // 處理老師姓名 (如果有多個欄位，這裡簡單組合)
  const localGetTea = (
    email: string,
    no: string,
    alpt: string,
    name: string,
  ) => {
    return name || "";
  };

  // 處理時間 (數字轉中文)
  const localWeekSection = (week: string, section: string) => {
    const wMap: { [key: string]: string } = {
      "1": "一",
      "2": "二",
      "3": "三",
      "4": "四",
      "5": "五",
      "6": "六",
      "7": "日",
    };
    const wStr = wMap[week] || week || "";
    // 如果 section 太長，可以考慮加個空格或斷行，這裡直接顯示
    return `[${wStr}] ${section || ""}`;
  };

  // 處理教室 (合併 Room 和 ComptRoom)
  const localRoom = (room: string, comptRoom: string) => {
    if (room && comptRoom) return `${room} / ${comptRoom}`;
    return room || comptRoom || "";
  };

  // 3. 遍歷資料並產生 HTML (HTML 結構模仿學校最乾淨的版本)
  courses.forEach((item, index) => {
    const cardId = `card_${index + 1}`;
    const collapseId = `collapseDetails_${index + 1}`; // 內容區塊 ID

    // HTML 結構
    const str = `
        <div class="col-12 col-md-6 mb-3">
            <div class="card h-100 rounded-0 shadow-sm border-0" style="border-left: 5px solid #ffc107 !important;" id="${cardId}">
                <div class="card-body d-flex flex-column pt-3 pb-3">
                    <!-- 標題區：必選修 + 課名 -->
                    <h5 class="card-title mb-2" style="font-size: 1.1rem; font-weight: bold;">
                        ${localChoice(item.Choice)} 
                        <span>${item.CourName}</span>
                    </h5>
                    <!-- 英文課名 -->
                    <div class="text-muted mb-2" style="font-size: 0.85rem;">${item.CourEngName || ""}</div>
                    
                    <!-- 核心資訊區 -->
                    <p class="card-text mb-2 text-dark" style="font-size: 0.95rem; line-height: 1.6;">
                        <!-- 班級 -->
                        <i class="bi bi-people-fill text-secondary me-1"></i> <span class="fw-bold">${item.ClassName1 || "無班級"}</span>
                        <span class="mx-2 text-muted">|</span>
                        
                        <!-- 老師 -->
                        <i class="bi bi-person-badge text-secondary me-1"></i> ${localGetTea(item.TeaEmail, item.TeaNo1, item.AlPt, item.TeaName1)}
                        <span class="mx-2 text-muted">|</span>
                        
                        <!-- 學分 -->
                        <span class="fw-bold">${item.Credit}</span> 學分
                        <br />
                        
                        <!-- 時間 -->
                        <i class="bi bi-clock text-secondary me-1"></i> <span class="text-danger fw-bold">${localWeekSection(item.Week, item.Section)}</span>
                        <span class="mx-2 text-muted">|</span>
                        
                        <!-- 教室 -->
                        <i class="bi bi-geo-alt text-secondary me-1"></i> ${localRoom(item.Room, item.ComptRoom)}
                    </p>

                    <!-- 防止版面跑掉的佔位符與底部按鈕 -->
                    <div class="row justify-content-between align-items-center mt-auto">
                         <div class="col-auto">
                             <small class="text-muted">選課號: ${item.SelCourNo}</small>
                         </div>
                         <div class="col-auto">
                            <!-- 手動實作展開按鈕 -->
                            <span class="text-primary my-collapse-btn" 
                                  data-target="${collapseId}" 
                                  style="cursor: pointer; font-size: 0.9rem;">
                                <i class="bi bi-caret-down-fill"></i> 詳細資訊
                            </span>
                        </div>
                    </div>
                </div>

                <!-- 詳細資訊區塊 (預設隱藏: display: none) -->
                <div id="${collapseId}" style="display: none; background-color: #f8f9fa;">
                     <div class="p-3 border-top">
                         <div class="row" style="font-size: 0.9em;">
                             <div class="col-6">
                                 <ul class="list-unstyled mb-0">
                                     <li><strong>課程代碼：</strong> ${item.CourNo}</li>
                                     <li><strong>人數上限：</strong> ${item.MaxSel}</li>
                                     <li><strong>已選人數：</strong> ${item.NowSel}</li>
                                 </ul>
                             </div>
                             <div class="col-6">
                                  <ul class="list-unstyled mb-0">
                                      <li><strong>總時數：</strong> ${item.TotHour}</li>
                                      <li><strong>開課單位：</strong> ${item.UnitName || ""}</li>
                                      <li><strong>備註：</strong> <span class="text-danger">${item.Remark || "無"}</span></li>
                                  </ul>
                             </div>
                         </div>
                     </div>
                </div>
            </div>
        </div>
    `;
    cardContainer.insertAdjacentHTML("beforeend", str);
  });

  // 4. 手動綁定摺疊按鈕事件 (完全不用 bootstrap 的 JS)
  // 找出我們剛剛生成的按鈕
  const btns = cardContainer.querySelectorAll(".my-collapse-btn");
  btns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      // 抓取按鈕上標記的目標 ID
      const targetId = (e.currentTarget as HTMLElement).getAttribute(
        "data-target",
      );
      if (targetId) {
        const content = document.getElementById(targetId);
        if (content) {
          // 切換顯示狀態
          const isHidden = content.style.display === "none";
          content.style.display = isHidden ? "block" : "none";

          // 切換 icon 方向 (視覺優化)
          const icon = (e.currentTarget as HTMLElement).querySelector("i");
          if (icon) {
            icon.className = isHidden
              ? "bi bi-caret-up-fill"
              : "bi bi-caret-down-fill";
          }
        }
      }
    });
  });

  console.log(`✅ 成功渲染 ${courses.length} 筆課程到頁面`);
}
















// 1. TestButton (維持不變)
function TestButton() {
  //從fetchCourse取得函式和變數
  const { runCrawler, isLoading, progress, allData } = fetchCourse();

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        backgroundColor: "white",
        border: "2px solid #007bff",
        borderRadius: "10px",
        padding: "15px",
        zIndex: 99999,
        boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
        maxWidth: "300px",
      }}
    >
      <h3
        style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "bold" }}
      >
        選課助手測試面板
      </h3>
      <button
        onClick={runCrawler}
        disabled={isLoading}
        style={{
          backgroundColor: isLoading ? "#6c757d" : "#007bff",
          color: "white",
          border: "none",
          padding: "8px 16px",
          borderRadius: "5px",
          cursor: isLoading ? "not-allowed" : "pointer",
          width: "100%",
          marginBottom: "10px",
        }}
      >
        {isLoading ? "抓取中..." : "開始抓取所有課程"}
      </button>
      <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
        {progress || "等待操作..."}
      </div>
      {allData.length > 0 && (
        <div
          style={{
            marginTop: "10px",
            padding: "5px",
            backgroundColor: "#e9ecef",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          ✅ 成功抓取 {allData.length} 筆課程
        </div>
      )}
    </div>
  );
}

// --- 組件 B: 嵌入式節數查詢按鈕 (新功能) ---
function PeriodQueryPanel() {
  //從fetchCourse取得函式和變數
  const { runCrawler, isLoading, progress, allData } = fetchCourse();
  //拿一個盒子來控制選單開關
  const [isOpen, setIsOpen] = useState(false);
  //拿一個盒子放被選中的項目
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);

  //選單項目
  const periods = [
    { val: "1", text: "1(7:00~7:50)" },
    { val: "2", text: "2(8:00~8:50)" },
    { val: "3", text: "3(9:00~9:50)" },
    { val: "4", text: "4(10:00~10:50)" },
    { val: "5", text: "5(11:00~11:50)" },
    { val: "6", text: "6(12:00~12:50)" },
    { val: "7", text: "7(13:00~13:50)" },
    { val: "8", text: "8(14:00~14:50)" },
    { val: "9", text: "9(15:00~15:50)" },
    { val: "A", text: "A(16:00~16:50)" },
    { val: "B", text: "B(17:00~17:50)" },
    { val: "C", text: "C(18:00~18:50)" },
    { val: "D", text: "D(19:00~19:50)" },
    { val: "E", text: "E(20:00~20:50)" },
    { val: "F", text: "F(21:00~21:50)" },
  ];

  //處理選取邏輯的函式
  const togglePeriod = (val: string) => {
    //如果已應有被選取就移除陣列,filter((每一項)=>{條件}),他回傳符合條件的項目組成的新陣列
    if (selectedPeriods.includes(val)) {
      setSelectedPeriods(selectedPeriods.filter((p) => p !== val));
    } else {
      //沒被選取就加入陣列
      setSelectedPeriods([...selectedPeriods, val]);
    }
  };

  //處理點選搜尋按鈕後的邏輯函式:查所有課程,然後回傳有符合節數的課程
  const handleSearch = async () => {
    // 1. 基本防呆：沒選節數不動作
    if (selectedPeriods.length === 0) {
      alert("請至少選擇一個節數！\n例如：想找空堂在第6、7節的課");
      return;
    }

    // 2. 檢查是否有資料，如果沒有資料(長度為0)，提示使用者並嘗試抓取
    let sourceData = allData;
    if (sourceData.length === 0) {

      sourceData = await runCrawler();
      // ★★★ 如果回傳回來還是空的(可能出錯或沒抓到)，就中止
      if (!sourceData || sourceData.length === 0) {
        console.log("抓取後無資料，停止篩選");
        return;
      }
      // ★★★ 重點：這裡【不要】寫 return，讓程式繼續往下跑去篩選
    }

    // 3. 核心過濾邏輯
    const results = sourceData.filter((course) => {
      // 確保 Section 是字串 (雖然 JSON 通常是 String，但防呆轉型一下)
      const courseSection = course.Section;

      if (!courseSection) return false;
      // 邏輯翻譯：
      // 對於我們選中的每一個節數(p)，檢查這堂課的節次字串(courseSection)有沒有包含它。
      // 使用 .some()，只要有「任何一個」符合就回傳 true。
      // 例如：
      // 選中 ["1", "5"]
      // 課程A Section="12" -> 包含 "1" -> 符合
      // 課程B Section="34" -> 不包含 1 或 5 -> 不符合
      // 課程C Section="45" -> 包含 "5" -> 符合
      return selectedPeriods.some((p) => courseSection.includes(p));
    });

    // 4. 輸出結果 (目前先用 Console 和 Alert 呈現，下一步再做 UI 顯示)
    console.clear();
    console.log(
      `========== 篩選條件: [${selectedPeriods.join(", ")}] ==========`,
    );
    console.log(`總資料筆數: ${sourceData.length}`);
    console.log(`符合筆數: ${results.length}`);
    console.log("篩選結果列表:", results);

    try {
      renderCoursesToSchoolPage(results);

      document
        .getElementById("cardContainer")
        ?.scrollIntoView({ behavior: "smooth" });
        console.log("已將篩選結果渲染到頁面上");
    } catch (e) {
      console.error("渲染失敗:", e);
    }
  };

  return (
    <div className="col-12 col-md-8 d-flex justify-content-center flex-column align-items-center">
      {/* 1. 觸發按鈕 */}
      <button
        type="button"
        className="btn btn-sm btn-warning w-100 mt-2 text-dark fw-bold"
        onClick={() => setIsOpen(!isOpen)}
        title="點擊開啟節數篩選"
      >
        <i className="bi bi-clock-history me-1"></i>
        {isOpen ? "關閉節數篩選" : "用上課節數(時間)查詢"}
      </button>

      {/* 2. 跳出的選單 (Modal Card) */}
      {isOpen && (
        <div className="card w-100 mt-2 shadow-sm border-warning">
          <div className="card-header bg-warning bg-opacity-10 fw-bold text-dark">
            選擇空堂節數 (複選)
          </div>
          <div className="card-body p-2">
            <div className="d-flex flex-wrap gap-2 justify-content-center">
              {periods.map((p) => (
                <label
                  key={p.val}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #ced4da",
                    padding: "5px 10px",
                    borderRadius: "5px",
                    backgroundColor: selectedPeriods.includes(p.val)
                      ? "#ffc107"
                      : "white",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="checkbox"
                    value={p.val}
                    checked={selectedPeriods.includes(p.val)}
                    onChange={() => togglePeriod(p.val)}
                    style={{ display: "none" }}
                  />
                  <span
                    style={{
                      fontWeight: selectedPeriods.includes(p.val)
                        ? "bold"
                        : "normal",
                    }}
                  >
                    {p.text}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Card Footer: 包含進度條與操作按鈕 */}
          <div className="card-footer p-2 bg-light">
            {/* 這裡確保只有一層 footer，進度條放在按鈕上方 */}
            {isLoading && (
              <div
                className="mb-2 p-1 text-center text-primary"
                style={{
                  fontSize: "0.9em",
                  backgroundColor: "#e7f1ff",
                  borderRadius: "4px",
                }}
              >
                <span
                  className="spinner-border spinner-border-sm me-2"
                  aria-hidden="true"
                ></span>
                {progress || "正在處理..."}
              </div>
            )}

            <div className="d-flex justify-content-between">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setSelectedPeriods([])}
              >
                清空
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleSearch}
                disabled={isLoading}
              >
                {isLoading
                  ? "資料載入中..."
                  : `開始篩選 (目前已載入 ${allData.length} 筆)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

  // 5. 渲染 React 組件
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

