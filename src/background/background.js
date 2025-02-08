/**
 * Service Worker de la extensión
 */

import Logger from "../utils/logger.js"
import Validators from "../utils/validators.js"
import { CONFIG, ERRORES } from "../config/constants.js"
import * as chrome from "chrome" // Import chrome

const logger = new Logger("Background")

// Manejo de instalación/actualización
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") {
    logger.info("Extensión instalada")
    await inicializarExtension()
  }
})

// Manejador de mensajes
chrome.runtime.onMessage.addListener((mensaje, sender, sendResponse) => {
  const responder = async () => {
    try {
      switch (mensaje.tipo) {
        case CONFIG.TIPOS_MENSAJE.ANALIZAR:
          const resultado = await analizarMarcadores()
          sendResponse({ exito: true, datos: resultado })
          break
        default:
          logger.warn(`Tipo de mensaje no manejado: ${mensaje.tipo}`)
          sendResponse({ exito: false, error: "Tipo de mensaje no soportado" })
      }
    } catch (error) {
      logger.error("Error procesando mensaje", error)
      sendResponse({ exito: false, error: error.message })
    }
  }

  responder()
  return true
})

async function analizarMarcadores() {
  try {
    logger.info("Iniciando análisis de marcadores")
    const marcadores = await chrome.bookmarks.getTree()
    const resultados = await procesarMarcadores(marcadores)
    return resultados
  } catch (error) {
    logger.error("Error en análisis de marcadores", error)
    throw new Error(ERRORES.ANALISIS)
  }
}

async function procesarMarcadores(nodos) {
  let total = 0
  let rotos = 0
  const duplicados = new Set()

  async function recorrer(nodo) {
    if (nodo.url) {
      total++
      if (!Validators.esUrlValida(nodo.url)) {
        rotos++
      } else if (!(await Validators.urlEstaAccesible(nodo.url))) {
        rotos++
      }
      if (duplicados.has(nodo.url)) {
        duplicados.add(nodo.url)
      } else {
        duplicados.add(nodo.url)
      }
    }
    if (nodo.children) {
      for (const hijo of nodo.children) {
        await recorrer(hijo)
      }
    }
  }

  for (const nodo of nodos) {
    await recorrer(nodo)
  }

  return {
    total,
    rotos,
    duplicados: duplicados.size,
  }
}

