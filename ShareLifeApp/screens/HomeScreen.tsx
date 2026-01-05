import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { theme } from '../assets/style/theme';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();

  // Valeurs animées
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(20)).current; // pour effet SlideInUp
  const circleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Chaine d'animations
    Animated.sequence([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(buttonTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(circleOpacity, {
          toValue: 0.15,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>
        Marre de toujours tout faire ?
      </Animated.Text>

      <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
        L'impression d'en faire trop ?{'\n'}Cette appli vous permet d'équilibrer et de responsabiliser petit et grand.
      </Animated.Text>

      <Animated.View style={[styles.buttonWrapper, { transform: [{ translateY: buttonTranslateY }] }]}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Register' as never)}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Commencer</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.circle, { opacity: circleOpacity }]} />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    position: 'relative',
  },
  title: {
    fontSize: theme.typography.size.xxl,
    color: theme.colors.purple,
    fontFamily: theme.typography.fontFamily.bold,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.typography.size.md,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  buttonWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: theme.colors.purple,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    ...theme.shadows.soft,
  },
  buttonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.size.lg,
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  circle: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: theme.colors.mint,
    bottom: -width * 0.4,
    right: -width * 0.2,
  },
});
