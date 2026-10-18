const pool = require('./db');

/**
 * Migration script to add cultural uniqueness and payment gateway fields
 */
async function upgradeSchema() {
  console.log('🔄 Upgrading schema with cultural highlights & payment gateway support...');

  // 1. Add fields to tourist_places
  const placeColumns = [
    { name: 'famous_festival', sql: 'ALTER TABLE tourist_places ADD COLUMN famous_festival VARCHAR(200) NULL AFTER culture_info' },
    { name: 'famous_dance_art', sql: 'ALTER TABLE tourist_places ADD COLUMN famous_dance_art VARCHAR(200) NULL AFTER famous_festival' },
    { name: 'cultural_uniqueness', sql: 'ALTER TABLE tourist_places ADD COLUMN cultural_uniqueness TEXT NULL AFTER famous_dance_art' }
  ];

  for (const col of placeColumns) {
    try {
      await pool.query(col.sql);
      console.log(`Added column ${col.name} to tourist_places`);
    } catch (e) {
      // Column already exists
    }
  }

  // 2. Add fields to bookings
  const bookingColumns = [
    { name: 'discount_amount', sql: 'ALTER TABLE bookings ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0.00 AFTER total_amount' },
    { name: 'discount_code', sql: 'ALTER TABLE bookings ADD COLUMN discount_code VARCHAR(50) NULL AFTER discount_amount' },
    { name: 'payment_method', sql: "ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(50) DEFAULT 'UPI' AFTER discount_code" },
    { name: 'payment_status', sql: "ALTER TABLE bookings ADD COLUMN payment_status ENUM('Pending', 'Paid', 'Failed') DEFAULT 'Paid' AFTER payment_method" },
    { name: 'transaction_id', sql: 'ALTER TABLE bookings ADD COLUMN transaction_id VARCHAR(100) NULL AFTER payment_status' }
  ];

  for (const col of bookingColumns) {
    try {
      await pool.query(col.sql);
      console.log(`Added column ${col.name} to bookings`);
    } catch (e) {
      // Column already exists
    }
  }

  // 3. Update destinations with rich authentic Indian cultural data
  const culturalUpdates = [
    {
      name: 'Hampi',
      festival: 'Hampi Utsav (Vijaya Utsav)',
      dance: 'Yakshagana & Carnatic Epics',
      uniqueness: 'Capital of the 14th-century Vijayanagara Empire with colossal monolithic stone architecture, musical pillars, and legendary Kishkindha mythology.'
    },
    {
      name: 'Mysore (Mysuru)',
      festival: 'Mysore Dasara (10-Day Grand Nadahabba & Jumboo Savari)',
      dance: 'Royal Court Bharatanatyam & Ganjifa Classical Art',
      uniqueness: 'The City of Palaces, famed for the royal Wadiyar dynasty, fragrant sandalwood, royal mulberry silk sarees, and melt-in-the-mouth Mysore Pak.'
    },
    {
      name: 'Coorg (Kodagu)',
      festival: 'Kailpodh (Harvest & Weapon Festival) & Puthari',
      dance: 'Kodava Valaga & Bolak-aat Folk Dance',
      uniqueness: 'The Scotland of India, characterized by martial Kodava hospitality, mist-shrouded Arabica coffee estates, and sacred River Kaveri origin.'
    },
    {
      name: 'Munnar',
      festival: 'Attukal Pongala & Onam Harvest',
      dance: 'Kathakali Dance-Drama & Kalaripayattu Martial Art',
      uniqueness: 'Spectacular undulating tea garden valleys at 1,600m, home to the endangered Nilgiri Tahr and cool Western Ghat mountain breeze.'
    },
    {
      name: 'Alappuzha (Alleppey)',
      festival: 'Nehru Trophy Snake Boat Race (Vallam Kali)',
      dance: 'Theyyam & Mohiniyattam (Dance of the Enchantress)',
      uniqueness: 'The Venice of the East, celebrated worldwide for serene backwater cruises on traditional Kettuvallam houseboats and farming below sea level.'
    },
    {
      name: 'Jaipur (The Pink City)',
      festival: 'Teej, Gangaur & Jaipur Elephant Festival',
      dance: 'Ghoomar & Kalbelia Desert Gypsy Folk Dance',
      uniqueness: 'India\'s first planned terracotta pink city, home to Amber Fort Sheesh Mahal, astronomical Jantar Mantar, and legendary Rajputana valor.'
    },
    {
      name: 'Udaipur (City of Lakes)',
      festival: 'Mewar Spring Festival & Shilpgram Crafts Mela',
      dance: 'Dharohar Folk Theatre at Bagore Ki Haveli',
      uniqueness: 'India\'s most romantic royal destination, set against shimmering Lake Pichola, towering marble City Palace, and candlelit waterside dining.'
    },
    {
      name: 'Goa (Panaji & North Beaches)',
      festival: 'Goan Carnival & Shigmo Spring Festival',
      dance: 'Goan Fado & Dekhni Folk Melodies',
      uniqueness: 'A vibrant 450-year Portuguese-Indian cultural synthesis with colorful Latin Quarter Fontainhas, golden palm beaches, and coastal cashew feni.'
    },
    {
      name: 'Varanasi (Kashi)',
      festival: 'Dev Deepawali (Night of 1 Million Diyas) & Mahashivratri',
      dance: 'Kathak Classical Dance (Benares Gharana) & Ganga Aarti',
      uniqueness: 'One of the world\'s oldest living cities, sacred sanctum of Lord Shiva where evening multi-tiered brass lamp Maha Aarti echoes along 84 holy stone ghats.'
    }
  ];

  for (const item of culturalUpdates) {
    await pool.query(
      `UPDATE tourist_places 
       SET famous_festival = ?, famous_dance_art = ?, cultural_uniqueness = ? 
       WHERE name LIKE ?`,
      [item.festival, item.dance, item.uniqueness, `%${item.name}%`]
    );
  }

  console.log('✅ Schema and cultural data updated successfully!');
  process.exit(0);
}

upgradeSchema().catch(err => {
  console.error('Upgrade schema error:', err);
  process.exit(1);
});
