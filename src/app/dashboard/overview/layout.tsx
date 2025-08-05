import PageContainer from '@/components/layout/page-container';
import { Card } from '@/components/ui/card';
import { IconChevronRight } from '@tabler/icons-react';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

export default async function OverViewLayout() {
  const clients = await prisma.client.findMany();

  return (
    <PageContainer>
      <div className='flex flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>Clients</h2>
          <Link href='/new-client' className='text-primary text-sm font-medium'>
            Add New Client
          </Link>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/dashboard/${client.id}/overview`}
              className='block'
            >
              <Card className='flex flex-col p-4 transition-shadow hover:shadow-md'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold'>{client.name}</h3>
                  <IconChevronRight className='text-muted-foreground h-5 w-5' />
                </div>
                <div className='mt-2 flex flex-col space-y-2'></div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
