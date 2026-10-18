const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// GET /api/emergency/national-helplines
router.get('/national-helplines', (req, res) => {
  const helplines = [
    { title: 'National Emergency Number', number: '112', desc: 'Unified single number for Police, Fire, Ambulance nationwide' },
    { title: 'Incredible India Tourist Helpline', number: '1363 / 1800-11-1363', desc: '24x7 Multi-lingual Tourist Information & Safety Assistance (12 languages)' },
    { title: 'National Ambulance Service', number: '108', desc: 'Free emergency medical response & ambulance transport' },
    { title: 'Police Assistance', number: '100', desc: 'State Police control room' },
    { title: 'Women Helpline', number: '1091', desc: '24x7 dedicated emergency safety helpline for women' },
    { title: 'Disaster Management Support', number: '1077', desc: 'National Disaster Management Authority (NDMA)' },
    { title: 'Railway Passenger Security', number: '139', desc: 'Indian Railways emergency & enquiry portal' }
  ];
  return res.json({ success: true, helplines });
});

// GET /api/emergency/:destinationId
router.get('/:destinationId', async (req, res) => {
  try {
    const [emergency] = await pool.query(`
      SELECT e.*, p.name as destination_name, p.location as destination_location
      FROM emergency_services e
      JOIN tourist_places p ON e.destination_id = p.id
      WHERE e.destination_id = ?
      ORDER BY e.distance_km ASC
    `, [req.params.destinationId]);

    return res.json({ success: true, emergency_services: emergency });
  } catch (error) {
    console.error('Get Emergency Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve emergency services.' });
  }
});

module.exports = router;
