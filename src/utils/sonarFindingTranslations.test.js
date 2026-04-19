import { describe, expect, it } from 'vitest';
import { hasSpanishTranslation, translateFindingMessage } from './sonarFindingTranslations';

describe('sonarFindingTranslations', () => {
  it('translates a static rule (java:S106) to Spanish', () => {
    expect(translateFindingMessage('java:S106', 'Replace this use of System.out by a logger.')).toBe(
      'Reemplaza el uso de System.out por un logger.',
    );
  });

  it('java:S1598 preserves the actual file path and package name in the Spanish message', () => {
    expect(
      translateFindingMessage(
        'java:S1598',
        String.raw`File path "\Users\Daniela\AppData\Local\Temp\codemio-analysis-2-_dht4z6n\source" should match package name "com.codemio.sample". Move the file or change the package name.`,
      ),
    ).toBe(
      String.raw`La ruta del archivo "\Users\Daniela\AppData\Local\Temp\codemio-analysis-2-_dht4z6n\source" no coincide con el nombre del paquete "com.codemio.sample". Mueve el archivo o cambia el nombre del paquete.`,
    );
  });

  it('java:S1598 falls back to a generic Spanish message when the original lacks both quoted segments', () => {
    expect(
      translateFindingMessage('java:S1598', 'File path should match package name.'),
    ).toBe(
      'La ruta del archivo no coincide con el nombre del paquete. Mueve el archivo o cambia el nombre del paquete.',
    );
  });

  it('java:S1481 embeds the actual variable name into the Spanish message', () => {
    expect(translateFindingMessage('java:S1481', 'Remove this unused "unusedCounter" local variable.')).toBe(
      'Elimina la variable local no utilizada "unusedCounter".',
    );
  });

  it('java:S1172 embeds the actual parameter name into the Spanish message', () => {
    expect(
      translateFindingMessage('java:S1172', 'Remove this unused method parameter "extraValue".'),
    ).toBe('Elimina el parámetro no utilizado "extraValue" de este método.');
  });

  it('java:S1192 embeds the duplicated literal in the Spanish message', () => {
    expect(
      translateFindingMessage(
        'java:S1192',
        'Define a constant instead of duplicating this literal "MY_CONSTANT" 3 times.',
      ),
    ).toBe('Define una constante en lugar de duplicar el literal "MY_CONSTANT".');
  });

  it('java:S3776 embeds current and allowed complexity values', () => {
    expect(
      translateFindingMessage(
        'java:S3776',
        'Refactor this method to reduce its Cognitive Complexity from 25 to the 15 allowed.',
      ),
    ).toBe('Reduce la complejidad cognitiva de este método de 25 al máximo permitido de 15.');
  });

  it('falls back to a generic pattern when the rule is unknown but the phrasing matches', () => {
    expect(
      translateFindingMessage(
        'java:SX9999',
        'File path "/foo/bar" should match package name "com.example".',
      ),
    ).toBe(
      'La ruta del archivo "/foo/bar" no coincide con el nombre del paquete "com.example". Mueve el archivo o cambia el nombre del paquete.',
    );
  });

  it('preserves the original English message when nothing matches', () => {
    expect(translateFindingMessage('java:SX9999', 'Totally unknown message.')).toBe(
      'Totally unknown message.',
    );
  });

  it('returns "Sin detalle" when no message is provided and the rule is unknown', () => {
    expect(translateFindingMessage('java:SX9999', '')).toBe('Sin detalle');
    expect(translateFindingMessage(null, null)).toBe('Sin detalle');
    expect(translateFindingMessage('', '   ')).toBe('Sin detalle');
  });

  it('hasSpanishTranslation reports known and unknown rules', () => {
    expect(hasSpanishTranslation('java:S106')).toBe(true);
    expect(hasSpanishTranslation('java:S1598')).toBe(true);
    expect(hasSpanishTranslation('java:SX9999')).toBe(false);
    expect(hasSpanishTranslation('')).toBe(false);
    expect(hasSpanishTranslation(null)).toBe(false);
  });
});
