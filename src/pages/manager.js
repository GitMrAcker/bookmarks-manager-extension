import { Table } from "../components/table.js"
import { BookmarkManager } from "../utils/bookmark-utils.js"
import { BookmarkOperations } from "../utils/bookmark-operations.js"
import { linkChecker } from "../utils/link-checker.js"

// Initialize components
let bookmarksTable
let duplicatesTable
const bookmarkManager = new BookmarkManager()
const bookmarkOps = new BookmarkOperations()

let isProcessingChanges = false

// Export initialization function
export async function initializeManager() {
  try {
    console.log("Iniciando inicialización del gestor...")

    // Verificar que los elementos necesarios existen
    const requiredElements = [
      "nav-bookmarks",
      "nav-duplicates",
      "nav-folders",
      "nav-broken-links",
      "check-links",
      "apply-changes",
      "bookmarks-section",
      "duplicates-section",
      "folders-section",
      "broken-links-section",
    ]

    const missingElements = requiredElements.filter((id) => !document.getElementById(id))
    if (missingElements.length > 0) {
      throw new Error(`Elementos no encontrados: ${missingElements.join(", ")}`)
    }

    // Set up event listeners
    setupEventListeners()

    // Initialize tables
    await initializeTables()

    // Enable buttons after initialization
    document.getElementById("check-links").disabled = false
    document.getElementById("apply-changes").disabled = false

    console.log("Gestor inicializado correctamente")
    return true
  } catch (error) {
    console.error("Error inicializando el gestor:", error)
    throw error
  }
}

function setupEventListeners() {
  // Stats update listener
  document.addEventListener("bookmarkStatsUpdated", (event) => {
    const { total, unicos, duplicados, rotosEliminados } = event.detail

    // Update stats cards
    document.getElementById("total-marcadores").textContent = total
    document.getElementById("total-marcadores-unicos").textContent = unicos
    document.getElementById("total-marcadores-duplicados").textContent = duplicados
    document.getElementById("total-enlaces-rotos-eliminados").textContent = rotosEliminados
  })

  // Navigation
  const navButtons = document.querySelectorAll(".nav-button")
  const sections = document.querySelectorAll(".content-section")

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active button
      navButtons.forEach((btn) => btn.classList.remove("active"))
      button.classList.add("active")

      // Update active section
      const targetId = button.getAttribute("data-section")
      sections.forEach((section) => {
        section.classList.toggle("active", section.id === targetId)
      })
    })
  })

  // Action buttons
  document.getElementById("apply-changes")?.addEventListener("click", handleApplyChanges)
  document.getElementById("check-links")?.addEventListener("click", handleCheckLinks)

  // Agregar event listeners para los botones de selección
  setupDuplicateButtons()
}

async function handleApplyChanges() {
  if (isProcessingChanges) return

  try {
    isProcessingChanges = true
    const duplicatesTab = document.getElementById("nav-duplicates")
    const duplicatesSection = document.getElementById("duplicates-section")
    const actionButtons = document.querySelectorAll("#duplicates-section .action-button")
    const applyButton = document.getElementById("apply-changes")

    // Deshabilitar botones durante la operación
    actionButtons.forEach((button) => (button.disabled = true))
    applyButton.disabled = true

    // Mostrar loader mientras se procesan los cambios
    window.showLoader("Aplicando cambios...")

    // Aplicar cambios
    await bookmarkOps.removeDuplicates()
    const result = await bookmarkOps.applyChanges()

    // Esperar un momento para asegurar que los cambios se han aplicado
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Forzar actualización de datos y esperar a que termine
    await bookmarkManager.getBookmarks()

    // Ocultar loader
    window.hideLoader()

    // Verificar si aún hay duplicados
    const duplicates = bookmarkManager.getDuplicados()
    const hasDuplicates = duplicates.length > 0

    // Actualizar UI
    if (!hasDuplicates) {
      // Primero ocultar el contenido actual
      duplicatesSection.style.opacity = "0"

      // Esperar a que termine la transición de opacidad
      await new Promise((resolve) => setTimeout(resolve, 300))

      duplicatesTab.classList.add("no-duplicates")
      // Asegurarse de que estamos en la pestaña de duplicados
      document.getElementById("nav-duplicates").click()

      duplicatesSection.innerHTML = `
        <h2>Duplicados</h2>
        <div class="section-message success">
          <p>¡No se encontraron marcadores duplicados!</p>
          <p>Todos tus marcadores son únicos.</p>
        </div>
      `

      // Mostrar el nuevo contenido con transición
      requestAnimationFrame(() => {
        duplicatesSection.style.opacity = "1"
      })
    } else {
      // Si aún hay duplicados, actualizar la tabla
      await updateDuplicatesSection()
    }

    // Re-habilitar el botón de aplicar cambios si hay más duplicados
    applyButton.disabled = !hasDuplicates
  } catch (error) {
    console.error("Error al aplicar cambios:", error)
    window.hideLoader()
    window.showModal("Error", `Error al aplicar cambios: ${error.message}`)
  } finally {
    isProcessingChanges = false
  }
}

async function handleCheckLinks() {
  try {
    const brokenLinksTable = document.getElementById("broken-links-table")
    if (!brokenLinksTable) {
      console.error("Tabla de enlaces rotos no encontrada")
      return
    }

    const checkLinksButton = document.getElementById("check-links")
    checkLinksButton.disabled = true
    checkLinksButton.textContent = "Verificando..."

    const bookmarks = await bookmarkManager.getBookmarks()
    const urls = bookmarks.map((bookmark) => bookmark.url)
    const brokenLinks = await linkChecker.checkLinks(urls)

    new Table(
      "broken-links-table",
      [
        { key: "url", label: "URL" },
        { key: "status", label: "Estado" },
      ],
      Array.from(brokenLinks.entries())
        .filter(([_, status]) => !status.isAccessible)
        .map(([url, status]) => ({ url, status: status.status })),
    )

    checkLinksButton.disabled = false
    checkLinksButton.textContent = "Verificar Enlaces"

    // Cambiar a la pestaña de Enlaces Rotos
    document.getElementById("nav-broken-links").click()
  } catch (error) {
    console.error("Error al verificar enlaces:", error)
    alert(`Error al verificar enlaces: ${error.message}`)
  }
}

async function updateDuplicatesSection() {
  const duplicatesTab = document.getElementById("nav-duplicates")
  const duplicatesSection = document.getElementById("duplicates-section")

  // Verificar que los elementos existan
  if (!duplicatesTab || !duplicatesSection) {
    console.error("Elementos necesarios no encontrados")
    return
  }

  // Obtener duplicados actualizados
  const duplicates = bookmarkManager.getDuplicados()
  const duplicatesCount = duplicates.length

  console.log("Actualizando sección de duplicados. Cantidad:", duplicatesCount)

  if (duplicatesCount === 0) {
    // Actualizar el estilo de la pestaña
    duplicatesTab.classList.add("no-duplicates")

    // Actualizar el contenido de la sección
    duplicatesSection.innerHTML = `
      <h2>Duplicados</h2>
      <div class="section-message success">
        <p>¡No se encontraron marcadores duplicados!</p>
        <p>Todos tus marcadores son únicos.</p>
      </div>
    `
  } else {
    // Si aún hay duplicados, actualizar la tabla
    duplicatesTab.classList.remove("no-duplicates")

    // Recrear la sección de duplicados
    duplicatesSection.innerHTML = `
      <h2>Duplicados</h2>
      <div class="section-description">
        Selecciona los marcadores duplicados que deseas mantener.
        Los marcadores no seleccionados serán eliminados al aplicar los cambios.
      </div>
      <div class="section-actions">
        <button id="select-all-duplicates" class="action-button">Seleccionar todos</button>
        <button id="deselect-all-duplicates" class="action-button">Deseleccionar todos</button>
      </div>
      <div id="duplicates-table" class="table-container"></div>
    `

    // Verificar que el contenedor de la tabla existe antes de crear la tabla
    const tableContainer = document.getElementById("duplicates-table")
    if (tableContainer) {
      // Recrear la tabla de duplicados
      duplicatesTable = new Table(
        "duplicates-table",
        [
          {
            key: "number",
            label: "#",
            render: (_, __, index) => index + 1,
            className: "column-number",
          },
          {
            key: "ruta",
            label: "Ubicación",
            className: "column-location",
          },
          {
            key: "title",
            label: "Título",
            className: "column-title",
          },
          {
            key: "url",
            label: "URL",
            render: (url) => `<a href="${url}" target="_blank">${url}</a>`,
            className: "column-url",
          },
          {
            key: "actions",
            label: "Mantener",
            render: (_, bookmark) => `
              <div class="duplicate-item">
                <input 
                  type="checkbox" 
                  id="duplicate-${bookmark.id}" 
                  data-id="${bookmark.id}" 
                  data-group="${bookmark.groupUrl}"
                  ${bookmark.isFirstInGroup ? "checked" : ""}
                >
              </div>
            `,
            className: "column-actions",
          },
        ],
        duplicates,
      )
    }

    // Re-habilitar los botones y reconectar event listeners
    setupDuplicateButtons()
  }
}

function setupDuplicateButtons() {
  const selectAllBtn = document.getElementById("select-all-duplicates")
  const deselectAllBtn = document.getElementById("deselect-all-duplicates")
  const duplicatesTable = document.getElementById("duplicates-table")

  if (!duplicatesTable) {
    console.warn("Tabla de duplicados no encontrada")
    return
  }

  selectAllBtn?.addEventListener("click", () => {
    const checkboxes = duplicatesTable.querySelectorAll('input[type="checkbox"]')
    const groups = new Map()

    checkboxes.forEach((checkbox) => {
      const groupUrl = checkbox.dataset.group
      if (!groups.has(groupUrl)) {
        groups.set(groupUrl, checkbox)
        checkbox.checked = true
      } else {
        checkbox.checked = false
      }
    })
  })

  deselectAllBtn?.addEventListener("click", () => {
    const checkboxes = duplicatesTable.querySelectorAll('input[type="checkbox"]')
    checkboxes.forEach((checkbox) => (checkbox.checked = false))
  })

  // Event listener para la selección de checkboxes
  duplicatesTable.addEventListener("change", (event) => {
    if (event.target.type === "checkbox") {
      const checkbox = event.target
      const groupUrl = checkbox.dataset.group

      if (checkbox.checked) {
        // Desmarcar otros checkboxes del mismo grupo
        const groupCheckboxes = duplicatesTable.querySelectorAll(`input[type="checkbox"][data-group="${groupUrl}"]`)
        groupCheckboxes.forEach((groupCheckbox) => {
          if (groupCheckbox !== checkbox) {
            groupCheckbox.checked = false
          }
        })
      }
    }
  })
}

async function initializeTables() {
  try {
    console.log("Inicializando tablas...")

    // Get bookmarks
    const bookmarks = await bookmarkManager.getBookmarks()
    console.log("Marcadores obtenidos:", bookmarks.length)

    // Initialize bookmarks table
    bookmarksTable = new Table(
      "bookmarks-table",
      [
        {
          key: "number",
          label: "#",
          render: (_, __, index) => index + 1,
          className: "column-number",
        },
        {
          key: "id",
          label: "ID",
          className: "column-id",
        },
        {
          key: "ruta",
          label: "Ubicación",
          className: "column-location",
        },
        {
          key: "title",
          label: "Título",
          className: "column-title",
        },
        {
          key: "url",
          label: "URL",
          render: (url) => `<a href="${url}" target="_blank">${url}</a>`,
          className: "column-url",
        },
      ],
      bookmarks,
    )

    // Inicializar tabla de duplicados
    const duplicates = bookmarkManager.getDuplicados()
    console.log("Duplicados encontrados:", duplicates.length)

    // Llamar a la función para actualizar la sección de duplicados
    await updateDuplicatesSection()

    // Initialize folders table
    const folders = await bookmarkManager.getFolders()
    new Table(
      "folders-table",
      [
        {
          key: "number",
          label: "#",
          render: (_, __, index) => index + 1,
          className: "column-number",
        },
        {
          key: "id",
          label: "ID",
          className: "column-id",
        },
        {
          key: "path",
          label: "Ubicación",
          className: "column-location",
        },
        {
          key: "title",
          label: "Título",
          className: "column-title",
        },
        {
          key: "items",
          label: "Elementos",
          className: "column-url",
        },
      ],
      folders,
    )

    console.log("Tablas inicializadas correctamente")
  } catch (error) {
    console.error("Error initializing tables:", error)
    throw error
  }
}

// Initialize when module is loaded
initializeManager().catch((error) => {
  console.error("Error en la inicialización:", error)
})

async function forceUIRefresh() {
  const duplicatesTab = document.getElementById("nav-duplicates")
  const duplicatesSection = document.getElementById("duplicates-section")

  // Forzar un reflow del DOM
  duplicatesSection.style.display = "none"
  duplicatesSection.offsetHeight // Force reflow
  duplicatesSection.style.display = ""

  // Actualizar las clases
  duplicatesTab.classList.remove("no-duplicates")
  duplicatesTab.classList.add("no-duplicates")
}

