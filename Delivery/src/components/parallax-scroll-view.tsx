import { type PropsWithChildren } from 'react';
import {
  ImageBackground,
  type ImageBackgroundProps,
  Platform,
  ScrollView,
  useColorScheme,
} from 'react-native';

import { ThemedView } from './themed-view';

export interface ParallaxScrollViewProps {
  headerBackgroundColor?: { light: string; dark: string };
  headerImage?: React.ReactElement;
  children?: React.ReactNode;
}

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
}: PropsWithChildren<ParallaxScrollViewProps>) {
  const colorScheme = useColorScheme() ?? 'light';
  const {
    light: backgroundColorLight,
    dark: backgroundColorDark,
  } = headerBackgroundColor ?? {
    light: '#A1CEDC',
    dark: '#1D3D47',
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ flex: Platform.OS === 'ios' ? 1 : 0 }}>
      <ThemedView style={{ flex: 1 }}>
        <ImageBackground
          source={{
            uri: 'https://reactjs.org/logo-og.png',
          }}
          style={{ height: 250 }}
          imageStyle={{
            opacity: 0.3,
          }}>
          <ThemedView
            style={[
              {
                flex: 1,
                justifyContent: 'flex-end',
                padding: 20,
              },
              { backgroundColor: colorScheme === 'light' ? backgroundColorLight : backgroundColorDark },
            ]}>
            {headerImage}
          </ThemedView>
        </ImageBackground>
        <ThemedView style={{ flex: 1, padding: 20 }}>
          {children}
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}
