/**
 * Train API Integration
 * Connects to IRCTC/RailwayAPI when API key is available
 * Falls back to realistic simulated data
 */

const TRAIN_ROUTES = [
  { number: '12627', name: 'Karnataka Express', type: 'Superfast', classes: ['SL', '3A', '2A', '1A'] },
  { number: '12007', name: 'Shatabdi Express', type: 'Shatabdi', classes: ['CC', 'EC'] },
  { number: '16523', name: 'Karwar Express', type: 'Express', classes: ['SL', '3A', '2A'] },
  { number: '12657', name: 'Chennai Mail', type: 'Superfast', classes: ['SL', '3A', '2A', '1A'] },
  { number: '22691', name: 'Rajdhani Express', type: 'Rajdhani', classes: ['3A', '2A', '1A'] },
  { number: '12309', name: 'Rajdhani Express', type: 'Rajdhani', classes: ['3A', '2A', '1A'] },
  { number: '12951', name: 'Mumbai Rajdhani', type: 'Rajdhani', classes: ['3A', '2A', '1A'] },
  { number: '12301', name: 'Howrah Rajdhani', type: 'Rajdhani', classes: ['3A', '2A', '1A'] }
];

const CLASS_PRICES = { SL: 350, '3A': 900, '2A': 1400, '1A': 2500, CC: 800, EC: 1600 };

class TrainAPI {
  constructor() {
    this.apiKey = process.env.RAILWAY_API_KEY || '';
    this.baseUrl = 'https://indianrailapi.com/api/v2';
  }

  async search(from, to, date, passengers = 1) {
    if (this.apiKey) {
      try {
        return await this._liveSearch(from, to, date, passengers);
      } catch (err) {
        console.warn('Train API live search failed:', err.message);
      }
    }
    return this._simulatedSearch(from, to, date, passengers);
  }

  async _liveSearch(from, to, date) {
    const url = `${this.baseUrl}/TrainBetweenStation/apikey/${this.apiKey}/From/${encodeURIComponent(from)}/To/${encodeURIComponent(to)}/Date/${date.replace(/-/g, '')}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Railway API returned ${response.status}`);
    const data = await response.json();
    const results = (data.Trains || []).map(t => ({
      id: `train_${t.TrainNo}`,
      type: 'Train',
      number: t.TrainNo,
      name: t.TrainName,
      from: t.Source?.Name || from,
      to: t.Destination?.Name || to,
      departure: t.DepartureTime || '06:00',
      arrival: t.ArrivalTime || '12:00',
      duration: t.TravelTime || '6h',
      classes: t.AvailableClasses || ['SL', '3A'],
      price: parseFloat(t.Fare) || 800,
      seats_available: parseInt(t.AvailableSeats) || 50,
      _source: 'live'
    }));
    results._source = 'live';
    return results;
  }

  _simulatedSearch(from, to, date, passengers) {
    const count = 3 + Math.floor(Math.random() * 3);
    const results = [];
    for (let i = 0; i < count; i++) {
      const template = TRAIN_ROUTES[i % TRAIN_ROUTES.length];
      const depHour = 5 + Math.floor(Math.random() * 16);
      const durationH = 3 + Math.floor(Math.random() * 10);
      const arrHour = (depHour + durationH) % 24;
      const basePrice = CLASS_PRICES[template.classes[0]] || 500;
      const distanceFactor = 1 + Math.random();

      results.push({
        id: `train_${template.number}_${i}`,
        type: 'Train',
        number: template.number,
        name: template.name,
        train_type: template.type,
        from,
        to,
        date,
        departure: `${String(depHour).padStart(2, '0')}:${Math.random() > 0.5 ? '00' : '30'}`,
        arrival: `${String(arrHour).padStart(2, '0')}:${Math.random() > 0.5 ? '15' : '45'}`,
        duration: `${durationH}h ${Math.floor(Math.random() * 60)}m`,
        classes: template.classes,
        price: Math.round(basePrice * distanceFactor),
        seats_available: 10 + Math.floor(Math.random() * 100),
        total_seats: 120,
        amenities: ['Pantry', 'Charging Point', 'Bedroll'],
        _source: 'simulated'
      });
    }
    results._source = 'simulated';
    return results;
  }

  async checkPNR(pnr) {
    if (this.apiKey) {
      try {
        const url = `${this.baseUrl}/PNRCheck/apikey/${this.apiKey}/PNRNumber/${pnr}`;
        const response = await fetch(url);
        if (response.ok) return await response.json();
      } catch (_) {}
    }
    return {
      pnr, status: 'Confirmed', coach: 'B2', berth: '34', class: '3A',
      chart_prepared: true, _source: 'simulated'
    };
  }

  async getSeatAvailability(trainId, date) {
    return { available: 20 + Math.floor(Math.random() * 80), total: 120, _source: 'simulated' };
  }
}

module.exports = new TrainAPI();
