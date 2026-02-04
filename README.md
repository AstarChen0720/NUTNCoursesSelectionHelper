# 🎓 NUTN 選課小幫手 (NUTN Courses Selection Helper)

[chrome extension頁面](等他過這裡要放chrome extension的連結)

嘿大家！歡迎來到我的**網頁程式寒假練習專案**
每次選課差剛好有某些節數要補但他不能查詢節數要一頁一頁點開來看實在太麻煩了，所以寫一個小幫手幫我篩出那些有空的課程!並且決定做成一個瀏覽器擴充功能讓大家也可以方便地使用。

### 如果你覺得有什麼功能可以加進去或者有什麼問題還請各位隨時告訴我!

這是一個基於 **React** + **TypeScript** 開發的瀏覽器擴充功能 (Chrome Extension)，希望能幫南大的各位更快速地找到自己想要的課！

## ✨ 核心功能 (Features)

目前主要有這幾個功能：
1. 依照上課時間查詢課程


## 📸 預期成果

當你成功啟動後，進入學校選課系統的查詢頁面，應該會看到：
2. 查詢按鈕下方會多出一個黃色的 **「用上課節數(時間)查詢」** 按鈕。
1. 右下角出現一個 **「選課助手測試面板」**(以後會刪掉)
2. 點擊後會跳出節數選單,選完後按查詢,等待結果出來
3. 下面就會跳出符合條件的課程卡片(目前是插入自己的html所以會跟學校原本的樣式有點不同)


## 🛠️ 技術堆疊 (Tech Stack)


- **框架**：[React 19](https://react.dev/)
- **開發語言**：[TypeScript](https://www.typescriptlang.org/) 
- **擴充功能打包工具**：[WXT](https://wxt.dev/) (他算是加了很多功能的vite)
---


## 📂 檔案結構 (File Structure)

我有叫ai把它整理好：

```
main/
├── 📁 entrypoints/        # 程式入口點
│   └── content.tsx       # 負責把 React 注入到學校網頁
├── 📁 components/         # React UI 元件
│   ├── PeriodQueryPanel  # 節數篩選面板 (主功能)
│   └── TestButton        # 測試控制按鈕
├── 📁 modules/            # 核心邏輯區 (這裡是精華!)
│   ├── 📁 services/       # 負責跟學校 API 溝通 (CourseService)
│   ├── 📁 hooks/          # React 狀態管理 (useCourseCrawler)
│   ├── 📁 utils/          # DOM 操作工具
│   └── 📁 types/          # TypeScript 型別定義
└── 📄 package.json        # 專案設定檔
```

---





