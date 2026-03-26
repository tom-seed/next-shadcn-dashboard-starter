interface HeadingProps {
  title: string;
  description: string;
  /** 'page' (default) renders an h2 at full size. 'section' renders a smaller h3 for mid-page sections. */
  size?: 'page' | 'section';
}

export const Heading: React.FC<HeadingProps> = ({
  title,
  description,
  size = 'page'
}) => {
  if (size === 'section') {
    return (
      <div>
        <h3 className='text-lg font-semibold'>{title}</h3>
        <p className='text-muted-foreground mt-1 text-sm'>{description}</p>
      </div>
    );
  }
  return (
    <div className='mb-4'>
      <h2 className='pb-4 text-3xl font-bold'>{title}</h2>
      <p className='text-muted-foreground text-sm'>{description}</p>
    </div>
  );
};
