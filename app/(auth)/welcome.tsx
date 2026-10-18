import { StyleSheet, View, Text, TouchableOpacity, Dimensions, AppState } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEvent } from 'expo';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
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
import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogoReveal } from '@/components/LogoReveal';
import { useT } from '@/hooks/useT';

const { height, width } = Dimensions.get('window');

const videoSource = require('../../assets/videos/mobile-landing.mp4');

export default function WelcomeScreen() {
  const { t } = useT();
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  const appStateRef = useRef(AppState.currentState);
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  useEffect(() => {
    activateKeepAwakeAsync('video-bg').catch(() => {});
    return () => { deactivateKeepAwake('video-bg'); };
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      const t = setTimeout(() => { player.play(); }, 200);
      return () => clearTimeout(t);
    }
  }, [isPlaying]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        player.play();
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, []);

  // Animation values
  const headlineOpacity = useSharedValue(0);
  const headlineY = useSharedValue(24);
  const subtitleOpacity = useSharedValue(0);
  const btn1Opacity = useSharedValue(0);
  const btn1Y = useSharedValue(16);
  const btn2Opacity = useSharedValue(0);
  const btn2Y = useSharedValue(16);

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
        <LogoReveal />
      </View>

      {/* ── Bottom content ── */}
      <View style={styles.bottomContent}>
        <Animated.Text style={[styles.headline, headlineStyle]}>
          {t.welcome.headline}
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, subtitleStyle]}>
          {t.welcome.subtitle}
        </Animated.Text>

        <View style={styles.btnRow}>
          <Animated.View style={[{ flex: 1 }, btn1Style]}>
            <TouchableOpacity
              style={[styles.btn, styles.btnSignUp]}
              onPress={() => router.push('/(auth)/sign-up')}
              activeOpacity={0.85}
            >
              <Text style={styles.btnSignUpText}>{t.welcome.signUp}</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[{ flex: 1 }, btn2Style]}>
            <TouchableOpacity
              style={[styles.btn, styles.btnLogin]}
              onPress={() => router.push('/(auth)/sign-in')}
              activeOpacity={0.85}
            >
              <Text style={styles.btnLoginText}>{t.welcome.logIn}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Animated.View style={[styles.trustRow, subtitleStyle]}>
          <Ionicons name="shield-checkmark-outline" size={13} color="rgba(255,255,255,0.4)" />
          <Text style={styles.trustText}>{t.welcome.trust}</Text>
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
