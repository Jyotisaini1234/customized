import { jwtDecode } from "jwt-decode";
import { JWTPayload, User } from "../types/types.ts";

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const getTokenExpiry = (token: string): number | null => {
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    return decoded.exp * 1000;
  } catch {
    return null;
  }
};

export const getUserFromToken = (token: string, loginEmail?: string): User | null => {
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    
    let email = '';
    if (decoded.email) {
      email = decoded.email;
    } else if (loginEmail && loginEmail.includes('@')) {
      email = loginEmail;
      console.log('Using login email as fallback:', email);
    }
    
    let username = '';
    if (decoded.username) {
      username = decoded.username;
    } else if (email) {
      username = email.split('@')[0];
    }
    
    // Fix: Check for the correct property names from the JWT payload
    let companyName = '';
    if (decoded.companyName && decoded.companyName.trim()) {
      companyName = decoded.companyName.trim();
    } else if (decoded.company_name && decoded.company_name.trim()) {
      companyName = decoded.company_name.trim();
    } else if (decoded.organizationName && decoded.organizationName.trim()) {
      companyName = decoded.organizationName.trim();
    } else {
      companyName = 'Fly Divine'; // Default fallback
    }
    
    console.log('Extracted company name from token:', companyName);
    
    return {
      id: decoded.sub,
      username: username,
      email: email,
      role: decoded.role,
      company: companyName,
      companyName: companyName, // Add this if your User type expects it
    };
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};