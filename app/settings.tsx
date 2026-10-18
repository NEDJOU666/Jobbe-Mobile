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
import { useT } from '@/hooks/useT';
import type { Language } from '@/i18n/translations';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { colors: c, isDark, toggle } = useTheme();
  const { t, language, setLanguage } = useT();
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
          t.settings.permissionRequiredTitle,
          t.settings.permissionRequiredMessage,
          [
            { text: t.settings.cancel, style: 'cancel' },
            { text: t.settings.openSettings, onPress: () => Linking.openSettings() },
          ],
        );
      }
    } else {
      Alert.alert(
        t.settings.turnOffNotificationsTitle,
        t.settings.turnOffNotificationsMessage,
        [
          { text: t.settings.cancel, style: 'cancel' },
          { text: t.settings.openSettings, onPress: () => Linking.openSettings() },
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
    Alert.alert(t.settings.signOutTitle, t.settings.signOutMessage, [
      { text: t.settings.cancel, style: 'cancel' },
      {
        text: t.settings.signOut, style: 'destructive',
        onPress: async () => { await logout(); router.replace('/(auth)/welcome'); },
      },
    ]);
  };

  const handleChangeEmail = () => {
    Alert.alert(
      t.settings.changeEmailTitle,
      t.settings.changeEmailMessage,
      [
        { text: t.settings.cancel, style: 'cancel' },
        { text: t.settings.contactSupport, onPress: () => Linking.openURL('mailto:Help-support@oxbiy.com') },
      ],
    );
  };

  const handleRateApp = () =>
    Alert.alert(t.settings.comingSoonTitle, t.settings.comingSoonMessage);

  const handleLanguagePicker = () => {
    Alert.alert(t.settings.languageTitle, t.settings.languageMessage, [
      { text: t.settings.cancel, style: 'cancel' },
      { text: 'English', onPress: () => setLanguage('en' as Language) },
      { text: 'Français', onPress: () => setLanguage('fr' as Language) },
    ]);
  };

  const openWebview = (url: string, title: string) => {
    router.push(`/webview?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}` as any);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={c.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.settings.title}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Appearance ── */}
        <GroupTitle c={c} label={t.settings.appearance} />
        <View style={styles.groupCard}>
          <View style={styles.toggleRow}>
            <View style={[styles.rowIcon, { backgroundColor: c.accentBg }]}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={c.accent} />
            </View>
            <Text style={styles.rowLabel}>{t.settings.darkMode}</Text>
            <Switch
              value={isDark}
              onValueChange={toggle}
              trackColor={{ false: c.border2, true: c.accent + '60' }}
              thumbColor={isDark ? c.accent : c.textMuted}
            />
          </View>
          <SettingRow c={c} icon="language-outline" label={t.settings.language}
            value={language === 'fr' ? 'Français' : 'English'}
            onPress={handleLanguagePicker} last />
        </View>

        {/* ── Account ── */}
        <GroupTitle c={c} label={t.settings.account} />
        <View style={styles.groupCard}>
          <SettingRow c={c} icon="person-outline" label={t.settings.editProfile}
            onPress={() => router.push('/profile-edit')} />
          <SettingRow c={c} icon="lock-closed-outline" label={t.settings.changePassword}
            onPress={() => router.push('/change-password')} />
          <SettingRow c={c} icon="mail-outline" label={t.settings.changeEmail}
            onPress={handleChangeEmail} last />
        </View>

        {/* ── Privacy ── */}
        <GroupTitle c={c} label={t.settings.privacy} />
        <View style={styles.groupCard}>
          <ToggleRow c={c} icon="eye-outline" label={t.settings.profileVisible}
            value={profileVisible} onToggle={handleProfileVisible} />
          <ToggleRow c={c} icon="cash-outline" label={t.settings.showSalary}
            value={showSalary} onToggle={handleShowSalary} />
          <ToggleRow c={c} icon="briefcase-outline" label={t.settings.openToWork}
            value={openToWork} onToggle={handleOpenToWork} last />
        </View>

        {/* ── Notifications ── */}
        <GroupTitle c={c} label={t.settings.notifications} />
        <View style={styles.groupCard}>
          <ToggleRow c={c} icon="mail-outline" label={t.settings.emailJobAlerts}
            value={emailAlerts} onToggle={handleEmailAlerts} />
          <ToggleRow c={c} icon="notifications-outline" label={t.settings.pushNotifications}
            value={pushGranted} onToggle={handlePushToggle} last />
        </View>

        {/* ── Support ── */}
        <GroupTitle c={c} label={t.settings.support} />
        <View style={styles.groupCard}>
          <SettingRow c={c} icon="help-circle-outline" label={t.settings.helpSupport}
            onPress={() => router.push('/help')} />
          <SettingRow c={c} icon="star-outline" label={t.settings.rateApp}
            onPress={handleRateApp} />
          <SettingRow c={c} icon="document-text-outline" label={t.settings.termsOfService}
            onPress={() => openWebview('https://jobfinder.oxbiy.com/terms', t.settings.termsOfService)} />
          <SettingRow c={c} icon="shield-outline" label={t.settings.privacyPolicy}
            onPress={() => openWebview('https://jobfinder.oxbiy.com/about/privacy', t.settings.privacyPolicy)} last />
        </View>

        {/* ── Danger ── */}
        <GroupTitle c={c} label={t.settings.accountActions} />
        <View style={styles.groupCard}>
          <TouchableOpacity
            style={[styles.dangerRow, { borderBottomColor: c.border }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <View style={[styles.rowIcon, { backgroundColor: '#C6282818' }]}>
              <Ionicons name="log-out-outline" size={18} color="#C62828" />
            </View>
            <Text style={styles.dangerLabel}>{t.settings.logOut}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dangerRow, { borderBottomWidth: 0 }]}
            activeOpacity={0.8}
            onPress={() => Alert.alert(t.settings.deleteAccountTitle, t.settings.deleteAccountMessage)}
          >
            <View style={[styles.rowIcon, { backgroundColor: '#C6282818' }]}>
              <Ionicons name="trash-outline" size={18} color="#C62828" />
            </View>
            <Text style={styles.dangerLabel}>{t.settings.deleteAccount}</Text>
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
