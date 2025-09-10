export const generateHotels = () => {
  const hotels = [
    'Grand Berlin Hotel', 'City Inn Berlin', 'River View Hotel', 
    'Berlin Plaza', 'Central Station Hotel', 'Park Luxury Berlin',
    'Business Tower', 'Conference Center Hotel', 'Modern Stay Berlin'
  ];
  
  const results = [];
  
  hotels.forEach((name, index) => {
    const stars = Math.floor(Math.random() * 3) + 3; // 3-5 stars
    const distance = parseFloat((1 + Math.random() * 8).toFixed(1)); // 1.0-9.0 km
    const pricePerNight = 80 + Math.floor(Math.random() * 120); // 80-200 per night
    const totalPrice = pricePerNight * 3;
    
    results.push({
      id: `hotel_${index}`,
      name,
      stars,
      distance,
      pricePerNight,
      totalPrice,
      selected: false,
      within5km: distance <= 5,
      threeStarPlus: stars >= 3
    });
  });
  
  return results;
};