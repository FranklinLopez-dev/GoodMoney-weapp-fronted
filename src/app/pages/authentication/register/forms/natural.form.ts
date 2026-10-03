import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ProfileBanks } from 'src/app/core/models/profiles/profile-banks.model';
import { PasswordValidators } from "src/app/shared/validators/password.validators";
import { VALIDADORES_NOMBRE } from 'src/app/shared/validators/texto.validators';

export function buildNaturalForm(fb: FormBuilder): FormGroup {
  return fb.group({
    step1: fb.group({
      email: [null, [
        Validators.required,
        Validators.maxLength(100),
        Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      ]],
      // Sin validador propio: lo que decide es `emailVerified`, que solo lo pone el API al acertar el codigo.
      verificationCode: [null],
      emailVerified: [false, Validators.requiredTrue]
    }),

    step2: fb.group({
      password: [null, [Validators.required, PasswordValidators.politica()]],
      passwordConfirm: [null, Validators.required]
    }),

    step3: fb.group({
      documentTypeId: [null, Validators.required],
      documentNumber: [null, Validators.required],
      names: [null, VALIDADORES_NOMBRE],
      lastNamePaterno: [null, VALIDADORES_NOMBRE],
      lastNameMaterno: [null, VALIDADORES_NOMBRE],
      // Dato de identidad, va con el documento. El diseño no la pinta en ningun paso pero el API la exige.
      dateOfBirth: [null, [Validators.required]]
    }),

    step4: fb.group({
      documentPhotoFrontByte: [null, Validators.required],
      documentPhotoReverseByte: [null, Validators.required],
    }),

    step5: fb.group({
      address: [null, [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
      country: ['PE', Validators.required],
      departament: [null, Validators.required],
      province: [null, Validators.required],
      district: [null, Validators.required]
    }),

    step6: fb.group({
      positionId: [null, Validators.required]
    }),

    step7: fb.group({
      isPep: [false],
      institution: [null],
      cargo: [null]
    }),

    // El celular sube al paso 1: en el diseño va junto a los datos de acceso.
    step8: fb.group({
      cellPhone: [null, [Validators.required, Validators.minLength(6), Validators.maxLength(15)]],
      flagCellPhone: [false]
    }),

    step9: fb.group({
      // Se envia vacio: las cuentas se piden al operar, no al registrarse.
      profileBanks: fb.control<ProfileBanks[]>([]),
      reCaptchaToken: [null, Validators.required],
      agreements: [false, Validators.requiredTrue]
    })
  },
    {
      validators: PasswordValidators.mustMatch("step2.password", "step2.passwordConfirm"),
    }
  );
}
