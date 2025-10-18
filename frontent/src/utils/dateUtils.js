// Date Utilities
// This file structure created as per requested organization

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const subtractDays = (date, days) => {
  return addDays(date, -days);
};

export const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

export const startOfWeek = (date) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day;
  result.setDate(diff);
  return startOfDay(result);
};

export const endOfWeek = (date) => {
  const result = startOfWeek(date);
  return endOfDay(addDays(result, 6));
};

export const startOfMonth = (date) => {
  const result = new Date(date);
  result.setDate(1);
  return startOfDay(result);
};

export const endOfMonth = (date) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1, 0);
  return endOfDay(result);
};

export const isToday = (date) => {
  const today = new Date();
  const target = new Date(date);
  return today.toDateString() === target.toDateString();
};

export const isYesterday = (date) => {
  const yesterday = subtractDays(new Date(), 1);
  const target = new Date(date);
  return yesterday.toDateString() === target.toDateString();
};

export const isSameWeek = (date1, date2) => {
  const start1 = startOfWeek(date1);
  const start2 = startOfWeek(date2);
  return start1.getTime() === start2.getTime();
};

export const isSameMonth = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
};

export const getDaysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((new Date(date1) - new Date(date2)) / oneDay));
};

export const getBusinessDays = (startDate, endDate) => {
  let count = 0;
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      count++;
    }
    currentDate = addDays(currentDate, 1);
  }
  
  return count;
};

export const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};
