//型別規定表:各大函式的型別規定



export interface Course {
  Choice: string; // 必選修 "必", "選"
  CourName: string; // 課程名稱
  CourEngName?: string; // 英文課名
  ClassName1: string; // 班級
  TeaEmail?: string;
  TeaNo1?: string;
  AlPt?: string;
  TeaName1?: string; // 老師姓名
  Credit: string; // 學分
  Week: string; // 星期
  Section: string; // 節次
  Room?: string; // 教室
  ComptRoom?: string; // 電腦教室
  SelCourNo: string; // 選課號
  CourNo: string; // 課程代碼
  MaxSel: string; // 人數上限
  NowSel: string; // 已選人數
  TotHour?: string; // 總時數
  UnitName?: string; // 開課單位
  Remark?: string; // 備註
}

export interface Dept {
  ki: string; // System type (2=Undergrad, 3=Grad)
  dc: string; // Dept Code
  name: string; // Dept Name
  sysName: string; // System Name (e.g., "大學部")
}

export interface FetchCourseResult {
  runCrawler: () => Promise<Course[] | undefined>;
  isLoading: boolean;
  progress: string;
  allData: Course[];
}

export interface Period {
  val: string;
  text: string;
}
