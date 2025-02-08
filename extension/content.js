// Import the chrome namespace.  This is necessary because the code uses chrome.runtime
// without explicitly importing it.  The exact import method might vary slightly depending
// on your build process and environment, but this is a common approach.
const chrome = window.chrome

console.log("Content script iniciado")

// Función para verificar el estado de la extensión
function checkExtensionStatus() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "STATUS" }, (response) => {
      const isActive = !chrome.runtime.lastError && response?.isActive
      resolve(isActive)
    })
  })
}

// Función para obtener favoritos
function getBookmarks() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_BOOKMARKS" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error al obtener favoritos:", chrome.runtime.lastError)
        resolve([])
        return
      }
      resolve(response?.bookmarks || [])
    })
  })
}

// Manejar mensajes de la página web
window.addEventListener("message", async (event) => {
  // Verificar origen del mensaje
  if (event.origin !== window.location.origin) return

  switch (event.data.type) {
    case "CHECK_AVAILABILITY":
      const isActive = await checkExtensionStatus()
      window.postMessage(
        {
          type: isActive ? "EXTENSION_READY" : "EXTENSION_UNAVAILABLE",
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
            type: "BOOKMARKS_RESPONSE",
            bookmarks: bookmarks,
          },
          "*",
        )
      } catch (error) {
        console.error("Error al procesar solicitud de favoritos:", error)
        window.postMessage(
          {
            type: "BOOKMARKS_ERROR",
            error: error.message,
          },
          "*",
        )
      }
      break
  }
})

// Notificar que el content script está listo
window.postMessage(
  {
    type: "EXTENSION_READY",
    isAvailable: true,
  },
  "*",
)

