export const fetchSvgAsString = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const text = await response.text();
  
  // Jeśli to HTML-encoded SVG, zdekoduj
  if (text.includes('&lt;')) {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&apos;/g, "'");
  }
  
  return text;
};
