export const departments = [
  { id: 'rd', name: 'Research & Development', min: 2000, max: 10000, allocation: 0 },
  { id: 'marketing', name: 'Marketing', min: 0, max: 3000, allocation: 0 },
  { id: 'hr', name: 'Human Resources', min: 0, max: 10000, allocation: 0 },
  { id: 'operations', name: 'Operations', min: 0, max: 10000, allocation: 0 },
  { id: 'travel', name: 'Travel & Accommodation', min: 0, max: 10000, allocation: 0 },
  { id: 'meals', name: 'Meals & Entertainment', min: 0, max: 10000, allocation: 0 },
  { id: 'misc', name: 'Miscellaneous', min: 0, max: 10000, allocation: 0 }
];

export const constraints = [
  {
    id: 'rd_min',
    description: 'R&D must get at least $2,000',
    check: (allocations) => allocations.rd >= 2000
  },
  {
    id: 'marketing_max',
    description: 'Marketing cannot get more than $3,000',
    check: (allocations) => allocations.marketing <= 3000
  },
  {
    id: 'hr_ops_min',
    description: 'HR and Operations combined must get at least $4,000',
    check: (allocations) => (allocations.hr + allocations.operations) >= 4000
  },
  {
    id: 'total_budget',
    description: 'Total budget must equal $10,000',
    check: (allocations) => {
      const total = Object.values(allocations).reduce((sum, amount) => sum + amount, 0);
      return total === 10000;
    }
  }
];

export const getInitialAllocations = () => {
  return departments.reduce((acc, dept) => {
    acc[dept.id] = dept.allocation;
    return acc;
  }, {});
};