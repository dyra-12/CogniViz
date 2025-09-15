export const generateFlights = () => {
  const flights = [
    // Outbound flights (NY to Berlin)
    {
      id: 'out_1',
      type: 'outbound',
      airline: 'Delta',
      departureTime: new Date('2024-01-15T06:30:00'),
      arrivalTime: new Date('2024-01-15T13:45:00'),
      duration: 7.25,
      stops: 'Non-stop',
      price: 550,
      selected: false,
      convenienceScore: 10
    },
    {
      id: 'out_2',
      type: 'outbound',
      airline: 'United',
      departureTime: new Date('2024-01-15T08:15:00'),
      arrivalTime: new Date('2024-01-15T16:30:00'),
      duration: 8.25,
      stops: '1 stop',
      price: 420,
      selected: false,
      convenienceScore: 7
    },
    {
      id: 'out_3',
      type: 'outbound',
      airline: 'Lufthansa',
      departureTime: new Date('2024-01-15T10:45:00'),
      arrivalTime: new Date('2024-01-15T14:20:00'),
      duration: 7.58,
      stops: 'Non-stop',
      price: 600,
      selected: false,
      convenienceScore: 10
    },
    {
      id: 'out_4',
      type: 'outbound',
      airline: 'British Airways',
      departureTime: new Date('2024-01-15T14:20:00'),
      arrivalTime: new Date('2024-01-15T22:45:00'),
      duration: 8.42,
      stops: '1 stop',
      price: 380,
      selected: false,
      convenienceScore: 7
    },
    {
      id: 'out_5',
      type: 'outbound',
      airline: 'American',
      departureTime: new Date('2024-01-15T16:00:00'),
      arrivalTime: new Date('2024-01-16T01:30:00'),
      duration: 9.5,
      stops: '2 stops',
      price: 320,
      selected: false,
      convenienceScore: 4
    },

    // Return flights (Berlin to NY)
    {
      id: 'in_1',
      type: 'return',
      airline: 'Delta',
      departureTime: new Date('2024-01-18T14:30:00'),
      arrivalTime: new Date('2024-01-18T21:45:00'),
      duration: 7.25,
      stops: 'Non-stop',
      price: 520,
      selected: false,
      convenienceScore: 10
    },
    {
      id: 'in_2',
      type: 'return',
      airline: 'United',
      departureTime: new Date('2024-01-18T12:15:00'),
      arrivalTime: new Date('2024-01-18T20:30:00'),
      duration: 8.25,
      stops: '1 stop',
      price: 400,
      selected: false,
      convenienceScore: 7
    },
    {
      id: 'in_3',
      type: 'return',
      airline: 'Lufthansa',
      departureTime: new Date('2024-01-18T16:45:00'),
      arrivalTime: new Date('2024-01-19T00:20:00'),
      duration: 7.58,
      stops: 'Non-stop',
      price: 580,
      selected: false,
      convenienceScore: 10
    },
    {
      id: 'in_4',
      type: 'return',
      airline: 'British Airways',
      departureTime: new Date('2024-01-18T18:20:00'),
      arrivalTime: new Date('2024-01-19T03:45:00'),
      duration: 9.42,
      stops: '1 stop',
      price: 360,
      selected: false,
      convenienceScore: 7
    },
    {
      id: 'in_5',
      type: 'return',
      airline: 'American',
      departureTime: new Date('2024-01-18T13:00:00'),
      arrivalTime: new Date('2024-01-18T22:30:00'),
      duration: 9.5,
      stops: '2 stops',
      price: 300,
      selected: false,
      convenienceScore: 4
    }
  ];

  return flights;
};

export const filterFlights = (flights, type) => {
  return flights.filter(flight => flight.type === type);
};