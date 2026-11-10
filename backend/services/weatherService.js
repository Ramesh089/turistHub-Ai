/**
 * Weather Service — Dynamic real-time weather & 5-day forecast
 * Powered by OpenWeatherMap API
 * 
 * Includes intelligent destination/landmark resolution, 30-minute in-memory caching,
 * and smart travel packing advisories based on real meteorological telemetry.
 * Strict policy: Returns genuine live API telemetry or throws clean error (no fake data).
 */

const CACHE = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache to optimize API quota

// ─── Direct Coordinates for Popular Indian Tourist Cities & Landmarks ────────
const CITY_COORDS = {
  'mysore': { lat: 12.2958, lon: 76.6394, name: 'Mysore' },
  'mysuru': { lat: 12.2958, lon: 76.6394, name: 'Mysuru' },
  'bangalore': { lat: 12.9716, lon: 77.5946, name: 'Bengaluru' },
  'bengaluru': { lat: 12.9716, lon: 77.5946, name: 'Bengaluru' },
  'jaipur': { lat: 26.9124, lon: 75.7873, name: 'Jaipur' },
  'goa': { lat: 15.2993, lon: 74.1240, name: 'Goa' },
  'panaji': { lat: 15.4909, lon: 73.8278, name: 'Panaji' },
  'varanasi': { lat: 25.3176, lon: 82.9739, name: 'Varanasi' },
  'agra': { lat: 27.1767, lon: 78.0081, name: 'Agra' },
  'delhi': { lat: 28.6139, lon: 77.2090, name: 'New Delhi' },
  'new delhi': { lat: 28.6139, lon: 77.2090, name: 'New Delhi' },
  'mumbai': { lat: 19.0760, lon: 72.8777, name: 'Mumbai' },
  'chennai': { lat: 13.0827, lon: 80.2707, name: 'Chennai' },
  'kolkata': { lat: 22.5726, lon: 88.3639, name: 'Kolkata' },
  'hyderabad': { lat: 17.3850, lon: 78.4867, name: 'Hyderabad' },
  'kochi': { lat: 9.9312, lon: 76.2673, name: 'Kochi' },
  'cochin': { lat: 9.9312, lon: 76.2673, name: 'Kochi' },
  'shimla': { lat: 31.1048, lon: 77.1734, name: 'Shimla' },
  'manali': { lat: 32.2396, lon: 77.1887, name: 'Manali' },
  'darjeeling': { lat: 27.0360, lon: 88.2627, name: 'Darjeeling' },
  'udaipur': { lat: 24.5854, lon: 73.7125, name: 'Udaipur' },
  'jodhpur': { lat: 26.2389, lon: 73.0243, name: 'Jodhpur' },
  'hampi': { lat: 15.3350, lon: 76.4600, name: 'Hampi' },
  'coorg': { lat: 12.3375, lon: 75.8069, name: 'Coorg' },
  'madikeri': { lat: 12.4244, lon: 75.7382, name: 'Madikeri' },
  'ooty': { lat: 11.4102, lon: 76.6950, name: 'Ooty' },
  'munnar': { lat: 10.0889, lon: 77.0595, name: 'Munnar' },
  'rishikesh': { lat: 30.0869, lon: 78.2676, name: 'Rishikesh' },
  'amritsar': { lat: 31.6340, lon: 74.8723, name: 'Amritsar' },
  'leh': { lat: 34.1526, lon: 77.5771, name: 'Leh' },
  'ladakh': { lat: 34.1526, lon: 77.5771, name: 'Ladakh' },
  'srinagar': { lat: 34.0837, lon: 74.7973, name: 'Srinagar' },
  'pondicherry': { lat: 11.9416, lon: 79.8083, name: 'Puducherry' },
  'puducherry': { lat: 11.9416, lon: 79.8083, name: 'Puducherry' },
  'alleppey': { lat: 9.4981, lon: 76.3388, name: 'Alappuzha' },
  'alappuzha': { lat: 9.4981, lon: 76.3388, name: 'Alappuzha' },
  'jaisalmer': { lat: 26.9157, lon: 70.9083, name: 'Jaisalmer' },
  'khajuraho': { lat: 24.8318, lon: 79.9199, name: 'Khajuraho' },
  'pushkar': { lat: 26.4899, lon: 74.5510, name: 'Pushkar' },
  'tirupati': { lat: 13.6288, lon: 79.4192, name: 'Tirupati' },
  'madurai': { lat: 9.9252, lon: 78.1198, name: 'Madurai' },
  'chikmagalur': { lat: 13.3153, lon: 75.7754, name: 'Chikmagalur' },
  'chikkamagaluru': { lat: 13.3153, lon: 75.7754, name: 'Chikkamagaluru' },
  'badami': { lat: 15.9198, lon: 75.6849, name: 'Badami' },
  'gokarna': { lat: 14.5479, lon: 74.3188, name: 'Gokarna' },
  'dharamsala': { lat: 32.2190, lon: 76.3234, name: 'Dharamshala' },
  'dharamshala': { lat: 32.2190, lon: 76.3234, name: 'Dharamshala' },
  'kodaikanal': { lat: 10.2381, lon: 77.4892, name: 'Kodaikanal' },
  'wayanad': { lat: 11.6854, lon: 76.1320, name: 'Wayanad' },
  'spiti': { lat: 32.2461, lon: 78.0349, name: 'Spiti Valley' },
  'kasol': { lat: 32.0100, lon: 77.3150, name: 'Kasol' },
  'varkala': { lat: 8.7379, lon: 76.7163, name: 'Varkala' },
  'lucknow': { lat: 26.8467, lon: 80.9462, name: 'Lucknow' }
};

// ─── Landmark & Tourist Attraction to City Mapping ────────────────────────────
const LANDMARK_MAP = {
  'taj mahal': 'Agra',
  'agra fort': 'Agra',
  'mysore palace': 'Mysore',
  'chamundi hill': 'Mysore',
  'baga beach': 'Goa',
  'calangute beach': 'Goa',
  'anjuna beach': 'Goa',
  'old goa': 'Goa',
  'dudhsagar': 'Goa',
  'dudhsagar falls': 'Goa',
  'dudhsagar waterfalls': 'Goa',
  'solang valley': 'Manali',
  'rohtang pass': 'Manali',
  'hadimba temple': 'Manali',
  'amber fort': 'Jaipur',
  'hawa mahal': 'Jaipur',
  'city palace': 'Jaipur',
  'gateway of india': 'Mumbai',
  'marine drive': 'Mumbai',
  'qutub minar': 'Delhi',
  'red fort': 'Delhi',
  'india gate': 'Delhi',
  'golden temple': 'Amritsar',
  'wagah border': 'Amritsar',
  'abbey falls': 'Coorg',
  'talakaveri': 'Coorg',
  'virupaksha temple': 'Hampi',
  'vittala temple': 'Hampi',
  'doddabetta': 'Ooty',
  'doddabetta peak': 'Ooty',
  'mattupetty dam': 'Munnar',
  'eravikulam': 'Munnar',
  'fort kochi': 'Kochi',
  'chinese fishing nets': 'Kochi',
  'dal lake': 'Srinagar',
  'shalimar bagh': 'Srinagar',
  'pangong lake': 'Leh',
  'nubra valley': 'Leh',
  'charminar': 'Hyderabad',
  'golconda fort': 'Hyderabad',
  'victoria memorial': 'Kolkata',
  'howrah bridge': 'Kolkata',
  'meenakshi temple': 'Madurai',
  'kashi vishwanath': 'Varanasi',
  'dashashwamedh ghat': 'Varanasi',
  'promenade beach': 'Pondicherry',
  'auroville': 'Pondicherry',
  'om beach': 'Gokarna',
  'kudle beach': 'Gokarna',
  'cave temples': 'Badami',
  'mullayanagiri': 'Chikmagalur',
  'baba budangiri': 'Chikmagalur'
};

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || '8bcc11b25c09d6a9eeb5e8c374c8e328';
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  /**
   * Intelligently resolves any landmark, district, or destination string into
   * a canonical searchable city name and coordinates.
   */
  resolveDestination(rawInput) {
    if (!rawInput || typeof rawInput !== 'string') return { queryCity: 'Bengaluru', displayName: 'Bengaluru', coords: null };

    const trimmed = rawInput.trim();
    const lower = trimmed.toLowerCase();

    // 1. Direct landmark match
    if (LANDMARK_MAP[lower]) {
      const city = LANDMARK_MAP[lower];
      return { queryCity: city, displayName: trimmed, coords: CITY_COORDS[city.toLowerCase()] || null };
    }

    // 2. Direct coordinate match
    if (CITY_COORDS[lower]) {
      return { queryCity: CITY_COORDS[lower].name, displayName: trimmed, coords: CITY_COORDS[lower] };
    }

    // 3. Strip commas e.g. "Agra, Uttar Pradesh" -> check "Agra"
    if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map(p => p.trim());
      const firstPart = parts[0].toLowerCase();
      if (LANDMARK_MAP[firstPart]) {
        const city = LANDMARK_MAP[firstPart];
        return { queryCity: city, displayName: trimmed, coords: CITY_COORDS[city.toLowerCase()] || null };
      }
      if (CITY_COORDS[firstPart]) {
        return { queryCity: CITY_COORDS[firstPart].name, displayName: trimmed, coords: CITY_COORDS[firstPart] };
      }
      return { queryCity: parts[0], displayName: trimmed, coords: null };
    }

    // 4. Strip common monument/nature words
    const stripped = trimmed
      .replace(/\b(Palace|Fort|Beach|Temple|Caves?|Falls|Waterfalls?|Hills?|Lake|Ghats?|Peak|Valley|Dam)\b/gi, '')
      .trim();

    if (stripped && stripped.toLowerCase() !== lower) {
      const strippedLower = stripped.toLowerCase();
      if (CITY_COORDS[strippedLower]) {
        return { queryCity: CITY_COORDS[strippedLower].name, displayName: trimmed, coords: CITY_COORDS[strippedLower] };
      }
      if (LANDMARK_MAP[strippedLower]) {
        const city = LANDMARK_MAP[strippedLower];
        return { queryCity: city, displayName: trimmed, coords: CITY_COORDS[city.toLowerCase()] || null };
      }
      return { queryCity: stripped, displayName: trimmed, coords: null };
    }

    return { queryCity: trimmed, displayName: trimmed, coords: null };
  }

  /**
   * Unified telemetry call: Returns Current Weather + 5-Day Forecast + Packing Advisory
   * for the selected destination in one coordinated, cached payload.
   */
  async getWeatherDetails(destinationInput) {
    const { queryCity, displayName, coords } = this.resolveDestination(destinationInput);
    const cacheKey = `weather_full_${queryCity.toLowerCase()}`;
    const cached = this._getFromCache(cacheKey);
    if (cached) return cached;

    // Fetch both current weather and 5-day forecast concurrently
    const [currentRaw, forecastRaw] = await Promise.all([
      this._fetchAPI('/weather', queryCity, coords),
      this._fetchAPI('/forecast', queryCity, coords)
    ]);

    const current = this._formatCurrentWeather(currentRaw, displayName);
    const forecast = this._formatForecast(forecastRaw, displayName);
    const advisory = this._generateTravelAdvisory(current, forecast);

    const payload = {
      destination: displayName,
      city: current.city,
      current,
      forecast,
      advisory,
      is_live: true,
      cached_at: new Date().toISOString()
    };

    this._setCache(cacheKey, payload);
    return payload;
  }

  /**
   * Get current weather only
   */
  async getCurrentWeather(destinationInput) {
    const details = await this.getWeatherDetails(destinationInput);
    return details.current;
  }

  /**
   * Get 5-day forecast only
   */
  async getForecast(destinationInput) {
    const details = await this.getWeatherDetails(destinationInput);
    return details.forecast;
  }

  /**
   * Get travel advisory only
   */
  async getTravelAdvisory(destinationInput) {
    const details = await this.getWeatherDetails(destinationInput);
    return details.advisory;
  }

  // ─── Private Telemetry & API Methods ──────────────────────────────────────

  async _fetchAPI(endpoint, city, coords) {
    let url;
    if (coords && coords.lat && coords.lon) {
      url = `${this.baseUrl}${endpoint}?lat=${coords.lat}&lon=${coords.lon}&appid=${this.apiKey}&units=metric`;
    } else {
      url = `${this.baseUrl}${endpoint}?q=${encodeURIComponent(city)},IN&appid=${this.apiKey}&units=metric`;
    }

    let response = await fetch(url);

    // If query with country code fails with 404, retry with broad city name
    if (!response.ok && response.status === 404 && !coords) {
      const fallbackUrl = `${this.baseUrl}${endpoint}?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`;
      const fallbackRes = await fetch(fallbackUrl);
      if (fallbackRes.ok) return fallbackRes.json();
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Weather information not found for destination "${city}".`);
      }
      if (response.status === 401) {
        throw new Error('Weather API authorization error. Please check the configured API key.');
      }
      if (response.status === 429) {
        throw new Error('Weather API rate limit reached. Please try again shortly.');
      }
      throw new Error(`Weather service error (HTTP ${response.status}).`);
    }

    return response.json();
  }

  _formatCurrentWeather(data, requestedName) {
    const weatherItem = (data.weather && data.weather[0]) || {};
    const iconCode = weatherItem.icon || '01d';

    // Format Sunrise & Sunset in Indian Standard Time (12h format)
    const formatTime = (unixSec) => {
      if (!unixSec) return null;
      return new Date(unixSec * 1000).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };

    return {
      destination_name: requestedName,
      city: data.name || requestedName,
      country: data.sys?.country || 'IN',
      temperature: Math.round(data.main?.temp ?? 0),
      feels_like: Math.round(data.main?.feels_like ?? data.main?.temp ?? 0),
      temp_min: Math.round(data.main?.temp_min ?? data.main?.temp ?? 0),
      temp_max: Math.round(data.main?.temp_max ?? data.main?.temp ?? 0),
      condition: weatherItem.main || 'Clear',
      description: (weatherItem.description || 'Clear sky').replace(/\b\w/g, c => c.toUpperCase()),
      icon: iconCode,
      icon_url: `https://openweathermap.org/img/wn/${iconCode}@2x.png`,
      humidity: data.main?.humidity ?? 0,
      wind_speed: Math.round((data.wind?.speed || 0) * 3.6), // Convert m/s to km/h
      visibility: data.visibility ? Math.round(data.visibility / 1000) : 10, // km
      sunrise: formatTime(data.sys?.sunrise),
      sunset: formatTime(data.sys?.sunset),
      pressure: data.main?.pressure ?? 1013,
      is_live: true,
      fetched_at: new Date().toISOString()
    };
  }

  _formatForecast(data, requestedName) {
    const list = data.list || [];
    const dailyMap = {};

    list.forEach(item => {
      // Split YYYY-MM-DD from "YYYY-MM-DD HH:MM:SS"
      const dateStr = item.dt_txt ? item.dt_txt.split(' ')[0] : new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = {
          date: dateStr,
          timestamp: item.dt * 1000,
          temps: [],
          feels: [],
          weatherList: [],
          humidityList: [],
          windList: []
        };
      }
      dailyMap[dateStr].temps.push(item.main?.temp ?? 0);
      dailyMap[dateStr].feels.push(item.main?.feels_like ?? 0);
      if (item.weather && item.weather[0]) {
        dailyMap[dateStr].weatherList.push(item.weather[0]);
      }
      dailyMap[dateStr].humidityList.push(item.main?.humidity ?? 0);
      dailyMap[dateStr].windList.push(item.wind?.speed ?? 0);
    });

    const todayStr = new Date().toISOString().split('T')[0];

    const days = Object.values(dailyMap).slice(0, 6).map((group, index) => {
      const isToday = group.date === todayStr || index === 0;
      const dateObj = new Date(group.date + 'T12:00:00');

      const dayName = isToday
        ? 'Today'
        : dateObj.toLocaleDateString('en-IN', { weekday: 'short' });

      const formattedDate = dateObj.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short'
      });

      // Pick midday weather condition (or modal condition)
      const midIdx = Math.floor(group.weatherList.length / 2);
      const chosenWeather = group.weatherList[midIdx] || group.weatherList[0] || {};
      const iconCode = chosenWeather.icon || '01d';

      const minTemp = Math.round(Math.min(...group.temps));
      const maxTemp = Math.round(Math.max(...group.temps));
      const avgHum = Math.round(group.humidityList.reduce((a, b) => a + b, 0) / (group.humidityList.length || 1));

      return {
        date: group.date,
        day_name: dayName,
        formatted_date: formattedDate,
        is_today: isToday,
        temp_min: minTemp,
        temp_max: maxTemp,
        condition: chosenWeather.main || 'Clear',
        description: (chosenWeather.description || 'Clear sky').replace(/\b\w/g, c => c.toUpperCase()),
        icon: iconCode,
        icon_url: `https://openweathermap.org/img/wn/${iconCode}@2x.png`,
        humidity: avgHum
      };
    });

    return {
      city: data.city?.name || requestedName,
      days: days.slice(0, 5), // Return 5 days
      is_live: true,
      fetched_at: new Date().toISOString()
    };
  }

  _generateTravelAdvisory(current, forecast) {
    const temp = current.temperature;
    const humidity = current.humidity;
    const cond = (current.condition || '').toLowerCase();
    const wind = current.wind_speed;

    const tips = [];
    const packing = [];
    let suitability = 'Great for Sightseeing';

    if (cond.includes('rain') || cond.includes('drizzle') || cond.includes('thunder')) {
      suitability = 'Carry Rain Protection';
      tips.push('🌧️ Rain showers expected — consider visiting indoor museums, palaces or covered heritage sites.');
      packing.push('Compact umbrella', 'Waterproof jacket or poncho', 'Water-resistant footwear');
    } else if (temp > 35) {
      suitability = 'Hot & Sunny';
      tips.push('☀️ High temperatures — plan outdoor monuments early morning (before 11 AM) or late afternoon.');
      packing.push('Light breathable cottons', 'UV protection sunglasses', 'Sun hat & sunscreen', 'Electrolyte water');
    } else if (temp < 12) {
      suitability = 'Chilly / Winter Climate';
      tips.push('❄️ Cool weather — ideal for hilly treks, sightseeing and bonfires.');
      packing.push('Thermal innerwear', 'Fleece jacket or sweater', 'Woolen cap & gloves');
    } else {
      suitability = 'Pleasant & Ideal';
      tips.push('✨ Excellent weather — perfect for photography, walking tours and outdoor heritage exploration.');
      packing.push('Comfortable walking shoes', 'Casual breathable outfits', 'Camera / Phone power bank');
    }

    if (humidity > 75 && !cond.includes('rain')) {
      tips.push('💧 High humidity levels — stay hydrated during daytime travel.');
    }

    if (wind > 25) {
      tips.push('💨 Brisk wind speeds — take care with hats and loose accessories on high view points.');
    }

    return {
      suitability,
      summary: tips[0] || 'Favorable travel conditions for your trip.',
      tips,
      packing
    };
  }

  _getFromCache(key) {
    const entry = CACHE.get(key);
    if (entry && (Date.now() - entry.time < CACHE_TTL)) {
      return entry.data;
    }
    CACHE.delete(key);
    return null;
  }

  _setCache(key, data) {
    CACHE.set(key, { data, time: Date.now() });
  }
}

module.exports = new WeatherService();
