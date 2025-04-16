import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { FileDown } from "lucide-react-native";

// Define types
interface ExpenseReport {
  id: string;
  head: string;
  title: string;
  amount: number;
  createdBy: string;
  submittedTo: string;
  date: string;
  approvedBy: string;
  status: "Approved" | "Rejected" | "Pending";
}

// Dummy data
const dummyData: ExpenseReport[] = [
  {
    id: "1",
    head: "Travel",
    title: "Client Meeting Travel",
    amount: 5000,
    createdBy: "John Doe",
    submittedTo: "Jane Smith",
    date: "2025-04-15",
    approvedBy: "Mike Johnson",
    status: "Approved",
  },
  // Add more dummy data as needed
];

export default function ExpenseReport() {
  // State for filters
  const [selectedHead, setSelectedHead] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showData, setShowData] = useState(false);

  // Dummy options for dropdowns
  const expenseHeads = ["Travel", "Office Supplies", "Equipment", "Other"];
  const roles = ["Manager", "Employee", "Admin"];
  const names = ["John Doe", "Jane Smith", "Mike Johnson"];

  const handleApply = () => {
    setShowData(true);
  };

  const handleReset = () => {
    setSelectedHead("");
    setSelectedRole("");
    setSelectedName("");
    setStartDate(new Date());
    setEndDate(new Date());
    setShowData(false);
  };

  const handleDownloadPDF = () => {
    // Implement PDF download logic here
    console.log("Downloading PDF...");
  };

  const renderItem = ({ item }: { item: ExpenseReport }) => (
    <View style={styles.expenseCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle}>{item.head}</Text>
        </View>
        <Text
          style={[
            styles.cardStatus,
            styles[`status${item.status}` as keyof typeof styles],
          ]}
        >
          {item.status}
        </Text>
      </View>

      <View style={styles.amountContainer}>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>₹{item.amount.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardGrid}>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Created By</Text>
          <Text style={styles.gridValue}>{item.createdBy}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Submitted To</Text>
          <Text style={styles.gridValue}>{item.submittedTo}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Date</Text>
          <Text style={styles.gridValue}>{item.date}</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Approved By</Text>
          <Text style={styles.gridValue}>{item.approvedBy}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expense Report</Text>
      </View>

      <View style={styles.filtersCard}>
        <ScrollView style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Expense Head</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedHead}
                onValueChange={setSelectedHead}
                style={styles.picker}
              >
                <Picker.Item label="Select Head" value="" />
                {expenseHeads.map((head) => (
                  <Picker.Item key={head} label={head} value={head} />
                ))}
              </Picker>
            </View>
            {/* Similar picker components for Role and Name */}
            {/* Add DateTimePicker components for start and end dates */}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.applyButton]}
              onPress={handleApply}
            >
              <Text style={styles.buttonText}>Apply</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.resetButton]}
              onPress={handleReset}
            >
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {showData && (
        <FlatList
          data={dummyData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <TouchableOpacity
        style={styles.downloadButton}
        onPress={handleDownloadPDF}
      >
        <FileDown size={24} color="#ffffff" />
        <Text style={styles.downloadButtonText}>Download PDF</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  header: {
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
  },
  filtersCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    margin: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  filtersContainer: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  applyButton: {
    backgroundColor: "#6366f1",
  },
  resetButton: {
    backgroundColor: "#64748b",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
  },
  expenseCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  amountContainer: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  amountBox: {
    flex: 1,
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 16,
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  gridItem: {
    width: "50%",
    padding: 8,
  },
  gridLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "500",
  },
  cardStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  statusApproved: {
    backgroundColor: "#dcfce7",
    color: "#15803d",
  },
  statusRejected: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
  },
  statusPending: {
    backgroundColor: "#fef3c7",
    color: "#b45309",
  },
  downloadButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#6366f1",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  downloadButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
