import axios from 'axios';
import { base } from '../utils/config';

const api = axios.create({
    baseURL: `${base.URL}/api`, // Adjust the base URL as needed
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': "{token}"
    },
  });
  
  export default api;