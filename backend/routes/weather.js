/**
 * Weather API Routes
 * GET /api/weather/details/:city  -> Unified endpoint (Current + 5-day Forecast + Advisory)
 * GET /api/weather/current/:city  -> Current weather only
 * GET /api/weather/forecast/:city -> 5-day forecast only
 * GET /api/weather/advisory/:city -> Travel advisory only
 */
const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const weatherService = require('../services/weatherService');

const router = express.Router();

// Unified telemetry endpoint (recommended for frontend dashboard)
router.get('/details/:city', optionalAuth, async (req, res) => {
  try {
    const city = decodeURIComponent(req.params.city).trim();
    if (!city) {
      return res.status(400).json({ success: false, message: 'Destination or city name is required.' });
    }

    const data = await weatherService.getWeatherDetails(city);
    return res.json({ success: true, ...data });
  } catch (err) {
    console.error(`Weather details error for ${req.params.city}:`, err.message);
    const statusCode = err.message.includes('not found') ? 404 : 502;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Unable to retrieve weather data at this moment.'
    });
  }
});

// Current weather
router.get('/current/:city', optionalAuth, async (req, res) => {
  try {
    const city = decodeURIComponent(req.params.city).trim();
    if (!city) return res.status(400).json({ success: false, message: 'City name is required.' });

    const weather = await weatherService.getCurrentWeather(city);
    return res.json({ success: true, weather });
  } catch (err) {
    console.error('Weather current error:', err.message);
    const statusCode = err.message.includes('not found') ? 404 : 502;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to fetch current weather data.'
    });
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
    console.error('Weather forecast error:', err.message);
    const statusCode = err.message.includes('not found') ? 404 : 502;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to fetch forecast data.'
    });
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
    console.error('Weather advisory error:', err.message);
    const statusCode = err.message.includes('not found') ? 404 : 502;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to fetch travel advisory.'
    });
  }
});

module.exports = router;
