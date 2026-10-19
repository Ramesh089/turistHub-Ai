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
  }
};

/**
 * 1. Intent Detection
 * Analyzes natural language message and context to classify user intent
 */
function detectIntent(message, context = {}) {
  const text = (message || '').toLowerCase().trim();

  // Explicit planning / itinerary request keywords
  const planKeywords = [
    'plan a', 'plan my', 'create a trip', 'plan trip', 'create itinerary',
    'plan itinerary', 'make a plan', 'make an itinerary', 'day plan', 'days plan',
    'day trip', 'days trip', 'weekend trip', 'tour plan', 'holiday plan',
    'suggest an itinerary', 'schedule a trip', 'give me a plan', 'build a plan'
  ];

  // Check for plan modification
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

  // Check if user is explicitly asking to plan an itinerary
  const hasPlanKeyword = planKeywords.some(k => text.includes(k));
  const hasDayMention = /\b\d+\s*-?\s*days?\b/.test(text) || /\bweekend\b/.test(text);
  const hasBudgetMention = /(?:₹|rs\.?|inr|budget|within|under)\s*[\d,]+/i.test(text);

  if (hasPlanKeyword || (hasDayMention && (hasBudgetMention || text.includes('plan')))) {
    return 'PLAN_ITINERARY';
  }

  // Question intents (Conversational Assistant)
  if (text.includes('why is') && (text.includes('famous') || text.includes('known for'))) {
    return 'HISTORY_CULTURE';
  }

  if (text.includes('history') || text.includes('heritage') || text.includes('dynasty') || text.includes('who built') || text.includes('architecture of')) {
    return 'HISTORY_CULTURE';
  }

  if (text.includes('food') || text.includes('dish') || text.includes('eat') || text.includes('cuisine') || text.includes('restaurant') || text.includes('sweet') || text.includes('dosa') || text.includes('delicac')) {
    return 'FOOD_DINING';
  }

  if (text.includes('how can i reach') || text.includes('how to reach') || text.includes('how to get to') || text.includes('transport') || text.includes('flight') || text.includes('train') || text.includes('bus') || text.includes('expressway') || text.includes('distance from') || text.includes('drive to')) {
    return 'TRANSPORT_DIRECTIONS';
  }

  if (text.includes('best places') || text.includes('places to visit') || text.includes('attractions') || text.includes('must visit') || text.includes('sightseeing') || text.includes('top spots') || text.includes('things to see') || text.includes('tourist spots')) {
    return 'ATTRACTIONS';
  }

  if (text.includes('where to stay') || text.includes('hotels in') || text.includes('resorts in') || text.includes('homestay') || text.includes('accommodation') || text.includes('best hotel')) {
    return 'HOTELS_ACCOMMODATION';
  }

  if (text.includes('best time') || text.includes('when to visit') || text.includes('weather') || text.includes('climate') || text.includes('season') || text.includes('monsoon in')) {
    return 'WEATHER_BEST_TIME';
  }

  if (text.includes('how much will') || text.includes('approximate cost') || text.includes('is it expensive') || text.includes('trip cost') || text.includes('estimated cost')) {
    return 'BUDGET_ESTIMATION';
  }

  if (text.includes(' or ') && (text.includes('which is better') || text.includes('compare') || text.includes('vs'))) {
    return 'COMPARISON';
  }

  if (text.startsWith('hi') || text.startsWith('hello') || text.startsWith('hey') || text === 'how are you' || text === 'help') {
    // If greeting mentions destination, prioritize general info
    if (text.includes('mysore') || text.includes('hampi') || text.includes('jaipur') || text.includes('goa') || text.includes('coorg') || text.includes('varanasi') || text.includes('kerala')) {
      return 'GENERAL_INFO';
    }
    return 'GREETING';
  }

  // General destination inquiry (e.g., "Tell me about Mysore", "What about Coorg?", "Explain about Hampi")
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
 * 2. Entity Extraction
 * Extracts destination, origin, days, budget, people, preferences
 */
function extractEntities(message, context = {}) {
  const text = (message || '').toLowerCase();

  // Known destination matching
  let destination = null;
  const knownDestinations = [
    { key: 'mysore', names: ['mysore', 'mysuru'] },
    { key: 'hampi', names: ['hampi', 'vijayanagara'] },
    { key: 'coorg', names: ['coorg', 'kodagu', 'madikeri'] },
    { key: 'jaipur', names: ['jaipur', 'pink city'] },
    { key: 'varanasi', names: ['varanasi', 'kashi', 'banaras'] },
    { key: 'goa', names: ['goa', 'panaji', 'baga', 'calangute'] },
    { key: 'munnar', names: ['munnar', 'idukki'] },
    { key: 'alleppey', names: ['alleppey', 'alappuzha'] },
    { key: 'bengaluru', names: ['bengaluru', 'bangalore'] },
    { key: 'udaipur', names: ['udaipur', 'lake city'] },
    { key: 'jodhpur', names: ['jodhpur', 'blue city'] },
    { key: 'agra', names: ['agra', 'taj mahal'] },
    { key: 'manali', names: ['manali', 'kullu'] },
    { key: 'shimla', names: ['shimla'] },
    { key: 'gokarna', names: ['gokarna'] },
    { key: 'ooty', names: ['ooty', 'udagamandalam'] }
  ];

  for (const item of knownDestinations) {
    if (item.names.some(n => text.includes(n))) {
      destination = item.key;
      break;
    }
  }

  // Inherit active destination from context if none mentioned
  if (!destination) {
    if (context.currentPlan && context.currentPlan.destination) {
      destination = context.currentPlan.destination.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '');
    } else if (context.activeDestination) {
      destination = context.activeDestination.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '');
    }
  }

  // Fallback default
  if (!destination) {
    destination = 'mysore';
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
  let days = (context.currentPlan && context.currentPlan.days) || context.days || 3;
  const matchDays = text.match(/(\d+)\s*-?\s*days?/);
  if (matchDays && matchDays[1]) {
    days = Math.min(Math.max(parseInt(matchDays[1]), 1), 10);
  } else if (text.includes('weekend')) {
    days = 2;
  } else if (text.includes('week')) {
    days = 7;
  }

  // Extract Budget (handles within ₹6,000, under Rs 5000, 6000 rupees, etc.)
  let budget = context.budget || null;
  const matchCurrency = text.match(/(?:₹|rs\.?|inr)\s*([\d,]+)/i) ||
                        text.match(/(?:within|under|budget|around|budget of|cost of)\s*(?:₹|rs\.?|inr)?\s*([\d,]{3,})/i) ||
                        text.match(/([\d,]{3,})\s*(?:rupees|inr|rs\.?)/i);
  if (matchCurrency && matchCurrency[1]) {
    const parsed = parseInt(matchCurrency[1].replace(/,/g, ''));
    if (parsed > 0) budget = parsed;
  }

  // Extract People / Traveler Type
  let people = (context.currentPlan && context.currentPlan.people) || context.people || 2;
  let travellerType = (context.currentPlan && context.currentPlan.traveller_type) || context.travellerType || 'Couple';
  if (text.includes('family')) {
    travellerType = 'Family';
    people = 4;
  } else if (text.includes('solo')) {
    travellerType = 'Solo';
    people = 1;
  } else if (text.includes('friends') || text.includes('group') || text.includes('students')) {
    travellerType = 'Friends';
    people = 3;
  } else if (text.includes('couple')) {
    travellerType = 'Couple';
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
  let transport = context.transport || 'Train';
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
    destinationKey: destination,
    origin,
    days,
    budget,
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
function generateFollowUpSuggestions(intent, destinationName, hasPlan) {
  const dName = destinationName.split(' ')[0];

  if (intent === 'GENERAL_INFO') {
    return [
      `What are the best places to visit in ${dName}?`,
      `What food is ${dName} famous for?`,
      `How can I reach ${dName} from Bengaluru?`,
      `Plan a 2-day trip to ${dName} within ₹6,000`
    ];
  }

  if (intent === 'ATTRACTIONS') {
    return [
      `Explain the history of ${dName}'s royal monuments`,
      `What is the best time to visit ${dName}?`,
      `Plan a 3-day sightseeing trip to ${dName}`,
      `What are the best local food spots in ${dName}?`
    ];
  }

  if (intent === 'HISTORY_CULTURE') {
    return [
      `What are the must-see historical places in ${dName}?`,
      `Tell me about ${dName}'s cultural festivals`,
      `Plan a heritage and culture tour to ${dName}`,
      `What food is famous in ${dName}?`
    ];
  }

  if (intent === 'FOOD_DINING') {
    return [
      `Where can I get the best Mylari Dosa in ${dName}?`,
      `Plan a 2-day foodie and heritage trip to ${dName}`,
      `What are the top attractions in ${dName}?`,
      `How can I reach ${dName} from Bengaluru?`
    ];
  }

  if (intent === 'TRANSPORT_DIRECTIONS') {
    return [
      `What are the best hotels near ${dName} center?`,
      `Plan a 3-day trip to ${dName}`,
      `What are the top attractions in ${dName}?`,
      `What is the best time of year to visit ${dName}?`
    ];
  }

  if (intent === 'PLAN_ITINERARY' || intent === 'MODIFY_PLAN') {
    return [
      `Can you make this ${dName} trip cheaper?`,
      `What are the best local food dishes to try?`,
      `How can I reach ${dName} from Bengaluru?`,
      `Tell me about the history of ${dName} Palace`
    ];
  }

  return [
    `Tell me about Mysore`,
    `Plan a 3-day trip to Mysore within ₹6,000`,
    `Best tourist places in Hampi`,
    `Top weekend getaways from Bengaluru`
  ];
}

/**
 * 4. Conversational Assistant Handlers
 */

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
💡 **Pro Traveler Tip:** Visit **${destData.attractions[0]?.name}** in the late afternoon so you can experience both the palace interior and the spectacular illuminated facade at twilight.`;
}

// C. History and Culture
function handleHistoryCulture(destData, specificSubject = '') {
  return `### 👑 Royal Heritage & History of ${destData.name}

${destData.history}

---

#### 🏰 The Story of Mysore Palace:
${destData.palace_history || destData.history}

---

#### 🎨 Living Arts, Crafts & Cultural Symbols:
• **Mysore Silk:** Celebrated for pure mulberry silk interwoven with genuine gold zari thread, manufactured at the century-old Government Silk Weaving Factory.  
• **Mysore Sandalwood & Agarbatti:** Famed as the "Sandalwood City", known for pure sandalwood soaps, oils, and aromatic hand-rolled incense.  
• **Mysore Dasara (Nadahabba):** A 10-day state festival celebrating Goddess Chamundeshwari's victory over Mahishasura. The grand procession (Jumboo Savari) features 750 kg golden howdah carried by majestic decorated royal elephants.  
• **Ganjifa Art & Rosewood Inlay:** Traditional intricate playing cards and marquetry furniture crafted by generational artisan families.`;
}

// D. Local Food and Dining
function handleFood(destData) {
  const foodItems = destData.food.map((f, i) => `
### ${i + 1}. ${f.name}
${f.description}  
📍 **Where to Taste It:** *${f.where}*
`).join('\n');

  return `### 🍽️ Famous Culinary Delights of ${destData.name}

${destData.name} is a paradise for food lovers! Here are the legendary dishes you absolutely cannot miss:

${foodItems}

---
💡 **Local Tip:** At **Hotel Vinayaka Mylari**, arrive by 8:00 AM or 4:30 PM to get seated without a wait. The dosas are made fresh to order on cast-iron griddles with pure fresh butter.`;
}

// E. Transportation and Routes
function handleTransport(destData, origin = 'Bengaluru') {
  const transRoutes = destData.transport?.from_bengaluru?.map((t, idx) => `
#### ${idx + 1}. ${t.mode}
* **Travel Time:** ${t.duration}
* **Approximate Cost:** ${t.cost}
* **Details:** ${t.details}
`).join('\n') || 'Frequent trains, state buses, and expressway cabs connect directly.';

  return `### 🚆 How to Reach ${destData.name} from ${origin}

Traveling from **${origin}** to **${destData.name}** is fast, scenic, and convenient:

${transRoutes}

---

#### 🛺 Getting Around within ${destData.name}:
${destData.transport?.local || 'Auto rickshaws, app cabs, and state city buses provide easy connectivity between monuments.'}

💡 **Recommendation:** For comfort and speed, take the morning **Vande Bharat Express** or an early drive on the **Expressway (NH-275)** to avoid weekend city traffic.`;
}

// F. Weather & Best Time
function handleWeather(destData) {
  return `### ☀️ Best Time to Visit & Weather in ${destData.name}

${destData.best_time}

---

#### 🌤️ Season-by-Season Breakdown:
1. **Winter (October – February) — 🌟 PEAK SEASON:**
   • **Temperature:** 18°C – 30°C  
   • **Experience:** Crisp mornings, sunny afternoons, and cool evenings. Ideal for walking through palace grounds, heritage bazaars, and climbing Chamundi Hill.
2. **Dasara Period (September / October) — 🎉 CELEBRATION TIME:**
   • **Experience:** The city is decorated with lights, cultural concerts take place nightly, and the royal Dasara procession takes place. Book accommodations 2 months in advance!
3. **Summer (March – May):**
   • **Temperature:** 24°C – 35°C  
   • **Experience:** Warm afternoons. Plan outdoor sightseeing early in the morning (7 AM - 10 AM) and after 4:30 PM.
4. **Monsoon (June – September):**
   • **Temperature:** 20°C – 28°C  
   • **Experience:** Fresh green landscapes and pleasant drizzles. Karanji Lake and Brindavan Gardens are especially lush.`;
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
      budgetExplanation = `✅ **Budget Confirmed:** Your budget of ₹${userBudget.toLocaleString('en-IN')} comfortably covers this ${duration}-day itinerary (estimated cost: ₹${calculatedTotal.toLocaleString('en-IN')}). You have approximately ₹${budgetDifference.toLocaleString('en-IN')} remaining for shopping Mysore silk, souvenirs, and discretionary indulgences!`;
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

/**
 * Call External LLM API (Google Gemini or OpenAI/Groq) for dynamic AI travel intelligence
 */
async function callLLMAssistant({ message, conversationHistory = [], context = {}, entities, destData }) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (!geminiKey && !openaiKey && !groqKey) {
    return null; // Zero-cost built-in engine fallback
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

  const systemInstruction = `You are Tourist Hub AI, the world-class intelligent conversational travel guide & custom itinerary planner for India tourism.

USER'S CURRENT REQUEST: "${message}"

CURRENT TRIP CONTEXT:
- Active Destination: ${destinationName}
- Origin: ${originCity}
- Stated Days: ${tripDays}
- Stated Group: ${groupCount} travelers (${groupType})
- Stated Budget: ${userBudget ? '₹' + userBudget : 'Flexible'}
- Has active plan in view: ${context.currentPlan ? 'Yes' : 'No'}

RECENT CONVERSATION HISTORY:
${formattedHistory || 'None (new conversation)'}

CRITICAL ARCHITECTURE RULES (YOU MUST STRICTLY FOLLOW):

RULE 1: STRICT INTENT SEPARATION (NEVER FORCE AN ITINERARY FOR GENERAL QUESTIONS)
- If the user asks a GENERAL QUESTION, inquiry, greeting, overview, history, culture, sights to see, local food specialties, famous restaurants, transportation options/expressway/trains/buses, weather, best time to visit, hotel areas, or asks "Tell me about Mysore", "How are you? I want to know about Mysore. Can you explain?":
  -> YOU MUST ONLY ANSWER THEIR QUESTION DIRECTLY AND CONVERSATIONALLY!
  -> DO NOT generate an itinerary or day-by-day plan!
  -> Set "intent": "GENERAL_INFO" (or appropriate question category) and set "plan": null.
  -> Write your response in rich, elegant GitHub-style Markdown with clear headings (###), bullet points (•), and practical local tips.
  -> At the very end of your response, provide 3 to 4 helpful suggested follow-up prompts in the "suggested_prompts" array (e.g. "Plan a 2-day trip to Mysore", "What food is Mysore famous for?").

RULE 2: CUSTOM TRIP & BUDGET PLANNING (ONLY WHEN EXPLICITLY REQUESTED)
- ONLY if the user explicitly asks to PLAN a trip (e.g., "Plan a 2-day trip to Mysore", "Create an itinerary", "Plan a weekend budget trip within ₹6,000", "Suggest a 3-day holiday", "Make this trip cheaper"):
  -> Set "intent": "PLAN_ITINERARY" (or "MODIFY_PLAN").
  -> You MUST generate a realistic, complete plan object in "plan":
     {
       "destination": "${destinationName}",
       "origin": "${originCity}",
       "days": ${tripDays},
       "nights": ${Math.max(1, tripDays - 1)},
       "people": ${groupCount},
       "traveller_type": "${groupType}",
       "food_preference": "${entities.foodPreference || 'Vegetarian'}",
       "transport": "${entities.transport || 'Express Train'}",
       "estimated_cost": 7500,
       "per_person_cost": 3750,
       "user_budget": ${userBudget || 'null'},
       "budget_status": "SURPLUS",
       "budget_explanation": "Trip fits comfortably within the budget with optimal transport and stay choices.",
       "cost_breakdown": {
         "transportation": 1500,
         "accommodation": 2800,
         "food_dining": 1600,
         "local_transit": 800,
         "sightseeing_activities": 500,
         "miscellaneous": 300
       },
       "schedule": [
         {
           "day": 1,
           "theme": "Arrival & Royal Heritage",
           "morning": "Morning arrival and visit to the primary monument",
           "afternoon": "Lunch and cultural museum visit",
           "evening": "Sunset viewpoint and local market walk",
           "attractions": ["Main Monument", "Evening Bazaar"],
           "travel_time": "15-20 mins between stops",
           "suggested_transport": "Auto Rickshaw / Walking",
           "food_recommendations": { "specialty": "Famous local specialty dishes" }
         }
       ],
       "travel_tips": [
         "Book palace and monument tickets in advance online to skip lines",
         "Try local eateries during off-peak hours for authentic taste"
       ]
     }
  -> In "response_text", provide an exciting markdown overview, an itemized markdown budget table with columns | Expense Category | Estimated Cost (₹) | Notes |, and day-by-day schedule with emojis!

RULE 3: STRICT JSON OUTPUT
You MUST return ONLY a valid JSON object matching this schema with NO markdown wrapping around the JSON:
{
  "intent": "GENERAL_INFO" | "PLAN_ITINERARY" | "ATTRACTIONS" | "FOOD_DINING" | "TRANSPORT_DIRECTIONS" | "HISTORY_CULTURE" | "WEATHER_BEST_TIME",
  "destination": "${destinationName}",
  "response_text": "<Full markdown response>",
  "suggested_prompts": ["<Prompt 1>", "<Prompt 2>", "<Prompt 3>"],
  "plan": null OR <Plan Object>
}`;

  try {
    let rawOutput = null;

    if (geminiKey) {
      // Call Google Gemini API (gemini-1.5-flash)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: systemInstruction }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        rawOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      } else {
        console.warn('Gemini API call returned status:', res.status, await res.text());
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
        console.warn('OpenAI/Groq call returned status:', res.status, await res.text());
      }
    }

    if (!rawOutput) return null;

    const cleanJson = rawOutput.trim().replace(/^```json/i, '').replace(/```$/i, '').trim();
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

    // Look up destination knowledge
    let destData = DESTINATION_KNOWLEDGE[entities.destinationKey] || DESTINATION_KNOWLEDGE['mysore'];

    // Try fetching database record for destination to ensure database sync
    try {
      const [places] = await pool.query(
        `SELECT p.*, s.name as state_name FROM tourist_places p LEFT JOIN states s ON p.state_id = s.id WHERE p.name LIKE ? LIMIT 1`,
        [`%${destData.name.split(' ')[0]}%`]
      );
      if (places.length > 0 && places[0].history) {
        destData = {
          ...destData,
          db_description: places[0].description,
          db_history: places[0].history,
          db_culture: places[0].culture_info
        };
      }
    } catch (dbErr) {
      // Continue with knowledge base
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

      return {
        success: true,
        intent: llmResult.intent || (llmResult.plan ? 'PLAN_ITINERARY' : 'GENERAL_INFO'),
        destination: llmResult.destination || destData.name,
        origin: entities.origin,
        response_text: llmResult.response_text,
        suggested_prompts: followUpSuggestions,
        plan: llmResult.plan || null,
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
    switch (intent) {
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

    return {
      success: true,
      intent,
      destination: destData.name,
      origin: entities.origin,
      response_text: responseText,
      suggested_prompts: followUpSuggestions,
      plan: planResult,
      context_updates: {
        activeDestination: destData.name,
        origin: entities.origin,
        days: entities.days,
        people: entities.people,
        budget: entities.budget,
        currentPlan: planResult || context.currentPlan || null
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
