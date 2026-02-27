import { ref } from 'vue'

export function useApi<T>(url: string) {
  const data = ref<T | null>(null) as { value: T | null }
  const error = ref<string | null>(null)
  const loading = ref(false)

  async function fetch_() {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(url)
      if (!res.ok)
        throw new Error(`HTTP ${res.status}`)
      data.value = await res.json()
    }
    catch (err) {
      error.value = String(err)
    }
    finally {
      loading.value = false
    }
  }

  return { data, error, loading, refresh: fetch_ }
}

export async function apiPut(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok)
    throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function apiPatch(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok)
    throw new Error(`HTTP ${res.status}`)
  return res.json()
}
