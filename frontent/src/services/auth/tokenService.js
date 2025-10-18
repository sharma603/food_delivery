// Token Service
// This file structure created as per requested organization

class TokenService {
  static getToken() {
    return localStorage.getItem('token');
  }

  static getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  static setToken(token) {
    localStorage.setItem('token', token);
  }

  static setRefreshToken(refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }

  static removeTokens() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  static isTokenValid(token) {
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch (error) {
      return false;
    }
  }

  static getTokenPayload(token) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      return null;
    }
  }
}

export default TokenService;
