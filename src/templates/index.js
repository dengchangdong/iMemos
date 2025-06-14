import { errorPage } from './error.js';
import { notFoundPage } from './notFound.js';
import { offlinePage } from './offline.js';
import { renderMemo } from './memo.js';
import { renderBaseHtml } from './base.js';

export const htmlTemplates = {
  errorPage,
  notFoundPage,
  offlinePage
};

export {
  renderMemo,
  renderBaseHtml
}; 