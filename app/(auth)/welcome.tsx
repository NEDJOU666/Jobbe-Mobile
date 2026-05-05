import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

const { height, width } = Dimensions.get('window');

const videoSource = require('../../assets/videos/mobile-landing.mp4');

export default function WelcomeScreen() {
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Animation values
  const logoOpacity = useSharedValue(0);
  const logoY = useSharedValue(20);
  const taglineOpacity = useSharedValue(0);
  const headlineOpacity = useSharedValue(0);
  const headlineY = useSharedValue(24);
  const subtitleOpacity = useSharedValue(0);
  const btn1Opacity = useSharedValue(0);
  const btn1Y = useSharedValue(16);
  const btn2Opacity = useSharedValue(0);
  const btn2Y = useSharedValue(16);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoY.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));
  const headlineStyle = useAnimatedStyle(() => ({
    opacity: headlineOpacity.value,
    transform: [{ translateY: headlineY.value }],
  }));
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value }));
  const btn1Style = useAnimatedStyle(() => ({
    opacity: btn1Opacity.value,
    transform: [{ translateY: btn1Y.value }],
  }));
  const btn2Style = useAnimatedStyle(() => ({
    opacity: btn2Opacity.value,
    transform: [{ translateY: btn2Y.value }],
  }));

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);

    logoOpacity.value = withDelay(300, withTiming(1, { duration: 700 }));
    logoY.value = withDelay(300, withTiming(0, { duration: 700, easing: ease }));

    taglineOpacity.value = withDelay(700, withTiming(1, { duration: 600 }));

    headlineOpacity.value = withDelay(900, withTiming(1, { duration: 600 }));
    headlineY.value = withDelay(900, withTiming(0, { duration: 600, easing: ease }));

    subtitleOpacity.value = withDelay(1100, withTiming(1, { duration: 500 }));

    btn1Opacity.value = withDelay(1300, withTiming(1, { duration: 400 }));
    btn1Y.value = withDelay(1300, withSpring(0, { damping: 14 }));

    btn2Opacity.value = withDelay(1450, withTiming(1, { duration: 400 }));
    btn2Y.value = withDelay(1450, withSpring(0, { damping: 14 }));
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* ── Full-screen video ── */}
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />

      {/* ── Cinematic dark overlay ── */}
      <View style={[StyleSheet.absoluteFill, styles.darkOverlay]} />

      {/* ── Bottom gradient fade ── */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.88)', '#000']}
        locations={[0, 0.38, 0.65, 1]}
        style={styles.bottomGradient}
      />

      {/* ── Logo (centered on video) ── */}
      <View style={styles.logoWrapper}>
        <Animated.View style={[styles.logoInner, logoStyle]}>
          <View style={styles.logoRow}>
            <Text style={styles.logoText}>JOBFINDER</Text>
            <View style={styles.logoDot} />
          </View>
        </Animated.View>
        <Animated.Text style={[styles.logoTagline, taglineStyle]}>
          YOUR CAREER, YOUR TERMS
        </Animated.Text>
      </View>

      {/* ── Bottom content ── */}
      <View style={styles.bottomContent}>
        <Animated.Text style={[styles.headline, headlineStyle]}>
          One app,{'\n'}all your opportunities.
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, subtitleStyle]}>
          Choose an option to get started. You can add{'\n'}another account at any time.
        </Animated.Text>

        <View style={styles.btnRow}>
          <Animated.View style={[{ flex: 1 }, btn1Style]}>
            <TouchableOpacity
              style={[styles.btn, styles.btnSignUp]}
              onPress={() => router.push('/(auth)/sign-up')}
              activeOpacity={0.85}
            >
              <Text style={styles.btnSignUpText}>Sign Up</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[{ flex: 1 }, btn2Style]}>
            <TouchableOpacity
              style={[styles.btn, styles.btnLogin]}
              onPress={() => router.push('/(auth)/sign-in')}
              activeOpacity={0.85}
            >
              <Text style={styles.btnLoginText}>Log In</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Animated.View style={[styles.trustRow, subtitleStyle]}>
          <Ionicons name="shield-checkmark-outline" size={13} color="rgba(255,255,255,0.4)" />
          <Text style={styles.trustText}>Trusted by 2K+ Enterprise & clients worldwide</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  darkOverlay: {
    backgroundColor: 'rgba(0,0,0,0.18)',
  },

  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.68,
  },

  // ── Logo ──
  logoWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: height * 0.44,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 12,
  },
  logoInner: {
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  logoText: {
    fontSize: 44,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 3,
  },
  logoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#14A800',
    marginBottom: 9,
    marginLeft: 3,
  },
  logoTagline: {
    marginTop: 8,
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2.5,
    fontWeight: '600',
  },

  // ── Bottom content ──
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 26,
    paddingBottom: 44,
  },
  headline: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 38,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 20,
    marginBottom: 26,
  },

  // ── Buttons ──
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  btn: {
    height: 54,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSignUp: {
    backgroundColor: '#14A800',
  },
  btnSignUpText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  btnLogin: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  btnLoginText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Trust badge ──
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  trustText: {
    color: 'rgba(255,255,255,0.38)',
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
