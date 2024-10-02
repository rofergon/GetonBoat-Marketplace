import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { useTheme } from 'next-themes';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  onOpenChange?: (open: boolean) => void;  // Añadimos esta línea
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onClose, onOpenChange, children }) => {
  const { theme } = useTheme();

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        onOpenChange && onOpenChange(false);  // Añadimos esta línea
      }
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose, onOpenChange]);

  if (!open) return null;

  const handleDialogClose = () => {
    onClose();
    onOpenChange && onOpenChange(false);  // Añadimos esta línea
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleDialogClose}
    >
      <div
        className={`rounded-lg shadow-lg max-w-lg w-full ${
          theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

interface DialogHeaderProps {
  children: React.ReactNode;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({ children }) => {
  const { theme } = useTheme();
  return <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>{children}</div>;
};

interface DialogTitleProps {
  children: React.ReactNode;
}

export const DialogTitle: React.FC<DialogTitleProps> = ({ children }) => {
  return <h2 className="text-xl font-semibold">{children}</h2>;
};

interface DialogDescriptionProps {
  children: React.ReactNode;
}

export const DialogDescription: React.FC<DialogDescriptionProps> = ({ children }) => {
  return <div className="px-6 py-4">{children}</div>;
};

interface DialogContentProps {
  children: React.ReactNode;
}

export const DialogContent: React.FC<DialogContentProps> = ({ children }) => {
  return <div className="px-6 py-4">{children}</div>;
};