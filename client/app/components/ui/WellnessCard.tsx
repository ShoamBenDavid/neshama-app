import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ImageSourcePropType,
  ViewStyle,
  StyleProp,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { useTranslation } from '../../i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CardSize = 'sm' | 'md' | 'lg';

interface WellnessCardProps {
  title: string;
  subtitle?: string;
  /** Bundled photo. If absent, falls back to a gradient. */
  image?: ImageSourcePropType;
  /** Override gradient (used when no image). */
  gradient?: keyof typeof colors.gradients;
  /** Locked / premium content indicator. */
  locked?: boolean;
  /** Duration label, e.g. "10 דק'". Rendered as a chip. */
  duration?: string;
  /** "New" ribbon — show on freshly added content. */
  badge?: string;
  /** Author avatar (image source). */
  authorAvatar?: ImageSourcePropType;
  /** Author name shown under the title. */
  authorName?: string;
  /** Card size. md (≈ 280×180) is the default carousel size. */
  size?: CardSize;
  /** Press handler. */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Accessibility label override. */
  accessibilityLabel?: string;
}

const sizeMap: Record<CardSize, { w: number; h: number }> = {
  sm: { w: SCREEN_WIDTH * 0.42, h: 140 },
  md: { w: SCREEN_WIDTH * 0.62, h: 170 },
  lg: { w: SCREEN_WIDTH - spacing.lg * 2, h: 200 },
};

/**
 * Photo-led content tile. Mirrors the cards in the reference screenshots:
 * full-bleed image with rounded corners, optional lock badge bottom-end,
 * optional duration chip and "new" ribbon, and an author row below.
 */
export default function WellnessCard({
  title,
  subtitle,
  image,
  gradient = 'lavenderWash',
  locked,
  duration,
  badge,
  authorAvatar,
  authorName,
  size = 'md',
  onPress,
  style,
  accessibilityLabel,
}: WellnessCardProps) {
  const { isRTL } = useTranslation();
  const { w, h } = sizeMap[size];

  const Container: any = onPress ? TouchableOpacity : View;
  const containerProps = onPress ? { activeOpacity: 0.85, onPress } : {};

  return (
    <Container
      {...containerProps}
      style={[styles.wrapper, { width: w }, style]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? title}
    >
      <View style={[styles.media, { height: h }]}>
        {image ? (
          <ImageBackground source={image} style={styles.image} imageStyle={styles.imageInner}>
            <View style={styles.overlay} />
            <CardOverlays
              isRTL={isRTL}
              locked={locked}
              duration={duration}
              badge={badge}
            />
          </ImageBackground>
        ) : (
          <LinearGradient
            colors={
              colors.gradients[gradient] as unknown as readonly [string, string, ...string[]]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.image, styles.gradientFallback]}
          >
            <CardOverlays
              isRTL={isRTL}
              locked={locked}
              duration={duration}
              badge={badge}
            />
          </LinearGradient>
        )}
      </View>

      <View style={[styles.meta, isRTL && styles.metaRTL]}>
        <View style={styles.textBlock}>
          <Text
            style={[styles.title, isRTL ? styles.textRTL : styles.textLTR]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.subtitle, isRTL ? styles.textRTL : styles.textLTR]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
          {authorName && (
            <Text
              style={[styles.author, isRTL ? styles.textRTL : styles.textLTR]}
              numberOfLines={1}
            >
              {authorName}
            </Text>
          )}
        </View>
        {authorAvatar && (
          <View style={styles.avatarWrap}>
            <ImageBackground
              source={authorAvatar}
              style={styles.avatar}
              imageStyle={styles.avatarInner}
            />
          </View>
        )}
      </View>
    </Container>
  );
}

function CardOverlays({
  isRTL,
  locked,
  duration,
  badge,
}: {
  isRTL: boolean;
  locked?: boolean;
  duration?: string;
  badge?: string;
}) {
  return (
    <>
      {badge && (
        <View
          style={[
            styles.ribbon,
            isRTL ? styles.ribbonRTL : styles.ribbonLTR,
          ]}
        >
          <Text style={styles.ribbonText}>{badge}</Text>
        </View>
      )}
      {duration && (
        <View
          style={[
            styles.durationChip,
            isRTL ? styles.durationChipRTL : styles.durationChipLTR,
          ]}
        >
          <Ionicons name="play" size={10} color={colors.text.onPhoto} />
          <Text style={styles.durationText}>{duration}</Text>
        </View>
      )}
      {locked && (
        <View
          style={[
            styles.lockBadge,
            isRTL ? styles.lockBadgeRTL : styles.lockBadgeLTR,
          ]}
        >
          <Ionicons name="lock-closed" size={12} color={colors.text.onPhoto} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.sm,
  },
  media: {
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    ...shadows.sm,
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageInner: {
    borderRadius: borderRadius.card,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 17, 35, 0.05)',
  },
  gradientFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbon: {
    position: 'absolute',
    top: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  ribbonLTR: { left: spacing.sm },
  ribbonRTL: { right: spacing.sm },
  ribbonText: {
    ...typography.eyebrow,
    color: colors.text.inverse,
  },
  durationChip: {
    position: 'absolute',
    top: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(14, 17, 35, 0.55)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  durationChipLTR: { right: spacing.sm },
  durationChipRTL: { left: spacing.sm },
  durationText: {
    ...typography.eyebrow,
    color: colors.text.onPhoto,
  },
  lockBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: borderRadius.pill,
    backgroundColor: 'rgba(14, 17, 35, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadgeLTR: { right: spacing.sm },
  lockBadgeRTL: { left: spacing.sm },
  meta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  metaRTL: {
    flexDirection: 'row-reverse',
  },
  textBlock: {
    flex: 1,
  },
  textLTR: {
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  textRTL: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  title: {
    ...typography.cardTitle,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.cardMeta,
    color: colors.text.muted,
    marginTop: 2,
  },
  author: {
    ...typography.cardMeta,
    color: colors.text.muted,
    marginTop: 2,
  },
  avatarWrap: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.pill,
    overflow: 'hidden',
    ...shadows.sm,
  },
  avatar: { width: 32, height: 32 },
  avatarInner: { borderRadius: borderRadius.pill },
});
