import React, { useEffect } from "react";
import ReactDOM from "react-dom";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open, onClose, children }) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-lg w-full"
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
  return <div className="px-6 py-4 border-b">{children}</div>;
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