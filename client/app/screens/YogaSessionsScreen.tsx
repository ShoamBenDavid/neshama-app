import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, Header, WellnessCard } from '../components/ui';
import { spacing } from '../theme/spacing';
import { getYogaSessions } from '../content/localizedContent';
import { wellnessImages } from '../assets/images';
import type { RootStackParamList } from '../navigation/StackNavigator';
import { useTranslation } from '../i18n';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function YogaSessionsScreen() {
  const navigation = useNavigation<Nav>();
  const { t, language, isRTL } = useTranslation();
  const sessions = getYogaSessions(language);

  const getDifficultyLabel = (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
    if (difficulty === 'intermediate') return t('yoga.difficultyIntermediate');
    if (difficulty === 'advanced') return t('yoga.difficultyAdvanced');
    return t('yoga.difficultyBeginner');
  };

  return (
    <Screen gradient="dawn" scrollable={false} padded={false}>
      <Header title={t('yoga.title')} showBack subtitle={t('yoga.subtitle')} />

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={[
          styles.row,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <WellnessCard
              title={item.title}
              subtitle={`${item.duration} ${t('common.min')} · ${getDifficultyLabel(item.difficulty)}`}
              image={wellnessImages.yogaSunrise}
              size="sm"
              duration={`${item.duration} ${t('common.min')}`}
              badge={item.youtubeId ? t('common.video') : undefined}
              onPress={() =>
                navigation.navigate('YogaDetail', { sessionId: item.id })
              }
            />
          </View>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cell: {
    width: '48%',
  },
});
