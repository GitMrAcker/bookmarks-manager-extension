import { initialize, logger } from "../utils/utils.js"
import { Table } from "../components/table.js"
import { BookmarkManager } from "../utils/bookmark-utils.js" // Actualizada la importación

async function initializeApp() {
  try {
    // Inicializar utilidades
    await initialize()

    // Inicializar el gestor de marcadores
    const bookmarkManager = new BookmarkManager()
    await bookmarkManager.getBookmarks() // Llamada directa al método

    // Inicializar tablas
    new Table("bookmarks-table", {
      /* configuración de la tabla */
    })

    logger.log("Aplicación inicializada correctamente")
  } catch (error) {
    logger.error("Error durante la inicialización:", error)
    window.showModal("Error", "Error durante la inicialización de la aplicación.")
  }
}

// Iniciar cuando el DOM esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp)
} else {
  initializeApp()
}

