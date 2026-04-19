/**
 * Sonar findings come in English from the backend (see codemio_back
 * analysis/services/pipeline.py — message_es is currently a placeholder
 * that mirrors `message`).
 *
 * Each entry can be:
 *   - a plain Spanish string (for rules with no variable content), or
 *   - a function (rawMessage) => string that extracts variables from the
 *     English message and returns a Spanish string preserving them.
 *
 * When a rule is unknown, we try generic patterns; when those fail too,
 * we return the original message so no information is lost.
 */

function extractQuotedPair(message) {
  const matches = message.match(/"([^"]+)"/g);
  if (!matches || matches.length < 2) return null;
  const clean = (quoted) => quoted.slice(1, -1);
  return [clean(matches[0]), clean(matches[1])];
}

const RULE_TRANSLATIONS = {
  'java:S106': 'Reemplaza el uso de System.out por un logger.',

  'java:S1118': 'Agrega un constructor privado para ocultar el constructor implícito público.',
  'java:S1128': 'Elimina las importaciones no utilizadas.',
  'java:S1130': 'Elimina la declaración "throws" de esta excepción que no se lanza.',
  'java:S1134': 'Completa la tarea asociada con este comentario FIXME.',
  'java:S1135': 'Completa la tarea asociada con este comentario TODO.',

  'java:S1144': (message) => {
    const match = message.match(/"([^"]+)"/);
    if (match) return `Elimina el miembro privado no utilizado "${match[1]}".`;
    return 'Elimina este miembro privado no utilizado.';
  },

  'java:S1155': 'Usa isEmpty() en lugar de comparar size() con cero.',
  'java:S1163': 'Las excepciones no deberían lanzarse desde bloques "finally".',
  'java:S1168': 'Devuelve una colección o un arreglo vacío en lugar de null.',

  'java:S1172': (message) => {
    const match = message.match(/"([^"]+)"/);
    if (match) return `Elimina el parámetro no utilizado "${match[1]}" de este método.`;
    return 'Elimina este parámetro no utilizado del método.';
  },

  'java:S1181': 'No captures "Throwable" ni sus subclases "Error".',
  'java:S1186': 'Este método está vacío: documenta por qué o agrega una implementación.',
  'java:S1192': (message) => {
    const match = message.match(/"([^"]+)"/);
    if (match) return `Define una constante en lugar de duplicar el literal ${match[0]}.`;
    return 'Define una constante en lugar de duplicar este literal de cadena.';
  },

  'java:S1197': 'No uses los corchetes de arreglo "[]" después del nombre del tipo.',
  'java:S1206': 'Las clases que sobrescriben "equals" deben sobrescribir "hashCode".',
  'java:S1210': 'Las clases que implementan "Comparable" deberían sobrescribir "equals".',
  'java:S1226': 'No reasignes parámetros de método ni variables de catch.',
  'java:S1301': 'Usa "if" en lugar de "switch" con menos de tres casos.',

  'java:S1481': (message) => {
    const match = message.match(/"([^"]+)"/);
    if (match) return `Elimina la variable local no utilizada "${match[1]}".`;
    return 'Elimina esta variable local no utilizada.';
  },

  'java:S1488': 'No declares una variable local solo para devolverla inmediatamente.',

  'java:S1598': (message) => {
    const pair = extractQuotedPair(message);
    if (pair) {
      const [path, pkg] = pair;
      return `La ruta del archivo "${path}" no coincide con el nombre del paquete "${pkg}". Mueve el archivo o cambia el nombre del paquete.`;
    }
    return 'La ruta del archivo no coincide con el nombre del paquete. Mueve el archivo o cambia el nombre del paquete.';
  },

  'java:S1602': 'Omite las llaves en lambdas de una sola instrucción.',
  'java:S1604': 'Usa una lambda en lugar de una clase anónima con un único método.',
  'java:S1611': 'Omite los paréntesis en una lambda con un único parámetro.',
  'java:S1643': 'Usa StringBuilder en lugar de concatenación de cadenas en bucles.',
  'java:S1659': 'Declara cada variable en su propia instrucción.',
  'java:S1696': 'No captures "NullPointerException"; previene el null primero.',
  'java:S1698': 'Usa "equals" en lugar de "==" para comparar objetos.',
  'java:S1700': 'El nombre del campo no debería coincidir con el nombre de la clase contenedora.',
  'java:S1854': 'Elimina esta asignación inútil a una variable.',
  'java:S1872': 'Las clases no deben compararse por nombre.',
  'java:S1874': 'Este API está marcado como obsoleto (deprecated).',
  'java:S1905': 'Elimina este casting innecesario.',
  'java:S1945': 'No uses "Iterator.next()" sin llamar primero a "hasNext()".',
  'java:S1948': 'Los campos no transitorios y no serializables deberían marcarse o excluirse.',
  'java:S2053': 'Usa un salt al hashear contraseñas.',
  'java:S2057': 'Declara "serialVersionUID" en clases Serializable.',
  'java:S2095': 'Cierra los recursos con try-with-resources.',
  'java:S2129': 'Usa los métodos estáticos valueOf en lugar de crear nuevas instancias.',
  'java:S2142': 'No ignores la interrupción; relanza InterruptedException o restablece el estado.',
  'java:S2160': 'Las subclases que agregan campos deben sobrescribir "equals".',
  'java:S2189': 'Asegura que el bucle tenga una condición de salida.',
  'java:S2222': 'Libera los locks antes de salir del método.',
  'java:S2225': 'No permitas que "toString()" devuelva null.',
  'java:S2259': 'Valida que el valor no sea null antes de desreferenciarlo.',
  'java:S2272': 'Llama a "hasNext()" antes de "next()" en un Iterator.',
  'java:S2274': 'Llama a "wait()" dentro de un bucle que verifica la condición.',
  'java:S2293': 'Usa el operador diamante "<>" al instanciar tipos genéricos.',
  'java:S2386': 'Los arreglos "public static" no deberían ser mutables.',
  'java:S2440': 'No instancies clases que solo tienen métodos estáticos.',
  'java:S2629': 'Usa logging con parámetros en lugar de concatenar cadenas.',
  'java:S2696': 'No modifiques campos estáticos desde métodos de instancia.',
  'java:S2755': 'Desactiva las entidades externas en los parsers XML.',
  'java:S2864': 'Usa "entrySet()" en lugar de "keySet()" cuando necesitas claves y valores.',
  'java:S2886': 'Sincroniza el acceso concurrente a los campos mutables.',
  'java:S2925': 'No uses "Thread.sleep()" dentro de pruebas unitarias.',
  'java:S2975': 'No sobrescribas "Object.clone()"; usa un constructor copia o una fábrica.',

  'java:S3008': (message) => {
    const match = message.match(/"([^"]+)"/);
    if (match) return `Renombra la constante "${match[1]}" para seguir la convención SCREAMING_SNAKE_CASE.`;
    return 'Renombra esta constante para seguir la convención SCREAMING_SNAKE_CASE.';
  },

  'java:S3011': 'No uses reflexión para cambiar la accesibilidad de miembros.',
  'java:S3518': 'No dividas por cero.',
  'java:S3655': 'Verifica "isPresent()" antes de llamar a "get()" en un Optional.',

  'java:S3776': (message) => {
    const complexityMatch = /(\d+)\s{0,10}(?:\(|allowed|permitido)/i.exec(message);
    const numbers = message.match(/(\d+)/g);
    if (numbers && numbers.length >= 2) {
      return `Reduce la complejidad cognitiva de este método de ${numbers[0]} al máximo permitido de ${numbers[1]}.`;
    }
    if (complexityMatch) {
      return `Reduce la complejidad cognitiva de este método al máximo permitido de ${complexityMatch[1]}.`;
    }
    return 'Reduce la complejidad cognitiva de este método.';
  },

  'java:S3973': 'Agrega llaves a la cláusula "if"/"else" para evitar ambigüedad.',
  'java:S4144': 'Este método duplica el código de otro método.',
  'java:S4165': 'Elimina esta asignación redundante.',
  'java:S4973': 'Usa "equals" en lugar de "==" para comparar cadenas u objetos Boxed.',
  'java:S5785': 'No compares cadenas con "==" o "!=", usa "equals".',
  'java:S6201': 'Simplifica el operador ternario redundante.',
  'java:S6202': 'Simplifica el "instanceof" con pattern matching.',
  'java:S6541': 'Reduce la complejidad ciclomática de este método.',
};

const GENERIC_PATTERNS = [
  {
    pattern: /^\s*Replace this use of System\.out by a logger\.?\s*$/i,
    translate: () => 'Reemplaza el uso de System.out por un logger.',
  },
  {
    pattern: /File path\s+"([^"]+)"\s+should match package name\s+"([^"]+)"/i,
    translate: (_, path, pkg) =>
      `La ruta del archivo "${path}" no coincide con el nombre del paquete "${pkg}". Mueve el archivo o cambia el nombre del paquete.`,
  },
  {
    pattern: /Remove this unused\s+"([^"]+)"\s+(private field|method|variable|import)/i,
    translate: (_, name, kind) => {
      const kindEs = {
        'private field': 'campo privado',
        method: 'método',
        variable: 'variable',
        import: 'importación',
      }[kind.toLowerCase()] || 'elemento';
      return `Elimina el ${kindEs} "${name}" que no se utiliza.`;
    },
  },
  {
    pattern: /Define a constant instead of duplicating this literal\s+("[^"]+")/i,
    translate: (_, literal) => `Define una constante en lugar de duplicar el literal ${literal}.`,
  },
  {
    pattern: /Rename this\s+(variable|constant|field|method|class)\s+"([^"]+)"\s+to match/i,
    translate: (_, kind, name) => {
      const kindEs = {
        variable: 'variable',
        constant: 'constante',
        field: 'campo',
        method: 'método',
        class: 'clase',
      }[kind.toLowerCase()] || 'identificador';
      return `Renombra la ${kindEs} "${name}" para seguir la convención de nomenclatura.`;
    },
  },
  {
    pattern: /^\s*Add a (private )?constructor/i,
    translate: () => 'Agrega un constructor privado para esta clase utilitaria.',
  },
  {
    pattern: /^\s*Use isEmpty\(\) instead of/i,
    translate: () => 'Usa isEmpty() en lugar de comparar el tamaño con cero.',
  },
  {
    pattern: /^\s*Refactor this method to reduce its Cognitive Complexity from (\d+) to (?:the )?(\d+) allowed/i,
    translate: (_, current, max) =>
      `Reduce la complejidad cognitiva de este método de ${current} al máximo permitido de ${max}.`,
  },
  {
    pattern: /^\s*Refactor this method to reduce its Cognitive Complexity/i,
    translate: () => 'Refactoriza este método para reducir la complejidad cognitiva.',
  },
  {
    pattern: /^\s*Refactor this method to reduce its Cyclomatic Complexity/i,
    translate: () => 'Refactoriza este método para reducir la complejidad ciclomática.',
  },
  {
    pattern: /^\s*Use a StringBuilder/i,
    translate: () => 'Usa StringBuilder en lugar de concatenar cadenas.',
  },
  {
    pattern: /^\s*Avoid (nested )?ternary operators?/i,
    translate: () => 'Evita los operadores ternarios anidados.',
  },
  {
    pattern: /^\s*Close this[^"]*"([^"]+)"/i,
    translate: (_, resource) => `Cierra el recurso "${resource}" correctamente (usa try-with-resources).`,
  },
];

export function translateFindingMessage(rule, message) {
  const rawMessage = typeof message === 'string' ? message : '';
  const fallback = rawMessage.trim() ? rawMessage : 'Sin detalle';

  if (rule && Object.hasOwn(RULE_TRANSLATIONS, rule)) {
    const entry = RULE_TRANSLATIONS[rule];
    if (typeof entry === 'function') {
      try {
        return entry(rawMessage) || fallback;
      } catch {
        return fallback;
      }
    }
    return entry;
  }

  for (const { pattern, translate } of GENERIC_PATTERNS) {
    const match = rawMessage.match(pattern);
    if (match) {
      try {
        return translate(...match) || fallback;
      } catch {
        return fallback;
      }
    }
  }

  return fallback;
}

export function hasSpanishTranslation(rule) {
  return Boolean(rule && Object.hasOwn(RULE_TRANSLATIONS, rule));
}
