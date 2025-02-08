/**
 * Lógica del popup de la extensión
 */

import Logger from "../utils/logger.js"
import { CONFIG, ERRORES } from "../config/constants.js"
import chrome from "chrome" // Added import for chrome

const logger = new Logger("Popup")

document.addEventListener("DOMContentLoaded", async () => {
  const elementos = {
    btnAnalizar: document.getElementById("btnAnalizar"),
    resultados: document.getElementById("resultados"),
    cargando: document.getElementById("cargando"),
    error: document.getElementById("error"),
  }

  const estado = {
    analizando: false,
  }

  elementos.btnAnalizar.addEventListener("click", async () => {
    try {
      if (estado.analizando) return

      estado.analizando = true
      elementos.cargando.classList.remove("oculto")
      elementos.resultados.classList.add("oculto")
      elementos.error.classList.add("oculto")

      const respuesta = await chrome.runtime.sendMessage({
        tipo: CONFIG.TIPOS_MENSAJE.ANALIZAR,
      })

      if (!respuesta.exito) {
        throw new Error(respuesta.error)
      }

      mostrarResultados(respuesta.datos, elementos)
    } catch (error) {
      logger.error("Error durante el análisis", error)
      mostrarError(ERRORES.ANALISIS, elementos)
    } finally {
      estado.analizando = false
      elementos.cargando.classList.add("oculto")
    }
  })
})

function mostrarResultados(resultados, elementos) {
  elementos.resultados.innerHTML = `
        <div class="resultados-container">
            <h3>Resultados del Análisis</h3>
            <div class="estadisticas">
                <div class="stat">
                    <span class="numero">${resultados.total}</span>
                    <span class="etiqueta">Total Marcadores</span>
                </div>
                <div class="stat">
                    <span class="numero">${resultados.rotos}</span>
                    <span class="etiqueta">Enlaces Rotos</span>
                </div>
                <div class="stat">
                    <span class="numero">${resultados.duplicados}</span>
                    <span class="etiqueta">Duplicados</span>
                </div>
            </div>
        </div>
    `
  elementos.resultados.classList.remove("oculto")
}

function mostrarError(mensaje, elementos) {
  elementos.error.querySelector(".mensaje-error").textContent = mensaje
  elementos.error.classList.remove("oculto")
}

