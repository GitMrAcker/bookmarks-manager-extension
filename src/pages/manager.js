import { Table } from "../components/table.js"
import { LinkChecker, BookmarkManager } from "../utils/bookmark-utils.js"
import { BookmarkOperations } from "../utils/bookmark-operations.js"

// Initialize components
let bookmarksTable
let duplicatesTable
const linkChecker = new LinkChecker()
const bookmarkManager = new BookmarkManager()
const bookmarkOps = new BookmarkOperations()

// Export initialization function
export async function initializeManager() {
  try {
    console.log("Iniciando inicialización del gestor...")

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
  document.getElementById("apply-changes")?.addEventListener("click", async () => {
    try {
      const result = await bookmarkOps.applyChanges()
      if (result.success) {
        alert("Cambios aplicados correctamente")
        await initializeTables()
      } else {
        alert(`Error al aplicar cambios: ${result.message}`)
      }
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  })

  document.getElementById("check-links")?.addEventListener("click", async () => {
    try {
      const brokenLinks = await linkChecker.checkLinks(
        Array.from(document.querySelectorAll("#bookmarks-table a")).map((a) => a.href),
      )
      new Table(
        "broken-links-table",
        [
          { key: "url", label: "URL" },
          { key: "status", label: "Estado" },
        ],
        Array.from(brokenLinks.entries()).map(([url, status]) => ({ url, status })),
      )
    } catch (error) {
      alert(`Error al verificar enlaces: ${error.message}`)
    }
  })
}

async function initializeTables() {
  try {
    console.log("Inicializando tablas...")

    // Get bookmarks
    const bookmarks = await bookmarkManager.getBookmarks()
    console.log("Marcadores obtenidos:", bookmarks.length)

    // Initialize bookmarks table with reordered columns
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

    // Get and initialize duplicates table
    const duplicates = bookmarkManager.getDuplicados()
    console.log("Duplicados encontrados:", duplicates.length)

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
          key: "id",
          label: "ID",
          render: (_, row) => row.marcadores[0].id,
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
          className: "column-url",
        },
      ],
      duplicates,
    )

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

