import { chrome } from "../utils/core.js"

// Service Worker para la extensión de gestión de marcadores

// Configuración de debug
const DEBUG = true

// Configuración inline para evitar importaciones
const CONFIG = {
  TIPOS_MENSAJE: {
    ANALIZAR: "ANALIZAR_MARCADORES",
    RESULTADO: "RESULTADO_ANALISIS",
    ERROR: "ERROR_ANALISIS",
    STATUS: "STATUS",
    OBTENER_MARCADORES: "OBTENER_MARCADORES",
    GET_BOOKMARKS: "GET_BOOKMARKS",
  },
}

const ERRORES = {
  ANALISIS: "Error durante el análisis de marcadores",
}

// Funciones de utilidad para logging
function log(...args) {
  if (DEBUG) {
    console.log("[Background]", ...args)
  }
}

function error(...args) {
  if (DEBUG) {
    console.error("[Background]", ...args)
  }
}

// Event Listeners
chrome.runtime.onMessage.addListener((mensaje, sender, sendResponse) => {
  log("Mensaje recibido:", mensaje)
  log("Sender:", sender)

  switch (mensaje.tipo) {
    case CONFIG.TIPOS_MENSAJE.ANALIZAR:
      log("Iniciando análisis de marcadores...")
      analizarMarcadores()
        .then((resultado) => {
          log("Análisis completado exitosamente:", resultado)
          sendResponse({ exito: true, datos: resultado })
        })
        .catch((err) => {
          error("Error durante el análisis:", err)
          sendResponse({ exito: false, error: err.message })
        })
      return true

    case CONFIG.TIPOS_MENSAJE.OBTENER_MARCADORES:
      log("Obteniendo marcadores...")
      chrome.bookmarks.getTree((bookmarkTreeNodes) => {
        sendResponse({ exito: true, datos: bookmarkTreeNodes })
      })
      return true

    case CONFIG.TIPOS_MENSAJE.STATUS:
      sendResponse({ isActive: true })
      return true

    default:
      error("Tipo de mensaje no reconocido:", mensaje.tipo)
      sendResponse({ exito: false, error: "Tipo de mensaje no soportado" })
      return false
  }
})

// Manejo de instalación
chrome.runtime.onInstalled.addListener(({ reason }) => {
  log("Extensión instalada/actualizada:", reason)
})

// Configuración para abrir la extensión en una nueva pestaña
chrome.action.onClicked.addListener((tab) => {
  const managerURL = chrome.runtime.getURL("src/pages/manager.html")
  chrome.tabs.create({
    url: managerURL,
  })
})

// Log inicial para confirmar que el script se ha cargado
log("Service Worker cargado correctamente")

// Funciones principales
async function analizarMarcadores() {
  try {
    log("Obteniendo árbol de marcadores...")
    const marcadores = await new Promise((resolve) => chrome.bookmarks.getTree(resolve))
    log("Árbol de marcadores obtenido:", marcadores)

    log("Procesando marcadores...")
    const resultados = await procesarMarcadores(marcadores)
    log("Procesamiento completado:", resultados)

    return resultados
  } catch (err) {
    error("Error en analizarMarcadores:", err)
    throw new Error(ERRORES.ANALISIS)
  }
}

async function procesarMarcadores(nodos) {
  let total = 0
  const duplicados = new Set()
  const urls = new Set()

  async function recorrer(nodo) {
    if (nodo.url) {
      total++
      log("Procesando marcador:", { titulo: nodo.title, url: nodo.url })

      // Verificar duplicados
      if (urls.has(nodo.url)) {
        log("URL duplicada encontrada:", nodo.url)
        duplicados.add(nodo.url)
      } else {
        urls.add(nodo.url)
      }
    }

    if (nodo.children) {
      for (const hijo of nodo.children) {
        await recorrer(hijo)
      }
    }
  }

  log("Iniciando recorrido de nodos...")
  for (const nodo of nodos) {
    await recorrer(nodo)
  }
  log("Recorrido completado")

  return {
    total,
    duplicados: duplicados.size,
    unicos: total - duplicados.size,
  }
}

