import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './CodeInput.css';

/**
 * CodeInput — input de código de verificación de N dígitos.
 *
 * Props:
 *  - length       (number)  cantidad de casillas (por defecto 6)
 *  - value        (string)  valor controlado opcional (dígitos concatenados)
 *  - onChange     (fn)      se dispara con el código completo concatenado en cada cambio
 *  - onComplete   (fn)      se dispara cuando todos los dígitos están llenos
 *  - error        (boolean) resalta todas las casillas en rojo
 *  - disabled     (boolean) deshabilita la entrada
 *  - autoFocus    (boolean) autofoco en el primer input al montar
 *  - ariaLabel    (string)  etiqueta del grupo (default: "Código de verificación")
 *
 * UX:
 *  - Solo dígitos 0-9 (filtra no numéricos).
 *  - Auto-avance al siguiente input al escribir.
 *  - Retroceso: Backspace en casilla vacía mueve al anterior y limpia.
 *  - Flechas izquierda/derecha navegan entre casillas.
 *  - Pegado: reparte los dígitos entre casillas.
 *  - Accesible: aria-label individual por casilla ("Dígito X de N").
 */
export default function CodeInput({
  length = 6,
  value,
  onChange,
  onComplete,
  error = false,
  disabled = false,
  autoFocus = true,
  ariaLabel = 'Código de verificación',
}) {
  const [digits, setDigits] = useState(() => Array.from({ length }, () => ''));
  const inputsRef = useRef([]);

  // Sincroniza con value externo (modo controlado opcional)
  useEffect(() => {
    if (typeof value === 'string') {
      const chars = value.slice(0, length).split('');
      setDigits(Array.from({ length }, (_, i) => chars[i] ?? ''));
    }
  }, [value, length]);

  // Autofoco inicial
  useEffect(() => {
    if (autoFocus && inputsRef.current[0] && !disabled) {
      inputsRef.current[0].focus();
    }
    // Solo en montaje
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function emitChange(next) {
    const code = next.join('');
    if (onChange) onChange(code);
    if (onComplete && code.length === length && next.every((d) => d !== '')) {
      onComplete(code);
    }
  }

  function focusIndex(index) {
    const el = inputsRef.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  }

  function handleChange(index, raw) {
    // Filtra no dígitos; toma último dígito si el usuario escribió varios
    const onlyDigits = raw.replaceAll(/\D/g, '');
    if (!onlyDigits) return;

    // Si pegó varios caracteres, reparte desde este índice
    const chars = onlyDigits.split('');
    const next = [...digits];

    for (let i = 0; i < chars.length && index + i < length; i++) {
      next[index + i] = chars[i];
    }

    setDigits(next);
    emitChange(next);

    const nextIndex = Math.min(index + chars.length, length - 1);
    focusIndex(nextIndex);
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...digits];

      if (next[index]) {
        // Limpia casilla actual
        next[index] = '';
      } else if (index > 0) {
        // Retrocede a la anterior y la limpia
        next[index - 1] = '';
        focusIndex(index - 1);
      }

      setDigits(next);
      emitChange(next);
      return;
    }

    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusIndex(index - 1);
      return;
    }

    if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      focusIndex(index + 1);
      return;
    }

    // Permitir solo dígitos, teclas de navegación y edición
    const allowed = ['Tab', 'Enter', 'Home', 'End', 'Delete'];
    if (!/^\d$/.test(e.key) && !allowed.includes(e.key) && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
    }
  }

  function handlePaste(index, e) {
    const text = e.clipboardData.getData('text');
    const onlyDigits = text.replaceAll(/\D/g, '');
    if (!onlyDigits) return;

    e.preventDefault();
    const next = [...digits];
    const chars = onlyDigits.slice(0, length - index).split('');

    for (let i = 0; i < chars.length; i++) {
      next[index + i] = chars[i];
    }

    setDigits(next);
    emitChange(next);

    const nextIndex = Math.min(index + chars.length, length - 1);
    focusIndex(nextIndex);
  }

  function handleFocus(index) {
    // Selecciona el contenido para fácil reemplazo
    const el = inputsRef.current[index];
    if (el) el.select();
  }

  return (
    <div
      className={`code-input${error ? ' code-input--error' : ''}`}
      role="group"
      aria-label={ariaLabel}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Dígito ${index + 1} de ${length}`}
          aria-invalid={error || undefined}
          className={`code-input__box${digit ? ' code-input__box--filled' : ''}`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePaste(index, e)}
          onFocus={() => handleFocus(index)}
        />
      ))}
    </div>
  );
}

CodeInput.propTypes = {
  length: PropTypes.number,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onComplete: PropTypes.func,
  error: PropTypes.bool,
  disabled: PropTypes.bool,
  autoFocus: PropTypes.bool,
  ariaLabel: PropTypes.string,
};
