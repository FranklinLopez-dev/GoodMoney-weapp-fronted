import { MatDatepickerIntl } from '@angular/material/datepicker';

/** Textos (aria) del datepicker en español; Material los trae en inglés. */
export function datepickerEnEspanol(): MatDatepickerIntl {
  const intl = new MatDatepickerIntl();

  intl.calendarLabel = 'Calendario';
  intl.openCalendarLabel = 'Abrir calendario';
  intl.closeCalendarLabel = 'Cerrar calendario';
  intl.prevMonthLabel = 'Mes anterior';
  intl.nextMonthLabel = 'Mes siguiente';
  intl.prevYearLabel = 'Año anterior';
  intl.nextYearLabel = 'Año siguiente';
  intl.prevMultiYearLabel = 'Años anteriores';
  intl.nextMultiYearLabel = 'Años siguientes';
  intl.switchToMonthViewLabel = 'Ver mes';
  intl.switchToMultiYearViewLabel = 'Elegir mes y año';
  intl.startDateLabel = 'Fecha de inicio';
  intl.endDateLabel = 'Fecha de fin';

  return intl;
}
