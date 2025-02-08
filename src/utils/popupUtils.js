/**
 * Utilidades para el popup de la extensión
 */

import Logger from "./logger.js"
import { ERRORES } from "../config/constants.js"

const logger = new Logger("PopupUtils")

/**
 * Inicializa el popup de la extensión.
 * Esta función se encarga de configurar el estado inicial del popup,
 * incluyendo la ocultación de elementos y la configuración de eventos.
 * @returns {Promise<void>}
 */
export async function inicializarPopup() {
  // Ocultar elementos inicialmente
  document.getElementById("resultados").classList.add("oculto")
  document.getElementById("cargando").classList.add("oculto")
  document.getElementById("error").classList.add("oculto")

  // Manejar errores en la inicialización
  try {
    // Aquí se puede agregar lógica adicional para la inicialización
    // como la carga de datos desde el almacenamiento, etc.
  } catch (error) {
    logger.error("Error al inicializar el popup", error)
    mostrarError(ERRORES.ANALISIS)
  }
}

/**
 * Muestra un mensaje de error en el popup.
 * @param {string} mensaje - Mensaje de error a mostrar.
 */
export function mostrarError(mensaje) {
  const elementoError = document.getElementById("error")
  elementoError.querySelector(".mensaje-error").textContent = mensaje
  elementoError.classList.remove("oculto")
}

/**
 * Muestra el indicador de carga en el popup.
 */
export function mostrarCargando() {
  document.getElementById("cargando").classList.remove("oculto")
}

/**
 * Oculta el indicador de carga en el popup.
 */
export function ocultarCargando() {
  document.getElementById("cargando").classList.add("oculto")
}

