import { useLanguage } from '../language/LanguageProvider';
import { Animated, StyleSheet, View } from 'react-native';
import { OKN_STRIPE_WIDTH, oknStripeCount } from './oknMotion';

/** @param {{position: import('react-native').Animated.Value, width: number, paused?: boolean}} props */
export function OknStripes({ position, width, paused = false }) {
  useLanguage();
  const count = oknStripeCount(width);
  const shift = Animated.subtract(Animated.modulo(position, OKN_STRIPE_WIDTH * 2), OKN_STRIPE_WIDTH * 2);
  return <View pointerEvents="none" accessible={false} style={[StyleSheet.absoluteFill, styles.clip, paused && styles.paused]}>
    <Animated.View style={[styles.bands, { width: count * OKN_STRIPE_WIDTH, transform: [{ translateX: shift }] }]}>
      {Array.from({ length: count }, (_, index) => <View key={index} style={[styles.stripe, index % 2 === 0 ? styles.light : styles.dark]} />)}
    </Animated.View>
  </View>;
}
const styles = StyleSheet.create({
  clip: { overflow: 'hidden' }, paused: { opacity: 0.22 }, bands: { position: 'absolute', left: 0, top: 0, bottom: 0, flexDirection: 'row' },
  stripe: { width: OKN_STRIPE_WIDTH }, light: { backgroundColor: '#E7EDF2' }, dark: { backgroundColor: '#16364D' },
});
