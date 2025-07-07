const { db, admin } = require("./database");

const postsToUpdate = 
[
{
"id":"AxOHuHrZJZBAMHucg8OV",
    "title": "Paris Food Walk",
    "city": "Paris",
    "country": "France",
    "description": "We explored food markets in Montmartre and tasted fresh pastries. A river walk by the Seine revealed hidden cafes. We ended the evening at a rooftop restaurant with a view of the Eiffel Tower. Street performers added charm to the experience."
  },
  {
"id":"BQ25dIWQ9dctbbg59Td9",
    "title": "Seaside in Constanța",
    "city": "Constanța",
    "country": "Romania",
    "description": "The Black Sea breeze welcomed us as we walked along the pier. We visited the historic Constanța Casino by the waterfront. Beaches were peaceful, perfect for sunbathing and relaxing. Local seafood restaurants served delicious grilled fish and wine."
  },
  {
"id":"JGQ3dywkB3GqWxPZcOCi",
    "title": "Kyoto Bamboo Morning",
    "city": "Kyoto",
    "country": "Japan",
    "description": "We started the day in the Arashiyama Bamboo Grove. Traditional shrines surrounded by nature created a magical atmosphere. We tried mochi sweets at a nearby market. A short train ride took us to another mountain temple for sunset."
  },
  {
"id":"dF4pgW8UBC2raLhOsooT",
    "title": "Berlin Wall Stories",
    "city": "Berlin",
    "country": "Germany",
    "description": "We walked the East Side Gallery and saw powerful murals. Nearby museums told the story of a divided city. Currywurst stands were scattered throughout the area. The city blends history with modern art beautifully."
  },
  {
"id":"dFJ2YFIFNYwm06yEVrn3",
    "title": "Amsterdam by Bike",
    "city": "Amsterdam",
    "country": "Netherlands",
    "description": "We cycled through canals and visited a tulip market. The Van Gogh Museum was inspiring. Cheese tastings at a small shop were a highlight. The city felt relaxed and full of art and color."
  },
  {
"id":"iNbScW76jxTm9YdaeHB2",
    "title": "Vienna Classical Night",
    "city": "Vienna",
    "country": "Austria",
    "description": "We attended a Mozart concert in a golden hall. Before that, we visited the Imperial Palace and art museum. Cafés served the famous Sachertorte with hot chocolate. Vienna felt elegant and timeless."
  },
  {
"id":"kOl5pbyqC10TaAOX8fJR",
    "title": "Athens Ancient Tour",
    "city": "Athens",
    "country": "Greece",
    "description": "We climbed to the Acropolis for sunrise. The Parthenon glowed in golden light. A walk through Plaka revealed tavernas with live music. We learned history while enjoying local flavors and views."
  },
  {
"id":"svkWkIF2qRJWCbPyhZUq",
    "title": "Dubrovnik Fortress Trail",
    "city": "Dubrovnik",
    "country": "Croatia",
    "description": "Stone walls surrounded the old town with breathtaking views of the sea. We walked the full fortress trail in the morning. Narrow streets led to small markets and cozy restaurants. The Adriatic was sparkling blue."
  },
  {
"id":"vjLqnqYwnoQKUUwT6fJX",
    "title": "Oslo Winter Escape",
    "city": "Oslo",
    "country": "Norway",
    "description": "Snow covered the parks and rooftops. We visited the Viking Ship Museum and had reindeer stew for lunch. A fjord cruise showed frozen landscapes. It was peaceful and cold, but very beautiful."
  },
];

async function updatePosts() {
  for (const post of postsToUpdate) {
    try {
      await db.collection("posts").doc(post.id).update({
        title: post.title,
        city: post.city,
        country: post.country,
        description: post.description
      });
      console.log(`Updated post with ID: ${post.id}`);
    } catch (error) {
      console.error(`Error updating post ${post.id}:`, error.message);
    }
  }
}

updatePosts();