import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomePageScreen from '../screens/HomePageScreen';
import DashboardScreen from '../screens/DashboardScreen';
import JournalScreen from '../screens/JournalScreen';
import ForumScreen from '../screens/ForumScreen';
import SupportCenterScreen from '../screens/SupportCenterScreen';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius, shadows } from '../theme/spacing';
import { useTranslation } from '../i18n';

export type BottomTabParamList = {
  HomePage: undefined;
  Dashboard: undefined;
  Journal: undefined;
  Forum: undefined;
  SupportCenter: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  // Lotus-like for Home (matches the reference vibe), other tabs use rounded outline icons.
  HomePage: { active: 'home', inactive: 'home-outline' },
  Dashboard: { active: 'stats-chart', inactive: 'stats-chart-outline' },
  Journal: { active: 'book', inactive: 'book-outline' },
  Forum: { active: 'people-circle', inactive: 'people-circle-outline' },
  SupportCenter: { active: 'heart-circle', inactive: 'heart-circle-outline' },
};

export default function BottomTabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      initialRouteName="HomePage"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.tab.activeTint,
        tabBarInactiveTintColor: colors.tab.inactiveTint,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ color, focused }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.active : icons.inactive;
          return (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Ionicons name={iconName} size={focused ? 24 : 22} color={color} />
            </View>
          );
        },
      })}
    >
     
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: t('tabs.dashboard') }}
      />
      <Tab.Screen
        name="SupportCenter"
        component={SupportCenterScreen}
        options={{ tabBarLabel: t('tabs.support') }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{ tabBarLabel: t('tabs.journal') }}
      />
      <Tab.Screen
        name="Forum"
        component={ForumScreen}
        options={{ tabBarLabel: t('tabs.community') }}
      />
 <Tab.Screen
        name="HomePage"
        component={HomePageScreen}
        options={{ tabBarLabel: t('tabs.home') }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    width: '90%', 
    alignSelf: 'center',
    alignItems: 'center',
    bottom: Platform.OS === 'ios' ? 24 : 16,
  marginLeft: 20,
    height: 64,
    paddingTop: 8,
    paddingBottom: 8,
  
    backgroundColor: 'rgba(255, 255, 255, 0.76)',
    // 2. Set borderRadius to exactly half the height for perfectly round capsule edges
    borderRadius: 32, 
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(95, 88, 88, 0.25)',
  
    shadowColor: '#1F2235',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },

tabItem: {
  height: 50,
  justifyContent: 'center',
  alignItems: 'center',
  paddingTop: 0,
},

tabLabel: {
  ...typography.caption,
  fontSize: 10,
  fontWeight: '500',
  marginTop: -2,
  backgroundColor: 'transparent',
},

iconWrapper: {
  width: 34,
  height: 28,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: borderRadius.pill,
},

iconWrapperActive: {
  backgroundColor: 'rgba(176, 153, 255, 0.18)',
},
});
