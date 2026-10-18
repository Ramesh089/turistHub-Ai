const http = require('http');

function request(url, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: url,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (err) {
          resolve({ status: res.statusCode, data: { raw: body } });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('Testing Tourist Login:');
  const touristLogin = await request('/api/auth/login', 'POST', { email: 'tourist@example.com', password: 'Password@123' });
  console.log('Tourist response:', touristLogin.data.success, touristLogin.data.user?.name, touristLogin.data.user?.role);

  console.log('Testing Admin Login:');
  const adminLogin = await request('/api/auth/login', 'POST', { email: 'admin@touristhub.in', password: 'Admin@123' });
  console.log('Admin response:', adminLogin.data.success, adminLogin.data.user?.name, adminLogin.data.user?.role);

  const adminToken = adminLogin.data.token;

  console.log('Testing Admin CRUD endpoints:');
  const hotelCreate = await request('/api/hotels', 'POST', {
    destination_id: 1,
    name: 'Regression Hotel',
    location: 'Test Location',
    price_per_night: 3200,
    rating: 4.7,
    room_type: 'Deluxe',
    amenities: ['WiFi', 'Pool'],
    contact: '9999999999',
    image_url: 'https://example.com/hotel.jpg',
    address: 'Test road, Mysore'
  }, adminToken);
  console.log('Hotel create status:', hotelCreate.status, hotelCreate.data.success, hotelCreate.data.message);

  const transportCreate = await request('/api/transport', 'POST', {
    destination_id: 1,
    transport_type: 'Cab',
    provider: 'Regression Taxi',
    route: 'Mysore Airport to City',
    departure_time: '08:00',
    arrival_time: '09:00',
    price: 1800,
    duration: '1 hr',
    booking_info: 'Pre-booked dispatch'
  }, adminToken);
  console.log('Transport create status:', transportCreate.status, transportCreate.data.success, transportCreate.data.message);

  const guideCreate = await request('/api/guides', 'POST', {
    destination_id: 1,
    name: 'Regression Guide',
    languages: 'English,Hindi',
    experience_years: 7,
    specialization: 'Heritage Walk',
    price_per_day: 2200,
    rating: 4.9,
    contact: '9876543210',
    image_url: 'https://example.com/guide.jpg'
  }, adminToken);
  console.log('Guide create status:', guideCreate.status, guideCreate.data.success, guideCreate.data.message);

  console.log('Testing AI Planner:');
  const plan = await request('/api/ai/plan', 'POST', {
    origin: 'Bengaluru',
    destination: 'Mysore (Mysuru)',
    days: 3,
    budget: 10000,
    traveller_type: 'Couple',
    interests: ['Heritage', 'Culture', 'Food'],
    food_preference: 'Vegetarian'
  });
  console.log('AI Plan generated:', plan.data.success, 'Days:', plan.data.plan?.itinerary?.length, 'Budget:', plan.data.plan?.total_budget);
}

run().catch(console.error);
