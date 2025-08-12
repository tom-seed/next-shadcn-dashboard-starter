interface HeadingProps {
  title: string;
  description: string;
}

export const Heading: React.FC<HeadingProps> = ({ title, description }) => {
  return (
    <div className='mb-4'>
      <h2 className='pb-4 text-3xl font-bold'>{title}</h2>
      <p className='text-muted-foreground text-sm'>{description}</p>
    </div>
  );
};
