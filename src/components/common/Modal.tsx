import React from "react";
import { Button } from "@/components/ui/button";

interface ModalProps {
  isOpen: boolean;
  message: string;
  buttonText?: string;
  onClose: () => void;
  onConfirm?: () => void;
  variant?: "primary" | "destructive" | "outline";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  message,
  buttonText = "Close",
  onClose,
  onConfirm,
  variant = "primary"
}) => {
  if (!isOpen) return null;

  const handleClick = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-96 text-center shadow-lg m-10">
        <p className="mb-4">{message}</p>
        <div className="flex justify-center">
          <Button
            variant={variant}
            onClick={handleClick}
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
};
