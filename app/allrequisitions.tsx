import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Dimensions,
} from "react-native";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react-native";
import { Picker } from "@react-native-picker/picker";

const { width } = Dimensions.get("window"); // Get the screen width

// Define status types
type RequisitionStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Suspended"
  | "Unattended"
  | "Partially Approved";

// Interface for the raw API response
interface ApiRequisitionResponse {
  requisition_id: string;
  requisition_title: string;
  requisition_type: number;
  requisition_date: string;
  requisition_comment: string;
  requisition_status: number | null;
  requisition_created_by: number;
  requisition_created_at: string;
  requisition_updated_at: string;
  created_by_full_name: string;
}

// Interface for our transformed requisition data
interface Requisition {
  id: string;
  requisition_id: string;
  employee: string;
  requisition_title: string;
  requisition_type: string;
  requisition_date: string;
  requisition_status: RequisitionStatus;
  requisition_comment: string;
}

export default function AllRequisitions() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<
    RequisitionStatus | "All"
  >("All");
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false); // State to toggle dropdown visibility
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Helper function to format date
  const formatDate = useCallback((dateString: string): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Helper function to map requisition types
  const getRequisitionType = useCallback((typeCode: number): string => {
    switch (typeCode) {
      case 0:
        return "Office Supplies";
      case 1:
        return "Travel Request";
      case 2:
        return "Equipment Purchase";
      default:
        return "Other";
    }
  }, []);

  // Helper function to map status
  const getStatus = useCallback(
    (statusCode: number | null): RequisitionStatus => {
      if (statusCode === null) return "Unattended";
      switch (statusCode) {
        case 0:
          return "Rejected";
        case 1:
          return "Approved";
        case 2:
          return "Partially Approved";
        case 3:
          return "Pending";
        default:
          return "Unattended";
      }
    },
    []
  );

  // Data transformer function
  const transformRequisitionData = useCallback(
    (apiData: ApiRequisitionResponse[]): Requisition[] => {
      return apiData.map((item) => ({
        id: item.requisition_id.toString(),
        requisition_id: item.requisition_id,
        employee: item.created_by_full_name,
        requisition_title: item.requisition_title,
        requisition_type: getRequisitionType(item.requisition_type),
        requisition_date: formatDate(item.requisition_date),
        requisition_status: getStatus(item.requisition_status),
        requisition_comment: item.requisition_comment || "No comments",
      }));
    },
    [formatDate, getRequisitionType, getStatus]
  );

  // Fetch data from PHP endpoint
  const fetchRequisitions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/all-requisition.php",
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Expected JSON but got: ${text.substring(0, 50)}...`);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiData: ApiRequisitionResponse[] = await response.json();
      console.log("Requisitions:", apiData);
      const transformedData = transformRequisitionData(apiData);
      setRequisitions(transformedData);
    } catch (err) {
      console.error("Error fetching requisitions:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch requisitions"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [transformRequisitionData]);

  // Initial data fetch
  useEffect(() => {
    fetchRequisitions();
  }, [fetchRequisitions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequisitions();
  }, [fetchRequisitions]);

  // Filter requisitions based on search and status
  const filteredRequisitions = useCallback(() => {
    return requisitions.filter((requisition) => {
      const matchesSearch =
        requisition.employee
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        requisition.requisition_title
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        requisition.requisition_comment
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === "All" ||
        requisition.requisition_status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [requisitions, searchQuery, selectedStatus]);

  const paginatedRequisitions = useCallback(() => {
    const filtered = filteredRequisitions();
    const startIndex = (currentPage - 1) * 10;
    const endIndex = startIndex + 10;
    return filtered.slice(startIndex, endIndex);
  }, [filteredRequisitions, currentPage]);

  useEffect(() => {
    const filtered = filteredRequisitions();
    setTotalPages(Math.ceil(filtered.length / 10));
    setCurrentPage(1); // Reset to first page when filters change
  }, [filteredRequisitions]);

  const getStatusColor = useCallback((status: RequisitionStatus) => {
    switch (status) {
      case "Approved":
        return "#10b981";
      case "Pending":
        return "#f59e0b";
      case "Rejected":
        return "#ef4444";
      case "Suspended":
        return "#8b5cf6";
      case "Unattended":
        return "#64748b";
      case "Partially Approved":
        return "#fbbf24"; // Yellow for partially approved
      default:
        return "#64748b";
    }
  }, []);

  const renderRequisitionItem = useCallback(
    ({ item }: { item: Requisition }) => (
      <View style={styles.requisitionCard}>
        <View style={styles.requisitionHeader}>
          <Text style={styles.employeeName}>{item.employee}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.requisition_status) },
            ]}
          >
            <Text style={styles.statusText}>{item.requisition_status}</Text>
          </View>
        </View>
        <View style={styles.requisitionDetails}>
          <Text style={styles.requisitionType}>{item.requisition_title}</Text>
          <Text style={styles.dates}>{item.requisition_date}</Text>
        </View>
        <Text style={styles.comment}>Comment: {item.requisition_comment}</Text>
      </View>
    ),
    [getStatusColor]
  );

  const handleFilterSelect = (status: typeof selectedStatus) => {
    setSelectedStatus(status);
    setCurrentPage(1); // Reset to first page when filtering
    setShowFilterDropdown(false); // Close the dropdown after selection
  };

  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
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
            color={currentPage === 1 ? "#9ca3af" : "#6366f1"}
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
            color={currentPage === totalPages ? "#9ca3af" : "#6366f1"}
          />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && requisitions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchRequisitions}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!loading && requisitions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No requisitions found</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchRequisitions}
        >
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search requisitions..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setCurrentPage(1); // Reset to first page when searching
            }}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterDropdown(!showFilterDropdown)} // Toggle dropdown visibility
        >
          <Filter size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Filter Dropdown */}
      {showFilterDropdown && (
        <View style={styles.dropdown}>
          <TouchableOpacity
            onPress={() => handleFilterSelect("All")}
            style={styles.dropdownItem}
          >
            <Text style={styles.dropdownText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleFilterSelect("Unattended")}
            style={styles.dropdownItem}
          >
            <Text style={styles.dropdownText}>Unattended</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleFilterSelect("Rejected")}
            style={styles.dropdownItem}
          >
            <Text style={styles.dropdownText}>Rejected</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleFilterSelect("Approved")}
            style={styles.dropdownItem}
          >
            <Text style={styles.dropdownText}>Approved</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleFilterSelect("Partially Approved")}
            style={styles.dropdownItem}
          >
            <Text style={styles.dropdownText}>Partially Approved</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleFilterSelect("Pending")}
            style={styles.dropdownItem}
          >
            <Text style={styles.dropdownText}>Pending</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={paginatedRequisitions()}
        renderItem={renderRequisitionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#6366f1"]}
          />
        }
      />
      <PaginationControls />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
    paddingTop: 5,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#ef4444",
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#6366f1",
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#64748b",
  },
  searchContainer: {
    width: "95%",
    position: "relative",
    flexDirection: "row",
    padding: 10,
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 1,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  dropdown: {
    position: "absolute",
    top: 70,
    right: 16,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  dropdownText: {
    fontSize: 16,
    color: "#1f2937",
  },
  filterTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 8,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
  },
  filterTabActive: {
    backgroundColor: "#6366f1",
  },
  filterTabText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "500",
  },
  filterTabTextActive: {
    color: "white",
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  requisitionCard: {
    width: width * 0.9, // Use 90% of the screen width
    alignSelf: "center", // Center the card horizontally
    backgroundColor: "white",
    borderRadius: 12, // Slightly larger border radius for a modern look
    padding: 16, // Consistent padding for content
    marginBottom: 12, // Add spacing between cards
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 5,
  },
  requisitionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  requisitionDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  requisitionType: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  employeeName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  comment: {
    fontSize: 14,
    color: "#475569",
    fontStyle: "italic",
    marginBottom: 4,
  },
  dates: {
    fontSize: 16,
    color: "#64748b",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    paddingBottom: 10,
  },
  pageButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 10,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: 16,
    color: "#1E293B",
  },
});
