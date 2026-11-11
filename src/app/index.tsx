import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

type ItemRecord = {
  id: number;
  name: string;
  reason: string;
  frequency: string;
  rating: number;
  createdAt: string;
};

const FREQUENCIES = ['매일', '가끔', '거의 사용하지 않음'] as const;
const COLORS = {
  ink: '#25382F',
  muted: '#788078',
  green: '#315C4B',
  paper: '#F5F4EE',
  card: '#FFFFFF',
  line: '#E7E7DE',
  paleGreen: '#EDF3EE',
  gold: '#B47A24',
};

export default function HomeScreen() {
  const database = useSQLiteContext();
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [frequency, setFrequency] = useState<(typeof FREQUENCIES)[number]>('매일');
  const [rating, setRating] = useState(5);
  const [records, setRecords] = useState<ItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadRecords = useCallback(async () => {
    const rows = await database.getAllAsync<ItemRecord>(
      `SELECT id, name, reason, frequency, rating, created_at AS createdAt
       FROM item_records ORDER BY id DESC LIMIT 10`
    );
    setRecords(rows);
  }, [database]);

  useEffect(() => {
    loadRecords()
      .catch(() => setMessage('기록을 불러오지 못했어요. 잠시 후 다시 열어 주세요.'))
      .finally(() => setLoading(false));
  }, [loadRecords]);

  async function saveRecord() {
    if (!name.trim()) {
      setMessage('물건 이름을 적어 주세요.');
      return;
    }
    if (!reason.trim()) {
      setMessage('이 물건이 취향에 맞는 이유를 적어 주세요.');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      await database.runAsync(
        'INSERT INTO item_records (name, reason, frequency, rating) VALUES (?, ?, ?, ?)',
        name.trim(),
        reason.trim(),
        frequency,
        rating
      );
      await loadRecords();
      setName('');
      setReason('');
      setFrequency('매일');
      setRating(5);
      setMessage('오늘의 기록을 저장했어요.');
    } catch {
      setMessage('저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.page}>
          <View style={styles.intro}>
            <Text style={styles.eyebrow}>저녁의 물건 기록</Text>
            <Text style={styles.title} selectable>
              내가 자주 쓰고{ '\n' }좋아하는 것
            </Text>
            <Text style={styles.description} selectable>
              오늘 만난 물건을 돌아보며{ '\n' }나만의 선택 기준을 천천히 찾아요.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>어떤 물건인가요?</Text>
              <TextInput
                accessibilityLabel="물건 이름"
                value={name}
                onChangeText={setName}
                placeholder="예: 매일 드는 캔버스 가방"
                placeholderTextColor="#9A9F98"
                returnKeyType="next"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>왜 마음에 드나요?</Text>
              <TextInput
                accessibilityLabel="취향에 맞는 이유"
                value={reason}
                onChangeText={setReason}
                placeholder="편한 점이나 오래 쓰고 싶은 이유를 적어 보세요."
                placeholderTextColor="#9A9F98"
                multiline
                textAlignVertical="top"
                style={[styles.input, styles.reasonInput]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>얼마나 자주 사용하나요?</Text>
              <View style={styles.choiceRow}>
                {FREQUENCIES.map((option) => {
                  const selected = frequency === option;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setFrequency(option)}
                      style={[styles.choice, selected && styles.choiceSelected]}
                    >
                      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>만족도</Text>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((score) => (
                  <Pressable
                    key={score}
                    accessibilityRole="button"
                    accessibilityLabel={`만족도 ${score}점`}
                    accessibilityState={{ selected: rating === score }}
                    onPress={() => setRating(score)}
                    hitSlop={6}
                    style={styles.starButton}
                  >
                    <Text style={[styles.star, score <= rating && styles.starSelected]}>★</Text>
                  </Pressable>
                ))}
                <Text style={styles.ratingHint}>{rating} / 5</Text>
              </View>
            </View>

            {message ? (
              <Text
                accessibilityRole="text"
                selectable
                style={[styles.message, message.startsWith('저장') && styles.successMessage]}
              >
                {message}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={saveRecord}
              disabled={saving}
              style={({ pressed }) => [styles.saveButton, pressed && styles.pressed, saving && styles.disabled]}
            >
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>기록 저장하기</Text>}
            </Pressable>
          </View>

          <View style={styles.recordsSection}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>최근 기록</Text>
              <Text style={styles.count}>{records.length}개</Text>
            </View>
            {loading ? (
              <ActivityIndicator color={COLORS.green} style={styles.loader} />
            ) : records.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>첫 기록을 기다리고 있어요</Text>
                <Text style={styles.emptyText}>오늘 마음에 든 물건부터 적어 보세요.</Text>
              </View>
            ) : (
              <View style={styles.recordList}>
                {records.map((record) => (
                  <View key={record.id} style={styles.recordCard}>
                    <View style={styles.recordTop}>
                      <Text style={styles.recordName} selectable>{record.name}</Text>
                      <Text style={styles.recordRating} selectable>
                        {'★'.repeat(record.rating)}{'☆'.repeat(5 - record.rating)}
                      </Text>
                    </View>
                    <Text style={styles.recordReason} selectable>{record.reason}</Text>
                    <Text style={styles.recordMeta} selectable>
                      {record.frequency} 사용 · {record.createdAt.slice(0, 10).replaceAll('-', '.')}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <Text style={styles.footnote} selectable>기록은 이 기기에 저장됩니다.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.paper },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
  page: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: 24 },
  intro: { paddingTop: 32, gap: 10 },
  eyebrow: { color: COLORS.green, fontSize: 13, fontWeight: '700', letterSpacing: 1.1 },
  title: { color: COLORS.ink, fontSize: 36, lineHeight: 43, fontWeight: '700', letterSpacing: -1.2 },
  description: { color: COLORS.muted, fontSize: 15, lineHeight: 23 },
  formCard: { backgroundColor: COLORS.card, borderRadius: 24, borderWidth: 1, borderColor: COLORS.line, padding: 22, gap: 20 },
  fieldGroup: { gap: 9 },
  label: { color: COLORS.ink, fontSize: 14, fontWeight: '700' },
  input: { minHeight: 48, borderWidth: 1, borderColor: COLORS.line, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, color: COLORS.ink, backgroundColor: '#FCFCFA', fontSize: 15 },
  reasonInput: { minHeight: 88 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 42, paddingHorizontal: 13, borderRadius: 22, borderWidth: 1, borderColor: COLORS.line, justifyContent: 'center', backgroundColor: '#FFFFFF' },
  choiceSelected: { backgroundColor: COLORS.paleGreen, borderColor: COLORS.green },
  choiceText: { color: COLORS.muted, fontSize: 13 },
  choiceTextSelected: { color: COLORS.green, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  starButton: { minWidth: 36, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  star: { color: '#DADBD4', fontSize: 27 },
  starSelected: { color: COLORS.gold },
  ratingHint: { color: COLORS.muted, fontSize: 13, marginLeft: 6 },
  message: { color: '#9A5A2D', fontSize: 13, lineHeight: 19 },
  successMessage: { color: COLORS.green },
  saveButton: { minHeight: 52, borderRadius: 15, backgroundColor: COLORS.green, justifyContent: 'center', alignItems: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.65 },
  recordsSection: { gap: 13 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: COLORS.ink, fontSize: 19, fontWeight: '700' },
  count: { color: COLORS.muted, fontSize: 13 },
  loader: { paddingVertical: 20 },
  emptyCard: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#D6D9D0', borderRadius: 18, padding: 22, alignItems: 'center', gap: 6 },
  emptyTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '600' },
  emptyText: { color: COLORS.muted, fontSize: 13, textAlign: 'center' },
  recordList: { gap: 10 },
  recordCard: { backgroundColor: COLORS.card, borderRadius: 18, borderWidth: 1, borderColor: COLORS.line, padding: 17, gap: 9 },
  recordTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  recordName: { flex: 1, color: COLORS.ink, fontSize: 16, fontWeight: '700' },
  recordRating: { color: COLORS.gold, fontSize: 13 },
  recordReason: { color: '#545E56', fontSize: 14, lineHeight: 21 },
  recordMeta: { color: COLORS.muted, fontSize: 12 },
  footnote: { color: '#8B9189', fontSize: 12, textAlign: 'center', paddingTop: 4 },
});
