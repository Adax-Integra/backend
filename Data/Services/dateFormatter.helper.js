const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function formatDate(date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    throw new Error('Date must be in YYYY-MM-DD format.');
  }

  const [, year, month, day] = match;
  const monthName = MONTH_NAMES[Number(month) - 1];

  if (!monthName) {
    throw new Error('Date contains an invalid month.');
  }

  return `${day} de ${monthName} del ${year}`;
}

export default formatDate;
