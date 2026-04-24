import { describe, expect, it } from 'vitest';
import {
  isValidOtp,
  isValidEmail,
  sanitizePlainText,
  containsHtml,
  validateNombre,
  validateEdad,
  validatePerfilGithub,
  isValidProjectName,
  validateProjectName,
} from './validation';

describe('isValidOtp', () => {
  it('accepts exactly six digits', () => {
    expect(isValidOtp('123456')).toBe(true);
  });

  it('rejects non-digit or wrong-length input', () => {
    expect(isValidOtp('12345')).toBe(false);
    expect(isValidOtp('abcdef')).toBe(false);
    expect(isValidOtp('')).toBe(false);
    expect(isValidOtp(null)).toBe(false);
    expect(isValidOtp(undefined)).toBe(false);
  });

  it('coerces numbers to strings', () => {
    expect(isValidOtp(123456)).toBe(true);
  });
});

describe('isValidEmail', () => {
  it('accepts well-formed emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('a.b-c@sub.example.org')).toBe(true);
  });

  it('rejects malformed emails', () => {
    expect(isValidEmail('no-at.com')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });
});

describe('sanitizePlainText', () => {
  it('strips HTML tags', () => {
    expect(sanitizePlainText('hola <b>mundo</b>')).toBe('hola mundo');
  });

  it('removes a control character and trims', () => {
    expect(sanitizePlainText('  hola\u0000  ')).toBe('hola');
  });

  it('truncates input longer than 10000 chars', () => {
    const long = 'a'.repeat(10050);
    expect(sanitizePlainText(long)).toHaveLength(10000);
  });

  it('handles null and undefined', () => {
    expect(sanitizePlainText(null)).toBe('');
    expect(sanitizePlainText(undefined)).toBe('');
  });
});

describe('containsHtml', () => {
  it('detects html tags', () => {
    expect(containsHtml('<script>x</script>')).toBe(true);
    expect(containsHtml('<b>bold</b>')).toBe(true);
  });

  it('returns false on plain text', () => {
    expect(containsHtml('hola mundo')).toBe(false);
    expect(containsHtml('a < b')).toBe(false);
    expect(containsHtml(null)).toBe(false);
  });
});

describe('validateNombre', () => {
  it('requires value by default', () => {
    expect(validateNombre('')).toBe('Este campo es obligatorio.');
    expect(validateNombre(null)).toBe('Este campo es obligatorio.');
  });

  it('allows empty when optional', () => {
    expect(validateNombre('', { required: false })).toBe('');
  });

  it('rejects html', () => {
    expect(validateNombre('<b>Ana</b>')).toBe('El nombre no puede contener etiquetas HTML.');
  });

  it('rejects too short names', () => {
    expect(validateNombre('A')).toContain('al menos');
  });

  it('rejects too long names', () => {
    expect(validateNombre('a'.repeat(101))).toContain('no puede exceder');
  });

  it('rejects disallowed special characters', () => {
    expect(validateNombre('Ana@Pérez')).toBe('El nombre contiene caracteres no permitidos.');
    expect(validateNombre('Pepe_123')).toBe('El nombre contiene caracteres no permitidos.');
  });

  it('accepts valid names', () => {
    expect(validateNombre('Ana Pérez')).toBe('');
    expect(validateNombre("O'Connor")).toBe('');
  });
});

describe('validateEdad', () => {
  it('requires value by default', () => {
    expect(validateEdad('')).toBe('Este campo es obligatorio.');
    expect(validateEdad(null)).toBe('Este campo es obligatorio.');
    expect(validateEdad(undefined)).toBe('Este campo es obligatorio.');
  });

  it('allows empty when optional', () => {
    expect(validateEdad('', { required: false })).toBe('');
  });

  it('rejects non-numeric values', () => {
    expect(validateEdad('abc')).toBe('Ingresa un número entero.');
  });

  it('rejects non-integer numbers', () => {
    expect(validateEdad('12.5')).toBe('Ingresa un número entero.');
  });

  it('rejects out-of-range values', () => {
    expect(validateEdad(12)).toContain('mínima permitida');
    expect(validateEdad(121)).toContain('válida');
  });

  it('accepts valid ages', () => {
    expect(validateEdad(25)).toBe('');
    expect(validateEdad('30')).toBe('');
  });
});

describe('validatePerfilGithub', () => {
  it('returns empty when optional and empty', () => {
    expect(validatePerfilGithub('')).toBe('');
    expect(validatePerfilGithub(null)).toBe('');
  });

  it('requires value when required flag is set', () => {
    expect(validatePerfilGithub('', { required: true })).toBe('Este campo es obligatorio.');
  });

  it('rejects html', () => {
    expect(validatePerfilGithub('<b>danielamr</b>')).toBe(
      'El perfil de GitHub no puede contener etiquetas HTML.',
    );
  });

  it('rejects disallowed characters', () => {
    expect(validatePerfilGithub('daniela mr')).toBe(
      'Ingresa un usuario de GitHub válido (sin URL).',
    );
  });

  it('rejects url values', () => {
    expect(validatePerfilGithub('https://github.com/danielamr')).toBe(
      'Ingresa un usuario de GitHub válido (sin URL).',
    );
  });

  it('rejects invalid username formats', () => {
    expect(validatePerfilGithub('-danielamr')).toBe('Ingresa un usuario de GitHub válido (sin URL).');
    expect(validatePerfilGithub('danielamr-')).toBe('Ingresa un usuario de GitHub válido (sin URL).');
    expect(validatePerfilGithub('daniel--amr')).toBe('Ingresa un usuario de GitHub válido (sin URL).');
    expect(validatePerfilGithub('a'.repeat(40))).toBe('Ingresa un usuario de GitHub válido (sin URL).');
  });

  it('accepts only valid usernames', () => {
    expect(validatePerfilGithub('danielamr')).toBe('');
    expect(validatePerfilGithub('daniel-amr')).toBe('');
    expect(validatePerfilGithub('daniel123')).toBe('');
  });
});

describe('isValidProjectName', () => {
  it('accepts safe project names under the limit', () => {
    expect(isValidProjectName('Mi proyecto 1')).toBe(true);
    expect(isValidProjectName('Proyecto-java_v2')).toBe(true);
    expect(isValidProjectName('P_A.')).toBe(true);
  });

  it('rejects special characters and long values', () => {
    expect(isValidProjectName('Proyecto <script>')).toBe(false);
    expect(isValidProjectName('Proyecto@2026')).toBe(false);
    expect(isValidProjectName('a'.repeat(50))).toBe(false);
  });
});

describe('validateProjectName', () => {
  it('requires value by default', () => {
    expect(validateProjectName('')).toBe('Este campo es obligatorio.');
    expect(validateProjectName(null)).toBe('Este campo es obligatorio.');
  });

  it('rejects html and special characters', () => {
    expect(validateProjectName('<b>Proyecto</b>')).toBe(
      'El nombre del proyecto no puede contener etiquetas HTML.',
    );
    expect(validateProjectName('Proyecto@2026')).toBe(
      'El nombre del proyecto contiene caracteres no permitidos.',
    );
  });

  it('rejects names with 50 characters or more', () => {
    expect(validateProjectName('a'.repeat(50))).toBe('El nombre del proyecto es demasiado largo.');
  });

  it('accepts valid project names', () => {
    expect(validateProjectName('Mi proyecto Java')).toBe('');
    expect(validateProjectName('Proyecto-1_v2')).toBe('');
    expect(validateProjectName('P_A.')).toBe('');
  });
});
