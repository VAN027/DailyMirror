export const setDateSafely = (date: Date, day: number): void => {
  date.setDate(1); // First set to 1st to avoid overflow
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDayOfMonth));
};
