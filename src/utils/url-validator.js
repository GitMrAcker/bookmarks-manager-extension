// URL validation utility
const urlValidator = {
  isValid: (urlString) => {
    try {
      const url = new URL(urlString)
      return true
    } catch (error) {
      return false
    }
  },
  isExternal: (urlString, baseUrl) => {
    try {
      const url = new URL(urlString)
      const baseUrlObj = new URL(baseUrl)
      return url.origin !== baseUrlObj.origin
    } catch (error) {
      return false // Handle invalid URLs gracefully
    }
  },
}

// Hacer disponible globalmente
window.urlValidator = urlValidator

