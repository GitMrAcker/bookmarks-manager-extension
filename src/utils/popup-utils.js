// TODO: Este archivo no está siendo usado activamente.
// Se mantendrá para futura implementación de funcionalidades de popup.
// Cuando se necesite, remover este comentario y actualizar según las mejores prácticas.

// Utility functions for popup
const popupUtils = {
  openPopup: (content, options = {}) => {
    const { title = "Popup", width = 400, height = 300 } = options
    const popup = document.createElement("div")
    popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: white;
            border: 1px solid #ccc;
            padding: 20px;
            width: ${width}px;
            height: ${height}px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
            z-index: 1000;
        `
    popup.innerHTML = `
            <h3>${title}</h3>
            <div>${content}</div>
            <button onclick="popupUtils.closePopup(this)">Close</button>
        `
    document.body.appendChild(popup)
  },
  closePopup: (element) => {
    const popup = element.parentNode
    document.body.removeChild(popup)
  },
}

// Hacer popupUtils disponible globalmente
window.popupUtils = popupUtils

