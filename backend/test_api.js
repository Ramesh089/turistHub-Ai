
const https = require('https');

const BASE_URL = 'https://turisthub-ai-1.onrender.com';

function request(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;

    const url = new URL(path, BASE_URL);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload
          ? { 'Content-Length': Buffer.byteLength(payload) }
          : {}),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body),
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: { raw: body },
          });
        }
      });
    });

    req.on('error', reject);

    if (payload) {
      req.write(payload);
    }

    req.end();
  });
}

async function run() {
  try {
    console.log('Testing Tourist Hub deployed backend...');

    // Test backend health
    const health = await request('/health');

    console.log('\nHealth Check:');
    console.log('Status:', health.status);
    console.log('Response:', health.data);

    // Test tourist login
    console.log('\nTesting Tourist Login:');

    const touristLogin = await request(
      '/api/auth/login',
      'POST',
      {
        email: 'tourist@example.com',
        password: 'Password@123',
      }
    );

    console.log('Status:', touristLogin.status);
    console.log('Response:', touristLogin.data);

    // Test admin login
    console.log('\nTesting Admin Login:');

    const adminLogin = await request(
      '/api/auth/login',
      'POST',
      {
        email: 'admin@touristhub.in',
        password: 'Admin@123',
      }
    );

    console.log('Status:', adminLogin.status);
    console.log('Response:', adminLogin.data);

    // Continue only if admin login succeeds
    const adminToken = adminLogin.data?.token;

    if (adminLogin.data?.success && adminToken) {
      console.log('\nTesting Admin CRUD endpoints...');

      const hotelCreate = await request(
        '/api/hotels',
        'POST',
        {
          destination_id: 1,
          name: 'Regression Hotel',
          location: 'Test Location',
          price_per_night: 3200,
          rating: 4.7,
          room_type: 'Deluxe',
          amenities: ['WiFi', 'Pool'],
          contact: '9999999999',
          image_url: 'https://example.com/hotel.jpg',
          address: 'Test road, Mysore',
        },
        adminToken
      );

      console.log(
        'Hotel create:',
        hotelCreate.status,
        hotelCreate.data
      );

      const transportCreate = await request(
        '/api/transport',
        'POST',
        {
          destination_id: 1,
          transport_type: 'Cab',
          provider: 'Regression Taxi',
          route: 'Mysore Airport to City',
          departure_time: '08:00',
          arrival_time: '09:00',
          price: 1800,
          duration: '1 hr',
          booking_info: 'Pre-booked dispatch',
        },
        adminToken
      );

      console.log(
        'Transport create:',
        transportCreate.status,
        transportCreate.data
      );

      const guideCreate = await request(
        '/api/guides',
        'POST',
        {
          destination_id: 1,
          name: 'Regression Guide',
          languages: 'English,Hindi',
          experience_years: 7,
          specialization: 'Heritage Walk',
          price_per_day: 2200,
          rating: 4.9,
          contact: '9876543210',
          image_url: 'https://example.com/guide.jpg',
        },
        adminToken
      );

      console.log(
        'Guide create:',
        guideCreate.status,
        guideCreate.data
      );
    } else {
      console.log(
        '\nAdmin login failed or returned no token.',
        'Skipping admin CRUD tests.'
      );
    }

    // Test AI planner
    console.log('\nTesting AI Planner:');

    const plan = await request('/api/ai/plan', 'POST', {
      origin: 'Bengaluru',
      destination: 'Mysore (Mysuru)',
      days: 3,
      budget: 10000,
      traveller_type: 'Couple',
      interests: ['Heritage', 'Culture', 'Food'],
      food_preference: 'Vegetarian',
    });

    console.log('AI Planner status:', plan.status);
    console.log('AI Planner response:', plan.data);
  } catch (error) {
    console.error('API test failed:', error.message);
  }
}

run();
