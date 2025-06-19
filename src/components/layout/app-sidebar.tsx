'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { SignOutButton } from '@clerk/nextjs';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';

import {
  IconBell,
  IconChevronRight,
  IconChevronsDown,
  IconCreditCard,
  IconLogout,
  IconUserCircle
} from '@tabler/icons-react';

import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { Icons } from '../icons';
import { OrgSwitcher } from '../org-switcher';

type NavItem = {
  title: string;
  url: string;
  icon: keyof typeof Icons;
  shortcut?: string[];
  isActive?: boolean;
  items: NavItem[];
};

export default function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const router = useRouter();

  const [clients, setClients] = React.useState<{ id: number; name: string }[]>(
    []
  );
  const [activeClient, setActiveClient] = React.useState<{
    id: number;
    name: string;
  } | null>(null);

  // Dynamically generate navItems based on active client
  const navItems: NavItem[] = React.useMemo(() => {
    if (!activeClient) return [];

    const base = `/dashboard/${activeClient.id}`;

    return [
      {
        title: 'Dashboard',
        url: `${base}/overview`,
        icon: 'dashboard',
        items: []
      },
      {
        title: 'Urls',
        url: `${base}/urls`,
        icon: 'link',
        items: []
      },
      {
        title: 'Audits',
        url: `${base}/audits`,
        icon: 'devicesCheck',
        items: []
      },
      {
        title: 'Kanban',
        url: `${base}/kanban`,
        icon: 'kanban',
        items: []
      }
    ];
  }, [activeClient]);

  // Fetch clients on mount
  React.useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await fetch('/api/client');
        const data = await res.json();
        setClients(data);
        setActiveClient(data[0]); // Default to first client
      } catch (err) {
        //console.error('Failed to load clients:', err);
      }
    };
    loadClients();
  }, []);

  const handleClientSwitch = (clientId: string | number) => {
    const client = clients.find((c) => c.id === Number(clientId));
    if (client) {
      setActiveClient(client);
      router.push(`/dashboard/${client.id}/overview`);
    }
  };

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        {activeClient && (
          <OrgSwitcher
            clients={clients}
            defaultClient={activeClient}
            onClientSwitch={handleClientSwitch}
          />
        )}
      </SidebarHeader>

      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = Icons[item.icon] ?? Icons.logo;
              const isActive = pathname === item.url;

              return item.items.length > 0 ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className='group/collapsible'
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isActive}
                      >
                        <Icon />
                        <span>{item.title}</span>
                        <IconChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                            >
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive}
                  >
                    <Link href={item.url}>
                      <Icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  {user && (
                    <UserAvatarProfile
                      className='h-8 w-8 rounded-lg'
                      showInfo
                      user={user}
                    />
                  )}
                  <IconChevronsDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='px-1 py-1.5'>
                    {user && (
                      <UserAvatarProfile
                        className='h-8 w-8 rounded-lg'
                        showInfo
                        user={user}
                      />
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push('/dashboard/profile')}
                  >
                    <IconUserCircle className='mr-2 h-4 w-4' />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconCreditCard className='mr-2 h-4 w-4' />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconBell className='mr-2 h-4 w-4' />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <IconLogout className='mr-2 h-4 w-4' />
                  <SignOutButton redirectUrl='/auth/sign-in' />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
