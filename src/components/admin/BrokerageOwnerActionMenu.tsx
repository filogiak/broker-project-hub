
import React from 'react';
import { MoreHorizontal, UserCog, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { BrokerageOwnerInfo } from '@/services/adminService';

interface BrokerageOwnerActionMenuProps {
  owner: BrokerageOwnerInfo;
  onEdit?: (owner: BrokerageOwnerInfo) => void;
  onDelete?: (owner: BrokerageOwnerInfo) => void;
}

const BrokerageOwnerActionMenu = ({ owner, onEdit, onDelete }: BrokerageOwnerActionMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit?.(owner)}>
          <UserCog className="mr-2 h-4 w-4" />
          Edit Details
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onDelete?.(owner)}
          className="text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default BrokerageOwnerActionMenu;
