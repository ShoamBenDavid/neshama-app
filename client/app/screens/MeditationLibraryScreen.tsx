import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, Header, WellnessCard } from '../components/ui';
import { spacing } from '../theme/spacing';
import { getMeditationSessions } from '../content/localizedContent';
import { pickImageForCategory } from '../assets/images';
import type { RootStackParamList } from '../navigation/StackNavigator';
import { useTranslation } from '../i18n';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function MeditationLibraryScreen() {
  const navigation = useNavigation<Nav>();
  const { t, language } = useTranslation();
  const sessions = getMeditationSessions(language);

  return (
    <Screen gradient="dawn" scrollable={false} padded={false}>
      <Header title={t('meditation.title')} showBack subtitle={t('meditation.subtitle')} />

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <WellnessCard
              title={item.title}
              subtitle={`${item.duration} ${t('common.min')}`}
              image={pickImageForCategory(item.category || 'meditation')}
              size="sm"
              duration={`${item.duration} ${t('common.min')}`}
              onPress={() =>
                navigation.navigate('MeditationSession', { sessionId: item.id })
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
