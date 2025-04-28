// Adapted from shadcn/ui toast component
import { useToast as useToastOriginal } from "@/components/ui/use-toast.tsx"

export { ToastProvider, ToastViewport } from "@/components/ui/toast"
export { Toast, ToastClose, ToastDescription, ToastTitle } from "@/components/ui/toast"

export const useToast = useToastOriginal
