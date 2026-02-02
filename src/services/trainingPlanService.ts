/**
 * Training Plan Service - Hyrox Intel
 */

import { post, get } from './api';

export const createTrainingPlan = async (title: string, description: string) => {
    const response = await post('create_plan', {
        title,
        description,
    });
    return response;
};

export const fetchTrainingPlan = async (planId: string) => {
    const response = await get('get_plan', { plan_id: planId });
    return response;
};

export const triggerArchitectWorkflow = async (planId: string, title: string, description: string) => {
    const response = await post('architect', {
        plan_id: planId,
        title,
        description,
    });
    return response;
};

export const isReadyForWorkout = (plan: any) => {
    return plan?.is_structured === true;
};

export const getPlanDisplayState = (plan: any) => {
    if (!plan) return 'pending';

    if (plan.status === 'failed') return 'failed';
    if (plan.is_structured && plan.status === 'ready') return 'ready';
    if (plan.status === 'processing') return 'generating';

    return 'pending';
};

export const waitForStructuredPlan = async (planId: string, intervalMs = 2000, maxAttempts = 30) => {
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
