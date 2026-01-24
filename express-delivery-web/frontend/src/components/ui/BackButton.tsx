'use client';

import { useRouter } from 'next/navigation';
import { Button } from './Button';

interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
}

export function BackButton({ href, label = '返回', className = '' }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      className={className}
    >
      ← {label}
    </Button>
  );
}
