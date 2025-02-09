// Storage management utility
const storage = {
  getItem: (key) => {
    try {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error("Error getting item from storage:", error)
      return null
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error("Error setting item in storage:", error)
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error("Error removing item from storage:", error)
    }
  },
  clear: () => {
    try {
      localStorage.clear()
    } catch (error) {
      console.error("Error clearing storage:", error)
    }
  },
}

// Hacer disponible globalmente
window.storage = storage

