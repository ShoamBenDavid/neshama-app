  import React, { useEffect, useCallback } from 'react';
  import { createNativeStackNavigator } from '@react-navigation/native-stack';
  import { Alert } from 'react-native';

  import { useAppSelector, useAppDispatch } from '../store/hooks';
  import { sessionExpired } from '../store/slices/authSlice';
  import { onSessionExpired } from '../services/sessionManager';
  import { useTranslation } from '../i18n';
  import { colors } from '../theme/colors';

  import LoginScreen from '../screens/LoginScreen';
  import RegisterScreen from '../screens/RegisterScreen';
  import WelcomeScreen from '../screens/WelcomeScreen';

  import BottomTabNavigator, { BottomTabParamList } from './BottomTabNavigator';

  import ChatScreen from '../screens/ChatScreen';
  import ContentLibraryScreen from '../screens/ContentLibraryScreen';
  import JournalEntryScreen from '../screens/JournalEntryScreen';
  import CreateJournalScreen from '../screens/CreateJournalScreen';
  import ForumPostScreen from '../screens/ForumPostScreen';
  import CreateForumPostScreen from '../screens/CreateForumPostScreen';
  import ProfileScreen from '../screens/ProfileScreen';
  import SettingsScreen from '../screens/SettingsScreen';
  import BreathingExercisesScreen from '../screens/BreathingExercisesScreen';
  import BreathingSessionScreen from '../screens/BreathingSessionScreen';
  import MeditationLibraryScreen from '../screens/MeditationLibraryScreen';
  import MeditationSessionScreen from '../screens/MeditationSessionScreen';
  import YogaSessionsScreen from '../screens/YogaSessionsScreen';
  import YogaDetailScreen from '../screens/YogaDetailScreen';
  import ArticlesScreen from '../screens/ArticlesScreen';
  import ArticleDetailScreen from '../screens/ArticleDetailScreen';
  import AudioRelaxationScreen from '../screens/AudioRelaxationScreen';
  import NotificationOptionsScreen from '../screens/NotificationOptionsScreen';
  import PrivacySecurityScreen from '../screens/PrivacySecurityScreen';
  import HelpFAQScreen from '../screens/HelpFAQScreen';
  import AboutNeshamaScreen from '../screens/AboutNeshamaScreen';
import { NavigatorScreenParams } from '@react-navigation/native';
import type { ContentCategory } from '../content/contentRegistry';

  export type RootStackParamList = {
    Welcome: undefined;
    Login: undefined;
    Register: undefined;
    MainTabs: NavigatorScreenParams<BottomTabParamList>;
    Chat: undefined;
    ContentLibrary: { initialCategory?: ContentCategory } | undefined;
    JournalEntry: { entryId: string };
    CreateJournal: { initialMood?: number };
    ForumPost: { postId: string };
    CreateForumPost: undefined;
    Profile: undefined;
    Settings: undefined;
    NotificationOptions: undefined;
    PrivacySecurity: undefined;
    HelpFAQ: undefined;
    AboutNeshama: undefined;
    BreathingExercises: undefined;
    BreathingSession: { exerciseId: string };
    MeditationLibrary: undefined;
    MeditationSession: { sessionId: string };
    YogaSessions: undefined;
    YogaDetail: { sessionId: string };
    Articles: undefined;
    ArticleDetail: { articleId: string };
    AudioRelaxation: { trackId?: string } | undefined;
  };
  const Stack = createNativeStackNavigator<RootStackParamList>();

  function AuthNavigator() {
    return (
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
      </Stack.Navigator>
    );
  }

  function MainAppNavigator() {
    return (
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="ContentLibrary" component={ContentLibraryScreen} />
        <Stack.Screen name="JournalEntry" component={JournalEntryScreen} />
        <Stack.Screen name="CreateJournal" component={CreateJournalScreen} />
        <Stack.Screen name="ForumPost" component={ForumPostScreen} />
        <Stack.Screen name="CreateForumPost" component={CreateForumPostScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen
          name="NotificationOptions"
          component={NotificationOptionsScreen}
        />
        <Stack.Screen
          name="PrivacySecurity"
          component={PrivacySecurityScreen}
        />
        <Stack.Screen name="HelpFAQ" component={HelpFAQScreen} />
        <Stack.Screen name="AboutNeshama" component={AboutNeshamaScreen} />
        <Stack.Screen
          name="BreathingExercises"
          component={BreathingExercisesScreen}
        />
        <Stack.Screen
          name="BreathingSession"
          component={BreathingSessionScreen}
        />
        <Stack.Screen
          name="MeditationLibrary"
          component={MeditationLibraryScreen}
        />
        <Stack.Screen
          name="MeditationSession"
          component={MeditationSessionScreen}
        />
        <Stack.Screen name="YogaSessions" component={YogaSessionsScreen} />
        <Stack.Screen name="YogaDetail" component={YogaDetailScreen} />
        <Stack.Screen name="Articles" component={ArticlesScreen} />
        <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
        <Stack.Screen
          name="AudioRelaxation"
          component={AudioRelaxationScreen}
        />
      </Stack.Navigator>
    );
  }

  export default function StackNavigator() {
    const dispatch = useAppDispatch();
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const { t } = useTranslation();

    const handleSessionExpired = useCallback(() => {
      dispatch(sessionExpired());
      Alert.alert(
        t('auth.sessionExpiredTitle'),
        t('auth.sessionExpiredMessage')
      );
    }, [dispatch, t]);

    useEffect(() => {
      const unsubscribe = onSessionExpired(handleSessionExpired);
      return unsubscribe;
    }, [handleSessionExpired]);

    return isAuthenticated ? <MainAppNavigator /> : <AuthNavigator />;
  }