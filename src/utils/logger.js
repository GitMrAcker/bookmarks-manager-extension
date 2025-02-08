/**
 * Utilidad para logging consistente
 */

const NIVELES = {
    INFO: "INFO",
    WARN: "WARN",
    ERROR: "ERROR",
    DEBUG: "DEBUG",
  }
  
  class Logger {
    constructor(contexto) {
      this.contexto = contexto
    }
  
    formatearMensaje(nivel, mensaje, datos = {}) {
      const timestamp = new Date().toISOString()
      return {
        timestamp,
        nivel,
        contexto: this.contexto,
        mensaje,
        datos,
      }
    }
  
    info(mensaje, datos) {
      const logFormateado = this.formatearMensaje(NIVELES.INFO, mensaje, datos)
      console.log(`[${logFormateado.timestamp}] [${logFormateado.nivel}] ${mensaje}`, datos || "")
    }
  
    error(mensaje, error, datos) {
      const logFormateado = this.formatearMensaje(NIVELES.ERROR, mensaje, { error, ...datos })
      console.error(`[${logFormateado.timestamp}] [${logFormateado.nivel}] ${mensaje}`, error, datos || "")
    }
  
    warn(mensaje, datos) {
      const logFormateado = this.formatearMensaje(NIVELES.WARN, mensaje, datos)
      console.warn(`[${logFormateado.timestamp}] [${logFormateado.nivel}] ${mensaje}`, datos || "")
    }
  
    debug(mensaje, datos) {
      if (process.env.NODE_ENV === "development") {
        const logFormateado = this.formatearMensaje(NIVELES.DEBUG, mensaje, datos)
        console.debug(`[${logFormateado.timestamp}] [${logFormateado.nivel}] ${mensaje}`, datos || "")
      }
    }
  }
  
  export default Logger
  
  