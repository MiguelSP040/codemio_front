import { describe, expect, it } from 'vitest';
import {
  isValidOtp,
  isValidEmail,
  sanitizePlainText,
  containsHtml,
  validateNombre,
  validateEdad,
  validatePerfilGithub,
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

  it('accepts valid names', () => {
    expect(validateNombre('Ana Pérez')).toBe('');
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
    expect(validateEdad(0)).toContain('mayor que 0');
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
      'El perfil de GitHub contiene caracteres no permitidos.',
    );
  });

  it('rejects too-long values', () => {
    expect(validatePerfilGithub('a'.repeat(256))).toBe('El perfil de GitHub es demasiado largo.');
  });

  it('accepts urls and usernames', () => {
    expect(validatePerfilGithub('danielamr')).toBe('');
    expect(validatePerfilGithub('https://github.com/danielamr')).toBe('');
  });
});
