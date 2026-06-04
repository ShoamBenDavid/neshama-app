import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Linking,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  Header,
  Card,
  AccordionItem,
  Button,
} from '../components/ui';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { useTranslation } from '../i18n';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'gettingStarted' | 'privacy' | 'features';
}

export default function HelpFAQScreen() {
  const { t, isRTL } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const faqItems: FAQItem[] = useMemo(
    () => [
      {
        id: 'journaling',
        question: t('helpFaq.faqJournalingQ'),
        answer: t('helpFaq.faqJournalingA'),
        category: 'gettingStarted',
      },
      {
        id: 'aiChat',
        question: t('helpFaq.faqAiChatQ'),
        answer: t('helpFaq.faqAiChatA'),
        category: 'features',
      },
      {
        id: 'privacy',
        question: t('helpFaq.faqPrivacyQ'),
        answer: t('helpFaq.faqPrivacyA'),
        category: 'privacy',
      },
      {
        id: 'language',
        question: t('helpFaq.faqLanguageQ'),
        answer: t('helpFaq.faqLanguageA'),
        category: 'gettingStarted',
      },
      {
        id: 'supportCenter',
        question: t('helpFaq.faqSupportCenterQ'),
        answer: t('helpFaq.faqSupportCenterA'),
        category: 'features',
      },
      {
        id: 'notifications',
        question: t('helpFaq.faqNotificationsQ'),
        answer: t('helpFaq.faqNotificationsA'),
        category: 'features',
      },
      {
        id: 'moodTracking',
        question: t('helpFaq.faqMoodTrackingQ'),
        answer: t('helpFaq.faqMoodTrackingA'),
        category: 'features',
      },
      {
        id: 'community',
        question: t('helpFaq.faqCommunityQ'),
        answer: t('helpFaq.faqCommunityA'),
        category: 'features',
      },
      {
        id: 'data',
        question: t('helpFaq.faqDataQ'),
        answer: t('helpFaq.faqDataA'),
        category: 'privacy',
      },
      {
        id: 'offline',
        question: t('helpFaq.faqOfflineQ'),
        answer: t('helpFaq.faqOfflineA'),
        category: 'gettingStarted',
      },
    ],
    [t],
  );

  const categories = useMemo(
    () => [
      { key: 'all', label: t('helpFaq.categories.all') },
      { key: 'gettingStarted', label: t('helpFaq.categories.gettingStarted') },
      { key: 'privacy', label: t('helpFaq.categories.privacy') },
      { key: 'features', label: t('helpFaq.categories.features') },
    ],
    [t],
  );

  const filteredItems = useMemo(() => {
    let items = faqItems;
    if (selectedCategory !== 'all') {
      items = items.filter((item) => item.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query),
      );
    }
    return items;
  }, [faqItems, selectedCategory, searchQuery]);

  const handleContactSupport = () => {
    // TODO: replace with actual support email or in-app support flow
    Linking.openURL('mailto:support@neshamaapp.com').catch(() => {});
  };

  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' : 'left';

  return (
    <Screen
      header={
        <Header
          title={t('helpFaq.title')}
          subtitle={t('helpFaq.subtitle')}
          showBack
        />
      }
    >
      <View
        style={[styles.searchContainer, { flexDirection: rowDirection }]}
      >
        <Ionicons name="search" size={18} color={colors.text.tertiary} />
        <TextInput
          style={[styles.searchInput, { textAlign }]}
          placeholder={t('helpFaq.searchPlaceholder')}
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.categoryRow,
          { flexDirection: rowDirection },
        ]}
        style={styles.categoryScroll}
      >
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryChip,
                isActive && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryLabel,
                  isActive && styles.categoryLabelActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {filteredItems.length > 0 ? (
        <View style={styles.faqList}>
          {filteredItems.map((item) => (
            <AccordionItem
              key={item.id}
              question={item.question}
              answer={item.answer}
            />
          ))}
        </View>
      ) : (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name="search-outline"
                size={36}
                color={colors.primaryLight}
              />
            </View>
            <Text style={styles.emptyTitle}>{t('helpFaq.noResults')}</Text>
            <Text style={styles.emptyDesc}>{t('helpFaq.noResultsDesc')}</Text>
          </View>
        </Card>
      )}

      <Card style={styles.contactCard}>
        <View
          style={[styles.contactContent, { flexDirection: rowDirection }]}
        >
          <View style={styles.contactIconWrap}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={24}
              color={colors.primary}
            />
          </View>
          <View style={styles.contactInfo}>
            <Text style={[styles.contactTitle, { textAlign }]}>
              {t('helpFaq.contactSupport')}
            </Text>
            <Text style={[styles.contactDesc, { textAlign }]}>
              {t('helpFaq.contactSupportDesc')}
            </Text>
          </View>
        </View>
        <Button
          title={t('helpFaq.contactSupport')}
          variant="primary"
          size="md"
          onPress={handleContactSupport}
          icon={
            <Ionicons
              name="mail-outline"
              size={18}
              color={colors.text.inverse}
            />
          }
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    gap: spacing.sm,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  categoryScroll: {
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  categoryRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 36,
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryLabel: {
    ...typography.captionMedium,
    color: colors.text.secondary,
  },
  categoryLabelActive: {
    color: colors.text.inverse,
  },
  faqList: {
    marginTop: spacing.sm,
  },
  emptyCard: {
    marginTop: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptyDesc: {
    ...typography.bodySm,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  contactCard: {
    marginTop: spacing.lg,
  },
  contactContent: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  contactIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
  contactDesc: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
    lineHeight: 18,
  },
});
