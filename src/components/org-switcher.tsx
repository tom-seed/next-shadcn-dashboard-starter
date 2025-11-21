'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, GalleryVerticalEnd } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';

interface Client {
  id: string | number;
  name: string;
}

export function OrgSwitcher({
  clients,
  defaultClient,
  onClientSwitch
}: {
  clients: Client[];
  defaultClient: Client;
  onClientSwitch?: (clientId: string | number) => void;
}) {
  const [selectedClient, setSelectedClient] =
    React.useState<Client>(defaultClient);

  React.useEffect(() => {
    setSelectedClient(defaultClient);
  }, [defaultClient]);

  const handleClientSwitch = (client: Client) => {
    setSelectedClient(client);
    onClientSwitch?.(client.id);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <div className='bg-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                <GalleryVerticalEnd className='size-4' />
              </div>
              <div className='flex flex-col gap-0.5 leading-none'>
                <span className='mb-1 font-semibold'>Atlas SEO</span>
                <span>{selectedClient.name}</span>
              </div>
              <ChevronsUpDown className='ml-auto' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-[--radix-dropdown-menu-trigger-width]'
            align='start'
          >
            {clients.map((client) => (
              <DropdownMenuItem
                key={client.id}
                onSelect={() => handleClientSwitch(client)}
              >
                {client.name}
                {client.id === selectedClient.id && (
                  <Check className='ml-auto' />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
