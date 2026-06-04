import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { useTranslation, getChevronBackName, getChevronForwardName } from '../../i18n';

interface CalendarStripProps {
  /** ISO date strings (YYYY-MM-DD) the user has entries on. */
  activeDays?: string[];
}

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTHS_HE = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

const DAYS_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAYS_HE = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

/**
 * Monthly calendar strip mirroring the reference. The current day is
 * highlighted with a solid indigo dot, days with entries get a small
 * lavender dot. Header includes month label + back/forward chevrons.
 */
export default function CalendarStrip({ activeDays = [] }: CalendarStripProps) {
  const { language, isRTL } = useTranslation();
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const months = language === 'he' ? MONTHS_HE : MONTHS_EN;
  const days = language === 'he' ? DAYS_HE : DAYS_EN;

  const grid = useMemo(() => buildGrid(cursor.year, cursor.month), [cursor]);
  const monthLabel = `${months[cursor.month]} ${cursor.year}`;

  const goPrev = () => {
    setCursor(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 },
    );
  };
  const goNext = () => {
    setCursor(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 },
    );
  };

  const isActive = (day: number) => {
    const iso = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return activeDays.includes(iso);
  };

  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === cursor.month &&
    today.getFullYear() === cursor.year;

  return (
    <View style={styles.card}>
      <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={goPrev} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons
            name={getChevronBackName(isRTL)}
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={goNext} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons
            name={getChevronForwardName(isRTL)}
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.weekRow,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
      >
        {days.map((d, i) => (
          <Text key={`d-${i}`} style={styles.weekDay}>
            {d}
          </Text>
        ))}
      </View>

      {grid.map((week, wi) => (
        <View
          key={`w-${wi}`}
          style={[
            styles.weekRow,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          {week.map((day, di) => {
            if (day === 0) {
              return <View key={`d-${wi}-${di}`} style={styles.dayCell} />;
            }
            const today = isToday(day);
            const active = isActive(day);
            return (
              <View key={`d-${wi}-${di}`} style={styles.dayCell}>
                <View
                  style={[
                    styles.dayCircle,
                    today && { backgroundColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      today && { color: colors.text.inverse, fontWeight: '700' },
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                {active && !today && <View style={styles.activeDot} />}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function buildGrid(year: number, month: number): number[][] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = first.getDay(); // 0=Sun
  const weeks: number[][] = [];
  let week: number[] = new Array(startDay).fill(0);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(0);
    weeks.push(week);
  }
  return weeks;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.base,
    ...shadows.sm,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  monthLabel: {
    ...typography.cardTitle,
    color: colors.primary,
  },
  weekRow: {
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    ...typography.caption,
    color: colors.text.muted,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    ...typography.cardMeta,
    color: colors.text.primary,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brand.lavender,
    marginTop: 2,
  },
});
