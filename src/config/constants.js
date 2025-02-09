// Configuración y constantes para la extensión
const CONFIG = {
  // Tiempo máximo de espera para peticiones (en ms)
  TIMEOUT: 5000,

  // Número máximo de reintentos
  MAX_RETRIES: 3,

  // Estados de análisis
  ESTADOS: {
    PENDIENTE: "pendiente",
    EN_PROGRESO: "en_progreso",
    COMPLETADO: "completado",
    ERROR: "error",
  },

  // Tipos de mensajes para la comunicación entre componentes
  TIPOS_MENSAJE: {
    ANALIZAR: "ANALIZAR_MARCADORES",
    RESULTADO: "RESULTADO_ANALISIS",
    ERROR: "ERROR_ANALISIS",
  },

  // Configuración de almacenamiento
  STORAGE: {
    RESULTADOS: "resultados_analisis",
    CONFIGURACION: "configuracion_usuario",
  },
}

const ERRORES = {
  TIMEOUT: "La operación excedió el tiempo máximo de espera",
  RED: "Error de conexión. Por favor, verifica tu conexión a internet",
  PERMISOS: "La extensión no tiene los permisos necesarios",
  ANALISIS: "Error durante el análisis de marcadores",
}

// Hacer disponible globalmente
window.CONFIG = CONFIG
window.ERRORES = ERRORES

