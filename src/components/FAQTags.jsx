import React from 'react';
import './FAQTags.css';

const FAQTags = ({ onTagClick }) => {
  const tags = [
    "Help",
    "Show deals",
    "1Voucher info",
    "Contact us"
  ];

  return (
    <div className="faq-tags">
      {tags.map((tag, index) => (
        <button key={index} className="faq-tag" onClick={() => onTagClick(tag)}>
          {tag}
        </button>
      ))}
    </div>
  );
};

export default FAQTags;