import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { navigateToPath } from './webRouter';

type NavigationKey = 'home' | 'meals' | 'progress' | 'profile';

type BottomNavigationProps = {
  active: NavigationKey;
};

const items: Array<{ key: NavigationKey; label: string; icon: string; enabled: boolean }> = [
  { key: 'home', label: 'Home', icon: '⌂', enabled: true },
  { key: 'meals', label: 'Meals', icon: '▤', enabled: true },
  { key: 'progress', label: 'Progress', icon: '▥', enabled: false },
  { key: 'profile', label: 'Profile', icon: '●', enabled: false },
];

export function BottomNavigation({ active }: BottomNavigationProps) {
  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <View style={styles.shell}>
        {items.map((item) => {
          const isActive = item.key === active;
          const onPress = item.key === 'home'
            ? () => navigateToPath('/home')
            : item.key === 'meals'
              ? () => navigateToPath('/meals')
              : undefined;

          return (
            <Pressable
              accessibilityLabel={item.enabled ? item.label : `${item.label}, coming soon`}
              accessibilityRole="button"
              accessibilityState={{ disabled: !item.enabled, selected: isActive }}
              disabled={!item.enabled}
              key={item.key}
              onPress={onPress}
              style={({ pressed }) => [
                styles.item,
                isActive && styles.activeItem,
                !item.enabled && styles.disabledItem,
                pressed && styles.pressed,
              ]}
            >
              {item.key === 'home' ? (
                <Image source={require('../../assets/images/home_icon.png')} style={styles.imageIcon} />
              ) : item.key === 'meals' ? (
                <Image source={require('../../assets/images/meal_icon.png')} style={styles.imageIcon} />
              ) : (
                <Text style={[styles.icon, isActive && styles.activeIcon]}>{item.icon}</Text>
              )}
              {isActive ? <Text style={styles.activeLabel}>{item.label}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    bottom: 12,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  shell: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#202020',
    borderRadius: 30,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'space-between',
    marginHorizontal: 0,
    maxWidth: 390,
    padding: 7,
    width: '92%',
  },
  item: {
    alignItems: 'center',
    borderRadius: 24,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 10,
  },
  activeItem: { backgroundColor: colors.white },
  disabledItem: { opacity: 0.48 },
  icon: { color: '#D0D0D0', fontSize: 20, fontWeight: '700', lineHeight: 22 },
  imageIcon: { height: 24, width: 24 },
  activeIcon: { color: colors.ink },
  activeLabel: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  pressed: { opacity: 0.78 },
});
