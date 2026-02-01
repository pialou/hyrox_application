/**
 * Services Index - Hyrox Intel
 * 
 * Centralized export for all services.
 */

export { default as api, post, get } from './api';
export {
    default as trainingPlanService,
    createTrainingPlan,
    fetchTrainingPlan,
    triggerArchitectWorkflow,
    isReadyForWorkout,
    getPlanDisplayState,
    waitForStructuredPlan,
} from './trainingPlanService';
