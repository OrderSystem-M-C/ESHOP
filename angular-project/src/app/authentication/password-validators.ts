import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl) : ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null;
    }

    const hasUpperCase = /[A-Z]+/.test(value);
    const hasLowerCase = /[a-z]+/.test(value);
    const hasNumeric = /[0-9]+/.test(value);
    const hasNonAlphanumeric = /\W/.test(value);
    const hasValidLength = value.length >= 6;
    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasNonAlphanumeric && hasValidLength;

    return passwordValid ? null : { passwordStrength: true };
  }
}

export function equalValuesValidator(fieldToBeComparedWith: string): ValidatorFn {
  return (control: AbstractControl) : ValidationErrors | null => {
    const fieldValue = control.root.get(fieldToBeComparedWith);
    const valuesEqual = fieldValue && control && fieldValue.value === control.value;

    return valuesEqual ? null : { mismatch: true };
  }
}
