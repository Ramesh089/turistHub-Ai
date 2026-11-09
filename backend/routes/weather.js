/**
 * Weather API Routes
 * GET /api/weather/current/:city
 * GET /api/weather/forecast/:city
 * GET /api/weather/advisory/:city
 */
const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const weatherService = require('../services/weatherService');

const router = express.Router();

// Current weather
router.get('/current/:city', optionalAuth, async (req, res) => {
  try {
    const city = decodeURIComponent(req.params.city).trim();
    if (!city) return res.status(400).json({ success: false, message: 'City name is required.' });

    const weather = await weatherService.getCurrentWeather(city);
    return res.json({ success: true, weather });
  } catch (err) {
    console.error('Weather current error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch weather data.' });
  }
});

// 5-day forecast
router.get('/forecast/:city', optionalAuth, async (req, res) => {
  try {
    const city = decodeURIComponent(req.params.city).trim();
    if (!city) return res.status(400).json({ success: false, message: 'City name is required.' });

    const forecast = await weatherService.getForecast(city);
    return res.json({ success: true, forecast });
  } catch (err) {
    console.error('Weather forecast error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch forecast data.' });
  }
});

// Travel advisory
router.get('/advisory/:city', optionalAuth, async (req, res) => {
  try {
    const city = decodeURIComponent(req.params.city).trim();
    if (!city) return res.status(400).json({ success: false, message: 'City name is required.' });

    const advisory = await weatherService.getTravelAdvisory(city);
    return res.json({ success: true, advisory });
  } catch (err) {
    console.error('Weather advisory error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch travel advisory.' });
  }
});

module.exports = router;
