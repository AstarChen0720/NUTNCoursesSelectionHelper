//DOM渲染工具
//負責將課程資料渲染到網頁上的課程列表中


//從型別規定表中引入Couse的規定
import { Course } from "../types";

export function renderCoursesToSchoolPage(courses: Course[]) {
  const cardContainer = document.getElementById("cardContainer");
  if (!cardContainer) {
    console.error("❌ 找不到 #cardContainer，無法渲染");
    alert("程式發生錯誤：找不到網頁上的課程列表容器 (#cardContainer)");
    return;
  }

  // 1. 強制顯示容器
  cardContainer.style.display = "block";
  cardContainer.style.opacity = "1";

  // 2. 清空容器
  cardContainer.innerHTML = "";

  if (courses.length === 0) {
    cardContainer.innerHTML = `<div class="alert alert-warning text-center">沒有符合篩選條件的課程</div>`;
    return;
  }

  // --- Helpers ---
  const localChoice = (val: string) => {
    let colorClass = "bg-secondary";
    if (val && val.includes("必")) colorClass = "bg-primary";
    else if (val && val.includes("選")) colorClass = "bg-success";
    return `<span class="badge ${colorClass} me-1">${val || ""}</span>`;
  };

  const localGetTea = (
    email: string,
    no: string,
    alpt: string,
    name: string,
  ) => {
    return name || "";
  };

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
    return `[${wStr}] ${section || ""}`;
  };

  const localRoom = (room: string, comptRoom: string) => {
    if (room && comptRoom) return `${room} / ${comptRoom}`;
    return room || comptRoom || "";
  };

  // 3. 遍歷資料並產生 HTML
  courses.forEach((item, index) => {
    const cardId = `card_${index + 1}`;
    const collapseId = `collapseDetails_${index + 1}`;

    const str = `
        <div class="col-12 col-md-6 mb-3">
            <div class="card h-100 rounded-0 shadow-sm border-0" style="border-left: 5px solid #ffc107 !important;" id="${cardId}">
                <div class="card-body d-flex flex-column pt-3 pb-3">
                    <h5 class="card-title mb-2" style="font-size: 1.1rem; font-weight: bold;">
                        ${localChoice(item.Choice)} 
                        <span>${item.CourName}</span>
                    </h5>
                    <div class="text-muted mb-2" style="font-size: 0.85rem;">${item.CourEngName || ""}</div>
                    
                    <p class="card-text mb-2 text-dark" style="font-size: 0.95rem; line-height: 1.6;">
                        <i class="bi bi-people-fill text-secondary me-1"></i> <span class="fw-bold">${item.ClassName1 || "無班級"}</span>
                        <span class="mx-2 text-muted">|</span>
                        
                        <i class="bi bi-person-badge text-secondary me-1"></i> ${localGetTea(item.TeaEmail || "", item.TeaNo1 || "", item.AlPt || "", item.TeaName1 || "")}
                        <span class="mx-2 text-muted">|</span>
                        
                        <span class="fw-bold">${item.Credit}</span> 學分
                        <br />
                        
                        <i class="bi bi-clock text-secondary me-1"></i> <span class="text-danger fw-bold">${localWeekSection(item.Week, item.Section)}</span>
                        <span class="mx-2 text-muted">|</span>
                        
                        <i class="bi bi-geo-alt text-secondary me-1"></i> ${localRoom(item.Room || "", item.ComptRoom || "")}
                    </p>

                    <div class="row justify-content-between align-items-center mt-auto">
                         <div class="col-auto">
                             <small class="text-muted">選課號: ${item.SelCourNo}</small>
                         </div>
                         <div class="col-auto">
                            <span class="text-primary my-collapse-btn" 
                                  data-target="${collapseId}" 
                                  style="cursor: pointer; font-size: 0.9rem;">
                                <i class="bi bi-caret-down-fill"></i> 詳細資訊
                            </span>
                        </div>
                    </div>
                </div>

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

  // 4. 手動綁定摺疊按鈕事件
  const btns = cardContainer.querySelectorAll(".my-collapse-btn");
  btns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      const targetId = (e.currentTarget as HTMLElement).getAttribute("data-target");
      if (targetId) {
        const content = document.getElementById(targetId);
        if (content) {
          const isHidden = content.style.display === "none";
          content.style.display = isHidden ? "block" : "none";

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
