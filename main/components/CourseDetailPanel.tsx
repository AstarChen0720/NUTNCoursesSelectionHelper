import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// 定義課程詳細資訊的介面
interface CourseDetail {
  year: string; // 學年度
  term: string; // 學期
  cour_no: string; // 選課號
  teacher: string; // 老師姓名
}

export const CourseDetailPanel = () => {
  // 控制側邊欄視窗是否顯示 (不儲存此狀態，每次重新整理都會關閉)
  const [isVisible, setIsVisible] = useState(false);
  // 控制「自動開啟」開關的狀態 (儲存使用者的偏好設定)
  const [isAutoOpen, setIsAutoOpen] = useState(false);
  // 儲存目前被點擊的課程資料
  const [courseData, setCourseData] = useState<CourseDetail | null>(null);
  // 控制 Iframe 的縮放比例 (預設 1.0)
  // 透過縮放讓使用者可以調整內容大小以符合視窗 (去除白邊或適應寬度)
  const [zoomLevel, setZoomLevel] = useState(1.5); // 預設 1.5 (150%) 以符合使用者需求，剛好適應內容

  // 初始化：載入使用者的設定
  useEffect(() => {
    // 從瀏覽器儲存中讀取「自動開啟」的開關狀態
    const savedAutoOpen = localStorage.getItem("NUTN_HELPER_AUTO_OPEN_SETTING");
    if (savedAutoOpen === "true") {
      setIsAutoOpen(true);
    }

    // 監聽來自 domRenderer 的點擊事件
    const handleCourseClick = (e: any) => {
      console.log("收到課程點擊事件:", e.detail);
      // 每次觸發時重新檢查最新的開關設定
      const currentSetting =
        localStorage.getItem("NUTN_HELPER_AUTO_OPEN_SETTING") === "true";

      if (currentSetting && e.detail) {
        setCourseData(e.detail);
        setIsVisible(true);
        // 當數據更新時，自動確保 UI 處於正確狀態
        setTimeout(() => applySplitLayout(true), 0);
      } else {
        console.log("未開啟自動功能或無資料");
      }
    };

    window.addEventListener("NUTN_COURSE_CLICK", handleCourseClick);

    // 清除監聽器
    return () => {
      window.removeEventListener("NUTN_COURSE_CLICK", handleCourseClick);
      applySplitLayout(false); // 確保卸載時還原佈局
    };
  }, []);

  // 當 visibility 改變時，也要觸發 layout 調整 (例如手動關閉)
  useEffect(() => {
    if (!isVisible) {
      applySplitLayout(false);
    }
  }, [isVisible]);

  // 切換「自動開啟」開關
  const toggleAutoOpen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsAutoOpen(checked);
    // 儲存偏好到 localStorage
    localStorage.setItem("NUTN_HELPER_AUTO_OPEN_SETTING", String(checked));
  };

  // 關閉側邊欄
  const closePanel = () => {
    setIsVisible(false);
  };

  // 開啟 Dcard 搜尋 (直接跳轉)
  const openDcard = () => {
    if (!courseData) return;
    window.open(
      `https://www.dcard.tw/search?tab=latest&query=${encodeURIComponent(courseData.teacher)}&forum=nutn`,
      "_blank",
    );
  };

  // 調整網頁佈局：將課程列表擠向左邊，並將側邊欄插入到 Bootstrap Grid 中
  const applySplitLayout = (active: boolean) => {
    // ... (保持原有的 Layout 邏輯，如果需要可簡化，但這裡沿用之前的邏輯)
    console.log("正在套用佈局切換:", active);
    const cardContainerParent = document.getElementById("accordionGroup"); // 左側列表
    const sidePanelRoot = document.getElementById("nutn-side-panel-root"); // 我們的 React Root

    if (!cardContainerParent || !sidePanelRoot) {
      console.error("找不到關鍵 DOM 元素");
      return;
    }

    const rowContainer = cardContainerParent.parentElement;
    if (!rowContainer || !rowContainer.classList.contains("row")) {
      console.error("找不到預期的 Bootstrap row 父層");
      return;
    }

    if (active) {
      if (sidePanelRoot.parentElement !== rowContainer) {
        rowContainer.appendChild(sidePanelRoot);
      }
      cardContainerParent.className = "col-12 col-md-4";
      sidePanelRoot.className = "col-12 col-md-8";
      sidePanelRoot.style.display = "block";
      rowContainer.classList.remove("justify-content-center");
    } else {
      cardContainerParent.className = "col-12 col-md-8";
      sidePanelRoot.style.display = "none";
      if (sidePanelRoot.parentElement === rowContainer) {
        document.body.appendChild(sidePanelRoot);
      }
      rowContainer.classList.add("justify-content-center");
    }
  };

  return (
    <>
      {/* 左下角的懸浮開關視窗 - 使用 Portal 確保不受父層 display:none 影響 */}
      {createPortal(
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "20px",
            zIndex: 9999,
          }}
          className="bg-white p-2 rounded shadow border"
        >
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="autoOpenSyllabusSwitch"
              checked={isAutoOpen}
              onChange={toggleAutoOpen}
            />
            <label
              className="form-check-label fw-bold"
              htmlFor="autoOpenSyllabusSwitch"
            >
              自動開啟課程大綱
            </label>
          </div>
        </div>,
        document.body,
      )}

      {/* 側邊視窗主體 */}
      {isVisible && courseData && (
        <div
          className="bg-white border shadow-sm rounded"
          style={{
            position: "sticky",
            top: "60px", // 恢復為 60px
            paddingTop: "70px", // 依這您的指示：幫所有內容加上上邊距 60px
            height: "calc(100vh - 80px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden", 
            zIndex: 1000,
          }}
        >
          {/* 懸浮控制區 (Zoom, Dcard, Close) */}
          <div
            style={{
              position: "absolute",
              top: "70px", // 配合 padding 調整位置
              right: "20px",
              zIndex: 10,
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
          >
            {/* 縮放控制 */}
            <div className="btn-group btn-group-sm bg-white shadow-sm rounded">
              <button
                type="button"
                className="btn btn-outline-secondary border-0"
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.05))}
              >
                <i className="bi bi-dash"></i>
              </button>
              <div className="d-flex align-items-center px-2 text-secondary small border-start border-end">
                {Math.round(zoomLevel * 100)}%
              </div>
              <button
                type="button"
                className="btn btn-outline-secondary border-0"
                onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.05))}
              >
                <i className="bi bi-plus"></i>
              </button>
            </div>

            {/* Dcard 懸浮按鈕 */}
            <button
              type="button"
              className="btn btn-primary btn-sm shadow-sm d-flex align-items-center rounded-pill px-3"
              onClick={openDcard}
            >
              <i className="bi bi-search me-1"></i> Dcard教授名稱
            </button>

            {/* 關閉按鈕 */}
            <button
              type="button"
              className="btn btn-light btn-sm shadow-sm rounded-circle"
              style={{ width: "50px", height: "50px", fontSize: "1.5rem",padding: "0.25rem",border: "1px solid #a8acb0" }}
              onClick={closePanel}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* 內容區域：Iframe */}
          <div className="flex-grow-1 w-100 bg-white p-0 position-relative" style={{ overflow: 'hidden' }}>
              <div style={{ 
                width: "100%", 
                height: "100%", 
                overflow: "hidden", 
                position: "relative" 
              }}>
                <iframe
                  src={`https://academics.nutn.edu.tw/Course/preview_detail.aspx?syear=${courseData.year}&term=${courseData.term}&cour_no=${courseData.cour_no}`}
                  style={{ 
                    width: `${100 / zoomLevel}%`, 
                    // 這裡不再需要高度補償，因為我們沒有使用負 margin 上移內容
                    // 高度只要維持 100% 除以縮放比例即可
                    height: `${100 / zoomLevel}%`,
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: "top left",
                    border: "none", 
                    display: "block",
                  }}
                  title="Syllabus"
                />
              </div>
          </div>
        </div>
      )}
    </>
  );
};
