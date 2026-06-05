import React, { useEffect, useMemo } from 'react';
import { Dimensions, ScrollView, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  Screen,

  SectionHeader,
} from '../components/ui';
import {
  HeroCourseCard,
  QuickActionPills,
  
} from '../components/home';
import ContentCarousel from '../components/content/ContentCarousel';
import { spacing } from '../theme/spacing';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchRecommendedContent } from '../store/slices/contentSlice';
import { useTranslation } from '../i18n';
import type { RootStackParamList } from '../navigation/StackNavigator';
import {
  getContentByCategory,
  type ContentCategory,
  type RegistryItem,
} from '../content/contentRegistry';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomePageScreen() {
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { t, language } = useTranslation();

  useEffect(() => {
    dispatch(fetchRecommendedContent());
  }, [dispatch]);

  const categorySections = useMemo(
    () =>
      [
        { id: 'meditation', title: t('content.typeMeditation') },
        { id: 'breathing', title: t('content.typeBreathing') },
        { id: 'audio', title: t('content.typeAudio') },
        { id: 'yoga', title: t('content.typeYoga') },
        { id: 'articles', title: t('content.typeArticles') },
      ].map((section) => ({
        ...section,
        id: section.id as ContentCategory,
        items: getContentByCategory(section.id as ContentCategory, language),
      })),
    [language, t],
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.goodMorning');
    if (hour < 17) return t('home.goodAfternoon');
    return t('home.goodEvening');
  };

  const firstName = user?.name?.split(' ')[0]?.trim() || '';

  const goToContent = (item: RegistryItem) => {
    const target = item.navigationTarget;
    navigation.navigate(target.screen as any, target.params as any);
  };

  const goToCategory = (category: ContentCategory) => {
    navigation.navigate('ContentLibrary', { initialCategory: category });
  };

  const greetingLine = firstName
    ? `${getGreeting()}, ${firstName}`
    : getGreeting();

  return (
    <Screen
    gradient="dawn"
      scrollable
      padded={false}
    >
 
        <View style={styles.heroSlide}>
          <HeroCourseCard
          eyebrow={greetingLine}
          title={t('home.wantToTalkTitle')}
        
           
            onPress={() => navigation.navigate('Chat')}
            image={require('../assets/friend/3.png')}
          />
        </View>

      <QuickActionPills
        actions={[
      
          {
            icon: 'headset-outline',
            label: t('content.typeAudio'),
            onPress: () => navigation.navigate('AudioRelaxation'),
          },
          {
            icon: 'flower-outline',
            label: t('content.typeMeditation'),
            onPress: () => navigation.navigate('MeditationLibrary'),
          },
          {
            icon: 'leaf-outline',
            label: t('home.breaths'),
            onPress: () => navigation.navigate('BreathingExercises'),
          },
        ]}
      />

      {categorySections.map((section) =>
        section.items.length > 0 ? (
          <View key={section.id}>
            <View style={styles.sectionHeaderWrap}>
              <SectionHeader
                title={section.title}
                actionLabel={t('common.seeAll')}
                onActionPress={() => goToCategory(section.id)}
              />
            </View>
            <ContentCarousel
              items={section.items}
              onItemPress={goToContent}
              cardSize="md"
              limit={8}
            />
          </View>
        ) : null,
      )}

    

    </Screen>
  );
}

const styles = StyleSheet.create({
  heroSlider: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  heroSlide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: spacing.lg,
  },
  chatHeroCard: {
    minHeight: 220,
    justifyContent: 'center',
  },
  sectionHeaderWrap: {
    paddingHorizontal: spacing.lg,
  },
  ctaWrap: {
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.lg,
  },
});
