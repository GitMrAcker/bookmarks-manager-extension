import { browser, logger } from "../utils/utils.js"

// Manejar el clic en el ícono de la extensión
browser.action.onClicked.addListener(async (tab) => {
  try {
    const url = browser.runtime.getURL("src/pages/manager.html")
    await browser.tabs.create({ url })
    logger.log("Nueva pestaña creada con el gestor de marcadores")
  } catch (error) {
    logger.error("Error al abrir el gestor de marcadores:", error)
  }
})

// Event Listeners para mensajes
browser.runtime.onMessage.addListener((mensaje, sender, sendResponse) => {
  logger.log("Mensaje recibido:", mensaje)
  logger.log("Sender:", sender)

  // Manejar mensajes de manera asíncrona
  const handleMessage = async () => {
    try {
      switch (mensaje.tipo) {
        case "ANALIZAR_MARCADORES":
          logger.log("Iniciando análisis de marcadores...")
          const resultado = await analizarMarcadores()
          logger.log("Análisis completado exitosamente:", resultado)
          return { exito: true, datos: resultado }

        case "OBTENER_MARCADORES":
          logger.log("Obteniendo marcadores...")
          const bookmarkTreeNodes = await browser.bookmarks.getTree()
          return { exito: true, datos: bookmarkTreeNodes }

        case "STATUS":
          return { isActive: true }

        default:
          logger.error("Tipo de mensaje no reconocido:", mensaje.tipo)
          return { exito: false, error: "Tipo de mensaje no soportado" }
      }
    } catch (err) {
      logger.error("Error durante el procesamiento:", err)
      return { exito: false, error: err.message }
    }
  }

  // Manejar la respuesta de manera asíncrona
  handleMessage().then(sendResponse)
  return true
})

// Funciones principales
async function analizarMarcadores() {
  try {
    logger.log("Obteniendo árbol de marcadores...")
    const marcadores = await browser.bookmarks.getTree()
    logger.log("Árbol de marcadores obtenido:", marcadores)

    logger.log("Procesando marcadores...")
    const resultados = await procesarMarcadores(marcadores)
    logger.log("Procesamiento completado:", resultados)

    return resultados
  } catch (err) {
    logger.error("Error en analizarMarcadores:", err)
    throw new Error("Error durante el análisis de marcadores")
  }
}

async function procesarMarcadores(nodos) {
  let total = 0
  const duplicados = new Set()
  const urls = new Set()

  async function recorrer(nodo) {
    if (nodo.url) {
      total++
      logger.log("Procesando marcador:", { titulo: nodo.title, url: nodo.url })

      if (urls.has(nodo.url)) {
        logger.log("URL duplicada encontrada:", nodo.url)
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

  logger.log("Iniciando recorrido de nodos...")
  for (const nodo of nodos) {
    await recorrer(nodo)
  }
  logger.log("Recorrido completado")

  return {
    total,
    duplicados: duplicados.size,
    unicos: total - duplicados.size,
  }
}

// Log inicial para confirmar que el script se ha cargado
logger.log("Service Worker cargado correctamente")

