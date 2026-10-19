const express = require('express');
const pool = require('../config/db');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const travelAIService = require('../services/travelAIService');

const router = express.Router();

function safeJson(val) {
  if (!val) return [];
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch (e) { return [val]; }
}

// POST /api/ai/chat - Intelligent Conversational Travel Assistant
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message, conversation_history = [], context = {} } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const result = await travelAIService.processChatMessage({
      message: message.trim(),
      conversationHistory: conversation_history,
      context
    });

    return res.json(result);
  } catch (error) {
    console.error('AI Chat Route Error:', error);
    return res.status(500).json({ success: false, message: 'Error processing travel chat.' });
  }
});

// Alias /api/ai/assistant -> /api/ai/chat
router.post('/assistant', optionalAuth, async (req, res) => {
  try {
    const { message, conversation_history = [], context = {} } = req.body;
    const result = await travelAIService.processChatMessage({
      message: (message || '').trim(),
      conversationHistory: conversation_history,
      context
    });
    return res.json(result);
  } catch (error) {
    console.error('AI Assistant Route Error:', error);
    return res.status(500).json({ success: false, message: 'Error processing travel chat.' });
  }
});

// GET /api/ai/status - Returns active AI provider info
router.get('/status', (req, res) => {
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasGroq = !!process.env.GROQ_API_KEY;

  let provider = 'Built-in Knowledge & Itinerary Engine';
  if (hasGemini) provider = 'Google Gemini 1.5 Flash';
  else if (hasOpenAI) provider = 'OpenAI GPT-4o-mini';
  else if (hasGroq) provider = 'Groq Llama 3';

  return res.json({
    success: true,
    has_api_key: hasGemini || hasOpenAI || hasGroq,
    active_provider: provider,
    recommended_api: 'Google Gemini (Free forever via Google AI Studio at https://aistudio.google.com/app/apikey)'
  });
});

// POST /api/ai/plan and /api/ai/plan-itinerary - AI Travel Planner
// Both routes point to the same handler so either URL works
async function handlePlanItinerary(req, res) {
  try {
    const {
      origin = 'Bengaluru',
      destination,
      travel_date = new Date().toISOString().split('T')[0],
      days = 3,
      traveller_type = 'Couple',
      people = 2,
      budget = 12000,
      transport = 'Train',
      interests = ['Heritage', 'Culture', 'Food'],
      food_preference = 'Vegetarian'
    } = req.body;

    if (!destination) {
      return res.status(400).json({ success: false, message: 'Please specify a destination.' });
    }

    const durationDays = Math.min(Math.max(parseInt(days) || 3, 1), 10);
    const peopleCount = Math.max(parseInt(people) || 1, 1);
    const totalBudget = parseFloat(budget) || (3000 * durationDays * peopleCount);

    // Look up destination info from database
    const [places] = await pool.query(
      `SELECT p.*, s.name as state_name 
       FROM tourist_places p
       JOIN states s ON p.state_id = s.id
       WHERE p.name LIKE ? OR p.location LIKE ? OR p.id = ?
       LIMIT 1`,
      [`%${destination}%`, `%${destination}%`, isNaN(destination) ? -1 : destination]
    );

    let destInfo;
    if (places.length > 0) {
      destInfo = places[0];
      destInfo.major_attractions = safeJson(destInfo.major_attractions);
      destInfo.activities = safeJson(destInfo.activities);
      destInfo.local_food = safeJson(destInfo.local_food);
      destInfo.local_transport = safeJson(destInfo.local_transport);
    } else {
      // Fallback destination metadata for custom inputs
      destInfo = {
        name: destination,
        state_name: 'India',
        category: 'Heritage & Culture',
        image_url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80',
        major_attractions: ['Historical City Center', 'Grand Heritage Palace', 'Sacred Local Shrine', 'Sunset Viewpoint Point', 'Traditional Artisan Market'],
        activities: ['Guided Cultural Walk', 'Sunset Boating / View', 'Local Crafts Workshop', 'Culinary Tasting Tour'],
        local_food: ['Regional Thali', 'Signature Sweet Dish', 'Spiced Street Food', 'Fresh Herbal Tea'],
        local_transport: ['Prepaid Auto Rickshaws', 'App Taxis', 'Bicycle Rentals'],
        estimated_cost_per_day: 3000
      };
    }

    // Heuristic Itinerary Generation based on constraints
    const attractions = destInfo.major_attractions.length > 0 
      ? [...destInfo.major_attractions] 
      : ['Palace & Heritage Complex', 'Scenic Nature Viewpoint', 'Local Artisan Market'];
    
    const activitiesList = destInfo.activities.length > 0 
      ? [...destInfo.activities] 
      : ['Heritage Walk', 'Scenic Sightseeing', 'Cultural Photography'];

    const foodList = destInfo.local_food.length > 0 
      ? [...destInfo.local_food] 
      : ['Traditional Thali', 'Local Street Special', 'Regional Sweets'];

    const itinerary = [];
    const dailyBudget = Math.round(totalBudget / durationDays);

    for (let d = 1; d <= durationDays; d++) {
      const attr1 = attractions[(d * 2 - 2) % attractions.length] || 'Heritage City Landmark';
      const attr2 = attractions[(d * 2 - 1) % attractions.length] || 'Cultural Discovery Center';
      const act = activitiesList[(d - 1) % activitiesList.length] || 'Sightseeing & Photography';
      
      let lunchRecommendation;
      let dinnerRecommendation;
      if (food_preference === 'Vegetarian') {
        lunchRecommendation = `Authentic Vegetarian ${destInfo.name} Thali with ${foodList[(d - 1) % foodList.length] || 'regional curries'}`;
        dinnerRecommendation = `Royal Garden Dining featuring traditional Satvik delights and regional dessert`;
      } else if (food_preference === 'Non-Vegetarian') {
        lunchRecommendation = `Local culinary specialties featuring spicy coastal/regional non-veg preparations`;
        dinnerRecommendation = `Heritage Rooftop dinner pairing signature delicacies and ${foodList[d % foodList.length] || 'kebabs'}`;
      } else {
        lunchRecommendation = `Signature regional specialty lunch: ${foodList[(d - 1) % foodList.length] || 'Traditional Feast'}`;
        dinnerRecommendation = `Atmospheric dining near major sights trying popular street eats and authentic recipes`;
      }

      // Contextual schedule per day
      let morningActivity;
      let afternoonActivity;
      let eveningActivity;

      if (d === 1) {
        morningActivity = `Arrival from ${origin} via ${transport}. Check into accommodation, refresh, and start with orientation at ${attr1}.`;
        afternoonActivity = `Enjoy ${lunchRecommendation}. Embark on ${act} around the historic center.`;
        eveningActivity = `Visit ${attr2} during golden hour. Explore local craft bazaars and relax with ${dinnerRecommendation}.`;
      } else if (d === durationDays && durationDays > 1) {
        morningActivity = `Early morning visit to ${attr1} for serene sunrise and photography before crowds gather.`;
        afternoonActivity = `Farewell lunch: ${lunchRecommendation}. Last-minute souvenir shopping for local handlooms and handicrafts.`;
        eveningActivity = `Check-out, head towards transit hub for onward journey back to ${origin}.`;
      } else {
        morningActivity = `Morning exploration of ${attr1}. Discover ancient architecture and rich folklore with a local guide.`;
        afternoonActivity = `Savor ${lunchRecommendation}. Participate in ${act} and engage with local artisans.`;
        eveningActivity = `Sunset panoramic vista at ${attr2}. Relax with evening cultural music and dinner (${dinnerRecommendation}).`;
      }

      const dayCost = Math.round(dailyBudget * 0.9 + (Math.sin(d) * 200));

      itinerary.push({
        day: d,
        title: `Day ${d}: ${attr1} & Cultural Immersion`,
        morning: morningActivity,
        afternoon: afternoonActivity,
        evening: eveningActivity,
        attractions: [attr1, attr2],
        activity: act,
        food_recommendations: {
          lunch: lunchRecommendation,
          dinner: dinnerRecommendation,
          specialty: foodList[(d - 1) % foodList.length] || 'Special Chai & Snacks'
        },
        travel_time: 'Approx 30-45 mins between sights',
        suggested_transport: destInfo.local_transport[0] || 'Auto Rickshaw / Local Taxi',
        estimated_cost: dayCost
      });
    }

    // Cost Breakdown
    const accommodationCost = Math.round(totalBudget * 0.40);
    const foodCost = Math.round(totalBudget * 0.25);
    const transportCost = Math.round(totalBudget * 0.20);
    const activitiesCost = totalBudget - (accommodationCost + foodCost + transportCost);

    const plan = {
      destination: destInfo.name,
      state: destInfo.state_name,
      origin,
      travel_date,
      days: durationDays,
      people: peopleCount,
      traveller_type,
      transport,
      food_preference,
      interests,
      total_budget: totalBudget,
      estimated_cost: totalBudget,
      cost_breakdown: {
        accommodation: accommodationCost,
        food_dining: foodCost,
        transportation: transportCost,
        sightseeing_activities: activitiesCost
      },
      destination_image: destInfo.image_url,
      itinerary
    };

    // Auto-save if user is authenticated
    let savedPlanId = null;
    if (req.user && req.user.id) {
      try {
        const [savedRes] = await pool.query(`
          INSERT INTO travel_plans (
            user_id, destination_id, origin, destination_name, travel_date,
            days, traveller_type, people_count, budget, transport_mode,
            interests, food_preference, estimated_cost, itinerary
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          req.user.id,
          destInfo.id || null,
          origin,
          destInfo.name,
          travel_date,
          durationDays,
          traveller_type,
          peopleCount,
          totalBudget,
          transport,
          Array.isArray(interests) ? interests.join(', ') : interests,
          food_preference,
          totalBudget,
          JSON.stringify(itinerary)
        ]);
        savedPlanId = savedRes.insertId;
      } catch (saveErr) {
        console.error('Auto-save plan note:', saveErr.message);
      }
    }

    return res.json({
      success: true,
      message: 'Intelligent AI Travel Plan generated successfully!',
      plan_id: savedPlanId,
      plan
    });
  } catch (error) {
    console.error('AI Planner Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate AI travel plan.' });
  }
}

// Register both /plan and /plan-itinerary so the frontend works regardless of which URL it uses
router.post('/plan', optionalAuth, handlePlanItinerary);
router.post('/plan-itinerary', optionalAuth, handlePlanItinerary);

// POST /api/ai/save-plan - Explicitly save a plan to user's saved trips
router.post('/save-plan', authenticateToken, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan || !plan.destination) {
      return res.status(400).json({ success: false, message: 'Invalid plan data provided.' });
    }

    const [savedRes] = await pool.query(`
      INSERT INTO travel_plans (
        user_id, destination_id, origin, destination_name, travel_date,
        days, traveller_type, people_count, budget, transport_mode,
        interests, food_preference, estimated_cost, itinerary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      plan.destination_id || null,
      plan.origin || 'Bengaluru',
      plan.destination,
      plan.travel_date || new Date().toISOString().split('T')[0],
      plan.days || 3,
      plan.traveller_type || 'Couple',
      plan.people || 2,
      plan.estimated_cost || 12000,
      plan.transport || 'Train',
      Array.isArray(plan.interests) ? plan.interests.join(', ') : (plan.interests || 'Heritage'),
      plan.food_preference || 'Vegetarian',
      plan.estimated_cost || 12000,
      JSON.stringify(plan.itinerary || [])
    ]);

    return res.json({
      success: true,
      message: 'Trip plan saved to your profile successfully!',
      plan_id: savedRes.insertId
    });
  } catch (error) {
    console.error('Save Plan Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save travel plan.' });
  }
});

// POST /api/ai/recommend - AI Recommendation Engine
router.post('/recommend', optionalAuth, async (req, res) => {
  try {
    let userInterests = [];
    let userBudget = 'Moderate';
    let userTravelType = 'Couple';

    // If request provided preferences, use them; otherwise check user preferences from DB
    if (req.body.interests) {
      userInterests = Array.isArray(req.body.interests) ? req.body.interests : req.body.interests.split(',').map(s => s.trim());
      userBudget = req.body.budget_range || 'Moderate';
      userTravelType = req.body.travel_type || 'Couple';
    } else if (req.user && req.user.id) {
      const [prefRows] = await pool.query('SELECT * FROM user_preferences WHERE user_id = ?', [req.user.id]);
      if (prefRows.length > 0) {
        userBudget = prefRows[0].budget_range || 'Moderate';
        userTravelType = prefRows[0].travel_type || 'Couple';
        userInterests = safeJson(prefRows[0].interests);
      }
    }

    if (userInterests.length === 0) {
      userInterests = ['Heritage', 'Nature', 'Culture', 'Beach'];
    }

    // Fetch all destinations with state data
    const [places] = await pool.query(`
      SELECT p.*, s.name as state_name 
      FROM tourist_places p
      JOIN states s ON p.state_id = s.id
    `);

    // Content-Based Similarity Scoring Algorithm
    const scoredPlaces = places.map(place => {
      let score = 0;
      const reasons = [];

      const placeCategory = (place.category || '').toLowerCase();
      const placeDesc = (place.description || '').toLowerCase();
      const placeCulture = (place.culture_info || '').toLowerCase();
      const combinedText = `${placeCategory} ${placeDesc} ${placeCulture}`;

      // 1. Interest Matching (Weight: 50%)
      userInterests.forEach(interest => {
        const intLower = interest.toLowerCase().trim();
        if (placeCategory.includes(intLower)) {
          score += 25;
          reasons.push(`Matches your interest in ${interest}`);
        } else if (combinedText.includes(intLower)) {
          score += 12;
          reasons.push(`Features rich ${interest} activities`);
        }
      });

      // 2. Budget Compatibility Matching (Weight: 30%)
      const dailyCost = parseFloat(place.estimated_cost_per_day) || 3000;
      if (userBudget === 'Budget' && dailyCost <= 2800) {
        score += 25;
        reasons.push('Fits your budget travel preference');
      } else if (userBudget === 'Moderate' && dailyCost >= 2500 && dailyCost <= 4500) {
        score += 25;
        reasons.push('Ideal for moderate budget range');
      } else if (userBudget === 'Luxury' && dailyCost >= 4000) {
        score += 25;
        reasons.push('Offers luxury heritage & premium resorts');
      } else {
        score += 10;
      }

      // 3. Traveller Type Alignment (Weight: 20%)
      if (['Couple', 'Romantic'].includes(userTravelType) && (place.name.includes('Udaipur') || place.name.includes('Munnar') || place.name.includes('Coorg') || place.category === 'Beach')) {
        score += 20;
        reasons.push(`Highly rated for ${userTravelType} travel`);
      } else if (['Solo', 'Adventure'].includes(userTravelType) && (place.category === 'Adventure' || place.category === 'Heritage')) {
        score += 20;
        reasons.push(`Perfect for ${userTravelType} explorers`);
      } else {
        score += 12;
      }

      // Normalize match percentage between 75% and 98%
      const matchScore = Math.min(Math.max(Math.round(65 + (score * 0.4)), 74), 99);

      return {
        ...place,
        gallery_urls: safeJson(place.gallery_urls),
        major_attractions: safeJson(place.major_attractions),
        activities: safeJson(place.activities),
        local_food: safeJson(place.local_food),
        matchScore,
        matchReasons: reasons.slice(0, 3)
      };
    });

    // Sort descending by match score
    scoredPlaces.sort((a, b) => b.matchScore - a.matchScore);

    return res.json({
      success: true,
      preferences_used: { userInterests, userBudget, userTravelType },
      recommendations: scoredPlaces
    });
  } catch (error) {
    console.error('AI Recommendation Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate recommendations.' });
  }
});

// GET /api/ai/my-plans - Get user saved travel plans
router.get('/my-plans', authenticateToken, async (req, res) => {
  try {
    const [plans] = await pool.query(`
      SELECT tp.*, p.image_url as destination_image, p.location as destination_location
      FROM travel_plans tp
      LEFT JOIN tourist_places p ON tp.destination_id = p.id
      WHERE tp.user_id = ?
      ORDER BY tp.created_at DESC
    `, [req.user.id]);

    const formatted = plans.map(p => ({
      ...p,
      itinerary: safeJson(p.itinerary)
    }));

    return res.json({ success: true, count: formatted.length, plans: formatted });
  } catch (error) {
    console.error('Get My Plans Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve saved plans.' });
  }
});

// DELETE /api/ai/my-plans/:id
router.delete('/my-plans/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM travel_plans WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    return res.json({ success: true, message: 'Trip plan removed.' });
  } catch (error) {
    console.error('Delete Plan Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove plan.' });
  }
});

module.exports = router;
