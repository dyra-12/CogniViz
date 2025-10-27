export const meetings = [
  {
    id: 'meeting_1',
    title: 'Kick-off with Client X',
    duration: 2,
    scheduled: false,
    day: null,
    startTime: null,
    constraints: {
      allowedDays: [2, 3],
      timeRange: { start: 9, end: 17 },
      mustHaveBreak: true, // Requires 30min break before or after
      priority: 'high',
      requiredAttendees: ['CEO', 'CTO'],
      preparationTime: 1, // Requires 1 hour preparation time before
      cannotOverlapWith: ['meeting_3'] // Cannot overlap with team session
    }
  },
  {
    id: 'meeting_2', 
    title: 'Conference Keynote',
    duration: 3,
    scheduled: false,
    day: null,
    startTime: null,
    constraints: {
      allowedDays: [1, 2],
      timeRange: { start: 9, end: 15 }, // Must end by 15:00
      priority: 'high',
      fixedTime: true, // Must be scheduled at specific time if available
      preferredTime: 10, // Preferred start at 10:00
      mandatory: true // Cannot be skipped
    }
  },
  {
    id: 'meeting_3',
    title: 'Team Strategy Session',
    duration: 2,
    scheduled: false,
    day: null,
    startTime: null,
    constraints: {
      allowedDays: [2, 3, 4],
      timeRange: { start: 13, end: 17 }, // Afternoon only
      mustFollow: 'meeting_1', // Must be after Client meeting
      priority: 'medium',
      minParticipants: 5,
      requiresConferenceRoom: true,
      cannotOverlapWith: ['meeting_1'] // Cannot overlap with client meeting
    }
  },
  {
    id: 'meeting_4',
    title: 'Networking Dinner',
    duration: 2,
    scheduled: false,
    day: null,
    startTime: null,
    constraints: {
      // Networking must be on Day 3 between 11:00 and 15:00, 2h duration
      allowedDays: [3],
      timeRange: { start: 11, end: 15 }, // Day 3, 11:00-15:00 window
      priority: 'low',
      requiresRestaurantReservation: true,
      maxParticipants: 8,
      budget: 50 // Has a budget constraint for the dinner
    }
  },
  {
    id: 'meeting_5',
    title: 'Product Demo for Investors',
    duration: 1.5,
    scheduled: false,
    day: null,
    startTime: null,
    constraints: {
      allowedDays: [3, 4],
      timeRange: { start: 11, end: 16 }, // Late morning to afternoon
      priority: 'high',
      mustPrecede: 'meeting_3', // Must come before team session
      requiresEquipment: ['projector', 'demo units'],
      minSetupTime: 0.5 // Requires 30 minutes setup time
    }
  }
];