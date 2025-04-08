import React, { useState, useEffect } from 'react';
import { Drawer } from 'expo-router/drawer';
// import { SafeAreaView } from 'react-native';
import { usePathname } from 'expo-router'; // Correct import location
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Navbar from './navbar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ChevronDown,
  ChevronUp,
  Home,
  User,
  Settings,
  Bell,
  Calendar,
  Users,
  FileText,
  DollarSign,
  ShoppingCart,
} from 'lucide-react-native';

// Define navigation types
type RootStackParamList = {
  '(tabs)': undefined;
  attendance: undefined;
  users: undefined;
  leavedashboard: undefined;
  'apply-leave': undefined;
  'my-leaves': undefined;
  'all-leaves': undefined;
  expenseform: undefined;
  userattendance: undefined;
  expensedetails: undefined;
  addrequisition: undefined;
  requisitions: undefined;
  allrequisitions: undefined;
  'manage-leaves': undefined;
  'my-requisitions': undefined;
  allexpense: undefined; // Added this line
};

// Define expanded state type
interface ExpandedState {
  attendance: boolean;
  users: boolean;
  leave: boolean;
  expenses: boolean;
  requisition: boolean;
}

// Custom Drawer Component
const CustomDrawerContent = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [roleId, setRoleId] = useState<number | null>(null);

  // Add useEffect to fetch roleId
  useEffect(() => {
    const fetchRoleId = async () => {
      try {
        const storedRoleId = await AsyncStorage.getItem('roleId');
        setRoleId(storedRoleId ? parseInt(storedRoleId, 10) : null);
      } catch (error) {
        console.error('Error fetching roleId:', error);
      }
    };

    fetchRoleId();
  }, []);

  // Add helper function to check permissions
  const hasManagerPermissions = roleId !== null && (roleId < 5 || roleId === 8);

  // State for expand/collapse
  const [expanded, setExpanded] = useState<ExpandedState>({
    attendance: false,
    users: false,
    leave: false,
    expenses: false,
    requisition: false,
  });

  // Animated values for height
  const attendanceHeight = useState(new Animated.Value(0))[0];
  const usersHeight = useState(new Animated.Value(0))[0];
  const leaveHeight = useState(new Animated.Value(0))[0];
  const expensesHeight = useState(new Animated.Value(0))[0];
  const requisitionHeight = useState(new Animated.Value(0))[0];

  // Update the toggleSection function to use dynamic subsection counts
  const toggleSection = (section: keyof ExpandedState) => {
    const newExpanded = !expanded[section];
    setExpanded({ ...expanded, [section]: newExpanded });

    // Calculate height based on the number of visible subsections
    const subsectionCount = {
      attendance: 1, // Always 2 items
      users: 1, // Always 1 item
      leave: hasManagerPermissions ? 4 : 2, // 4 items for managers, 2 for others
      expenses: hasManagerPermissions ? 3 : 2, // 3 items for managers, 2 for others
      requisition: hasManagerPermissions ? 4 : 2, // 4 items for managers, 2 for others
    }[section];

    const heightValue = newExpanded ? subsectionCount * 40 : 0;

    Animated.timing(
      section === 'attendance'
        ? attendanceHeight
        : section === 'users'
        ? usersHeight
        : section === 'leave'
        ? leaveHeight
        : section === 'expenses'
        ? expensesHeight
        : requisitionHeight,
      {
        toValue: heightValue,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false,
      }
    ).start();
  };

  return (
    <ScrollView style={styles.drawerContainer}>
      {/* Logo at the top */}
      <Image
        source={require('../assets/images/geomaticx_logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Group 1: Dashboard */}
      <TouchableOpacity
        style={styles.groupHeader}
        onPress={() => navigation.navigate('(tabs)')}
      >
        <Home size={20} color="#1f2937" style={styles.icon} />
        <Text style={styles.groupHeaderText}>Dashboard</Text>
      </TouchableOpacity>

      {/* Group 2: Manage Attendance */}
      <View style={styles.group}>
        <TouchableOpacity
          style={styles.groupHeader}
          onPress={() => toggleSection('attendance')}
        >
          <Calendar size={20} color="#1f2937" style={styles.icon} />
          <Text style={styles.groupHeaderText}>Manage Attendance</Text>
          {expanded.attendance ? (
            <ChevronUp size={20} color="#1f2937" style={styles.arrowIcon} />
          ) : (
            <ChevronDown size={20} color="#1f2937" style={styles.arrowIcon} />
          )}
        </TouchableOpacity>
        <Animated.View style={{ height: attendanceHeight, overflow: 'hidden' }}>
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => navigation.navigate('attendance')}
          >
            <Text style={styles.sub}>My Attendance</Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={{ height: attendanceHeight, overflow: 'hidden' }}>
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => navigation.navigate('userattendance')}
          >
            <Text style={styles.sub}>User Attendance</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Group 3: Manage Users */}
      {/* <View style={styles.group}>
        <TouchableOpacity
          style={styles.groupHeader}
          onPress={() => toggleSection('users')}
        >
          <Users size={20} color="#1f2937" style={styles.icon} />
          <Text style={styles.groupHeaderText}>Manage Users</Text>
          {expanded.users ? (
            <ChevronUp size={20} color="#1f2937" style={styles.arrowIcon} />
          ) : (
            <ChevronDown size={20} color="#1f2937" style={styles.arrowIcon} />
          )}
        </TouchableOpacity>
        <Animated.View style={{ height: usersHeight, overflow: 'hidden' }}>
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => navigation.navigate('users')}
          >
            <Text style={styles.sub}>All Users</Text>
          </TouchableOpacity>
        </Animated.View>
      </View> */}

      {/* Group 4: Manage Leave */}
      <View style={styles.group}>
        <TouchableOpacity
          style={styles.groupHeader}
          onPress={() => toggleSection('leave')}
        >
          <FileText size={20} color="#1f2937" style={styles.icon} />
          <Text style={styles.groupHeaderText}>Manage Leave</Text>
          {expanded.leave ? (
            <ChevronUp size={20} color="#1f2937" style={styles.arrowIcon} />
          ) : (
            <ChevronDown size={20} color="#1f2937" style={styles.arrowIcon} />
          )}
        </TouchableOpacity>
        <Animated.View style={{ height: leaveHeight, overflow: 'hidden' }}>
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => navigation.navigate('apply-leave')}
          >
            <Text style={styles.sub}>Add Leave</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => navigation.navigate('my-leaves')}
          >
            <Text style={styles.sub}>My Leaves</Text>
          </TouchableOpacity>
          {hasManagerPermissions && (
            <>
              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => navigation.navigate('all-leaves')}
              >
                <Text style={styles.sub}>All Leaves</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => navigation.navigate('manage-leaves')}
              >
                <Text style={styles.sub}>Manage Leaves</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </View>

      {/* Group 5: My Expenses */}
      <View style={styles.group}>
        <TouchableOpacity
          style={styles.groupHeader}
          onPress={() => toggleSection('expenses')}
        >
          <DollarSign size={20} color="#1f2937" style={styles.icon} />
          <Text style={styles.groupHeaderText}>My Expenses</Text>
          {expanded.expenses ? (
            <ChevronUp size={20} color="#1f2937" style={styles.arrowIcon} />
          ) : (
            <ChevronDown size={20} color="#1f2937" style={styles.arrowIcon} />
          )}
        </TouchableOpacity>
        <Animated.View style={{ height: expensesHeight, overflow: 'hidden' }}>
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => navigation.navigate('expenseform')}
          >
            <Text style={styles.sub}>Add Expenses</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => navigation.navigate('expensedetails')}
          >
            <Text style={styles.sub}>My Expenses</Text>
          </TouchableOpacity>
          {hasManagerPermissions && (
            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => navigation.navigate('allexpense')}
            >
              <Text style={styles.sub}>All Expenses</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>

      {/* Group 6: Requisition */}
      <View style={styles.group}>
        <TouchableOpacity
          style={styles.groupHeader}
          onPress={() => toggleSection('requisition')}
        >
          <ShoppingCart size={20} color="#1f2937" style={styles.icon} />
          <Text style={styles.groupHeaderText}>Requisition</Text>
          {expanded.requisition ? (
            <ChevronUp size={20} color="#1f2937" style={styles.arrowIcon} />
          ) : (
            <ChevronDown size={20} color="#1f2937" style={styles.arrowIcon} />
          )}
        </TouchableOpacity>
        <Animated.View
          style={{ height: requisitionHeight, overflow: 'hidden' }}
        >
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => navigation.navigate('addrequisition')}
          >
            <Text style={styles.sub}>Add Requisition</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => navigation.navigate('my-requisitions')}
          >
            <Text style={styles.sub}>My Requisitions</Text>
          </TouchableOpacity>
          {hasManagerPermissions && (
            <>
              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => navigation.navigate('allrequisitions')}
              >
                <Text style={styles.sub}>All Requisitions</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => navigation.navigate('requisitions')}
              >
                <Text style={styles.sub}>Manage Requisitions</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </View>
    </ScrollView>
  );
};

// Update the RootLayout component
export default function RootLayout() {
  useFrameworkReady();
  const pathname = usePathname();
  const isLoginScreen = pathname === '/';
  const [key, setKey] = useState(0);

  // Add effect to check for new login
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const lastLoginTime = await AsyncStorage.getItem('lastLoginTime');
        const currentLoginTime = await AsyncStorage.getItem('currentLoginTime');

        if (lastLoginTime !== currentLoginTime && currentLoginTime) {
          // Update last login time
          await AsyncStorage.setItem('lastLoginTime', currentLoginTime);
          // Force re-render
          setKey((prev) => prev + 1);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      }
    };

    if (!isLoginScreen) {
      checkLoginStatus();
    }
  }, [isLoginScreen]);

  return (
    <Drawer
      key={key} // Force re-render when key changes
      drawerContent={() => <CustomDrawerContent />}
      screenOptions={{
        header: () => !isLoginScreen && <Navbar />,
        drawerStyle: {
          width: 300,
        },
        swipeEnabled: !isLoginScreen,
      }}
    >
      <Drawer.Screen
        name="index" // Login screen
        options={{
          drawerItemStyle: { display: 'none' },
          swipeEnabled: false,
        }}
      />
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="my-attendance"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="all-users"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="leave-dashboard"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="add-leave"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="my-leave"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="all-leaves"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="add-expenses"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="my-expenses"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="add-requisition"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="requested-requisition"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="all-requisition"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="+not-found"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
  },
  logo: {
    width: '100%',
    height: 80,
    marginBottom: 20,
    marginTop: 40,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  groupHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 10,
  },
  group: {
    marginTop: 10,
  },
  drawerItem: {
    paddingVertical: 10,
    paddingLeft: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sub: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  icon: {
    marginRight: 10,
  },
  arrowIcon: {
    marginLeft: 'auto',
  },
});
