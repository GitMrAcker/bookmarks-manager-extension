export class Table {
  constructor(containerId, columns, data, options = {}) {
    console.log("Inicializando Table...", { containerId, columns, dataLength: data?.length })
    this.container = document.getElementById(containerId)
    if (!this.container) {
      console.error(`Contenedor ${containerId} no encontrado`)
      throw new Error(`Contenedor ${containerId} no encontrado`)
    }
    this.columns = columns
    this.data = data || []
    this.options = {
      itemsPerPage: 10,
      itemsPerPageOptions: [10, 25, 100, -1],
      ...options,
    }
    this.currentPage = 1
    this.sortColumn = null
    this.sortDirection = "asc"
    this.resizing = null
    this.columnWidths = new Map()

    this.render()
    this.attachEventListeners()
    console.log("Table inicializada")
  }

  render() {
    console.log("Renderizando tabla con", this.data.length, "registros")
    const table = document.createElement("table")
    table.innerHTML = `
            <thead>
                <tr>${this.renderHeaders()}</tr>
            </thead>
            <tbody>
                ${this.renderRows()}
            </tbody>
        `

    const pagination = this.renderPagination()

    this.container.innerHTML = ""
    this.container.appendChild(table)
    this.container.appendChild(pagination)
  }

  renderHeaders() {
    return this.columns
      .map(
        (column) => `
                    <th class="${column.className || ""} ${this.getSortClass(column.key)}" data-column="${column.key}">
                        ${column.label}
                        <span class="sort-icon"></span>
                        <div class="resize-handle"></div>
                    </th>
                `,
      )
      .join("")
  }

  getSortClass(columnKey) {
    if (this.sortColumn === columnKey) {
      return `sort-${this.sortDirection}`
    }
    return ""
  }

  renderRows() {
    const startIndex = (this.currentPage - 1) * this.options.itemsPerPage
    const endIndex = this.options.itemsPerPage === -1 ? this.data.length : startIndex + this.options.itemsPerPage
    const paginatedData = this.data.slice(startIndex, endIndex)

    return paginatedData
      .map(
        (row, index) => `
                    <tr>
                        ${this.columns
                          .map((column) => {
                            const content = column.render
                              ? column.render(row[column.key], row, startIndex + index)
                              : row[column.key]
                            return `<td class="${column.className || ""}">${content}</td>`
                          })
                          .join("")}
                    </tr>
                `,
      )
      .join("")
  }

  renderPagination() {
    const totalPages = Math.ceil(this.data.length / this.options.itemsPerPage)
    const paginationElement = document.createElement("div")
    paginationElement.className = "pagination"
    paginationElement.innerHTML = `
            <select class="items-per-page">
                ${this.options.itemsPerPageOptions
                  .map(
                    (option) => `
                        <option value="${option}" ${option === this.options.itemsPerPage ? "selected" : ""}>
                            ${option === -1 ? "Todos" : option} por página
                        </option>
                    `,
                  )
                  .join("")}
            </select>
            <div>
                <button class="prev-page" ${this.currentPage === 1 ? "disabled" : ""}>Anterior</button>
                <span>Página ${this.currentPage} de ${totalPages}</span>
                <button class="next-page" ${this.currentPage === totalPages ? "disabled" : ""}>Siguiente</button>
            </div>
        `
    return paginationElement
  }

  attachEventListeners() {
    this.container.addEventListener("click", (e) => {
      if (e.target.closest("th")) {
        const column = e.target.closest("th").dataset.column
        this.sort(column)
      } else if (e.target.classList.contains("prev-page")) {
        this.prevPage()
      } else if (e.target.classList.contains("next-page")) {
        this.nextPage()
      }
    })

    this.container.addEventListener("change", (e) => {
      if (e.target.classList.contains("items-per-page")) {
        this.changeItemsPerPage(Number.parseInt(e.target.value))
      }
    })

    this.attachResizeListeners()
  }

  attachResizeListeners() {
    const table = this.container.querySelector("table")

    const startResize = (e) => {
      if (e.target.classList.contains("resize-handle")) {
        const th = e.target.parentElement
        const columnIndex = Array.from(th.parentElement.children).indexOf(th)

        this.resizing = {
          element: th,
          columnIndex,
          startWidth: th.offsetWidth,
          startX: e.pageX,
          table: table,
        }

        document.body.style.cursor = "col-resize"
        e.target.classList.add("active")
      }
    }

    const doResize = (e) => {
      if (this.resizing) {
        const diff = e.pageX - this.resizing.startX
        const newWidth = Math.max(50, this.resizing.startWidth + diff)

        // Update the column width
        const cells = table.querySelectorAll(`tr > *:nth-child(${this.resizing.columnIndex + 1})`)
        cells.forEach((cell) => {
          cell.style.width = `${newWidth}px`
          cell.style.minWidth = `${newWidth}px`
          cell.style.maxWidth = `${newWidth}px`
        })

        // Store the new width
        this.columnWidths.set(this.resizing.columnIndex, newWidth)
      }
    }

    const stopResize = () => {
      if (this.resizing) {
        document.body.style.cursor = ""
        this.resizing.element.querySelector(".resize-handle").classList.remove("active")
        this.resizing = null
      }
    }

    table.addEventListener("mousedown", startResize)
    document.addEventListener("mousemove", doResize)
    document.addEventListener("mouseup", stopResize)
  }

  sort(column) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc"
    } else {
      this.sortColumn = column
      this.sortDirection = "asc"
    }

    this.data.sort((a, b) => {
      if (a[column] < b[column]) return this.sortDirection === "asc" ? -1 : 1
      if (a[column] > b[column]) return this.sortDirection === "asc" ? 1 : -1
      return 0
    })

    this.render()
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--
      this.render()
    }
  }

  nextPage() {
    const totalPages = Math.ceil(this.data.length / this.options.itemsPerPage)
    if (this.currentPage < totalPages) {
      this.currentPage++
      this.render()
    }
  }

  changeItemsPerPage(value) {
    this.options.itemsPerPage = value
    this.currentPage = 1
    this.render()
  }
}

