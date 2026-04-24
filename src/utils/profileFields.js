import { validateEdad, validateNombre, validatePerfilGithub } from './validation';

export const PROFILE_FIELDS = ['nombre', 'edad', 'perfil_github'];
export const INITIAL_PROFILE_FORM = { nombre: '', edad: '', perfil_github: '' };
export const INITIAL_PROFILE_ERRORS = { nombre: '', edad: '', perfil_github: '' };
export const INITIAL_PROFILE_TOUCHED = { nombre: false, edad: false, perfil_github: false };

export function validateProfileField(field, value, { edadRequired }) {
  switch (field) {
    case 'nombre':
      return validateNombre(value, { required: true });
    case 'edad':
      return validateEdad(value, { required: edadRequired });
    case 'perfil_github':
      return validatePerfilGithub(value, { required: false });
    default:
      return '';
  }
}
