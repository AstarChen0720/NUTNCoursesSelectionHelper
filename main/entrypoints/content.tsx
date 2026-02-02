import { createRoot } from 'react-dom/client';
import { useFetchCourses } from './components/fetchCourse';

// 定義一個簡單的測試組件
function TestButton() {
    const { runCrawler, isLoading, progress, allData } = useFetchCourses();

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: 'white',
            border: '2px solid #007bff',
            borderRadius: '10px',
            padding: '15px',
            zIndex: 9999,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            maxWidth: '300px'
        }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>
                選課助手測試面板
            </h3>
            
            <button
                onClick={runCrawler}
                disabled={isLoading}
                style={{
                    backgroundColor: isLoading ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '5px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    width: '100%',
                    marginBottom: '10px'
                }}
            >
                {isLoading ? '抓取中...' : '開始抓取所有課程'}
            </button>

            {/* 顯示進度 */}
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                {progress || '等待操作...'}
            </div>

            {/* 顯示結果統計 */}
            {allData.length > 0 && (
                <div style={{ 
                    marginTop: '10px', 
                    padding: '5px', 
                    backgroundColor: '#e9ecef', 
                    borderRadius: '4px',
                    fontSize: '12px'
                }}>
                    ✅ 成功抓取 {allData.length} 筆課程
                </div>
            )}
        </div>
    );
}

export default defineContentScript({
    matches: ['https://academics.nutn.edu.tw/Course/Qry/cos'],
    main(ctx) {
        console.log("選課助手 Content Script 已啟動");

        // 建立一個容器來掛載 React App
        // 為避免影響網站原有樣式，使用 Shadow DOM (可選，這裡先直接插入 body 方便除錯)
        const uiContainer = document.createElement('div');
        uiContainer.id = 'nutn-helper-root';
        document.body.appendChild(uiContainer);

        // 使用 React 18 的 createRoot 來渲染
        const root = createRoot(uiContainer);
        root.render(<TestButton />);
    },
});