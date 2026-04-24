import { describe, expect, it } from 'vitest';
import { extractApiErrorMessage } from './apiErrors';

describe('extractApiErrorMessage', () => {
  it('returns fallback when backend returns an HTML debug page', () => {
    const err = {
      response: {
        data: '<!DOCTYPE html><html><body><h1>Error</h1></body></html>',
      },
    };

    expect(extractApiErrorMessage(err, 'Error genérico')).toBe('Error genérico');
  });

  it('returns normalized detail message from object payload', () => {
    const err = {
      response: {
        data: {
          detail: '  Mensaje   con   espacios   ',
        },
      },
    };

    expect(extractApiErrorMessage(err)).toBe('Mensaje con espacios');
  });

  it('strips simple html tags from object messages', () => {
    const err = {
      response: {
        data: {
          message: '<b>Token inválido</b>',
        },
      },
    };

    expect(extractApiErrorMessage(err)).toBe('Token inválido');
  });

  it('reads field-level DRF errors like source_file', () => {
    const err = {
      response: {
        data: {
          source_file: ['El archivo "falsoJava.java" no parece código Java válido.'],
        },
      },
    };

    expect(extractApiErrorMessage(err)).toBe('El archivo "falsoJava.java" no parece código Java válido.');
  });
});
