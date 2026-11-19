// components/ui/actionButtons.component.tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button.component';
import { MoreVertical } from 'lucide-react';
import Link from 'next/link';

export interface ActionButton {
  label: string;
  onClick?: () => void;
  href?: {
    pathname: string;
    query?: Record<string, string | number | boolean>;
  };
}

interface ActionButtonsProps {
  actions: ActionButton[];
}

export const ActionButtons = ({ actions }: ActionButtonsProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="h-8 w-8 p-0">
        <span className="sr-only">Abrir menú</span>
        <MoreVertical className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {actions.map((action, index) => (
        <DropdownMenuItem key={index}>
          {action.href ? (
            <Link href={action.href} className="w-full">
              {action.label}
            </Link>
          ) : (
            <button onClick={action.onClick} className="w-full text-left">
              {action.label}
            </button>
          )}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

export default ActionButtons;
