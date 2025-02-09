// El objeto chrome está disponible globalmente en extensiones de Chrome

console.log("Content script iniciado")

// Verificar disponibilidad y crear instancia
if (typeof window.BookmarkManager !== "function") {
  console.error("BookmarkManager no está disponible")
  throw new Error("BookmarkManager no está disponible")
}

// Usar 'new' para crear la instancia
const bookmarkManager = new window.BookmarkManager()

// Función para verificar el estado
function checkStatus() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ tipo: "STATUS" }, (response) => {
      resolve(!chrome.runtime.lastError && response?.isActive)
    })
  })
}

// Función para obtener marcadores
async function getBookmarks() {
  try {
    return await bookmarkManager.getBookmarks()
  } catch (error) {
    console.error("Error al obtener marcadores:", error)
    return []
  }
}

// Escuchar mensajes
window.addEventListener("message", async (event) => {
  // Verificar origen
  if (event.origin !== window.location.origin) return

  switch (event.data.tipo) {
    case "CHECK_AVAILABILITY":
      const isActive = await checkStatus()
      window.postMessage(
        {
          tipo: isActive ? "EXTENSION_READY" : "EXTENSION_UNAVAILABLE",
          isAvailable: isActive,
        },
        "*",
      )
      break

    case "GET_BOOKMARKS":
      try {
        const bookmarks = await getBookmarks()
        window.postMessage(
          {
            tipo: "BOOKMARKS_RESPONSE",
            bookmarks: bookmarks,
          },
          "*",
        )
      } catch (error) {
        console.error("Error:", error)
        window.postMessage(
          {
            tipo: "BOOKMARKS_ERROR",
            error: error.message,
          },
          "*",
        )
      }
      break
  }
})

