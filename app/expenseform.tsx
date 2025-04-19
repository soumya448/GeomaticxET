import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ScrollView,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import DropDownPicker from "react-native-dropdown-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

type ExpenseItem = {
  id: string;
  title: string;
  type: string | null;
  description: string;
  amount: number;
  remarks: string;
  billDate: string;
  billFile?: any;
  productImage?: any;
};

type UserData = {
  userId: string;
  role: string;
  firstName: string;
  middleName: string;
  lastName: string;
};

const API_BASE_URL =
  "https://demo-expense.geomaticxevs.in/ET-api/add_expense.php";

const submitExpenses = async (expenseData: any) => {
  try {
    const formData = new FormData();

    // Add basic expense data
    formData.append("expense_track_title", expenseData.expenseTitle);
    formData.append("expense_type_id", expenseData.expenseType || "");
    formData.append("expense_total_amount", expenseData.totalAmount.toString());
    formData.append("expense_track_app_rej_remarks", "");
    formData.append("expense_track_create_lat", "287190272");
    formData.append("expense_track_create_long", "88.3654656");
    formData.append("expense_track_status", "Submitted");
    formData.append("expense_track_created_by", expenseData.userId || "1");
    formData.append("expense_track_submitted_to", expenseData.submittedToName);
    formData.append("expense_track_approved_rejected_by", "0");

    // Prepare details array
    const details = expenseData.expenses.map((expense: any, index: number) => {
      const detail = {
        expense_head_id: expenseData.headValue,
        expense_product_name: expense.title || "Untitled",
        expense_product_qty: 1,
        expense_product_unit: "piece",
        expense_product_desc: expense.description,
        expense_product_sl_no: index + 1,
        expense_product_amount: expense.amount,
        expense_bill_date: expense.billDate,
      };

      // Add files if they exist
      if (expense.billFile) {
        formData.append(`expense_product_bill_photo_path[${index}]`, {
          uri: expense.billFile.uri,
          name: expense.billFile.name || `bill_${index}.pdf`,
          type: expense.billFile.mimeType || "application/pdf",
        } as any);
      }

      if (expense.productImage) {
        formData.append(`expense_product_photo_path[${index}]`, {
          uri: expense.productImage.uri,
          name: expense.productImage.name || `product_${index}.jpg`,
          type: expense.productImage.mimeType || "image/jpeg",
        } as any);
      }

      return detail;
    });

    formData.append("details", JSON.stringify(details));

    const response = await fetch(API_BASE_URL, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTPS error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error submitting expenses:", error);
    throw error;
  }
};

const fetchUserData = async (): Promise<UserData | null> => {
  try {
    // Get userId from AsyncStorage
    const userId = await AsyncStorage.getItem("userid");
    if (!userId) {
      throw new Error("User ID not found in storage");
    }

    // Fetch role from user_role_fetcher.php
    const roleResponse = await fetch(
      "https://demo-expense.geomaticxevs.in/ET-api/user_role_fetcher.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
      }
    );

    if (!roleResponse.ok) {
      throw new Error("Failed to fetch role");
    }

    const roleData = await roleResponse.json();
    if (!roleData.role_name) {
      throw new Error("Role not found");
    }

    // Fetch user details from dashboard.php
    const userResponse = await fetch(
      "https://demo-expense.geomaticxevs.in/ET-api/dashboard.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: userId }),
      }
    );

    if (!userResponse.ok) {
      throw new Error("Failed to fetch user details");
    }

    const userData = await userResponse.json();
    if (userData.status !== "success" || !userData.data) {
      throw new Error("User details not found");
    }

    return {
      userId: userId,
      role: roleData.role_name,
      firstName: userData.data.u_fname || "",
      middleName: userData.data.u_mname || "",
      lastName: userData.data.u_lname || "",
    };
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

const ExpenseDetailsPage = () => {
  const [userData, setUserData] = useState<UserData>({
    userId: "",
    role: "",
    firstName: "",
    middleName: "",
    lastName: "",
  });
  const [expenseTitle, setExpenseTitle] = useState<string>("");
  const [currentExpense, setCurrentExpense] = useState<ExpenseItem>({
    id: Math.random().toString(36).substring(7),
    title: "",
    type: null,
    description: "",
    amount: 0,
    remarks: "",
    billDate: new Date().toLocaleDateString(),
  });
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submittedToCategory, setSubmittedToCategory] = useState<string>("");
  const [submittedToName, setSubmittedToName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Dropdown states
  const [headOpen, setHeadOpen] = useState(false);
  const [headValue, setHeadValue] = useState(null);
  const [headItems, setHeadItems] = useState([
    { label: "Project Purpose", value: "Project Purpose" },
    { label: "Office Purpose", value: "Office Purpose" },
    { label: "Others", value: "Others" },
  ]);

  const [expenseTypeOpen, setExpenseTypeOpen] = useState(false);
  const [expenseType, setExpenseType] = useState<string | null>(null);
  const [expenseTypeItems, setExpenseTypeItems] = useState([
    { label: "Food", value: "Food" },
    { label: "Travel / Convence", value: "Travel / Convence" },
    { label: "Lodging", value: "Lodging" },
    { label: "Buying F.M.C Products", value: "Buying F.M.C Products" },
    { label: "Buying IT Products", value: "Buying IT Products" },
    { label: "Buying Other Materials", value: "Buying Other Materials" },
    { label: "Other", value: "Other" },
  ]);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryItems, setCategoryItems] = useState([
    { label: "Manager", value: "Manager" },
    { label: "HR", value: "HR" },
    { label: "Finance", value: "Finance" },
  ]);

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoadingUser(true);
      try {
        const data = await fetchUserData();
        if (data) {
          setUserData(data);
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
        Alert.alert("Error", "Failed to load user information");
      } finally {
        setIsLoadingUser(false);
      }
    };
    loadUserData();
  }, []);

  const handleAddExpense = () => {
    if (!expenseType) {
      Alert.alert("Error", "Please select an expense type");
      return;
    }

    if (
      !currentExpense.description ||
      !currentExpense.amount ||
      !currentExpense.remarks
    ) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    const expenseToAdd = {
      ...currentExpense,
      id: editingId || Math.random().toString(36).substring(7),
      title: expenseTitle,
      type: expenseType,
    };

    if (editingId) {
      setExpenses(
        expenses.map((exp) => (exp.id === editingId ? expenseToAdd : exp))
      );
      setEditingId(null);
    } else {
      setExpenses([...expenses, expenseToAdd]);
    }

    resetForm();
  };

  const handleEditExpense = (id: string) => {
    const expenseToEdit = expenses.find((exp) => exp.id === id);
    if (expenseToEdit) {
      setCurrentExpense(expenseToEdit);
      setExpenseTitle(expenseToEdit.title);
      setExpenseType(expenseToEdit.type);
      setEditingId(id);
    }
  };

  const handleRemoveExpense = (id: string) => {
    setExpenses(expenses.filter((exp) => exp.id !== id));
  };

  const pickBill = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
      if (!result.canceled) {
        setCurrentExpense({ ...currentExpense, billFile: result.assets[0] });
      }
    } catch (err) {
      console.error("Error picking document:", err);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const pickProductImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setCurrentExpense({
          ...currentExpense,
          productImage: result.assets[0],
        });
      }
    } catch (err) {
      console.error("Error picking image:", err);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const resetForm = () => {
    setCurrentExpense({
      id: Math.random().toString(36).substring(7),
      title: "",
      type: null,
      description: "",
      amount: 0,
      remarks: "",
      billDate: new Date().toLocaleDateString(),
    });
    setExpenseType(null);
  };

  const handleSubmitAllExpenses = async () => {
    if (expenses.length === 0) {
      Alert.alert("Error", "Please add at least one expense before submitting");
      return;
    }

    if (!headValue) {
      Alert.alert("Error", "Please select an expense head");
      return;
    }

    if (!submittedToCategory || !submittedToName) {
      Alert.alert("Error", "Please select who to submit to");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Prepare the expense track data
      const expenseTrackData = {
        expense_track_title: expenseTitle,
        expense_type_id: Number(headValue), // Convert to number
        expense_total_amount: totalAmount,
        expense_track_app_rej_remarks: "",
        expense_track_create_lat: await getLocationLatitude(), // Implement this function
        expense_track_create_long: await getLocationLongitude(), // Implement this function
        expense_track_status: 1, // 1 for submitted
        expense_track_created_by: Number(userData.userId),
        expense_track_submitted_to: Number(submittedToName),
        expense_track_approved_rejected_by: 0,
        details: expenses.map((expense, index) => ({
          expense_head_id: Number(expense.type), // Convert type to expense_head_id
          expense_product_name: expense.title,
          expense_product_qty: 1,
          expense_product_unit: "Unit",
          expense_product_desc: expense.description,
          expense_product_photo_path: "", // Will be updated with actual path
          expense_product_bill_photo_path: "", // Will be updated with actual path
          expense_product_sl_no: `SL${String(index + 1).padStart(3, "0")}`,
          expense_product_amount: expense.amount,
          expense_bill_date: expense.billDate,
        })),
      };

      // Append the JSON data
      formData.append("data", JSON.stringify(expenseTrackData));

      // Append files if they exist
      expenses.forEach((expense, index) => {
        if (expense.productImage) {
          formData.append(`expense_product_photo_path[${index}]`, {
            uri: expense.productImage.uri,
            name: `photo_${index}.jpg`,
            type: "image/jpeg",
          } as any);
        }

        if (expense.billFile) {
          formData.append(`expense_product_bill_photo_path[${index}]`, {
            uri: expense.billFile.uri,
            name: `bill_${index}.${expense.billFile.name.split(".").pop()}`,
            type: expense.billFile.mimeType,
          } as any);
        }
      });

      // Send the request
      const response = await fetch(
        "https://demo-expense.geomaticxevs.in/ET-api/add_expense.php",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (result.status === "success") {
        Alert.alert("Success", "Expenses submitted successfully!");
        // Reset form
        setExpenses([]);
        setHeadValue(null);
        setExpenseTitle("");
        setSubmittedToCategory("");
        setSubmittedToName("");
      } else {
        throw new Error(result.message || "Failed to submit expenses");
      }
    } catch (error) {
      console.error("Submission error:", error);
      Alert.alert("Error", "Failed to submit expenses. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get location
  const getLocationLatitude = async (): Promise<string> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return "0";
      }

      const location = await Location.getCurrentPositionAsync({});
      return location.coords.latitude.toString();
    } catch (error) {
      console.error("Error getting latitude:", error);
      return "0";
    }
  };

  const getLocationLongitude = async (): Promise<string> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return "0";
      }

      const location = await Location.getCurrentPositionAsync({});
      return location.coords.longitude.toString();
    } catch (error) {
      console.error("Error getting longitude:", error);
      return "0";
    }
  };

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const renderContent = () => (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContainer}
    >
      <Text style={styles.title}>Add New Expense</Text>

      {/* Personal Information Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>USER ID</Text>
          <TextInput
            style={[styles.input, { backgroundColor: "#f1f5f9" }]}
            value={userData.userId}
            editable={false}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>USER TYPE</Text>
          <TextInput
            style={[styles.input, { backgroundColor: "#f1f5f9" }]}
            value={userData.role}
            editable={false}
          />
        </View>
        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>FIRST NAME</Text>
            <TextInput
              style={[styles.input, { backgroundColor: "#f1f5f9" }]}
              value={userData.firstName}
              editable={false}
            />
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>MIDDLE NAME</Text>
            <TextInput
              style={[styles.input, { backgroundColor: "#f1f5f9" }]}
              value={userData.middleName}
              editable={false}
            />
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>LAST NAME</Text>
            <TextInput
              style={[styles.input, { backgroundColor: "#f1f5f9" }]}
              value={userData.lastName}
              editable={false}
            />
          </View>
        </View>
      </View>

      {/* Expense Details Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Expense Details</Text>
        <View style={[styles.formGroup, { zIndex: 3000 }]}>
          <Text style={styles.label}>EXPENSE HEAD *</Text>
          <DropDownPicker
            open={headOpen}
            value={headValue}
            items={headItems}
            setOpen={setHeadOpen}
            setValue={setHeadValue}
            setItems={setHeadItems}
            placeholder="Select Expense Head"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            zIndex={3000}
            zIndexInverse={1000}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>EXPENSE BILL TITLE *</Text>
          <TextInput
            style={styles.input}
            value={expenseTitle}
            onChangeText={setExpenseTitle}
            placeholder="Enter expense title"
          />
        </View>

        <View style={[styles.formGroup, { zIndex: 2000 }]}>
          <Text style={styles.label}>EXPENSE TYPE *</Text>
          <DropDownPicker
            open={expenseTypeOpen}
            value={expenseType}
            items={expenseTypeItems}
            setOpen={setExpenseTypeOpen}
            setValue={setExpenseType}
            setItems={setExpenseTypeItems}
            placeholder="Select expense type"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            zIndex={2000}
            zIndexInverse={2000}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>DESCRIPTION *</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            value={currentExpense.description}
            onChangeText={(text) =>
              setCurrentExpense({ ...currentExpense, description: text })
            }
            placeholder="Enter expense description"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>AMOUNT *</Text>
            <TextInput
              style={styles.input}
              value={
                currentExpense.amount ? currentExpense.amount.toString() : ""
              }
              onChangeText={(text) =>
                setCurrentExpense({
                  ...currentExpense,
                  amount: parseFloat(text) || 0,
                })
              }
              keyboardType="numeric"
              placeholder="0.00"
            />
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>BILL DATE *</Text>
            <TextInput
              style={styles.input}
              value={currentExpense.billDate}
              onChangeText={(text) =>
                setCurrentExpense({ ...currentExpense, billDate: text })
              }
              placeholder="YYYY-MM-DD"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>REMARKS *</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            value={currentExpense.remarks}
            onChangeText={(text) =>
              setCurrentExpense({ ...currentExpense, remarks: text })
            }
            placeholder="Enter remarks"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>EXPENSE/BILL UPLOAD</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={pickBill}>
              <Text style={styles.uploadButtonText}>Upload Bill</Text>
            </TouchableOpacity>
            {currentExpense.billFile && (
              <Text style={styles.fileNameText}>
                {currentExpense.billFile.name}
              </Text>
            )}
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>PRODUCT PICTURE</Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={pickProductImage}
            >
              <Text style={styles.uploadButtonText}>Upload Image</Text>
            </TouchableOpacity>
            {currentExpense.productImage && (
              <Image
                source={{ uri: currentExpense.productImage.uri }}
                style={styles.previewImage}
              />
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleAddExpense}
        >
          <Text style={styles.submitText}>
            {editingId ? "Update Expense" : "Add Expense"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Added Expenses Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Added Expenses</Text>
        {expenses.length === 0 ? (
          <Text style={styles.noExpenseText}>No expenses added yet</Text>
        ) : (
          expenses.map((item) => (
            <View key={item.id} style={styles.expenseItem}>
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseTitle}>
                  {item.title || "Untitled"}
                </Text>
                <Text style={styles.expenseSubtitle}>
                  {item.type} - ₹{item.amount?.toFixed(2)}
                </Text>
                {item.description && (
                  <Text style={styles.expenseDescription}>
                    {item.description}
                  </Text>
                )}
              </View>
              <View style={styles.expenseActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEditExpense(item.id)}
                >
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.removeButton]}
                  onPress={() => handleRemoveExpense(item.id)}
                >
                  <Text style={styles.buttonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={styles.totalSection}>
          <Text style={styles.totalText}>
            Total Amount: ₹{totalAmount.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Submit To Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Submit To</Text>
        <View style={[styles.formGroup, { zIndex: 1000 }]}>
          <Text style={styles.label}>CATEGORY *</Text>
          <DropDownPicker
            open={categoryOpen}
            value={submittedToCategory}
            items={categoryItems}
            setOpen={setCategoryOpen}
            setValue={setSubmittedToCategory}
            setItems={setCategoryItems}
            placeholder="Select category"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            zIndex={1000}
            zIndexInverse={3000}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>NAME *</Text>
          <TextInput
            style={styles.input}
            value={submittedToName}
            onChangeText={setSubmittedToName}
            placeholder="Select name"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          { opacity: expenses.length === 0 || isSubmitting ? 0.5 : 1 },
        ]}
        onPress={handleSubmitAllExpenses}
        disabled={expenses.length === 0 || isSubmitting}
      >
        <Text style={styles.submitText}>
          {isSubmitting ? "Submitting..." : "Submit All Expenses"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 50 }}
      data={[{}]}
      keyExtractor={() => "key"}
      renderItem={renderContent}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={isLoadingUser}
          onRefresh={() => {
            const loadUserData = async () => {
              setIsLoadingUser(true);
              try {
                const data = await fetchUserData();
                if (data) {
                  setUserData(data);
                }
              } catch (error) {
                console.error("Failed to refresh user data:", error);
              } finally {
                setIsLoadingUser(false);
              }
            };
            loadUserData();
          }}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 24,
    textAlign: "center",
  },
  sectionContainer: {
    marginBottom: 24,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    fontSize: 16,
    color: "#1e293b",
  },
  textArea: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    height: 100,
    textAlignVertical: "top",
    fontSize: 16,
    color: "#1e293b",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  dropdown: {
    backgroundColor: "white",
    borderColor: "#e2e8f0",
    borderRadius: 8,
  },
  dropdownContainer: {
    borderColor: "#e2e8f0",
    borderRadius: 8,
  },
  uploadButton: {
    backgroundColor: "#6366f1",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  uploadButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  fileNameText: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748b",
  },
  previewImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    marginTop: 8,
  },
  expenseItem: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  expenseSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  expenseDescription: {
    fontSize: 14,
    color: "#475569",
  },
  expenseActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: "#2196F3",
  },
  removeButton: {
    backgroundColor: "#f44336",
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  totalSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  totalText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "right",
  },
  noExpenseText: {
    color: "#64748b",
    textAlign: "center",
    padding: 16,
  },
  submitButton: {
    backgroundColor: "#6366f1",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  submitText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ExpenseDetailsPage;
