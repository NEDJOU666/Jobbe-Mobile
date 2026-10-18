import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useT } from '@/hooks/useT';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';

interface Props {
  onEnd?: () => void;
}

export function LogoReveal({ onEnd }: Props) {
  const { t } = useT();
  const jobX     = useSharedValue(-300);
  const finderX  = useSharedValue(300);
  const dotScale = useSharedValue(0);
  const tagOpacity = useSharedValue(0);

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);

    // "JOB" slides in from the left, "FINDER" from the right — they converge
    jobX.value    = withTiming(0, { duration: 620, easing: ease });
    finderX.value = withDelay(40, withTiming(0, { duration: 620, easing: ease }));

    // Dot pops in once the text lands
    dotScale.value = withDelay(580, withSpring(1, { damping: 6, stiffness: 160 }));

    // Tagline fades in
    tagOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));

    if (onEnd) {
      const id = setTimeout(onEnd, 1400);
      return () => clearTimeout(id);
    }
  }, []);

  const jobStyle    = useAnimatedStyle(() => ({ transform: [{ translateX: jobX.value }] }));
  const finderStyle = useAnimatedStyle(() => ({ transform: [{ translateX: finderX.value }] }));
  const dotStyle    = useAnimatedStyle(() => ({ transform: [{ scale: dotScale.value }] }));
  const tagStyle    = useAnimatedStyle(() => ({ opacity: tagOpacity.value }));

  return (
    <View style={styles.wrapper}>
      {/* overflow:hidden clips both halves as they slide in from outside */}
      <View style={styles.clip}>
        <View style={styles.row}>
          <Animated.Text style={[styles.logo, jobStyle]}>JOB</Animated.Text>
          <Animated.Text style={[styles.logo, finderStyle]}>FINDER</Animated.Text>
          <Animated.View style={[styles.dot, dotStyle]} />
        </View>
      </View>

      <Animated.Text style={[styles.tagline, tagStyle]}>
        {t.logoReveal.tagline}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },

  clip: { overflow: 'hidden' },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  logo: {
    fontSize: 44,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 3,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#14A800',
    marginBottom: 9,
    marginLeft: 3,
  },

  tagline: {
    marginTop: 8,
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2.5,
    fontWeight: '600',
  },
});
