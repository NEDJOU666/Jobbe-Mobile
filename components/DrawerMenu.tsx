import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/hooks/useT';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.78;

interface Props { visible: boolean; onClose: () => void }

export function DrawerMenu({ visible, onClose }: Props) {
  const { user, logout } = useAuth();
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { t } = useT();
  const insets = useSafeAreaInsets();

  const MENU_ITEMS: Array<{ icon: string; label: string; route: string }> = [
    { icon: 'person-outline',          label: t.drawerMenu.profileLabel,      route: '/profile' },
    { icon: 'stats-chart-outline',     label: t.drawerMenu.myStatsLabel,      route: '/stats' },
    { icon: 'document-attach-outline', label: t.drawerMenu.documentsLabel,    route: '/documents' },
    { icon: 'wallet-outline',          label: t.drawerMenu.creditsLabel,      route: '/credits' },
    { icon: 'settings-outline',        label: t.drawerMenu.settingsLabel,     route: '/settings' },
    { icon: 'help-circle-outline',     label: t.drawerMenu.helpSupportLabel,  route: '/help' },
  ];
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateX, { toValue: 0, damping: 22, stiffness: 200, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, { toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleLogout = async () => {
    onClose();
    await logout();
    router.replace('/(auth)/welcome');
  };

  const initial = user?.name?.charAt(0).toUpperCase() ?? '?';
  const avatarUri = (user as any)?.profile_image ?? (user as any)?.avatar ?? null;

  return (
    <>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} pointerEvents={visible ? 'auto' : 'none'}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.drawer, { transform: [{ translateX }], paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        {/* User header */}
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            {avatarUri
              ? <Image source={{ uri: avatarUri }} style={StyleSheet.absoluteFill} />
              : <Text style={styles.avatarText}>{initial}</Text>}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name ?? t.drawerMenu.defaultUserName}</Text>
            <Text style={styles.userRole}>{t.drawerMenu.jobSeekerRole}</Text>
          </View>
          {user?.isEmailVerified && <Ionicons name="checkmark-circle" size={20} color={c.accent} />}
        </View>

        <View style={styles.divider} />

        {/* Menu items */}
        <View style={styles.menu}>
          {MENU_ITEMS.map(({ icon, label, route }) => (
            <TouchableOpacity key={label} style={styles.menuItem} activeOpacity={0.7} onPress={() => { onClose(); router.push(route as any); }}>
              <Ionicons name={icon as any} size={20} color={c.icon} />
              <Text style={styles.menuLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color="#E53935" />
          <Text style={[styles.menuLabel, { color: '#E53935' }]}>{t.drawerMenu.logOutLabel}</Text>
        </TouchableOpacity>

        <Text style={styles.version}>{t.drawerMenu.versionPrefix}1.0.0</Text>
      </Animated.View>
    </>
  );
}

function makeStyles(c: ReturnType<typeof import('@/hooks/useTheme').useTheme>['colors']) {
  return StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10 },
    drawer: { position: 'absolute', top: 0, left: 0, bottom: 0, width: DRAWER_WIDTH, backgroundColor: c.card, borderRightWidth: 1, borderRightColor: c.border, zIndex: 11, paddingHorizontal: 24 },
    userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarText: { color: '#fff', fontSize: 22, fontWeight: '700' },
    userInfo: { flex: 1 },
    userName: { color: c.text, fontSize: 16, fontWeight: '700' },
    userRole: { color: c.textMuted, fontSize: 13, marginTop: 2 },
    divider: { height: 1, backgroundColor: c.border, marginVertical: 12 },
    menu: { gap: 2 },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, paddingHorizontal: 4 },
    menuLabel: { color: c.textSub, fontSize: 15, fontWeight: '500' },
    version: { color: c.textDim, fontSize: 12, textAlign: 'center', marginTop: 'auto', paddingTop: 24 },
  });
}
