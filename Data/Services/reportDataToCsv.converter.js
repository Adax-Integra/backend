import formatDate from './dateFormatter.helper.js';

class ReportDataToCsvConverter {
  convert(data, startDate, endDate) {
    const prettyStartDate = formatDate(startDate);
    const prettyEndDate = formatDate(endDate);

    // This part checks for all of the end of line strings and replaces them
    // with the end of line of the CSV
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (/[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = [];

    // The section will be the first column, then metric and then value
    const addRow = (section, metric, value) => {
      rows.push([escapeCsv(section), escapeCsv(metric), escapeCsv(value)]);
    };

    // Row of the range of date
    addRow(
      'Periodo',
      'Rango de fecha',
      `De ${prettyStartDate} a ${prettyEndDate}`
    );

    // Section of total cases attended
    const cases = data.cases || {};
    addRow('Casos atendidos', 'Total de casos atendidos', cases.total ?? 0);
    addRow('', 'Primera atención', cases.new ?? 0);
    addRow('', 'Casos en seguimiento', cases.follow_up ?? 0);

    // TODO once there is data on the user to see the gender of the user
    // we should implement a section of cases by gender

    // Section of cases divided by age
    const age = data.cases || {};
    addRow('Grupo de edad', 'Niñas (0-11 años)', age['0-11'] ?? 0);
    addRow('', 'Adolescentes (12-17 años)', age['12-17'] ?? 0);
    addRow('', 'Jóvenes (18-29 años)', age['18-29'] ?? 0);
    addRow('', 'Adultas (30-59 años)', age['30-59'] ?? 0);
    addRow('', 'Adultas mayores (60 años o más)', age['60+'] ?? 0);
    if (age['unknown'] !== undefined) {
      addRow('', 'Edad no especificada', age['unknown']);
    }

    // Section of cases by region
    const regions = Object.entries(data.cases_by_region || {});
    if (regions.length > 0) {
      regions.forEach(([regionName, count], idx) => {
        addRow(idx === 0 ? 'Ubicación' : '', regionName, count);
      });
    } else {
      addRow('Ubicación', 'Sin registros', 0);
    }

    // Section of cases by violence
    const violence = data.cases_by_violence || {};
    addRow('Tipo de violencia identificada', 'Sexual', violence['Sexual'] ?? 0);
    addRow('', 'Física', violence['Física'] ?? 0);
    addRow('', 'Psicológica', violence['Psicológica'] ?? 0);
    addRow('', 'Género', violence['Género'] ?? 0);
    addRow('', 'Familiar', violence['Familiar'] ?? 0);
    addRow('', 'Económica', violence['Económica'] ?? 0);
    addRow('', 'Digital', violence['Digital'] ?? 0);
    addRow('', 'Institucional', violence['Institucional'] ?? 0);
    addRow('', 'Otra', violence['Otra'] ?? 0);

    // Section of cases by help type
    const help = data.cases_by_help || {};
    addRow(
      'Servicios brindados',
      'Orientación jurídica',
      help['Orientación y asesoría jurídica.'] ?? 0
    );
    addRow(
      '',
      'Atención a mujeres en situación de violencia',
      help['Atención a mujeres en situación de violencia.'] ?? 0
    );
    addRow(
      '',
      'Acompañamiento jurídico',
      help['Acompañamiento jurídico.'] ?? 0
    );
    addRow(
      '',
      'Canalización para atención psicológica',
      help['Canalización para atención psicológica.'] ?? 0
    );
    addRow(
      '',
      'Acompañamiento para aborto',
      help['Acompañamiento para aborto.'] ?? 0
    );
    addRow('', 'Banco de Miso', help['Banco de Miso.'] ?? 0);
    addRow(
      '',
      'Acompañamiento para instituciones',
      help['Acompañamiento ante instituciones.'] ?? 0
    );
    addRow(
      '',
      'Canalización a instituciones o servicios especializados',
      help['Canalización a instituciones o servicios especializados.'] ?? 0
    );
    addRow(
      '',
      'Seguimiento de casos',
      help['Seguimiento de casos, en caso de que aplique'] ?? 0
    );

    // Section of urgent cases
    // TODO, when we update the database to contain a field for is_risk_situation, then we will need to change this section
    const riskCases = data.cases_in_risk_situation ?? 0;
    addRow(
      'Situaciones de riesgo',
      'Casos identificados con alto riesgo',
      riskCases
    );

    return rows;
  }
}

export default new ReportDataToCsvConverter();
