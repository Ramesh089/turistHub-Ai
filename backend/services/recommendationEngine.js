/**
 * Recommendation Engine — Hybrid ML-based recommendation system
 * Combines: Content-Based Filtering + Collaborative Filtering + Trending + Seasonal
 *
 * Weights: content (40%) + collaborative (35%) + trending (15%) + seasonal (10%)
 */
const pool = require('../config/db');

// ─── TF-IDF Helpers ──────────────────────────────────────────────────────────

function tokenize(text) {
  if (!text) return [];
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
}

function computeTF(tokens) {
  const tf = {};
  tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
  const len = tokens.length || 1;
  Object.keys(tf).forEach(t => { tf[t] /= len; });
  return tf;
}

function computeIDF(docs) {
  const idf = {};
  const N = docs.length || 1;
  docs.forEach(tokens => {
    const unique = [...new Set(tokens)];
    unique.forEach(t => { idf[t] = (idf[t] || 0) + 1; });
  });
  Object.keys(idf).forEach(t => { idf[t] = Math.log(N / idf[t]); });
  return idf;
}

function tfidfVector(tf, idf) {
  const vec = {};
  Object.keys(tf).forEach(t => { vec[t] = tf[t] * (idf[t] || 0); });
  return vec;
}

function cosineSimilarity(vecA, vecB) {
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0, magA = 0, magB = 0;
  keys.forEach(k => {
    const a = vecA[k] || 0;
    const b = vecB[k] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  });
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ─── Seasonal Scoring ────────────────────────────────────────────────────────

const SEASON_MAP = {
  // month (0-indexed) → season keywords
  0: ['winter', 'cold', 'snow', 'christmas', 'new year'],
  1: ['winter', 'cold', 'valentine'],
  2: ['spring', 'holi', 'flower'],
  3: ['spring', 'summer', 'warm'],
  4: ['summer', 'hot', 'hill station', 'beach'],
  5: ['summer', 'monsoon', 'rain', 'hill station'],
  6: ['monsoon', 'rain', 'green', 'waterfall'],
  7: ['monsoon', 'rain', 'green', 'independence'],
  8: ['autumn', 'post-monsoon', 'pleasant'],
  9: ['autumn', 'dussehra', 'navratri', 'festival'],
  10: ['winter', 'diwali', 'festival', 'pleasant'],
  11: ['winter', 'cold', 'christmas', 'new year']
};

function getSeasonalScore(destination) {
  const month = new Date().getMonth();
  const keywords = SEASON_MAP[month] || [];
  const text = `${destination.description || ''} ${destination.best_time || ''} ${destination.category || ''}`.toLowerCase();
  let matches = 0;
  keywords.forEach(kw => { if (text.includes(kw)) matches++; });
  return Math.min(1, matches / Math.max(1, keywords.length));
}

// ─── Main Engine ─────────────────────────────────────────────────────────────

class RecommendationEngine {
  constructor() {
    this.weights = {
      content: 0.40,
      collaborative: 0.35,
      trending: 0.15,
      seasonal: 0.10
    };
  }

  /**
   * Get hybrid recommendations for a user
   * @param {number} userId
   * @param {object} userPrefs - { interests: [], budget: 'Budget'|'Mid-Range'|'Premium', travellerType: 'Solo'|'Family'|... }
   * @param {number} limit - number of results
   * @returns {Promise<Array>}
   */
  async getRecommendations(userId, userPrefs = {}, limit = 10) {
    try {
      // Fetch data in parallel
      const [destinations, userHistory, allRatings, trendingData] = await Promise.all([
        this._fetchDestinations(),
        this._fetchUserHistory(userId),
        this._fetchAllRatings(),
        this._fetchTrendingData()
      ]);

      if (destinations.length === 0) return [];

      // Compute each signal
      const contentScores = this._contentBasedScores(destinations, userPrefs, userHistory);
      const collabScores = this._collaborativeScores(userId, destinations, allRatings);
      const trendingScores = this._trendingScores(destinations, trendingData);
      const seasonalScores = destinations.map(d => getSeasonalScore(d));

      // Combine with weights
      const results = destinations.map((dest, i) => {
        const visitedIds = new Set(userHistory.map(h => h.destination_id));
        const alreadyVisited = visitedIds.has(dest.id);

        const score =
          this.weights.content * (contentScores[i] || 0) +
          this.weights.collaborative * (collabScores[i] || 0) +
          this.weights.trending * (trendingScores[i] || 0) +
          this.weights.seasonal * (seasonalScores[i] || 0);

        // Slightly deprioritize already-visited places
        const adjustedScore = alreadyVisited ? score * 0.6 : score;

        // Build human-readable reasons
        const reasons = [];
        if (contentScores[i] > 0.5) reasons.push('Matches your travel interests');
        if (collabScores[i] > 0.4) reasons.push('Loved by similar travelers');
        if (trendingScores[i] > 0.5) reasons.push('Trending destination');
        if (seasonalScores[i] > 0.4) reasons.push('Great for this season');
        if (dest.avg_rating >= 4.0) reasons.push(`Rated ${dest.avg_rating}★ by travelers`);
        if (reasons.length === 0) reasons.push('Recommended for you');

        return {
          ...dest,
          matchScore: Math.round(adjustedScore * 100),
          matchReasons: reasons,
          signals: {
            content: Math.round(contentScores[i] * 100),
            collaborative: Math.round(collabScores[i] * 100),
            trending: Math.round(trendingScores[i] * 100),
            seasonal: Math.round(seasonalScores[i] * 100)
          }
        };
      });

      // Sort by score descending
      results.sort((a, b) => b.matchScore - a.matchScore);
      return results.slice(0, limit);
    } catch (err) {
      console.error('RecommendationEngine error:', err);
      return [];
    }
  }

  // ─── Content-Based Filtering ─────────────────────────────────────────────

  _contentBasedScores(destinations, userPrefs, userHistory) {
    // Build user profile text from preferences + history
    const userTokens = tokenize([
      ...(userPrefs.interests || []),
      userPrefs.budget || '',
      userPrefs.travellerType || '',
      ...userHistory.map(h => `${h.destination_name || ''} ${h.category || ''}`)
    ].join(' '));

    // Build destination texts
    const destTokenSets = destinations.map(d =>
      tokenize(`${d.name} ${d.description || ''} ${d.category || ''} ${d.state || ''} ${d.best_time || ''}`)
    );

    // Compute IDF across all destination docs + user profile
    const allDocs = [...destTokenSets, userTokens];
    const idf = computeIDF(allDocs);

    // User TF-IDF vector
    const userVec = tfidfVector(computeTF(userTokens), idf);

    // Score each destination via cosine similarity
    return destTokenSets.map(tokens => {
      const destVec = tfidfVector(computeTF(tokens), idf);
      return cosineSimilarity(userVec, destVec);
    });
  }

  // ─── Collaborative Filtering (User-User) ─────────────────────────────────

  _collaborativeScores(userId, destinations, allRatings) {
    // Build user-item rating matrix
    const users = {};
    allRatings.forEach(r => {
      if (!users[r.user_id]) users[r.user_id] = {};
      users[r.user_id][r.destination_id] = r.rating;
    });

    const currentUserRatings = users[userId] || {};
    if (Object.keys(currentUserRatings).length === 0) {
      // Cold start — return neutral scores
      return destinations.map(() => 0.3);
    }

    // Find similar users (cosine similarity on rating vectors)
    const similarities = {};
    const destIds = destinations.map(d => d.id);

    Object.keys(users).forEach(uid => {
      if (Number(uid) === userId) return;
      const otherRatings = users[uid];

      // Compute similarity
      let dot = 0, magA = 0, magB = 0;
      destIds.forEach(did => {
        const a = currentUserRatings[did] || 0;
        const b = otherRatings[did] || 0;
        dot += a * b;
        magA += a * a;
        magB += b * b;
      });
      const denom = Math.sqrt(magA) * Math.sqrt(magB);
      similarities[uid] = denom === 0 ? 0 : dot / denom;
    });

    // Get top-K similar users
    const topK = Object.entries(similarities)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20);

    // Predict scores for each destination
    return destinations.map(dest => {
      if (currentUserRatings[dest.id]) {
        return currentUserRatings[dest.id] / 5; // Already rated — normalize
      }

      let weightedSum = 0;
      let simSum = 0;

      topK.forEach(([uid, sim]) => {
        const rating = users[uid]?.[dest.id];
        if (rating !== undefined && sim > 0) {
          weightedSum += sim * rating;
          simSum += Math.abs(sim);
        }
      });

      return simSum === 0 ? 0.3 : (weightedSum / simSum) / 5;
    });
  }

  // ─── Trending Scores ────────────────────────────────────────────────────

  _trendingScores(destinations, trendingData) {
    const maxBookings = Math.max(1, ...Object.values(trendingData));
    return destinations.map(d => {
      const count = trendingData[d.id] || 0;
      return count / maxBookings;
    });
  }

  // ─── Data Fetchers ──────────────────────────────────────────────────────

  async _fetchDestinations() {
    try {
      const [rows] = await pool.query(`
        SELECT tp.*,
               COALESCE(AVG(r.rating), 0) as avg_rating,
               COUNT(r.id) as review_count
        FROM tourist_places tp
        LEFT JOIN reviews r ON r.destination_id = tp.id
        GROUP BY tp.id
        ORDER BY tp.name
      `);
      return rows;
    } catch {
      return [];
    }
  }

  async _fetchUserHistory(userId) {
    if (!userId) return [];
    try {
      const [rows] = await pool.query(`
        SELECT b.*, tp.name as destination_name, tp.category
        FROM bookings b
        LEFT JOIN travel_packages pkg ON b.package_id = pkg.id
        LEFT JOIN tourist_places tp ON pkg.destination_id = tp.id
        WHERE b.user_id = ? AND b.status = 'Confirmed'
        ORDER BY b.created_at DESC
        LIMIT 50
      `, [userId]);
      return rows;
    } catch {
      return [];
    }
  }

  async _fetchAllRatings() {
    try {
      const [rows] = await pool.query(`
        SELECT user_id, destination_id, rating FROM reviews
        WHERE rating IS NOT NULL
      `);
      return rows;
    } catch {
      return [];
    }
  }

  async _fetchTrendingData() {
    try {
      const [rows] = await pool.query(`
        SELECT pkg.destination_id, COUNT(b.id) as booking_count
        FROM bookings b
        JOIN travel_packages pkg ON b.package_id = pkg.id
        WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          AND b.status = 'Confirmed'
        GROUP BY pkg.destination_id
      `);
      const map = {};
      rows.forEach(r => { map[r.destination_id] = r.booking_count; });
      return map;
    } catch {
      return {};
    }
  }
}

module.exports = new RecommendationEngine();
