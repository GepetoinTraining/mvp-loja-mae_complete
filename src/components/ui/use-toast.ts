import {
  toast as sonnerToast,
  type ToastOptions,
  type ToasterToast,
} from "sonner";

export const useToast = () => {
  const toast = (
    message: string,
    options?: ToastOptions
  ): ToasterToast => {
    return sonnerToast(message, options);
  };

  return { toast };
};
