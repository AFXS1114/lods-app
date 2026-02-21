import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";

// Custom Drawer Component
import CustomDrawer from "./CustomDrawer";

// Screens
import CreateOrderScreen from "../screens/CreateOrderScreen";
import CustomerHomeScreen from "../screens/CustomerHomeScreen";
import CustomerProfileScreen from "../screens/CustomerProfileScreen";
import LoginScreen from "../screens/LoginScreen";
import ManagerDashboardScreen from "../screens/ManagerDashboardScreen";
import ManageRiderScreen from "../screens/ManageRiderScreen";
import OrderMasterScreen from "../screens/OrderMasterScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ReportsScreen from "../screens/ReportsScreen";
import RiderHomeScreen from "../screens/RiderHomeScreen";

// Theme
import { COLORS } from "../styles/theme";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// 🛠️ MANAGER DRAWER (NEW)
function ManagerDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#FF3D00' }, 
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        drawerActiveTintColor: '#FF3D00',
      }}
    >
      {/* 1. Dashboard (The Stats you see now) */}
      <Drawer.Screen 
        name="ManagerHome" 
        component={ManagerDashboardScreen} 
        options={{ title: "🏠 Operational Stats" }} 
      />

      {/* 2. Management (Adding/Removing Riders) */}
      <Drawer.Screen 
        name="ManageRiders" 
        component={ManageRiderScreen} 
        options={{ title: "🏍️ Manage Riders" }} 
      />

      {/* 3. Analytics (Sales & Performance Reports) */}
      <Drawer.Screen 
        name="Reports" 
        component={ReportsScreen} 
        options={{ title: "📈 Business Reports" }} 
      />
      
      {/* 4. Order History (Master List) */}
      <Drawer.Screen 
        name="OrderMaster" 
        component={OrderMasterScreen} 
        options={{ title: "📦 All Order History" }} 
      />
    </Drawer.Navigator>
  );
}

// 🛍️ CUSTOMER DRAWER (REFINED - Removed ManageRider)
function CustomerDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        drawerActiveTintColor: COLORS.primary,
      }}
    >
      <Drawer.Screen 
        name="CustomerProfile" 
        component={CustomerProfileScreen} 
        options={{ title: "My Profile" }} 
      />
     <Drawer.Screen 
        name="CustomerHome" 
        component={CustomerHomeScreen} 
        options={{ title: "My Orders" }} 
      />
    </Drawer.Navigator>

  );
}

// 🏍️ RIDER DRAWER (SAME)
function RiderDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        drawerActiveTintColor: COLORS.primary,
      }}
    >
      <Drawer.Screen 
        name="RiderHome" 
        component={RiderHomeScreen} 
        options={{ title: "Available Deliveries" }} 
      />
    </Drawer.Navigator>
  );
}

// 🔵 MAIN NAVIGATOR
export default function AppNavigator({ user, role }) {
  
  if (user && role === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Create Account" }} />
          </>
        ) : (
          <>
            {/* 🛡️ ROLE-BASED REDIRECTION */}
            {role === "manager" ? (
              <Stack.Screen 
                name="MainDrawer" 
                component={ManagerDrawerNavigator} 
                options={{ headerShown: false }} 
              />
            ) : role === "rider" ? (
              <Stack.Screen 
                name="MainDrawer" 
                component={RiderDrawerNavigator} 
                options={{ headerShown: false }} 
              />
            ) : (
              <>
                <Stack.Screen 
                  name="MainDrawer" 
                  component={CustomerDrawerNavigator} 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="CreateOrder" 
                  component={CreateOrderScreen} 
                  options={{ title: "New Order" }} 
                />
                   <Stack.Screen 
                  name="MyOrders" 
                  component={CustomerHomeScreen} 
                  options={{ title: "My Orders" }} 
                />
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}