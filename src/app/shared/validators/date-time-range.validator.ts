import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function dateTimeRangeValidator(
    dateFromKey: string,
    timeFromKey: string,
    dateToKey: string,
    timeToKey: string
): ValidatorFn {

    return (group: AbstractControl): ValidationErrors | null => {
        const dateFromCtrl = group.get(dateFromKey);
        const timeFromCtrl = group.get(timeFromKey);
        const dateToCtrl = group.get(dateToKey);
        const timeToCtrl = group.get(timeToKey);

        if (!dateFromCtrl || !dateToCtrl) return null;

        const dateFrom = dateFromCtrl.value as Date | null;
        const dateTo = dateToCtrl.value as Date | null;

        clearError(dateToCtrl, 'dateTimeRangeInvalid');
        if (timeToCtrl) clearError(timeToCtrl, 'dateTimeRangeInvalid');

        if (dateFrom && dateTo) {
            const fromDate = stripTime(dateFrom);
            const toDate = stripTime(dateTo);

            if (fromDate.getTime() > toDate.getTime()) {
                const error = { dateTimeRangeInvalid: true };

                dateToCtrl.setErrors({
                    ...(dateToCtrl.errors ?? {}),
                    ...error
                });

                return error;
            }
        }

        const timeFrom = timeFromCtrl?.value as string | null;
        const timeTo = timeToCtrl?.value as string | null;

        if (!dateFrom || !dateTo || !timeFrom || !timeTo) {
            return null;
        }

        if (!isSameDay(dateFrom, dateTo)) {
            return null;
        }

        const from = combineDateAndTime(dateFrom, timeFrom);
        const to = combineDateAndTime(dateTo, timeTo);

        if (!from || !to) return null;

        if (from.getTime() > to.getTime()) {
            const error = { dateTimeRangeInvalid: true };

            timeToCtrl?.setErrors({
                ...(timeToCtrl.errors ?? {}),
                ...error
            });

            return error;
        }

        return null;
    };
}

function combineDateAndTime(
    date: Date,
    time: string | Date
): Date | null {

    const result = new Date(date);

    if (time instanceof Date) {
        result.setHours(
            time.getHours(),
            time.getMinutes(),
            0,
            0
        );
        return result;
    }

    if (typeof time === 'string') {
        const match = /^(\d{2}):(\d{2})$/.exec(time);
        if (!match) return null;

        result.setHours(+match[1], +match[2], 0, 0);
        return result;
    }

    return null;
}

function stripTime(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function clearError(ctrl: AbstractControl, key: string) {
    if (!ctrl.hasError(key)) return;
    const e = { ...ctrl.errors };
    delete e[key];
    ctrl.setErrors(Object.keys(e).length ? e : null);
}

export function parseDateAndTime(date: Date | string, time: string | Date): string | null {
    if (!date || !time) return null;

    const d = new Date(date);

    if (typeof time === 'string') {
        const [hours, minutes] = time.split(':').map(Number);
        d.setHours(hours, minutes, 0, 0);
    } else if (time instanceof Date) {
        d.setHours(time.getHours(), time.getMinutes(), 0, 0);
    }

    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}T${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:00`;
}