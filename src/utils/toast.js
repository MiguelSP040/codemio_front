import { toast as sonnerToast } from 'sonner';
import { renderCodemioToast } from '../components/ui/Toaster/CodemioToastCard';

/* Codemio-styled toast helpers.
   sonner sigue siendo el motor (stacking, enter/exit, swipe-to-dismiss, timers)
   pero la card visible es nuestro componente custom — así controlamos 100% el
   diseño sin que los estilos default de sonner interfieran.
   El render se delega a un factory exportado desde el .jsx para que este
   archivo siga siendo JS puro (Vite 8 no transpila JSX en .js). */

let autoIdCounter = 0;
function nextAutoId() {
  autoIdCounter += 1;
  return `cm-toast-${Date.now()}-${autoIdCounter}`;
}

function emit(type, message, options = {}) {
  const { description, id, duration, ...rest } = options;
  // Pre-generamos el id y lo pasamos como opción — así el handler del close
  // button usa el mismo id que sonner registra internamente. Sin esto, el
  // parámetro del render callback (según versión de sonner) puede ser
  // undefined y toast.dismiss() no cierra la instancia correcta.
  const toastId = id ?? nextAutoId();
  return sonnerToast.custom(
    () =>
      renderCodemioToast({
        type,
        title: message,
        description,
        onDismiss: () => sonnerToast.dismiss(toastId),
      }),
    { id: toastId, duration, ...rest },
  );
}

export const toast = {
  success(message, options = {}) {
    return emit('success', message, options);
  },
  error(message, options = {}) {
    return emit('error', message, options);
  },
  warning(message, options = {}) {
    return emit('warning', message, options);
  },
  info(message, options = {}) {
    return emit('info', message, options);
  },
  message(message, options = {}) {
    return emit('default', message, options);
  },
  dismiss(id) {
    return sonnerToast.dismiss(id);
  },
};

export default toast;
