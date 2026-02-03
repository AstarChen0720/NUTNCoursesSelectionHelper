import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    permissions: ["cookies"], // cookies 權限
    host_permissions: [
      "*://academics.nutn.edu.tw/*", // 學校網址權限
    ],

    // 將所有尺寸都指向同一張 128px 的圖片，瀏覽器會自動縮放
    icons: {
      "16": "NUTNCSH.png",
      "32": "NUTNCSH.png",
      "48": "NUTNCSH.png",
      "96": "NUTNCSH.png",
      "128": "NUTNCSH.png",
    },
  },
});
