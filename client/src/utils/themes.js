import { ROLES } from '../shared/constants';
import { Bug, Wrench, Search, Code2 } from 'lucide-react';

/**
 * Role-based theme configurations for IEEE Code Wars.
 * Each role gets a unique visual identity with its own colors, glows, and accents.
 */

export const ROLE_THEMES = {
  [ROLES.HACKER]: {
    name: 'Hacker',
    // Primary colors
    primary: '#ff3366',
    primaryRgb: '255, 51, 102',
    secondary: '#ff6b6b',
    accent: '#ff0044',
    // Background
    bgGradient: 'from-red-950/20 via-cyber-dark to-cyber-dark',
    bodyOverlay: 'rgba(255, 0, 50, 0.03)',
    gridColor: 'rgba(255, 51, 102, 0.04)',
    orbColor: 'rgba(255, 51, 102, 0.03)',
    // Cards & borders
    cardBg: 'bg-[#1a0a10]',
    cardBorder: 'border-red-900/40',
    headerBg: 'bg-[#120008]/90',
    headerBorder: 'border-red-900/30',
    // Text
    titleColor: 'text-cyber-red',
    titleGlow: 'neon-text-red',
    subtitleColor: 'text-red-400/80',
    // Buttons
    btnClass: 'cyber-btn-red',
    // Badge
    badgeBg: 'bg-cyber-red/10',
    badgeBorder: 'border-cyber-red/30',
    badgeText: 'text-cyber-red',
    // Inset shadow
    insetShadow: 'shadow-[inset_0_0_120px_rgba(255,0,50,0.08)]',
    // Scrollbar
    scrollThumb: '#3d0015',
    // Phase indicator accent
    phaseAccent: 'border-l-4 border-l-cyber-red/50',
    // Icon
    icon: Bug,
    // CSS custom properties
    cssVars: {
      '--theme-primary': '#ff3366',
      '--theme-primary-rgb': '255, 51, 102',
      '--theme-glow': 'rgba(255, 51, 102, 0.5)',
      '--theme-grid': 'rgba(255, 51, 102, 0.04)',
      '--theme-orb': 'rgba(255, 51, 102, 0.03)',
    },
  },

  [ROLES.ADMIN]: {
    name: 'Admin',
    primary: '#00ff88',
    primaryRgb: '0, 255, 136',
    secondary: '#50ffaa',
    accent: '#00cc66',
    bgGradient: 'from-green-950/20 via-cyber-dark to-cyber-dark',
    bodyOverlay: 'rgba(0, 255, 100, 0.02)',
    gridColor: 'rgba(0, 255, 136, 0.05)',
    orbColor: 'rgba(0, 255, 136, 0.03)',
    cardBg: 'bg-[#0a1a10]',
    cardBorder: 'border-green-900/40',
    headerBg: 'bg-[#001208]/90',
    headerBorder: 'border-green-900/30',
    titleColor: 'text-cyber-green',
    titleGlow: 'neon-text-green',
    subtitleColor: 'text-green-400/80',
    btnClass: 'cyber-btn-green',
    badgeBg: 'bg-cyber-green/10',
    badgeBorder: 'border-cyber-green/30',
    badgeText: 'text-cyber-green',
    insetShadow: 'shadow-[inset_0_0_120px_rgba(0,255,100,0.06)]',
    scrollThumb: '#003d1a',
    phaseAccent: 'border-l-4 border-l-cyber-green/50',
    icon: Wrench,
    cssVars: {
      '--theme-primary': '#00ff88',
      '--theme-primary-rgb': '0, 255, 136',
      '--theme-glow': 'rgba(0, 255, 136, 0.5)',
      '--theme-grid': 'rgba(0, 255, 136, 0.05)',
      '--theme-orb': 'rgba(0, 255, 136, 0.03)',
    },
  },

  [ROLES.SECURITY_LEAD]: {
    name: 'QA',
    primary: '#ffcc00',
    primaryRgb: '255, 204, 0',
    secondary: '#ffe066',
    accent: '#ffaa00',
    bgGradient: 'from-yellow-950/20 via-cyber-dark to-cyber-dark',
    bodyOverlay: 'rgba(255, 200, 50, 0.02)',
    gridColor: 'rgba(255, 204, 0, 0.04)',
    orbColor: 'rgba(255, 204, 0, 0.03)',
    cardBg: 'bg-[#1a1800]',
    cardBorder: 'border-yellow-900/40',
    headerBg: 'bg-[#121000]/90',
    headerBorder: 'border-yellow-900/30',
    titleColor: 'text-cyber-yellow',
    titleGlow: '',
    subtitleColor: 'text-yellow-400/80',
    btnClass: 'cyber-btn-blue',
    badgeBg: 'bg-cyber-yellow/10',
    badgeBorder: 'border-yellow-500/30',
    badgeText: 'text-cyber-yellow',
    insetShadow: 'shadow-[inset_0_0_120px_rgba(255,200,50,0.06)]',
    scrollThumb: '#3d3200',
    phaseAccent: 'border-l-4 border-l-cyber-yellow/50',
    icon: Search,
    cssVars: {
      '--theme-primary': '#ffcc00',
      '--theme-primary-rgb': '255, 204, 0',
      '--theme-glow': 'rgba(255, 204, 0, 0.5)',
      '--theme-grid': 'rgba(255, 204, 0, 0.04)',
      '--theme-orb': 'rgba(255, 204, 0, 0.03)',
    },
  },

  [ROLES.DEVELOPER]: {
    name: 'Developer',
    primary: '#00bbff',
    primaryRgb: '0, 187, 255',
    secondary: '#66d9ff',
    accent: '#0099dd',
    bgGradient: 'from-blue-950/20 via-cyber-dark to-cyber-dark',
    bodyOverlay: 'rgba(0, 150, 255, 0.02)',
    gridColor: 'rgba(0, 187, 255, 0.04)',
    orbColor: 'rgba(0, 187, 255, 0.03)',
    cardBg: 'bg-[#0a0f1a]',
    cardBorder: 'border-blue-900/40',
    headerBg: 'bg-[#000812]/90',
    headerBorder: 'border-blue-900/30',
    titleColor: 'text-cyber-blue',
    titleGlow: '',
    subtitleColor: 'text-blue-400/80',
    btnClass: 'cyber-btn-blue',
    badgeBg: 'bg-cyber-blue/10',
    badgeBorder: 'border-cyber-blue/30',
    badgeText: 'text-cyber-blue',
    insetShadow: 'shadow-[inset_0_0_120px_rgba(0,150,255,0.06)]',
    scrollThumb: '#001a3d',
    phaseAccent: 'border-l-4 border-l-cyber-blue/50',
    icon: Code2,
    cssVars: {
      '--theme-primary': '#00bbff',
      '--theme-primary-rgb': '0, 187, 255',
      '--theme-glow': 'rgba(0, 187, 255, 0.5)',
      '--theme-grid': 'rgba(0, 187, 255, 0.04)',
      '--theme-orb': 'rgba(0, 187, 255, 0.03)',
    },
  },
};

// Default theme for lobby/no role assigned
export const DEFAULT_THEME = ROLE_THEMES[ROLES.DEVELOPER];

/**
 * Get the theme for a given role. Falls back to the default (Developer) theme.
 */
export function getTheme(role) {
  return ROLE_THEMES[role] || DEFAULT_THEME;
}

/**
 * Apply CSS custom properties to the document root for the given role theme.
 * This allows CSS pseudo-elements (::before, ::after) to use theme colors.
 */
export function applyThemeToDocument(role) {
  const theme = getTheme(role);
  const root = document.documentElement;
  Object.entries(theme.cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}
