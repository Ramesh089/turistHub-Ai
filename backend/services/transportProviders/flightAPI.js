/**
 * Flight API Integration
 * Connects to Amadeus/Skyscanner API when key is available
 * Falls back to realistic simulated data
 */

const AIRLINES = [
  { code: '6E', name: 'IndiGo', type: 'LCC', logo: '✈️' },
  { code: 'AI', name: 'Air India', type: 'FSC', logo: '🛫' },
  { code: 'SG', name: 'SpiceJet', type: 'LCC', logo: '✈️' },
  { code: 'UK', name: 'Vistara', type: 'FSC', logo: '🛫' },
  { code: 'G8', name: 'Go First', type: 'LCC', logo: '✈️' },
  { code: 'QP', name: 'Akasa Air', type: 'LCC', logo: '✈️' }
];

const AIRPORT_CODES = {
  'bangalore': 'BLR', 'bengaluru': 'BLR', 'delhi': 'DEL', 'new delhi': 'DEL',
  'mumbai': 'BOM', 'chennai': 'MAA', 'kolkata': 'CCU', 'hyderabad': 'HYD',
  'goa': 'GOI', 'jaipur': 'JAI', 'kochi': 'COK', 'pune': 'PNQ',
  'ahmedabad': 'AMD', 'lucknow': 'LKO', 'guwahati': 'GAU', 'varanasi': 'VNS',
  'srinagar': 'SXR', 'leh': 'IXL', 'amritsar': 'ATQ', 'udaipur': 'UDR',
  'jodhpur': 'JDH', 'madurai': 'IXM', 'mangalore': 'IXE', 'mysore': 'MYQ'
};

class FlightAPI {
  constructor() {
    this.apiKey = process.env.AMADEUS_API_KEY || '';
    this.apiSecret = process.env.AMADEUS_API_SECRET || '';
    this.baseUrl = 'https://api.amadeus.com/v2';
    this._accessToken = null;
    this._tokenExpiry = 0;
  }

  async search(from, to, date, passengers = 1) {
    if (this.apiKey && this.apiSecret) {
      try {
        return await this._liveSearch(from, to, date, passengers);
      } catch (err) {
        console.warn('Flight API live search failed:', err.message);
      }
    }
    return this._simulatedSearch(from, to, date, passengers);
  }

  async _getAccessToken() {
    if (this._accessToken && Date.now() < this._tokenExpiry) return this._accessToken;
    const response = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.apiSecret}`
    });
    const data = await response.json();
    this._accessToken = data.access_token;
    this._tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return this._accessToken;
  }

  async _liveSearch(from, to, date, passengers) {
    const token = await this._getAccessToken();
    const fromCode = AIRPORT_CODES[from.toLowerCase()] || from.toUpperCase();
    const toCode = AIRPORT_CODES[to.toLowerCase()] || to.toUpperCase();
    const url = `${this.baseUrl}/shopping/flight-offers?originLocationCode=${fromCode}&destinationLocationCode=${toCode}&departureDate=${date}&adults=${passengers}&max=10`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`Amadeus API returned ${response.status}`);
    const data = await response.json();
    const results = (data.data || []).map((offer, i) => {
      const seg = offer.itineraries?.[0]?.segments?.[0] || {};
      return {
        id: `flight_${offer.id || i}`,
        type: 'Flight',
        airline: seg.carrierCode || '6E',
        airline_name: AIRLINES.find(a => a.code === seg.carrierCode)?.name || seg.carrierCode,
        flight_number: `${seg.carrierCode}${seg.number || ''}`,
        from: seg.departure?.iataCode || fromCode,
        to: seg.arrival?.iataCode || toCode,
        date,
        departure: seg.departure?.at?.split('T')[1]?.substring(0, 5) || '08:00',
        arrival: seg.arrival?.at?.split('T')[1]?.substring(0, 5) || '10:30',
        duration: offer.itineraries?.[0]?.duration || 'PT2H30M',
        price: parseFloat(offer.price?.total) || 4500,
        currency: offer.price?.currency || 'INR',
        seats_available: offer.numberOfBookableSeats || 9,
        cabin_class: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY',
        _source: 'live'
      };
    });
    results._source = 'live';
    return results;
  }

  _simulatedSearch(from, to, date, passengers) {
    const fromCode = AIRPORT_CODES[from.toLowerCase()] || 'BLR';
    const toCode = AIRPORT_CODES[to.toLowerCase()] || 'DEL';
    const count = 4 + Math.floor(Math.random() * 4);
    const results = [];

    for (let i = 0; i < count; i++) {
      const airline = AIRLINES[i % AIRLINES.length];
      const depHour = 5 + Math.floor(Math.random() * 16);
      const durationMin = 90 + Math.floor(Math.random() * 120);
      const arrHour = depHour + Math.floor(durationMin / 60);
      const arrMin = durationMin % 60;
      const isLCC = airline.type === 'LCC';
      const basePrice = isLCC ? 2500 + Math.floor(Math.random() * 3000) : 4000 + Math.floor(Math.random() * 5000);

      results.push({
        id: `flight_${Date.now()}_${i}`,
        type: 'Flight',
        airline: airline.code,
        airline_name: airline.name,
        flight_number: `${airline.code}-${100 + Math.floor(Math.random() * 900)}`,
        from: fromCode,
        to: toCode,
        date,
        departure: `${String(depHour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        arrival: `${String(arrHour % 24).padStart(2, '0')}:${String(arrMin).padStart(2, '0')}`,
        duration: `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`,
        price: basePrice,
        currency: 'INR',
        seats_available: 2 + Math.floor(Math.random() * 30),
        total_seats: 180,
        cabin_class: 'Economy',
        baggage: isLCC ? '15kg check-in + 7kg cabin' : '25kg check-in + 7kg cabin',
        amenities: isLCC ? ['Seat Selection (paid)', 'Snacks (paid)'] : ['Free Meals', 'Entertainment', 'Seat Selection'],
        refundable: !isLCC,
        _source: 'simulated'
      });
    }
    results._source = 'simulated';
    return results;
  }

  async checkPNR(pnr) {
    return {
      pnr, status: 'Confirmed', airline: 'IndiGo', flight: '6E-2045',
      seat: '14A', gate: 'B7', terminal: 'T1', _source: 'simulated'
    };
  }

  async getSeatAvailability(flightId, date) {
    return { available: 5 + Math.floor(Math.random() * 50), total: 180, _source: 'simulated' };
  }
}

module.exports = new FlightAPI();
