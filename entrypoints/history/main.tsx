import { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { browser } from "wxt/browser";
import { App } from "./App";
import "./style.css";

function HistoryEntryPoint() {
  useEffect(() => {
    if (!navigator.userAgent.includes("Edg")) return;

    async function openEdgeHistoryTab(): Promise<void> {
      const [historyTab] = await browser.tabs.query({ url: "edge://history/" });

      if (historyTab?.id !== undefined) {
        await browser.tabs.update(historyTab.id, { active: true });
        return;
      }

      await browser.tabs.create({ url: "edge://history/" });
    }

    openEdgeHistoryTab().catch((error) => {
      console.error("[Infinite History] Failed to open Edge history tab", error);
    });
  }, []);

  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(<HistoryEntryPoint />);
