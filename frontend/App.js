import { useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
} from '@expo-google-fonts/playfair-display';

import HomeScreen from './src/screens/HomeScreen';
import ClosetScreen from './src/screens/ClosetScreen';
import ItemDetailScreen from './src/screens/ItemDetailScreen';
import UploadScreen from './src/screens/UploadScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import OutfitScreen from './src/screens/OutfitScreen';
import SavedOutfitsScreen from './src/screens/SavedOutfitsScreen';
import { colors, type } from './src/constants/theme';

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ClosetStack = createNativeStackNavigator();
const AddStack = createNativeStackNavigator();
const OutfitStack = createNativeStackNavigator();
const SavedStack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.background,
    text: colors.ink,
    border: colors.border,
    primary: colors.accent,
  },
};

const stackOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerShadowVisible: false,
  // Serif nav titles are what make even a plain header row read editorial.
  headerTitleStyle: { ...type.title, fontSize: 18, color: colors.ink },
  headerTintColor: colors.accent,
  contentStyle: { backgroundColor: colors.background },
};

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={stackOptions}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    </HomeStack.Navigator>
  );
}

function ClosetStackScreen() {
  return (
    <ClosetStack.Navigator screenOptions={stackOptions}>
      <ClosetStack.Screen name="Closet" component={ClosetScreen} options={{ title: 'My Closet' }} />
      <ClosetStack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ title: 'Item' }} />
    </ClosetStack.Navigator>
  );
}

function AddStackScreen() {
  return (
    <AddStack.Navigator screenOptions={stackOptions}>
      <AddStack.Screen name="Upload" component={UploadScreen} options={{ title: 'Add Items' }} />
      <AddStack.Screen
        name="Review"
        component={ReviewScreen}
        options={{ title: 'Review', headerBackVisible: false }}
      />
      <AddStack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ title: 'Item' }} />
    </AddStack.Navigator>
  );
}

function OutfitStackScreen() {
  return (
    <OutfitStack.Navigator screenOptions={stackOptions}>
      <OutfitStack.Screen name="Outfit" component={OutfitScreen} options={{ title: 'Generate' }} />
    </OutfitStack.Navigator>
  );
}

function SavedStackScreen() {
  return (
    <SavedStack.Navigator screenOptions={stackOptions}>
      <SavedStack.Screen name="Saved" component={SavedOutfitsScreen} options={{ title: 'Saved Outfits' }} />
    </SavedStack.Navigator>
  );
}

const TAB_ICONS = {
  HomeTab: ['home', 'home-outline'],
  ClosetTab: ['grid', 'grid-outline'],
  AddTab: ['add-circle', 'add-circle-outline'],
  OutfitsTab: ['sparkles', 'sparkles-outline'],
  SavedTab: ['heart', 'heart-outline'],
};

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_400Regular_Italic,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // Every heading in the app uses the serif font, so nothing should render
  // until it's actually loaded — otherwise the first frame flashes in the
  // system font and re-flows once Playfair swaps in.
  if (!fontsLoaded) return null;

  return (
    <NavigationContainer theme={navTheme} onReady={onLayoutRootView}>
      <Tab.Navigator
        initialRouteName="HomeTab"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.inkFaint,
          tabBarLabelStyle: { ...type.label, fontSize: 9.5, letterSpacing: 0.4 },
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            height: 84,
            paddingTop: 8,
            paddingBottom: 26,
          },
          tabBarIcon: ({ focused, color, size }) => {
            const [active, inactive] = TAB_ICONS[route.name];
            return <Ionicons name={focused ? active : inactive} size={size - 3} color={color} />;
          },
        })}
      >
        <Tab.Screen name="HomeTab" component={HomeStackScreen} options={{ title: 'Home' }} />
        <Tab.Screen name="ClosetTab" component={ClosetStackScreen} options={{ title: 'Closet' }} />
        <Tab.Screen name="AddTab" component={AddStackScreen} options={{ title: 'Add' }} />
        <Tab.Screen name="OutfitsTab" component={OutfitStackScreen} options={{ title: 'Generate' }} />
        <Tab.Screen name="SavedTab" component={SavedStackScreen} options={{ title: 'Saved' }} />
      </Tab.Navigator>
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}
