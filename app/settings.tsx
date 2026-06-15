import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Platform, ScrollView, StyleSheet,
  Switch, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// expo-notifications is required lazily (inside functions/effects) to prevent
// DevicePushTokenAutoRegistration.fx.js from running at route-scan time in Expo Go
const getNotifications = () => require('expo-notifications') as typeof import('expo-notifications');
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';



export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { colors: c, isDark, toggle } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  const { data: profileData } = useProfile();
  const { mutate: updateProfile } = useUpdateProfile();

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushGranted, setPushGranted] = useState(false);
  const [profileVisible, setProfileVisible] = useState(true);
  const [showSalary, setShowSalary] = useState(true);
  const [openToWork, setOpenToWork] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Seed toggles from fetched profile
  useEffect(() => {
    if (!profileData?.profile || hydrated) return;
    setProfileVisible(profileData.profile.profileVisible ?? true);
    setShowSalary(profileData.profile.showSalary ?? true);
    setOpenToWork(profileData.profile.openToWork ?? false);
    setEmailAlerts(profileData.profile.emailAlerts ?? true);
    setHydrated(true);
  }, [profileData, hydrated]);

  // Sync push permission status on mount
  useEffect(() => {
    getNotifications().getPermissionsAsync().then(({ status }) => {
      setPushGranted(status === 'granted');
    });
  }, []);

  const handlePushToggle = async (v: boolean) => {
    if (v) {
      const { status } = await getNotifications().requestPermissionsAsync();
      setPushGranted(status === 'granted');
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Enable notifications in your device settings to receive job alerts.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
      }
    } else {
      Alert.alert(
        'Turn off notifications',
        'To disable notifications, go to your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
    }
  };

  const handleEmailAlerts = (v: boolean) => {
    setEmailAlerts(v);
    updateProfile({ emailAlerts: v });
  };

  const handleProfileVisible = (v: boolean) => {
    setProfileVisible(v);
    updateProfile({ profileVisible: v });
  };
  const handleShowSalary = (v: boolean) => {
    setShowSalary(v);
    updateProfile({ showSalary: v });
  };
  const handleOpenToWork = (v: boolean) => {
    setOpenToWork(v);
    updateProfile({ openToWork: v });
  };

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out', style: 'destructive',
        onPress: async () => { await logout(); router.replace('/(auth)/welcome'); },
      },
    ]);
  };

  const handleChangeEmail = () => {
    Alert.alert(
      'Change Email',
      'To change your email address, contact our support team.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Contact Support', onPress: () => Linking.openURL('mailto:Help-support@oxbiy.com') },
      ],
    );
  };

  const handleRateApp = () =>
    Alert.alert('Coming Soon', 'JobFinder will be available on the Play Store and App Store soon. Thank you for your support!');

  const openWebview = (url: string, title: string) => {
    router.push(`/webview?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}` as any);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={c.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Appearance ── */}
        <GroupTitle c={c} label="Appearance" />
        <View style={styles.groupCard}>
          <View style={styles.toggleRow}>
            <View style={[styles.rowIcon, { backgroundColor: c.accentBg }]}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={c.accent} />
            </View>
            <Text style={styles.rowLabel}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={toggle}
              trackColor={{ false: c.border2, true: c.accent + '60' }}
              thumbColor={isDark ? c.accent : c.textMuted}
            />
          </View>
        </View>

        {/* ── Account ── */}
        <GroupTitle c={c} label="Account" />
        <View style={styles.groupCard}>
          <SettingRow c={c} icon="person-outline" label="Edit Profile"
            onPress={() => router.push('/profile-edit')} />
          <SettingRow c={c} icon="lock-closed-outline" label="Change Password"
            onPress={() => router.push('/change-password')} />
          <SettingRow c={c} icon="mail-outline" label="Change Email"
            onPress={handleChangeEmail} last />
        </View>

        {/* ── Privacy ── */}
        <GroupTitle c={c} label="Privacy" />
        <View style={styles.groupCard}>
          <ToggleRow c={c} icon="eye-outline" label="Profile visible to recruiters"
            value={profileVisible} onToggle={handleProfileVisible} />
          <ToggleRow c={c} icon="cash-outline" label="Show salary expectations"
            value={showSalary} onToggle={handleShowSalary} />
          <ToggleRow c={c} icon="briefcase-outline" label="Open to work"
            value={openToWork} onToggle={handleOpenToWork} last />
        </View>

        {/* ── Notifications ── */}
        <GroupTitle c={c} label="Notifications" />
        <View style={styles.groupCard}>
          <ToggleRow c={c} icon="mail-outline" label="Email job alerts"
            value={emailAlerts} onToggle={handleEmailAlerts} />
          <ToggleRow c={c} icon="notifications-outline" label="Push notifications"
            value={pushGranted} onToggle={handlePushToggle} last />
        </View>

        {/* ── Support ── */}
        <GroupTitle c={c} label="Support" />
        <View style={styles.groupCard}>
          <SettingRow c={c} icon="help-circle-outline" label="Help & Support"
            onPress={() => router.push('/help')} />
          <SettingRow c={c} icon="star-outline" label="Rate the App"
            onPress={handleRateApp} />
          <SettingRow c={c} icon="document-text-outline" label="Terms of Service"
            onPress={() => openWebview('https://jobfinder.oxbiy.com/terms', 'Terms of Service')} />
          <SettingRow c={c} icon="shield-outline" label="Privacy Policy"
            onPress={() => openWebview('https://jobfinder.oxbiy.com/about/privacy', 'Privacy Policy')} last />
        </View>

        {/* ── Danger ── */}
        <GroupTitle c={c} label="Account Actions" />
        <View style={styles.groupCard}>
          <TouchableOpacity
            style={[styles.dangerRow, { borderBottomColor: c.border }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <View style={[styles.rowIcon, { backgroundColor: '#C6282818' }]}>
              <Ionicons name="log-out-outline" size={18} color="#C62828" />
            </View>
            <Text style={styles.dangerLabel}>Log Out</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dangerRow, { borderBottomWidth: 0 }]}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Delete Account', 'To delete your account, contact Help-support@oxbiy.com')}
          >
            <View style={[styles.rowIcon, { backgroundColor: '#C6282818' }]}>
              <Ionicons name="trash-outline" size={18} color="#C62828" />
            </View>
            <Text style={styles.dangerLabel}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Jobbe v1.0.0</Text>
        <View style={{ height: 32 }} />
      </ScrollView>

    </View>
  );
}

function GroupTitle({ c, label }: { c: any; label: string }) {
  return (
    <Text style={{
      color: c.textMuted, fontSize: 12, fontWeight: '600', letterSpacing: 0.5,
      marginBottom: 8, paddingHorizontal: 4, marginTop: 4,
    }}>
      {label}
    </Text>
  );
}

function SettingRow({ c, icon, label, value, onPress, last }: {
  c: any; icon: string; label: string; value?: string; onPress: () => void; last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1, borderBottomColor: c.border,
      }}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: c.card2, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon as any} size={18} color={c.icon} />
      </View>
      <Text style={{ color: c.textSub, fontSize: 14, flex: 1 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {value && <Text style={{ color: c.textMuted, fontSize: 13 }}>{value}</Text>}
        <Ionicons name="chevron-forward" size={16} color={c.textDim} />
      </View>
    </TouchableOpacity>
  );
}

function ToggleRow({ c, icon, label, value, onToggle, last }: {
  c: any; icon: string; label: string; value: boolean; onToggle: (v: boolean) => void; last?: boolean;
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: last ? 0 : 1, borderBottomColor: c.border,
    }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: c.card2, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon as any} size={18} color={c.icon} />
      </View>
      <Text style={{ color: c.textSub, fontSize: 14, flex: 1 }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: c.border2, true: c.accent + '60' }}
        thumbColor={value ? c.accent : c.textMuted}
      />
    </View>
  );
}

function makeStyles(c: ReturnType<typeof import('@/hooks/useTheme').useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingBottom: 12,
    },
    iconBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: c.card, borderWidth: 1, borderColor: c.border2,
      alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { color: c.text, fontSize: 17, fontWeight: '700' },
    scroll: { paddingHorizontal: 16, paddingTop: 8 },
    groupCard: {
      backgroundColor: c.card, borderWidth: 1, borderColor: c.border,
      borderRadius: 16, overflow: 'hidden', marginBottom: 20,
    },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
    rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    rowLabel: { color: c.textSub, fontSize: 14, flex: 1 },
    dangerRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
    },
    dangerLabel: { color: '#C62828', fontSize: 14, fontWeight: '600' },
    version: { color: c.textDim, fontSize: 12, textAlign: 'center', marginTop: 4 },
  });
}
