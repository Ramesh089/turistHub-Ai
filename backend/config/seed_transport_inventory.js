/**
 * Seed Transport Inventory: Multi-Transport Booking Platform
 * Populates realistic Train, Bus, Flight, and Private Driver options with
 * class options, boarding points, amenities, luggage capacity, and driver specs.
 */

const pool = require('./db');

const inventory = [
  // ==========================================
  // 1. TRAINS
  // ==========================================
  {
    dest_name: 'Mysore (Mysuru)',
    transport_type: 'Train',
    service_number: '20608',
    provider: 'Vande Bharat Express (20608)',
    from_city: 'Bengaluru',
    to_city: 'Mysuru',
    route: 'KSR Bengaluru (SBC) → Mysuru Jn (MYS)',
    vehicle_model: 'Vande Bharat 2.0 High-Speed Trainset',
    departure_time: '06:00 AM',
    arrival_time: '07:45 AM',
    duration: '1h 45m',
    price: 650.00,
    seats_total: 78,
    rating: 4.90,
    reviews_count: 240,
    luggage_capacity: '2 Medium Bags + 1 Handbag per passenger',
    booking_info: 'Daily high-speed chair car service on the upgraded 160 km/h corridor with breakfast included.',
    cancellation_policy: 'Full refund minus ₹60 clerkage fee if cancelled > 48h before departure. 50% refund up to 12h before departure.',
    class_options: [
      { code: 'CC', name: 'AC Chair Car', fare: 650, available: 58, description: 'Comfortable 3+2 cushioned seating with rotatable chairs and breakfast.' },
      { code: 'EC', name: 'Executive Chair Car', fare: 1250, available: 20, description: 'Premium 2+2 plush leather seating, extra legroom, gourmet breakfast & hot beverages.' }
    ],
    amenities: ['AC Air-Conditioned', 'Onboard Hot Breakfast', 'Bio-Vacuum Toilets', 'High-Speed Wi-Fi', 'Individual Charging Sockets', 'Infotainment Displays']
  },
  {
    dest_name: 'Hampi',
    transport_type: 'Train',
    service_number: '16592',
    provider: 'Hampi Express (16592)',
    from_city: 'Bengaluru',
    to_city: 'Hosapete (Hampi)',
    route: 'KSR Bengaluru (SBC) → Hosapete Jn (HPT)',
    vehicle_model: 'LHB Superfast Overnight Express',
    departure_time: '10:00 PM',
    arrival_time: '07:10 AM',
    duration: '9h 10m',
    price: 380.00,
    seats_total: 96,
    rating: 4.70,
    reviews_count: 185,
    luggage_capacity: 'Up to 35 kg per passenger in sleeper/AC berths',
    booking_info: 'Popular overnight journey arriving right at Hosapete (12 km from Hampi heritage complex).',
    cancellation_policy: 'IRCTC standard policy: ₹120 cancellation fee up to 48 hours prior to chart preparation.',
    class_options: [
      { code: 'SL', name: 'Sleeper Class (Non-AC)', fare: 380, available: 72, description: 'Standard open-window sleeper berths for budget backpackers.' },
      { code: '3A', name: 'AC 3-Tier', fare: 850, available: 44, description: 'Air-conditioned 3-tier berths with fresh bed linen, pillow and blanket.' },
      { code: '2A', name: 'AC 2-Tier', fare: 1250, available: 22, description: 'Spacious 2-tier berths with curtains, reading lamps and charging plugs.' },
      { code: '1A', name: 'AC First Class', fare: 2150, available: 8, description: 'Lockable 2-berth coupe or 4-berth cabin for ultimate privacy.' }
    ],
    amenities: ['Clean Bed Linen Included (AC)', 'Overnight Sleeper Berths', 'Charging Points', 'Pantry Food Service', 'Security Guard on Duty']
  },
  {
    dest_name: 'Varanasi (Kashi)',
    transport_type: 'Train',
    service_number: '22436',
    provider: 'Vande Bharat Express (22436)',
    from_city: 'New Delhi',
    to_city: 'Varanasi',
    route: 'New Delhi (NDLS) → Varanasi Jn (BSB)',
    vehicle_model: 'Vande Bharat Semi-High Speed Trainset',
    departure_time: '06:00 AM',
    arrival_time: '02:00 PM',
    duration: '8h 00m',
    price: 1750.00,
    seats_total: 78,
    rating: 4.95,
    reviews_count: 310,
    luggage_capacity: '2 Large Trolley Bags + Handbag',
    booking_info: 'Fastest train connecting the national capital to the spiritual heart of India on the Ganges.',
    cancellation_policy: 'Cancellation allowed up to 4 hours before chart preparation with IRCTC cancellation deductions.',
    class_options: [
      { code: 'CC', name: 'AC Chair Car', fare: 1750, available: 48, description: 'Ergonomic seating with multi-course morning breakfast and lunch.' },
      { code: 'EC', name: 'Executive Class', fare: 3300, available: 16, description: 'Reclining leather seats, 360 rotatable chairs, and premium chef meal.' }
    ],
    amenities: ['Executive Lunch Included', 'Panoramic Windows', 'Air-Conditioned', 'Disabled Friendly', 'Automatic Sliding Doors']
  },
  {
    dest_name: 'Agra',
    transport_type: 'Train',
    service_number: '12002',
    provider: 'Bhopal Shatabdi Express (12002)',
    from_city: 'New Delhi',
    to_city: 'Agra',
    route: 'New Delhi (NDLS) → Agra Cantt (AGC)',
    vehicle_model: 'LHB German-Designed High-Speed Coach',
    departure_time: '06:00 AM',
    arrival_time: '07:50 AM',
    duration: '1h 50m',
    price: 580.00,
    seats_total: 78,
    rating: 4.80,
    reviews_count: 420,
    luggage_capacity: 'Standard rail baggage (up to 40 kg)',
    booking_info: 'The classic morning commuter train for Taj Mahal day trips with morning newspaper and hot breakfast.',
    cancellation_policy: 'Full refund minus clerkage up to 48 hours before departure.',
    class_options: [
      { code: 'CC', name: 'AC Chair Car', fare: 580, available: 65, description: 'Air-conditioned chair car with complimentary tea, juice and breakfast.' },
      { code: 'EC', name: 'Executive Chair Car', fare: 1150, available: 18, description: 'First-class legroom, wider seats, and enhanced breakfast menu.' }
    ],
    amenities: ['Morning Tea & Breakfast Included', 'High-Speed Corridor', 'Clean Toilets', 'Luggage Overhead Racks']
  },
  {
    dest_name: 'Goa',
    transport_type: 'Train',
    service_number: '10103',
    provider: 'Mandovi Express (10103)',
    from_city: 'Mumbai',
    to_city: 'Goa',
    route: 'Mumbai CSMT → Madgaon Jn (MAO)',
    vehicle_model: 'Konkan Scenic Superfast',
    departure_time: '07:10 AM',
    arrival_time: '07:00 PM',
    duration: '11h 50m',
    price: 310.00,
    seats_total: 80,
    rating: 4.75,
    reviews_count: 195,
    luggage_capacity: 'Standard rail allowance',
    booking_info: 'Famous daylight train ride across Western Ghats waterfalls and viaducts along the Arabian Sea.',
    cancellation_policy: 'Cancellation allowed up to 4 hours before chart preparation.',
    class_options: [
      { code: '2S', name: 'Second Sitting', fare: 310, available: 85, description: 'Reserved window-view non-AC seats for scenic daytime lovers.' },
      { code: 'CC', name: 'AC Chair Car', fare: 1050, available: 38, description: 'Air-conditioned comfort with panoramic window views of Konkan bridges.' }
    ],
    amenities: ['Konkan Coastal Views', 'Famous Pantry Car (Fish Curry & Vada Pav)', 'Charging Sockets', 'Reserved Seating']
  },

  // ==========================================
  // 2. BUSES
  // ==========================================
  {
    dest_name: 'Mysore (Mysuru)',
    transport_type: 'Bus',
    service_number: 'KA-01-F-4412',
    provider: 'KSRTC Flybus / Airavat Club Class',
    from_city: 'Bengaluru',
    to_city: 'Mysuru',
    route: 'Kempegowda Bus Station (Majestic) → Mysore Suburb KSRTC',
    vehicle_model: 'Volvo B11R Multi-Axle AC (2+2 Seater)',
    departure_time: '07:30 AM',
    arrival_time: '10:30 AM',
    duration: '3h 00m',
    price: 380.00,
    seats_total: 44,
    rating: 4.85,
    reviews_count: 320,
    luggage_capacity: 'Up to 2 Medium Bags in undercarriage + 1 Small Handbag',
    booking_info: 'Multi-axle Volvo AC bus gliding over the Bangalore-Mysore 10-Lane Expressway.',
    cancellation_policy: 'Cancellation allowed up to 2 hours prior to departure (10% deduction).',
    class_options: [
      { code: 'Seater', name: 'Airavat Club Class (AC Reclining)', fare: 380, available: 36, description: 'Calf-support recliners with personal charging ports.' }
    ],
    boarding_points: [
      { location: 'Kempegowda Bus Station (Majestic Platform 2A)', time: '07:30 AM' },
      { location: 'Shantinagar Bus Station (Platform 4)', time: '07:50 AM' },
      { location: 'Kengeri Satellite Bus Stand (Expressway Entry)', time: '08:20 AM' }
    ],
    dropping_points: [
      { location: 'Mysore KSRTC Suburb Stand (Platform 1)', time: '10:30 AM' },
      { location: 'Mysore Palace South Gate Drop', time: '10:45 AM' }
    ],
    amenities: ['Air Conditioned', 'USB Charging Port', 'Emergency Exit', 'Mineral Water Bottle', 'Luggage Compartment', 'Live Tracking']
  },
  {
    dest_name: 'Goa',
    transport_type: 'Bus',
    service_number: 'KA-51-AA-9812',
    provider: 'SRS Travels Multi-Axle Volvo AC Sleeper',
    from_city: 'Bengaluru',
    to_city: 'Goa',
    route: 'Bengaluru (Anand Rao Circle) → Panaji KTC Bus Terminus',
    vehicle_model: 'Volvo Multi-Axle AC Sleeper (2+1 Lower/Upper)',
    departure_time: '08:00 PM',
    arrival_time: '07:30 AM',
    duration: '11h 30m',
    price: 1450.00,
    seats_total: 36,
    rating: 4.70,
    reviews_count: 210,
    luggage_capacity: '20 kg luggage in undercarriage',
    booking_info: 'Overnight luxury sleeper bus straight to Goa beaches with individual privacy curtains.',
    cancellation_policy: 'Cancellation up to 6 hours before departure (15% deduction).',
    class_options: [
      { code: 'LowerBerth', name: 'Lower Deck Sleeper Berth', fare: 1450, available: 18, description: 'Ground level smooth ride with pillow, blanket and privacy curtain.' },
      { code: 'UpperBerth', name: 'Upper Deck Sleeper Berth', fare: 1350, available: 16, description: 'Elevated sleeping berth with individual window and reading light.' }
    ],
    boarding_points: [
      { location: 'Anand Rao Circle (SRS Main Office)', time: '08:00 PM' },
      { location: 'Yeshwanthpur Govardhan Theatre', time: '08:30 PM' },
      { location: 'Jalahalli Cross Metro Station', time: '08:45 PM' }
    ],
    dropping_points: [
      { location: 'Madgaon KTC Bus Station', time: '07:00 AM' },
      { location: 'Panaji Bus Terminus (Platform 3)', time: '07:30 AM' },
      { location: 'Mapusa Court Circle Drop', time: '08:00 AM' }
    ],
    amenities: ['Upper & Lower Sleeper Berths', 'Individual Privacy Curtains', 'Pillows & Blankets', 'Reading Light', 'Charging Plug', 'GPS Live Tracking']
  },
  {
    dest_name: 'Jaipur (The Pink City)',
    transport_type: 'Bus',
    service_number: 'DL-1P-Z-3321',
    provider: 'Zingbus Electric AC Semi-Sleeper',
    from_city: 'New Delhi',
    to_city: 'Jaipur',
    route: 'Kashmere Gate ISBT → Jaipur Sindhi Camp',
    vehicle_model: 'BharatBenz AC Semi-Sleeper Luxury Coach',
    departure_time: '06:30 AM',
    arrival_time: '11:45 AM',
    duration: '5h 15m',
    price: 520.00,
    seats_total: 40,
    rating: 4.80,
    reviews_count: 175,
    luggage_capacity: '1 Large Bag + 1 Small Bag',
    booking_info: 'Eco-friendly electric/clean luxury transit on Delhi-Jaipur Expressway with complimentary water.',
    cancellation_policy: 'Free cancellation up to 4 hours before departure.',
    class_options: [
      { code: 'SemiSleeper', name: 'AC Semi-Sleeper Recliner', fare: 520, available: 32, description: '140-degree reclining calf-supported seats with footrest.' }
    ],
    boarding_points: [
      { location: 'Kashmere Gate ISBT (Metro Gate 1)', time: '06:30 AM' },
      { location: 'Dhaula Kuan Metro Station', time: '07:15 AM' },
      { location: 'IFFCO Chowk Gurgaon (Flyover End)', time: '07:45 AM' }
    ],
    dropping_points: [
      { location: 'Jaipur Sindhi Camp Stand', time: '11:45 AM' },
      { location: 'Narayan Singh Circle', time: '12:00 PM' }
    ],
    amenities: ['Zero Emission Electric Ride', 'Free High Speed Wi-Fi', 'Complimentary Sanitizer & Water', 'Live SOS Support', 'CCTV Surveillance']
  },
  {
    dest_name: 'Hampi',
    transport_type: 'Bus',
    service_number: 'KA-25-D-7788',
    provider: 'VRL Travels I-Shift Volvo Multi-Axle Sleeper',
    from_city: 'Bengaluru',
    to_city: 'Hampi (Hosapete)',
    route: 'Anand Rao Circle → Hosapete VRL Office',
    vehicle_model: 'Volvo I-Shift AC Sleeper (2+1)',
    departure_time: '10:30 PM',
    arrival_time: '05:45 AM',
    duration: '7h 15m',
    price: 890.00,
    seats_total: 36,
    rating: 4.75,
    reviews_count: 140,
    luggage_capacity: 'Standard bus luggage allowance',
    booking_info: 'Smooth overnight highway sleeper arriving early morning for sunrise at Matanga Hill.',
    cancellation_policy: 'Cancellation up to 8 hours before departure (10% fee).',
    class_options: [
      { code: 'LowerBerth', name: 'Lower Deck Sleeper', fare: 890, available: 16, description: 'Individual lower berth with safety railing and curtain.' },
      { code: 'UpperBerth', name: 'Upper Deck Sleeper', fare: 820, available: 18, description: 'Top deck private sleeping pod with charging dock.' }
    ],
    boarding_points: [
      { location: 'Majestic Anand Rao Circle (VRL Office)', time: '10:30 PM' },
      { location: 'Rajajinagar 1st Block', time: '10:55 PM' },
      { location: 'Goraguntepalya Metro Pillar 32', time: '11:20 PM' }
    ],
    dropping_points: [
      { location: 'Hosapete VRL Branch (Near Station)', time: '05:45 AM' },
      { location: 'Hampi Main Bazaar Arch Entrance', time: '06:15 AM' }
    ],
    amenities: ['AC Sleeper Cabin', 'Individual Privacy Curtains', 'CCTV Security', 'Reading Lamp', 'Water Bottle']
  },
  {
    dest_name: 'Varanasi (Kashi)',
    transport_type: 'Bus',
    service_number: 'UP-65-BT-5544',
    provider: 'IntrCity SmartBus Volvo Club Lounge',
    from_city: 'New Delhi',
    to_city: 'Varanasi',
    route: 'Anand Vihar IntrCity Lounge → Varanasi Cantt',
    vehicle_model: 'Volvo 9600 Luxury Lounge Sleeper with Washroom',
    departure_time: '07:00 PM',
    arrival_time: '08:30 AM',
    duration: '13h 30m',
    price: 1280.00,
    seats_total: 36,
    rating: 4.88,
    reviews_count: 160,
    luggage_capacity: 'Up to 25 kg per passenger',
    booking_info: 'State-of-the-art bus with onboard toilet, air-purified cabin and trained bus captain.',
    cancellation_policy: 'Free cancellation up to 6 hours before departure.',
    class_options: [
      { code: 'LowerBerth', name: 'Club Lounge Lower Sleeper', fare: 1280, available: 16, description: 'High-comfort lower sleeper with memory foam mattress.' },
      { code: 'UpperBerth', name: 'Club Lounge Upper Sleeper', fare: 1190, available: 18, description: 'Sky-view upper sleeper with individual infotainment.' }
    ],
    boarding_points: [
      { location: 'Anand Vihar IntrCity SmartBus Lounge', time: '07:00 PM' },
      { location: 'Akshardham Metro Station', time: '07:25 PM' },
      { location: 'Mahamaya Flyover Noida', time: '07:50 PM' }
    ],
    dropping_points: [
      { location: 'Varanasi Cantt Station Stand', time: '08:30 AM' },
      { location: 'BHU Lanka Gate Crossing', time: '09:00 AM' }
    ],
    amenities: ['Air Conditioned', 'Onboard Washroom / Toilet', 'SmartBus Captain Onboard', 'Free Snack Box', 'Sanitized Bedding']
  },

  // ==========================================
  // 3. FLIGHTS
  // ==========================================
  {
    dest_name: 'Jaipur (The Pink City)',
    transport_type: 'Flight',
    service_number: '6E-205',
    provider: 'IndiGo (6E-205)',
    from_city: 'New Delhi (DEL)',
    to_city: 'Jaipur (JAI)',
    route: 'New Delhi (DEL T1) → Jaipur International (JAI T2)',
    vehicle_model: 'Airbus A320neo (180 Seater)',
    departure_time: '08:15 AM',
    arrival_time: '09:20 AM',
    duration: '1h 05m',
    price: 3450.00,
    seats_total: 180,
    rating: 4.85,
    reviews_count: 450,
    airline_logo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=120&q=80',
    luggage_capacity: '15 kg Check-in + 7 kg Cabin Handbag',
    booking_info: 'Daily non-stop morning flight connecting Delhi to the Pink City in just 65 minutes.',
    cancellation_policy: 'Airline standard: ₹3,000 airline fee + fare difference for changes. Demo cancellation supported.',
    class_options: [
      { code: 'Economy', name: 'Saver Economy', fare: 3450, baggage: '15 kg Check-in + 7 kg Cabin', available: 82, description: 'Standard economy seat with onboard water and snack purchase.' },
      { code: 'Flexi', name: 'Flexi Plus', fare: 4650, baggage: '15 kg Check-in + 7 kg Cabin + Free Seat & Meal', available: 28, description: 'Free seat selection, hot sandwich snack, and zero change fee.' },
      { code: 'Business', name: 'Stretch XL (Front Rows)', fare: 7200, baggage: '25 kg Check-in + 10 kg Cabin + Priority', available: 12, description: 'Extra legroom front rows (Rows 1-2), priority baggage delivery and hot meal.' }
    ],
    amenities: ['Non-Stop Flight', 'Airbus A320neo', 'Pre-bookable 6E Tiffin Meals', 'Window / Aisle Seat Selection', 'Digital Boarding Pass']
  },
  {
    dest_name: 'Mumbai',
    transport_type: 'Flight',
    service_number: 'AI-508',
    provider: 'Air India (AI-508)',
    from_city: 'New Delhi (DEL)',
    to_city: 'Mumbai (BOM)',
    route: 'New Delhi (DEL T3) → Mumbai Chhatrapati Shivaji (BOM T2)',
    vehicle_model: 'Airbus A321neo Dual-Class',
    departure_time: '10:00 AM',
    arrival_time: '12:15 PM',
    duration: '2h 15m',
    price: 4850.00,
    seats_total: 192,
    rating: 4.80,
    reviews_count: 520,
    airline_logo: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=120&q=80',
    luggage_capacity: '15 kg Check-in + 7 kg Cabin Handbag',
    booking_info: 'Premium metro route with complimentary hot lunch and full legacy airline service.',
    cancellation_policy: 'Refundable ticket subject to airline deduction up to 2 hours before scheduled departure.',
    class_options: [
      { code: 'Economy', name: 'Economy Class', fare: 4850, baggage: '15 kg Check-in + 7 kg Cabin', available: 110, description: 'Includes complimentary hot multi-course Indian meal.' },
      { code: 'Premium', name: 'Premium Economy', fare: 7450, baggage: '20 kg Check-in + 10 kg Cabin', available: 24, description: 'Dedicated cabin with 38-inch legroom and welcome drink.' },
      { code: 'Business', name: 'Business Class', fare: 16500, baggage: '35 kg Check-in + 12 kg Cabin', available: 12, description: 'Flat-bed lie-flat seats, gourmet dining on bone china, and lounge access.' }
    ],
    amenities: ['Complimentary Hot Meals Included', 'Airbus A321neo', 'Generous Seat Pitch', 'Priority Baggage Handling', 'Lounge Access Available']
  },
  {
    dest_name: 'Goa',
    transport_type: 'Flight',
    service_number: 'SG-304',
    provider: 'SpiceJet (SG-304)',
    from_city: 'Bengaluru (BLR)',
    to_city: 'Goa (GOX)',
    route: 'Bengaluru Kempegowda (BLR T1) → Goa Manohar Mopa (GOX)',
    vehicle_model: 'Boeing 737-800',
    departure_time: '11:30 AM',
    arrival_time: '12:45 PM',
    duration: '1h 15m',
    price: 3200.00,
    seats_total: 189,
    rating: 4.65,
    reviews_count: 280,
    airline_logo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=120&q=80',
    luggage_capacity: '15 kg Check-in + 7 kg Cabin',
    booking_info: 'Quick hop directly to the new North Goa Manohar International Airport at Mopa.',
    cancellation_policy: 'Standard airline cancellation rules apply.',
    class_options: [
      { code: 'Economy', name: 'SpiceSaver', fare: 3200, baggage: '15 kg Check-in + 7 kg Cabin', available: 94, description: 'Standard seat with buy-on-board food options.' },
      { code: 'SpiceMax', name: 'SpiceMax Extra Legroom', fare: 4400, baggage: '15 kg Check-in + 7 kg Cabin + Meal', available: 18, description: 'Rows 1-3 with 6 inches extra legroom, priority baggage and hot snack.' }
    ],
    amenities: ['Boeing 737-800', 'Direct Non-Stop', 'SpiceCafe Fresh Bites', 'Fastest Beach Gateway']
  },
  {
    dest_name: 'Varanasi (Kashi)',
    transport_type: 'Flight',
    service_number: 'IX-112',
    provider: 'Air India Express (IX-112)',
    from_city: 'Mumbai (BOM)',
    to_city: 'Varanasi (VNS)',
    route: 'Mumbai (BOM T2) → Varanasi Lal Bahadur Shastri (VNS)',
    vehicle_model: 'Boeing 737 MAX 8',
    departure_time: '02:20 PM',
    arrival_time: '04:35 PM',
    duration: '2h 15m',
    price: 4100.00,
    seats_total: 186,
    rating: 4.70,
    reviews_count: 190,
    airline_logo: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=120&q=80',
    luggage_capacity: '15 kg Check-in + 7 kg Cabin',
    booking_info: 'Direct afternoon non-stop flight connecting Mumbai to the sacred Ganges ghats.',
    cancellation_policy: 'Cancellation allowed up to 4 hours before departure.',
    class_options: [
      { code: 'Economy', name: 'Xpress Lite', fare: 4100, baggage: '15 kg Check-in + 7 kg Cabin', available: 75, description: 'Standard comfortable economy seating with streaming entertainment.' },
      { code: 'XpressFlex', name: 'Xpress Flex', fare: 5300, baggage: '20 kg Check-in + 7 kg Cabin', available: 20, description: 'Extra 5kg baggage, free date change, and pre-booked hot meal.' }
    ],
    amenities: ['Boeing 737 MAX', 'Gourmair Hot Meals Available', 'Streaming Inflight Entertainment', 'Direct Non-Stop']
  },

  // ==========================================
  // 4. PRIVATE DRIVER
  // ==========================================
  {
    dest_name: 'Mysore (Mysuru)',
    transport_type: 'Private Driver',
    service_number: 'KA-04-ME-5511',
    provider: 'TouristHub Private Chauffeur Cab',
    from_city: 'Bengaluru',
    to_city: 'Mysuru',
    route: 'Bangalore Doorstep Pick-up → Mysore Drop & Sightseeing',
    vehicle_model: 'Toyota Innova Crysta 2.4 VX (AC 7-Seater)',
    departure_time: 'Flexible On-Demand (24x7)',
    arrival_time: 'Direct Destination Drop',
    duration: '2h 30m',
    price: 3800.00,
    seats_total: 7,
    rating: 4.95,
    reviews_count: 380,
    driver_name: 'Suresh Gowda',
    driver_phone: '+91 98451 22345',
    driver_rating: 4.92,
    luggage_capacity: '3 Large Suitcases + 2 Medium Bags + Handbags',
    booking_info: 'Dedicated luxury Innova Crysta with commercial passenger badge, verified driver, and fuel included.',
    cancellation_policy: 'Free cancellation up to 2 hours prior to scheduled pickup time.',
    class_options: [
      { code: 'OneWay', name: 'One-Way Doorstep Drop', fare: 3800, included_km: '160 km included (₹16/extra km)', description: 'Direct pickup from your Bangalore home/hotel to your Mysore destination.' },
      { code: 'RoundTrip', name: 'Round-Trip & Full Day Mysore Sightseeing', fare: 5800, included_km: '350 km included (₹16/extra km)', description: 'Driver stays with you throughout the day for Chamundi Hills, Palace & Brindavan Gardens.' }
    ],
    amenities: ['AC Dual-Zone Climate', '7 Passengers Capacity', '3 Large + 2 Small Bags Boot', 'Toll Taxes on Expressway Included', 'Verified Commercial Chauffeur', 'Clean Bottled Water']
  },
  {
    dest_name: 'Agra',
    transport_type: 'Private Driver',
    service_number: 'DL-1R-TA-7744',
    provider: 'Taj Express Private Chauffeur Sedan',
    from_city: 'New Delhi',
    to_city: 'Agra',
    route: 'Delhi Doorstep Pick-up → Agra Taj Mahal Drop',
    vehicle_model: 'Maruti Suzuki Dzire VXI AC (4-Seater)',
    departure_time: 'Custom Time on Request',
    arrival_time: 'Direct Hotel / Taj Gate Drop',
    duration: '3h 00m',
    price: 2600.00,
    seats_total: 4,
    rating: 4.88,
    reviews_count: 290,
    driver_name: 'Rajesh Sharma',
    driver_phone: '+91 98110 33456',
    driver_rating: 4.88,
    luggage_capacity: '2 Large Bags + 2 Small Bags in trunk',
    booking_info: 'Comfortable air-conditioned sedan driven by a licensed tourism chauffeur through the Yamuna Expressway.',
    cancellation_policy: 'Free cancellation up to 3 hours before pickup.',
    class_options: [
      { code: 'OneWay', name: 'One-Way Delhi to Agra Drop', fare: 2600, included_km: '210 km included (₹12/extra km)', description: 'Direct smooth transfer via Yamuna Expressway.' },
      { code: 'SameDayReturn', name: 'Same-Day Taj & Agra Fort Return Excursion', fare: 4200, included_km: '450 km included (₹12/extra km)', description: 'Full day waiting and return to Delhi by evening.' }
    ],
    amenities: ['Air Conditioned', '4 Passengers', '2 Large Bags Trunk Space', 'Yamuna Expressway Tolls Included', 'Experienced Hindi & English Chauffeur']
  },
  {
    dest_name: 'Jaipur (The Pink City)',
    transport_type: 'Private Driver',
    service_number: 'RJ-14-TC-8899',
    provider: 'Royal Rajputana Private Chauffeur SUV',
    from_city: 'Jaipur',
    to_city: 'Jaipur Sightseeing / Ajmer',
    route: 'Jaipur Hotel Pick-up → Amber Fort, City Palace & Hawa Mahal',
    vehicle_model: 'Hyundai Creta SX Turbo AC (5-Seater SUV)',
    departure_time: '09:00 AM (Customizable)',
    arrival_time: 'Full Day Sightseeing Drop',
    duration: '8h 00m',
    price: 2400.00,
    seats_total: 5,
    rating: 4.95,
    reviews_count: 340,
    driver_name: 'Vikram Singh Rathore',
    driver_phone: '+91 94140 88776',
    driver_rating: 4.96,
    luggage_capacity: '2 Large Bags + 2 Small Bags',
    booking_info: 'Local expert royal driver showing you hidden artisan lanes, Jal Mahal, and desert sunset spots.',
    cancellation_policy: 'Free cancellation up to 4 hours before pickup.',
    class_options: [
      { code: 'LocalRental', name: '8 Hours / 80 KM Royal Palaces Sightseeing', fare: 2400, included_km: '80 km included (₹14/extra km, ₹150/extra hr)', description: 'Visit Amber Fort, Jaigarh, Nahargarh and City Palace at your own pace.' },
      { code: 'AjmerPushkar', name: 'Full Day Pushkar & Ajmer Sharif Excursion', fare: 3800, included_km: '300 km included (₹14/extra km)', description: 'Day trip to sacred Pushkar Brahma Temple & Ajmer Dargah.' }
    ],
    amenities: ['Panoramic Sunroof', '5 Passengers', 'Air Conditioned', 'Tourist Guide Guidance', 'Fuel & Parking Included', 'Bottled Mineral Water']
  },
  {
    dest_name: 'New Delhi',
    transport_type: 'Private Driver',
    service_number: 'DL-1C-MB-0001',
    provider: 'Presidential Mercedes-Benz E-Class VIP Chauffeur',
    from_city: 'New Delhi',
    to_city: 'Delhi NCR VIP Sightseeing',
    route: 'DEL Airport / Luxury Hotel → Lutyens Delhi & Monuments',
    vehicle_model: 'Mercedes-Benz E-Class 220d Luxury Sedan',
    departure_time: 'On-Demand Chauffeur',
    arrival_time: 'VIP Destination Drop',
    duration: '8h 00m',
    price: 7500.00,
    seats_total: 4,
    rating: 5.00,
    reviews_count: 110,
    driver_name: 'Devendra Rawat',
    driver_phone: '+91 99100 44556',
    driver_rating: 5.00,
    luggage_capacity: '2 Large Bags + 2 Suitcases in trunk',
    booking_info: 'Executive Mercedes sedan with uniformed, English-speaking diplomatic chauffeur for luxury guests.',
    cancellation_policy: 'Free cancellation up to 12 hours before scheduled pickup.',
    class_options: [
      { code: 'Local80', name: '8 Hours / 80 KM Executive Chauffeur', fare: 7500, included_km: '80 km included (₹60/extra km)', description: 'Full day premier corporate or luxury leisure touring.' },
      { code: 'AirportVIP', name: 'VIP Airport Meet & Greet Transfer', fare: 4500, included_km: 'Direct airport transfer with name placard', description: 'Terminal 3 arrivals meet & assist with luggage service.' }
    ],
    amenities: ['Ultra-Luxury Leather Recliner Seats', 'Uniformed Suit & Tie Chauffeur', 'Cold Wet Towels & Perrier Water', 'Wi-Fi & Tablet Onboard', 'VIP Fast Lane Airport Access']
  },
  {
    dest_name: 'Hampi',
    transport_type: 'Private Driver',
    service_number: 'KA-01-MJ-9900',
    provider: 'Force Urbania Luxury Group Explorer Van',
    from_city: 'Bengaluru',
    to_city: 'Hampi',
    route: 'Bengaluru Doorstep Pick-up → Hampi UNESCO World Heritage Tour',
    vehicle_model: 'Force Urbania 12-Seater Luxury Monocoque Van',
    departure_time: '06:00 AM (Early Morning Departure)',
    arrival_time: '01:30 PM (Destination Resort Drop)',
    duration: '7h 30m',
    price: 6800.00,
    seats_total: 12,
    rating: 4.90,
    reviews_count: 85,
    driver_name: 'Manjunath Swamy',
    driver_phone: '+91 97410 77889',
    driver_rating: 4.89,
    luggage_capacity: '12-15 Large Suitcases in dedicated rear luggage room',
    booking_info: 'Top-of-the-line European styled group van with individual recliner captain seats for family and tour groups.',
    cancellation_policy: 'Cancellation up to 24 hours prior (full refund).',
    class_options: [
      { code: 'OutstationDay', name: 'Per Day Outstation Expedition Package', fare: 6800, included_km: '300 km/day included (₹22/extra km)', description: 'Includes driver night allowance, interstate tourist permit and tolls.' }
    ],
    amenities: ['12 Push-Back Captain Seats', 'Individual AC Vents with Controls', '10+ Big Suitcases Luggage Space', 'Bluetooth Music & Mic System', 'All State Permits & Driver Allowance Included']
  }
];

async function seedTransportInventory() {
  console.log('====================================================');
  console.log('🌱 Seeding Comprehensive Multi-Transport Inventory');
  console.log('====================================================\n');

  let connection;
  try {
    connection = await pool.getConnection();

    // Map destination names to destination_id
    const [places] = await connection.query('SELECT id, name FROM tourist_places');
    const placeMap = {};
    for (const p of places) {
      placeMap[p.name.toLowerCase()] = p.id;
    }

    // Clear existing transport rows
    await connection.query('DELETE FROM transport_seat_bookings');
    await connection.query('DELETE FROM transport_driver_bookings');
    await connection.query('DELETE FROM transport');

    for (const item of inventory) {
      let destId = null;
      for (const [name, id] of Object.entries(placeMap)) {
        if (name.includes(item.dest_name.toLowerCase().split(' ')[0])) {
          destId = id;
          break;
        }
      }
      if (!destId && places.length > 0) {
        destId = places[0].id;
      }

      await connection.query(`
        INSERT INTO transport (
          destination_id, transport_type, provider, route,
          from_city, to_city, service_number, vehicle_model,
          departure_time, arrival_time, price, duration,
          seats_total, rating, reviews_count, luggage_capacity,
          booking_info, cancellation_policy, airline_logo,
          driver_name, driver_phone, driver_rating,
          class_options, boarding_points, dropping_points, amenities
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        destId,
        item.transport_type,
        item.provider,
        item.route,
        item.from_city,
        item.to_city,
        item.service_number || null,
        item.vehicle_model || null,
        item.departure_time,
        item.arrival_time,
        item.price,
        item.duration,
        item.seats_total || 40,
        item.rating || 4.80,
        item.reviews_count || 50,
        item.luggage_capacity || null,
        item.booking_info || null,
        item.cancellation_policy || null,
        item.airline_logo || null,
        item.driver_name || null,
        item.driver_phone || null,
        item.driver_rating || null,
        item.class_options ? JSON.stringify(item.class_options) : null,
        item.boarding_points ? JSON.stringify(item.boarding_points) : null,
        item.dropping_points ? JSON.stringify(item.dropping_points) : null,
        item.amenities ? JSON.stringify(item.amenities) : null
      ]);
    }

    console.log(`✅ Successfully seeded ${inventory.length} verified transport services across all 4 modes!`);
    console.log('   - Trains: 5 services (Vande Bharat, Hampi Express, Shatabdi, Rajdhani, Mandovi)');
    console.log('   - Buses: 5 services (Flybus Volvo, SRS Sleeper, Zingbus Electric, VRL, IntrCity Lounge)');
    console.log('   - Flights: 4 services (IndiGo DEL-JAI, Air India DEL-BOM, SpiceJet BLR-GOX, AI Express BOM-VNS)');
    console.log('   - Private Drivers: 5 services (Innova Crysta, Dzire Sedan, Creta SUV, Mercedes VIP, Urbania Van)');

    // Seed some initial booked seats for demo realism on upcoming dates
    const [trainRows] = await connection.query('SELECT id FROM transport WHERE transport_type = "Train" LIMIT 2');
    const [busRows] = await connection.query('SELECT id FROM transport WHERE transport_type = "Bus" LIMIT 2');
    const [flightRows] = await connection.query('SELECT id FROM transport WHERE transport_type = "Flight" LIMIT 2');

    const today = new Date();
    const targetDates = [
      new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    ];

    for (const d of targetDates) {
      if (trainRows.length > 0) {
        const trainId = trainRows[0].id;
        const trainBookedSeats = ['12', '15', '22', '23', '35'];
        for (const s of trainBookedSeats) {
          try {
            await connection.query(`
              INSERT IGNORE INTO transport_seat_bookings (transport_id, travel_date, seat_number, deck_tier, status, passenger_name)
              VALUES (?, ?, ?, 'lower', 'booked', 'Demo Passenger')
            `, [trainId, d, s]);
          } catch (_) {}
        }
      }

      if (busRows.length > 0) {
        const busId = busRows[0].id;
        const busBookedSeats = ['L3', 'L7', 'U2', 'U5'];
        for (const s of busBookedSeats) {
          try {
            await connection.query(`
              INSERT IGNORE INTO transport_seat_bookings (transport_id, travel_date, seat_number, deck_tier, status, passenger_name)
              VALUES (?, ?, ?, 'lower', 'booked', 'Demo Passenger')
            `, [busId, d, s]);
          } catch (_) {}
        }
      }

      if (flightRows.length > 0) {
        const flightId = flightRows[0].id;
        const flightBookedSeats = ['12A', '12B', '14C', '15F', '18D'];
        for (const s of flightBookedSeats) {
          try {
            await connection.query(`
              INSERT IGNORE INTO transport_seat_bookings (transport_id, travel_date, seat_number, deck_tier, status, passenger_name)
              VALUES (?, ?, ?, 'main', 'booked', 'Demo Passenger')
            `, [flightId, d, s]);
          } catch (_) {}
        }
      }
    }

    console.log('✅ Realistic sample booked seats seeded for upcoming travel dates.');
  } catch (err) {
    console.error('❌ Seeding transport inventory error:', err);
    throw err;
  } finally {
    if (connection) connection.release();
  }
}

if (require.main === module) {
  seedTransportInventory()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedTransportInventory;
