//爬蟲測試按鈕(預計上線前刪除):畫面右下新增"爬蟲測試"面版,有一個按鈕, 點擊後會呼叫爬蟲工具, 並將進行程度顯示在按鈕面板上


//引入爬蟲工具
import { useCourseCrawler } from "../modules/hooks/useCourseCrawler";

export function TestButton() {
  const { runCrawler, isLoading, progress, allData } = useCourseCrawler();

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
