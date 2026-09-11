import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  label: string;
  activeIcon: IoniconsName;
  inactiveIcon: IoniconsName;
}

const TAB_CONFIG: Record<string, TabConfig> = {
  feed: {
    label: 'Feed',
    activeIcon: 'newspaper',
    inactiveIcon: 'newspaper-outline',
  },
  discover: {
    label: 'Discover',
    activeIcon: 'compass',
    inactiveIcon: 'compass-outline',
  },
  index: {
    label: 'Habits',
    activeIcon: 'flame',
    inactiveIcon: 'flame-outline',
  },
  profile: {
    label: 'Profile',
    activeIcon: 'person-circle',
    inactiveIcon: 'person-circle-outline',
  },
  settings: {
    label: 'Settings',
    activeIcon: 'settings',
    inactiveIcon: 'settings-outline',
  },
};

interface TabItemProps {
  label: string;
  activeIcon: IoniconsName;
  inactiveIcon: IoniconsName;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

function TabItem({
  label,
  activeIcon,
  inactiveIcon,
  isFocused,
  onPress,
  onLongPress,
}: TabItemProps) {
  const iconScale = useSharedValue(isFocused ? 1.24 : 1.0);
  const iconTranslateY = useSharedValue(isFocused ? -3 : 3);
  const textTranslateY = useSharedValue(isFocused ? 0 : 8);
  const textOpacity = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    if (isFocused) {
      iconScale.value = withSpring(1.24, { damping: 12, stiffness: 220 });
      iconTranslateY.value = withSpring(-3, { damping: 14, stiffness: 220 });
      textTranslateY.value = withSpring(0, { damping: 14, stiffness: 200 });
      textOpacity.value = withTiming(1, { duration: 180 });
    } else {
      iconScale.value = withSpring(1.0, { damping: 14, stiffness: 220 });
      iconTranslateY.value = withSpring(3, { damping: 14, stiffness: 220 });
      textTranslateY.value = withTiming(8, { duration: 140 });
      textOpacity.value = withTiming(0, { duration: 120 });
    }
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { translateY: iconTranslateY.value },
    ],
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: textTranslateY.value }],
    opacity: textOpacity.value,
  }));

  const handlePress = () => {
    iconScale.value = withSequence(
      withSpring(1.36, { damping: 10, stiffness: 350 }),
      withSpring(1.24, { damping: 12, stiffness: 220 })
    );
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.iconBox, animatedIconStyle]}>
        <Ionicons
          name={isFocused ? activeIcon : inactiveIcon}
          size={22}
          color={isFocused ? '#6C5CE7' : '#9E9EB5'}
        />
      </Animated.View>

      <Animated.View style={[styles.labelContainer, animatedTextStyle]}>
        <Text style={styles.labelText} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: bottomPadding }]}>
      {state.routes.map((route: any, index: number) => {
        const config = TAB_CONFIG[route.name];
        if (!config) return null;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabItem
            key={route.key}
            label={config.label}
            activeIcon={config.activeIcon}
            inactiveIcon={config.inactiveIcon}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="feed" options={{ title: 'Feed' }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="index" options={{ title: 'Habits' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#F0EDFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
    paddingTop: 8,
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
  },
  iconBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6C5CE7',
    letterSpacing: 0.2,
  },
});
