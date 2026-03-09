const countryToCurrency = {
    'FR': { code: 'EUR', symbol: '€' },
    'KR': { code: 'KRW', symbol: '₩' },
    'US': { code: 'USD', symbol: '$' }
};

const getCurrencySymbol = (currencyCode) => {
    const entry = Object.values(countryToCurrency).find(c => c.code === currencyCode?.toUpperCase());
    if (entry) return entry.symbol;

    const symbols = {
        'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£', 'KRW': '₩'
    };
    return symbols[currencyCode?.toUpperCase()] || '$';
};

console.log('EUR:', getCurrencySymbol('EUR'));
console.log('KRW:', getCurrencySymbol('KRW'));
console.log('USD:', getCurrencySymbol('USD'));
console.log('undefined:', getCurrencySymbol(undefined));
