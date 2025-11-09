import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
  {
    variants: {
      variant: {
        primary: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        success: 'bg-green-500/10 text-green-400 border-green-500/20',
        warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        danger: 'bg-red-500/10 text-red-400 border-red-500/20',
        info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        secondary: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={clsx(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
