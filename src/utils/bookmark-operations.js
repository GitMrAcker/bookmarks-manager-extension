// Remove chrome import - it's globally available in extension context
export class BookmarkOperations {
  constructor() {
    // The chrome variable is globally available in the extension context. No need for import or declaration.
    if (!chrome?.bookmarks) {
      throw new Error("Chrome bookmarks API no disponible")
    }
    this.changes = []
    this.pendingChanges = false
  }

  // Registra un cambio pendiente
  addChange(type, data) {
    this.changes.push({ type, data, timestamp: Date.now() })
    this.pendingChanges = true
  }

  // Limpia los cambios pendientes
  clearChanges() {
    this.changes = []
    this.pendingChanges = false
  }

  // Elimina marcadores duplicados
  async removeDuplicates(duplicates) {
    for (const { url, marcadores } of duplicates) {
      // Mantener el primer marcador y registrar los demás para eliminar
      const [keep, ...remove] = marcadores
      for (const bookmark of remove) {
        this.addChange("remove", { id: bookmark.id, url: bookmark.url })
      }
    }
  }

  // Unifica carpetas y sus marcadores
  async unifyFolders(sourceId, targetId) {
    try {
      const sourceFolder = await this.getFolder(sourceId)
      const targetFolder = await this.getFolder(targetId)

      // Registrar movimiento de marcadores
      for (const bookmark of sourceFolder.children || []) {
        this.addChange("move", {
          id: bookmark.id,
          parentId: targetId,
          index: (targetFolder.children || []).length,
        })
      }

      // Registrar eliminación de carpeta fuente
      this.addChange("removeFolder", { id: sourceId })
    } catch (error) {
      console.error("Error al unificar carpetas:", error)
      throw error
    }
  }

  // Obtiene una carpeta y sus contenidos
  async getFolder(folderId) {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.getSubTree(folderId, (results) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve(results[0])
        }
      })
    })
  }

  // Aplica los cambios pendientes
  async applyChanges() {
    if (!this.pendingChanges) {
      return { success: true, message: "No hay cambios pendientes" }
    }

    try {
      for (const change of this.changes) {
        switch (change.type) {
          case "remove":
            await this.removeBookmark(change.data.id)
            break
          case "move":
            await this.moveBookmark(change.data.id, change.data.parentId, change.data.index)
            break
          case "removeFolder":
            await this.removeFolder(change.data.id)
            break
        }
      }

      this.clearChanges()
      return { success: true, message: "Cambios aplicados correctamente" }
    } catch (error) {
      console.error("Error al aplicar cambios:", error)
      return { success: false, message: error.message }
    }
  }

  // Métodos auxiliares para operaciones individuales
  async removeBookmark(id) {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.remove(id, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve()
        }
      })
    })
  }

  async moveBookmark(id, parentId, index) {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.move(id, { parentId, index }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve()
        }
      })
    })
  }

  async removeFolder(id) {
    return new Promise((resolve, reject) => {
      chrome.bookmarks.removeTree(id, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError)
        } else {
          resolve()
        }
      })
    })
  }
}

