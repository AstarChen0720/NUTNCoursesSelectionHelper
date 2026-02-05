//課程參數表
//這是所有我課程需要用到的參數(例如課表或課程類別代碼)

export const SEMESTER = "1142"; // 114 下學期

export const API_URLS = {
  GET_DEPT: "https://academics.nutn.edu.tw/Course/api/Query/GetDept",
  GET_COURSE: "https://academics.nutn.edu.tw/Course/api/Query/GetCourse",
};

export const SYSTEMS = [
  { t: "2", name: "大學部" },
  { t: "3", name: "研究所" },
];

export const FACULTIES = ["1", "2", "3", "4", "5", "6"];

export const GENERAL_ED_CODES = ["A", "AA", "AB", "AC", "AD", "AE", "AF", "AG"];

export const TEACHER_ED_CODES = [
  "ZZS101",
  "ZZS102",
  "ZZS201",
  "ZZS202",
  "ZZS203",
  "ZZU051",
  "ZZU075",
];

export const OTHER_CODES = ["EMI_S", "EMI_M", "DIS_0", "DIS_1", "DIS_2"];

export const PERIODS: { val: string; text: string }[] = [
  { val: "1", text: "1(7:00~7:50)" },
  { val: "2", text: "2(8:00~8:50)" },
  { val: "3", text: "3(9:00~9:50)" },
  { val: "4", text: "4(10:00~10:50)" },
  { val: "5", text: "5(11:00~11:50)" },
  { val: "6", text: "6(12:00~12:50)" },
  { val: "7", text: "7(13:00~13:50)" },
  { val: "8", text: "8(14:00~14:50)" },
  { val: "9", text: "9(15:00~15:50)" },
  { val: "A", text: "A(16:00~16:50)" },
  { val: "B", text: "B(17:00~17:50)" },
  { val: "C", text: "C(18:00~18:50)" },
  { val: "D", text: "D(19:00~19:50)" },
  { val: "E", text: "E(20:00~20:50)" },
  { val: "F", text: "F(21:00~21:50)" },
];

export const DAYS: { val: string; text: string }[] = [
  { val: "1", text: "一" },
  { val: "2", text: "二" },
  { val: "3", text: "三" },
  { val: "4", text: "四" },
  { val: "5", text: "五" },
  { val: "6", text: "六" },
  { val: "7", text: "日" },
];
