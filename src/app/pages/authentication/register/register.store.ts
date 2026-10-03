import { Injectable, signal } from '@angular/core';

export type RegisterStatus = 'profile' | 'natural' | 'juridico';

/** `grupos` son claves de FormGroup: solo se reagrupa la navegacion, el payload es el mismo. */
export interface RegisterEtapa {
  titulo: string;
  grupos: string[];
}

@Injectable({ providedIn: 'root' })
export class RegisterStore {

  private _status = signal<RegisterStatus>('profile');
  private _stepIndex = signal(0);
  private _isLoading = signal(false);

  readonly status = this._status.asReadonly();
  readonly stepIndex = this._stepIndex.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  // Tres pasos, como los frames 425/563/564 del Figma: acceso, datos personales y confirmación.
  readonly naturalEtapas: RegisterEtapa[] = [
    { titulo: 'Datos de Acceso', grupos: ['step1', 'step2', 'step8'] },
    { titulo: 'Datos Personales', grupos: ['step3', 'step4', 'step5', 'step6', 'step7'] },
    { titulo: 'Confirmación', grupos: ['step9'] }
  ];

  // La empresa no esta en el Figma; mismo reparto en tres: acceso, datos de la empresa, confirmación.
  readonly juridicoEtapas: RegisterEtapa[] = [
    { titulo: 'Datos de Acceso', grupos: ['step2', 'step3', 'step12'] },
    // step7 (ejecutante) solo se pinta si el representante no es el beneficiario; su grupo no tiene validadores.
    { titulo: 'Datos de la Empresa', grupos: ['step1', 'step4', 'step5', 'step6', 'step7', 'step8', 'step9', 'step10', 'step11'] },
    { titulo: 'Confirmación', grupos: ['step13'] }
  ];

  selectProfile(profile: 'natural' | 'juridico') {
    this._status.set(profile);
    this._stepIndex.set(0);
  }

  nextStep(max: number) {
    this._stepIndex.update(v => Math.min(v + 1, max - 1));
  }

  prevStep() {
    this._stepIndex.update(v => Math.max(0, v - 1));
  }

  setStep(step: number) {
    this._stepIndex.set(step);
  }

  setLoading(value: boolean) {
    this._isLoading.set(value);
  }

  reset() {
    this._status.set('profile');
    this._stepIndex.set(0);
    this._isLoading.set(false);
  }

}
