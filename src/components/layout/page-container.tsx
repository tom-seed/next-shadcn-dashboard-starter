import React from 'react';

export default function PageContainer({
  children,
  scrollable = true
}: {
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  return (
    <>
      {scrollable ? (
        <div className='h-[calc(100dvh-52px)] overflow-x-hidden overflow-y-auto'>
          <div className='flex flex-col p-4 md:px-6'>{children}</div>
        </div>
      ) : (
        <div className='flex flex-col overflow-x-hidden p-4 md:px-6'>
          {children}
        </div>
      )}
    </>
  );
}
