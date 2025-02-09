// El objeto chrome está disponible globalmente en extensiones de Chrome

// Función para verificar la carga de Chart.js
function verificarChartJs() {
  return new Promise((resolve) => {
    if (typeof window.Chart !== "undefined") {
      chartJsLoaded = true
      resolve(true)
    } else {
      // Intentar cargar Chart.js nuevamente
      const script = document.createElement("script")
      script.src = "/src/assets/js/chart.min.js"
      script.onload = () => {
        chartJsLoaded = true
        resolve(true)
      }
      script.onerror = () => {
        console.error("Error: No se pudo cargar Chart.js. Verifica la ruta del archivo.")
        resolve(false)
      }
      document.head.appendChild(script)
    }
  })
}

// Inicializar la extensión después de verificar Chart.js
async function iniciarExtension() {
  const chartJsDisponible = await verificarChartJs()
  if (!chartJsDisponible) {
    console.error("Chart.js no está disponible. Algunas funcionalidades estarán limitadas.")
  }

  // Continuar con la inicialización normal
  document.addEventListener("DOMContentLoaded", () => {
    const elementos = {
      navResumen: document.getElementById("nav-resumen"),
      navMarcadores: document.getElementById("nav-marcadores"),
      navDuplicados: document.getElementById("nav-duplicados"),
      seccionResumen: document.getElementById("seccion-resumen"),
      seccionMarcadores: document.getElementById("seccion-marcadores"),
      seccionDuplicados: document.getElementById("seccion-duplicados"),
      btnEliminarDuplicados: document.getElementById("btn-eliminar-duplicados"),
      selectAll: document.getElementById("select-all"),
      itemsPorPagina: document.getElementById("items-por-pagina"),
      paginaAnterior: document.getElementById("pagina-anterior"),
      paginaSiguiente: document.getElementById("pagina-siguiente"),
    }

    const estado = {
      bookmarkOriginal: [],
      bookmarkProgress: [],
      duplicados: [],
      duplicadosSeleccionados: new Set(),
      paginaActual: 1,
      itemsPorPagina: 10,
      paginaActualDuplicados: 1,
      itemsPorPaginaDuplicados: 10,
      ordenColumna: null,
      ordenDireccion: "asc",
    }

    let distribucionChart

    async function inicializarExtension() {
      if (!chartJsLoaded || typeof window.Chart === "undefined") {
        console.error("Chart.js no está cargado correctamente. Algunas funcionalidades pueden no estar disponibles.")
        // Continue with other initializations but skip chart-related operations
      }

      const bookmarks = await chrome.bookmarks.getTree()
      estado.bookmarkOriginal = procesarBookmarks(bookmarks)
      estado.bookmarkProgress = [...estado.bookmarkOriginal]
      actualizarTabla()
      actualizarEstadisticas()
      inicializarGrafico()
    }

    function procesarBookmarks(bookmarks) {
      const resultado = []
      function recorrer(nodos, rutaActual = "") {
        for (const nodo of nodos) {
          if (nodo.url) {
            resultado.push({
              id: nodo.id,
              title: nodo.title,
              url: nodo.url,
              ruta: rutaActual,
              index: resultado.length,
            })
          }
          if (nodo.children) {
            recorrer(nodo.children, rutaActual ? `${rutaActual} / ${nodo.title}` : nodo.title)
          }
        }
      }
      recorrer(bookmarks)
      return resultado
    }

    function actualizarTabla() {
      const tablaMarcadores = document.getElementById("tabla-marcadores")
      if (!tablaMarcadores) {
        console.error("No se encontró la tabla de marcadores")
        return
      }

      const inicio = (estado.paginaActual - 1) * estado.itemsPorPagina
      const fin = inicio + estado.itemsPorPagina
      const marcadores = estado.bookmarkProgress.slice(inicio, fin)

      if (estado.ordenColumna) {
        marcadores.sort((a, b) => {
          let valorA, valorB

          if (estado.ordenColumna === "marcador") {
            valorA = a.title.toLowerCase()
            valorB = b.title.toLowerCase()
          } else {
            valorA = a[estado.ordenColumna]
            valorB = b[estado.ordenColumna]
          }

          if (typeof valorA === "string" && typeof valorB === "string") {
            return estado.ordenDireccion === "asc" ? valorA.localeCompare(valorB) : valorB.localeCompare(valorA)
          } else {
            const direccion = estado.ordenDireccion === "asc" ? 1 : -1
            if (valorA < valorB) return -1 * direccion
            if (valorA > valorB) return 1 * direccion
            return 0
          }
        })
      }

      const tbody = tablaMarcadores.querySelector("tbody")
      tbody.innerHTML = ""

      marcadores.forEach((marcador) => {
        const fila = tbody.insertRow()
        const celdaIndice = fila.insertCell()
        const celdaId = fila.insertCell()
        const celdaRuta = fila.insertCell()
        const celdaTitulo = fila.insertCell()
        const celdaUrl = fila.insertCell()

        celdaIndice.textContent = marcador.index + 1
        celdaId.textContent = marcador.id
        celdaRuta.textContent = marcador.ruta || "Raíz"
        celdaTitulo.textContent = marcador.title
        celdaUrl.textContent = marcador.url
      })

      document.getElementById("pagina-anterior").disabled = estado.paginaActual === 1
      document.getElementById("pagina-siguiente").disabled = fin >= estado.bookmarkProgress.length
    }

    function encontrarDuplicados() {
      const grupos = estado.bookmarkProgress.reduce((acc, marcador) => {
        if (!acc[marcador.url]) {
          acc[marcador.url] = []
        }
        acc[marcador.url].push(marcador)
        return acc
      }, {})

      const duplicados = Object.values(grupos)
        .filter((grupo) => grupo.length > 1)
        .flat()

      estado.duplicados = duplicados
      actualizarTablaDuplicados(duplicados)
      actualizarEstadisticas()
      elementos.btnEliminarDuplicados.disabled = false
    }

    function actualizarTablaDuplicados(duplicados) {
      const inicio = (estado.paginaActualDuplicados - 1) * estado.itemsPorPaginaDuplicados
      const fin = inicio + estado.itemsPorPaginaDuplicados
      const duplicadosAPintar = duplicados.slice(inicio, fin)

      const tablaDuplicados = document.getElementById("tabla-duplicados")
      const tbody = tablaDuplicados.querySelector("tbody")
      tbody.innerHTML = ""

      duplicadosAPintar.forEach((marcador, index) => {
        const fila = tbody.insertRow()
        const celdaCheckbox = fila.insertCell()
        const celdaIndice = fila.insertCell()
        const celdaId = fila.insertCell()
        const celdaRuta = fila.insertCell()
        const celdaTitulo = fila.insertCell()
        const celdaUrl = fila.insertCell()

        const checkbox = document.createElement("input")
        checkbox.type = "checkbox"
        checkbox.className = "marcador-checkbox"
        checkbox.dataset.id = marcador.id
        checkbox.checked = estado.duplicadosSeleccionados.has(marcador.id)
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            estado.duplicadosSeleccionados.add(marcador.id)
          } else {
            estado.duplicadosSeleccionados.delete(marcador.id)
          }
          elementos.btnEliminarDuplicados.disabled = estado.duplicadosSeleccionados.size === 0
        })
        celdaCheckbox.appendChild(checkbox)

        celdaIndice.textContent = inicio + index + 1
        celdaId.textContent = marcador.id
        celdaRuta.textContent = marcador.ruta || "Raíz"
        celdaTitulo.textContent = marcador.title
        celdaUrl.textContent = marcador.url
      })

      document.getElementById("pagina-anterior-duplicados").disabled = estado.paginaActualDuplicados === 1
      document.getElementById("pagina-siguiente-duplicados").disabled = fin >= duplicados.length

      document.getElementById("inicio-rango-duplicados").textContent = inicio + 1
      document.getElementById("fin-rango-duplicados").textContent = Math.min(fin, duplicados.length)
      document.getElementById("total-items-duplicados").textContent = duplicados.length
    }

    function actualizarEstadisticas() {
      const totalMarcadoresEncontrados = estado.bookmarkOriginal.length
      const urlUnicas = new Set(estado.bookmarkProgress.map((m) => m.url))
      const totalMarcadoresUnicos = urlUnicas.size
      const totalDuplicados = estado.bookmarkProgress.length - totalMarcadoresUnicos
      const totalEliminados = estado.bookmarkOriginal.length - estado.bookmarkProgress.length

      document.getElementById("total-marcadores-encontrados").textContent = totalMarcadoresEncontrados
      document.getElementById("total-marcadores-duplicados").textContent = totalDuplicados
      document.getElementById("total-marcadores-unicos").textContent = totalMarcadoresUnicos
      document.getElementById("total-marcadores-eliminados").textContent = totalEliminados

      elementos.navDuplicados.disabled = totalDuplicados === 0

      actualizarGrafico(totalMarcadoresUnicos, totalDuplicados, totalEliminados)
    }

    function eliminarDuplicadosSeleccionados() {
      const marcadoresAEliminar = Array.from(estado.duplicadosSeleccionados)
      if (marcadoresAEliminar.length === 0) return

      const grupos = estado.bookmarkProgress.reduce((acc, marcador) => {
        if (!acc[marcador.url]) {
          acc[marcador.url] = []
        }
        acc[marcador.url].push(marcador)
        return acc
      }, {})

      const marcadoresEliminados = marcadoresAEliminar.filter((id) => {
        const marcador = estado.bookmarkProgress.find((m) => m.id === id)
        if (!marcador) return false

        const grupoUrl = grupos[marcador.url]
        const seleccionadosEnGrupo = grupoUrl.filter((m) => estado.duplicadosSeleccionados.has(m.id)).length

        return grupoUrl.length - seleccionadosEnGrupo > 0
      })

      estado.bookmarkProgress = estado.bookmarkProgress.filter(
        (marcador) => !marcadoresEliminados.includes(marcador.id),
      )

      estado.duplicadosSeleccionados.clear()
      elementos.selectAll.checked = false

      actualizarEstadisticas()
      mostrarNotificacion(`Se eliminaron ${marcadoresEliminados.length} marcadores duplicados`)
      elementos.btnEliminarDuplicados.disabled = true

      encontrarDuplicados()
    }

    function mostrarNotificacion(mensaje, duracion = 3000) {
      const notificacion = document.createElement("div")
      notificacion.className = "notificacion"
      notificacion.textContent = mensaje
      document.body.appendChild(notificacion)

      setTimeout(() => {
        notificacion.remove()
      }, duracion)
    }

    function inicializarGrafico() {
      if (!chartJsLoaded || typeof window.Chart === "undefined") {
        console.error("No se puede inicializar el gráfico: Chart.js no está disponible")
        return
      }

      try {
        const ctx = document.getElementById("chart-distribucion")
        if (!ctx) {
          console.error("No se encontró el elemento canvas para el gráfico")
          return
        }

        distribucionChart = new window.Chart(ctx.getContext("2d"), {
          type: "doughnut",
          data: {
            labels: ["Únicos", "Duplicados", "Eliminados"],
            datasets: [
              {
                data: [0, 0, 0],
                backgroundColor: ["#34a853", "#fbbc05", "#ea4335"],
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
              },
            },
          },
        })
      } catch (error) {
        console.error("Error al inicializar el gráfico:", error)
      }
    }

    function actualizarGrafico(unicos, duplicados, eliminados) {
      if (!distribucionChart) {
        console.error("El gráfico no está inicializado")
        return
      }

      try {
        distribucionChart.data.datasets[0].data = [unicos, duplicados, eliminados]
        distribucionChart.update()
      } catch (error) {
        console.error("Error al actualizar el gráfico:", error)
      }
    }

    elementos.navResumen.addEventListener("click", () => cambiarSeccion("resumen"))
    elementos.navMarcadores.addEventListener("click", () => cambiarSeccion("marcadores"))
    elementos.navDuplicados.addEventListener("click", () => cambiarSeccion("duplicados"))

    function cambiarSeccion(seccion) {
      elementos.seccionResumen.classList.remove("active")
      elementos.seccionMarcadores.classList.remove("active")
      elementos.seccionDuplicados.classList.remove("active")

      elementos.navResumen.classList.remove("active")
      elementos.navMarcadores.classList.remove("active")
      elementos.navDuplicados.classList.remove("active")

      switch (seccion) {
        case "resumen":
          elementos.seccionResumen.classList.add("active")
          elementos.navResumen.classList.add("active")
          break
        case "marcadores":
          elementos.seccionMarcadores.classList.add("active")
          elementos.navMarcadores.classList.add("active")
          actualizarTabla()
          break
        case "duplicados":
          elementos.seccionDuplicados.classList.add("active")
          elementos.navDuplicados.classList.add("active")
          encontrarDuplicados()
          break
      }
    }

    document.querySelectorAll(".tabla-marcadores th[data-orden]").forEach((th) => {
      th.addEventListener("click", () => {
        const columna = th.dataset.orden
        if (columna) {
          if (columna === estado.ordenColumna) {
            estado.ordenDireccion = estado.ordenDireccion === "asc" ? "desc" : "asc"
          } else {
            estado.ordenColumna = columna
            estado.ordenDireccion = "asc"
          }

          document.querySelectorAll(".tabla-marcadores th").forEach((header) => {
            header.classList.remove("asc", "desc")
          })
          th.classList.add(estado.ordenDireccion)

          actualizarTabla()
        }
      })
    })

    elementos.selectAll.addEventListener("change", (e) => {
      const checkboxes = document.querySelectorAll(".marcador-checkbox")

      const gruposPorUrl = {}
      estado.duplicados.forEach((marcador) => {
        if (!gruposPorUrl[marcador.url]) {
          gruposPorUrl[marcador.url] = []
        }
        gruposPorUrl[marcador.url].push(marcador)
      })

      if (e.target.checked) {
        Object.values(gruposPorUrl).forEach((grupo) => {
          grupo.slice(0, -1).forEach((marcador) => {
            estado.duplicadosSeleccionados.add(marcador.id)
          })
        })
      } else {
        estado.duplicadosSeleccionados.clear()
      }

      checkboxes.forEach((cb) => {
        cb.checked = estado.duplicadosSeleccionados.has(cb.dataset.id)
      })

      actualizarTablaDuplicados(estado.duplicados)
      elementos.btnEliminarDuplicados.disabled = estado.duplicadosSeleccionados.size === 0
    })

    elementos.itemsPorPagina.addEventListener("change", (e) => {
      estado.itemsPorPagina = Number.parseInt(e.target.value, 10)
      estado.paginaActual = 1
      actualizarTabla()
    })

    elementos.paginaAnterior.addEventListener("click", () => {
      if (estado.paginaActual > 1) {
        estado.paginaActual--
        actualizarTabla()
      }
    })

    elementos.paginaSiguiente.addEventListener("click", () => {
      const totalPaginas = Math.ceil(estado.bookmarkProgress.length / estado.itemsPorPagina)
      if (estado.paginaActual < totalPaginas) {
        estado.paginaActual++
        actualizarTabla()
      }
    })

    document.getElementById("items-por-pagina-duplicados").addEventListener("change", (e) => {
      estado.itemsPorPaginaDuplicados = Number.parseInt(e.target.value, 10)
      estado.paginaActualDuplicados = 1
      actualizarTablaDuplicados(estado.duplicados)
    })

    document.getElementById("pagina-anterior-duplicados").addEventListener("click", () => {
      if (estado.paginaActualDuplicados > 1) {
        estado.paginaActualDuplicados--
        actualizarTablaDuplicados(estado.duplicados)
      }
    })

    document.getElementById("pagina-siguiente-duplicados").addEventListener("click", () => {
      const totalPaginas = Math.ceil(estado.duplicados.length / estado.itemsPorPaginaDuplicados)
      if (estado.paginaActualDuplicados < totalPaginas) {
        estado.paginaActualDuplicados++
        actualizarTablaDuplicados(estado.duplicados)
      }
    })

    elementos.btnEliminarDuplicados.addEventListener("click", eliminarDuplicadosSeleccionados)

    inicializarExtension()
  })
}

// Iniciar la extensión
iniciarExtension()
let chartJsLoaded = false

