


//目前為測試功能只有抓取cookie內的csrf_token值並回傳給前端
export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  // 監聽來自前端的訊息
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_CSRF_TOKEN') {
      // 查詢 Cookie
      browser.cookies.get({
        url: "https://academics.nutn.edu.tw",
        name: "csrf_token" // 請確認 Network 面板中 Cookie 的正確名稱是否為 "csrf_token"
      }).then((cookie) => {
        // 回傳找到的值，若沒找到回傳 null
        sendResponse({ token: cookie?.value || null });
      });

      return true; // 告訴瀏覽器我們會異步回傳 (sendResponse)
    }
  });
});