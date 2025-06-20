import React from 'react';

const LanguageSelector = ({ languages, selectedLanguage, onLanguageChange }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Target Language</h2>
      <div className="grid grid-cols-2 gap-3">
        {languages.map((language) => (
          <label
            key={language.id}
            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedLanguage === language.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="language"
              value={language.id}
              checked={selectedLanguage === language.id}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="sr-only"
            />
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{language.icon}</span>
              <span className="font-medium text-slate-900">{language.name}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector; 