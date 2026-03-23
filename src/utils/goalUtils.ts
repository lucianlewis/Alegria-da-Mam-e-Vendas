import { startOfMonth, endOfMonth, eachDayOfInterval, isSunday, format } from 'date-fns';

// Simple Easter calculation (Meeus/Jones/Butcher algorithm)
function getEaster(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function getHolidays(year: number) {
  const easter = getEaster(year);
  
  // Passion Friday (Sexta-feira Santa) is 2 days before Easter
  const passionFriday = new Date(easter);
  passionFriday.setDate(easter.getDate() - 2);
  
  // Carnival (Carnaval) is 47 days before Easter
  const carnival = new Date(easter);
  carnival.setDate(easter.getDate() - 47);
  
  // Corpus Christi is 60 days after Easter
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60);

  const fixedHolidays = [
    '01-01', // Ano Novo
    '04-21', // Tiradentes
    '05-01', // Dia do Trabalho
    '09-07', // Independência
    '10-12', // Nossa Senhora Aparecida
    '11-02', // Finados
    '11-15', // Proclamação da República
    '11-20', // Consciência Negra
    '12-25', // Natal
  ];

  const variableHolidays = [
    format(passionFriday, 'MM-dd'),
    format(carnival, 'MM-dd'),
    format(corpusChristi, 'MM-dd'),
  ];

  return [...fixedHolidays, ...variableHolidays];
}

export function isWorkingDay(date: Date) {
  const holidays = getHolidays(date.getFullYear());
  const isSun = isSunday(date);
  const dayStr = format(date, 'MM-dd');
  const isHoliday = holidays.includes(dayStr);
  return !isSun && !isHoliday;
}

export function getWorkingDaysInMonth(date: Date) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const days = eachDayOfInterval({ start, end });
  return days.filter(isWorkingDay).length;
}

export function calculateDailyGoal(sellers: { goal: number }[], date: Date) {
  const totalMonthlyGoal = sellers.reduce((acc, s) => acc + (s.goal || 0), 0);
  const workingDays = getWorkingDaysInMonth(date);
  return workingDays > 0 ? totalMonthlyGoal / workingDays : 0;
}
