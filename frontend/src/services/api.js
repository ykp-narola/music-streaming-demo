import axios from 'axios';

const api = axios.create({
    baseURL: 'http://192.168.1.241:5001/api', // Adjust the base URL as needed
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': "{token}"
    },
  });
  
  export default api;