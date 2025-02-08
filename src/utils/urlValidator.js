export default async function validateUrl(bookmark) {
    try {
      const response = await fetch(bookmark.url, {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-cache",
        credentials: "omit",
        redirect: "follow",
      })
      return { url: bookmark.url, isValid: true }
    } catch (error) {
      console.error(`Error validating URL ${bookmark.url}:`, error)
      return { url: bookmark.url, isValid: false }
    }
  }
  
  