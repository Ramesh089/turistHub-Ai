const bcrypt = require('bcryptjs');
const pool = require('./db');

async function seed() {
  console.log('🌱 Starting database seeding for Tourist AI Hub...');

  try {
    // Ensure columns exist on legacy tables
    try {
      await pool.query("ALTER TABLE users ADD COLUMN role ENUM('Tourist', 'Admin') DEFAULT 'Tourist' AFTER password_hash");
    } catch (e) {
      // already exists
    }
    try {
      await pool.query("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) NULL AFTER role");
    } catch (e) {
      // already exists
    }

    // 1. Insert/Update Users
    const touristPass = await bcrypt.hash('Password@123', 10);
    const adminPass = await bcrypt.hash('Admin@123', 10);

    // Clean existing seed users if any
    await pool.query('DELETE FROM users WHERE email IN (?, ?)', ['tourist@example.com', 'admin@touristhub.in']);

    const [touristRes] = await pool.query(
      `INSERT INTO users (full_name, username, email, phone, password_hash, role) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['Aarav Sharma', 'aarav', 'tourist@example.com', '+91 9876543210', touristPass, 'Tourist']
    );
    const touristId = touristRes.insertId;

    const [adminRes] = await pool.query(
      `INSERT INTO users (full_name, username, email, phone, password_hash, role) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['Priya Nair (Admin)', 'priya', 'admin@touristhub.in', '+91 9123456780', adminPass, 'Admin']
    );
    const adminId = adminRes.insertId;

    console.log(`✅ Users created: Tourist ID (${touristId}), Admin ID (${adminId})`);

    // 2. Insert User Preferences for Demo Tourist
    await pool.query('DELETE FROM user_preferences WHERE user_id = ?', [touristId]);
    await pool.query(
      `INSERT INTO user_preferences (user_id, travel_type, budget_range, preferred_transport, interests, food_preference, preferred_duration)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [touristId, 'Couple', 'Moderate', 'Train', JSON.stringify(['Heritage', 'Nature', 'Culture', 'Food', 'Photography']), 'Vegetarian', 4]
    );

    // 3. Seed Indian States
    const statesData = [
      {
        name: 'Karnataka',
        code: 'KA',
        capital: 'Bengaluru',
        description: 'One State, Many Worlds. Land of the grand Vijayanagara empire, misty coffee plantations of Coorg, pristine Arabian Sea beaches, and royal Mysore heritage.',
        image_url: 'https://images.unsplash.com/photo-1600100397608-f010f443b740?auto=format&fit=crop&w=1200&q=80',
        best_time: 'October to March',
        highlights: 'Hampi, Mysore Palace, Coorg Hills, Gokarna Beaches, Badami Caves'
      },
      {
        name: 'Kerala',
        code: 'KL',
        capital: 'Thiruvananthapuram',
        description: 'God\'s Own Country. Serene emerald backwaters, lush misty tea valleys of Munnar, ayurvedic traditions, and vibrant Kathakali performances.',
        image_url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
        best_time: 'September to March',
        highlights: 'Alleppey Houseboats, Munnar Tea Valleys, Fort Kochi, Wayanad Wildlife, Varkala Cliffs'
      },
      {
        name: 'Rajasthan',
        code: 'RJ',
        capital: 'Jaipur',
        description: 'The Land of Kings. Magnificent sandstone forts, glittering golden desert dunes, regal palaces, vibrant folk music, and legendary royal hospitality.',
        image_url: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80',
        best_time: 'October to March',
        highlights: 'Jaipur Pink City, Udaipur Lake Palace, Jaisalmer Golden Fort, Jodhpur Blue City, Pushkar'
      },
      {
        name: 'Goa',
        code: 'GA',
        capital: 'Panaji',
        description: 'Pearl of the Orient. Golden sun-kissed beaches, UNESCO Portuguese heritage churches, vibrant spice plantations, and thrilling water adventures.',
        image_url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
        best_time: 'November to February',
        highlights: 'Baga Beach, Dudhsagar Waterfalls, Basilica of Bom Jesus, Old Goa, Fontainhas Latin Quarter'
      },
      {
        name: 'Uttar Pradesh',
        code: 'UP',
        capital: 'Lucknow',
        description: 'Heartland of Indian Spirituality and Architectural Grandeur. Home to timeless Varanasi Ghats, the legendary Taj Mahal, and divine cultural traditions.',
        image_url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80',
        best_time: 'October to March',
        highlights: 'Varanasi Ganga Ghats, Taj Mahal Agra, Sarnath, Ayodhya, Lucknow Awadhi Heritage'
      },
      {
        name: 'Himachal Pradesh',
        code: 'HP',
        capital: 'Shimla',
        description: 'Land of Gods. Snow-capped Himalayan ranges, scenic pine forests, apple orchards, spiritual monasteries, and thrilling high-altitude treks.',
        image_url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80',
        best_time: 'March to June & Sept to Nov',
        highlights: 'Manali, Spiti Valley, Shimla Mall Road, Dharamshala, Kasol'
      }
    ];

    const stateMap = {};
    for (const st of statesData) {
      const [existing] = await pool.query('SELECT id FROM states WHERE code = ? OR name = ?', [st.code, st.name]);
      if (existing.length > 0) {
        stateMap[st.code] = existing[0].id;
        await pool.query(
          'UPDATE states SET name=?, code=?, capital=?, description=?, image_url=?, best_time=?, highlights=? WHERE id=?',
          [st.name, st.code, st.capital, st.description, st.image_url, st.best_time, st.highlights, existing[0].id]
        );
      } else {
        const [res] = await pool.query(
          'INSERT INTO states (name, code, capital, description, image_url, best_time, highlights) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [st.name, st.code, st.capital, st.description, st.image_url, st.best_time, st.highlights]
        );
        stateMap[st.code] = res.insertId;
      }
    }
    console.log('✅ States seeded');

    // 4. Seed Tourist Places (Destinations)
    const placesData = [
      {
        state_code: 'KA',
        name: 'Hampi',
        location: 'Vijayanagara District, Karnataka',
        category: 'Heritage',
        image_url: 'https://images.unsplash.com/photo-1600100397608-f010f443b740?auto=format&fit=crop&w=1200&q=80',
        gallery_urls: JSON.stringify([
          'https://images.unsplash.com/photo-1600100397608-f010f443b740?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1000&q=80'
        ]),
        description: 'UNESCO World Heritage site nestled along the Tungabhadra River, showcasing the colossal stone architecture and forgotten ruins of the 14th-century Vijayanagara Empire.',
        history: 'Hampi was the capital of the Vijayanagara Empire from 1336 to 1565. At its peak, it was the second largest city in the medieval world, praised by Persian and Portuguese traders for its fabulous wealth and grand bazaars.',
        culture_info: 'Rich blend of Dravidian stone architecture, vibrant annual Hampi Utsav celebrations, classical music traditions, and rocky boulder landscapes.',
        best_time_to_visit: 'November to February',
        major_attractions: JSON.stringify(['Virupaksha Temple', 'Vittala Stone Chariot', 'Lotus Mahal', 'Elephant Stables', 'Matanga Hill Sunrise', 'Tungabhadra Coracle Ride']),
        activities: JSON.stringify(['Bouldering & Rock Climbing', 'Sunrise Trek to Matanga Hill', 'Coracle Boat Ride on Tungabhadra', 'Cycling along ancient ruins', 'Photography Tour']),
        local_food: JSON.stringify(['North Karnataka Jowar Roti Oota', 'Ennegai Badanekayi (Stuffed Brinjal)', 'Mirchi Bajji', 'Banana Flower Curry', 'Filter Coffee']),
        local_transport: JSON.stringify(['Bicycle Rentals (₹100/day)', 'Moped & Scooter Rentals (₹400/day)', 'Auto Rickshaws', 'E-Carts inside Monument Complex']),
        estimated_cost_per_day: 2500.00,
        recommended_duration_days: 3,
        rating: 4.9,
        reviews_count: 340,
        latitude: 15.3350,
        longitude: 76.4600
      },
      {
        state_code: 'KA',
        name: 'Mysore (Mysuru)',
        location: 'Mysuru District, Karnataka',
        category: 'Culture',
        image_url: 'https://images.unsplash.com/photo-1580835845971-a393b73bf370?auto=format&fit=crop&w=1200&q=80',
        gallery_urls: JSON.stringify([
          'https://images.unsplash.com/photo-1580835845971-a393b73bf370?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1000&q=80'
        ]),
        description: 'The City of Palaces, renowned for its majestic Indo-Saracenic Mysore Palace illuminated by nearly 100,000 bulbs, fragrant sandalwood, rich silk, and royal Dasara festivities.',
        history: 'Ruled by the illustrious Wadiyar Dynasty for six centuries, Mysore flourished as a cradle of art, classical Carnatic music, architecture, and South Indian intellectual movements.',
        culture_info: 'Famed for Mysore Silk sarees, traditional Mysore Pak sweet, sandalwood carving, Ganjifa art, and the world-renowned 10-day Dasara procession (Jumboo Savari).',
        best_time_to_visit: 'September to March',
        major_attractions: JSON.stringify(['Mysore Palace', 'Chamundeshwari Temple (Chamundi Hill)', 'Brindavan Gardens & Musical Fountain', 'Devaraja Heritage Market', 'St. Philomena\'s Cathedral', 'Karanji Lake']),
        activities: JSON.stringify(['Palace Illumination Viewing', 'Heritage Walk through Devaraja Market', 'Mysore Silk Weaving Workshop', 'Yoga & Meditation Retreat', 'Climbing 1000 steps of Chamundi Hill']),
        local_food: JSON.stringify(['Original Melt-in-mouth Mysore Pak', 'Mylari Dosa with white butter', 'Mysore Bonda', 'Bisi Bele Bath', 'Maddur Vada']),
        local_transport: JSON.stringify(['Prepaid Auto Rickshaws', 'KSRTC City Buses', 'App Cabs (Ola/Uber)', 'Horse-drawn Royal Tongas']),
        estimated_cost_per_day: 3200.00,
        recommended_duration_days: 3,
        rating: 4.8,
        reviews_count: 512,
        latitude: 12.2958,
        longitude: 76.6394
      },
      {
        state_code: 'KA',
        name: 'Coorg (Kodagu)',
        location: 'Kodagu District, Karnataka',
        category: 'Nature',
        image_url: 'https://images.unsplash.com/photo-1592388748465-8c4dce9ea9e0?auto=format&fit=crop&w=1200&q=80',
        gallery_urls: JSON.stringify([
          'https://images.unsplash.com/photo-1592388748465-8c4dce9ea9e0?auto=format&fit=crop&w=1000&q=80'
        ]),
        description: 'Known as the Scotland of India, Coorg is an emerald paradise of sprawling coffee plantations, cascading Abbey falls, mist-draped Western Ghat peaks, and warrior Kodava hospitality.',
        history: 'Kodagu was an independent kingdom ruled by the Haleri dynasty until the British annexation in 1834. The Kodavas are renowned for their martial heritage and distinct social customs.',
        culture_info: 'Kodava martial culture, Kodava traditional attire (Kupya), Kailpodh harvest festival, and aromatic Arabica and Robusta coffee estates.',
        best_time_to_visit: 'October to May',
        major_attractions: JSON.stringify(['Abbey Falls', 'Raja\'s Seat Sunset Viewpoint', 'Namdroling Golden Temple (Bylakuppe)', 'Dubare Elephant Camp', 'Tadiandamol Peak Trek']),
        activities: JSON.stringify(['Coffee Plantation Estate Walk & Tasting', 'White Water Rafting on Barapole River', 'River Bathing with Elephants at Dubare', 'Trek to Tadiandamol Peak', 'Campfire at Heritage Homestays']),
        local_food: JSON.stringify(['Pandi Curry (Traditional Kodava preparation)', 'Kadambuttu (Steamed Rice Dumplings)', 'Noolputtu with Koli Curry', 'Bamboo Shoot Curry', 'Fresh Filter Estate Coffee']),
        local_transport: JSON.stringify(['Private Cabs & Jeeps (ideal for hilly terrain)', 'KSRTC State Buses', 'Rental Self-drive Cars']),
        estimated_cost_per_day: 3500.00,
        recommended_duration_days: 3,
        rating: 4.8,
        reviews_count: 280,
        latitude: 12.3375,
        longitude: 75.8069
      },
      {
        state_code: 'KL',
        name: 'Munnar',
        location: 'Idukki District, Kerala',
        category: 'Nature',
        image_url: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80',
        gallery_urls: JSON.stringify([
          'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=80'
        ]),
        description: 'Idyllic hill station at 1,600m above sea level with undulating tea gardens, misty clouds, cool mountain breeze, and home to the endangered Nilgiri Tahr.',
        history: 'Originally inhabited by the Muthuvan tribal community, Munnar was developed into a British summer retreat and tea capital in the late 19th century by the Duke of Wellington.',
        culture_info: 'Tea heritage museum culture, spice cultivation (cardamom, pepper, cloves), and native Nilgiri Tahr conservation at Eravikulam.',
        best_time_to_visit: 'September to March',
        major_attractions: JSON.stringify(['Eravikulam National Park', 'Mattupetty Dam & Speedboating', 'Tea Museum Tata', 'Top Station Panoramic View', 'Anamudi Peak (Highest in South India)']),
        activities: JSON.stringify(['Tea Plucking & Processing Experience', 'Trekking through spice plantations', 'Boating at Mattupetty Lake', 'Spotting Nilgiri Tahr', 'Watching Kathakali & Kalaripayattu']),
        local_food: JSON.stringify(['Kerala Appam with Vegetable Stew', 'Puttu and Kadala Curry', 'Malabar Parotta with Kerala Roast', 'Cardamom Spiced Chai', 'Banana Chips in Coconut Oil']),
        local_transport: JSON.stringify(['Local Taxis & 4x4 Jeeps', 'Auto Rickshaws', 'Kerala RTC Buses']),
        estimated_cost_per_day: 3200.00,
        recommended_duration_days: 3,
        rating: 4.9,
        reviews_count: 420,
        latitude: 10.0889,
        longitude: 77.0595
      },
      {
        state_code: 'KL',
        name: 'Alappuzha (Alleppey)',
        location: 'Alappuzha District, Kerala',
        category: 'Beach',
        image_url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
        gallery_urls: JSON.stringify([
          'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=80'
        ]),
        description: 'The Venice of the East, famous for tranquil backwater cruises on traditional kettuvallam houseboats drifting through coconut-fringed palm canals and lagoons.',
        history: 'Carved out by Raja Kesavadas in 1762 as a prime port for coir, spice, and pepper trade across the Arabian sea.',
        culture_info: 'Nehru Trophy Snake Boat Race (Vallam Kali), Coir weaving artisan villages, and serene backwater village life.',
        best_time_to_visit: 'November to February',
        major_attractions: JSON.stringify(['Vembanad Lake Houseboat Cruise', 'Alappuzha Beach & 150-yr Old Pier', 'Kuttanad (Farming below sea level)', 'Marari Beach', 'Krishnapuram Palace']),
        activities: JSON.stringify(['Overnight Luxury Houseboat Cruise', 'Village Canoe Tour with local fishermen', 'Watching Sunset at Alappuzha Lighthouse', 'Ayurvedic Abhyanga Massage']),
        local_food: JSON.stringify(['Karimeen Pollichathu (Pearl Spot Fish wrapped in banana leaf)', 'Traditional Kerala Sadhya on Plantain Leaf', 'Thalassery Biryani', 'Fresh Tender Coconut']),
        local_transport: JSON.stringify(['Water Taxis & Public Ferries', 'Auto Rickshaws', 'Cycle Rentals along coastal roads']),
        estimated_cost_per_day: 4000.00,
        recommended_duration_days: 2,
        rating: 4.8,
        reviews_count: 460,
        latitude: 9.4981,
        longitude: 76.3388
      },
      {
        state_code: 'RJ',
        name: 'Jaipur (The Pink City)',
        location: 'Jaipur District, Rajasthan',
        category: 'Heritage',
        image_url: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80',
        gallery_urls: JSON.stringify([
          'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1000&q=80'
        ]),
        description: 'India\'s first planned city painted terracotta pink in 1876 to welcome the Prince of Wales, brimming with UNESCO World Heritage forts, astronomical marvels, and royal palaces.',
        history: 'Founded in 1727 by Maharaja Sawai Jai Singh II, designed on the ancient principles of Vastu Shastra by Bengali architect Vidyadhar Bhattacharya.',
        culture_info: 'Blue Pottery, Johari Bazaar jewelry, Kathputli puppet theatre, Ghoomar dance, and royal Rajputana bravery legends.',
        best_time_to_visit: 'October to March',
        major_attractions: JSON.stringify(['Hawa Mahal (Palace of Winds)', 'Amber Fort & Sheesh Mahal', 'City Palace & Museum', 'Jantar Mantar Astronomical Observatory', 'Nahargarh Fort Sunset', 'Jal Mahal']),
        activities: JSON.stringify(['Elephant/Jeep Ride to Amber Fort', 'Shopping for Blue Pottery & Bandhani textiles', 'Hot Air Balloon Safari over Aravalli Hills', 'Sound & Light Show at Amber Fort', 'Traditional Rajasthani Chokhi Dhani Dinner']),
        local_food: JSON.stringify(['Dal Baati Churma with Pure Desi Ghee', 'Ghevar Sweet from LMB', 'Pyaaz Kachori with spicy tamarind chutney', 'Laal Maas', 'Mawa Kachori']),
        local_transport: JSON.stringify(['Jaipur Metro', 'E-Rickshaws & Auto Rickshaws', 'App Cabs (Uber/Ola)', 'Heritage Open-Top Jeeps']),
        estimated_cost_per_day: 3500.00,
        recommended_duration_days: 3,
        rating: 4.9,
        reviews_count: 650,
        latitude: 26.9124,
        longitude: 75.7873
      },
      {
        state_code: 'RJ',
        name: 'Udaipur (City of Lakes)',
        location: 'Udaipur District, Rajasthan',
        category: 'Heritage',
        image_url: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1200&q=80',
        gallery_urls: JSON.stringify([
          'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1000&q=80'
        ]),
        description: 'Often called the Venice of the East and India\'s most romantic city, framed by the shimmering waters of Lake Pichola and the rugged Aravalli range.',
        history: 'Founded in 1559 by Maharana Udai Singh II as the capital of the Sisodia Rajput kingdom of Mewar after the fall of Chittorgarh.',
        culture_info: 'Mewari miniature paintings, Dharohar folk dance at Bagore Ki Haveli, Mewar royalty customs, and lakeside candlelit dining.',
        best_time_to_visit: 'September to March',
        major_attractions: JSON.stringify(['City Palace Complex', 'Lake Pichola & Jag Mandir', 'Taj Lake Palace', 'Saheliyon Ki Bari', 'Bagore Ki Haveli Folk Museum', 'Monsoon Palace (Sajjangarh)']),
        activities: JSON.stringify(['Sunset Boat Cruise on Lake Pichola', 'Dharohar Cultural Folk Dance Show', 'Ropeway ride to Karni Mata Temple', 'Vintage Car Museum Tour', 'Walking the heritage Old City alleys']),
        local_food: JSON.stringify(['Udaipuri Dal Baati Churma', 'Ker Sangri Sabzi', 'Gatte Ki Sabzi', 'Gulab Halwa', 'Kullad Chai at Sukhadia Circle']),
        local_transport: JSON.stringify(['Auto Rickshaws', 'Lake Ferries & Speedboats', 'Walking along pedestrianized Old City']),
        estimated_cost_per_day: 4200.00,
        recommended_duration_days: 3,
        rating: 4.9,
        reviews_count: 530,
        latitude: 24.5854,
        longitude: 73.7125
      },
      {
        state_code: 'GA',
        name: 'Goa (Panaji & North Beaches)',
        location: 'North Goa District, Goa',
        category: 'Beach',
        image_url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
        gallery_urls: JSON.stringify([
          'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80'
        ]),
        description: 'A vibrant blend of sun, sea, Portuguese colonial architecture in Fontainhas Latin quarter, scenic coastal forts, and thrilling watersports along the Arabian Sea.',
        history: 'Under Portuguese colonial rule for over 450 years until liberation in 1961, giving Goa its distinctive European-Indian syncretic architecture and lifestyle.',
        culture_info: 'Goan Carnival, Shigmo spring festival, Mandovi River music cruises, Fado singing, and cashew feni traditions.',
        best_time_to_visit: 'November to February',
        major_attractions: JSON.stringify(['Basilica of Bom Jesus (UNESCO)', 'Fort Aguada & Lighthouse', 'Baga & Calangute Beach', 'Fontainhas Latin Quarter Panaji', 'Dudhsagar Waterfalls Trek', 'Anjuna Flea Market']),
        activities: JSON.stringify(['Parasailing & Jet Skiing at Baga', 'Mandovi River Sunset Cruise', 'Heritage Walk through Fontainhas Latin Quarter', 'Dudhsagar Jeep Safari', 'Scuba Diving at Grande Island']),
        local_food: JSON.stringify(['Goan Fish Curry with steamed rice', 'Pork Vindaloo / Mushroom Xacuti', 'Bebinca 7-layer traditional dessert', 'Poi bread with Chouriço', 'Feni & Kokum Solkadhi']),
        local_transport: JSON.stringify(['Scooter / Activa Rental (₹350-500/day)', 'Goa Miles App Taxi', 'Self-drive Thar / Swift', 'Pilot Motorcycle Taxis']),
        estimated_cost_per_day: 3500.00,
        recommended_duration_days: 4,
        rating: 4.8,
        reviews_count: 890,
        latitude: 15.2993,
        longitude: 74.1240
      },
      {
        state_code: 'UP',
        name: 'Varanasi (Kashi)',
        location: 'Varanasi District, Uttar Pradesh',
        category: 'Spiritual',
        image_url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80',
        gallery_urls: JSON.stringify([
          'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1000&q=80'
        ]),
        description: 'One of the world\'s oldest continually inhabited cities, the spiritual heart of India where sacred Ghats line the holy Ganges, bells resonate, and centuries-old rituals unfold daily.',
        history: 'Mark Twain wrote: "Benares is older than history, older than tradition, older even than legend, and looks twice as old as all of them put together." Venerated in Hindu scriptures as the abode of Lord Shiva.',
        culture_info: 'Mesmerizing evening Ganga Aarti at Dashashwamedh Ghat, Benares Gharana classical music, Banarasi handloom silk sarees, and ancient Sanskrit learning.',
        best_time_to_visit: 'October to March',
        major_attractions: JSON.stringify(['Dashashwamedh Ghat Ganga Aarti', 'Kashi Vishwanath Golden Temple Corridor', 'Assi Ghat Sunrise', 'Sarnath (Buddha\'s First Sermon)', 'Manikarnika Ghat', 'Ramnagar Fort']),
        activities: JSON.stringify(['Dawn Rowboat Ride along 84 Ghats', 'Witnessing Grand Evening Ganga Aarti', 'Walking through ancient narrow Galis', 'Silk Weaving loom tour', 'Subah-e-Banaras classical morning music at Assi']),
        local_food: JSON.stringify(['Kachori Sabzi with Jalebi breakfast', 'Banarasi Paan (Paan with meetha masala)', 'Tamatar Chaat at Kashi Chaat Bhandar', 'Malaiyo (Winter saffron milk foam)', 'Thandai with dry fruits']),
        local_transport: JSON.stringify(['Cycle Rickshaws (ideal for alleys)', 'E-Rickshaws on main roads', 'Traditional wooden rowing boats on Ganges']),
        estimated_cost_per_day: 2200.00,
        recommended_duration_days: 3,
        rating: 4.9,
        reviews_count: 740,
        latitude: 25.3176,
        longitude: 82.9739
      }
    ];

    const placeMap = {};
    for (const p of placesData) {
      const stateId = stateMap[p.state_code];
      const [existing] = await pool.query('SELECT id FROM tourist_places WHERE name = ?', [p.name]);
      if (existing.length > 0) {
        placeMap[p.name] = existing[0].id;
        await pool.query(
          `UPDATE tourist_places SET description=?, history=?, culture_info=?, major_attractions=?, activities=?, local_food=?, local_transport=?, estimated_cost_per_day=?, recommended_duration_days=? WHERE id=?`,
          [p.description, p.history, p.culture_info, p.major_attractions, p.activities, p.local_food, p.local_transport, p.estimated_cost_per_day, p.recommended_duration_days, existing[0].id]
        );
      } else {
        const [res] = await pool.query(
          `INSERT INTO tourist_places (state_id, name, location, category, image_url, gallery_urls, description, history, culture_info, best_time_to_visit, major_attractions, activities, local_food, local_transport, estimated_cost_per_day, recommended_duration_days, rating, reviews_count, latitude, longitude)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [stateId, p.name, p.location, p.category, p.image_url, p.gallery_urls, p.description, p.history, p.culture_info, p.best_time_to_visit, p.major_attractions, p.activities, p.local_food, p.local_transport, p.estimated_cost_per_day, p.recommended_duration_days, p.rating, p.reviews_count, p.latitude, p.longitude]
        );
        placeMap[p.name] = res.insertId;
      }
    }
    console.log('✅ Tourist Places seeded');

    // 5. Seed Cultures & Festivals
    await pool.query('DELETE FROM cultures');
    await pool.query('DELETE FROM festivals');

    const culturesData = [
      {
        state_id: stateMap['KA'],
        title: 'Yakshagana – Karnataka Folk & Classical Theatre',
        category: 'Folk Theatre & Dance',
        description: 'A traditional theatre form of coastal Karnataka combining dance, music, dialogue, elaborate facial makeup, and towering headdresses depicting mythological epics.',
        image_url: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80'
      },
      {
        state_id: stateMap['KL'],
        title: 'Kathakali – Classical Dance Drama of Kerala',
        category: 'Classical Dance',
        description: 'Vibrant, dramatic dance-drama known for its distinctive green makeup (Paccha), ornate costumes, and expressive facial and eye movements portraying Ramayana & Mahabharata stories.',
        image_url: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80'
      },
      {
        state_id: stateMap['RJ'],
        title: 'Ghoomar Dance & Kalbelia Folk Heritage',
        category: 'Folk Dance',
        description: 'Mesmerizing traditional Rajasthani dance where women in colorful swirling ghaghras pirouette gracefully to beats of the dhol, celebrating weddings and harvest.',
        image_url: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80'
      },
      {
        state_id: stateMap['UP'],
        title: 'Kathak Classical Dance & Ganga Aarti Tradition',
        category: 'Classical Dance & Sacred Ritual',
        description: 'Expressive classical North Indian dance form with intricate rhythmic footwork and pirouettes, alongside the sacred multi-tiered brass lamp Ganga Aarti on the sacred ghats.',
        image_url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80'
      }
    ];

    for (const c of culturesData) {
      await pool.query(
        'INSERT INTO cultures (state_id, title, category, description, image_url) VALUES (?, ?, ?, ?, ?)',
        [c.state_id, c.title, c.category, c.description, c.image_url]
      );
    }

    const festivalsData = [
      {
        state_id: stateMap['KA'],
        name: 'Mysore Dasara',
        month_season: 'September / October',
        description: 'The state festival (Nadahabba) celebrated with immense grandeur for 10 days, culminating in the Jumboo Savari elephant procession carrying Goddess Chamundeshwari.',
        significance: 'Celebrates the victory of good over evil, marking the triumph of Goddess Durga over demon Mahishasura.',
        image_url: 'https://images.unsplash.com/photo-1580835845971-a393b73bf370?auto=format&fit=crop&w=800&q=80'
      },
      {
        state_id: stateMap['KL'],
        name: 'Onam Harvest & Boat Races',
        month_season: 'August / September',
        description: 'Kerala\'s most beloved festival featuring elaborate floral carpets (Pookalam), grand 26-dish Onam Sadhya feasts, and thunderous snake boat races on Vembanad Lake.',
        significance: 'Welcomes the mythical King Mahabali back to his cherished homeland with joy and harmony.',
        image_url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80'
      },
      {
        state_id: stateMap['RJ'],
        name: 'Pushkar Camel Fair & Desert Festival',
        month_season: 'November',
        description: 'One of the world\'s largest livestock fairs with 50,000 camels dressed in vibrant ornaments, folk dances, hot-air balloons, and sacred holy dips in Pushkar Lake.',
        significance: 'Centuries-old cultural gathering coinciding with the auspicious Kartik Purnima full moon.',
        image_url: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80'
      },
      {
        state_id: stateMap['UP'],
        name: 'Dev Deepawali (Varanasi)',
        month_season: 'November (Kartik Purnima)',
        description: 'Over 1 million clay earthen lamps (diyas) illuminate all 84 ghats of Varanasi, creating a cosmic galaxy of lights reflecting upon the holy Ganges river.',
        significance: 'Believed to be the night when gods descend to earth to bathe in the sacred river Ganges.',
        image_url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80'
      }
    ];

    for (const f of festivalsData) {
      await pool.query(
        'INSERT INTO festivals (state_id, name, month_season, description, significance, image_url) VALUES (?, ?, ?, ?, ?, ?)',
        [f.state_id, f.name, f.month_season, f.description, f.significance, f.image_url]
      );
    }
    console.log('✅ Cultures & Festivals seeded');

    // 6. Seed Tour Packages
    await pool.query('DELETE FROM travel_packages');
    const packagesData = [
      {
        destination_name: 'Mysore (Mysuru)',
        title: 'Royal Karnataka Heritage Trail – Mysore & Srirangapatna',
        company_name: 'Incredible South Journeys',
        duration_days: 4,
        duration_nights: 3,
        price: 12999.00,
        transport_type: 'AC Luxury Coach / Private Cab',
        hotel_type: '4-Star Heritage Palace Hotel',
        food_included: true,
        guide_included: true,
        activities: JSON.stringify(['Mysore Palace Guided Tour', 'Chamundi Hill Darshan', 'Brindavan Musical Fountain', 'Devaraja Market Silk Walk', 'Srirangapatna Fort']),
        description: 'Immerse in the royal grandeur of the Wadiyar dynasty. Experience palace illuminations, authentic Mysore pak, private transport, and licensed government tourist guides.',
        image_url: 'https://images.unsplash.com/photo-1580835845971-a393b73bf370?auto=format&fit=crop&w=800&q=80',
        rating: 4.9
      },
      {
        destination_name: 'Hampi',
        title: 'Vijayanagara Empires Uncovered – Hampi Explorer',
        company_name: 'Himalayan & Deccan Expeditions',
        duration_days: 3,
        duration_nights: 2,
        price: 9499.00,
        transport_type: 'AC Train Transfers + Private Jeeps',
        hotel_type: '3-Star Heritage Boulder Resort',
        food_included: true,
        guide_included: true,
        activities: JSON.stringify(['Vittala Musical Pillars & Stone Chariot', 'Virupaksha Sunset Tour', 'Coracle Ride on Tungabhadra', 'Matanga Hill Sunrise Trek']),
        description: 'Journey back in time to the 14th-century Vijayanagara Empire. Uncover ancient temples, boulders, and sunset vistas with experienced heritage archaeologists.',
        image_url: 'https://images.unsplash.com/photo-1600100397608-f010f443b740?auto=format&fit=crop&w=800&q=80',
        rating: 4.85
      },
      {
        destination_name: 'Munnar',
        title: 'Misty Valleys & Tea Trails – Munnar & Thekkady Escape',
        company_name: 'Kerala Green Holidays',
        duration_days: 4,
        duration_nights: 3,
        price: 14500.00,
        transport_type: 'Private AC Sedan Car',
        hotel_type: 'Luxury Tea Plantation Resort',
        food_included: true,
        guide_included: true,
        activities: JSON.stringify(['Tea Estate Plucking Experience', 'Eravikulam Tahr Safari', 'Mattupetty Speedboating', 'Spice Plantation Walk', 'Traditional Kathakali Evening']),
        description: 'Breathe the pure mountain air of Munnar. Stay inside colonial tea estates, sip fresh chai, and explore South India\'s highest peaks and spice gardens.',
        image_url: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
        rating: 4.92
      },
      {
        destination_name: 'Jaipur (The Pink City)',
        title: 'Regal Rajasthan Grand Tour – Jaipur & Amber Fort',
        company_name: 'Royal Rajputana Tours',
        duration_days: 4,
        duration_nights: 3,
        price: 16999.00,
        transport_type: 'AC Luxury Sedan + Chauffeur',
        hotel_type: '5-Star Heritage Haveli',
        food_included: true,
        guide_included: true,
        activities: JSON.stringify(['Amber Fort Jeep Ascent', 'City Palace Royal Quarters', 'Hawa Mahal Photography', 'Chokhi Dhani Cultural Dinner', 'Block Printing Workshop']),
        description: 'Walk like royalty through majestic Rajput forts and painted havelis. Includes private royal dining, folk performances, and certified heritage storytellers.',
        image_url: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80',
        rating: 4.95
      },
      {
        destination_name: 'Varanasi (Kashi)',
        title: 'Divine Kashi Pilgrimage & Ghats Immersion',
        company_name: 'Sacred India Yatra',
        duration_days: 3,
        duration_nights: 2,
        price: 8999.00,
        transport_type: 'AC Station Transfers + River Boats',
        hotel_type: 'Lakeside Heritage Kashi Hotel',
        food_included: true,
        guide_included: true,
        activities: JSON.stringify(['Sunrise Boat Ride on 84 Ghats', 'VIP Kashi Vishwanath Darshan', 'Dashashwamedh Evening Ganga Aarti', 'Sarnath Buddhist Stupa Tour']),
        description: 'An unforgettable spiritual pilgrimage across the timeless ghats of Varanasi. Includes private boat rides, Vedic rituals, and Banarasi cuisine tours.',
        image_url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80',
        rating: 4.9
      }
    ];

    for (const pkg of packagesData) {
      let destId = placeMap[pkg.destination_name] || null;
      if (!destId) {
        const [pRows] = await pool.query('SELECT id FROM tourist_places WHERE name LIKE ? LIMIT 1', [`%${pkg.destination_name.split(' ')[0]}%`]);
        if (pRows.length > 0) destId = pRows[0].id;
      }
      await pool.query(
        `INSERT INTO travel_packages (destination_id, title, company_name, duration_days, duration_nights, price, transport_type, hotel_type, food_included, guide_included, activities, description, image_url, rating)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [destId, pkg.title, pkg.company_name, pkg.duration_days, pkg.duration_nights, pkg.price, pkg.transport_type, pkg.hotel_type, pkg.food_included, pkg.guide_included, pkg.activities, pkg.description, pkg.image_url, pkg.rating]
      );
    }
    console.log('✅ Travel Packages seeded');

    // 7. Seed Hotels
    await pool.query('DELETE FROM hotels');
    const hotelsData = [
      {
        dest: 'Mysore (Mysuru)',
        name: 'Royal Orchid Metropole',
        location: 'Jhansi Lakshmibai Rd, Mysuru',
        price_per_night: 4500.00,
        rating: 4.7,
        room_type: 'Heritage Deluxe Room',
        amenities: JSON.stringify(['Free Wi-Fi', 'Swimming Pool', 'Multi-Cuisine Restaurant', 'Air Conditioning', 'Free Parking', 'Spa']),
        contact: '+91 821 425 5566',
        image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        address: '5, Jhansi Lakshmibai Rd, Devaraja Mohalla, Mysuru, Karnataka 570005'
      },
      {
        dest: 'Mysore (Mysuru)',
        name: 'Grand Mercure Mysuru',
        location: 'Sayyaji Rao Road, Mysuru',
        price_per_night: 6000.00,
        rating: 4.8,
        room_type: 'Executive Palace View Suite',
        amenities: JSON.stringify(['Rooftop Pool', 'Free Breakfast', 'Fitness Center', 'Bar/Lounge', 'Airport Shuttle']),
        contact: '+91 821 402 1212',
        image_url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
        address: 'Nelson Mandela Rd, New Sayyaji Rao Road, Bamboo Bazar, Mysuru, Karnataka 570021'
      },
      {
        dest: 'Hampi',
        name: 'Heritage Resort Hampi',
        location: 'Hosapete - Hampi Road',
        price_per_night: 4200.00,
        rating: 4.6,
        room_type: 'Cottage Villa',
        amenities: JSON.stringify(['Swimming Pool', 'Ayurvedic Spa', 'Organic Restaurant', 'Free Wi-Fi', 'Tour Desk']),
        contact: '+91 8394 244 555',
        image_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
        address: '48/C&48/D, Hosapete Taluk, Hampi, Karnataka 583239'
      },
      {
        dest: 'Munnar',
        name: 'The Leaf Munnar Luxury Resort',
        location: 'Chithirapuram, Munnar',
        price_per_night: 5500.00,
        rating: 4.8,
        room_type: 'Misty Valley View Villa',
        amenities: JSON.stringify(['Infinity Pool', 'Mountain View Balcony', 'Campfire & BBQ', 'Free Breakfast', 'Kids Play Area']),
        contact: '+91 486 526 3333',
        image_url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
        address: 'Chithirapuram PO, Aanachal, Munnar, Kerala 685565'
      },
      {
        dest: 'Jaipur (The Pink City)',
        name: 'ITC Rajputana, Luxury Collection',
        location: 'Palace Road, Jaipur',
        price_per_night: 8500.00,
        rating: 4.9,
        room_type: 'Rajputana Royal Chamber',
        amenities: JSON.stringify(['Royal Spa Kaya Kalp', 'Swimming Pool', 'Fine Dining Peshawri', 'Valet Parking', 'Concierge']),
        contact: '+91 141 510 0100',
        image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        address: 'Palace Road, Gopalbari, Jaipur, Rajasthan 302006'
      },
      {
        dest: 'Varanasi (Kashi)',
        name: 'BrijRama Palace Varanasi (Ganga Heritage)',
        location: 'Darbhanga Ghat, Varanasi',
        price_per_night: 11000.00,
        rating: 4.95,
        room_type: 'Nadidhara Ganga View Room',
        amenities: JSON.stringify(['Ghat Frontage', 'Private Boat Service', 'Pure Veg Royal Dining', 'Live Classical Music', 'Heritage Elevator']),
        contact: '+91 542 245 4444',
        image_url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
        address: 'Darbhanga Ghat, Dashashwamedh, Varanasi, Uttar Pradesh 221001'
      }
    ];

    for (const h of hotelsData) {
      let destId = placeMap[h.dest] || null;
      if (!destId) {
        const [pRows] = await pool.query('SELECT id FROM tourist_places WHERE name LIKE ? LIMIT 1', [`%${h.dest.split(' ')[0]}%`]);
        if (pRows.length > 0) destId = pRows[0].id;
      }
      await pool.query(
        `INSERT INTO hotels (destination_id, name, location, price_per_night, rating, room_type, amenities, contact, image_url, address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [destId, h.name, h.location, h.price_per_night, h.rating, h.room_type, h.amenities, h.contact, h.image_url, h.address]
      );
    }
    console.log('✅ Hotels seeded');

    // 8. Seed Transport
    await pool.query('DELETE FROM transport');
    const transportData = [
      {
        dest: 'Mysore (Mysuru)',
        type: 'Train',
        provider: 'Vande Bharat Express (20608)',
        route: 'KSR Bengaluru (SBC) → Mysuru Jn (MYS)',
        departure: '06:00 AM',
        arrival: '07:45 AM',
        price: 650.00,
        duration: '1h 45m',
        booking_info: 'Daily high-speed chair car service with breakfast included.'
      },
      {
        dest: 'Mysore (Mysuru)',
        type: 'Bus',
        provider: 'KSRTC Flybus / Airavat Club Class',
        route: 'Bengaluru Kempegowda Bus Station → Mysore KSRTC Bus Stand',
        departure: 'Every 20 mins',
        arrival: 'Takes 3 hours via Expressway',
        price: 380.00,
        duration: '3h 00m',
        booking_info: 'Multi-axle Volvo AC bus running around the clock on Bangalore-Mysore Expressway.'
      },
      {
        dest: 'Mysore (Mysuru)',
        type: 'Private Driver',
        provider: 'TouristHub Private Chauffeur Cab',
        route: 'Bangalore Doorstep Pick-up → Mysore Drop & Sightseeing',
        departure: 'Flexible on Request',
        arrival: 'Direct Destination Drop',
        price: 3200.00,
        duration: '2h 30m',
        booking_info: 'Includes toll taxes on Expressway, fuel, and dedicated licensed driver.'
      },
      {
        dest: 'Hampi',
        type: 'Train',
        provider: 'Hampi Express (16592)',
        route: 'Bengaluru (SBC) → Hosapete Jn (HPT)',
        departure: '10:00 PM',
        arrival: '07:10 AM',
        price: 780.00,
        duration: '9h 10m',
        booking_info: 'Overnight sleeper / 3rd AC train arriving right at Hosapete (12km from Hampi).'
      },
      {
        dest: 'Jaipur (The Pink City)',
        type: 'Flight',
        provider: 'IndiGo / Air India Direct',
        route: 'New Delhi (DEL) / Mumbai (BOM) → Jaipur International (JAI)',
        departure: 'Multiple Daily Flights',
        arrival: 'Direct Arrival',
        price: 3800.00,
        duration: '1h 05m',
        booking_info: 'Direct non-stop flight connecting major Indian metros with Pink City.'
      },
      {
        dest: 'Varanasi (Kashi)',
        type: 'Train',
        provider: 'Vande Bharat Express (22436)',
        route: 'New Delhi (NDLS) → Varanasi Jn (BSB)',
        departure: '06:00 AM',
        arrival: '02:00 PM',
        price: 1750.00,
        duration: '8h 00m',
        booking_info: 'Fastest train on Delhi-Varanasi corridor with executive lunch included.'
      }
    ];

    for (const t of transportData) {
      let destId = placeMap[t.dest] || null;
      if (!destId) {
        const [pRows] = await pool.query('SELECT id FROM tourist_places WHERE name LIKE ? LIMIT 1', [`%${t.dest.split(' ')[0]}%`]);
        if (pRows.length > 0) destId = pRows[0].id;
      }
      await pool.query(
        `INSERT INTO transport (destination_id, transport_type, provider, route, departure_time, arrival_time, price, duration, booking_info)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [destId, t.type, t.provider, t.route, t.departure, t.arrival, t.price, t.duration, t.booking_info]
      );
    }
    console.log('✅ Transport options seeded');

    // 9. Seed Tourist Guides
    await pool.query('DELETE FROM guides');
    const guidesData = [
      {
        dest: 'Mysore (Mysuru)',
        name: 'K. Venkatesh Murthy',
        languages: 'Kannada, English, Hindi',
        experience_years: 14,
        specialization: 'Heritage & Royal Architecture',
        price_per_day: 1800.00,
        rating: 4.95,
        contact: '+91 94481 22334',
        image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
      },
      {
        dest: 'Hampi',
        name: 'Dr. Ramesh Kumar (Archaeologist)',
        languages: 'English, Kannada, Hindi, French',
        experience_years: 18,
        specialization: 'Heritage & Epigraphy',
        price_per_day: 2200.00,
        rating: 4.98,
        contact: '+91 98452 33445',
        image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
      },
      {
        dest: 'Munnar',
        name: 'Jithin Varghese',
        languages: 'Malayalam, English, Tamil',
        experience_years: 9,
        specialization: 'Nature, Trekking & Wildlife',
        price_per_day: 1500.00,
        rating: 4.88,
        contact: '+91 97451 44556',
        image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80'
      },
      {
        dest: 'Jaipur (The Pink City)',
        name: 'Raghavendra Singh Shekhawat',
        languages: 'Hindi, English, German',
        experience_years: 16,
        specialization: 'Cultural & Rajputana Lore',
        price_per_day: 2000.00,
        rating: 4.94,
        contact: '+91 98290 55667',
        image_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80'
      },
      {
        dest: 'Varanasi (Kashi)',
        name: 'Acharya Anand Sharma',
        languages: 'Hindi, Sanskrit, English',
        experience_years: 20,
        specialization: 'Spiritual, Vedic Lore & Ghats',
        price_per_day: 1600.00,
        rating: 4.99,
        contact: '+91 99351 66778',
        image_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
      }
    ];

    for (const g of guidesData) {
      let destId = placeMap[g.dest] || null;
      if (!destId) {
        const [pRows] = await pool.query('SELECT id FROM tourist_places WHERE name LIKE ? LIMIT 1', [`%${g.dest.split(' ')[0]}%`]);
        if (pRows.length > 0) destId = pRows[0].id;
      }
      await pool.query(
        `INSERT INTO guides (destination_id, name, languages, experience_years, specialization, price_per_day, rating, contact, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [destId, g.name, g.languages, g.experience_years, g.specialization, g.price_per_day, g.rating, g.contact, g.image_url]
      );
    }
    console.log('✅ Tourist Guides seeded');

    // 10. Seed Emergency Services
    await pool.query('DELETE FROM emergency_services');
    const emergencyData = [
      {
        dest: 'Mysore (Mysuru)',
        type: 'Police Station',
        name: 'Mysuru City Tourist Police & Devaraja Police Station',
        phone: '112 / +91 821 241 8300',
        address: 'Opposite Railway Station, Devaraja Mohalla, Mysuru',
        distance: 0.8
      },
      {
        dest: 'Mysore (Mysuru)',
        type: 'Hospital',
        name: 'K.R. Hospital (Government Multi-Specialty)',
        phone: '108 / +91 821 242 0100',
        address: 'Irwin Road, Mysuru, Karnataka',
        distance: 1.2
      },
      {
        dest: 'Mysore (Mysuru)',
        type: 'Tourist Help',
        name: 'Karnataka Department of Tourism Information Counter',
        phone: '1363 / +91 821 242 2096',
        address: 'Old Exhibition Buildings, Mysore Palace South Gate',
        distance: 0.5
      },
      {
        dest: 'Hampi',
        type: 'Police Station',
        name: 'Hampi Tourist Police Outpost & Kamalapura PS',
        phone: '112 / +91 8394 241 222',
        address: 'Near Main Bazaar & Virupaksha Gate, Hampi',
        distance: 0.3
      },
      {
        dest: 'Hampi',
        type: 'Hospital',
        name: 'Kamalapura Government Community Health Centre',
        phone: '108 / +91 8394 241 333',
        address: 'Kamalapura Road, Bellary District',
        distance: 3.5
      },
      {
        dest: 'Jaipur (The Pink City)',
        type: 'Police Station',
        name: 'Rajasthan Tourist Assistance Police Force (TATF)',
        phone: '112 / +91 141 260 0386',
        address: 'Hawa Mahal Road, Badi Chaupar, Pink City, Jaipur',
        distance: 0.4
      },
      {
        dest: 'Jaipur (The Pink City)',
        type: 'Hospital',
        name: 'Sawai Man Singh (SMS) Multi-Specialty Hospital',
        phone: '108 / +91 141 251 8224',
        address: 'Jawahar Lal Nehru Marg, Ashok Nagar, Jaipur',
        distance: 2.1
      },
      {
        dest: 'Varanasi (Kashi)',
        type: 'Police Station',
        name: 'Dashashwamedh Ghat Tourist Police Booth',
        phone: '112 / +91 542 245 1010',
        address: 'Near Main Steps, Dashashwamedh Ghat, Varanasi',
        distance: 0.2
      },
      {
        dest: 'Varanasi (Kashi)',
        type: 'Hospital',
        name: 'Sir Sunderlal Hospital (BHU Trauma Center)',
        phone: '108 / +91 542 236 7568',
        address: 'Banaras Hindu University Campus, Varanasi',
        distance: 3.8
      }
    ];

    for (const e of emergencyData) {
      let destId = placeMap[e.dest] || null;
      if (!destId) {
        const [pRows] = await pool.query('SELECT id FROM tourist_places WHERE name LIKE ? LIMIT 1', [`%${e.dest.split(' ')[0]}%`]);
        if (pRows.length > 0) destId = pRows[0].id;
      }
      await pool.query(
        `INSERT INTO emergency_services (destination_id, service_type, name, contact_number, address, distance_km)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [destId, e.type, e.name, e.phone, e.address, e.distance]
      );
    }
    console.log('✅ Emergency services seeded');

    // 11. Seed Sample Bookings for Demo Tourist
    await pool.query('DELETE FROM bookings WHERE user_id = ?', [touristId]);
    const [firstPkg] = await pool.query('SELECT id, price FROM travel_packages LIMIT 1');
    if (firstPkg.length > 0) {
      await pool.query(
        `INSERT INTO bookings (user_id, package_id, booking_type, travel_date, people_count, total_amount, status, special_requests)
         VALUES (?, ?, 'Package', '2026-11-15', 2, ?, 'Confirmed', 'Vegetarian meals preferred, ground floor heritage room')`,
        [touristId, firstPkg[0].id, firstPkg[0].price * 2]
      );
      console.log('✅ Demo booking created');
    }

    // 12. Seed Sample Reviews
    await pool.query('DELETE FROM reviews WHERE user_id = ?', [touristId]);
    const reviewsData = [
      {
        dest: 'Mysore (Mysuru)',
        rating: 5,
        review: 'The evening illumination of Mysore Palace with nearly 100,000 golden bulbs was mesmerizing! We tried authentic Mylari Dosa and bought pure Mysore silk. Highly recommended.'
      },
      {
        dest: 'Hampi',
        rating: 5,
        review: 'Incredible boulder architecture and history. Sitting on Matanga Hill watching the sunrise over the Tungabhadra River will stay with me forever. The AI itinerary was spot on!'
      },
      {
        dest: 'Jaipur (The Pink City)',
        rating: 5,
        review: 'Amber Fort and Hawa Mahal took our breath away. Dal Baati Churma was delicious. Excellent tourist help and safe travel throughout.'
      }
    ];

    for (const r of reviewsData) {
      let destId = placeMap[r.dest] || null;
      if (!destId) {
        const [pRows] = await pool.query('SELECT id FROM tourist_places WHERE name LIKE ? LIMIT 1', [`%${r.dest.split(' ')[0]}%`]);
        if (pRows.length > 0) destId = pRows[0].id;
      }
      if (destId) {
        await pool.query(
          `INSERT INTO reviews (user_id, destination_id, rating, review_text) VALUES (?, ?, ?, ?)`,
          [touristId, destId, r.rating, r.review]
        );
      }
    }
    console.log('✅ Reviews seeded');

    console.log('🎉 Database seeding completed successfully for Tourist AI Hub!');
    if (require.main === module) {
      process.exit(0);
    }
    return true;
  } catch (err) {
    console.error('❌ Database seeding error:', err);
    if (require.main === module) {
      process.exit(1);
    }
    throw err;
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
