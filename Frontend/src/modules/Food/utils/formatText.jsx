import React from 'react';

/**
 * Renders text with support for dynamic bold words using markdown syntax (**word**) or HTML tags (<b>/<strong>).
 * Words wrapped in **...** will render bold with customizable or high-contrast styling.
 */
export const renderFormattedText = (text, strongClassName = "text-zinc-950 dark:text-white font-extrabold") => {
  if (!text) return null;
  const str = String(text);
  const regex = /(\*\*.*?\*\*|<b>.*?<\/b>|<strong>.*?<\/strong>)/g;
  const parts = str.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const content = part.slice(2, -2);
      return (
        <strong key={index} className={strongClassName}>
          {content}
        </strong>
      );
    }
    if ((part.startsWith('<b>') && part.endsWith('</b>')) || (part.startsWith('<strong>') && part.endsWith('</strong>'))) {
      const content = part.replace(/<\/?(b|strong)>/g, '');
      return (
        <strong key={index} className={strongClassName}>
          {content}
        </strong>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

