import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "./dialog"
import { cn } from "@/lib/utils"
import Icon from "@/components/icons/Icon"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  size?: "sm" | "md" | "lg" | "xl" | "full"
  children: React.ReactNode
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-[90vw]",
}

export default function Modal({ isOpen, onClose, title, size = "md", children }: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn("p-0 gap-0", sizeClasses[size])}>
        <DialogHeader className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900">{title}</DialogTitle>
            <DialogClose asChild>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                <Icon name="x" size={18} />
              </button>
            </DialogClose>
          </div>
        </DialogHeader>
        <div className="px-6 py-4 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
