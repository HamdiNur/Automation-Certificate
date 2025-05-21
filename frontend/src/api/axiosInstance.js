// src/api/axiosInstance.js
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5000/api', // ✅ Make sure "/api" is here
  withCredentials: true,
});

export default instance;
