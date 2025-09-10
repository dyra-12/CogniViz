export const meetings = [
  {
    id: 'meeting_1',
    title: 'Kick-off with Client X',
    duration: 2,
    scheduled: false,
    day: null,
    startTime: null,
    constraints: {
      allowedDays: [2, 3], // Day 2 or 3 only
      timeRange: { start: 9, end: 17 } // 9AM-5PM
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
      allowedDays: [1, 2, 3, 4], // Any day
      timeRange: { start: 9, end: 17 }
    }
  }
];