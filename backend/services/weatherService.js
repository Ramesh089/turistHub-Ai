/**
 * Weather Service — Real-time weather data with caching
 * Uses OpenWeatherMap API (free tier: 1000 calls/day)
 * Falls back to static seasonal data when API key is not configured
 */

const CACHE = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// ─── Hardcoded coordinates for popular Indian tourist destinations ────────────
const CITY_COORDS = {
  'mysore': { lat: 12.2958, lon: 76.6394 },
  'mysuru': { lat: 12.2958, lon: 76.6394 },
  'bangalore': { lat: 12.9716, lon: 77.5946 },
  'bengaluru': { lat: 12.9716, lon: 77.5946 },
  'jaipur': { lat: 26.9124, lon: 75.7873 },
  'goa': { lat: 15.2993, lon: 74.1240 },
  'varanasi': { lat: 25.3176, lon: 82.9739 },
  'agra': { lat: 27.1767, lon: 78.0081 },
  'delhi': { lat: 28.6139, lon: 77.2090 },
  'new delhi': { lat: 28.6139, lon: 77.2090 },
  'mumbai': { lat: 19.0760, lon: 72.8777 },
  'chennai': { lat: 13.0827, lon: 80.2707 },
  'kolkata': { lat: 22.5726, lon: 88.3639 },
  'hyderabad': { lat: 17.3850, lon: 78.4867 },
  'kochi': { lat: 9.9312, lon: 76.2673 },
  'shimla': { lat: 31.1048, lon: 77.1734 },
  'manali': { lat: 32.2396, lon: 77.1887 },
  'darjeeling': { lat: 27.0360, lon: 88.2627 },
  'udaipur': { lat: 24.5854, lon: 73.7125 },
  'jodhpur': { lat: 26.2389, lon: 73.0243 },
  'hampi': { lat: 15.3350, lon: 76.4600 },
  'coorg': { lat: 12.3375, lon: 75.8069 },
  'ooty': { lat: 11.4102, lon: 76.6950 },
  'munnar': { lat: 10.0889, lon: 77.0595 },
  'rishikesh': { lat: 30.0869, lon: 78.2676 },
  'amritsar': { lat: 31.6340, lon: 74.8723 },
  'leh': { lat: 34.1526, lon: 77.5771 },
  'ladakh': { lat: 34.1526, lon: 77.5771 },
  'srinagar': { lat: 34.0837, lon: 74.7973 },
  'pondicherry': { lat: 11.9416, lon: 79.8083 },
  'puducherry': { lat: 11.9416, lon: 79.8083 },
  'alleppey': { lat: 9.4981, lon: 76.3388 },
  'jaisalmer': { lat: 26.9157, lon: 70.9083 },
  'khajuraho': { lat: 24.8318, lon: 79.9199 },
  'pushkar': { lat: 26.4899, lon: 74.5510 },
  'tirupati': { lat: 13.6288, lon: 79.4192 },
  'madurai': { lat: 9.9252, lon: 78.1198 },
  'chikmagalur': { lat: 13.3153, lon: 75.7754 },
  'badami': { lat: 15.9198, lon: 75.6849 },
  'gokarna': { lat: 14.5479, lon: 74.3188 },
  'yadgir': { lat: 16.7700, lon: 77.1400 }
};

// ─── Static seasonal fallback data ───────────────────────────────────────────
const SEASON_DEFAULTS = {
  winter: { temp: 18, feels_like: 16, humidity: 45, description: 'Pleasant winter weather', icon: '01d', wind_speed: 8 },
  summer: { temp: 35, feels_like: 38, humidity: 30, description: 'Hot summer conditions', icon: '01d', wind_speed: 12 },
  monsoon: { temp: 27, feels_like: 30, humidity: 85, description: 'Monsoon season - expect rain', icon: '10d', wind_speed: 15 },
  autumn: { temp: 25, feels_like: 24, humidity: 55, description: 'Pleasant autumn weather', icon: '02d', wind_speed: 10 }
};

function getCurrentSeason() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 5) return 'summer';
  if (month >= 6 && month <= 8) return 'monsoon';
  if (month >= 9 && month <= 10) return 'autumn';
  return 'winter';
}

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || '';
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  /**
   * Get current weather for a city
   * @param {string} city
   * @returns {Promise<object>}
   */
  async getCurrentWeather(city) {
    const cacheKey = `current_${city.toLowerCase()}`;
    const cached = this._getFromCache(cacheKey);
    if (cached) return cached;

    try {
      if (this.apiKey) {
        const data = await this._fetchFromAPI(`/weather`, city);
        const result = this._formatCurrentWeather(data, city);
        this._setCache(cacheKey, result);
        return result;
      }
    } catch (err) {
      console.warn(`Weather API error for ${city}:`, err.message);
    }

    // Fallback to static data
    return this._getStaticWeather(city);
  }

  /**
   * Get 5-day forecast for a city
   * @param {string} city
   * @returns {Promise<object>}
   */
  async getForecast(city) {
    const cacheKey = `forecast_${city.toLowerCase()}`;
    const cached = this._getFromCache(cacheKey);
    if (cached) return cached;

    try {
      if (this.apiKey) {
        const data = await this._fetchFromAPI(`/forecast`, city);
        const result = this._formatForecast(data, city);
        this._setCache(cacheKey, result);
        return result;
      }
    } catch (err) {
      console.warn(`Forecast API error for ${city}:`, err.message);
    }

    // Fallback to static forecast
    return this._getStaticForecast(city);
  }

  /**
   * Get weather-aware travel advisory
   * @param {string} city
   * @returns {Promise<object>}
   */
  async getTravelAdvisory(city) {
    const weather = await this.getCurrentWeather(city);
    const advisory = {
      city,
      weather,
      recommendations: [],
      packingTips: [],
      bestTimeToVisit: true
    };

    const temp = weather.temperature;
    const humidity = weather.humidity;

    // Temperature-based tips
    if (temp > 38) {
      advisory.recommendations.push('⚠️ Extreme heat advisory — carry plenty of water and sunscreen');
      advisory.packingTips.push('Light cotton clothes', 'Sunglasses', 'Hat', 'Water bottle');
      advisory.bestTimeToVisit = false;
    } else if (temp > 30) {
      advisory.recommendations.push('☀️ Warm weather — stay hydrated and avoid midday sun');
      advisory.packingTips.push('Light clothes', 'Sunscreen', 'Cap');
    } else if (temp < 10) {
      advisory.recommendations.push('🧥 Cold weather — layer up and carry warm clothing');
      advisory.packingTips.push('Warm jacket', 'Thermals', 'Gloves', 'Woolen socks');
    } else {
      advisory.recommendations.push('✅ Pleasant weather — great time to explore!');
      advisory.packingTips.push('Comfortable clothing', 'Walking shoes');
    }

    // Humidity / rain tips
    if (humidity > 80) {
      advisory.recommendations.push('🌧️ High humidity — expect possible showers');
      advisory.packingTips.push('Umbrella', 'Rain jacket', 'Waterproof bag');
    }

    // Wind tips
    if (weather.wind_speed > 20) {
      advisory.recommendations.push('💨 Windy conditions — secure loose items');
    }

    return advisory;
  }

  // ─── Internal Methods ────────────────────────────────────────────────────

  async _fetchFromAPI(endpoint, city) {
    const coords = CITY_COORDS[city.toLowerCase()];
    let url;
    if (coords) {
      url = `${this.baseUrl}${endpoint}?lat=${coords.lat}&lon=${coords.lon}&appid=${this.apiKey}&units=metric`;
    } else {
      url = `${this.baseUrl}${endpoint}?q=${encodeURIComponent(city)},IN&appid=${this.apiKey}&units=metric`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API returned ${response.status}`);
    }
    return response.json();
  }

  _formatCurrentWeather(data, city) {
    return {
      city: data.name || city,
      temperature: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      temp_min: Math.round(data.main.temp_min),
      temp_max: Math.round(data.main.temp_max),
      humidity: data.main.humidity,
      description: data.weather?.[0]?.description || 'Clear',
      icon: data.weather?.[0]?.icon || '01d',
      icon_url: `https://openweathermap.org/img/wn/${data.weather?.[0]?.icon || '01d'}@2x.png`,
      wind_speed: Math.round((data.wind?.speed || 0) * 3.6), // m/s → km/h
      visibility: data.visibility ? Math.round(data.visibility / 1000) : null,
      sunrise: data.sys?.sunrise ? new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-IN') : null,
      sunset: data.sys?.sunset ? new Date(data.sys.sunset * 1000).toLocaleTimeString('en-IN') : null,
      is_live: true,
      fetched_at: new Date().toISOString()
    };
  }

  _formatForecast(data, city) {
    // Group by day
    const dailyMap = {};
    (data.list || []).forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyMap[date]) {
        dailyMap[date] = {
          date,
          temps: [],
          descriptions: [],
          icons: [],
          humidity: []
        };
      }
      dailyMap[date].temps.push(item.main.temp);
      dailyMap[date].descriptions.push(item.weather?.[0]?.description || '');
      dailyMap[date].icons.push(item.weather?.[0]?.icon || '01d');
      dailyMap[date].humidity.push(item.main.humidity);
    });

    const days = Object.values(dailyMap).slice(0, 5).map(day => ({
      date: day.date,
      day_name: new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short' }),
      temp_min: Math.round(Math.min(...day.temps)),
      temp_max: Math.round(Math.max(...day.temps)),
      avg_humidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
      description: day.descriptions[Math.floor(day.descriptions.length / 2)],
      icon: day.icons[Math.floor(day.icons.length / 2)],
      icon_url: `https://openweathermap.org/img/wn/${day.icons[Math.floor(day.icons.length / 2)]}@2x.png`
    }));

    return { city: data.city?.name || city, days, is_live: true, fetched_at: new Date().toISOString() };
  }

  _getStaticWeather(city) {
    const season = getCurrentSeason();
    const defaults = SEASON_DEFAULTS[season];
    return {
      city,
      temperature: defaults.temp,
      feels_like: defaults.feels_like,
      temp_min: defaults.temp - 3,
      temp_max: defaults.temp + 4,
      humidity: defaults.humidity,
      description: defaults.description,
      icon: defaults.icon,
      icon_url: `https://openweathermap.org/img/wn/${defaults.icon}@2x.png`,
      wind_speed: defaults.wind_speed,
      visibility: 10,
      sunrise: '06:15 AM',
      sunset: '06:30 PM',
      is_live: false,
      fetched_at: new Date().toISOString()
    };
  }

  _getStaticForecast(city) {
    const season = getCurrentSeason();
    const defaults = SEASON_DEFAULTS[season];
    const days = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const variation = Math.round((Math.random() - 0.5) * 4);
      days.push({
        date: d.toISOString().split('T')[0],
        day_name: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        temp_min: defaults.temp - 3 + variation,
        temp_max: defaults.temp + 4 + variation,
        avg_humidity: defaults.humidity + Math.round((Math.random() - 0.5) * 10),
        description: defaults.description,
        icon: defaults.icon,
        icon_url: `https://openweathermap.org/img/wn/${defaults.icon}@2x.png`
      });
    }
    return { city, days, is_live: false, fetched_at: new Date().toISOString() };
  }

  _getFromCache(key) {
    const entry = CACHE.get(key);
    if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;
    CACHE.delete(key);
    return null;
  }

  _setCache(key, data) {
    CACHE.set(key, { data, time: Date.now() });
  }
}

module.exports = new WeatherService();
