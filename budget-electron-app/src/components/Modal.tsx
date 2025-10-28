import React from "react";

interface ModalProps {
  title?: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const Modal: React.FC<ModalProps> = ({
  title = "Notice",
  message,
  onClose,
  onConfirm,
  confirmText = "OK",
  cancelText = "Cancel"
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
      <div className="bg-dark-card text-white rounded-2xl shadow-lg max-w-sm w-full p-6 border border-accent animate-glow">
        {title && <h2 className="text-xl font-semibold mb-3 text-accent">{title}</h2>}
        <p className="text-gray-200 mb-6">{message}</p>

        <div className="flex justify-end gap-3">
          {onConfirm ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md bg-dark-input hover:bg-gray-800 transition"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-4 py-2 rounded-md bg-accent text-black font-semibold hover:opacity-80 transition"
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-accent text-black font-semibold hover:opacity-80 transition"
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
