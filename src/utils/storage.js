/**
 * Utilidad para manejar el almacenamiento de la extensión
 */

import Logger from "./logger.js"
import chrome from "chrome" // Added import for chrome

const logger = new Logger("Storage")

class Storage {
  /**
   * Guarda datos en el almacenamiento de Chrome
   * @param {string} key - Clave para almacenar
   * @param {any} value - Valor a almacenar
   * @returns {Promise<void>}
   */
  static async guardar(key, value) {
    try {
      await chrome.storage.local.set({ [key]: value })
      logger.info(`Datos guardados correctamente: ${key}`)
    } catch (error) {
      logger.error(`Error al guardar datos: ${key}`, error)
      throw error
    }
  }

  /**
   * Obtiene datos del almacenamiento
   * @param {string} key - Clave a recuperar
   * @returns {Promise<any>}
   */
  static async obtener(key) {
    try {
      const result = await chrome.storage.local.get(key)
      return result[key]
    } catch (error) {
      logger.error(`Error al obtener datos: ${key}`, error)
      throw error
    }
  }

  /**
   * Elimina datos del almacenamiento
   * @param {string} key - Clave a eliminar
   * @returns {Promise<void>}
   */
  static async eliminar(key) {
    try {
      await chrome.storage.local.remove(key)
      logger.info(`Datos eliminados correctamente: ${key}`)
    } catch (error) {
      logger.error(`Error al eliminar datos: ${key}`, error)
      throw error
    }
  }

  /**
   * Limpia todo el almacenamiento
   * @returns {Promise<void>}
   */
  static async limpiar() {
    try {
      await chrome.storage.local.clear()
      logger.info("Almacenamiento limpiado correctamente")
    } catch (error) {
      logger.error("Error al limpiar el almacenamiento", error)
      throw error
    }
  }
}

export default Storage

