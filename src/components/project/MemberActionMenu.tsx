
import React from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface ProjectMember {
  id: string;
  user_id: string;
  role: string;
  participant_designation: string | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

interface MemberActionMenuProps {
  member: ProjectMember;
  onDelete?: (member: ProjectMember) => void;
  canDelete?: boolean;
}

const MemberActionMenu = ({ member, onDelete, canDelete = false }: MemberActionMenuProps) => {
  if (!canDelete) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => onDelete?.(member)}
          className="text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Remove from Project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MemberActionMenu;
