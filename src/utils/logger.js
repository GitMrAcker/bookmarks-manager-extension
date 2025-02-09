// Logger utility class
class Logger {
  constructor(level = "info") {
    this.level = level

    // Bind methods to ensure correct 'this' context
    this.log = this.log.bind(this)
    this.debug = this.debug.bind(this)
    this.info = this.info.bind(this)
    this.warn = this.warn.bind(this)
    this.error = this.error.bind(this)
  }

  log(message, level = "info") {
    if (this.level === "debug" || level === "debug") {
      console.debug(`[${level.toUpperCase()}] ${message}`)
    } else if (this.level === "info" || level === "info") {
      console.info(`[${level.toUpperCase()}] ${message}`)
    } else if (this.level === "warn" || level === "warn") {
      console.warn(`[${level.toUpperCase()}] ${message}`)
    } else if (this.level === "error" || level === "error") {
      console.error(`[${level.toUpperCase()}] ${message}`)
    }
  }

  debug(message) {
    this.log(message, "debug")
  }

  info(message) {
    this.log(message, "info")
  }

  warn(message) {
    this.log(message, "warn")
  }

  error(message) {
    this.log(message, "error")
  }
}

// Make Logger available globally
window.Logger = Logger

