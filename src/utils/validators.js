/**
 * Utilidades de validación
 */

import Logger from "./logger.js"

const logger = new Logger("Validators")

const Validators = {
  /**
   * Valida una URL
   * @param {string} url - URL a validar
   * @returns {boolean} - true si la URL es válida
   */
  esUrlValida(url) {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },

  /**
   * Verifica si una URL está accesible
   * @param {string} url - URL a verificar
   * @returns {Promise<boolean>} - true si la URL está accesible
   */
  async urlEstaAccesible(url) {
    try {
      const response = await fetch(url, {
        method: "HEAD",
        mode: "no-cors",
      })
      return true
    } catch (error) {
      logger.warn(`URL no accesible: ${url}`, error)
      return false
    }
  },

  /**
   * Sanitiza una cadena de texto
   * @param {string} texto - Texto a sanitizar
   * @returns {string} - Texto sanitizado
   */
  sanitizarTexto(texto) {
    return texto
      .trim()
      .replace(/[<>]/g, "") // Elimina caracteres HTML
      .substring(0, 1000) // Limita la longitud
  },
}

export default Validators

