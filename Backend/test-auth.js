import { signAccessToken } from './src/core/auth/token.util.js';
const accessToken = signAccessToken({ userId: '60d5ecb8b392d7001f3e7943', role: 'FRANCHISE-ADMIN', franchiseId: '60d5ecb8b392d7001f3e7943' });
console.log(accessToken);
