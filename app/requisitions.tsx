import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react-native';

// Define TypeScript types for requisitions
type Requisition = {
  requisition_id: string; // Unique identifier from the server
  user_name: string; // Username from the API
  requisition_title: string; // Requisition title from the API
  requisition_status: number | null; // Status (null: Pending, 0: Rejected, 1: Approved)
};

export default function Requisitions() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10; // Number of requisitions per page

  // Fetch requisitions from the API
  useEffect(() => {
    const fetchRequisitions = async () => {
      try {
        const response = await fetch(
          'http://demo-expense.geomaticxevs.in/ET-api/manage_requisitions.php'
        );
        const data = await response.json();

        if (Array.isArray(data)) {
          setRequisitions(data); // Use the data directly from the server
        } else {
          Alert.alert('Error', data.message || 'Failed to fetch requisitions');
        }
      } catch (error) {
        console.error('Error fetching requisitions:', error);
        Alert.alert(
          'Error',
          'Unable to fetch requisitions. Please try again later.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRequisitions();
  }, []);

  // Handle Approve or Reject action
  const handleAction = async (
    requisition_id: string,
    action: 'approve' | 'reject'
  ) => {
    try {
      const userId = await AsyncStorage.getItem('userid'); // Get user ID from AsyncStorage
      if (!userId) {
        Alert.alert('Error', 'User ID not found');
        return;
      }

      console.log('Requisition ID:', requisition_id);
      console.log('Action:', action);
      console.log('User ID:', userId);

      const response = await fetch(
        'http://demo-expense.geomaticxevs.in/ET-api/approve_reject_requisitions.php',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requisition_id,
            action,
            user_id: parseInt(userId, 10),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === 'success') {
        Alert.alert('Success', data.message);

        // Update the local state to reflect the changes
        setRequisitions((prevRequisitions) =>
          prevRequisitions.map((req) =>
            req.requisition_id === requisition_id
              ? {
                  ...req,
                  requisition_status: action === 'approve' ? 1 : 0, // Update status
                }
              : req
          )
        );
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      console.error('Error handling action:', error);
      Alert.alert('Error', 'Failed to process the action. Please try again.');
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(requisitions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRequisitions = requisitions.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // Render each requisition
  const renderRequisition = ({ item }: { item: Requisition }) => (
    <View style={styles.card}>
      <View style={styles.infoContainer}>
        <Text style={styles.userName}>{item.user_name}</Text>
        <Text style={styles.request}>{item.requisition_title}</Text>
        <Text
          style={[
            styles.status,
            item.requisition_status === null
              ? styles.pending
              : item.requisition_status === 1
              ? styles.approved
              : styles.rejected,
          ]}
        >
          {item.requisition_status === null
            ? 'Pending'
            : item.requisition_status === 1
            ? 'Approved'
            : 'Rejected'}
        </Text>
      </View>
      {item.requisition_status === null && (
        <View style={styles.actions}>
          <Pressable
            style={[styles.button, styles.approve]}
            onPress={() => handleAction(item.requisition_id, 'approve')}
          >
            <Check color="white" size={20} />
            <Text style={styles.buttonText}>Approve</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.reject]}
            onPress={() => handleAction(item.requisition_id, 'reject')}
          >
            <X color="white" size={20} />
            <Text style={styles.buttonText}>Reject</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E293B" />
        <Text style={styles.loadingText}>Loading requisitions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Manage Requisitions</Text>
      <FlatList
        data={paginatedRequisitions}
        renderItem={renderRequisition}
        keyExtractor={(item) => item.requisition_id}
        contentContainerStyle={styles.listContainer}
      />
      {/* Pagination Controls */}
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[
            styles.pageButton,
            currentPage === 1 && styles.pageButtonDisabled,
          ]}
          onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft
            size={20}
            color={currentPage === 1 ? '#9ca3af' : '#6366f1'}
          />
        </TouchableOpacity>
        <Text style={styles.paginationText}>
          Page {currentPage} of {totalPages}
        </Text>
        <TouchableOpacity
          style={[
            styles.pageButton,
            currentPage === totalPages && styles.pageButtonDisabled,
          ]}
          onPress={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
        >
          <ChevronRight
            size={20}
            color={currentPage === totalPages ? '#9ca3af' : '#6366f1'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 0,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 20,
  },
  listContainer: {
    gap: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  infoContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  request: {
    fontSize: 16,
    color: '#475569',
    marginVertical: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  pending: {
    color: '#D97706',
  },
  approved: {
    color: '#16A34A',
  },
  rejected: {
    color: '#DC2626',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 8,
  },
  approve: {
    backgroundColor: '#16A34A',
  },
  reject: {
    backgroundColor: '#DC2626',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#475569',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  pageButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: 16,
    color: '#1E293B',
  },
});
