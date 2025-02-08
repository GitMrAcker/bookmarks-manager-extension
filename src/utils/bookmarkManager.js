import validateUrl from "./urlValidator.js"

// Import the chrome library
import chrome from "chrome"

export default async function analyzeBookmarks() {
  const bookmarks = await getBookmarks()
  const validationResults = await validateUrls(bookmarks)
  const duplicates = findDuplicates(bookmarks)

  return {
    total: bookmarks.length,
    broken: validationResults.filter((result) => !result.isValid).length,
    duplicates: duplicates.length,
  }
}

function getBookmarks() {
  return new Promise((resolve) => {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      resolve(flattenBookmarks(bookmarkTreeNodes))
    })
  })
}

function flattenBookmarks(bookmarkNodes) {
  let bookmarks = []
  for (const node of bookmarkNodes) {
    if (node.url) {
      bookmarks.push(node)
    }
    if (node.children) {
      bookmarks = bookmarks.concat(flattenBookmarks(node.children))
    }
  }
  return bookmarks
}

function findDuplicates(bookmarks) {
  const urlMap = new Map()
  const duplicates = []

  bookmarks.forEach((bookmark) => {
    if (urlMap.has(bookmark.url)) {
      duplicates.push(bookmark)
    } else {
      urlMap.set(bookmark.url, bookmark)
    }
  })

  return duplicates
}

async function validateUrls(bookmarks) {
  const results = await Promise.all(bookmarks.map(validateUrl))
  return results
}

