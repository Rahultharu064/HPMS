import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const serviceOrderService = {
    create: async (data) => {
        const res = await axios.post(`${API_URL}/service-orders`, data, { headers: getAuthHeader() });
        return res.data;
    },

    getAll: async (params) => {
        const res = await axios.get(`${API_URL}/service-orders`, {
            params,
            headers: getAuthHeader()
        });
        return res.data;
    },

    getById: async (id) => {
        const res = await axios.get(`${API_URL}/service-orders/${id}`, { headers: getAuthHeader() });
        return res.data;
    },

    update: async (id, data) => {
        const res = await axios.put(`${API_URL}/service-orders/${id}`, data, { headers: getAuthHeader() });
        return res.data;
    }
};
