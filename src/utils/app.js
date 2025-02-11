import { chrome, logger } from "./core.js"
import { BookmarkManager } from "./bookmark-utils.js"

// Helper function to check Chrome API availability
function isChromeAPIAvailable() {
  const available =
    typeof chrome !== "undefined" && typeof chrome.bookmarks !== "undefined" && typeof chrome.runtime !== "undefined"

  logger.info(`Chrome API disponible: ${available}`)
  return available
}

// Helper function to wait for element
async function waitForElement(selector, timeout = 5000) {
  logger.info(`Esperando elemento: ${selector}`)
  const start = Date.now()

  while (Date.now() - start < timeout) {
    const element = document.querySelector(selector)
    if (element) {
      logger.info(`Elemento encontrado: ${selector}`)
      return element
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  throw new Error(`Elemento ${selector} no encontrado después de ${timeout}ms`)
}

// Helper function to show errors to user
function showError(message) {
  logger.error(`Error de inicialización: ${message}`)
  const errorDiv = document.createElement("div")
  errorDiv.className = "error-message"
  errorDiv.textContent = `Error de inicialización: ${message}`
  document.body.appendChild(errorDiv)
}

// Navigation handler
function setupNavigation() {
  const navButtons = document.querySelectorAll(".nav-button")
  const sections = document.querySelectorAll(".content-section")

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetSection = button.dataset.section

      // Update button states
      navButtons.forEach((btn) => btn.classList.remove("active"))
      button.classList.add("active")

      // Update section visibility
      sections.forEach((section) => {
        section.classList.remove("active")
        if (section.id === targetSection) {
          section.classList.add("active")
        }
      })
    })
  })
}

// Export the initialization function
export async function initializeApp() {
  try {
    logger.info("Iniciando aplicación...")

    // Ensure DOM is ready
    if (document.readyState === "loading") {
      logger.info("Esperando a que el DOM esté listo...")
      await new Promise((resolve) => document.addEventListener("DOMContentLoaded", resolve))
    }

    // Check Chrome API availability first
    if (!isChromeAPIAvailable()) {
      throw new Error("Las APIs necesarias de Chrome no están disponibles")
    }

    // Setup navigation
    setupNavigation()

    // Wait for critical elements
    logger.info("Esperando elementos críticos...")
    const elements = {
      total: await waitForElement("#total-marcadores"),
      unicos: await waitForElement("#total-marcadores-unicos"),
      duplicados: await waitForElement("#total-marcadores-duplicados"),
      rotos: await waitForElement("#total-enlaces-rotos-eliminados"),
    }
    logger.info("Elementos críticos encontrados")

    // Initialize BookmarkManager and load data
    logger.info("Inicializando BookmarkManager...")
    const bookmarkManager = new BookmarkManager()

    logger.info("Cargando marcadores...")
    const bookmarks = await bookmarkManager.getBookmarks()
    logger.info(`Marcadores cargados: ${bookmarks.length}`)

    // Update statistics
    const stats = {
      total: bookmarks.length,
      unicos: new Set(bookmarks.map((b) => b.url)).size,
      duplicados: bookmarks.length - new Set(bookmarks.map((b) => b.url)).size,
      rotosEliminados: 0,
    }

    logger.info("Actualizando estadísticas:", stats)

    // Update UI
    elements.total.textContent = stats.total
    elements.unicos.textContent = stats.unicos
    elements.duplicados.textContent = stats.duplicados
    elements.rotos.textContent = stats.rotosEliminados

    // Enable buttons if we have data
    if (stats.total > 0) {
      const checkLinksBtn = document.getElementById("check-links")
      if (checkLinksBtn) {
        checkLinksBtn.disabled = false
      }
    }

    logger.info("Aplicación inicializada correctamente")
    return true
  } catch (error) {
    logger.error("Error durante la inicialización:", error)
    showError(error.message)
    throw error
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  logger.info("DOM Content Loaded - Iniciando aplicación")
  initializeApp().catch((error) => {
    logger.error("Error en la inicialización:", error)
    showError(error.message)
  })
})

