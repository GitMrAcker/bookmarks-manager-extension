// Import chrome from core utilities
import { chrome } from "./core.js"

export function loadStyles() {
  const cssFiles = ["assets/css/roboto.css", "assets/css/fontawesome.min.css", "assets/css/styles.css"]

  cssFiles.forEach((file) => {
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = chrome.runtime.getURL(`src/${file}`)
    document.head.appendChild(link)
  })
}

