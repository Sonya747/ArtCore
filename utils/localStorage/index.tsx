const getPrefix = () => {
  return 'liclick'
}

const getKey = (key: string, prefix?: string) => {
  return `${prefix || getPrefix()}_${key}`
}

function get(key: string, prefix?: string) {
  try {
    const value = localStorage.getItem(getKey(key, prefix))
    return value ? JSON.parse(value) : value
  } catch (e) {
    console.error('localStorage get error', e)
    return null
  }
}

function set(key: string, value: any, prefix?: string) {
  try {
    localStorage.setItem(getKey(key, prefix), JSON.stringify(value))
    return true
  } catch (e) {
    console.error('localStorage set error', e)
    return false
  }
}

function remove(key: string, prefix?: string) {
  return localStorage.removeItem(getKey(key, prefix))
}

function clear() {
  return localStorage.clear()
}

const LocalStorage = {
  get,
  set,
  remove,
  clear,
}

export const ls = LocalStorage
