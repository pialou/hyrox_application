/**
 * Training Plan Service - Hyrox Intel
 * 
 * Handles all training plan operations including creation,
 * fetching, and structured state checks.
 */

import { post, get } from './api';

/**
 * Create a new training plan and trigger the Architect workflow
 * @param {string} title - Plan title
 * @param {string} description - User's description of their goals
 * @returns {Promise<Object>} Created plan with id
 */
export const createTrainingPlan = async (title, description) => {
    const response = await post('create_plan', {
        title,
        description,
    });
    return response;
};

/**
 * Fetch a training plan by ID
 * @param {string} planId - UUID of the plan
 * @returns {Promise<Object>} Training plan data
 */
export const fetchTrainingPlan = async (planId) => {
    const response = await get('get_plan', { plan_id: planId });
    return response;
};

/**
 * Trigger the Architect workflow to structure a plan
 * @param {string} planId - UUID of the plan
 * @param {string} title - Plan title
 * @param {string} description - Plan description
 * @returns {Promise<Object>} Workflow trigger response
 */
export const triggerArchitectWorkflow = async (planId, title, description) => {
    const response = await post('architect', {
        plan_id: planId,
        title,
        description,
    });
    return response;
};

/**
 * Check if a plan is ready for the Workout Player
 * @param {Object} plan - Training plan object
 * @returns {boolean} True if is_structured is true
 */
export const isReadyForWorkout = (plan) => {
    return plan?.is_structured === true;
};

/**
 * Get the display state for a plan
 * @param {Object} plan - Training plan object
 * @returns {'ready' | 'generating' | 'failed' | 'pending'} Display state
 */
export const getPlanDisplayState = (plan) => {
    if (!plan) return 'pending';

    if (plan.status === 'failed') return 'failed';
    if (plan.is_structured && plan.status === 'ready') return 'ready';
    if (plan.status === 'processing') return 'generating';

    return 'pending';
};

/**
 * Poll for plan completion (useful for waiting on Architect workflow)
 * @param {string} planId - UUID of the plan
 * @param {number} intervalMs - Polling interval in ms (default: 2000)
 * @param {number} maxAttempts - Max polling attempts (default: 30)
 * @returns {Promise<Object>} Completed plan
 */
export const waitForStructuredPlan = async (planId, intervalMs = 2000, maxAttempts = 30) => {
    let attempts = 0;

    return new Promise((resolve, reject) => {
        const poll = async () => {
            attempts++;

            try {
                const plan = await fetchTrainingPlan(planId);

                if (isReadyForWorkout(plan)) {
                    resolve(plan);
                    return;
                }

                if (plan.status === 'failed') {
                    reject(new Error('Plan generation failed'));
                    return;
                }

                if (attempts >= maxAttempts) {
                    reject(new Error('Timeout waiting for plan generation'));
                    return;
                }

                setTimeout(poll, intervalMs);
            } catch (error) {
                reject(error);
            }
        };

        poll();
    });
};

export default {
    createTrainingPlan,
    fetchTrainingPlan,
    triggerArchitectWorkflow,
    isReadyForWorkout,
    getPlanDisplayState,
    waitForStructuredPlan,
};
