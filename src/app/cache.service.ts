import { Injectable } from '@angular/core'

interface CacheEntry {
  promise: Promise<unknown>
  expiresAt: number
}

@Injectable({ providedIn: 'root' })
export class CacheService {
  private readonly cache = new Map<string, CacheEntry>()
  private readonly ttlMs = 5 * 60 * 1000

  getOrLoad<T>(key: string, load: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.promise as Promise<T>
    }

    const entry: CacheEntry = {
      promise: Promise.resolve().then(load),
      expiresAt: Number.POSITIVE_INFINITY,
    }
    entry.promise = entry.promise.then(
      value => {
        if (this.cache.get(key) === entry) {
          entry.expiresAt = Date.now() + this.ttlMs
        }
        return value
      },
      error => {
        if (this.cache.get(key) === entry) this.cache.delete(key)
        throw error
      }
    )
    this.cache.set(key, entry)
    return entry.promise as Promise<T>
  }

  clear(key: string): void {
    this.cache.delete(key)
  }
}
