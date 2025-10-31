import { useColorScheme } from 'react-native';

type Theme = {
  light: string;
  dark: string;
};

type ThemeProperty = 'background' | 'text' | 'tint' | 'tabIconDefault' | 'tabIconSelected';

const Colors: Record<ThemeProperty, Theme> = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#0a7ea4',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
  },
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
