import React from 'react'
import * as Icons from 'lucide-react'

interface IconProps {
  name: string
  className?: string
  size?: number
}

export default function Icon({ name, className = '', size = 20 }: IconProps) {
  const nameMap: Record<string, string> = {
    'x': 'X',
    'narrow-back': 'ChevronLeft',
    'chevron-left': 'ChevronLeft',
    'chevron-right': 'ChevronRight',
    'refresh': 'RotateCcw',
    'megaphone': 'Mic',
    'alert-circle': 'AlertCircle',
    'pencil': 'Pencil',
    'shield': 'Shield',
    'bell-off': 'BellOff',
    'campaign': 'Target',
    'pause': 'Pause',
    'play': 'Play',
    'list': 'List',
    'search': 'Search',
    'plus': 'Plus',
    'document': 'FileText',
    'clipboard': 'Clipboard',
    'users': 'Users',
    'dashboard': 'LayoutDashboard',
    'calendar': 'Calendar',
    'mail': 'Mail',
    'phone': 'Phone',
    'briefcase': 'Briefcase',
    'settings': 'Settings',
    'link': 'Link',
    'status': 'GitBranch',
    'trash': 'Trash2',
    'edit': 'Pencil',
    'user': 'User',
    'download': 'Download',
    'upload': 'Upload',
  }

  const iconKey = nameMap[name] || name.split(/[-_]/).map((part, i) => 
    i === 0 ? part.charAt(0).toLowerCase() + part.slice(1) : part.charAt(0).toUpperCase() + part.slice(1)
  ).join('')

  const IconComponent = (Icons as any)[iconKey.charAt(0).toUpperCase() + iconKey.slice(1)]

  if (!IconComponent) {
    return null
  }

  return <IconComponent className={className} size={size} />
}