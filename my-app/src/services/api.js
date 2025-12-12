import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor untuk menambahkan token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor untuk handle error
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired atau invalid
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        // Anda bisa menambahkan navigasi ke login screen di sini
      } catch (storageError) {
        console.log('Storage error during logout:', storageError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;