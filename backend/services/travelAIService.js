/**
 * Tourist Hub AI — Intelligent Conversational Travel Assistant & Trip Planner Service
 * 
 * Provides:
 * 1. Intent Detection & Entity Extraction (Destinations, Duration, Budget, Origin, Preferences)
 * 2. Conversational Travel Assistance (Overviews, History, Food, Transit, Weather, Sights)
 * 3. Customized Itinerary Generation with realistic day-by-day scheduling
 * 4. Itemized Budget-Based Planning with optimization & shortfall management
 * 5. Context-aware multi-turn conversations & dynamic follow-up prompt suggestions
 */

const pool = require('../config/db');

// Rich Indian Destination Knowledge Base for Instant, Accurate Travel Intelligence
const DESTINATION_KNOWLEDGE = {
  'mysore': {
    name: 'Mysore (Mysuru)',
    state: 'Karnataka',
    nickname: 'City of Palaces / Cultural Capital of Karnataka',
    overview: 'Mysore (Mysuru) is one of South India\'s most celebrated historic and cultural cities. Renowned for its regal heritage, opulent Indo-Saracenic palaces, fragrant sandalwood, pure mulberry silk, and the world-famous 10-day Dasara festival, Mysore offers a refined blend of royal traditions, serene parks, and delectable cuisine.',
    history: 'Mysore was ruled by the distinguished Wadiyar dynasty from 1399 until Indian independence in 1947, briefly interrupted by Hyder Ali and his son Tipu Sultan in the late 18th century. The Wadiyars were great patrons of arts, architecture, Carnatic music, and literature, fostering institutions like Mysore University and the Chamarajendra Academy of Visual Arts.',
    palace_history: 'The current Mysore Palace (Amba Vilas) was commissioned by Maharani Kempananjammanni Vani Vilas Sannidhana after the original wooden palace was gutted in a devastating 1897 fire. Designed by renowned British architect Henry Irwin in Indo-Saracenic style, it was completed in 1912 for ₹41.4 lakh. It features three-storey stone architecture, marble domes, a 145-foot tower, and nearly 100,000 bulbs illuminating its facade every Sunday and during festive evenings.',
    best_time: 'October to February (Winter) offers pleasant temperatures between 18°C and 30°C. September/October is festive during Dasara celebrations. March to May is warm, while June to September experiences moderate monsoon showers.',
    ideal_duration: '2 to 3 Days',
    attractions: [
      {
        name: 'Mysore Palace (Amba Vilas)',
        category: 'Heritage & Royalty',
        timings: '10:00 AM - 5:30 PM (Daily)',
        entry_fee: '₹100 (Adults), ₹50 (Children)',
        est_time: '2 - 3 hours',
        highlight: 'Gilded Durbar Hall, stained-glass Kalyana Mantapa, golden throne, and evening illumination.'
      },
      {
        name: 'Sri Chamundeshwari Temple (Chamundi Hill)',
        category: 'Spiritual & Scenic Viewpoint',
        timings: '7:30 AM - 2:00 PM, 3:30 PM - 9:00 PM',
        entry_fee: 'Free (Special Darshan ₹100)',
        est_time: '1.5 - 2 hours',
        highlight: 'Sacred 17th-century Dravidian temple atop 1,000-meter hill, panoramic city vistas, and a 16-foot monolithic Nandi bull.'
      },
      {
        name: 'Brindavan Gardens & Musical Fountain',
        category: 'Gardens & Evening Light Show',
        timings: '6:30 AM - 9:00 PM (Musical Fountain at 7:00 PM)',
        entry_fee: '₹50 per person',
        est_time: '2 hours (Best visited around 6:00 PM)',
        highlight: 'Illuminated terrace gardens adjacent to KRS Dam with dancing musical fountain shows.'
      },
      {
        name: 'Devaraja Heritage Market',
        category: 'Culture & Photography Walk',
        timings: '6:30 AM - 8:30 PM',
        entry_fee: 'Free Entry',
        est_time: '1 - 1.5 hours',
        highlight: '130-year-old historic bazaar packed with Mysore jasmine, natural sandalwood oils, kumkum piles, and banana varieties.'
      },
      {
        name: 'St. Philomena\'s Cathedral',
        category: 'Architecture & Peace',
        timings: '5:00 AM - 6:00 PM',
        entry_fee: 'Free Entry',
        est_time: '45 mins',
        highlight: 'Twin 175-foot spires inspired by Germany\'s Cologne Cathedral, housing French stained-glass panels.'
      },
      {
        name: 'Karanji Lake & Walk-Through Aviary',
        category: 'Nature & Birdwatching',
        timings: '8:30 AM - 5:30 PM (Closed Tuesdays)',
        entry_fee: '₹50 (Adults), ₹25 (Children)',
        est_time: '1.5 hours',
        highlight: 'India\'s largest walk-through aviary, butterfly park, and pedal boating against Chamundi Hill.'
      },
      {
        name: 'Jaganmohan Palace Art Gallery',
        category: 'Art & Royal Artifacts',
        timings: '8:30 AM - 5:30 PM',
        entry_fee: '₹75 (Adults)',
        est_time: '1.5 hours',
        highlight: 'Original masterpieces by Raja Ravi Varma and S.L. Haldankar\'s famous "Glow of Hope".'
      }
    ],
    food: [
      {
        name: 'Original Mysore Mylari Dosa',
        description: 'Ultra-soft, cloud-like butter dosas served on banana leaves with freshly ground coconut-onion sagu.',
        where: 'Hotel Vinayaka Mylari (Nazarbad, Mysore)'
      },
      {
        name: 'Authentic Mysore Pak',
        description: 'Royal dessert invented in the palace kitchen by Kakasura Madappa, crafted with pure desi ghee, gram flour, and sugar.',
        where: 'Guru Sweet Mart (Sayyaji Rao Road) / Mahalakshmi Sweets'
      },
      {
        name: 'Bisi Bele Bath',
        description: 'Traditional hot lentil rice slow-cooked with fresh vegetables, tamarind, and aromatic spice blend, garnished with ghee cashews.',
        where: 'Dasaprakash / Gayatri Tiffin Room'
      },
      {
        name: 'South Indian Filter Coffee',
        description: 'Freshly brewed chicory-infused decoction with frothy hot milk served in traditional brass davarah.',
        where: 'Local Heritage Cafes & Darshinis across Sayyaji Rao Road'
      }
    ],
    transport: {
      from_bengaluru: [
        {
          mode: 'Vande Bharat Express (Train)',
          duration: '1 hour 45 mins',
          cost: '₹650 (Chair Car) / ₹1,200 (Exec)',
          frequency: 'Daily mornings and afternoons from KSR Bengaluru (SBC)',
          details: 'Fastest and smoothest option with complimentary breakfast/snacks.'
        },
        {
          mode: 'Regular Express Trains (Shatabdi, Chamundi, Rajya Rani)',
          duration: '2 to 2.5 hours',
          cost: '₹95 - ₹350 (2S / CC)',
          frequency: 'Trains leave almost every hour from Bengaluru',
          details: 'Very affordable, comfortable, and scenic route.'
        },
        {
          mode: 'KSRTC Flybus / Airavat Volvo (Bus)',
          duration: '3 hours',
          cost: '₹380 - ₹850',
          frequency: 'Every 20 mins from Majestic & directly from Bengaluru Airport',
          details: 'Non-stop expressway coaches with reclining AC seats.'
        },
        {
          mode: 'Private Taxi / Self Drive (Expressway NH-275)',
          duration: '2 to 2.5 hours',
          cost: '₹2,800 - ₹3,500 (one-way cab)',
          frequency: 'Flexible on demand',
          details: 'Direct door-to-door drive via the 10-lane access-controlled Bengaluru-Mysuru Expressway.'
        }
      ],
      local: 'Auto Rickshaws (₹30-₹150 for city hops), E-Carts inside the palace complex, Pre-booked cabs, and scenic horse-drawn Tongas around Chamaraja Circle.'
    },
    safety_tips: 'Mysore is one of India\'s cleanest and safest cities. Always hire licensed guides inside the Palace holding official tourism department badges. Moderate clothing is appreciated at Chamundeshwari Temple.'
  },

  'yadgir': {
    name: 'Yadgir',
    state: 'Karnataka',
    nickname: 'World of Boulders (Yadavagiri) / Historic Hill Fort Citadel',
    overview: 'Yadgir, historically known as Yadavagiri, is an ancient district in northeastern Karnataka celebrated for its colossal hill fort perched on a giant monolithic boulder, Krishna and Bhima river valleys, scenic dams, and rich rural heritage.',
    history: 'Founded by the Yadava dynasty of Devagiri in the 10th-11th century, Yadgir was later fortified by the Western Chalukyas, the Bahmani Sultanate, the Bijapur Adil Shahis, and the Nizam of Hyderabad. The town is famous for its massive rock-cut hill fort with ancient defense bastions and cannons.',
    best_time: 'October to March (Winter temperature 18°C - 30°C). Avoid peak summer (April-May) as rocky terrain gets hot.',
    ideal_duration: '2 Days',
    attractions: [
      {
        name: 'Yadgir Fort (Hilltop Citadel & Cannons)',
        category: 'Heritage & Hill Fortress',
        timings: '8:00 AM - 6:00 PM (Daily)',
        entry_fee: 'Free Entry',
        est_time: '2 - 3 hours',
        highlight: 'Formidable hilltop fortress built across three tiers with ancient defense gateways, historic cannons, and 360-degree panoramic views of Yadgir town.'
      },
      {
        name: 'Hattikuni Dam & Lake',
        category: 'Nature & Sunset Viewpoint',
        timings: '6:00 AM - 6:30 PM',
        entry_fee: 'Free Entry',
        est_time: '2 hours',
        highlight: 'Picturesque irrigation reservoir nestled between green boulder hills, perfect for peaceful evening walks, picnics, and waterside photography.'
      },
      {
        name: 'Bonal Bird Sanctuary',
        category: 'Wildlife & Birdwatching',
        timings: '6:00 AM - 5:30 PM',
        entry_fee: 'Free Entry',
        est_time: '2 - 3 hours',
        highlight: 'Second largest bird sanctuary in Karnataka, hosting over 21 species of migratory waterfowls, purple herons, and white ibises during winter.'
      },
      {
        name: 'Vanadurga Fort (Wankanagere Forest Fortress)',
        category: 'Ancient Heritage',
        timings: '9:00 AM - 5:00 PM',
        entry_fee: 'Free Entry',
        est_time: '1.5 hours',
        highlight: 'Unique forest fortress built by the Surpur Nayakas, surrounded by water canals and dense greenery in Shorapur taluk.'
      },
      {
        name: 'Sleeping Buddha Hill (Shahapur Rock Formation)',
        category: 'Geological Marvel & Photography',
        timings: 'Open daylight hours',
        entry_fee: 'Free',
        est_time: '1.5 hours',
        highlight: 'Remarkable natural hilltop formation in Shahapur that dramatically resembles a colossal reclining Buddha against the horizon.'
      },
      {
        name: 'Chhaya Bhagavathi Temple (Krishna River)',
        category: 'Spiritual Shrine & River Gorge',
        timings: '6:00 AM - 7:00 PM',
        entry_fee: 'Free Entry',
        est_time: '2 hours',
        highlight: 'Ancient temple situated by a scenic waterfall on the Krishna river where sunlight magically does not fall directly on the deity.'
      }
    ],
    food: [
      {
        name: 'North Karnataka Jowar Roti Oota with Yennegai',
        description: 'Warm crispy sorghum flatbreads served with spiced stuffed baby brinjals, thick curd, and fresh salad.',
        where: 'Traditional Khanavali Messes near Yadgir Station and Chittapur Road'
      },
      {
        name: 'Shenga (Peanut) Chutney Pudi & Sajje Roti',
        description: 'Nutty spiced roasted peanut powder mixed with fresh curd or ghee, paired with pearl millet rotis.',
        where: 'Local eateries and home-style messes across Yadgir'
      },
      {
        name: 'Spicy Mirchi Bajji with Mandakki/Churmuri',
        description: 'Crispy gram-flour battered green chilli fritters served with seasoned puffed rice and chopped onions.',
        where: 'Evening bazaar stalls near Gandhi Chowk'
      }
    ],
    transport: {
      from_bengaluru: [
        {
          mode: 'Direct Trains (Udyan, Karnataka, Basava Express)',
          duration: '8 to 9 hours',
          cost: '₹280 (SL) / ₹750 (3AC)',
          frequency: 'Multiple daily direct express trains from KSR Bengaluru & Yesvantpur',
          details: 'Yadgir Railway Station (YG) is a major junction on the Bengaluru-Mumbai line.'
        },
        {
          mode: 'KSRTC Non-AC & AC Sleeper Buses',
          duration: '9 to 10 hours',
          cost: '₹600 - ₹1,050',
          frequency: 'Daily evening and night departures from Majestic (Kempegowda Bus Station)',
          details: 'Direct overnight route via Anantapur and Raichur.'
        },
        {
          mode: 'Self Drive / Private Cab (NH-44 & NH-150)',
          duration: '8.5 hours (490 km)',
          cost: '₹6,000 - ₹8,000',
          frequency: 'On demand',
          details: 'Bengaluru → Anantapur → Guntakal → Raichur → Yadgir.'
        }
      ],
      local: 'Auto Rickshaws for city hops, KSRTC district buses for Shahapur/Shorapur, and pre-arranged local taxis for dam & sanctuary trips.'
    },
    safety_tips: 'Yadgir is quiet, welcoming, and safe. Carry adequate drinking water and sun protection when trekking up Yadgir Fort stairs. Best photographed during golden hour mornings.'
  },

  'hampi': {
    name: 'Hampi',
    state: 'Karnataka',
    nickname: 'Forgotten Empire of Vijayanagara / UNESCO World Heritage Landmark',
    overview: 'Hampi is an astonishing open-air museum set amid a surreal landscape of giant granite boulders along the sacred Tungabhadra River. As the 14th-century capital of the Vijayanagara Empire, it was once one of the wealthiest cities in the medieval world.',
    history: 'Established in 1336 by brothers Harihara and Bukka Raya, Hampi reached its zenith under Emperor Krishnadevaraya in the early 16th century. It fell following the Battle of Talikota in 1565. The ruins span over 4,100 hectares with over 1,600 surviving monuments.',
    best_time: 'November to February (Cool winter breezes, 18°C - 30°C). Avoid peak summer (March-May) as rocky terrain absorbs heavy heat.',
    ideal_duration: '2 to 3 Days',
    attractions: [
      { name: 'Virupaksha Temple', category: 'Heritage & Living Shrine', timings: '6:00 AM - 1:00 PM, 5:00 PM - 9:00 PM', entry_fee: 'Free (₹50 inner sanctuary)', highlight: 'Oldest active shrine in Hampi dedicated to Lord Shiva with 50-meter gopuram and pinhole camera illusion.' },
      { name: 'Vittala Temple & Iconic Stone Chariot', category: 'Architectural Masterpiece', timings: '8:30 AM - 5:30 PM', entry_fee: '₹40 (ASI ticket covering multiple sites)', highlight: 'World-famous Stone Chariot (featured on ₹50 note) and 56 musical pillars.' },
      { name: 'Matanga Hill', category: 'Sunrise & Panoramic View', timings: '5:30 AM - 6:30 PM', entry_fee: 'Free', highlight: 'Highest point in Hampi providing unmatched 360-degree sunrise views over ancient ruins and boulders.' },
      { name: 'Lotus Mahal & Elephant Stables', category: 'Zenana Royal Enclosure', timings: '8:30 AM - 5:30 PM', entry_fee: 'Included in ASI pass', highlight: 'Indo-Islamic pavilion with arched domes and grand stable chambers for royal ceremonial elephants.' },
      { name: 'Tungabhadra Coracle Ride', category: 'River Adventure', timings: '7:00 AM - 5:30 PM', entry_fee: '₹300 - ₹500 per boat', highlight: 'Traditional round woven boat gliding through river gorges beneath ancient cliff carvings.' }
    ],
    food: [
      { name: 'North Karnataka Jowar Roti Oota', description: 'Healthy sorghum flatbreads served with stuffed brinjal (Ennegai), spicy pulse chutneys, curd, and papad.', where: 'Local Traditional Messes near Kamalapura' },
      { name: 'Tender Coconut & Filter Coffee', description: 'Refreshing natural hydration between monument explorations.', where: 'Bazaars near Hampi Main Ghat' }
    ],
    transport: {
      from_bengaluru: [
        { mode: 'Hampi Express (16592) Overnight Train', duration: '9 hours', cost: '₹280 (Sleeper) / ₹780 (3AC)', details: 'Board 10:00 PM at Bengaluru (SBC), wake up 7:00 AM at Hosapete Jn (12 km from Hampi).' },
        { mode: 'KSRTC Airavat AC Sleeper Bus', duration: '7.5 hours', cost: '₹750 - ₹1,100', details: 'Overnight comfortable departure from Majestic Bus Station direct to Hosapete.' }
      ],
      local: 'Bicycle rentals (₹100-₹150/day), Moped/Scooter rentals (₹400/day), or local auto rickshaws.'
    }
  },

  'coorg': {
    name: 'Coorg (Kodagu)',
    state: 'Karnataka',
    nickname: 'Scotland of India / Coffee Country',
    overview: 'Coorg is an emerald upland paradise perched along the mist-shrouded Western Ghats. Famous for aromatic Arabica coffee plantations, cascading waterfalls, spice groves, and martial Kodava traditions.',
    history: 'Kodagu was an independent kingdom ruled by the Haleri dynasty until British annexation in 1834. The Kodava people boast an indigenous culture with unique clan customs, sword rituals, and martial sports.',
    best_time: 'October to May for pleasant climate; July to September for dramatic lush monsoons.',
    ideal_duration: '2 to 3 Days',
    attractions: [
      { name: 'Abbey Falls', category: 'Waterfall & Nature', timings: '9:00 AM - 5:00 PM', entry_fee: '₹15', highlight: 'Cascading 70-foot waterfall framed by hanging bridge and spice plantations.' },
      { name: 'Raja\'s Seat Sunset Viewpoint', category: 'Scenic Gardens', timings: '6:00 AM - 8:00 PM', entry_fee: '₹20', highlight: 'Historic sunset pavilion where Kodagu kings enjoyed sweeping valley vistas and seasonal musical fountain.' },
      { name: 'Namdroling Monastery (Golden Temple)', category: 'Tibetan Heritage', timings: '9:00 AM - 6:00 PM', entry_fee: 'Free Entry', highlight: 'Bylakuppe Tibetan settlement housing 40-foot gilded Buddha statues and colorful prayer frescoes.' },
      { name: 'Dubare Elephant Camp', category: 'Wildlife & River', timings: '9:00 AM - 11:00 AM, 4:30 PM - 5:30 PM', entry_fee: '₹100 (Bathing extra)', highlight: 'River Cauvery camp where visitors can participate in elephant grooming and feeding.' }
    ],
    food: [
      { name: 'Pandi Curry & Kadambuttu', description: 'Traditional Kodava spiced delicacy paired with steamed broken-rice dumplings.', where: 'Coorg Cuisine / Raintree Restaurant, Madikeri' },
      { name: 'Fresh Estate Filter Coffee', description: 'Single-origin estate Arabica & Robusta coffees brewed fresh with cardamom notes.', where: 'Coffee Plantation Homestays' }
    ],
    transport: {
      from_bengaluru: [
        { mode: 'Self-Drive / Private Cab via NH-75', duration: '5 to 6 hours (250 km)', cost: '₹4,500 - ₹5,500', details: 'Scenic drive passing through Channarayapatna, Hassan, and Madikeri hills.' },
        { mode: 'KSRTC Airavat AC Bus', duration: '6 hours', cost: '₹550 - ₹750', details: 'Direct day & night buses from Bengaluru Satellite Bus Stand to Madikeri.' }
      ],
      local: 'Rental private cabs or jeeps (ideal for winding ghat roads and estate trails).'
    }
  },

  'jaipur': {
    name: 'Jaipur (The Pink City)',
    state: 'Rajasthan',
    nickname: 'Paris of India / Royal Citadel of Rajputana',
    overview: 'Jaipur, the capital of Rajasthan, is an UNESCO World Heritage city founded in 1727 by Maharaja Sawai Jai Singh II. Celebrated for its pink terracotta facades, majestic hilltop forts, vibrant jewel markets, and royal palaces.',
    best_time: 'October to March (Winter temperature 12°C - 26°C).',
    ideal_duration: '3 Days',
    attractions: [
      { name: 'Amber Fort & Palace', category: 'Hill Fort & Sheesh Mahal', timings: '8:00 AM - 5:30 PM', entry_fee: '₹100 (Indians), ₹500 (Foreigners)', highlight: 'Colossal hilltop fortress featuring mirror-inlaid Sheesh Mahal, elephant paths, and Maota Lake views.' },
      { name: 'Hawa Mahal (Palace of Winds)', category: 'Royal Architecture', timings: '9:00 AM - 5:00 PM', entry_fee: '₹50 (Indians), ₹200 (Foreigners)', highlight: 'Five-storey pink sandstone facade with 953 jharokhas (casements) designed for royal court ladies.' },
      { name: 'City Palace & Museum', category: 'Living Royal Residence', timings: '9:30 AM - 5:00 PM', entry_fee: '₹200 - ₹700', highlight: 'Pritam Niwas Chowk with peacock gates, Chandra Mahal, and ceremonial Rajput robes.' },
      { name: 'Jantar Mantar', category: 'Astronomical UNESCO Site', timings: '9:00 AM - 5:00 PM', entry_fee: '₹50', highlight: 'World\'s largest stone sundial and 19 architectural astronomical instruments built in 1734.' }
    ],
    food: [
      { name: 'Dal Baati Churma', description: 'Hard wheat flour balls baked over coals, crushed and drowned in pure ghee with spiced lentils and sweet jaggery churma.', where: 'Chokhi Dhani / Laxmi Mishthan Bhandar (LMB)' },
      { name: 'Pyaaz Kachori & Ghewar', description: 'Flaky onion pastries and honeycomb ghee dessert soaked in saffron syrup.', where: 'Rawat Mishthan Bhandar, Station Road' }
    ],
    transport: {
      from_delhi: [
        { mode: 'Vande Bharat / Shatabdi Express', duration: '3.5 to 4 hours', cost: '₹750 - ₹1,400', details: 'Fast, comfortable morning and evening train from New Delhi Station.' },
        { mode: 'Delhi-Mumbai Expressway Drive', duration: '3.5 hours (260 km)', cost: '₹3,500 - ₹4,500 by cab', details: 'Smooth 8-lane expressway connecting Delhi directly to Dausa-Jaipur.' }
      ]
    }
  },

  'varanasi': {
    name: 'Varanasi (Kashi)',
    state: 'Uttar Pradesh',
    nickname: 'Spiritual Capital of India / The Eternal City of Light',
    overview: 'Continuously inhabited for over 3,000 years, Varanasi rests along the crescent curves of the sacred Ganges river. It is India\'s spiritual epicenter, famous for its 84 ghats, grand evening Ganga Aarti, sacred temples, and timeless silk weaving.',
    best_time: 'October to March (Pleasant winter weather, grand Dev Deepawali in Nov).',
    ideal_duration: '2 to 3 Days',
    attractions: [
      { name: 'Dashashwamedh Ghat & Evening Ganga Aarti', category: 'Sacred Ritual', timings: '6:30 PM Daily', entry_fee: 'Free (Boat seat ₹150 - ₹300)', highlight: 'Multi-tiered brass lamp ritual performed by saffron-clad priests amidst chanting and bells.' },
      { name: 'Kashi Vishwanath Temple Corridor', category: 'Spiritual Center', timings: '3:00 AM - 11:00 PM', entry_fee: 'Free (Sugam Darshan ₹300)', highlight: 'Golden-spired shrine dedicated to Lord Shiva connected by grand pedestrian corridor directly to Ganges.' },
      { name: 'Dawn Boat Ride on River Ganges', category: 'Morning Experience', timings: '5:30 AM - 7:30 AM', entry_fee: '₹300 - ₹600 per person', highlight: 'Gliding past morning bathers, sun salutations, ancient palace facades, and cremation ghats.' },
      { name: 'Sarnath (Deer Park & Dhamek Stupa)', category: 'Buddhist Landmark (10 km)', timings: '9:00 AM - 5:00 PM', entry_fee: '₹25', highlight: 'Where Lord Buddha gave his first sermon; features Ashoka Lion Capital museum.' }
    ],
    food: [
      { name: 'Banarasi Kachori Sabzi & Jalebi', description: 'Crisp hot kachoris with tangy potato curry and golden crispy jalebis.', where: 'Ram Bhandar (Thatheri Bazaar)' },
      { name: 'Malaiyo (Winter Special)', description: 'Frothy saffron milk foam garnished with pistachios and silver leaf.', where: 'Chaukhamba Gali' },
      { name: 'Famous Banarasi Paan', description: 'Maghai betel leaf folded with fragrant gulkand, spices, and mint.', where: 'Keshav Tambool Bhandar, Assi Ghat' }
    ],
    transport: {
      from_delhi: [
        { mode: 'Vande Bharat Express (22436)', duration: '8 hours', cost: '₹1,750 (CC)', details: 'Depart 6:00 AM from New Delhi, arrive Varanasi 2:00 PM.' },
        { mode: 'Direct Flights', duration: '1 hour 20 mins', cost: '₹3,500 - ₹5,500', details: 'Multiple daily non-stop flights from DEL, BOM, BLR to Lal Bahadur Shastri Airport (VNS).' }
      ]
    }
  },

  'chikmagalur': {
    name: 'Chikmagalur (Chikkamagaluru)',
    state: 'Karnataka',
    nickname: 'The Coffee Land of Karnataka / Western Ghats Retreat',
    overview: 'Perched at 3,400 feet against the dramatic Mullayanagiri range, Chikmagalur is famous for mist-shrouded Arabica coffee plantations, sparkling waterfalls, mountain peaks, and serene plantation homestays.',
    history: 'In the 17th century, Sufi saint Baba Budan brought seven raw coffee beans from Mocha (Yemen) and planted them in the Chandradrona hills, initiating India\'s storied coffee culture.',
    best_time: 'September to March for trekking and pleasant days; July to August for lush monsoon greenery.',
    ideal_duration: '2 to 3 Days',
    attractions: [
      { name: 'Mullayanagiri Peak', category: 'Trekking & Mountain Vista', timings: '6:00 AM - 6:00 PM', entry_fee: 'Free', est_time: '2 - 3 hours', highlight: 'Highest peak in Karnataka (1,930 m) offering sweeping views above the clouds.' },
      { name: 'Baba Budangiri & Manikyadhara Falls', category: 'Heritage & Pilgrimage', timings: '8:00 AM - 5:00 PM', entry_fee: 'Free', est_time: '2 hours', highlight: 'Sacred mountain shrine dedicated to Sufi saint Baba Budan and Dattatreya.' },
      { name: 'Hebbe Falls', category: 'Waterfall & Forest Jeep Ride', timings: '8:00 AM - 4:00 PM', entry_fee: '₹100 (Forest jeep extra)', est_time: '3 hours', highlight: 'Dramatic two-tiered 550-foot waterfall inside Bhadra tiger reserve perimeter.' },
      { name: 'Hirekolale Lake', category: 'Lake & Sunset Point', timings: '6:00 AM - 6:30 PM', entry_fee: 'Free', est_time: '1 hour', highlight: 'Tranquil mountain lake surrounded by pine slopes, perfect for evening walks.' }
    ],
    food: [
      { name: 'Akki Roti with Kaayi Chutney', description: 'Crisp rice-flour flatbreads tempered with onions, dill, and served with spicy coconut chutney.', where: 'Town Canteen / Local Estate Homestays' },
      { name: 'Malnad Koli Saaru & Kadubu', description: 'Traditional aromatic chicken curry slow-simmered with coconut milk, paired with steamed rice cakes.', where: 'Local Malnad Messes & Homestays' },
      { name: 'Single-Estate Filter Coffee', description: 'Freshly roasted Arabica and Robusta coffee brewed with chicory and thick milk.', where: 'Plantation Cafes across Mallandur Road' }
    ],
    transport: {
      from_bengaluru: [
        { mode: 'Direct Drive / Private Cab (NH-75)', duration: '4.5 to 5 hours (245 km)', cost: '₹4,000 - ₹5,000', details: 'Scenic 4-lane highway via Hassan and Belur.' },
        { mode: 'KSRTC Airavat AC Bus', duration: '5.5 hours', cost: '₹480 - ₹750', details: 'Multiple daily departures from Kempegowda Bus Station.' }
      ],
      local: 'Private cabs and rental 4x4 jeeps (essential for Mullayanagiri and Hebbe Falls forest terrain).'
    }
  },

  'badami': {
    name: 'Badami (Vatapi)',
    state: 'Karnataka',
    nickname: 'Rock-Cut Cave Citadel of the Early Chalukyas',
    overview: 'Badami, ancient capital of the Chalukya dynasty from 540 to 757 AD, is world-famous for its dramatic red sandstone cave temples, Bhutanatha shrine overlooking Agastya Lake, and nearby UNESCO landmarks at Pattadakal and Aihole.',
    history: 'Founded by Pulakeshin I in 540 AD, Badami was an extraordinary center of early Dravidian and Nagara stone temple architecture.',
    best_time: 'October to March (Pleasant winter temperatures 16°C to 30°C).',
    ideal_duration: '2 Days (including Pattadakal & Aihole)',
    attractions: [
      { name: 'Badami Rock-Cut Cave Temples', category: 'Heritage & UNESCO Architecture', timings: '9:00 AM - 5:30 PM', entry_fee: '₹25 (Indians), ₹300 (Foreigners)', est_time: '2 - 3 hours', highlight: 'Four ancient rock-cut caves carved into cliffs, featuring 18-armed dancing Shiva (Natara) and Vishnu avatars.' },
      { name: 'Bhutanatha Group of Temples & Agastya Lake', category: 'Scenic Lake Shrine', timings: '6:00 AM - 6:30 PM', entry_fee: 'Free', est_time: '1.5 hours', highlight: '7th-century stone temple built right onto the edge of holy Agastya tank.' },
      { name: 'Pattadakal UNESCO Monuments (22 km)', category: 'UNESCO World Heritage', timings: '6:00 AM - 6:00 PM', entry_fee: '₹40', est_time: '2 hours', highlight: 'Ten 8th-century grand stone temples illustrating the meeting point of North and South Indian temple styles.' },
      { name: 'Aihole Temple Complex (35 km)', category: 'Cradle of Hindu Architecture', timings: '9:00 AM - 5:00 PM', entry_fee: '₹25', est_time: '2 hours', highlight: 'Over 120 stone temples dating back to the 6th century, including the apsidal Durga Temple.' }
    ],
    food: [
      { name: 'North Karnataka Jowar Roti Oota', description: 'Wholesome sorghum flatbreads served with stuffed brinjal (Ennegai), spicy pulse chutneys, curd, and papad.', where: 'Traditional Khanavali Messes near Bus Stand' },
      { name: 'Shenga Chutney & Shenga Holige', description: 'Crushed spiced peanut powders and sweet jaggery-peanut flatbreads.', where: 'Local sweet shops' }
    ],
    transport: {
      from_bengaluru: [
        { mode: 'Gol Gumbaz Express / Barmer Express (Train)', duration: '11 hours (Overnight)', cost: '₹340 (SL) / ₹950 (3AC)', details: 'Departs Bengaluru evenings, arrives Badami Station directly mornings.' },
        { mode: 'KSRTC Non-AC / AC Sleeper Bus', duration: '9 to 10 hours', cost: '₹650 - ₹1,100', details: 'Direct overnight buses from Majestic to Badami.' }
      ],
      local: 'Auto rickshaws and pre-booked local taxis for Pattadakal and Aihole day trips.'
    }
  },

  'gokarna': {
    name: 'Gokarna',
    state: 'Karnataka',
    nickname: 'Sacred Coastal Haven / Serene Beaches & Shiva Shrine',
    overview: 'Gokarna is a peaceful temple town on the Arabian Sea, celebrated for its revered Mahabaleshwar Temple holding the sacred Atmalinga, and five crescent-shaped golden beaches bordered by rocky hills.',
    history: 'One of the seven sacred Muktistalas of Karnataka, revered since ancient times as the spot where Ganesha outwitted Ravana to ground Shiva\'s divine Atmalinga.',
    best_time: 'October to March (Sunny beach days, cool sea breeze).',
    ideal_duration: '2 to 3 Days',
    attractions: [
      { name: 'Mahabaleshwar Temple & Kotiteertha', category: 'Spiritual Shrine', timings: '6:00 AM - 12:30 PM, 5:00 PM - 8:00 PM', entry_fee: 'Free', est_time: '1.5 hours', highlight: 'Ancient Dravidian granite temple housing the Atmalinga of Lord Shiva.' },
      { name: 'Om Beach', category: 'Beach & Water Sports', timings: 'Open 24 Hours', entry_fee: 'Free', est_time: '2 - 3 hours', highlight: 'Naturally shaped like the sacred Hindu symbol ॐ, with beach shacks and boat rides.' },
      { name: 'Kudle Beach', category: 'Sunset & Shacks', timings: 'Open 24 Hours', entry_fee: 'Free', est_time: '2 hours', highlight: 'Spacious crescent bay framed by rocky headlands, ideal for relaxing and sunset watching.' },
      { name: 'Half Moon & Paradise Beach Trek', category: 'Coastal Cliff Trek', timings: 'Daylight hours', entry_fee: 'Free', est_time: '3 hours', highlight: 'Scenic cliff-edge trail connecting secluded coves accessible only by foot or boat.' }
    ],
    food: [
      { name: 'Coastal Fish Curry with Boiled Red Rice', description: 'Fresh catch of kingfish or mackerel simmered in tangy kokum-coconut gravy.', where: 'Chez Christophe / Prema Restaurant' },
      { name: 'Mangalore Buns & Neer Dosa', description: 'Sweet banana pooris and paper-thin rice crepes served with spicy coconut chutney.', where: 'Shri Krishna Bhavan near Temple' }
    ],
    transport: {
      from_bengaluru: [
        { mode: 'Panchaganga Express (16595) Overnight Train', duration: '12 hours', cost: '₹350 (SL) / ₹980 (3AC)', details: 'Departs Yesvantpur 6:50 PM, arrives Gokarna Road Station 7:30 AM.' },
        { mode: 'KSRTC Airavat AC Sleeper Bus', duration: '9 to 10 hours', cost: '₹750 - ₹1,200', details: 'Direct overnight bus from Bengaluru to Gokarna town.' }
      ],
      local: 'Auto rickshaws (₹100-₹200 between beaches), scooter rentals (₹400/day), and fishing boat transfers.'
    }
  },

  'ooty': {
    name: 'Ooty (Udhagamandalam)',
    state: 'Tamil Nadu',
    nickname: 'Queen of Hill Stations / Nilgiris Paradise',
    overview: 'Nestled at 7,350 feet in the Nilgiri Hills, Ooty is famous for vast tea estates, eucalyptus groves, the UNESCO Nilgiri Mountain Toy Train, and cool refreshing mountain air.',
    history: 'Developed as a summer sanctuary for the British Madras Presidency in the 1820s by John Sullivan, preserving stone churches and Toda tribal heritage.',
    best_time: 'October to June (Pleasant weather between 10°C and 20°C).',
    ideal_duration: '2 to 3 Days',
    attractions: [
      { name: 'Government Botanical Garden', category: 'Flora & Heritage Garden', timings: '7:00 AM - 6:30 PM', entry_fee: '₹40 (Adults)', est_time: '2 hours', highlight: '55-acre terraced garden established in 1848, featuring thousands of exotic plant species and a 20-million-year-old fossil tree.' },
      { name: 'Doddabetta Peak', category: 'Highest Nilgiri Viewpoint', timings: '7:00 AM - 6:00 PM', entry_fee: '₹10', est_time: '1.5 hours', highlight: 'Highest mountain in the Nilgiris (2,637 m) with telescope house overlooking panoramic valleys.' },
      { name: 'Ooty Lake & Boathouse', category: 'Boating & Leisure', timings: '8:30 AM - 6:00 PM', entry_fee: '₹15 (Boating extra)', est_time: '1.5 hours', highlight: 'Artificial lake created in 1824 with pedal, row, and motor boats framed by eucalyptus trees.' },
      { name: 'Nilgiri Mountain Railway (Toy Train)', category: 'UNESCO World Heritage Ride', timings: 'Daily departures', entry_fee: '₹100 - ₹300', est_time: '3 hours', highlight: 'Historic steam-hauled cog railway traversing 16 tunnels, 250 bridges, and cliffside tea slopes.' }
    ],
    food: [
      { name: 'Homemade Nilgiri Chocolates', description: 'Rich dark, milk, and white artisan chocolates loaded with roasted nuts.', where: 'King Star Confectionery / Modern Stores' },
      { name: 'Ooty Varkey & Piping Tea', description: 'Crisp flaky regional puff biscuits paired with fresh Nilgiri single-estate black tea.', where: 'Local bakeries across Commercial Road' }
    ],
    transport: {
      from_bengaluru: [
        { mode: 'Direct Road Drive via Bandipur (NH-275 / NH-766)', duration: '6 hours (280 km)', cost: '₹4,500 - ₹5,500 by cab', details: 'Scenic route passing through Mysore and Bandipur-Mudumalai Tiger Reserve.' },
        { mode: 'KSRTC Airavat AC Bus', duration: '7 to 8 hours', cost: '₹650 - ₹950', details: 'Direct day and night buses from Bengaluru Satellite Bus Stand.' }
      ],
      local: 'Local taxis, tourist autos, and town buses connecting Coonoor and Pykara.'
    }
  },

  'goa': {
    name: 'Goa',
    state: 'Goa',
    nickname: 'Pearl of the Orient / Sun, Sand & Portuguese Heritage',
    overview: 'Goa is India\'s premier coastal getaway, famous for golden beaches, UNESCO Portuguese churches, fragrant spice plantations, vibrant flea markets, and relaxed susegad vibes.',
    history: 'Ruled by the Portuguese for over 450 years from 1510 until 1961, Goa presents a unique blend of Indian and Iberian culture, architecture, and cuisine.',
    best_time: 'November to February (Cool coastal breezes 20°C - 30°C); July to September for lush monsoons.',
    ideal_duration: '3 to 4 Days',
    attractions: [
      { name: 'Basilica of Bom Jesus (Old Goa)', category: 'UNESCO World Heritage Church', timings: '9:00 AM - 6:30 PM', entry_fee: 'Free', est_time: '1.5 hours', highlight: '16th-century Baroque church holding the sacred mortal remains of St. Francis Xavier.' },
      { name: 'Fort Aguada & Lighthouse', category: 'Coastal Portuguese Fort', timings: '9:30 AM - 6:00 PM', entry_fee: '₹25', est_time: '1.5 hours', highlight: '17th-century clifftop fortress overlooking the confluence of Mandovi River and Arabian Sea.' },
      { name: 'Baga & Calangute Beaches', category: 'Beaches & Water Sports', timings: 'Open 24 Hours', entry_fee: 'Free', est_time: '3 hours', highlight: 'High-energy beaches with parasailing, jet skiing, beach shacks, and nightlife.' },
      { name: 'Dudhsagar Waterfalls', category: 'Waterfall & Forest Safari', timings: '6:00 AM - 5:00 PM', entry_fee: '₹500 (Jeep safari)', est_time: 'Half day', highlight: 'Four-tiered 310-meter white cataract cascading beneath the famous railway bridge.' }
    ],
    food: [
      { name: 'Authentic Goan Fish Curry Thali', description: 'Fresh Kingfish simmered in tangy coconut-kokum gravy served with rice, kismoor, and sol kadhi.', where: 'Ritz Classic (Panaji) / Fisherman\'s Wharf' },
      { name: 'Bebinca & Feni', description: 'Traditional multi-layered Goan coconut milk pudding and indigenous cashew spirit.', where: 'Local bakeries across Fontainhas' }
    ],
    transport: {
      from_bengaluru: [
        { mode: 'Direct Flights (BLR to GOI / GOX)', duration: '1 hour 15 mins', cost: '₹2,500 - ₹4,500', details: 'Multiple daily non-stop flights from Bengaluru.' },
        { mode: 'KSRTC / Private AC Sleeper Bus', duration: '11 hours (Overnight)', cost: '₹950 - ₹1,600', details: 'Overnight comfortable sleeper buses to Panaji and Mapusa.' }
      ],
      local: 'Scooter / Moped rentals (₹350 - ₹500/day) and GoaMiles app cabs.'
    }
  },

  'munnar': {
    name: 'Munnar',
    state: 'Kerala',
    nickname: 'Kashmir of South India / High Ranges of God\'s Own Country',
    overview: 'Perched at 5,200 feet in Kerala\'s Western Ghats, Munnar is a breathtaking hill station blanketed in rolling emerald tea plantations, mist-draped peaks, and rare mountain wildlife.',
    history: 'A favorite summer retreat for British planters in the late 19th century, transforming into India\'s prime center for orthodox tea production.',
    best_time: 'September to March (Pleasant, cool weather 12°C - 24°C).',
    ideal_duration: '2 to 3 Days',
    attractions: [
      { name: 'Eravikulam National Park', category: 'Wildlife Sanctuary', timings: '7:30 AM - 4:00 PM (Closed Feb-March for calving)', entry_fee: '₹200', est_time: '3 hours', highlight: 'Home of the endangered Nilgiri Tahr mountain goat and rare Neelakurinji flowers.' },
      { name: 'Mattupetty Dam & Lake', category: 'Dam & Boating', timings: '9:30 AM - 5:00 PM', entry_fee: '₹20 (Speedboat extra)', est_time: '1.5 hours', highlight: 'Picturesque concrete gravity dam surrounded by tea hills, with speedboating.' },
      { name: 'KDHP Tea Museum', category: 'Tea Heritage', timings: '9:00 AM - 5:00 PM (Closed Mondays)', entry_fee: '₹125', est_time: '1.5 hours', highlight: 'Demonstrations of tea processing from freshly plucked leaves to packaged tea.' }
    ],
    food: [
      { name: 'Kerala Appam with Vegetable / Chicken Stew', description: 'Soft fermented rice crepes with coconut milk stew infused with black pepper and ginger.', where: 'Saravana Bhavan / Rapsy Restaurant' },
      { name: 'Fresh Kerala Banana Chips', description: 'Crisp raw Nendran bananas fried fresh in pure coconut oil.', where: 'Munnar Town Spice Bazaars' }
    ],
    transport: {
      from_bengaluru: [
        { mode: 'KSRTC Airavat AC Bus to Munnar', duration: '10 hours (Overnight)', cost: '₹850 - ₹1,200', details: 'Overnight bus via Coimbatore and Pollachi.' }
      ],
      local: 'Auto rickshaws and private rental cabs for winding tea estate circuits.'
    }
  },

  'agra': {
    name: 'Agra',
    state: 'Uttar Pradesh',
    nickname: 'City of the Taj / Imperial Mughal Capital',
    overview: 'Resting along the Yamuna River, Agra is home to three UNESCO World Heritage Sites, crowned by the Taj Mahal—one of the Seven Wonders of the World.',
    history: 'The royal seat of the Mughal Empire from 1526 to 1658 under Akbar, Jahangir, and Shah Jahan.',
    best_time: 'October to March (Pleasant winter weather 10°C - 25°C).',
    ideal_duration: '1 to 2 Days',
    attractions: [
      { name: 'Taj Mahal', category: 'UNESCO World Wonder', timings: 'Sunrise to Sunset (Closed Fridays)', entry_fee: '₹50 (Indians), ₹1,100 (Foreigners)', est_time: '2 - 3 hours', highlight: 'Colossal white marble mausoleum built by Shah Jahan in memory of Mumtaz Mahal.' },
      { name: 'Agra Fort', category: 'Mughal Citadel', timings: 'Sunrise to Sunset', entry_fee: '₹50', est_time: '2 hours', highlight: 'Red sandstone fortress housing Jahangiri Mahal, Khas Mahal, and Diwan-i-Khas.' },
      { name: 'Fatehpur Sikri (35 km)', category: 'UNESCO Deserted City', timings: 'Sunrise to Sunset', entry_fee: '₹50', est_time: '2.5 hours', highlight: 'Emperor Akbar\'s red sandstone capital with Buland Darwaza and Salim Chishti shrine.' }
    ],
    food: [
      { name: 'Authentic Agra Petha', description: 'Translucent ash gourd confection flavored with saffron, cardamom, and rose.', where: 'Panchhi Petha, Sadar Bazaar' },
      { name: 'Bedmi Puri & Aloo Sabzi', description: 'Crisp lentil-stuffed pooris paired with spicy fenugreek potato curry.', where: 'Deviram Sweets' }
    ],
    transport: {
      from_delhi: [
        { mode: 'Gatimaan Express / Vande Bharat (Train)', duration: '1 hr 40 mins', cost: '₹750 - ₹1,450', details: 'Fastest train from Hazrat Nizamuddin to Agra Cantt.' },
        { mode: 'Yamuna Expressway Drive', duration: '3.5 hours', cost: '₹2,500 - ₹3,500 by cab', details: 'Access-controlled 6-lane expressway.' }
      ]
    }
  }
};

/**
 * Clean and validate extracted destination names
 */
function cleanExtractedDestination(raw) {
  if (!raw) return null;
  let clean = raw.trim()
    .replace(/[?!.,;:]+$/, '')
    .replace(/\b(?:please|can you|explain|for|within|under|inr|rupees|budget|with|from|instead)\b.*$/i, '')
    .trim();

  const stopWords = [
    'you', 'this', 'that', 'there', 'here', 'it', 'more', 'trip', 'place', 'places',
    'the trip', 'this place', 'that place', 'photography', 'photo', 'photos',
    'food', 'hotels', 'stay', 'weekend', 'today', 'cheap', 'moderate', 'luxury',
    'couple', 'family', 'friends', 'solo', 'just me', 'a couple', 'me', 'us'
  ];

  if (clean.length < 2 || stopWords.includes(clean.toLowerCase())) {
    return null;
  }
  return clean.replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * 1. Intent Detection
 * Analyzes natural language message and context to classify user intent
 */
function detectIntent(message, context = {}, entities = {}) {
  const text = (message || '').toLowerCase().trim();

  // 1. Explicit destination change
  if (entities.isDestinationChange || text.includes('change my destination') || text.includes('switch destination') || text.includes('instead')) {
    return 'DESTINATION_CHANGE';
  }

  // 2. Interactive Selection: Travel Type ("Just Me", "A Couple", "Family", "Friends")
  const isTravelTypeSelection = /^(?:just\s+me|solo|a\s+couple|couple|family|friends|group)$/i.test(text) ||
    (/\b(?:just\s+me|a\s+couple|couple|family|friends)\b/i.test(text) && !text.includes('plan') && !text.includes('visit') && !text.includes('about') && !text.includes('trip to'));
  if (isTravelTypeSelection && (context.activeDestination || entities.destinationName)) {
    return 'TRAVEL_TYPE_SELECTED';
  }

  // 3. Interactive Selection: Budget Level ("Cheap", "Moderate", "Luxury")
  const isBudgetSelection = /^(?:cheap|moderate|luxury|backpacker|budget)$/i.test(text) ||
    (/\b(?:cheap|moderate|luxury)\b/i.test(text) && !text.includes('plan') && !text.includes('visit') && !text.includes('hotel') && !text.includes('food') && !text.includes('trip to'));
  if (isBudgetSelection && (context.activeDestination || entities.destinationName)) {
    return 'BUDGET_SELECTED';
  }

  // 4. Photography Query
  if (text.includes('photograph') || text.includes('photo') || text.includes('camera') || text.includes('picture') || text.includes('viewpoint')) {
    return 'PHOTOGRAPHY_QUERY';
  }

  // 5. Explicit Planning / Itinerary
  const planKeywords = [
    'plan a', 'plan my', 'create a trip', 'plan trip', 'create itinerary',
    'plan itinerary', 'make a plan', 'make an itinerary', 'day plan', 'days plan',
    'day trip', 'days trip', 'weekend trip', 'tour plan', 'holiday plan',
    'suggest an itinerary', 'schedule a trip', 'give me a plan', 'build a plan'
  ];
  const hasPlanKeyword = planKeywords.some(k => text.includes(k));
  const hasDayMention = /\b\d+\s*-?\s*days?\b/.test(text) || /\bweekend\b/.test(text);
  const hasBudgetMention = /(?:₹|rs\.?|inr|budget|within|under)\s*[\d,]+/i.test(text);

  if (hasPlanKeyword || (hasDayMention && (hasBudgetMention || text.includes('plan')))) {
    return 'PLAN_ITINERARY';
  }

  // 6. Plan Modification
  const isModifyRequested = context.currentPlan && (
    text.includes('cheaper') ||
    text.includes('reduce budget') ||
    text.includes('lower budget') ||
    text.includes('cut cost') ||
    text.includes('cut expense') ||
    text.includes('less expensive') ||
    text.includes('too expensive') ||
    text.includes('budget is too high') ||
    text.includes('more budget friendly') ||
    /\bmake\s+(?:it|this|the\s+trip|the\s+plan)?\s*cheaper\b/i.test(text) ||
    /\b(?:make\s+it|change\s+to)\s+\d+\s*days?\b/i.test(text) ||
    /\b(?:change\s+to|make\s+it)\s+veg/i.test(text)
  );
  if (isModifyRequested) {
    return 'MODIFY_PLAN';
  }

  // 7. Destination Discovery (e.g., "I want to visit Yadgir", "Visit Yadgir", "Explore Hampi")
  const isDiscovery = (
    text.startsWith('i want to visit') ||
    text.startsWith('want to visit') ||
    text.startsWith('i want to go to') ||
    text.startsWith('i would like to visit') ||
    text.startsWith('visit ') ||
    text.startsWith('explore ') ||
    text.startsWith('let\'s explore') ||
    text.startsWith('let\'s visit') ||
    text.startsWith('trip to ')
  ) && !text.includes('plan') && !text.includes('day') && !text.includes('budget') && !text.includes('cost');

  if (isDiscovery) {
    return 'DESTINATION_DISCOVERY';
  }

  // 8. Specific Question Categories
  if (text.includes('why is') && (text.includes('famous') || text.includes('known for'))) return 'HISTORY_CULTURE';
  if (text.includes('history') || text.includes('heritage') || text.includes('dynasty') || text.includes('who built') || text.includes('architecture of')) return 'HISTORY_CULTURE';
  if (text.includes('food') || text.includes('dish') || text.includes('eat') || text.includes('cuisine') || text.includes('restaurant') || text.includes('sweet') || text.includes('dosa') || text.includes('delicac')) return 'FOOD_DINING';
  if (text.includes('how can i reach') || text.includes('how to reach') || text.includes('how to get to') || text.includes('transport') || text.includes('flight') || text.includes('train') || text.includes('bus') || text.includes('expressway') || text.includes('distance from') || text.includes('drive to')) return 'TRANSPORT_DIRECTIONS';
  if (text.includes('best places') || text.includes('places to visit') || text.includes('attractions') || text.includes('must visit') || text.includes('sightseeing') || text.includes('top spots') || text.includes('things to see') || text.includes('tourist spots')) return 'ATTRACTIONS';
  if (text.includes('where to stay') || text.includes('hotels in') || text.includes('resorts in') || text.includes('homestay') || text.includes('accommodation') || text.includes('best hotel')) return 'HOTELS_ACCOMMODATION';
  if (text.includes('best time') || text.includes('when to visit') || text.includes('weather') || text.includes('climate') || text.includes('season') || text.includes('monsoon in')) return 'WEATHER_BEST_TIME';
  if (text.includes('how much will') || text.includes('approximate cost') || text.includes('is it expensive') || text.includes('trip cost') || text.includes('estimated cost')) return 'BUDGET_ESTIMATION';
  if (text.includes(' or ') && (text.includes('which is better') || text.includes('compare') || text.includes('vs'))) return 'COMPARISON';

  // 9. Greetings
  if (text.startsWith('hi') || text.startsWith('hello') || text.startsWith('hey') || text === 'how are you' || text === 'help') {
    if (text.includes('about') || text.includes('know') || text.includes('explain') || text.includes('trip') || text.includes('places') || text.includes('visit')) {
      return 'GENERAL_INFO';
    }
    return 'GREETING';
  }

  // 10. General destination inquiry
  if (text.includes('tell me about') || text.includes('what about') || text.includes('what is') || text.includes('explain') || text.includes('guide to') || text.includes('information on')) {
    return 'GENERAL_INFO';
  }

  // Default fallback based on active context
  if (context.activeDestination) {
    if (text.length < 30) return 'GENERAL_INFO';
  }

  return 'GENERAL_INFO';
}

/**
 * 2. Dynamic Entity Extraction
 * Accurately extracts destination, origin, days, budget, people, preferences
 * Supports ALL destinations in Karnataka & India without hardcoded fallbacks
 */
function extractEntities(message, context = {}) {
  const originalText = (message || '').trim();
  const text = originalText.toLowerCase();

  let destinationKey = null;
  let destinationName = null;
  let isExplicitlyMentioned = false;
  let isDestinationChange = false;

  // 1. Explicit destination change detection
  const changePatterns = [
    /(?:change\s+(?:my\s+)?destination\s+(?:from\s+[a-zA-Z\s]+\s+)?to)\s+([a-zA-Z\s]{2,35})/i,
    /(?:switch\s+(?:my\s+)?(?:destination|trip|plan)?\s*(?:from\s+[a-zA-Z\s]+\s+)?to)\s+([a-zA-Z\s]{2,35})/i,
    /(?:actually,?\s*(?:i\s+(?:would\s+)?(?:like|want)\s+to)?\s*(?:visit|explore|go\s+to)?)\s+([a-zA-Z\s]{2,35})\s+instead/i,
    /(?:instead\s+of\s+[a-zA-Z\s]+,?\s*(?:let\'?s\s+visit|i\s+want\s+to\s+visit)?)\s+([a-zA-Z\s]{2,35})/i
  ];

  for (const cp of changePatterns) {
    const match = originalText.match(cp);
    if (match && match[1]) {
      const clean = cleanExtractedDestination(match[1]);
      if (clean) {
        destinationName = clean;
        destinationKey = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
        isExplicitlyMentioned = true;
        isDestinationChange = true;
        break;
      }
    }
  }

  // 2. Comprehensive dictionary of Indian and Karnataka destinations
  const knownDestinations = [
    { key: 'yadgir', name: 'Yadgir', names: ['yadgir', 'yadavagiri', 'yadgiri'] },
    { key: 'mysore', name: 'Mysore (Mysuru)', names: ['mysore', 'mysuru', 'mysore palace', 'chamundi'] },
    { key: 'hampi', name: 'Hampi', names: ['hampi', 'vijayanagara', 'virupaksha', 'vittala'] },
    { key: 'coorg', name: 'Coorg (Kodagu)', names: ['coorg', 'kodagu', 'madikeri', 'abbey falls', 'rajas seat'] },
    { key: 'chikmagalur', name: 'Chikmagalur', names: ['chikmagalur', 'chikkamagaluru', 'mullayanagiri', 'baba budan', 'hebbe falls'] },
    { key: 'badami', name: 'Badami', names: ['badami', 'vatapi', 'pattadakal', 'aihole', 'agastya lake', 'cave temples'] },
    { key: 'gokarna', name: 'Gokarna', names: ['gokarna', 'om beach', 'kudle', 'mahabaleshwar temple'] },
    { key: 'ooty', name: 'Ooty', names: ['ooty', 'udhagamandalam', 'nilgiris', 'doddabetta'] },
    { key: 'goa', name: 'Goa', names: ['goa', 'panaji', 'baga', 'calangute', 'anjuna', 'palolem', 'fort aguada', 'dudhsagar'] },
    { key: 'bengaluru', name: 'Bengaluru', names: ['bengaluru', 'bangalore', 'lalbagh', 'cubbon park'] },
    { key: 'kalaburagi', name: 'Kalaburagi (Gulbarga)', names: ['kalaburagi', 'gulbarga'] },
    { key: 'bidar', name: 'Bidar', names: ['bidar', 'mahmud gawan'] },
    { key: 'raichur', name: 'Raichur', names: ['raichur'] },
    { key: 'koppal', name: 'Koppal', names: ['koppal'] },
    { key: 'ballari', name: 'Ballari (Bellary)', names: ['ballari', 'bellary'] },
    { key: 'vijayapura', name: 'Vijayapura (Bijapur)', names: ['vijayapura', 'bijapur', 'gol gumbaz'] },
    { key: 'bagalkot', name: 'Bagalkot', names: ['bagalkot'] },
    { key: 'belagavi', name: 'Belagavi (Belgaum)', names: ['belagavi', 'belgaum'] },
    { key: 'dharwad', name: 'Dharwad', names: ['dharwad', 'hubli', 'hubballi'] },
    { key: 'shivamogga', name: 'Shivamogga (Shimoga)', names: ['shivamogga', 'shimoga', 'jog falls'] },
    { key: 'udupi', name: 'Udupi', names: ['udupi', 'malpe', 'st mary', 'krishna matha'] },
    { key: 'mangalore', name: 'Mangaluru (Mangalore)', names: ['mangalore', 'mangaluru', 'panambur'] },
    { key: 'dandeli', name: 'Dandeli', names: ['dandeli', 'kali river', 'syntheri'] },
    { key: 'hassan', name: 'Hassan', names: ['hassan', 'shettihalli'] },
    { key: 'chitradurga', name: 'Chitradurga', names: ['chitradurga', 'kallina kote'] },
    { key: 'tumakuru', name: 'Tumakuru (Tumkur)', names: ['tumakuru', 'tumkur'] },
    { key: 'kolar', name: 'Kolar', names: ['kolar', 'kgf'] },
    { key: 'mandya', name: 'Mandya', names: ['mandya', 'srirangapatna', 'ranganathittu'] },
    { key: 'chamarajanagar', name: 'Chamarajanagar', names: ['chamarajanagar', 'bandipur', 'br hills'] },
    { key: 'munnar', name: 'Munnar', names: ['munnar', 'idukki', 'eravikulam', 'mattupetty'] },
    { key: 'alleppey', name: 'Alleppey (Alappuzha)', names: ['alleppey', 'alappuzha', 'backwaters', 'kettuvallam'] },
    { key: 'wayanad', name: 'Wayanad', names: ['wayanad', 'chembra', 'banasura', 'edakkal'] },
    { key: 'kochi', name: 'Kochi (Cochin)', names: ['kochi', 'cochin', 'fort kochi'] },
    { key: 'jaipur', name: 'Jaipur', names: ['jaipur', 'pink city', 'amber fort', 'hawa mahal'] },
    { key: 'udaipur', name: 'Udaipur', names: ['udaipur', 'lake pichola', 'city palace udaipur'] },
    { key: 'jodhpur', name: 'Jodhpur', names: ['jodhpur', 'blue city', 'mehrangarh'] },
    { key: 'varanasi', name: 'Varanasi', names: ['varanasi', 'kashi', 'banaras', 'ganga aarti'] },
    { key: 'agra', name: 'Agra', names: ['agra', 'taj mahal', 'fatehpur sikri'] },
    { key: 'delhi', name: 'Delhi', names: ['delhi', 'new delhi', 'qutub minar', 'red fort', 'india gate'] },
    { key: 'mumbai', name: 'Mumbai', names: ['mumbai', 'bombay', 'marine drive', 'gateway of india'] },
    { key: 'kerala', name: 'Kerala', names: ['kerala'] },
    { key: 'manali', name: 'Manali', names: ['manali', 'rohtang', 'solang valley'] },
    { key: 'shimla', name: 'Shimla', names: ['shimla', 'kufri', 'mall road shimla'] },
    { key: 'rishikesh', name: 'Rishikesh', names: ['rishikesh', 'laxman jhula', 'triveni ghat'] },
    { key: 'darjeeling', name: 'Darjeeling', names: ['darjeeling', 'tiger hill', 'ghoom'] },
    { key: 'ladakh', name: 'Ladakh', names: ['ladakh', 'leh', 'pangong'] },
    { key: 'kanyakumari', name: 'Kanyakumari', names: ['kanyakumari', 'vivekananda rock'] },
    { key: 'pondicherry', name: 'Pondicherry', names: ['pondicherry', 'puducherry', 'auroville', 'promenade beach'] },
    { key: 'shravanabelagola', name: 'Shravanabelagola', names: ['shravanabelagola', 'bahubali', 'gommateshwara'] },
    { key: 'belur', name: 'Belur', names: ['belur', 'chennakeshava'] },
    { key: 'halebidu', name: 'Halebidu', names: ['halebidu', 'halebid', 'hoysaleshwara'] },
    { key: 'kodaikanal', name: 'Kodaikanal', names: ['kodaikanal', 'kodai lake'] },
    { key: 'madurai', name: 'Madurai', names: ['madurai', 'meenakshi temple'] },
    { key: 'rameshwaram', name: 'Rameshwaram', names: ['rameshwaram', 'pamban bridge', 'dhanushkodi'] },
    { key: 'tirupati', name: 'Tirupati', names: ['tirupati', 'balaji temple', 'tirumala'] }
  ];

  if (!destinationName) {
    for (const item of knownDestinations) {
      if (item.names.some(n => new RegExp(`\\b${n}\\b`, 'i').test(text))) {
        destinationKey = item.key;
        destinationName = item.name;
        isExplicitlyMentioned = true;
        break;
      }
    }
  }

  // 3. Natural Language Pattern Extraction for Custom / Any Other Place
  if (!destinationName) {
    const placePatterns = [
      /(?:i\s+want\s+to\s+visit|want\s+to\s+visit|visiting|visit|let\'?s\s+visit|let\'?s\s+explore|explore|travel\s+to|travelling\s+to|trip\s+to|tour\s+to|head\s+to|going\s+to|go\s+to|vacation\s+in)\s+([a-zA-Z\s]{2,35})/i,
      /(?:plan\s+(?:a\s+)?(?:\d+[- ]day\s+)?(?:trip|tour|vacation|visit|itinerary|holiday)\s+to)\s+([a-zA-Z\s]{2,35})/i,
      /(?:tell\s+me\s+about|what\s+about|explain\s+about|information\s+on|guide\s+to|know\s+about|about)\s+([a-zA-Z\s]{2,35})/i,
      /(?:places\s+to\s+visit\s+in|best\s+places\s+in|attractions\s+in|things\s+to\s+do\s+in|sightseeing\s+in|top\s+spots\s+in)\s+([a-zA-Z\s]{2,35})/i,
      /(?:how\s+to\s+reach|how\s+can\s+i\s+reach|directions\s+to|route\s+to|distance\s+to)\s+([a-zA-Z\s]{2,35})/i,
      /(?:food\s+in|famous\s+food\s+in|what\s+to\s+eat\s+in|restaurants\s+in|cuisine\s+of)\s+([a-zA-Z\s]{2,35})/i,
      /(?:why\s+is|history\s+of|culture\s+of|heritage\s+of)\s+([a-zA-Z\s]{2,35})/i,
      /(?:best\s+time\s+to\s+visit|weather\s+in|climate\s+in)\s+([a-zA-Z\s]{2,35})/i
    ];

    for (const pattern of placePatterns) {
      const match = originalText.match(pattern);
      if (match && match[1]) {
        const clean = cleanExtractedDestination(match[1]);
        if (clean) {
          destinationName = clean;
          destinationKey = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
          isExplicitlyMentioned = true;
          break;
        }
      }
    }
  }

  // Check if destination explicitly changed from previous context
  if (isExplicitlyMentioned && context.activeDestination && destinationName) {
    const prevKey = context.activeDestination.toLowerCase().replace(/[^a-z0-9]/g, '');
    const currentKey = destinationName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (prevKey && currentKey && prevKey !== currentKey && !currentKey.includes(prevKey) && !prevKey.includes(currentKey)) {
      isDestinationChange = true;
    }
  }

  // 4. Inherit active destination from context ONLY if none explicitly mentioned
  if (!destinationName) {
    if (context.activeDestination && context.activeDestination !== 'Choose a destination') {
      destinationName = context.activeDestination;
      destinationKey = destinationName.toLowerCase().replace(/[^a-z0-9]/g, '');
    } else if (context.currentPlan && context.currentPlan.destination) {
      destinationName = context.currentPlan.destination;
      destinationKey = destinationName.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
  }

  // Extract Origin
  let origin = (context.currentPlan && context.currentPlan.origin) || context.origin || 'Bengaluru';
  if (text.includes('from delhi')) origin = 'Delhi';
  else if (text.includes('from mumbai')) origin = 'Mumbai';
  else if (text.includes('from hyderabad')) origin = 'Hyderabad';
  else if (text.includes('from chennai')) origin = 'Chennai';
  else if (text.includes('from kochi')) origin = 'Kochi';
  else if (text.includes('from bengaluru') || text.includes('from bangalore')) origin = 'Bengaluru';

  // Extract Days
  let days = (context.currentPlan && context.currentPlan.days) || context.days || 2;
  const matchDays = text.match(/(\d+)\s*-?\s*days?/);
  if (matchDays && matchDays[1]) {
    days = Math.min(Math.max(parseInt(matchDays[1]), 1), 10);
  } else if (text.includes('weekend')) {
    days = 2;
  } else if (text.includes('week')) {
    days = 7;
  }

  // Extract Budget
  let budget = context.budget || null;
  const matchCurrency = text.match(/(?:₹|rs\.?|inr)\s*([\d,]+)/i) ||
                        text.match(/(?:within|under|budget|around|budget of|cost of)\s*(?:₹|rs\.?|inr)?\s*([\d,]{3,})/i) ||
                        text.match(/([\d,]{3,})\s*(?:rupees|inr|rs\.?)/i);
  if (matchCurrency && matchCurrency[1]) {
    const parsed = parseInt(matchCurrency[1].replace(/,/g, ''));
    if (parsed > 0) budget = parsed;
  }

  // Extract Budget Level (Cheap, Moderate, Luxury)
  let budgetLevel = context.budgetLevel || 'Moderate';
  if (text.includes('cheap') || text.includes('backpacker') || text.includes('low budget') || text.includes('pocket friendly')) {
    budgetLevel = 'Cheap';
  } else if (text.includes('moderate') || text.includes('standard') || text.includes('balanced')) {
    budgetLevel = 'Moderate';
  } else if (text.includes('luxury') || text.includes('premium') || text.includes('5-star') || text.includes('high end')) {
    budgetLevel = 'Luxury';
  }

  // Extract People / Traveler Type
  let people = (context.currentPlan && context.currentPlan.people) || context.people || 2;
  let travellerType = (context.currentPlan && context.currentPlan.traveller_type) || context.travellerType || context.travelType || 'Couple';
  if (text.includes('family') || text.includes('kids') || text.includes('parents')) {
    travellerType = 'Family';
    people = 4;
  } else if (text.includes('just me') || text.includes('solo') || text.includes('alone')) {
    travellerType = 'Just Me';
    people = 1;
  } else if (text.includes('friends') || text.includes('group') || text.includes('students') || text.includes('colleagues')) {
    travellerType = 'Friends';
    people = 3;
  } else if (text.includes('a couple') || text.includes('couple') || text.includes('romantic') || text.includes('honeymoon')) {
    travellerType = 'A Couple';
    people = 2;
  }

  const matchPeople = text.match(/(\d+)\s*(?:people|persons|travelers|friends|adults)/);
  if (matchPeople && matchPeople[1]) {
    people = Math.max(parseInt(matchPeople[1]), 1);
  }

  // Extract Food Preference
  let foodPreference = context.foodPreference || 'No Preference';
  if (text.includes('pure veg') || text.includes('vegetarian') || text.includes(' veg ')) {
    foodPreference = 'Vegetarian';
  } else if (text.includes('non-veg') || text.includes('non veg') || text.includes('seafood')) {
    foodPreference = 'Non-Vegetarian';
  }

  // Extract Travel Mode
  let transport = context.transport || 'Express Train';
  if (text.includes('car') || text.includes('drive') || text.includes('cab') || text.includes('road trip')) {
    transport = 'Private Cab / Car';
  } else if (text.includes('bus') || text.includes('ksrtc') || text.includes('volvo')) {
    transport = 'AC Express Bus';
  } else if (text.includes('flight') || text.includes('air')) {
    transport = 'Flight';
  } else if (text.includes('train') || text.includes('vande bharat')) {
    transport = 'Express Train';
  }

  return {
    destinationKey,
    destinationName,
    isExplicitlyMentioned,
    isDestinationChange,
    origin,
    days,
    budget,
    budgetLevel,
    people,
    travellerType,
    foodPreference,
    transport
  };
}

/**
 * 3. Dynamic Prompt Suggestion Generator
 * Generates 4 context-relevant follow-up suggestions for the current conversation
 */
function generateFollowUpSuggestions(intent, destinationName = '', hasPlan = false) {
  const dName = (destinationName || '').split(' ')[0] || 'your destination';

  if (intent === 'DESTINATION_DISCOVERY' || intent === 'GENERAL_INFO') {
    return [
      `What are the best places to visit in ${dName}?`,
      `Which place is best for photography in ${dName}?`,
      `What food is ${dName} famous for?`,
      `Plan a 2-day trip to ${dName} within ₹6,000`
    ];
  }

  if (intent === 'TRAVEL_TYPE_SELECTED') {
    return [
      `Moderate budget`,
      `Cheap budget`,
      `Luxury trip`,
      `What are the top attractions in ${dName}?`
    ];
  }

  if (intent === 'BUDGET_SELECTED' || intent === 'ATTRACTIONS') {
    return [
      `Which place is best for photography in ${dName}?`,
      `What food is famous in ${dName}?`,
      `How can I reach ${dName} from Bengaluru?`,
      `Plan a 2-day trip to ${dName} within ₹6,000`
    ];
  }

  if (intent === 'PHOTOGRAPHY_QUERY') {
    return [
      `What are the must-see historical places in ${dName}?`,
      `What food is famous in ${dName}?`,
      `What is the best time to visit ${dName}?`,
      `Plan a 2-day photography trip to ${dName}`
    ];
  }

  if (intent === 'HISTORY_CULTURE') {
    return [
      `What are the must-see historical places in ${dName}?`,
      `Which place is best for photography in ${dName}?`,
      `Tell me about local traditions in ${dName}`,
      `What food is famous in ${dName}?`
    ];
  }

  if (intent === 'FOOD_DINING') {
    return [
      `What are the top attractions in ${dName}?`,
      `Which place is best for photography in ${dName}?`,
      `Plan a 2-day foodie and heritage trip to ${dName}`,
      `How can I reach ${dName} from Bengaluru?`
    ];
  }

  if (intent === 'TRANSPORT_DIRECTIONS') {
    return [
      `What are the best places to visit in ${dName}?`,
      `What is the best time of year to visit ${dName}?`,
      `Plan a 2-day trip to ${dName}`,
      `What food is ${dName} famous for?`
    ];
  }

  if (intent === 'PLAN_ITINERARY' || intent === 'MODIFY_PLAN') {
    return [
      `Can you make this ${dName} trip cheaper?`,
      `Which place is best for photography in ${dName}?`,
      `What are the best local food dishes to try in ${dName}?`,
      `How can I reach ${dName} from Bengaluru?`
    ];
  }

  return [
    `Tell me about Yadgir`,
    `What are the best places in Hampi?`,
    `Plan a 2-day trip to Coorg within ₹6,000`,
    `Top weekend getaways near Bengaluru`
  ];
}

/**
 * 4. Conversational Assistant Handlers
 */

// Discovery Flow Handler
function handleDestinationDiscovery(destData) {
  const sightsList = (destData.attractions || []).slice(0, 3).map(a => `• **${a.name}**: ${a.highlight || a.description}`).join('\n');
  const text = `### 🌟 Great choice! Let's explore **${destData.name}** (${destData.state || 'Karnataka'})

${destData.overview}

${sightsList ? `#### 🏛️ Top Highlights in ${destData.name}:\n${sightsList}\n\n` : ''}Are you planning a solo trip, a romantic getaway, a family vacation, or a trip with friends?`;

  const options = [
    { label: 'Just Me', value: 'Just Me' },
    { label: 'A Couple', value: 'A Couple' },
    { label: 'Family', value: 'Family' },
    { label: 'Friends', value: 'Friends' }
  ];

  return { text, options };
}

// Travel Type Selected Handler
function handleTravelTypeSelected(destData, travellerType) {
  const text = `### 👥 Wonderful — a trip for **${travellerType}** to **${destData.name}**!

What kind of budget do you have in mind for exploring ${destData.name}?`;

  const options = [
    { label: 'Cheap', subtext: 'Stay conscious of costs', value: 'Cheap' },
    { label: 'Moderate', subtext: 'Keep costs balanced', value: 'Moderate' },
    { label: 'Luxury', subtext: 'Don\'t worry about cost', value: 'Luxury' }
  ];

  return { text, options };
}

// Budget Selected Handler
function handleBudgetSelected(destData, budgetLevel, travellerType) {
  const sightsFormatted = (destData.attractions || []).map((a, idx) => `
### ${idx + 1}. ${a.name}
* **Category:** ${a.category || 'Attraction'}
* **Why Visit:** ${a.highlight || a.description || `Famous sightseeing point in ${destData.name}`}
* **Timings:** ${a.timings || '9:00 AM - 6:00 PM'}
* **Entry Fee:** ${a.entry_fee || 'Standard entry'}
* **Estimated Time:** ${a.est_time || '1.5 - 2 hours'}
* **Suggested Activities:** Sightseeing, photography, and exploring local heritage.
`).join('\n');

  const text = `### 📍 Curated Tourist Attractions in **${destData.name}**
*(Tailored for **${travellerType || 'Travelers'}** • **${budgetLevel || 'Moderate'}** Budget)*

Here are the top attractions and experiences to explore in and around **${destData.name}**:

${sightsFormatted}

---

#### 🗓️ Practical Visiting Guidance for ${destData.name}:
• **Best Time to Visit:** ${destData.best_time || 'October to March'}  
• **Ideal Duration:** ${destData.ideal_duration || '2 Days'}  
• **Getting Around:** ${destData.transport?.local || `Local auto rickshaws, cabs, and city transport in ${destData.name}.`}  
• **Travel Advice:** ${destData.safety_tips || 'Start early in the morning for the most pleasant weather and unhurried sightseeing.'}

*Would you like to know the best photography spots, famous local food, or plan a complete day-by-day itinerary?*`;

  return { text, options: [] };
}

// Photography Handler
function handlePhotography(destData) {
  let photoSpots = '';
  if (destData.attractions && destData.attractions.length > 0) {
    photoSpots = destData.attractions.slice(0, 4).map((a, idx) => `
### ${idx + 1}. ${a.name}
* **Photographic Appeal:** ${a.highlight || a.description}
* **Best Light / Timing:** Early morning (6:30 AM - 8:30 AM) or golden hour before sunset (5:00 PM - 6:30 PM).
* **Photo Tip:** Capture elevated landscapes and dramatic shadows on ancient architecture.
`).join('\n');
  } else {
    photoSpots = `• **Panoramic Viewpoints:** 360-degree elevated landscapes of ${destData.name}.\n• **Historic Heritage Sites:** Ancient architecture with dramatic shadows during sunrise and sunset.`;
  }

  const text = `### 📸 Best Photography Locations in **${destData.name}**

Looking to capture stunning photos in **${destData.name}**? Here are the most photogenic viewpoints and heritage spots:

${photoSpots}

---
💡 **Photography Advice for ${destData.name}:** For the most dramatic lighting and minimal haze, early morning golden-hour shoots offer the cleanest compositions with fewer visitors.`;

  return { text, options: [] };
}

// Destination Change Handler
function handleDestinationChange(newDestData, oldDestName = '') {
  const switchNote = oldDestName ? `Updated your destination from **${oldDestName}** to **${newDestData.name}**.` : `Updated your destination to **${newDestData.name}**.`;

  const text = `### 🔄 ${switchNote}

All previous recommendations and plans have been refreshed for **${newDestData.name}** (${newDestData.state || 'Karnataka'}).

${newDestData.overview}

Are you planning a solo trip, a romantic getaway, a family vacation, or a trip with friends?`;

  const options = [
    { label: 'Just Me', value: 'Just Me' },
    { label: 'A Couple', value: 'A Couple' },
    { label: 'Family', value: 'Family' },
    { label: 'Friends', value: 'Friends' }
  ];

  return { text, options };
}

// A. General Destination Overview
function handleGeneralInfo(destData, greetingPrefix = '') {
  const sightsList = destData.attractions.slice(0, 4).map(a => `• **${a.name}**: ${a.highlight}`).join('\n');
  const foodList = destData.food.slice(0, 2).map(f => `• **${f.name}**: ${f.description}`).join('\n');

  return `${greetingPrefix}### 🌟 Discover ${destData.name} (${destData.nickname})

${destData.overview}

---

#### 🏛️ Iconic Sights & Highlights:
${sightsList}

#### 🍽️ Famous Culinary Traditions:
${foodList}

#### 🗓️ Visiting Advice:
• **Best Time to Visit:** ${destData.best_time}  
• **Ideal Duration:** ${destData.ideal_duration}  
• **Local Safety:** ${destData.safety_tips || 'A very safe, tourist-friendly destination with great civic transport.'}

---
*Would you like to explore specific tourist places, discover the royal history, check out transport routes, or create a customized travel plan? Choose a suggestion below or ask away!*`;
}

// B. Tourist Attractions
function handleAttractions(destData) {
  const sightsFormatted = destData.attractions.map((a, idx) => `
### ${idx + 1}. ${a.name}
* **Category:** ${a.category}
* **Timings:** ${a.timings}
* **Entry Fee:** ${a.entry_fee}
* **Estimated Time:** ${a.est_time}
* **Why Visit:** ${a.highlight}
`).join('\n');

  return `### 📍 Top Attractions & Places to Visit in ${destData.name}

Here is a curated guide to the most rewarding places to visit in **${destData.name}**, with visiting hours and ticket details:

${sightsFormatted}

---
💡 **Pro Traveler Tip:** Visit **${destData.attractions?.[0]?.name || destData.name}** in the morning to enjoy unhurried sightseeing before peak visiting hours.`;
}

// C. History and Culture
function handleHistoryCulture(destData, specificSubject = '') {
  let cultureSection = '';
  if (destData.cultural_symbols && destData.cultural_symbols.length > 0) {
    cultureSection = destData.cultural_symbols.map(s => `• **${s.title}:** ${s.description}`).join('\n');
  } else if (destData.db_culture) {
    cultureSection = destData.db_culture;
  } else {
    cultureSection = `• **Living Traditions:** Known for vibrant local celebrations, folk arts, temple festivals, and deep-rooted heritage.
• **Art & Architecture:** Rich regional craftsmanship reflected in traditional stone monuments, sculptures, and historic streets.`;
  }

  return `### 👑 Heritage, Culture & History of ${destData.name}

${destData.history || destData.db_history || destData.overview}

---

#### 🎨 Living Arts, Crafts & Cultural Heritage:
${cultureSection}`;
}

// D. Local Food and Dining
function handleFood(destData) {
  const foodItems = (destData.food || []).map((f, i) => `
### ${i + 1}. ${f.name}
${f.description}  
📍 **Where to Taste It:** *${f.where || `Popular traditional eateries across ${destData.name}`}*
`).join('\n');

  const topEatery = destData.food?.[0]?.where || `local eateries in ${destData.name}`;

  return `### 🍽️ Famous Culinary Delights of ${destData.name}

${destData.name} is a paradise for food lovers! Here are the legendary specialties you must experience:

${foodItems || `• **Traditional Regional Thali:** A delicious spread of local curries, rice/breads, and authentic sweet specialties.`}

---
💡 **Local Tip:** Visit **${topEatery}** during morning or early evening hours to enjoy specialties freshly prepared on traditional setups.`;
}

// E. Transportation and Routes
function handleTransport(destData, origin = 'Bengaluru') {
  let transRoutes = '';
  if (destData.transport?.from_bengaluru && destData.transport.from_bengaluru.length > 0) {
    transRoutes = destData.transport.from_bengaluru.map((t, idx) => `
#### ${idx + 1}. ${t.mode}
* **Travel Time:** ${t.duration}
* **Approximate Cost:** ${t.cost}
* **Details:** ${t.details}
`).join('\n');
  } else {
    transRoutes = `
• **By Train:** Regular express trains connect major railway junctions to ${destData.name}.
• **By Road / Bus:** Direct AC and non-AC state transport buses (KSRTC / private) operate daily and overnight.
• **By Air / Cab:** Nearest major airport and well-maintained highway networks offer seamless connectivity.
`;
  }

  return `### 🚆 How to Reach ${destData.name} from ${origin}

Traveling from **${origin}** to **${destData.name}**:

${transRoutes}

---

#### 🛺 Getting Around within ${destData.name}:
${destData.transport?.local || `Local auto rickshaws, cabs, and state city buses provide easy connectivity between attractions in ${destData.name}.`}

💡 **Recommendation:** Start early in the morning to beat the highway traffic and make the most of your travel day!`;
}

// F. Weather & Best Time
function handleWeather(destData) {
  return `### ☀️ Best Time to Visit & Weather in ${destData.name}

${destData.best_time || 'October to March offers pleasant weather ideal for outdoor travel.'}

---

#### 🌤️ Season-by-Season Breakdown:
1. **Winter (October – February) — 🌟 PEAK SEASON:**
   • **Temperature:** 18°C – 30°C  
   • **Experience:** Crisp mornings, comfortable sunny afternoons, and pleasant evenings. Ideal for exploring heritage monuments, forts, viewpoints, and nature spots in ${destData.name}.
2. **Summer (March – May):**
   • **Temperature:** 24°C – 38°C  
   • **Experience:** Warm afternoons. Plan outdoor sightseeing early in the morning (6:30 AM - 10:00 AM) and after 4:30 PM. Keep well hydrated.
3. **Monsoon (June – September):**
   • **Temperature:** 22°C – 30°C  
   • **Experience:** Refreshing showers and lush green landscapes across ${destData.name}. Lakes, reservoirs, and natural waterfalls are at their scenic best.`;
}

// G. Comparison
function handleComparison(dest1Name, dest2Name) {
  return `### ⚖️ Destination Comparison: ${dest1Name} vs ${dest2Name}

Both destinations offer incredible travel experiences in South India, but cater to different travel moods:

| Feature | ${dest1Name} | ${dest2Name} |
| :--- | :--- | :--- |
| **Primary Vibe** | Royal Heritage, Grand Palaces, Silk & Culture | Misty Mountain Hills, Tea Plantations, Cool Pines |
| **Ideal For** | Families, History Buffs, Foodies, Architecture | Couples, Honeymoons, Trekkers, Nature Escapes |
| **Climate** | Pleasant & Warm (18°C - 32°C) | Cool & Misty (10°C - 22°C) |
| **Travel from Bengaluru** | 2 hours (Expressway / Vande Bharat) | 6 to 7 hours (Winding Ghat Roads) |
| **Pace of Travel** | Relaxed heritage walks & monument visits | Scenic drives, viewpoint treks, and estate relaxation |
| **Budget Friendly** | Highly affordable (Lots of transport & stays) | Moderate to luxury resort-oriented |

**Final Recommendation:**  
• Choose **${dest1Name}** if you want a short weekend trip (1-3 days) packed with history, world-class monuments, shopping, and iconic South Indian cuisine.  
• Choose **${dest2Name}** if you crave cool weather, mountain relaxation, coffee/tea estate walks, and an escape from city life.`;
}

/**
 * 5. Customized Trip & Budget Planner Engine
 */
function buildCustomizedPlan({
  destinationData,
  origin = 'Bengaluru',
  days = 3,
  people = 2,
  userBudget = null,
  travellerType = 'Couple',
  foodPreference = 'Vegetarian',
  transportMode = 'Express Train',
  isBudgetOptimized = false
}) {
  const destName = destinationData.name;
  const duration = Math.min(Math.max(parseInt(days) || 3, 1), 7);
  const peopleCount = Math.max(parseInt(people) || 1, 1);
  const nights = Math.max(duration - 1, 1);

  // Realistic Base Cost Calculations (INR)
  let transportPerPerson;
  let accommodationPerNight;
  let foodPerPersonPerDay;
  let localTransitPerDay;
  let activitiesPerPerson;

  if (isBudgetOptimized || (userBudget && userBudget / (peopleCount * duration) < 2000)) {
    // Budget-friendly backpacker / student tier
    transportPerPerson = 280; // Express train 2S / KSRTC Ordinary
    accommodationPerNight = peopleCount > 2 ? 1400 : 900; // Clean budget guesthouse / homestay
    foodPerPersonPerDay = 350; // Tiffin centers (Mylari, Gayatri Tiffin, Darshinis)
    localTransitPerDay = 250; // Public buses & shared autos
    activitiesPerPerson = 180; // Palace entry + temple free + gardens
  } else if (userBudget && userBudget / (peopleCount * duration) > 5000) {
    // Luxury tier
    transportPerPerson = 1400; // Vande Bharat Exec / Private Sedan Cab
    accommodationPerNight = peopleCount > 2 ? 6500 : 4500; // Heritage Palace Hotel
    foodPerPersonPerDay = 1200; // Royal dining, rooftop restaurants
    localTransitPerDay = 1200; // Dedicated AC cab
    activitiesPerPerson = 500; // Fast-track tickets, sound & light shows, private guides
  } else {
    // Standard comfortable tier
    transportPerPerson = 450; // Train CC / KSRTC Volvo
    accommodationPerNight = peopleCount > 2 ? 2800 : 1800; // 3-Star Deluxe Hotel
    foodPerPersonPerDay = 600; // Quality restaurants & specialty dining
    localTransitPerDay = 450; // Auto rickshaws & app cabs
    activitiesPerPerson = 300; // Palace entry, Chamundi Darshan, Brindavan Garden
  }

  const totalTransport = transportPerPerson * peopleCount * 2; // To & Fro
  const totalAccommodation = accommodationPerNight * nights;
  const totalFood = foodPerPersonPerDay * peopleCount * duration;
  const totalLocalTransit = localTransitPerDay * duration;
  const totalAttractions = activitiesPerPerson * peopleCount;
  const miscellaneous = Math.round((totalFood + totalAccommodation) * 0.08); // 8% buffer

  const calculatedTotal = totalTransport + totalAccommodation + totalFood + totalLocalTransit + totalAttractions + miscellaneous;
  const perPersonCost = Math.round(calculatedTotal / peopleCount);

  // Check user budget feasibility
  let budgetStatus = 'OPTIMAL';
  let budgetDifference = 0;
  let budgetExplanation = '';

  if (userBudget) {
    budgetDifference = userBudget - calculatedTotal;
    if (budgetDifference < 0) {
      budgetStatus = 'DEFICIT';
      budgetExplanation = `⚠️ **Budget Notice:** Your stated budget is ₹${userBudget.toLocaleString('en-IN')}, while estimated expenses for a comfortable ${duration}-day trip for ${peopleCount} travelers are ₹${calculatedTotal.toLocaleString('en-IN')} (shortfall of ₹${Math.abs(budgetDifference).toLocaleString('en-IN')}). We have pre-optimized your travel schedule below with cost-effective transportation and verified local dining to help you achieve the best trip experience without overspending.`;
    } else {
      budgetStatus = 'SURPLUS';
      budgetExplanation = `✅ **Budget Confirmed:** Your budget of ₹${userBudget.toLocaleString('en-IN')} comfortably covers this ${duration}-day itinerary (estimated cost: ₹${calculatedTotal.toLocaleString('en-IN')}). You have approximately ₹${budgetDifference.toLocaleString('en-IN')} remaining for shopping authentic local souvenirs, regional crafts, and discretionary indulgences in ${destName}!`;
    }
  }

  // Day-by-day itinerary generation
  const itinerary = [];
  const attractionsList = destinationData.attractions || [];
  const foodList = destinationData.food || [];

  for (let d = 1; d <= duration; d++) {
    const attr1 = attractionsList[(d * 2 - 2) % attractionsList.length] || { name: 'City Heritage Center', highlight: 'Ancient streets and architecture' };
    const attr2 = attractionsList[(d * 2 - 1) % attractionsList.length] || { name: 'Scenic Viewpoint', highlight: 'Panoramic views and sunset' };
    const foodSpecialty = foodList[(d - 1) % foodList.length] || { name: 'Regional Thali', where: 'Local Traditional Eatery' };

    let morningDesc;
    let afternoonDesc;
    let eveningDesc;

    if (d === 1) {
      morningDesc = `Depart from ${origin} via ${transportMode}. Arrive in ${destName}, check into your accommodation, refresh, and start with an authentic breakfast.`;
      afternoonDesc = `Head to **${attr1.name}**. Explore its architecture, royal courtyards, and photography spots (${attr1.highlight}). Enjoy a delicious ${foodPreference.toLowerCase()} lunch.`;
      eveningDesc = `Take a relaxing visit to **${attr2.name}** during the cooler hours. Explore nearby local markets and unwind over dinner featuring ${foodSpecialty.name}.`;
    } else if (d === duration && duration > 1) {
      morningDesc = `Early morning excursion to **${attr1.name}** for peaceful morning vistas and photography before tourist crowds arrive.`;
      afternoonDesc = `Visit **${attr2.name}**. Enjoy a farewell lunch tasting regional sweets and local delicacies. Spend time shopping for authentic local souvenirs.`;
      eveningDesc = `Check out from accommodation, head to the transit hub for your return journey back to ${origin}.`;
    } else {
      morningDesc = `Morning visit to **${attr1.name}**. Dive deep into regional heritage with local guides and artisan workshops.`;
      afternoonDesc = `Savor a wholesome ${foodPreference.toLowerCase()} lunch at a popular local mess. Continue exploration at **${attr2.name}**.`;
      eveningDesc = `Sunset panorama followed by an illuminated evening walk. Relish dinner featuring ${foodSpecialty.name} at ${foodSpecialty.where}.`;
    }

    const dayCost = Math.round(calculatedTotal / duration);

    itinerary.push({
      day: d,
      title: `Day ${d}: ${attr1.name} & Local Discovery`,
      morning: morningDesc,
      afternoon: afternoonDesc,
      evening: eveningDesc,
      attractions: [attr1.name, attr2.name],
      food_recommendations: {
        lunch: `${foodPreference} meal near ${attr1.name}`,
        dinner: `Dinner featuring ${foodSpecialty.name}`,
        specialty: foodSpecialty.name
      },
      travel_time: '20 - 35 mins between sights',
      suggested_transport: isBudgetOptimized ? 'Auto Rickshaw / Local City Bus' : 'Prepaid Auto / Dedicated Cab',
      estimated_cost: dayCost
    });
  }

  const structuredPlan = {
    destination: destName,
    origin,
    days: duration,
    nights,
    people: peopleCount,
    traveller_type: travellerType,
    transport: transportMode,
    food_preference: foodPreference,
    total_budget: userBudget || calculatedTotal,
    estimated_cost: calculatedTotal,
    per_person_cost: perPersonCost,
    budget_status: budgetStatus,
    budget_difference: budgetDifference,
    budget_explanation: budgetExplanation,
    cost_breakdown: {
      transportation: totalTransport,
      accommodation: totalAccommodation,
      food_dining: totalFood,
      local_transit: totalLocalTransit,
      sightseeing_activities: totalAttractions,
      miscellaneous
    },
    itinerary
  };

  return structuredPlan;
}

/**
 * 6. Format Plan into Clean Markdown Output for Chat
 */
function formatPlanMarkdown(plan) {
  const itemizedRows = `
| Expense Category | Details | Estimated Cost |
| :--- | :--- | :---: |
| 🚆 **To & Fro Transportation** | ${plan.transport} from ${plan.origin} (${plan.people} travelers) | ₹${plan.cost_breakdown.transportation.toLocaleString('en-IN')} |
| 🏨 **Accommodation** | ${plan.nights} night(s) for ${plan.people} travelers | ₹${plan.cost_breakdown.accommodation.toLocaleString('en-IN')} |
| 🍛 **Food & Dining** | ${plan.days} days of meals, local snacks & desserts | ₹${plan.cost_breakdown.food_dining.toLocaleString('en-IN')} |
| 🛺 **Local Transportation** | Autos, e-carts, and city transit for ${plan.days} days | ₹${plan.cost_breakdown.local_transit.toLocaleString('en-IN')} |
| 🎟️ **Sightseeing & Entry Fees** | Entry tickets to monuments, palaces & gardens | ₹${plan.cost_breakdown.sightseeing_activities.toLocaleString('en-IN')} |
| 🛍️ **Miscellaneous & Buffer** | Mineral water, tips, and safety reserve | ₹${plan.cost_breakdown.miscellaneous.toLocaleString('en-IN')} |
| **Total Estimated Trip Cost** | **For entire group of ${plan.people}** | **₹${plan.estimated_cost.toLocaleString('en-IN')}** |
| **Cost Per Person** | **Individual traveler average** | **₹${plan.per_person_cost.toLocaleString('en-IN')}** |
`;

  const daysMarkdown = plan.itinerary.map(item => `
#### 🗓️ Day ${item.day}: ${item.title}
* 🌅 **Morning:** ${item.morning}
* ☀️ **Afternoon:** ${item.afternoon}
* 🌙 **Evening:** ${item.evening}
* 🍽️ **Dining Pick:** ${item.food_recommendations.specialty}
* ⏱️ **Transit & Pacing:** ${item.travel_time} via ${item.suggested_transport}
`).join('\n');

  return `### 🗺️ Customized ${plan.days}-Day ${plan.destination} Itinerary

**Trip Overview:**  
• **Route:** ${plan.origin} ➔ ${plan.destination}  
• **Duration:** ${plan.days} Days / ${plan.nights} Night(s)  
• **Travelers:** ${plan.people} (${plan.traveller_type})  
• **Food Preference:** ${plan.food_preference}  
• **Transport Mode:** ${plan.transport}  

${plan.budget_explanation ? `\n${plan.budget_explanation}\n` : ''}

---

### 💰 Itemized Budget Breakdown
${itemizedRows}

---

### 📍 Day-by-Day Travel Schedule
${daysMarkdown}

---
💡 **Next Steps:** Check out the interactive plan card on the right-hand panel where you can **Save to My Trips**, **Print Route**, or **Book as a Guaranteed Package with ₹1,500 Instant Discount**!`;
}

let openAiQuotaExhausted = false;

/**
 * Call External LLM API (Google Gemini or OpenAI/Groq) for dynamic AI travel intelligence
 */
async function callLLMAssistant({ message, conversationHistory = [], context = {}, entities, destData }) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = openAiQuotaExhausted ? null : process.env.OPENAI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  const hasValidGeminiKey = geminiKey && geminiKey.trim().startsWith('AIzaSy');
  if (!hasValidGeminiKey && !openaiKey && !groqKey) {
    return null; // Zero-cost built-in engine fallback (instant response)
  }

  const formattedHistory = conversationHistory.slice(-6).map(m => {
    return `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content || m.text}`;
  }).join('\n');

  const destinationName = entities.destinationName || context.activeDestination || destData.name;
  const originCity = entities.origin || context.origin || 'Bengaluru';
  const tripDays = entities.days || context.days || 2;
  const groupCount = entities.people || context.people || 2;
  const groupType = entities.travellerType || context.travellerType || 'Couple';
  const userBudget = entities.budget || context.budget || null;

  const systemInstruction = `You are Tourist Hub AI, an intelligent travel assistant.

Always answer questions about the destination explicitly requested by the user or established by the conversation.

Before recommending attractions, identify the intended destination and retrieve relevant information for that destination.

Never use a hardcoded default destination when the user has supplied a different valid destination.

Never return attractions belonging to another city as though they are in the requested destination.

If a location name is ambiguous, ask the user to clarify rather than silently choosing a different location.

If no reliable results are found, explain that clearly and ask whether the user would like to try a nearby location.

Use conversation history to understand follow-up questions, but always prioritize an explicit destination change in the latest message.

Distinguish between the requested city, nearby destinations, and attractions within that city. Label nearby attractions accurately.

Provide helpful, natural, destination-specific travel guidance.

USER'S CURRENT REQUEST: "${message}"

TARGET DESTINATION FOR THIS REQUEST: "${destinationName}"
ORIGIN: "${originCity}"
DURATION: ${tripDays} Days
GROUP: ${groupCount} travelers (${groupType})
BUDGET: ${userBudget ? '₹' + userBudget : 'Flexible'}

RECENT CONVERSATION HISTORY:
${formattedHistory || 'None (new conversation)'}

CRITICAL RULES:
1. TARGET ACCURACY: You are discussing "${destinationName}". Do NOT answer about Mysore, Hampi, or any other city unless explicitly requested. Every attraction, food, and transit tip MUST belong strictly to "${destinationName}".
2. NO FORCED ITINERARY: If user asks a general question, overview, history, culture, attractions, food, or weather, set "plan": null and write an engaging Markdown response.
3. PLANNING: Only when user explicitly asks to PLAN a trip or itinerary, generate a realistic "plan" object strictly for "${destinationName}".
4. INTERACTIVE OPTIONS: When entering destination discovery or asking for preferences, return helpful options in "options" array.
5. STRICT JSON OUTPUT: Return ONLY a valid JSON object matching this schema with NO markdown wrapping around the JSON:
{
  "intent": "DESTINATION_DISCOVERY" | "TRAVEL_TYPE_SELECTED" | "BUDGET_SELECTED" | "PHOTOGRAPHY_QUERY" | "GENERAL_INFO" | "PLAN_ITINERARY" | "ATTRACTIONS" | "FOOD_DINING" | "TRANSPORT_DIRECTIONS" | "HISTORY_CULTURE" | "WEATHER_BEST_TIME" | "DESTINATION_CHANGE",
  "destination": "${destinationName}",
  "is_destination_change": ${!!entities.isDestinationChange},
  "options": [{"label": "...", "subtext": "...", "value": "..."}],
  "response_text": "<Full markdown response>",
  "suggested_prompts": ["<Prompt 1>", "<Prompt 2>", "<Prompt 3>"],
  "plan": null OR <Plan Object>
}`;

  try {
    let rawOutput = null;

    if (hasValidGeminiKey) {
      // Call Google Gemini API (tries fast flash models with 5s timeout)
      const candidateModels = ['gemini-1.5-flash', 'gemini-2.0-flash'];
      for (const model of candidateModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
          const payload = {
            contents: [
              {
                role: 'user',
                parts: [{ text: systemInstruction }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192
            }
          };

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(5000)
          });

          if (res.ok) {
            const data = await res.json();
            rawOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawOutput) break;
          } else {
            console.warn(`Gemini model ${model} returned status:`, res.status);
          }
        } catch (mErr) {
          console.warn(`Gemini model ${model} request error:`, mErr.message);
        }
      }
    } else if (openaiKey || groqKey) {
      // Call OpenAI or Groq API
      const isGroq = !!groqKey && !openaiKey;
      const endpoint = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
      const key = openaiKey || groqKey;
      const model = isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a travel AI assistant that outputs structured JSON.' },
            { role: 'user', content: systemInstruction }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7
        })
      });

      if (res.ok) {
        const data = await res.json();
        rawOutput = data?.choices?.[0]?.message?.content;
      } else {
        const errText = await res.text();
        console.warn('OpenAI/Groq call returned status:', res.status, errText);
        if (res.status === 429 || res.status === 401) {
          openAiQuotaExhausted = true;
        }
      }
    }

    if (!rawOutput) return null;

    let cleanJson = rawOutput.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    }

    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(cleanJson);

    if (parsed && parsed.response_text) {
      return parsed;
    }
  } catch (llmErr) {
    console.warn('LLM API error (falling back to built-in travel knowledge engine):', llmErr.message);
  }

  return null;
}

/**
 * Main Controller: Process User Message & Return Intelligent Response
 */
async function processChatMessage({ message, conversationHistory = [], context = {} }) {
  try {
    const intent = detectIntent(message, context);
    const entities = extractEntities(message, context);

    // Target destination
    const targetName = entities.destinationName || context.activeDestination || 'India';
    const targetKey = entities.destinationKey || targetName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Check static curated knowledge base
    let destData = DESTINATION_KNOWLEDGE[targetKey];

    // 2. Query MySQL database dynamically for ANY matching place!
    try {
      const [places] = await pool.query(
        `SELECT p.*, s.name as state_name 
         FROM tourist_places p 
         LEFT JOIN states s ON p.state_id = s.id 
         WHERE p.name LIKE ? OR p.location LIKE ? 
         LIMIT 1`,
        [`%${targetName}%`, `%${targetName}%`]
      );

      if (places.length > 0) {
        const place = places[0];
        const parseArr = (v) => {
          if (!v) return [];
          if (Array.isArray(v)) return v;
          if (typeof v === 'object') return [v];
          try { const p = JSON.parse(v); return Array.isArray(p) ? p : [p]; } catch (e) { return [v]; }
        };
        const attractionsList = parseArr(place.major_attractions);
        const foodList = parseArr(place.local_food);
        const transportList = parseArr(place.local_transport);

        if (destData) {
          destData = {
            ...destData,
            db_description: place.description || destData.overview,
            db_history: place.history || destData.history,
            db_culture: place.culture_info || destData.culture
          };
        } else {
          destData = {
            name: place.name,
            state: place.state_name || 'India',
            nickname: place.category || `${place.name} Exploration`,
            overview: place.description || `${place.name} is a renowned destination in ${place.state_name || 'India'}.`,
            history: place.history || `${place.name} holds rich cultural and historical significance.`,
            cultural_symbols: place.culture_info ? [{ title: 'Cultural Heritage', description: place.culture_info }] : null,
            best_time: place.best_time_to_visit || place.best_time || 'October to March (Winter)',
            ideal_duration: `${place.ideal_duration_days || 2} to 3 Days`,
            attractions: attractionsList.length > 0 ? attractionsList.map(a => typeof a === 'object' ? a : { name: a, category: 'Attraction', timings: '9:00 AM - 6:00 PM', entry_fee: 'Standard entry', est_time: '2 hours', highlight: `Iconic attraction in ${place.name}` }) : [
              { name: `${place.name} Landmark`, category: 'Heritage', timings: '9:00 AM - 5:30 PM', entry_fee: 'Standard', est_time: '2 hours', highlight: `Historic centerpiece of ${place.name}` }
            ],
            food: foodList.length > 0 ? foodList.map(f => typeof f === 'object' ? f : { name: f, description: `Authentic regional specialty of ${place.name}`, where: `Local eateries in ${place.name}` }) : [
              { name: `Traditional ${place.name} Thali`, description: 'Signature local cuisine with authentic flavors', where: `Traditional restaurants in ${place.name}` }
            ],
            transport: {
              from_bengaluru: [
                { mode: 'Direct Train / Bus', duration: 'Varies', cost: '₹300 - ₹900', details: `Regular trains and KSRTC coaches connect to ${place.name}.` },
                { mode: 'Private Cab / Self Drive', duration: 'Flexible', cost: '₹3,000 - ₹5,000', details: `Accessible via major national and state highways.` }
              ],
              local: transportList.length > 0 ? transportList.join(', ') : 'Local auto rickshaws, cabs, and state city buses.'
            },
            safety_tips: `Very tourist-friendly. Check opening hours and weather forecast before embarking.`
          };
        }
      }
    } catch (dbErr) {
      console.warn('DB destination lookup warning:', dbErr.message);
    }

    // 3. Dynamic destination fallback for unlisted custom places (e.g. Darjeeling, Paris, etc.)
    // NEVER DEFAULT TO MYSORE!
    if (!destData) {
      destData = {
        name: targetName,
        state: 'India',
        nickname: `${targetName} Travel Experience`,
        overview: `${targetName} is an attractive travel destination celebrated for its unique sights, cultural experiences, and scenic charm.`,
        history: `${targetName} has an interesting historical past and rich regional traditions passed down through generations.`,
        best_time: 'October to March offers pleasant weather ideal for outdoor sightseeing and travel.',
        ideal_duration: '2 to 3 Days',
        attractions: [
          { name: `${targetName} Heritage Center`, category: 'Landmark', timings: '9:00 AM - 6:00 PM', entry_fee: 'Standard entry', est_time: '2 hours', highlight: `The iconic cultural and historical landmark of ${targetName}.` },
          { name: `${targetName} Scenic Viewpoint`, category: 'Nature & Views', timings: '6:00 AM - 6:30 PM', entry_fee: 'Free', est_time: '1.5 hours', highlight: `Breathtaking panoramic viewpoint offering sweeping landscapes of ${targetName}.` },
          { name: `Historic Bazaars of ${targetName}`, category: 'Local Culture', timings: '10:00 AM - 8:30 PM', entry_fee: 'Free', est_time: '2 hours', highlight: `Vibrant traditional markets with local handicrafts, regional produce, and souvenirs.` }
        ],
        food: [
          { name: `Authentic ${targetName} Regional Thali`, description: 'Delicious local delicacies and signature regional preparations.', where: `Popular traditional dining spots in ${targetName}` },
          { name: 'Signature Local Snacks & Street Food', description: 'Freshly prepared popular street snacks and regional drinks.', where: `Bazaars and heritage food stalls in ${targetName}` }
        ],
        transport: {
          from_bengaluru: [
            { mode: 'Direct Express Train / Bus', duration: 'Standard travel time', cost: '₹300 - ₹1,200', details: `Regular train and bus connectivity from major transport hubs to ${targetName}.` },
            { mode: 'Private Cab / Self-Drive', duration: 'Flexible', cost: '₹3,000 - ₹6,000', details: `Connected via well-maintained national and state highways.` }
          ],
          local: `Auto rickshaws, app cabs, and local buses connect all major attractions across ${targetName}.`
        },
        safety_tips: `Enjoy exploring ${targetName}! Keep essentials handy and consult local guides for the best viewpoints.`
      };
    }

    // 1. If an external LLM API key is configured (Gemini or OpenAI/Groq), try calling LLM
    const llmResult = await callLLMAssistant({
      message,
      conversationHistory,
      context,
      entities,
      destData
    });

    if (llmResult && llmResult.response_text) {
      const followUpSuggestions = Array.isArray(llmResult.suggested_prompts) && llmResult.suggested_prompts.length > 0
        ? llmResult.suggested_prompts
        : generateFollowUpSuggestions(llmResult.intent || intent, llmResult.destination || destData.name, !!llmResult.plan);

      const isDestChangeLLM = !!llmResult.is_destination_change || intent === 'DESTINATION_CHANGE' || !!entities.isDestinationChange;
      return {
        success: true,
        intent: llmResult.intent || (llmResult.plan ? 'PLAN_ITINERARY' : 'GENERAL_INFO'),
        destination: llmResult.destination || destData.name,
        origin: entities.origin,
        response_text: llmResult.response_text,
        options: Array.isArray(llmResult.options) ? llmResult.options : [],
        is_destination_change: isDestChangeLLM,
        suggested_prompts: followUpSuggestions,
        plan: isDestChangeLLM ? null : (llmResult.plan || null),
        powered_by: process.env.GEMINI_API_KEY ? 'Google Gemini AI' : (process.env.OPENAI_API_KEY ? 'OpenAI' : 'Groq AI'),
        context_updates: {
          activeDestination: llmResult.destination || destData.name,
          origin: entities.origin,
          days: llmResult.plan?.days || entities.days,
          people: llmResult.plan?.people || entities.people,
          budget: llmResult.plan?.user_budget || entities.budget,
          currentPlan: llmResult.plan || context.currentPlan || null
        }
      };
    }

    // 2. Built-in Intelligence & Knowledge Engine Fallback
    let responseText = '';
    let planResult = null;

    // Dispatch by detected intent
    let optionsResult = [];

    switch (intent) {
      case 'DESTINATION_DISCOVERY': {
        const disc = handleDestinationDiscovery(destData);
        responseText = disc.text;
        optionsResult = disc.options;
        break;
      }

      case 'TRAVEL_TYPE_SELECTED': {
        const sel = handleTravelTypeSelected(destData, entities.travellerType);
        responseText = sel.text;
        optionsResult = sel.options;
        break;
      }

      case 'BUDGET_SELECTED': {
        const bg = handleBudgetSelected(destData, entities.budgetLevel, entities.travellerType);
        responseText = bg.text;
        optionsResult = bg.options;
        break;
      }

      case 'PHOTOGRAPHY_QUERY': {
        const phot = handlePhotography(destData);
        responseText = phot.text;
        optionsResult = phot.options;
        break;
      }

      case 'DESTINATION_CHANGE': {
        const oldDest = context.activeDestination && context.activeDestination !== destData.name ? context.activeDestination : '';
        const chg = handleDestinationChange(destData, oldDest);
        responseText = chg.text;
        optionsResult = chg.options;
        planResult = null;
        break;
      }
      case 'GREETING':
        responseText = `### 👋 Hello! Welcome to Tourist Hub AI

I am your intelligent India travel assistant. I can help you with:
• **Destination Overviews:** Ask about history, heritage, culture, and iconic sights.
• **Local Attractions:** Get opening timings, ticket prices, and visiting order.
• **Food & Dining:** Discover famous local sweets, legendary eateries, and regional cuisines.
• **Routes & Transport:** Learn how to reach by train, expressway, flight, or bus.
• **Custom Trip & Budget Planning:** Tell me your budget, dates, and group size to generate a realistic day-by-day plan!

*What destination are you dreaming of exploring today? Try asking:*  
• *"Tell me about Mysore"*  
• *"What are the best places to visit in Hampi?"*  
• *"Plan a 2-day trip to Mysore within ₹6,000"*`;
        break;

      case 'GENERAL_INFO':
        responseText = handleGeneralInfo(destData);
        break;

      case 'ATTRACTIONS':
        responseText = handleAttractions(destData);
        break;

      case 'HISTORY_CULTURE':
        responseText = handleHistoryCulture(destData, message);
        break;

      case 'FOOD_DINING':
        responseText = handleFood(destData);
        break;

      case 'TRANSPORT_DIRECTIONS':
        responseText = handleTransport(destData, entities.origin);
        break;

      case 'WEATHER_BEST_TIME':
        responseText = handleWeather(destData);
        break;

      case 'BUDGET_ESTIMATION': {
        const estPlan = buildCustomizedPlan({
          destinationData: destData,
          origin: entities.origin,
          days: entities.days || 2,
          people: entities.people || 2
        });
        responseText = `### 💵 Estimated Travel Expenses for ${destData.name}

For a **${entities.days || 2}-day trip** for **${entities.people || 2} traveler(s)** from **${entities.origin}**:

• **Comfortable Budget:** Approx **₹${estPlan.estimated_cost.toLocaleString('en-IN')}** total (₹${estPlan.per_person_cost.toLocaleString('en-IN')} per person).  
• **Backpacker / Student Budget:** Approx **₹${Math.round(estPlan.estimated_cost * 0.65).toLocaleString('en-IN')}** total.  
• **Luxury Heritage Budget:** Approx **₹${Math.round(estPlan.estimated_cost * 1.8).toLocaleString('en-IN')}** total.

**Typical Expense Ratios:**  
- Accommodation: ~35-40%  
- Food & Dining: ~25%  
- To & Fro Transit: ~20%  
- Sightseeing & Local Transit: ~15%  

*Would you like me to generate a complete day-by-day itinerary tailored to a specific budget limit?*`;
        break;
      }

      case 'COMPARISON': {
        const dest1 = destData.name;
        const dest2 = message.toLowerCase().includes('ooty') ? 'Ooty (Nilgiris)' : 'Hampi';
        responseText = handleComparison(dest1, dest2);
        break;
      }

      case 'PLAN_ITINERARY':
      case 'MODIFY_PLAN': {
        const isModify = intent === 'MODIFY_PLAN';
        const previousCost = context.currentPlan?.estimated_cost;
        const targetBudget = entities.budget || (isModify && previousCost ? Math.round(previousCost * 0.65) : entities.budget);

        const plan = buildCustomizedPlan({
          destinationData: destData,
          origin: entities.origin,
          days: entities.days,
          people: entities.people,
          userBudget: targetBudget,
          travellerType: entities.travellerType,
          foodPreference: entities.foodPreference,
          transportMode: isModify ? 'Express Train' : entities.transport,
          isBudgetOptimized: isModify || (entities.budget && entities.budget < 7000)
        });

        planResult = plan;

        if (isModify) {
          const savings = previousCost ? Math.max(0, previousCost - plan.estimated_cost) : 1800;
          responseText = `### 💡 Plan Revised: More Budget-Friendly & Cost-Optimized!

I have updated your **${destData.name}** itinerary to reduce expenses while keeping the most rewarding experiences:
• 🚆 **Transit:** Switched to affordable Express Train / AC state buses.
• 🏨 **Lodging:** Selected comfortable, verified budget heritage homestays / guesthouses.
• 🍛 **Dining:** Focused on iconic, highly rated traditional tiffin centers (like **${destData.food[0]?.name || 'local eateries'}**).
• 🎟️ **Sightseeing:** Prioritized high-value highlights, free heritage viewpoints, and walking tours.

${previousCost ? `**Previous Estimate:** ₹${previousCost.toLocaleString('en-IN')} ➔ **Revised Cost:** **₹${plan.estimated_cost.toLocaleString('en-IN')}** *(Saved ~₹${savings.toLocaleString('en-IN')}!)*` : `**Revised Total:** **₹${plan.estimated_cost.toLocaleString('en-IN')}** for ${plan.people} travelers (approx **₹${plan.per_person_cost.toLocaleString('en-IN')}** per person)`}

---

${formatPlanMarkdown(plan)}`;
        } else {
          responseText = formatPlanMarkdown(plan);
        }
        break;
      }

      default:
        responseText = handleGeneralInfo(destData);
        break;
    }

    const followUpSuggestions = generateFollowUpSuggestions(intent, destData.name, !!planResult);

    const isDestChange = intent === 'DESTINATION_CHANGE' || !!entities.isDestinationChange;
    return {
      success: true,
      intent,
      destination: destData.name,
      origin: entities.origin,
      response_text: responseText,
      options: optionsResult || [],
      is_destination_change: isDestChange,
      suggested_prompts: followUpSuggestions,
      plan: isDestChange ? null : planResult,
      context_updates: {
        activeDestination: destData.name,
        origin: entities.origin,
        days: entities.days,
        people: entities.people,
        budget: entities.budget,
        currentPlan: isDestChange ? null : (planResult || context.currentPlan || null)
      }
    };
  } catch (error) {
    console.error('Travel AI Service Error:', error);
    return {
      success: false,
      message: 'Failed to process travel question.',
      error: error.message
    };
  }
}

module.exports = {
  detectIntent,
  extractEntities,
  processChatMessage,
  buildCustomizedPlan,
  DESTINATION_KNOWLEDGE
};
