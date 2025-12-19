import { createApp } from "vue";
import App from "./App.vue";
import "./index.css";
import { Capacitor } from "@capacitor/core";
import { defineCustomElements as jeepSqlite } from "jeep-sqlite/loader";

const app = createApp(App);

const init = async () => {
  if (Capacitor.getPlatform() === "web") {
    // Register the custom element
    jeepSqlite(window);

    // For web platform, wait for DOMContentLoaded
    if (document.readyState === "loading") {
      await new Promise((resolve) => {
        window.addEventListener("DOMContentLoaded", resolve);
      });
    }

    // Create and append the jeep-sqlite element
    const jeepEl = document.createElement("jeep-sqlite");
    jeepEl.setAttribute("auto-save", "true");
    document.body.appendChild(jeepEl);

    // Wait for the element to be defined
    console.log("⏳ Waiting for jeep-sqlite element...");
    await customElements.whenDefined("jeep-sqlite");
    console.log("✅ jeep-sqlite element defined");
  }

  // Finally mount the app (on all platforms)
  console.log("🚀 Mounting Vue app");
  app.mount("#app");
};

init();
