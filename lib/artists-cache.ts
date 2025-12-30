/**
 * Cache intelligent pour les artistes avec fallback en cas de révocation
 * 
 * Stratégie:
 * - Cache de 3h pour éviter les appels Spotify fréquents
 * - Si refresh token révoqué à l'expiration, garde le cache jusqu'à reconnexion
 * - Invalidation lors de sélection/désélection d'artistes
 */

interface CacheEntry {
  data: any
  timestamp: number
  userId: string
  isStale: boolean // Indique si les données sont périmées mais gardées par sécurité
}

interface CacheStats {
  hits: number
  misses: number
  staleHits: number
  totalEntries: number
}

class ArtistsCache {
  private cache = new Map<string, CacheEntry>()
  private readonly TTL = 3 * 60 * 60 * 1000 // 3 heures
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    staleHits: 0,
    totalEntries: 0
  }

  /**
   * Génère une clé de cache unique (sans pagination - cache global par utilisateur)
   */
  private generateKey(userId: string): string {
    return `user_artists:${userId}`
  }

  /**
   * Vérifie si une entrée est expirée
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.TTL
  }

  /**
   * Récupère les données du cache et applique la pagination
   */
  get(userId: string, page: number, limit: number): { data: any, isStale: boolean } | null {
    const key = this.generateKey(userId)
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      return null
    }

    const isExpired = this.isExpired(entry)
    
    if (isExpired) {
      // Données expirées mais on peut les garder si Spotify est inaccessible
      this.stats.staleHits++
      console.log(`📦 Cache expiré mais disponible pour fallback: ${key}`)
    } else {
      this.stats.hits++
      console.log(`⚡ Cache hit: ${key} (page ${page}, limit ${limit})`)
    }

    // Appliquer la pagination sur les données complètes
    const allArtists = entry.data.all_artists || []
    const offset = page * limit
    const paginatedArtists = allArtists.slice(offset, offset + limit)
    const hasMore = allArtists.length > offset + limit

    const paginatedData = {
      artists: paginatedArtists,
      pagination: {
        page,
        limit,
        total: allArtists.length,
        hasMore
      },
      stats: {
        total_artists: allArtists.length,
        selected_artists: allArtists.filter((a: any) => a.selected).length,
        displayed_artists: paginatedArtists.length
      }
    }

    return { 
      data: paginatedData, 
      isStale: isExpired 
    }
  }

  /**
   * Récupère toutes les données du cache sans pagination (pour récupérer les anciens scores)
   */
  getFullCache(userId: string): any[] | null {
    const key = this.generateKey(userId)
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    return entry.data.all_artists || []
  }

  /**
   * Stocke TOUS les artistes triés dans le cache (pas de pagination)
   */
  set(userId: string, allArtists: any[]): void {
    const key = this.generateKey(userId)
    
    this.cache.set(key, {
      data: {
        all_artists: allArtists, // Tous les artistes triés par score
        cached_at: new Date().toISOString()
      },
      timestamp: Date.now(),
      userId,
      isStale: false
    })

    this.stats.totalEntries = this.cache.size
    console.log(`💾 Cache set: ${key} (${allArtists.length} artistes)`)
  }

  /**
   * Marque une entrée comme périmée (mais la garde pour fallback)
   */
  markAsStale(userId: string): void {
    const key = this.generateKey(userId)
    const entry = this.cache.get(key)
    
    if (entry) {
      entry.isStale = true
      this.cache.set(key, entry)
      console.log(`⚠️ Cache marqué comme périmé: ${key}`)
    }
  }

  /**
   * Invalide tout le cache d'un utilisateur (lors de sélection/désélection)
   */
  invalidateUser(userId: string): void {
    let deletedCount = 0
    
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (entry.userId === userId) {
        this.cache.delete(key)
        deletedCount++
      }
    })

    this.stats.totalEntries = this.cache.size
    console.log(`🗑️ Cache invalidé pour user ${userId}: ${deletedCount} entrées supprimées`)
  }

  /**
   * Invalide une entrée spécifique
   */
  invalidate(userId: string): void {
    const key = this.generateKey(userId)
    
    if (this.cache.delete(key)) {
      this.stats.totalEntries = this.cache.size
      console.log(`🗑️ Cache invalidé: ${key}`)
    }
  }

  /**
   * Nettoie les entrées expirées (sauf si marquées comme stale pour fallback)
   */
  cleanup(): void {
    let deletedCount = 0
    const now = Date.now()
    
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      // Supprimer seulement les entrées très anciennes (>6h) et non marquées comme stale
      const isVeryOld = now - entry.timestamp > 6 * 60 * 60 * 1000 // 6 heures
      
      if (isVeryOld && !entry.isStale) {
        this.cache.delete(key)
        deletedCount++
      }
    })

    this.stats.totalEntries = this.cache.size
    
    if (deletedCount > 0) {
      console.log(`🧹 Cache cleanup: ${deletedCount} entrées anciennes supprimées`)
    }
  }

  /**
   * Retourne les statistiques du cache
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Vide complètement le cache
   */
  clear(): void {
    this.cache.clear()
    this.stats = {
      hits: 0,
      misses: 0,
      staleHits: 0,
      totalEntries: 0
    }
    console.log('🗑️ Cache complètement vidé')
  }
}

// Instance singleton du cache
export const artistsCache = new ArtistsCache()

// Nettoyage automatique toutes les heures
setInterval(() => {
  artistsCache.cleanup()
}, 60 * 60 * 1000) // 1 heure
