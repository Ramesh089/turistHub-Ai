/**
 * Bus API Integration
 * Connects to RedBus/AbhiBus API when key is available
 * Falls back to realistic simulated data
 */

const BUS_OPERATORS = [
  { name: 'KSRTC Airavat', type: 'AC Sleeper', rating: 4.3 },
  { name: 'VRL Travels', type: 'Multi-Axle Volvo', rating: 4.1 },
  { name: 'SRS Travels', type: 'AC Seater', rating: 3.9 },
  { name: 'Orange Tours', type: 'Non-AC Sleeper', rating: 3.7 },
  { name: 'Sugama Tourist', type: 'AC Sleeper', rating: 4.0 },
  { name: 'Durgamba Travels', type: 'Semi-Sleeper', rating: 3.8 },
  { name: 'Neeta Travels', type: 'AC Multi-Axle', rating: 4.2 },
  { name: 'Paulo Travels', type: 'Volvo Sleeper', rating: 4.4 }
];

class BusAPI {
  constructor() {
    this.apiKey = process.env.REDBUS_API_KEY || '';
  }

  async search(from, to, date, passengers = 1) {
    if (this.apiKey) {
      try {
        return await this._liveSearch(from, to, date, passengers);
      } catch (err) {
        console.warn('Bus API live search failed:', err.message);
      }
    }
    return this._simulatedSearch(from, to, date, passengers);
  }

  async _liveSearch(from, to, date, passengers) {
    const url = `https://api.redbus.in/v1/search?source=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&date=${date}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error(`Bus API returned ${response.status}`);
    const data = await response.json();
    const results = (data.buses || []).map((b, i) => ({
      id: `bus_${b.id || i}`,
      type: 'Bus',
      operator: b.operator || 'Bus Service',
      bus_type: b.busType || 'AC Sleeper',
      from, to, date,
      departure: b.departureTime || '21:00',
      arrival: b.arrivalTime || '06:00',
      duration: b.duration || '9h',
      price: b.fare || 800,
      seats_available: b.availableSeats || 20,
      total_seats: b.totalSeats || 40,
      rating: b.rating || 4.0,
      amenities: b.amenities || ['AC', 'Charging Point'],
      _source: 'live'
    }));
    results._source = 'live';
    return results;
  }

  _simulatedSearch(from, to, date, passengers) {
    const count = 4 + Math.floor(Math.random() * 4);
    const results = [];
    for (let i = 0; i < count; i++) {
      const op = BUS_OPERATORS[i % BUS_OPERATORS.length];
      const depHour = 18 + Math.floor(Math.random() * 6); // Evening departures
      const durationH = 5 + Math.floor(Math.random() * 8);
      const arrHour = (depHour + durationH) % 24;
      const isAC = op.type.includes('AC');

      results.push({
        id: `bus_${Date.now()}_${i}`,
        type: 'Bus',
        operator: op.name,
        bus_type: op.type,
        from, to, date,
        departure: `${String(depHour).padStart(2, '0')}:${Math.random() > 0.5 ? '00' : '30'}`,
        arrival: `${String(arrHour).padStart(2, '0')}:${Math.random() > 0.5 ? '15' : '45'}`,
        duration: `${durationH}h ${Math.floor(Math.random() * 60)}m`,
        price: isAC ? 600 + Math.floor(Math.random() * 800) : 300 + Math.floor(Math.random() * 400),
        seats_available: 5 + Math.floor(Math.random() * 30),
        total_seats: 40,
        rating: op.rating,
        amenities: isAC
          ? ['AC', 'Blanket', 'Water Bottle', 'Charging Point', 'GPS Tracking']
          : ['Blanket', 'Water Bottle'],
        boarding_points: [`${from} Central Bus Stand`, `${from} Majestic`],
        dropping_points: [`${to} Bus Stand`, `${to} City Center`],
        cancellation_policy: 'Free cancellation up to 6 hours before departure',
        _source: 'simulated'
      });
    }
    results._source = 'simulated';
    return results;
  }

  async checkBooking(bookingId) {
    return {
      booking_id: bookingId, status: 'Confirmed', seat: 'L12',
      boarding_point: 'Central Bus Stand', _source: 'simulated'
    };
  }

  async getSeatAvailability(busId, date) {
    return { available: 8 + Math.floor(Math.random() * 25), total: 40, _source: 'simulated' };
  }
}

module.exports = new BusAPI();
