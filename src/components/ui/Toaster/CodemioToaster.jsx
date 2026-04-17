import { Toaster } from 'sonner';
import './toast.css';

export default function CodemioToaster() {
  return (
    <Toaster
      className="codemio-toaster"
      position="top-right"
      expand
      duration={4200}
      gap={12}
      visibleToasts={4}
      offset={24}
    />
  );
}
