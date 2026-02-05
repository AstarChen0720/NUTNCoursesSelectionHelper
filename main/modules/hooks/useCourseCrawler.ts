//控制抓取課程的函式
//叫background script去抓csrf token,然後叫CourseService.runCrawler()抓取課程資料

//這個函式用來抓取課程資料
import { useState, useRef, useCallback } from "react";
import { Course } from "../types";
import { CourseService } from "../services/CourseService";

export function useCourseCrawler() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [allData, setAllData] = useState<Course[]>([]);
  const csrfTokenRef = useRef("");

  const fetchCsrfToken = useCallback(async () => {
    try {
      const response = await browser.runtime.sendMessage({
        type: "GET_CSRF_TOKEN",
      });
      if (response && response.token) {
        return response.token;
      } else {
        console.warn("未找到 Token");
        return "";
      }
    } catch (error) {
      console.error("與 Background 通訊失敗:", error);
      return "";
    }
  }, []);

  const runCrawler = useCallback(async () => {
    setIsLoading(true);
    setAllData([]);
    let finalBigArray: Course[] = [];

    try {
      setProgress("正在獲取身份驗證 Token...");
      const token = await fetchCsrfToken();
      if (!token) {
        throw new Error("無法獲取 CSRF Token，請先登入學校課程系統。");
      }
      csrfTokenRef.current = token;

      const deptList = await CourseService.fetchAllDepts(token);
      setProgress(`已獲取 ${deptList.length} 個科系，開始抓取課程...`);

      const mainCourses = await CourseService.fetchMainCourses(
        token,
        deptList,
        setProgress,
      );
      finalBigArray = finalBigArray.concat(mainCourses);

      setProgress("正在獲取通識課程...");
      const genCourses = await CourseService.fetchGeneralEdCourses(token);
      finalBigArray = finalBigArray.concat(genCourses);

      setProgress("正在獲取師培課程...");
      const teacherCourses = await CourseService.fetchTeacherEdCourses(token);
      finalBigArray = finalBigArray.concat(teacherCourses);

      setProgress("正在獲取其他課程...");
      const otherCourses = await CourseService.fetchOtherCourses(token);
      finalBigArray = finalBigArray.concat(otherCourses);

      console.log("全部抓取完畢！總筆數:", finalBigArray.length);
      setAllData(finalBigArray);
      setProgress(`完成！共 ${finalBigArray.length} 筆課程`);

      return finalBigArray;
    } catch (error) {
      console.error("抓取過程發生錯誤", error);
      setProgress("抓取失敗，請看 Console");
    } finally {
      setIsLoading(false);
    }
  }, [fetchCsrfToken]);

  return {
    runCrawler,
    isLoading,
    progress,
    allData,
  };
}
