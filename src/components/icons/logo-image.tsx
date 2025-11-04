import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';

export const LogoImage = ({ className }: { className?: string }) => {
  const logo = PlaceHolderImages.find(img => img.id === 'app-logo');

  if (!logo) {
    return null; // Or return a fallback
  }

  return (
    <Image
      src={logo.imageUrl}
      alt="Manutenção Pague Menos Logo"
      width={40}
      height={40}
      className={cn(className)}
      data-ai-hint={logo.imageHint}
      priority
    />
  );
};
