import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { Screen, Header, AppModal, WellnessCard } from '../components/ui';
import { AudioPlayer } from '../components/players';
import { spacing } from '../theme/spacing';
import { getAudioTracks, getAudioTrackById } from '../content/localizedContent';
import { pickImageForContent } from '../assets/images';
import type { AudioTrack } from '../content/types';
import { useTranslation } from '../i18n';
import type { RootStackParamList } from '../navigation/StackNavigator';

type RouteParams = RouteProp<RootStackParamList, 'AudioRelaxation'>;

export default function AudioRelaxationScreen() {
  const { t, language, isRTL } = useTranslation();
  const route = useRoute<RouteParams>();
  const [selectedTrack, setSelectedTrack] = useState<AudioTrack | null>(null);
  const tracks = getAudioTracks(language);
  const trackId = route.params?.trackId;

  useEffect(() => {
    if (!trackId) return;
    const track = getAudioTrackById(trackId, language);
    if (track) setSelectedTrack(track);
  }, [trackId, language]);

  return (
    <Screen gradient="dawn" scrollable={false} padded={false}>
      <Header title={t('audio.title')} showBack subtitle={t('audio.subtitle')} />

      <FlatList
        data={tracks}
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
              subtitle={item.description}
              image={pickImageForContent({
                id: `audio-${item.id}`,
                category: 'audio',
                type: 'audio',
                tags: [item.category],
              })}
              size="sm"
              duration={`${Math.floor(item.duration / 60)} ${t('common.min')}`}
              onPress={() => setSelectedTrack(item)}
            />
          </View>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <AppModal
        visible={!!selectedTrack}
        onClose={() => setSelectedTrack(null)}
        title={selectedTrack?.title}
      >
        {selectedTrack && (
          <AudioPlayer
            track={selectedTrack}
            color={selectedTrack.gradientColors[0]}
          />
        )}
      </AppModal>
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
