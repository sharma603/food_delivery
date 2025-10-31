import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps } from 'react';

export type IconSymbolProps = Omit<ComponentProps<typeof Ionicons>, 'name'> & {
  name: string;
};

export function IconSymbol({ name, ...props }: IconSymbolProps) {
  return <Ionicons name={name as any} {...props} />;
}
