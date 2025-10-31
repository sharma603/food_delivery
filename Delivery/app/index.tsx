import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '../src/context/AuthContext';

export default function Page() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace('/(app)/(tabs)/dashboard');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Render nothing while deciding
  return <View />;
}
