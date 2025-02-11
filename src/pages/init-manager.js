import { initialize } from "../utils/utils.js"
import { initializeManager } from "./manager.js"

async function init() {
  try {
    await initialize()
    await initializeManager()
  } catch (error) {
    console.error("Error al inicializar la aplicación:", error)
    const modal = document.getElementById("modal")
    const modalTitle = document.getElementById("modal-title")
    const modalMessage = document.getElementById("modal-message")
    modalTitle.textContent = "Error"
    modalMessage.textContent = "Error al inicializar la aplicación. Por favor, recarga la página."
    modal.style.display = "block"
  }
}

// Iniciar cuando el DOM esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}

