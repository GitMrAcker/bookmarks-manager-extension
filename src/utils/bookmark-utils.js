import { chrome, logger } from "./core.js"

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

    if (!chrome?.bookmarks) {
      throw new Error("Chrome bookmarks API no está disponible")
    }

    // Bind methods
    this.actualizarEstadisticas = this.actualizarEstadisticas.bind(this)
    this.emitirCambioEstado = this.emitirCambioEstado.bind(this)
  }

  async getBookmarks() {
    return new Promise((resolve, reject) => {
      try {
        chrome.bookmarks.getTree((bookmarkTreeNodes) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
            return
          }

          this.estado.bookmarkOriginal = this.procesarMarcadores(bookmarkTreeNodes)
          this.estado.bookmarkProgress = [...this.estado.bookmarkOriginal]
          this.actualizarEstadisticas()
          resolve(this.estado.bookmarkOriginal)
        })
      } catch (error) {
        reject(new Error("Error al acceder a la API de Chrome: " + error.message))
      }
    })
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

  actualizarEstadisticas() {
    const urls = new Set(this.estado.bookmarkProgress.map((m) => m.url))

    this.estado.totalMarcadores = this.estado.bookmarkOriginal.length
    this.estado.marcadoresUnicos = urls.size
    this.estado.marcadoresDuplicados = this.estado.bookmarkProgress.length - urls.size

    this.emitirCambioEstado()
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

  getDuplicados() {
    const urlMap = new Map()
    this.estado.bookmarkProgress.forEach((bookmark) => {
      if (!urlMap.has(bookmark.url)) {
        urlMap.set(bookmark.url, [])
      }
      urlMap.get(bookmark.url).push(bookmark)
    })

    return Array.from(urlMap.entries())
      .filter(([_, bookmarks]) => bookmarks.length > 1)
      .map(([url, bookmarks]) => ({
        url,
        count: bookmarks.length,
        marcadores: bookmarks,
      }))
  }

  async getFolders() {
    return new Promise((resolve, reject) => {
      try {
        chrome.bookmarks.getTree((bookmarkTreeNodes) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
            return
          }

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
          resolve(folders)
        })
      } catch (error) {
        reject(new Error("Error al acceder a la API de Chrome: " + error.message))
      }
    })
  }
}

