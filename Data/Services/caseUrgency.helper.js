export function calculateCaseUrgency(caseViolence = []) {
  let severity = null;

  for (const link of caseViolence) {
    const value = link.violence_types?.severity;

    if (Number.isInteger(value) && value >= 1 && value <= 10) {
      severity = severity === null ? value : Math.max(severity, value);
    }
  }

  let urgency = 'Sin evaluar';

  if (severity >= 8) {
    urgency = 'Alta';
  } else if (severity >= 4) {
    urgency = 'Media';
  } else if (severity >= 1) {
    urgency = 'Baja';
  }

  return { severity, urgency };
}
