import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ProfileBanks } from 'src/app/core/models';
import { PasswordValidators } from 'src/app/shared/validators/password.validators';
import { VALIDADORES_NOMBRE } from 'src/app/shared/validators/texto.validators';

export function buildJuridicoForm(fb: FormBuilder): FormGroup {
  return fb.group({
    step1: fb.group({
      documentTypeId: [null, Validators.required],
      documentNumber: [null, Validators.required],
      names: [null, [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      documentPhotoFrontByte: [null, Validators.required],
      status: [false, Validators.requiredTrue],
      documentPhotoFrontName: [null, Validators.required],
    }),

    step2: fb.group({
      email: [null, [
        Validators.required,
        Validators.maxLength(100),
        Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      ]],
      // Igual que en persona natural: manda `emailVerified`, no el codigo.
      verificationCode: [null],
      emailVerified: [false, Validators.requiredTrue]
    }),

    step3: fb.group({
      password: [null, [Validators.required, PasswordValidators.politica()]],
      passwordConfirm: [null, Validators.required]
    }),

    step4: fb.group({
      address: [null, [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
      country: ['PE', Validators.required],
      departament: [null, Validators.required],
      province: [null, Validators.required],
      district: [null, Validators.required]
    }),

    step5: fb.group({
      activityId: [null, Validators.required]
    }),

    step6: fb.group({
      documentTypeRepId: [null, Validators.required],
      documentNumberRep: [null, Validators.required],
      namesRep: [null, VALIDADORES_NOMBRE],
      lastNamePaternoRep: [null, VALIDADORES_NOMBRE],
      lastNameMaternoRep: [null, VALIDADORES_NOMBRE],
      isMe: [true, Validators.required],
      // La fecha de nacimiento acompaña al documento del representante, no al celular.
      dateOfBirth: [null, [Validators.required]]
    }),

    step7: fb.group({
      documentTypeBenefId: [null,],
      documentNumberBenef: [null,],
      namesBenef: [null,],
      lastNamePaternoBenef: [null,],
      lastNameMaternoBenef: [null,]
    }),

    step8: fb.group({
      documentPhotoFrontByteBenef: [null, Validators.required],
      documentPhotoReverseByteBenef: [null, Validators.required],
    }),

    step9: fb.group({
      addressBenef: [null, [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
      countryBenef: ['PE', Validators.required],
      departamentBenef: [null, Validators.required],
      provinceBenef: [null, Validators.required],
      districtBenef: [null, Validators.required]
    }),

    step10: fb.group({
      positionId: [null, Validators.required]
    }),

    step11: fb.group({
      isPep: [false],
      institution: [null],
      cargo: [null]
    }),

    // El celular sube al paso 1, con los datos de acceso.
    step12: fb.group({
      cellPhone: [null, [Validators.required, Validators.minLength(6), Validators.maxLength(15)]],
      flagCellPhone: [false]
    }),

    step13: fb.group({
      // Se envia vacio: las cuentas se piden al operar, no al registrarse.
      profileBanks: fb.control<ProfileBanks[]>([]),
      reCaptchaToken: [null, Validators.required],
      agreements: [false, Validators.requiredTrue]
    })
  },
    {
      validators: PasswordValidators.mustMatch("step3.password", "step3.passwordConfirm"),
    });
}
