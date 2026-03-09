import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'ta', name: 'Tamil' },
        { code: 'hi', name: 'Hindi' },
        { code: 'fr', name: 'French' },
        { code: 'ml', name: 'Malayalam' },
    ];

    return (
        <div className="relative group">
            <button className="px-3 py-1 text-sm font-medium text-slate-200 bg-slate-800/50 border border-slate-700/50 rounded-md hover:bg-slate-700 transition-colors backdrop-blur-md">
                {languages.find(l => l.code === i18n.language)?.name || 'Language'}
            </button>
            <div className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {languages.map((lng) => (
                    <button
                        key={lng.code}
                        onClick={() => changeLanguage(lng.code)}
                        className="block w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors first:rounded-t-md last:rounded-b-md"
                    >
                        {lng.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LanguageSwitcher;
