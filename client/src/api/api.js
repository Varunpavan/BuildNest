import axios from 'axios'

// one axios instance so every request goes to our server
let api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

export default api
