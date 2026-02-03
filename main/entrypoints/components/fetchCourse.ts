//抓取課程資料組件,他會自己叫background要token然後抓課程資料,並傳回所有課程陣列

import { useState, useEffect, useRef } from "react";

// 定義一個 Hook 讓其他組件使用
export function fetchCourse() {
  const [isLoading, setIsLoading] = useState(false); // 工作狀態指示燈
  const [progress, setProgress] = useState(""); // 顯示目前進度文字
  const [allData, setAllData] = useState<any[]>([]); // 最終的大陣列

  // --- 設定區 ---
  // 將token存在ref中可以避免重複渲染(因為我在最上會重置token(= useRef(""))
  //設定一個變數來存csrf token同時重置他
  const csrfTokenRef = useRef("");
  const ACS = "1142"; // 學期

  // --- 內部通用 Helper ---
  async function postData(url: string, data: any) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "x-csrf-token": csrfTokenRef.current,
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  }

  //1. 獲取科系列表:依序抓取所有科系代碼後存到陣列deptList後回傳
  async function fetchAllDeptsNum() {
    setProgress("正在獲取科系代碼清單...");
    let deptList: any[] = [];
    const systems = [
      { t: "2", name: "大學部" },
      { t: "3", name: "研究所" },
    ];
    const faculties = ["1", "2", "3", "4", "5", "6"];

    for (let sys of systems) {
      for (let f of faculties) {
        try {
          const response = await postData(
            "https://academics.nutn.edu.tw/Course/api/Query/GetDept",
            {
              t: sys.t,
              f: f,
              l: "zh-TW",
            },
          );
          if (response && response.length > 0) {
            response.forEach((dept: any) => {
              deptList.push({
                ki: sys.t,
                dc: dept.code,
                name: dept.code_name,
                sysName: sys.name,
              });
            });
          }
        } catch (e) {
          console.error(`獲取科系失敗 ${sys.name}-${f}`, e);
        }
      }
    }
    console.log("科系代碼獲取完成，共:", deptList.length);
    return deptList;
  }

  // 2. 獲取主課程 (接收 deptList):獲取大學和研究所所有科系的課程資料並加入到courses陣列後回傳
  async function fetchMainCourses(deptList: any[]) {
    setProgress(`正在獲取主課程 (共 ${deptList.length} 個科系)...`);
    //拿一個空陣列來存課程資料
    let courses: any[] = [];

    // 設定平行處理數量
    const BATCH_SIZE = 6; // 一次同時發送 6 個請求(用promise.all時瀏覽器的上限,再多也是擠這6個通道)

    // 將 deptList 切成很多小批次
    for (let i = 0; i < deptList.length; i += BATCH_SIZE) {
      //這一批要跑的科系,從i開始到i+BATCH_SIZE結束
      const batchDepts = deptList.slice(i, i + BATCH_SIZE);

      // 更新進度顯示
      setProgress(`正在獲取主課程: ${i}/${deptList.length} (分批加速中...)`);

      const batchPromises = batchDepts.map(async (dept) => {
        try {
          const response = await postData(
            "https://academics.nutn.edu.tw/Course/api/Query/GetCourse",
            {
              acs: ACS,
              ki: dept.ki,
              dc: dept.dc,
              kw: "",
              gr: "",
              ch: "",
              ot: "",
              ge: "",
              ta: "",
              we: "",
              ll: "",
            },
          );

          if (response && response.length > 0) {
            return response; // 回傳找到的課程陣列
          }
          return []; // 沒找到就回傳空陣列
        } catch (e) {
          console.error(`查詢失敗: ${dept.name}`, e);
          return [];
        }
      });

      // 用promise.all來執行,他會讓這一批全部跑完,才繼續往下
      //跟一般promise的不同是他可以一次處理多個promise然後等全部完成(普通promise只能處理一個)
      const batchResults = await Promise.all(batchPromises);

      // 將結果合併回 courses
      batchResults.forEach((result) => {
        courses = courses.concat(result);
      });

      // 每批次中間稍作休息，給伺服器喘氣空間 (例如 50ms)
      await new Promise((r) => setTimeout(r, 50));
    }

    return courses;
  }

  // 3. 通識:獲取所有通識課程並加入到courses陣列後回傳
  async function fetchGeneralEdCourses() {
    setProgress("正在獲取通識課程...");
    const geCodes = ["A", "AA", "AB", "AC", "AD", "AE", "AF", "AG"];
    //拿一個空陣列來存課程資料
    let courses: any[] = [];

    // 全部一起發送請求
    const promises = geCodes.map(async (code) => {
      try {
        const response = await postData(
          "https://academics.nutn.edu.tw/Course/api/Query/GetCourse",
          {
            acs: ACS,
            ki: "4",
            ge: code,
            dc: "",
            kw: "",
            gr: "",
            ch: "",
            ot: "",
            ta: "",
            we: "",
            ll: "",
          },
        );
        return response || [];
      } catch (e) {
        return [];
      }
    });

    //用 Promise.all 執行請求並等待所有請求完成
    const results = await Promise.all(promises);
    //把所有結果合併到 courses 陣列中
    results.forEach((response) => (courses = courses.concat(response)));
    return courses;
  }

  // 4. 師培:獲取所有師培課程並加入到courses陣列後回傳
  async function fetchTeacherEdCourses() {
    setProgress("正在獲取師培課程...");
    const taCodes = [
      "ZZS101",
      "ZZS102",
      "ZZS201",
      "ZZS202",
      "ZZS203",
      "ZZU051",
      "ZZU075",
    ];
    let courses: any[] = [];

    // 全部一起發送請求
    const promises = taCodes.map(async (code) => {
      try {
        const response = await postData(
          "https://academics.nutn.edu.tw/Course/api/Query/GetCourse",
          {
            acs: ACS,
            ki: "5",
            ta: code,
            dc: "",
            kw: "",
            gr: "",
            ch: "",
            ot: "",
            ge: "",
            we: "",
            ll: "",
          },
        );
        return response || [];
      } catch (e) {
        return [];
      }
    });

    const results = await Promise.all(promises);
    results.forEach((response) => (courses = courses.concat(response)));
    return courses;
  }

  // 5. 其他:獲取所有其他課程並加入到courses陣列後回傳
  async function fetchOtherCourses() {
    setProgress("正在獲取其他課程...");
    const otCodes = ["EMI_S", "EMI_M", "DIS_0", "DIS_1", "DIS_2"];
    let courses: any[] = [];
    // 全部一起發送請求
    const promises = otCodes.map(async (code) => {
      try {
        const response = await postData(
          "https://academics.nutn.edu.tw/Course/api/Query/GetCourse",
          {
            acs: ACS,
            ki: "6",
            ot: code,
            dc: "",
            kw: "",
            gr: "",
            ch: "",
            ge: "",
            ta: "",
            we: "",
            ll: "",
          },
        );
        return response || [];
      } catch (e) {
        return [];
      }
    });
    const results = await Promise.all(promises);
    results.forEach((response) => (courses = courses.concat(response)));
    return courses;
  }

  // 監聽如果progress有改變就印出來
  useEffect(() => {
    if (progress) {
      console.log("目前的進度狀態：", progress);
    }
  }, [progress]); // 這裡放「依賴項」，代表只有 progress 變了才執行(等同於監聽progress的變化)

  //向 Background 要 Token 的函式
  async function fetchCsrfToken() {
    try {
      const response = await browser.runtime.sendMessage({
        type: "GET_CSRF_TOKEN",
      });
      if (response && response.token) {
        console.log("成功獲取 Token:", response.token);
        return response.token;
      } else {
        console.warn("未找到 Token，請確認是否已登入學校系統");
        return "";
      }
    } catch (error) {
      console.error("與 Background 通訊失敗:", error);
      return "";
    }
  }

  // === 主控函式: 串接所有步驟 ===
  const runCrawler = async () => {
    //打開指示燈
    setIsLoading(true);
    // 清空舊資料
    setAllData([]);
    //設定一個變數來存所有課程大陣列
    let finalBigArray: any[] = [];

    try {
      // Step 0: 先去拿 Token
      setProgress("正在獲取身份驗證 Token...");
      const token = await fetchCsrfToken();
      if (!token) {
        throw new Error("無法獲取 CSRF Token，請先登入學校課程系統。");
      }
      // 存入 Ref
      csrfTokenRef.current = token;

      // Step 1: 先拿到科系代碼
      const deptList = await fetchAllDeptsNum();

      // Step 2, 3, 4, 5: 依序抓取 (也可以改成 Promise.all 平行抓取加速，但怕被學校擋 IP，建議維持順序)

      // 抓主課程 (這步最久)
      const mainCourses = await fetchMainCourses(deptList);
      finalBigArray = finalBigArray.concat(mainCourses);

      // 抓通識
      const genCourses = await fetchGeneralEdCourses();
      finalBigArray = finalBigArray.concat(genCourses);

      // 抓師培
      const teacherCourses = await fetchTeacherEdCourses();
      finalBigArray = finalBigArray.concat(teacherCourses);

      // 抓其他
      const otherCourses = await fetchOtherCourses();
      finalBigArray = finalBigArray.concat(otherCourses);

      console.log("全部抓取完畢！總筆數:", finalBigArray.length);
      setAllData(finalBigArray); // 存入 State
      setProgress(`完成！共 ${finalBigArray.length} 筆課程`);

      return finalBigArray; 
      //不用return因為已存在state裡
    } catch (error) {
      console.error("抓取過程發生錯誤", error);
      setProgress("抓取失敗，請看 Console");
    } finally {
      setIsLoading(false);
    }
  };

  // 回傳給外部使用的東西
  return {
    runCrawler, // 啟動按鈕,呼叫這個 function 就會開始跑
    isLoading, // 狀態指示燈
    progress, // 目前的執行進度文字
    allData, // 抓完後的所有課程資料
  };
}
