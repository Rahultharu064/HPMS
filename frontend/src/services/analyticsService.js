import api from '../utils/api';

export const analyticsService = {
    getPublicStats: async () => {
        try {
            const response = await api.get('/api/analytics/public-stats');
            return response;
        } catch (error) {
            console.error('Error fetching public stats:', error);
            throw error;
        }
    },

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
