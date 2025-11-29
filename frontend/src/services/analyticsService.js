import api from '../utils/api';

export const analyticsService = {
    getDashboardAnalytics: async () => {
        try {
            const response = await api.get('/api/analytics/dashboard');
            return response;
        } catch (error) {
            console.error('Error fetching dashboard analytics:', error);
            throw error;
        }
    }
};
