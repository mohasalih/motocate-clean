'use client'
import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
}

export default function Toast({ message, type = 'info', onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'
  return (
    <div className={`toast ${type}`}>
      {icon} {message}
    </div>
  )
}
