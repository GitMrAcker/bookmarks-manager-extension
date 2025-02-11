import { loadStyles } from "../utils/style-loader.js"
import { initializeManager } from "./manager.js"

// Load styles
loadStyles()

// Initialize manager when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeManager)
} else {
  initializeManager().catch((error) => {
    console.error("Error initializing manager:", error)
  })
}

