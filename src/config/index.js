import { API_CONFIG } from './api.js';
import { REGEX_CONFIG } from './regex.js';
import { CSS_CONFIG } from './css.js';

export const CONFIG = {
  PAGE_LIMIT: '10',
  ...API_CONFIG,
  REGEX: REGEX_CONFIG,
  CSS: CSS_CONFIG
}; 