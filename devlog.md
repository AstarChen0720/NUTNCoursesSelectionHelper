# 開發紀錄

## 2026-02-02 爬蟲核心邏輯與 API 串接

### 1. API 逆向工程與資料來源確認

- **發現**：原本使用 `/Course/Qry/cos` (網頁查詢) 會回傳包含大量 HTML 標籤的字串，資料量大且難以解析。
- **改進**：改用 `/Course/api/Query/GetCourse` (API 查詢)，直接取得乾淨的 JSON 陣列資料。
- **參數分析**：
  - `acs`: 學期代碼 (固定 "1142")。
  - `ki`: 分類標籤 (2:大學部, 3:研究所, 4:通識, 5:師培, 6:其他)。
  - `dc`: 科系代碼 (大學/研究所需填)。
  - `ge`/`ta`/`ot`: 對應通識/師培/其他類別的細項代碼。

### 2. 安全性驗證 (CSRF Token) 處理

- **問題**：選課系統 API 需要 `x-csrf-token` 標頭驗證。
- **解決方案**：實作自動偵測函式 `getCsrfToken()`，依序從以下位置尋找 Token，確保 Content Script 能成功發送請求：
  1. `document.cookie` (若非 HttpOnly)。
  2. 頁面隱藏欄位 `<input name="__RequestVerificationToken">` (主要來源)。
  3. `<meta name="csrf-token">`。

### 3. 實作全站課程爬蟲 (Content Script)

- 在 `content.ts` 注入測試按鈕，實作五個獨立迴圈以抓取全校課程：
  1. **通識 (ki:4)**：遍歷 `geCodes` (A~AG)。
  2. **師培 (ki:5)**：遍歷 `taCodes`。
  3. **其他 (ki:6)**：遍歷 `otCodes`。
  4. **大學部 (ki:2)**：先跑迴圈 1~6 學院呼叫 `GetDept` 取得系所代碼，再遍歷系所抓課。
  5. **研究所 (ki:3)**：同上，參數 `t` 改為 3。
- **成果**：完成能夠真實發送請求、統計資料總筆數與 JSON 體積 (MB) 的測試程式。

### 下一步

- 評估資料大小，決定使用 LocalStorage 或 IndexedDB 儲存。
- 開發攔截/過濾機制，將篩選後的課程顯示在選課網頁上。

async function doPost(url, body) {
try {  
 const response = await fetch(url, {
method: "POST",
headers: {
"Content-Type": "application/json; charset=utf-8",
"X-CSRF-Token": getCookie("csrf_token")
},
body: JSON.stringify(body),
cache: "no-cache"
});

        if (!response.ok) {
            await handleResponseError(response);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Fetch Error:", error);
        showAlert("訊息視窗", "連線失敗!(03)", "error");
        return null;
    }

}

const dataArray = await doPost('/Course/api/Query/GetCourse', { acs: acs, kw: kw, dc: dept, gr: grade, ch: choice, ot: other, ge: geArea, ta: taClass, we: weekStr, ki: kind ,ll:savedLang});

try {  
 showLoading("查詢中...");  
 await new Promise(r => setTimeout(r, 0));
document.getElementById('cardContainer').innerHTML = '';
const dataArray = await doPost('/Course/api/Query/GetCourse', { acs: acs, kw: kw, dc: dept, gr: grade, ch: choice, ot: other, ge: geArea, ta: taClass, we: weekStr, ki: kind ,ll:savedLang});
if (!dataArray) return;
dataArray.forEach((item, index) => {
const cardId = `card_${index + 1}`;
const collapseId = `collapseDetails_${index + 1}`;
const toggleId = `toggleText_${index + 1}`;
const str = `

<div class="col-12 col-md-6">
<div class="card h-100 rounded-0 shadow-sm transition position-relative card-container" id="${cardId}">
<div class="card-body d-flex flex-column">
<h5 class="card-title mb-2">
${Choice(item.Choice, "ZZ")} 
                                                <span class="fw-bolder" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-html="true" title="課程名稱" data-i18n-title="ZZ15">${item.CourName}</span><br />
<small class="text-muted fs-6" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-html="true" title="課程英文名稱">${item.CourEngName}</small>
                                            </h5>
                                            <p class="card-text mb-2">
                                                <span class="fw-bold text-decoration-none" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-html="true" title="開課班級" data-i18n-title="ZZ03">${item.ClassName1}</span>
<span class="text-soft-muted">| </span>

                                                ${getTea(item.TeaEmail, item.TeaNo1, item.AlPt, item.TeaName1)}
                                                <span class="text-soft-muted">| </span>
                                                <span class="fw-bold text-decoration-none" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-html="true" title="學分數" data-i18n-title="ZZ13">${item.Credit} <span data-i18n="ZZ13">學分</span></span>
                                                <br />

                                                ${WeekSection(item.Week, item.Section, "","ZZ14")}
                                                <span class="text-soft-muted">| </span>
                                                ${Room(item.Room, item.ComptRoom)}
                                                <span class="text-soft-muted">| </span>

                                                ${Badges(item.EMI, item.Dist, item.Coord)}

                                                ${Remark(item.Remark)}
                                            </p>
                                            <div class="row justify-content-between align-items-center">
                                                <div class="col-auto">
                                                ${getSyllabusUrl(item.sYear, item.Sec, item.SelCourNo, item.TeaNo1, item.Method)}
                                                </div>
                                                <div class="col-auto">
                                                    <span class="text-muted toggle-text"
                                                        data-bs-toggle="collapse"
                                                        data-bs-target="#${collapseId}"
                                                        role="button"
                                                        aria-expanded="false"
                                                        aria-controls="${collapseId}"
                                                        id="${toggleId}"
                                                        style="cursor: pointer;" title="展開">
                                                        <i class="bi bi-caret-down-fill"></i>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="collapse" id="${collapseId}" data-bs-parent="#accordionGroup">
                                            <div class="border-top pt-2 ms-4" style="font-size: 0.9em;">
                                                <div class="row">
                                                    <div class="col-6">
                                                        <ul class="list-unstyled mb-0">
                                                            <li><strong><span data-i18n="ZZ01">選課代碼</span>：</strong><span class="text-primary">${item.SelCourNo}</span></li>
                                                            <li><strong><span data-i18n="ZZ02">課程代碼</span>：</strong><span class="text-primary">${item.CourNo}</span></li>
                                                            <li><strong><span data-i18n="ZZ03">開課班級</span>：</strong><span class="text-primary">${item.ClassName1}</span></li>
                                                            <li><strong><span data-i18n="ZZ04">人數上限</span>：</strong><span class="text-primary">${item.MaxSel}</span></li>
                                                            <li><strong><span data-i18n="ZZ10">已選人數</span>：</strong><span class="text-primary">${item.NowSel}</span></li>
                                                        </ul>
                                                    </div>
                                                    <div class="col-6">
                                                        <ul class="list-unstyled mb-0">
                                                            <li><strong><span data-i18n="ZZ06">學分/時數</span>：</strong><span class="text-primary">${item.Credit}/${item.TotHour}</span></li>
                                                            <li><strong><span data-i18n="ZZ07">上課時間</span>：</strong><span class="text-primary">${WeekSection(item.Week, item.Section)}</span></li>
                                                            <li><strong><span data-i18n="ZZ08">上課教室</span>：</strong><span class="text-primary">${Room(item.Room, item.ComptRoom)}</span></li>
                                                            <li><strong><span data-i18n="ZZ05">人數下限</span>：</strong><span class="text-primary">${item.MinSel}</span></li>
                                                            <li>
                                                                <strong><span data-i18n="ZZ52">教科書</span>：</strong>
                                                                <span class="text-primary">
                                                                ${item.BookLang === "0"
                                                                    ? (savedLang === "en" ? "Chinese" : "中文")
                                                                    : (savedLang === "en" ? "English" : "英文")}
                                                                </span>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                                <ul class="list-unstyled mb-1">
                                                    <li><strong><span data-i18n="ZZ11">教師</span>：</strong><span class="text-primary">${item.TeaName ?? ""}</span></li>
                                                </ul>
                                            </div>
                                            <span class="btn toggle-btn"
                                                data-bs-toggle="collapse"
                                                data-bs-target="#${collapseId}"
                                                aria-expanded="false"
                                                aria-controls="${collapseId}" title="合起">
                                                <i class="bi bi-caret-up-fill"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            `;
                    document.getElementById('cardContainer').insertAdjacentHTML('beforeend', str);
                    initCardCollapse();


                    if (window.innerWidth <= 768) {
                        const btn = document.getElementById('btnQuery');
                        if (btn) {
                            btn.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                });
            } catch (error) {
                console.error("Fetch Error:", error);
                showAlert('訊息視窗', "連線失敗!(03)", "error");
            } finally {
                hideLoading();
            }

觸發

<div class="col-12 col-md-8 d-flex justify-content-center">
            <button type="button" class="btn btn-sm btn-custom w-100" onclick="getList();" id="btnQuery" title="查詢" data-i18n-title="ZZ45" data-i18n="ZZ45">查詢</button>
        </div>
