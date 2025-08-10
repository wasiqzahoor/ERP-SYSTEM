import axios from 'axios';

// Create a new instance of axios
const api = axios.create({
    baseURL: 'http://localhost:4002', // <-- Your backend's base URL
});

// We can also intercept requests to automatically add the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;