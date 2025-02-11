// Browser API handling
let browserInstance

// Función para obtener la API del navegador
function getBrowserAPI() {
  // Check if chrome is defined before accessing its properties.  This addresses the undeclared variable issue.
  if (
    typeof chrome !== "undefined" &&
    typeof chrome.bookmarks !== "undefined" &&
    typeof chrome.runtime !== "undefined" &&
    typeof chrome.tabs !== "undefined" &&
    typeof chrome.action !== "undefined"
  ) {
    // Chrome's browser API
    return {
      bookmarks: chrome.bookmarks,
      runtime: chrome.runtime,
      tabs: chrome.tabs,
      action: chrome.action,
    }
  } else if (typeof browser !== "undefined") {
    // Firefox's browser API
    return browser
  }

  // Fallback para desarrollo
  return {
    bookmarks: {
      getTree: () => Promise.resolve([]),
      get: () => Promise.resolve([]),
      remove: () => Promise.resolve(),
      move: () => Promise.resolve(),
      removeTree: () => Promise.resolve(),
    },
    runtime: {
      getURL: (path) => path,
      onMessage: {
        addListener: () => {},
      },
      onInstalled: {
        addListener: () => {},
      },
    },
    tabs: {
      create: () => Promise.resolve({}),
      query: () => Promise.resolve([]),
    },
    action: {
      onClicked: {
        addListener: () => {},
      },
    },
  }
}

// Inicializar la instancia del navegador
browserInstance = getBrowserAPI()

// Exportar el objeto browser
export const browser = browserInstance

// Configuración
export const CONFIG = {
  DEBUG: true,
  TIPOS_MENSAJE: {
    ANALIZAR: "ANALIZAR_MARCADORES",
    RESULTADO: "RESULTADO_ANALISIS",
    ERROR: "ERROR_ANALISIS",
    STATUS: "STATUS",
    OBTENER_MARCADORES: "OBTENER_MARCADORES",
    GET_BOOKMARKS: "GET_BOOKMARKS",
  },
  ERRORES: {
    ANALISIS: "Error durante el análisis de marcadores",
    TIMEOUT: "La operación excedió el tiempo máximo de espera",
    RED: "Error de conexión",
    PERMISOS: "La extensión no tiene los permisos necesarios",
  },
}

// Funciones de logging
export const logger = {
  log: (...args) => {
    if (CONFIG.DEBUG) console.log("[BookmarkManager]", ...args)
  },
  error: (...args) => {
    if (CONFIG.DEBUG) console.error("[BookmarkManager]", ...args)
  },
  warn: (...args) => {
    if (CONFIG.DEBUG) console.warn("[BookmarkManager]", ...args)
  },
}

// Funciones de UI
export const UI = {
  showModal: (title, message, onConfirm, onCancel) => {
    const modal = document.getElementById("modal")
    const modalTitle = document.getElementById("modal-title")
    const modalMessage = document.getElementById("modal-message")
    const confirmBtn = document.getElementById("modal-confirm")
    const cancelBtn = document.getElementById("modal-cancel")

    modalTitle.textContent = title
    modalMessage.textContent = message
    modal.style.display = "block"

    confirmBtn.onclick = () => {
      modal.style.display = "none"
      if (onConfirm) onConfirm()
    }

    cancelBtn.onclick = () => {
      modal.style.display = "none"
      if (onCancel) onCancel()
    }

    document.querySelector(".close").onclick = () => {
      modal.style.display = "none"
      if (onCancel) onCancel()
    }
  },

  showLoader: (message = "Procesando...") => {
    const loader = document.getElementById("loader")
    const loaderMessage = document.getElementById("loader-message")
    loaderMessage.textContent = message
    loader.style.display = "flex"
  },

  hideLoader: () => {
    const loader = document.getElementById("loader")
    loader.style.display = "none"
  },

  setupErrorHandling: () => {
    window.addEventListener("error", (event) => {
      logger.error("Error global:", event.error)
      UI.showModal("Error", "Ha ocurrido un error inesperado. Por favor, recarga la página.")
    })
  },

  setupUnsavedChangesWarning: () => {
    window.addEventListener("beforeunload", (event) => {
      if (window.hasUnsavedChanges) {
        event.preventDefault()
        event.returnValue = "¿Seguro que quieres salir? Hay cambios sin guardar."
      }
    })
  },
}

// Funciones de inicialización
export const initialize = async () => {
  try {
    UI.setupErrorHandling()
    UI.setupUnsavedChangesWarning()

    // Exponer funciones necesarias globalmente
    Object.assign(window, {
      showModal: UI.showModal,
      showLoader: UI.showLoader,
      hideLoader: UI.hideLoader,
    })

    logger.log("Utilidades inicializadas correctamente")
    return true
  } catch (error) {
    logger.error("Error al inicializar utilidades:", error)
    return false
  }
}

// Exportación por defecto del objeto browser para compatibilidad
export default browser

