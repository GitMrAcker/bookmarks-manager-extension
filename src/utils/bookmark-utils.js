import { browser, logger } from "./utils.js"

// Link Checker functionality
export class LinkChecker {
  constructor() {
    this.corsBlockedDomains = new Set()
  }

  async checkUrl(url) {
    try {
      const urlObj = new URL(url)

      if (this.corsBlockedDomains.has(urlObj.hostname)) {
        return {
          isAccessible: true,
          status: "No verificado (CORS)",
          error: null,
        }
      }

      const response = await fetch(url, {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-cache",
        credentials: "omit",
        redirect: "follow",
      })

      return {
        isAccessible: true,
        status: "Accesible",
        error: null,
      }
    } catch (error) {
      if (error.message.includes("CORS")) {
        const urlObj = new URL(url)
        this.corsBlockedDomains.add(urlObj.hostname)
        return {
          isAccessible: true,
          status: "No verificado (CORS)",
          error: null,
        }
      }

      return {
        isAccessible: false,
        status: "Error",
        error: error.message,
      }
    }
  }

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
  }
}

// Bookmark Manager functionality
export class BookmarkManager {
  constructor() {
    this.DEBUG = true
    this.logger = logger
    this.estado = {
      bookmarkOriginal: [],
      bookmarkProgress: [],
      duplicados: [],
      totalMarcadores: 0,
      marcadoresUnicos: 0,
      marcadoresDuplicados: 0,
      enlacesRotosEliminados: 0,
    }
    this.initialized = false

    if (!browser.bookmarks) {
      throw new Error("Browser bookmarks API no disponible")
    }

    this.actualizarEstadisticas = this.actualizarEstadisticas.bind(this)
    this.emitirCambioEstado = this.emitirCambioEstado.bind(this)
  }

  async getBookmarks() {
    try {
      const bookmarkTreeNodes = await browser.bookmarks.getTree()
      const newBookmarks = this.procesarMarcadores(bookmarkTreeNodes)
      const hasChanges =
        !this.initialized || JSON.stringify(newBookmarks) !== JSON.stringify(this.estado.bookmarkOriginal)

      if (hasChanges) {
        this.estado.bookmarkOriginal = newBookmarks
        this.estado.bookmarkProgress = [...newBookmarks]
        await this.actualizarEstadisticas()
      }

      this.initialized = true
      return this.estado.bookmarkOriginal
    } catch (error) {
      throw new Error("Error al acceder a la API de bookmarks: " + error.message)
    }
  }

  procesarMarcadores(nodos, rutaActual = "") {
    const marcadores = []

    const recorrer = (nodo, ruta) => {
      if (nodo.url) {
        marcadores.push({
          id: nodo.id,
          title: nodo.title,
          url: nodo.url,
          ruta: ruta,
          index: marcadores.length,
          estado: "pendiente",
        })
      }

      if (nodo.children) {
        nodo.children.forEach((hijo) => {
          const nuevaRuta = ruta ? `${ruta} / ${nodo.title}` : nodo.title
          recorrer(hijo, nuevaRuta)
        })
      }
    }

    nodos.forEach((nodo) => recorrer(nodo, rutaActual))
    return marcadores
  }

  async actualizarEstadisticas() {
    const urlMap = new Map()

    // Agrupar por URL normalizada
    this.estado.bookmarkProgress.forEach((bookmark) => {
      const normalizedUrl = this.normalizeUrl(bookmark.url)
      if (!urlMap.has(normalizedUrl)) {
        urlMap.set(normalizedUrl, [])
      }
      urlMap.get(normalizedUrl).push(bookmark)
    })

    // Calcular duplicados
    let totalDuplicados = 0
    urlMap.forEach((bookmarks) => {
      if (bookmarks.length > 1) {
        totalDuplicados += bookmarks.length - 1
      }
    })

    // Actualizar estado
    this.estado.totalMarcadores = this.estado.bookmarkProgress.length
    this.estado.marcadoresDuplicados = totalDuplicados
    this.estado.marcadoresUnicos = this.estado.totalMarcadores - totalDuplicados

    // Forzar actualización inmediata
    this.emitirCambioEstado()

    // Esperar a que el DOM se actualice
    await new Promise((resolve) => setTimeout(resolve, 0))

    return this.estado
  }

  emitirCambioEstado() {
    const evento = new CustomEvent("bookmarkStatsUpdated", {
      detail: {
        total: this.estado.totalMarcadores,
        unicos: this.estado.marcadoresUnicos,
        duplicados: this.estado.marcadoresDuplicados,
        rotosEliminados: this.estado.enlacesRotosEliminados,
      },
    })

    document.dispatchEvent(evento)
  }

  hayDuplicados() {
    return this.estado.marcadoresDuplicados > 0
  }

  async verificarEnlace(url) {
    try {
      const response = await fetch(url, { method: "HEAD" })
      return response.ok
    } catch (error) {
      return false
    }
  }

  normalizeUrl(url) {
    try {
      const urlObj = new URL(url)
      // Normalizar la URL: convertir a minúsculas y eliminar barra final
      let normalizedUrl = urlObj.toString().toLowerCase()
      // Eliminar barra final si existe
      if (normalizedUrl.endsWith("/")) {
        normalizedUrl = normalizedUrl.slice(0, -1)
      }
      return normalizedUrl
    } catch (error) {
      console.error("Error al normalizar URL:", error)
      return url.toLowerCase()
    }
  }

  getDuplicados() {
    const urlMap = new Map()

    // Agrupar marcadores por URL normalizada
    this.estado.bookmarkProgress.forEach((bookmark) => {
      const normalizedUrl = this.normalizeUrl(bookmark.url)
      if (!urlMap.has(normalizedUrl)) {
        urlMap.set(normalizedUrl, [])
      }
      urlMap.get(normalizedUrl).push(bookmark)
    })

    // Convertir el Map a un array de marcadores individuales con información de grupo
    const duplicatesArray = []
    urlMap.forEach((bookmarks, normalizedUrl) => {
      if (bookmarks.length > 1) {
        // Solo procesar grupos con duplicados
        bookmarks.forEach((bookmark, index) => {
          duplicatesArray.push({
            ...bookmark,
            groupUrl: normalizedUrl,
            groupSize: bookmarks.length,
            isFirstInGroup: index === 0,
          })
        })
      }
    })

    // Ordenar por URL normalizada para mantener los grupos juntos
    return duplicatesArray.sort((a, b) => a.groupUrl.localeCompare(b.groupUrl))
  }

  async getFolders() {
    try {
      const bookmarkTreeNodes = await browser.bookmarks.getTree()
      const folders = []

      const processFolders = (nodes, path = "") => {
        nodes.forEach((node) => {
          if (node.children) {
            const currentPath = path ? `${path} / ${node.title}` : node.title
            folders.push({
              id: node.id,
              title: node.title,
              path: currentPath,
              items: node.children.length,
            })
            processFolders(node.children, currentPath)
          }
        })
      }

      processFolders(bookmarkTreeNodes)
      return folders
    } catch (error) {
      throw new Error("Error al acceder a la API de bookmarks: " + error.message)
    }
  }
}

