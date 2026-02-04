//抓取課程資料的工具函式


import { Course, Dept } from "../types";
import {
  API_URLS,
  SEMESTER,
  SYSTEMS,
  FACULTIES,
  GENERAL_ED_CODES,
  TEACHER_ED_CODES,
  OTHER_CODES,
} from "../constants";

//抓取課程資料的工具函式
export class CourseService {
  private static async postData(url: string, data: any, token: string) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "x-csrf-token": token,
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  }

  //抓科系代碼的函式
  //static是靜態方法,可以讓這個函式當作是CourseService的方法,可以直接用CourseService.fetchAllDepts(token)呼叫
  static async fetchAllDepts(token: string): Promise<Dept[]> {
    let deptList: Dept[] = [];

    for (let sys of SYSTEMS) {
      for (let f of FACULTIES) {
        try {
          const response = await this.postData(
            API_URLS.GET_DEPT,
            {
              t: sys.t,
              f: f,
              l: "zh-TW",
            },
            token,
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
    return deptList;
  }
  //抓主課程的函式
  static async fetchMainCourses(
    token: string,
    deptList: Dept[],
    onProgress?: (progress: string) => void,
  ): Promise<Course[]> {
    let courses: Course[] = [];
    const BATCH_SIZE = 6;

    for (let i = 0; i < deptList.length; i += BATCH_SIZE) {
      const batchDepts = deptList.slice(i, i + BATCH_SIZE);

      if (onProgress) {
        onProgress(`正在獲取主課程: ${i}/${deptList.length} (分批加速中...)`);
      }

      const batchPromises = batchDepts.map(async (dept) => {
        try {
          const response = await this.postData(
            API_URLS.GET_COURSE,
            {
              acs: SEMESTER,
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
            token,
          );

          return (response && response.length > 0) ? response : [];
        } catch (e) {
          console.error(`查詢失敗: ${dept.name}`, e);
          return [];
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach((result) => {
        courses = courses.concat(result);
      });

      await new Promise((r) => setTimeout(r, 50));
    }
    return courses;
  }

  //抓一般教育課程的函式
  static async fetchGeneralEdCourses(token: string): Promise<Course[]> {
    let courses: Course[] = [];
    const promises = GENERAL_ED_CODES.map(async (code) => {
      try {
        const response = await this.postData(
          API_URLS.GET_COURSE,
          {
            acs: SEMESTER,
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
          token,
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

  //抓師資教育課程的函式
  static async fetchTeacherEdCourses(token: string): Promise<Course[]> {
    let courses: Course[] = [];
    const promises = TEACHER_ED_CODES.map(async (code) => {
      try {
        const response = await this.postData(
          API_URLS.GET_COURSE,
          {
            acs: SEMESTER,
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
          token,
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

  //抓其他教育課程的函式
  static async fetchOtherCourses(token: string): Promise<Course[]> {
    let courses: Course[] = [];
    const promises = OTHER_CODES.map(async (code) => {
      try {
        const response = await this.postData(
          API_URLS.GET_COURSE,
          {
            acs: SEMESTER,
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
          token,
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
}
