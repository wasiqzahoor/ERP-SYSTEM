import axios from 'axios';

// Log the API Base URL from .env
console.log("API Base URL from .env:", import.meta.env.VITE_API_BASE_URL);

// Create a new instance of axios
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL, // <-- Your backend's base URL
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