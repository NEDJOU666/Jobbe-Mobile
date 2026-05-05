import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Text } from 'react-native';

function navigate() {
  router.replace('/(auth)/welcome');
}

export default function SplashScreen() {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);
  const dotOpacity = useSharedValue(0);
  const dotScale = useSharedValue(0);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    transform: [{ scale: dotScale.value }],
  }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    scale.value = withSpring(1, { damping: 14, stiffness: 100 });

    dotOpacity.value = withDelay(600, withTiming(1, { duration: 300 }));
    dotScale.value = withDelay(600, withSpring(1, { damping: 10, stiffness: 120 }));

    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 500 }, (finished) => {
        if (finished) runOnJS(navigate)();
      });
      dotOpacity.value = withTiming(0, { duration: 500 });
    }, 2300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoRow, logoStyle]}>
        <Text style={styles.logo}>JOBFINDER</Text>
        <Animated.View style={[styles.dot, dotStyle]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  logo: {
    fontSize: 38,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 3,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#14A800',
    marginBottom: 7,
    marginLeft: 3,
  },
});
