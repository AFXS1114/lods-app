// src/styles/theme.js
export const COLORS = {
  // Brand Colors from Logo
  primary: '#9C6ADE',      // The Vibrant Purple from "L" and "S"
  secondary: '#F1D956',    // The Bright Gold/Yellow from the Location Pin and tracks
  accent: '#7B42BC',       // A darker purple for active states/pressed buttons
  
  // Neutral Colors
  background: '#F8F9FA',   // Keeping your light gray for a clean look
  white: '#FFFFFF',
  
  // Text Colors
  text: '#1A0B08',         // Dark Brown/Black from the "LEAN ON..." text
  textLight: '#5A5A5A',    // Medium gray for subtext
  
  // UI Elements
  border: '#EDF2F7',
  error: '#FF5252',        // Standard red for error states
  success: '#2E7D32',      // Forest green for "Order Completed"
};

export const SPACING = { s: 10, m: 20, l: 30 };

export const SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4, // For Android
};