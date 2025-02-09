// Gestor de marcadores - Versión JavaScript Vanilla
;(() => {
  function BookmarkManager() {
    // Verificar si la instancia es creada con 'new'
    if (!(this instanceof BookmarkManager)) {
      throw new Error("BookmarkManager debe ser instanciado con new")
    }

    // Constructor con mejor manejo de errores
    this.logger = {
      error: (message) => {
        console.error("[BookmarkManager]", message)
      },
      info: (message) => {
        console.info("[BookmarkManager]", message)
      },
    }

    // Métodos mejorados
    this.validateUrl = async function (bookmark) {
      if (!bookmark || !bookmark.url) {
        throw new Error("URL inválida o no proporcionada")
      }

      try {
        const response = await fetch(bookmark.url, {
          method: "HEAD",
          mode: "no-cors",
          cache: "no-cache",
          credentials: "omit",
          redirect: "follow",
        })
        return { url: bookmark.url, isValid: true }
      } catch (error) {
        this.logger.error(`Error validating URL ${bookmark.url}: ${error}`)
        return { url: bookmark.url, isValid: false }
      }
    }

    this.getBookmarks = function () {
      return new Promise((resolve, reject) => {
        try {
          // Importar chrome aquí
          chrome.bookmarks.getTree((bookmarkTreeNodes) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message))
              return
            }
            resolve(this.flattenBookmarks(bookmarkTreeNodes))
          })
        } catch (error) {
          reject(error)
        }
      })
    }

    this.flattenBookmarks = function (bookmarkNodes) {
      if (!bookmarkNodes || !Array.isArray(bookmarkNodes)) {
        return []
      }

      let bookmarks = []
      for (const node of bookmarkNodes) {
        if (node.url) {
          bookmarks.push(node)
        }
        if (node.children) {
          bookmarks = bookmarks.concat(this.flattenBookmarks(node.children))
        }
      }
      return bookmarks
    }

    this.findDuplicates = (bookmarks) => {
      if (!bookmarks || !Array.isArray(bookmarks)) {
        return []
      }

      const urlMap = {}
      const duplicates = []

      bookmarks.forEach((bookmark) => {
        if (bookmark && bookmark.url) {
          if (urlMap[bookmark.url]) {
            duplicates.push(bookmark)
          } else {
            urlMap[bookmark.url] = bookmark
          }
        }
      })

      return duplicates
    }

    this.analyzeBookmarks = async function () {
      try {
        const bookmarks = await this.getBookmarks()
        if (!bookmarks || !Array.isArray(bookmarks)) {
          throw new Error("No se pudieron obtener los marcadores")
        }

        const duplicates = this.findDuplicates(bookmarks)
        return {
          total: bookmarks.length,
          duplicados: duplicates.length,
        }
      } catch (error) {
        this.logger.error("Error en analyzeBookmarks:", error)
        throw error
      }
    }
  }

  // Exponer BookmarkManager al objeto window
  window.BookmarkManager = BookmarkManager
})()

