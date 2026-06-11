import { format, formatDistanceToNow, parseISO, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';

export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
  return format(dateObj, formatStr);
};

export const formatTime = (date) => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
  return format(dateObj, 'HH:mm:ss');
};

export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
  return format(dateObj, 'MMM dd, yyyy HH:mm');
};

export const getRelativeTime = (date) => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

export const getDateGroup = (date) => {
  if (!date) return 'Unknown';
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
  if (isToday(dateObj)) return 'Today';
  if (isYesterday(dateObj)) return 'Yesterday';
  if (isThisWeek(dateObj)) return 'This Week';
  if (isThisMonth(dateObj)) return 'This Month';
  return format(dateObj, 'MMMM yyyy');
};

export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
};

export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

export const sortByDate = (array, key, order = 'desc') => {
  return [...array].sort((a, b) => {
    const dateA = new Date(a[key]);
    const dateB = new Date(b[key]);
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
};

export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};
