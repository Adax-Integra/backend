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
  /* 
  assigns all of the parts of YYYY-MM-DD to match, so match will
  become something like 
  match = [
    '2026-12-30',
    '2026',
    '12',
    '30'
  ]
  */
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    throw new Error('Date must be in YYYY-MM-DD format.');
  }

  // So in here we assign each of the parts of match to their respective var
  const [, year, month, day] = match;
  // Assigns the monthName according to the month recieved
  const monthName = MONTH_NAMES[Number(month) - 1];

  if (!monthName) {
    throw new Error('Date contains an invalid month.');
  }

  // Returns the date in the format of 'DD de mes de YYYY'
  // For example (01 de enero de 2026)
  return `${day} de ${monthName} de ${year}`;
}

export default formatDate;
