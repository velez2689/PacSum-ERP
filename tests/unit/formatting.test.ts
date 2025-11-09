/**
 * Unit Tests for Formatting Utilities
 * Tests currency, date, and data formatting functions
 */

describe('Currency Formatting', () => {
  const formatCurrency = (amount: number, currency = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  it('should format currency with dollar sign', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00');
  });

  it('should handle decimal amounts', () => {
    expect(formatCurrency(99.99)).toBe('$99.99');
  });

  it('should format large amounts with thousands separator', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000.00');
  });

  it('should format zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('should handle negative amounts', () => {
    const result = formatCurrency(-100);
    expect(result).toContain('100.00');
  });

  it('should format other currencies', () => {
    const result = formatCurrency(100, 'EUR');
    expect(result).toContain('100');
  });
});

describe('Date Formatting', () => {
  const formatDate = (date: Date, format: string = 'MM/DD/YYYY'): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    if (format === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
    if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
    if (format === 'DD-MMM-YYYY') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day}-${months[date.getMonth()]}-${year}`;
    }

    return date.toString();
  };

  it('should format date as MM/DD/YYYY', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date, 'MM/DD/YYYY')).toBe('01/15/2024');
  });

  it('should format date as YYYY-MM-DD', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-15');
  });

  it('should format date as DD-MMM-YYYY', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date, 'DD-MMM-YYYY')).toBe('15-Jan-2024');
  });

  it('should pad single digit day and month', () => {
    const date = new Date('2024-01-05');
    expect(formatDate(date, 'MM/DD/YYYY')).toBe('01/05/2024');
  });
});

describe('Time Formatting', () => {
  const formatTime = (date: Date, format: '12h' | '24h' = '12h'): string => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    if (format === '24h') {
      return `${hours}:${minutes}:${seconds}`;
    }

    const hour12 = date.getHours() % 12 || 12;
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return `${String(hour12).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
  };

  it('should format time in 24-hour format', () => {
    const date = new Date('2024-01-15T14:30:45');
    expect(formatTime(date, '24h')).toBe('14:30:45');
  });

  it('should format time in 12-hour format with AM', () => {
    const date = new Date('2024-01-15T09:30:45');
    expect(formatTime(date, '12h')).toBe('09:30:45 AM');
  });

  it('should format time in 12-hour format with PM', () => {
    const date = new Date('2024-01-15T14:30:45');
    expect(formatTime(date, '12h')).toBe('02:30:45 PM');
  });

  it('should handle midnight', () => {
    const date = new Date('2024-01-15T00:00:00');
    expect(formatTime(date, '12h')).toBe('12:00:00 AM');
  });

  it('should handle noon', () => {
    const date = new Date('2024-01-15T12:00:00');
    expect(formatTime(date, '12h')).toBe('12:00:00 PM');
  });
});

describe('Number Formatting', () => {
  const formatNumber = (num: number, decimals: number = 2): string => {
    return num.toFixed(decimals).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');
  };

  it('should format number with thousands separator', () => {
    expect(formatNumber(1000)).toBe('1,000.00');
  });

  it('should respect decimal places', () => {
    expect(formatNumber(1234.5, 2)).toBe('1,234.50');
    expect(formatNumber(1234.5, 0)).toBe('1,235');
    expect(formatNumber(1234.5678, 3)).toBe('1,234.568');
  });

  it('should handle negative numbers', () => {
    expect(formatNumber(-1000)).toBe('-1,000.00');
  });

  it('should handle zero', () => {
    expect(formatNumber(0)).toBe('0.00');
  });
});

describe('Text Formatting', () => {
  const capitalizeFirstLetter = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const toTitleCase = (str: string): string => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => capitalizeFirstLetter(word))
      .join(' ');
  };

  const truncate = (str: string, length: number): string => {
    return str.length > length ? str.substring(0, length) + '...' : str;
  };

  it('should capitalize first letter', () => {
    expect(capitalizeFirstLetter('hello')).toBe('Hello');
    expect(capitalizeFirstLetter('HELLO')).toBe('HELLO');
  });

  it('should convert to title case', () => {
    expect(toTitleCase('hello world')).toBe('Hello World');
    expect(toTitleCase('the quick brown fox')).toBe('The Quick Brown Fox');
  });

  it('should truncate long strings', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...');
    expect(truncate('Hi', 5)).toBe('Hi');
  });

  it('should handle edge cases in truncation', () => {
    expect(truncate('', 5)).toBe('');
    expect(truncate('12345', 5)).toBe('12345');
  });
});

describe('Percentage Formatting', () => {
  const formatPercentage = (value: number, decimals: number = 2): string => {
    return (value * 100).toFixed(decimals) + '%';
  };

  const formatPercentageChange = (oldValue: number, newValue: number): string => {
    const change = ((newValue - oldValue) / oldValue) * 100;
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  it('should format decimal as percentage', () => {
    expect(formatPercentage(0.5)).toBe('50.00%');
    expect(formatPercentage(0.1)).toBe('10.00%');
  });

  it('should respect decimal places', () => {
    expect(formatPercentage(0.12345, 0)).toBe('12%');
    expect(formatPercentage(0.12345, 3)).toBe('12.345%');
  });

  it('should calculate percentage change', () => {
    expect(formatPercentageChange(100, 150)).toBe('+50.00%');
    expect(formatPercentageChange(100, 50)).toBe('-50.00%');
  });
});

describe('Data Formatting', () => {
  const formatPhone = (phone: string): string => {
    const cleaned = phone.replace(/\\D/g, '');
    if (cleaned.length !== 10) return phone;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  };

  const formatZipCode = (zip: string): string => {
    const cleaned = zip.replace(/\\D/g, '');
    if (cleaned.length === 5) return cleaned;
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    }
    return zip;
  };

  it('should format phone number', () => {
    expect(formatPhone('1234567890')).toBe('(123) 456-7890');
    expect(formatPhone('123-456-7890')).toBe('(123) 456-7890');
  });

  it('should format zip code', () => {
    expect(formatZipCode('12345')).toBe('12345');
    expect(formatZipCode('123456789')).toBe('12345-6789');
  });

  it('should handle invalid phone numbers', () => {
    expect(formatPhone('123')).toBe('123');
    expect(formatPhone('abc')).toBe('abc');
  });
});

describe('Array Formatting', () => {
  const formatList = (items: string[], conjunction: 'and' | 'or' = 'and'): string => {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
    return `${items.slice(0, -1).join(', ')}, ${conjunction} ${items[items.length - 1]}`;
  };

  it('should format list of items', () => {
    expect(formatList(['apple'])).toBe('apple');
    expect(formatList(['apple', 'banana'])).toBe('apple and banana');
    expect(formatList(['apple', 'banana', 'cherry'])).toBe('apple, banana, and cherry');
  });

  it('should support different conjunctions', () => {
    expect(formatList(['a', 'b'], 'or')).toBe('a or b');
    expect(formatList(['a', 'b', 'c'], 'or')).toBe('a, b, or c');
  });

  it('should handle empty list', () => {
    expect(formatList([])).toBe('');
  });
});
