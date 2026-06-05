import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, Header, WellnessCard } from '../components/ui';
import { spacing } from '../theme/spacing';
import { getBreathingExercises } from '../content/localizedContent';
import { pickImageForContent } from '../assets/images';
import type { RootStackParamList } from '../navigation/StackNavigator';
import { useTranslation } from '../i18n';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function BreathingExercisesScreen() {
  const navigation = useNavigation<Nav>();
  const { t, language, isRTL } = useTranslation();
  const exercises = getBreathingExercises(language);

  return (
    <Screen gradient="dawn" scrollable={false} padded={false}>
      <Header title={t('breathing.title')} showBack subtitle={t('breathing.subtitle')} />

      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={[
          styles.row,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <WellnessCard
              title={item.name}
              subtitle={`${Math.max(1, Math.floor(item.duration / 60))} ${t('common.min')}`}
              image={pickImageForContent({
                id: `breathing-${item.id}`,
                category: 'breathing',
                type: 'breathing',
              })}
              size="sm"
              duration={`${Math.max(1, Math.floor(item.duration / 60))} ${t('common.min')}`}
              onPress={() =>
                navigation.navigate('BreathingSession', { exerciseId: item.id })
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
