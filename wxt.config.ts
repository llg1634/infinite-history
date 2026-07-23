import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Infinite History",
    description: "本地优先的无限浏览历史归档与导出工具。",
    permissions: [
      "alarms",
      "favicon",
      "history",
      "storage",
      "tabs",
      "unlimitedStorage",
    ],
    chrome_url_overrides: {
      history: "history.html",
    },
    action: {
      default_title: "打开 Infinite History",
      default_icon: {
        16: "icon/16.png",
        32: "icon/32.png",
        48: "icon/48.png",
      },
    },
    icons: {
      16: "icon/16.png",
      32: "icon/32.png",
      48: "icon/48.png",
      128: "icon/128.png",
    },
    web_accessible_resources: [
      {
        resources: ["_favicon/*"],
        matches: ["<all_urls>"],
      },
    ],
  },
});
