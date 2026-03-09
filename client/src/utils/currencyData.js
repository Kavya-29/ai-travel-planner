export const countryToCurrency = {
    // Middle East
    'AE': { code: 'AED', symbol: 'د.إ' },
    'SA': { code: 'SAR', symbol: '﷼' },
    'QA': { code: 'QAR', symbol: '﷼' },
    'OM': { code: 'OMR', symbol: '﷼' },
    'KW': { code: 'KWD', symbol: 'د.ك' },
    'BH': { code: 'BHD', symbol: '.د.ب' },
    'JO': { code: 'JOD', symbol: 'د.ا' },
    'LB': { code: 'LBP', symbol: 'ل.ل' },
    'EG': { code: 'EGP', symbol: 'E£' },

    // Asia
    'IN': { code: 'INR', symbol: '₹' },
    'PK': { code: 'PKR', symbol: '₨' },
    'BD': { code: 'BDT', symbol: '৳' },
    'LK': { code: 'LKR', symbol: 'Rs' },
    'NP': { code: 'NPR', symbol: '₨' },
    'CN': { code: 'CNY', symbol: '¥' },
    'JP': { code: 'JPY', symbol: '¥' },
    'KR': { code: 'KRW', symbol: '₩' },
    'SG': { code: 'SGD', symbol: '$' },
    'MY': { code: 'MYR', symbol: 'RM' },
    'TH': { code: 'THB', symbol: '฿' },
    'ID': { code: 'IDR', symbol: 'Rp' },
    'VN': { code: 'VND', symbol: '₫' },
    'PH': { code: 'PHP', symbol: '₱' },

    // Europe (Eurozone)
    'AT': { code: 'EUR', symbol: '€' },
    'BE': { code: 'EUR', symbol: '€' },
    'CY': { code: 'EUR', symbol: '€' },
    'EE': { code: 'EUR', symbol: '€' },
    'FI': { code: 'EUR', symbol: '€' },
    'FR': { code: 'EUR', symbol: '€' },
    'DE': { code: 'EUR', symbol: '€' },
    'GR': { code: 'EUR', symbol: '€' },
    'IE': { code: 'EUR', symbol: '€' },
    'IT': { code: 'EUR', symbol: '€' },
    'LV': { code: 'EUR', symbol: '€' },
    'LT': { code: 'EUR', symbol: '€' },
    'LU': { code: 'EUR', symbol: '€' },
    'MT': { code: 'EUR', symbol: '€' },
    'NL': { code: 'EUR', symbol: '€' },
    'PT': { code: 'EUR', symbol: '€' },
    'SK': { code: 'EUR', symbol: '€' },
    'SI': { code: 'EUR', symbol: '€' },
    'ES': { code: 'EUR', symbol: '€' },

    // Non-Euro Europe
    'GB': { code: 'GBP', symbol: '£' },
    'CH': { code: 'CHF', symbol: 'CHF' },
    'SE': { code: 'SEK', symbol: 'kr' },
    'NO': { code: 'NOK', symbol: 'kr' },
    'DK': { code: 'DKK', symbol: 'kr' },
    'RU': { code: 'RUB', symbol: '₽' },
    'TR': { code: 'TRY', symbol: '₺' },

    // Americas
    'US': { code: 'USD', symbol: '$' },
    'CA': { code: 'CAD', symbol: '$' },
    'MX': { code: 'MXN', symbol: '$' },
    'BR': { code: 'BRL', symbol: 'R$' },
    'AR': { code: 'ARS', symbol: '$' },
    'CL': { code: 'CLP', symbol: '$' },
    'CO': { code: 'COP', symbol: '$' },
    'PE': { code: 'PEN', symbol: 'S/.' },

    // Oceania
    'AU': { code: 'AUD', symbol: '$' },
    'NZ': { code: 'NZD', symbol: '$' },

    // Africa
    'ZA': { code: 'ZAR', symbol: 'R' },
    'NG': { code: 'NGN', symbol: '₦' },
    'KE': { code: 'KES', symbol: 'KSh' },
    'GH': { code: 'GHS', symbol: 'GH₵' },
    'MA': { code: 'MAD', symbol: 'د.م.' }
};

export const getCurrencyFromCountry = (countryCode) => {
    return countryToCurrency[countryCode?.toUpperCase()] || { code: 'USD', symbol: '$' };
};

export const getCurrencySymbol = (currencyCode) => {
    if (!currencyCode || typeof currencyCode !== 'string') return '$';
    const entry = Object.values(countryToCurrency).find(c => c.code === currencyCode?.toUpperCase());
    if (entry) return entry.symbol;

    // Manual fallbacks for common symbols
    const symbols = {
        'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£', 'AED': 'د.إ', 'KRW': '₩', 'SAR': '﷼', 'JPY': '¥', 'CNY': '¥'
    };
    return symbols[currencyCode?.toUpperCase()] || '$';
};

export const getAllCurrencies = () => {
    const uniqueCodes = new Set();
    const result = [];
    Object.values(countryToCurrency).forEach(c => {
        if (!uniqueCodes.has(c.code)) {
            uniqueCodes.add(c.code);
            result.push(c);
        }
    });
    // Add any missing from manual fallbacks
    const manualCodes = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'KRW', 'SAR', 'JPY', 'CNY'];
    manualCodes.forEach(code => {
        if (!uniqueCodes.has(code)) {
            const symbols = {
                'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£', 'AED': 'د.إ', 'KRW': '₩', 'SAR': '﷼', 'JPY': '¥', 'CNY': '¥'
            };
            result.push({ code, symbol: symbols[code] });
            uniqueCodes.add(code);
        }
    });
    return result.sort((a, b) => a.code.localeCompare(b.code));
};
