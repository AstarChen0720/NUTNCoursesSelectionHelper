export default defineContentScript({
  matches: ["https://academics.nutn.edu.tw/Course/Qry/cos"],
  runAt: "document_idle",
  main() {
    console.log("NUTN Selection Helper injected.");

    const btn = document.createElement("button");
    btn.innerText = "測試: 透過 API 抓取 (請準備 Token)";
    btn.style.position = "fixed";
    btn.style.bottom = "20px";
    btn.style.right = "20px";
    btn.style.zIndex = "99999";
    btn.style.padding = "10px 20px";
    btn.style.backgroundColor = "#28a745";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";
    btn.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";

    btn.onclick = async () => {
      try {
        btn.disabled = true;
        // 1. 在按下的瞬間，確保使用者去複製最新的 Token
        const token = prompt(
          "請去 DevTools -> Application -> Cookies\n複製 'csrf_token' 的值並貼上：",
        );

        if (!token) {
          alert("未輸入 Token，取消操作");
          btn.disabled = false;
          return;
        }

        btn.innerText = "API 請求中...";
        // 把 token 傳進去
        await runAllLoops(token);

        btn.innerText = "抓取完成! 請查看 Console";
        setTimeout(
          () => (btn.innerText = "測試: 透過 API 抓取 (請準備 Token)"),
          3000,
        );
      } catch (error) {
        console.error("API Fetch error:", error);
        btn.innerText = "失敗 (看 Console)";
        setTimeout(
          () => (btn.innerText = "測試: 透過 API 抓取 (請準備 Token)"),
          3000,
        );
      } finally {
        btn.disabled = false;
      }
    };

    document.body.appendChild(btn);
  },
});

const ACS = "1142";
const geCodes = ["A", "AA", "AB", "AC", "AD", "AE", "AF", "AG"];
const taCodes = [
  "ZZS101",
  "ZZS102",
  "ZZS201",
  "ZZS202",
  "ZZS203",
  "ZZU051",
  "ZZU075",
];
const otCodes = ["EMI_S", "EMI_M", "DIS_0", "DIS_1", "DIS_2"];
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- 通用 API 請求函式 ---
async function fetchApi(
  endpoint: string,
  data: any,
  token: string,
): Promise<any[] | { error: string }> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json; charset=utf-8",
      "x-csrf-token": token, // 使用當下輸入的 Token
    };

    const response = await fetch(
      `https://academics.nutn.edu.tw/Course/api/Query/${endpoint}`,
      {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data),
        credentials: "include", // 確保 Session Cookie 有帶上
      },
    );

    if (!response.ok) {
      // 顯示更詳細的錯誤
      console.error(`API Error ${response.status} on ${endpoint}`);
      throw new Error(`API Error ${response.status}`);
    }

    const json = await response.json();
    return json;
  } catch (e: any) {
    console.error(`Fetch ${endpoint} failed:`, e);
    return [];
  }
}

// 取得科系代碼
async function getCodesFromApi(t: string, f: string, token: string) {
  const res = await fetchApi("GetDept", { t, f, l: "zh-TW" }, token);
  if (Array.isArray(res)) {
    return res.map((item) => item.code);
  }
  return [];
}

// 傳入 token 參數
async function runAllLoops(token: string) {
  let totalItems = 0;
  let totalRequests = 0;
  const allJsonDataStub: any[] = [];

  console.log("開始執行... 使用 Token:", token);

  const processApiRequest = async (label: string, params: any) => {
    const payload = {
      acs: ACS,
      kw: "",
      gr: "",
      ch: "",
      ot: "",
      ge: "",
      ta: "",
      we: "",
      ll: "zh-TW",
      ki: "",
      dc: "",
      ...params,
    };
    // 傳遞 token
    const data = await fetchApi("GetCourse", payload, token);
    totalRequests++;

    if (Array.isArray(data) && data.length > 0) {
      totalItems += data.length;
      allJsonDataStub.push(...data);
      console.log(`[${label}] 成功 - ${data.length} 筆`);
    }
  };

  // 為了省時間測試，這裡只列出關鍵的測試點，若成功再全部打開
  // 1. 通識
  console.log("--- 1. 通識 ---");
  for (const code of geCodes)
    await processApiRequest(`通識-${code}`, { ki: "4", ge: code });

  // 2. 師培
  console.log("--- 2. 師培 ---");
  for (const code of taCodes)
    await processApiRequest(`師培-${code}`, { ki: "5", ta: code });

  // 3. 其他
  console.log("--- 3. 其他 ---");
  for (const code of otCodes)
    await processApiRequest(`其他-${code}`, { ki: "6", ot: code });

  // 4. 大學部 (先測前兩個學院就好，驗證 token 是否有效)
  console.log("--- 4. 大學部 (測試前2個學院) ---");
  for (let f = 1; f <= 2; f++) {
    const fStr = f.toString();
    const deptCodes = await getCodesFromApi("2", fStr, token);
    console.log(`學院 ${fStr} 系所數: ${deptCodes.length}`);
    for (const dc of deptCodes) {
      await processApiRequest(`大學部-${dc}`, { ki: "2", dc: dc });
      await delay(50);
    }
  }

  const jsonString = JSON.stringify(allJsonDataStub);
  const sizeMB = (jsonString.length / 1024 / 1024).toFixed(4);

  console.log("==========================================");
  console.log(`測試完畢！(詳細看上面 log)`);
  console.log(`總筆數: ${totalItems}`);
  console.log(`JSON 大小: ${sizeMB} MB`);
  console.log("==========================================");
}

// --- 取得 CSRF Token (關鍵) ---
function getCsrfToken() {
  // 1. 嘗試從 Cookie 找 (針對非 HttpOnly)
  const cookieMatch = document.cookie.match(/csrf_token=([^;]+)/);
  if (cookieMatch) return cookieMatch[1];

  // 2. 嘗試從隱藏欄位找 (備用)
  const input = document.querySelector(
    'input[name="__RequestVerificationToken"]',
  ) as HTMLInputElement;
  if (input) return input.value;

  // 3. 嘗試從 Meta 找 (備用)
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (meta) return meta.getAttribute("content");

  // 4. 【新增】如果都找不到，彈出視窗讓開發者手動輸入 (暫時性除錯用)
  // 如果你已經很確定在 Application Cookie 看到它，就複製貼上這裡
  // 或者你可以在這裡寫死： return "這裡貼上你剛剛看到的亂碼";
  const manualToken = prompt(
    "無法自動抓取 CSRF Token (可能是 HttpOnly)。請去 Application -> Cookies 複製 csrf_token 的值並貼上：",
  );
  if (manualToken) return manualToken;

  return "";
}
