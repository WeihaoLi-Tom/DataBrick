// src/http.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
});

// Set up axios interceptor
axiosInstance.interceptors?.response?.use(
    response => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    const res = await axiosInstance.post('auth/refresh/', { refresh: refreshToken });
                    localStorage.setItem('accessToken', res.data.access);
                    axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + res.data.access;
                    return axiosInstance(originalRequest); 
                } catch (refreshError) {
                    localStorage.clear(); 
                }
            }
        }

        return Promise.reject(error); 
    }
);

export default axiosInstance;
