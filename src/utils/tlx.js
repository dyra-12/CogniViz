/**
 * NASA-TLX Questionnaire Utilities
 * Handles scoring, storage, and retrieval of NASA-TLX responses
 */

/**
 * Compute the raw TLX score (simple average of all 6 dimensions)
 * @param {Object} scores - Object with 6 dimension scores
 * @returns {number} Raw TLX score (0-100)
 */
export const computeRawTlx = (scores) => {
  const {
    mental_demand,
    physical_demand,
    temporal_demand,
    performance,
    effort,
    frustration
  } = scores;

  const sum = mental_demand + physical_demand + temporal_demand + performance + effort + frustration;
  const rawScore = sum / 6;
  
  return Math.round(rawScore * 10) / 10; // Round to 1 decimal place
};

/**
 * Build the complete questionnaire response object
 * @param {string} taskId - Task identifier (e.g., 'task_1_form')
 * @param {Object} scores - Object with 6 dimension scores
 * @returns {Object} Complete response object
 */
export const buildQuestionnaireResponse = (taskId, scores) => {
  return {
    task_id: taskId,
    nasa_tlx_scores: {
      mental_demand: scores.mental_demand,
      physical_demand: scores.physical_demand,
      temporal_demand: scores.temporal_demand,
      performance: scores.performance,
      effort: scores.effort,
      frustration: scores.frustration
    },
    raw_tlx_score: computeRawTlx(scores),
    timestamp: new Date().toISOString()
  };
};

/**
 * Save questionnaire response to localStorage
 * @param {string} taskId - Task identifier
 * @param {Object} scores - Object with 6 dimension scores
 * @returns {Object} The saved response object
 */
export const saveQuestionnaireResponse = (taskId, scores) => {
  try {
    const response = buildQuestionnaireResponse(taskId, scores);
    
    // Save individual task response
    const taskKey = `nasa_tlx_${taskId}`;
    localStorage.setItem(taskKey, JSON.stringify(response));
    
    // Also maintain an aggregate array
    let allResponses = [];
    try {
      const existing = localStorage.getItem('nasa_tlx_responses');
      if (existing) {
        allResponses = JSON.parse(existing);
      }
    } catch (e) {
      console.warn('Failed to parse existing responses, starting fresh:', e);
    }
    
    // Remove any existing response for this task from the array
    allResponses = allResponses.filter(r => r.task_id !== taskId);
    
    // Add the new response
    allResponses.push(response);
    
    // Save the aggregate array
    localStorage.setItem('nasa_tlx_responses', JSON.stringify(allResponses));
    
    return response;
  } catch (error) {
    console.error('Failed to save questionnaire response:', error);
    throw new Error('Could not save your responses. Please try again.');
  }
};

/**
 * Get questionnaire response for a specific task
 * @param {string} taskId - Task identifier
 * @returns {Object|null} The response object or null if not found
 */
export const getQuestionnaireResponse = (taskId) => {
  try {
    const taskKey = `nasa_tlx_${taskId}`;
    const data = localStorage.getItem(taskKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to retrieve questionnaire response:', error);
    return null;
  }
};

/**
 * Get all questionnaire responses
 * @returns {Array} Array of all response objects
 */
export const getAllQuestionnaireResponses = () => {
  try {
    const data = localStorage.getItem('nasa_tlx_responses');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to retrieve all questionnaire responses:', error);
    return [];
  }
};

/**
 * Check if localStorage is available and working
 * @returns {boolean}
 */
export const isLocalStorageAvailable = () => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};
