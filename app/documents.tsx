import {
  useDeleteDocument,
  useDocuments,
  useSetDefaultDocument,
  useUploadDocument,
  type UserDocument,
} from '@/hooks/useDocuments';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type DocType = 'RESUME' | 'COVER_LETTER' | 'CERTIFICATE' | 'OTHER';

const TYPE_LABEL: Record<DocType, string> = {
  RESUME: 'Resume', COVER_LETTER: 'Cover Letter', CERTIFICATE: 'Certificate', OTHER: 'Other',
};
const TYPE_COLOR: Record<DocType, string> = {
  RESUME: '#14A800', COVER_LETTER: '#1565C0', CERTIFICATE: '#F57F17', OTHER: '#555',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DocumentsScreen() {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [filter, setFilter] = useState<DocType | 'ALL'>('ALL');

  const { data: docs = [], isLoading, isError, refetch } = useDocuments();
  const { mutate: setDefault } = useSetDefaultDocument();
  const { mutate: deleteDoc } = useDeleteDocument();
  const { mutate: uploadDoc, isPending: isUploading } = useUploadDocument();

  const filters: Array<DocType | 'ALL'> = ['ALL', 'RESUME', 'COVER_LETTER', 'CERTIFICATE', 'OTHER'];
  const filtered = filter === 'ALL' ? docs : docs.filter((d) => d.documentType === filter);

  const confirmDelete = (doc: UserDocument) => {
    Alert.alert(
      'Delete document',
      `Remove "${doc.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteDoc(doc.id) },
      ],
    );
  };

  const handleUpload = async (docType: DocType = 'RESUME') => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];

    uploadDoc(
      {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/pdf',
        documentType: docType,
      },
      {
        onError: (err: any) => {
          const msg = err?.response?.data?.message ?? 'Upload failed. Please try again.';
          Alert.alert('Upload failed', msg);
        },
      },
    );
  };

  const promptDocType = () => {
    Alert.alert(
      'Document type',
      'What type of document are you uploading?',
      [
        { text: 'Resume',       onPress: () => handleUpload('RESUME') },
        { text: 'Cover Letter', onPress: () => handleUpload('COVER_LETTER') },
        { text: 'Certificate',  onPress: () => handleUpload('CERTIFICATE') },
        { text: 'Other',        onPress: () => handleUpload('OTHER') },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={c.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Documents</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={promptDocType} disabled={isUploading}>
          {isUploading
            ? <ActivityIndicator size="small" color={c.accent} />
            : <Ionicons name="cloud-upload-outline" size={20} color={c.accent} />}
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterRow}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'ALL' ? 'All' : TYPE_LABEL[f as DocType]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={c.accent} size="large" /></View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={c.border3} />
          <Text style={styles.emptyText}>Could not load documents</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <TouchableOpacity style={styles.uploadArea} onPress={promptDocType} disabled={isUploading} activeOpacity={0.75}>
            {isUploading ? (
              <>
                <ActivityIndicator color={c.accent} />
                <Text style={styles.uploadTitle}>Uploading…</Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={28} color={c.accent} />
                <Text style={styles.uploadTitle}>Upload document</Text>
                <Text style={styles.uploadHint}>PDF, DOC · Max 10 MB</Text>
              </>
            )}
          </TouchableOpacity>

          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="document-outline" size={48} color={c.border3} />
              <Text style={styles.emptyText}>No documents</Text>
            </View>
          ) : (
            filtered.map((doc) => {
              const docType = (doc.documentType as DocType) ?? 'OTHER';
              const color = TYPE_COLOR[docType] ?? TYPE_COLOR.OTHER;
              return (
                <View key={doc.id} style={styles.docCard}>
                  <View style={[styles.docIcon, { backgroundColor: color + '18' }]}>
                    <Ionicons name="document-text-outline" size={22} color={color} />
                  </View>
                  <View style={styles.docInfo}>
                    <View style={styles.docNameRow}>
                      <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                      {doc.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.docMeta}>
                      {TYPE_LABEL[docType] ?? docType}
                      {doc.size ? ` · ${doc.size}` : ''}
                      {' · '}{formatDate(doc.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.docActions}>
                    {docType === 'RESUME' && !doc.isDefault && (
                      <TouchableOpacity style={styles.actionBtn} onPress={() => setDefault(doc.id)}>
                        <Ionicons name="star-outline" size={18} color="#F57F17" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.actionBtn} onPress={() => confirmDelete(doc)}>
                      <Ionicons name="trash-outline" size={18} color="#C62828" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

function makeStyles(c: ReturnType<typeof import('@/hooks/useTheme').useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
    iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: c.card, borderWidth: 1, borderColor: c.border2, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: c.text, fontSize: 17, fontWeight: '700' },
    filterScroll: { paddingLeft: 16, flexGrow: 0, marginBottom: 8 },
    filterRow: { flexDirection: 'row', gap: 8, paddingRight: 16, paddingVertical: 4 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: c.card, borderWidth: 1, borderColor: c.border2 },
    filterChipActive: { backgroundColor: c.accent, borderColor: c.accent },
    filterText: { color: c.textBody, fontSize: 13 },
    filterTextActive: { color: '#fff', fontWeight: '600' },
    scroll: { paddingHorizontal: 16, paddingTop: 4 },
    uploadArea: { borderWidth: 1, borderColor: c.border2, borderStyle: 'dashed', borderRadius: 16, padding: 24, alignItems: 'center', gap: 8, marginBottom: 20 },
    uploadTitle: { color: c.accent, fontSize: 15, fontWeight: '600' },
    uploadHint: { color: c.textMuted, fontSize: 12 },
    docCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 14, marginBottom: 10 },
    docIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    docInfo: { flex: 1, minWidth: 0 },
    docNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    docName: { color: c.textSub, fontSize: 13, fontWeight: '600', flex: 1 },
    defaultBadge: { backgroundColor: c.accentBg, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, flexShrink: 0 },
    defaultText: { color: c.accent, fontSize: 10, fontWeight: '700' },
    docMeta: { color: c.textMuted, fontSize: 11 },
    docActions: { flexDirection: 'row', gap: 2, flexShrink: 0 },
    actionBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
    empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
    emptyText: { color: c.textDim, fontSize: 15 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40, gap: 12 },
    retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: c.accentBg, borderWidth: 1, borderColor: c.accentBorder },
    retryText: { color: c.accent, fontWeight: '600' },
  });
}
