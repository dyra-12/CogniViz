export const generateHotels = () => {
  const hotels = [
    'Grand Berlin Hotel', 'City Inn Berlin', 'River View Hotel', 
    'Berlin Plaza', 'Central Station Hotel', 'Park Luxury Berlin',
    'Business Tower', 'Conference Center Hotel', 'Modern Stay Berlin',
    'Airport Suites', 'Historic District Inn', 'Tech Park Residence'
  ];
  
  const results = [];
  
  hotels.forEach((name, index) => {
    const stars = Math.floor(Math.random() * 3) + 3; // 3-5 stars
    const distance = parseFloat((0.5 + Math.random() * 9.5).toFixed(1)); // 0.5-10.0 km
    
    // Lower prices to fit $1000 budget
    const pricePerNight = 40 + Math.floor(Math.random() * 80); // 40-120 per night
    
    // Price increases for higher ratings and better locations
    let finalPrice = pricePerNight;
    if (stars >= 4) finalPrice += 20;
    if (stars === 5) finalPrice += 30;
    if (distance <= 2) finalPrice += 25; // Premium for very close locations
    else if (distance <= 5) finalPrice += 15;
    
    const totalPrice = finalPrice * 3;
    const breakfastIncluded = Math.random() > 0.7;
    const airportShuttle = Math.random() > 0.5;
    
    results.push({
      id: `hotel_${index}`,
      name,
      stars,
      distance,
      pricePerNight: finalPrice,
      totalPrice,
      selected: false,
      within5km: distance <= 5,
      threeStarPlus: stars >= 3,
      breakfastIncluded,
      airportShuttle,
      convenienceScore: (10 - distance) + stars // Higher score for closer and better hotels
    });
  });
  
  return results;
};