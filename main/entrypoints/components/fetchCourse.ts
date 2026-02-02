//抓取課程資料組件,他會自己叫background要token然後抓課程資料,並傳回所有課程陣列



import { useState,useEffect,useRef } from "react";

// 定義一個 Hook 讓其他組件使用
export function useFetchCourses() {
    const [isLoading, setIsLoading] = useState(false);// 工作狀態指示燈
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
                "x-csrf-token": csrfTokenRef.current
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    }

    //1. 獲取科系列表:依序抓取所有科系代碼後存到陣列deptList後回傳
    async function fetchAllDeptsNum() {
        setProgress("正在獲取科系代碼清單...");
        let deptList: any[] = [];
        const systems = [{ t: "2", name: "大學部" }, { t: "3", name: "研究所" }];
        const faculties = ["1", "2", "3", "4", "5", "6"];

        for (let sys of systems) {
            for (let f of faculties) {
                try {
                    const response = await postData("https://academics.nutn.edu.tw/Course/api/Query/GetDept", {
                        "t": sys.t, "f": f, "l": "zh-TW"
                    });
                    if (response && response.length > 0) {
                        response.forEach((dept: any) => {
                            deptList.push({
                                ki: sys.t, dc: dept.code, name: dept.code_name, sysName: sys.name
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
        let courses: any[] = [];
        
        for (let i = 0; i < deptList.length; i++) {
            const dept = deptList[i];
            // 更新進度顯示 (每 5 個顯示一次避免一直渲染)
            //如果i除5的餘數是零(整除)就更新進度文字
            if(i % 5 === 0) setProgress(`正在獲取主課程: ${i}/${deptList.length} - ${dept.name}`);
            
            await new Promise(r => setTimeout(r, 100)); // 延遲

            try {
                const response = await postData("https://academics.nutn.edu.tw/Course/api/Query/GetCourse", {
                    "acs": ACS, "ki": dept.ki, "dc": dept.dc,
                    "kw": "", "gr": "", "ch": "", "ot": "", "ge": "", "ta": "", "we": "", "ll": ""
                });
                if (response && response.length > 0) {
                    courses = courses.concat(response);
                }
            } catch (e) {
                console.error(`查詢失敗: ${dept.name}`, e);
            }
        }
        return courses;
    }

    // 3. 通識:獲取所有通識課程並加入到courses陣列後回傳
    async function fetchGeneralEdCourses() {
        setProgress("正在獲取通識課程...");
        const geCodes = ["A","AA","AB","AC","AD","AE","AF","AG"];
        let courses: any[] = [];
        for (let code of geCodes) {
            try {
                const response = await postData("https://academics.nutn.edu.tw/Course/api/Query/GetCourse", {
                    "acs": ACS, "ki": "4", "ge": code,
                    "dc": "", "kw": "", "gr": "", "ch": "", "ot": "", "ta": "", "we": "", "ll": ""
                });
                if (response && response.length > 0) courses = courses.concat(response);
            } catch (e) {}
        }
        return courses;
    }

    // 4. 師培:獲取所有師培課程並加入到courses陣列後回傳
    async function fetchTeacherEdCourses() {
        setProgress("正在獲取師培課程...");
        const taCodes = ["ZZS101","ZZS102","ZZS201","ZZS202","ZZS203","ZZU051","ZZU075"];  
        let courses: any[] = [];
        for (let code of taCodes) {
            try {
                const response = await postData("https://academics.nutn.edu.tw/Course/api/Query/GetCourse", {
                    "acs": ACS, "ki": "5", "ta": code,
                    "dc": "", "kw": "", "gr": "", "ch": "", "ot": "", "ge": "", "we": "", "ll": ""
                });
                if (response && response.length > 0) courses = courses.concat(response);
            } catch (e) {}
        }
        return courses;
    }

    // 5. 其他:獲取所有其他課程並加入到courses陣列後回傳
    async function fetchOtherCourses() {
        setProgress("正在獲取其他課程...");
        const otCodes = ["EMI_S","EMI_M","DIS_0","DIS_1","DIS_2"]; 
        let courses: any[] = [];
        for (let code of otCodes) {
            try {
                const response = await postData("https://academics.nutn.edu.tw/Course/api/Query/GetCourse", {
                    "acs": ACS, "ki": "6", "ot": code,
                    "dc": "", "kw": "", "gr": "", "ch": "", "ge": "", "ta": "", "we": "", "ll": ""
                });
                if (response && response.length > 0) courses = courses.concat(response);
            } catch (e) {}
        }
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
            const response = await browser.runtime.sendMessage({ type: 'GET_CSRF_TOKEN' });
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
        isLoading,  // 狀態指示燈
        progress,   // 目前的執行進度文字
        allData     // 抓完後的所有課程資料
    };
}