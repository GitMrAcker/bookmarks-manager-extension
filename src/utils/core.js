// Chrome API wrapper
const getChromeAPI = () => {
  let globalChrome

  try {
    globalChrome = self.chrome || window.chrome
  } catch {
    globalChrome = {}
  }

  // Create a mock chrome object for non-browser environments
  const mockChrome = {
    bookmarks: {
      getTree: (callback) => callback([]),
    },
    runtime: {
      onMessage: {
        addListener: () => {},
      },
      lastError: null,
      getURL: (path) => path,
    },
    tabs: {
      create: (options) => {
        console.log("Tab creation mocked:", options)
      },
    },
  }

  return { ...mockChrome, ...globalChrome }
}

// Export the chrome API
export const chrome = getChromeAPI()

// Logger functionality
class Logger {
  constructor(level = "info") {
    this.level = level
  }

  log(message, level = "info") {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`

    switch (level) {
      case "debug":
        if (this.level === "debug") {
          console.debug(prefix, message)
        }
        break
      case "info":
        if (this.level === "debug" || this.level === "info") {
          console.info(prefix, message)
        }
        break
      case "warn":
        console.warn(prefix, message)
        break
      case "error":
        console.error(prefix, message)
        break
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

export const logger = new Logger()

// Storage functionality
export const storage = {
  getItem: (key) => {
    try {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      logger.error("Error getting item from storage:", error)
      return null
    }
  },

  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      logger.error("Error setting item in storage:", error)
      return false
    }
  },

  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      logger.error("Error removing item from storage:", error)
      return false
    }
  },

  clear: () => {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      logger.error("Error clearing storage:", error)
      return false
    }
  },
}

