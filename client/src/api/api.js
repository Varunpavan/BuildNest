import axios from 'axios'

/**
 * Base API client configuration.
 *
 * Networking Strategy:
 * 1. Production: Uses VITE_API_URL if configured in environment.
 * 2. Mobile Testing (LAN): If accessed via Wi-Fi IP (e.g., 192.168.x.x), dynamically
 *    points API calls to the same host IP on port 5050 so mobile devices connect seamlessly.
 * 3. Local Desktop: Defaults to http://localhost:5050/api.
 */
let baseURL = import.meta.env.VITE_API_URL

// Fallback to local development discovery if VITE_API_URL is not set
if (!baseURL) {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    baseURL = `http://${window.location.hostname}:5050/api`
  } else {
    baseURL = 'http://localhost:5050/api'
  }
}

const api = axios.create({
  baseURL,
})

export default api
