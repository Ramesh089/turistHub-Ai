/**
 * Transport Aggregator — Unified interface for train, bus, and flight APIs
 * Falls back to simulated data when external APIs are unavailable
 */

const trainAPI = require('./trainAPI');
const busAPI = require('./busAPI');
const flightAPI = require('./flightAPI');

class TransportAggregator {
  /**
   * Search all transport options between two cities
   * @param {string} from
   * @param {string} to
   * @param {string} date - YYYY-MM-DD
   * @param {number} passengers
   * @returns {Promise<{trains: Array, buses: Array, flights: Array}>}
   */
  async searchAll(from, to, date, passengers = 1) {
    const [trains, buses, flights] = await Promise.allSettled([
      trainAPI.search(from, to, date, passengers),
      busAPI.search(from, to, date, passengers),
      flightAPI.search(from, to, date, passengers)
    ]);

    return {
      trains: trains.status === 'fulfilled' ? trains.value : [],
      buses: buses.status === 'fulfilled' ? buses.value : [],
      flights: flights.status === 'fulfilled' ? flights.value : [],
      sources: {
        trains: trains.status === 'fulfilled' ? (trains.value._source || 'simulated') : 'error',
        buses: buses.status === 'fulfilled' ? (buses.value._source || 'simulated') : 'error',
        flights: flights.status === 'fulfilled' ? (flights.value._source || 'simulated') : 'error'
      }
    };
  }

  /**
   * Check live PNR / booking status
   */
  async checkStatus(type, pnr) {
    switch (type) {
      case 'train': return trainAPI.checkPNR(pnr);
      case 'bus': return busAPI.checkBooking(pnr);
      case 'flight': return flightAPI.checkPNR(pnr);
      default: return { status: 'unknown', message: 'Unsupported transport type' };
    }
  }

  /**
   * Get seat availability
   */
  async getSeatAvailability(type, serviceId, date) {
    switch (type) {
      case 'train': return trainAPI.getSeatAvailability(serviceId, date);
      case 'bus': return busAPI.getSeatAvailability(serviceId, date);
      case 'flight': return flightAPI.getSeatAvailability(serviceId, date);
      default: return { available: 0, total: 0 };
    }
  }
}

module.exports = new TransportAggregator();
