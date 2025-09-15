export const generateTransportOptions = () => {
  return [
    {
      id: 'transport_1',
      type: 'Public Transit Pass',
      description: 'Unlimited rides on buses and trains for 4 days',
      price: 30,
      convenience: 6
    },
    {
      id: 'transport_2', 
      type: 'Taxi/Uber Budget',
      description: 'Estimated cost for 4 days of occasional rides',
      price: 80,
      convenience: 8
    },
    {
      id: 'transport_3',
      type: 'Rental Car (Economy)',
      description: '4-day economy car rental with insurance',
      price: 120,
      convenience: 9
    },
    {
      id: 'transport_4',
      type: 'Rental Car (Premium)',
      description: '4-day premium car rental with insurance',
      price: 200,
      convenience: 10
    }
  ];
};