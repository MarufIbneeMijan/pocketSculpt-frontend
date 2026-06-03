// 🚀 THE PRODUCTION API GATEWAY RESOLVER
// This automatically shifts targets depending on your running environment context!
export const API_BASE = import.meta.env.VITE_API_URL || 'https://pocketscuplt-backend.onrender.com';

console.log(`📡 [SYSTEM NETWORK BRIDGE] API Base Endpoint resolved to: ${API_BASE}`);