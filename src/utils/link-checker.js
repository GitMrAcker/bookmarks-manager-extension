export const linkChecker = {
    async checkLinks(urls) {
      const results = new Map()
      const batchSize = 5
  
      for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize)
        const checks = batch.map((url) => this.checkUrl(url))
        const batchResults = await Promise.all(checks)
  
        batch.forEach((url, index) => {
          results.set(url, batchResults[index])
        })
      }
  
      return results
    },
  
    async checkUrl(url) {
      try {
        const response = await fetch(url, { method: "HEAD" })
        return {
          isAccessible: response.ok,
          status: response.ok ? "Accesible" : "Inaccesible",
          error: null,
        }
      } catch (error) {
        return {
          isAccessible: false,
          status: "Error",
          error: error.message,
        }
      }
    },
  }
  
  