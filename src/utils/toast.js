import { toast as sonnerToast } from 'sonner';

/* Codemio-styled toast helpers.
   Thin wrapper over sonner so the rest of the app doesn't import the library
   directly — easier to swap or tweak defaults in one place. */

export const toast = {
  success(message, options = {}) {
    return sonnerToast.success(message, options);
  },
  error(message, options = {}) {
    return sonnerToast.error(message, options);
  },
  warning(message, options = {}) {
    return sonnerToast.warning(message, options);
  },
  info(message, options = {}) {
    return sonnerToast.info(message, options);
  },
  message(message, options = {}) {
    return sonnerToast(message, options);
  },
  dismiss(id) {
    return sonnerToast.dismiss(id);
  },
};

export default toast;
