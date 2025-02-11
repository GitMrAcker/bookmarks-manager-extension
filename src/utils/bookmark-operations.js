import { browser } from "./utils.js"

export class BookmarkOperations {
  constructor() {
    this.changes = []
    this.pendingChanges = false
  }

  addChange(type, data) {
    this.changes.push({ type, data })
    this.pendingChanges = true
  }

  async bookmarkExists(id) {
    try {
      const result = await browser.bookmarks.get(id)
      return result && result.length > 0
    } catch (error) {
      return false
    }
  }

  async removeBookmark(id) {
    try {
      await browser.bookmarks.remove(id)
    } catch (error) {
      if (error.message.includes("Can't find bookmark")) {
        // Si el marcador ya no existe, considerarlo como éxito
        return
      }
      throw error
    }
  }

  async moveBookmark(id, parentId, index) {
    await browser.bookmarks.move(id, { parentId, index })
  }

  async removeFolder(id) {
    await browser.bookmarks.removeTree(id)
  }

  async removeDuplicates() {
    const checkboxes = document.querySelectorAll('#duplicates-table input[type="checkbox"]')
    const keepIds = new Set()
    const removeIds = new Set()
    const groups = new Map()

    // Primero, agrupar por URL y determinar qué marcadores mantener
    checkboxes.forEach((checkbox) => {
      const id = checkbox.dataset.id
      const group = checkbox.dataset.group

      if (!groups.has(group)) {
        groups.set(group, { keep: null, remove: new Set() })
      }

      if (checkbox.checked) {
        if (groups.get(group).keep === null) {
          groups.get(group).keep = id
          keepIds.add(id)
        } else {
          groups.get(group).remove.add(id)
          removeIds.add(id)
        }
      } else {
        groups.get(group).remove.add(id)
        removeIds.add(id)
      }
    })

    // Verificar que al menos un marcador se mantenga por grupo
    groups.forEach((group, url) => {
      if (group.keep === null && group.remove.size > 0) {
        // Si ninguno está seleccionado, mantener el primero
        const firstId = group.remove.values().next().value
        group.remove.delete(firstId)
        group.keep = firstId
        keepIds.add(firstId)
        removeIds.delete(firstId)
      }
    })

    // Agregar operaciones de eliminación
    removeIds.forEach((id) => {
      this.addChange("remove", { id })
    })
  }

  async applyChanges() {
    if (!this.pendingChanges || this.changes.length === 0) {
      return { success: true, message: "No hay cambios pendientes" }
    }

    const errors = []
    const successfulChanges = []
    let anySuccess = false

    try {
      for (const change of this.changes) {
        try {
          const exists = await this.bookmarkExists(change.data.id)

          if (!exists && change.type === "remove") {
            successfulChanges.push(change)
            anySuccess = true
            continue
          }

          switch (change.type) {
            case "remove":
              await this.removeBookmark(change.data.id)
              successfulChanges.push(change)
              anySuccess = true
              break
            case "move":
              if (exists) {
                await this.moveBookmark(change.data.id, change.data.parentId, change.data.index)
                successfulChanges.push(change)
                anySuccess = true
              }
              break
            case "removeFolder":
              if (exists) {
                await this.removeFolder(change.data.id)
                successfulChanges.push(change)
                anySuccess = true
              }
              break
          }
        } catch (error) {
          if (change.type === "remove" && error.message.includes("Can't find bookmark")) {
            successfulChanges.push(change)
            anySuccess = true
          } else {
            errors.push(`Error en operación ${change.type}: ${error.message}`)
          }
        }
      }

      this.changes = this.changes.filter((change) => !successfulChanges.includes(change))
      this.pendingChanges = this.changes.length > 0

      if (anySuccess) {
        return {
          success: true,
          message:
            errors.length > 0
              ? `Cambios aplicados correctamente con algunas advertencias: ${errors.join("; ")}`
              : "Cambios aplicados correctamente",
        }
      }

      return {
        success: false,
        message: `No se pudieron aplicar los cambios: ${errors.join("; ")}`,
      }
    } catch (error) {
      console.error("Error al aplicar cambios:", error)
      return {
        success: false,
        message: `Error al aplicar cambios: ${error.message}`,
      }
    }
  }
}

