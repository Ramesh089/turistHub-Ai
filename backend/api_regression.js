const http = require('http');

function request(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
    };

    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
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

(async () => {
  const login = await request('/api/auth/login', 'POST', {
    email: 'admin@touristhub.in',
    password: 'Admin@123'
  });

  const token = login.data.token;

  const hotel = await request('/api/hotels', 'POST', {
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
  }, token);

  const transport = await request('/api/transport', 'POST', {
    destination_id: 1,
    transport_type: 'Cab',
    provider: 'Regression Taxi',
    route: 'Mysore Airport to City',
    departure_time: '08:00',
    arrival_time: '09:00',
    price: 1800,
    duration: '1 hr',
    booking_info: 'Pre-booked dispatch'
  }, token);

  const guide = await request('/api/guides', 'POST', {
    destination_id: 1,
    name: 'Regression Guide',
    languages: 'English,Hindi',
    experience_years: 7,
    specialization: 'Heritage Walk',
    price_per_day: 2200,
    rating: 4.9,
    contact: '9876543210',
    image_url: 'https://example.com/guide.jpg'
  }, token);

  const pkg = await request('/api/packages', 'POST', {
    destination_id: 1,
    title: 'Regression Package',
    company_name: 'Test Tours',
    duration_days: 3,
    duration_nights: 2,
    price: 6500,
    transport_type: 'Cab',
    hotel_type: 'Heritage Stay',
    food_included: true,
    guide_included: true,
    activities: ['Heritage Walk', 'Market Tour'],
    description: 'Regression test package',
    image_url: 'https://example.com/package.jpg'
  }, token);

  console.log(JSON.stringify({
    adminLogin: login.data.success,
    hotelStatus: hotel.status,
    transportStatus: transport.status,
    guideStatus: guide.status,
    packageStatus: pkg.status,
    hotelMessage: hotel.data.message,
    transportMessage: transport.data.message,
    guideMessage: guide.data.message,
    packageMessage: pkg.data.message
  }, null, 2));
})();
