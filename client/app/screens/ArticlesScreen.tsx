import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen, Header, WellnessCard } from '../components/ui';
import { spacing } from '../theme/spacing';
import { getWellnessArticles } from '../content/localizedContent';
import { pickImageForCategory, wellnessImages } from '../assets/images';
import type { RootStackParamList } from '../navigation/StackNavigator';
import { useTranslation } from '../i18n';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ArticlesScreen() {
  const navigation = useNavigation<Nav>();
  const { t, language } = useTranslation();
  const articles = getWellnessArticles(language);

  return (
    <Screen gradient="dawn" scrollable={false} padded={false}>
      <Header title={t('articles.title')} showBack subtitle={t('articles.subtitle')} />

      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <WellnessCard
              title={item.title}
              subtitle={t('common.minRead', { time: item.readTime })}
              authorName={item.author}
              image={pickImageForCategory(item.tags?.[0] || 'article') ?? wellnessImages.journalDesk}
              size="sm"
              onPress={() =>
                navigation.navigate('ArticleDetail', { articleId: item.id })
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
