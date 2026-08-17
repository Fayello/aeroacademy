import reactHotToast from "react-hot-toast";

type RenderFn = (t: import("react-hot-toast").Toast) => React.ReactNode;

const safeToast = {
  error: (message: string, options?: Partial<import("react-hot-toast").Toast>) =>
    reactHotToast.error(message, options),
  success: (message: string, options?: Partial<import("react-hot-toast").Toast>) =>
    reactHotToast.success(message, options),
  loading: (message: string, options?: Partial<import("react-hot-toast").Toast>) =>
    reactHotToast.loading(message, options),
  custom: (fn: RenderFn, options?: Partial<import("react-hot-toast").Toast>) =>
    reactHotToast.custom(fn as Parameters<typeof reactHotToast.custom>[0], options),
  dismiss: (id?: string) => reactHotToast.dismiss(id),
  remove: (id?: string) => reactHotToast.remove(id),
  promise: <T,>(
    promise: Promise<T>,
    msgs: { loading: string; success?: string | ((val: T) => string); error?: string | ((err: unknown) => string) },
    options?: Partial<import("react-hot-toast").Toast>
  ) => reactHotToast.promise(promise, msgs, options),
};

export default safeToast;
