import { JSDOM } from 'jsdom';

export function stripHtml(document: Document): string {
  // Create a clone to avoid modifying the original document
  const clonedDocument = document.cloneNode(true) as Document;
  
  // Remove script and style elements
  const scripts = clonedDocument.querySelectorAll('script, style');
  scripts.forEach(element => element.remove());
  
  // Remove navigation, header, footer, aside elements
  const structuralElements = clonedDocument.querySelectorAll('nav, header, footer, aside, form, button, input, select, textarea');
  structuralElements.forEach(element => element.remove());
  
  // Remove elements with common ad/analytics classes
  const adSelectors = [
    '[class*="ad"]',
    '[class*="advertisement"]',
    '[class*="banner"]',
    '[class*="popup"]',
    '[class*="modal"]',
    '[class*="overlay"]',
    '[class*="cookie"]',
    '[class*="newsletter"]',
    '[class*="subscribe"]',
    '[id*="ad"]',
    '[id*="banner"]',
    '[id*="popup"]'
  ];
  
  adSelectors.forEach(selector => {
    const elements = clonedDocument.querySelectorAll(selector);
    elements.forEach(element => element.remove());
  });
  
  // Get text content from the cleaned document
  let textContent = clonedDocument.body?.textContent || '';
  
  // Clean up whitespace
  textContent = textContent
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n\s*\n/g, '\n') // Remove empty lines
    .trim();
  
  // Limit content length to reduce tokens
//   const maxLength = 10000; // 10KB should be sufficient for small LLM summaries
//   if (textContent.length > maxLength) {
//     textContent = textContent.substring(0, maxLength) + '...';
//   }
  
  return textContent;
}
