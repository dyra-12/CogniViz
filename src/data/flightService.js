export const generateFlights = () => {
  const airlines = ['Delta', 'United', 'Lufthansa', 'British Airways', 'American', 'Air France'];
  const stops = ['Non-stop', '1 stop', '2 stops'];
  
  const flights = [];
  const baseDate = new Date();
  
  // Generate outbound flights (NY to Berlin)
  for (let i = 0; i < 12; i++) {
    const departureTime = new Date(baseDate);
    departureTime.setHours(6 + Math.floor(Math.random() * 12)); // 6AM - 6PM
    departureTime.setMinutes(Math.floor(Math.random() * 12) * 5); // Round to 5min increments
    
    const duration = 7 + Math.floor(Math.random() * 6); // 7-12 hours
    const arrivalTime = new Date(departureTime);
    arrivalTime.setHours(departureTime.getHours() + duration);
    
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    const stopCount = Math.random() > 0.7 ? stops[0] : 
                     Math.random() > 0.5 ? stops[1] : stops[2];
    
    const basePrice = stopCount === 'Non-stop' ? 800 : 
                     stopCount === '1 stop' ? 650 : 500;
    const price = basePrice + Math.floor(Math.random() * 200);
    
    flights.push({
      id: `out_${i}`,
      type: 'outbound',
      airline,
      departureTime: new Date(departureTime),
      arrivalTime: new Date(arrivalTime),
      duration,
      stops: stopCount,
      price,
      selected: false
    });
  }
  
  // Generate return flights (Berlin to NY)
  for (let i = 0; i < 12; i++) {
    const departureTime = new Date(baseDate);
    departureTime.setDate(departureTime.getDate() + 4); // Day 4
    departureTime.setHours(10 + Math.floor(Math.random() * 10)); // 10AM - 8PM
    
    const duration = 7 + Math.floor(Math.random() * 6);
    const arrivalTime = new Date(departureTime);
    arrivalTime.setHours(departureTime.getHours() + duration);
    
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    const stopCount = Math.random() > 0.7 ? stops[0] : 
                     Math.random() > 0.5 ? stops[1] : stops[2];
    
    const basePrice = stopCount === 'Non-stop' ? 750 : 
                     stopCount === '1 stop' ? 600 : 450;
    const price = basePrice + Math.floor(Math.random() * 200);
    
    flights.push({
      id: `in_${i}`,
      type: 'return',
      airline,
      departureTime: new Date(departureTime),
      arrivalTime: new Date(arrivalTime),
      duration,
      stops: stopCount,
      price,
      selected: false
    });
  }
  
  return flights;
};

export const filterFlights = (flights, type, constraints) => {
  return flights.filter(flight => {
    if (flight.type !== type) return false;
    
    if (type === 'outbound') {
      // Must arrive before 3PM on Day 1
      return flight.arrivalTime.getHours() < 15;
    } else {
      // Must depart after 12PM on Day 4
      return flight.departureTime.getHours() >= 12;
    }
  });
};