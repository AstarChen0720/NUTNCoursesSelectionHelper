// 節數查詢按鈕面板: 用戶可以選擇自己想上的節數, 然後篩選出符合條件的課程
// 並將結果渲染到學校課程頁面

import { useState } from "react";
//課程爬蟲工具
import { useCourseCrawler } from "../modules/hooks/useCourseCrawler";
//從我的參數表中拿出每節課的常數
import { PERIODS, DAYS } from "../modules/constants";
//DOM渲染工具
import { renderCoursesToSchoolPage } from "../modules/utils/domRenderer";

export function PeriodQueryPanel() {
  //從爬蟲工具中取出函式和變數
  const { runCrawler, isLoading, progress, allData } = useCourseCrawler();
  //控制篩選面板是否開啟的狀態
  const [isOpen, setIsOpen] = useState(false);
  //儲存用戶選擇的節數
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  //儲存用戶選擇的星期
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  //處理點選選項的動作:如果已選中，則取消選擇；如果未選中，則添加選擇
  const togglePeriod = (val: string) => {
    if (selectedPeriods.includes(val)) {
      setSelectedPeriods(selectedPeriods.filter((p) => p !== val));
    } else {
      setSelectedPeriods([...selectedPeriods, val]);
    }
  };

  //處理點選星期的動作
  const toggleDay = (val: string) => {
    if (selectedDays.includes(val)) {
      setSelectedDays(selectedDays.filter((d) => d !== val));
    } else {
      setSelectedDays([...selectedDays, val]);
    }
  };

  //處理篩選按鈕的點擊事件:如果有選擇節數，則執行篩選；如果沒有選擇，則提示用戶選擇
  const handleSearch = async () => {
    if (selectedPeriods.length === 0 && selectedDays.length === 0) {
      alert("請至少選擇一個篩選條件（節數或星期）！");
      return;
    }

    //先看看有沒有已有的資料,沒有就呼叫爬蟲去抓課程資料
    let sourceData = allData;
    if (sourceData.length === 0) {
      sourceData = (await runCrawler()) || [];
      if (!sourceData || sourceData.length === 0) {
        console.log("抓取後無資料，停止篩選");
        return;
      }
    }

    //進行綜合篩選
    const results = sourceData.filter((course) => {
      // 1. 篩選節數 (如果用戶有選節數才檢查)
      let periodMatch = true;
      if (selectedPeriods.length > 0) {
        const courseSection = course.Section;
        if (!courseSection) {
          periodMatch = false;
        } else {
          periodMatch = selectedPeriods.some((p) => courseSection.includes(p));
        }
      }

      // 2. 篩選星期 (如果用戶有選星期才檢查)
      let dayMatch = true;
      if (selectedDays.length > 0) {
        const courseWeek = course.Week;
        if (!courseWeek) {
          dayMatch = false;
        } else {
          // 注意：API 返回的 Week 欄位是一串字串，如 "23" 代表星期二和星期三
          // 只要課程的星期包含使用者選的【任一】星期，就算符合
          dayMatch = selectedDays.some((d) => courseWeek.includes(d));
        }
      }

      return periodMatch && dayMatch;
    });

    //除錯用: 印出篩選結果
    console.log(
      `========== 篩選條件: 節數[${selectedPeriods.join(", ")}], 星期[${selectedDays.join(", ")}] ==========`,
    );
    console.log(`總資料筆數: ${sourceData.length}`);
    console.log(`符合筆數: ${results.length}`);
    console.log("篩選結果列表:", results);

    //渲染到學校課程頁面
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
      <button
        type="button"
        className="btn btn-sm btn-warning w-100 mt-2 text-dark fw-bold"
        onClick={() => setIsOpen(!isOpen)}
        title="點擊開啟節數篩選"
      >
        <i className="bi bi-clock-history me-1"></i>
        {isOpen ? "關閉節數篩選" : "用上課節數(時間)查詢"}
      </button>

      {isOpen && (
        <div className="card w-100 mt-2 shadow-sm border-warning">
          <div className="card-header bg-warning bg-opacity-10 fw-bold text-dark">
            篩選條件 (複選，可組合)
          </div>
          <div className="card-body p-2">
            {/* 星期選擇區 */}
            <h6 className="small text-muted fw-bold mb-1">選擇星期</h6>
            <div className="d-flex flex-wrap gap-2 justify-content-center mb-3">
              {DAYS.map((d) => (
                <label
                  key={d.val}
                  style={{
                    cursor: "pointer",
                    border: "1px solid #ced4da",
                    padding: "3px 8px", // 稍微小一點
                    borderRadius: "5px",
                    backgroundColor: selectedDays.includes(d.val)
                      ? "#198754" // 綠色
                      : "white",
                    color: selectedDays.includes(d.val) ? "white" : "black",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="checkbox"
                    value={d.val}
                    checked={selectedDays.includes(d.val)}
                    onChange={() => toggleDay(d.val)}
                    style={{ display: "none" }}
                  />
                  <span>{d.text}</span>
                </label>
              ))}
            </div>

            {/* 節數選擇區 */}
            <h6 className="small text-muted fw-bold mb-1">選擇節數</h6>
            <div className="d-flex flex-wrap gap-2 justify-content-center">
              {PERIODS.map((p) => (
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

          <div className="card-footer p-2 bg-light">
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
                onClick={() => {
                  setSelectedPeriods([]);
                  setSelectedDays([]);
                }}
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
