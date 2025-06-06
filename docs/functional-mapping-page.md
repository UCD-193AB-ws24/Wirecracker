# **Functional Test Selection Tool**

## **Overview**

This tool enables clinicians to select and manage functional mapping tests for marked electrode contacts. It provides test recommendations based on anatomical location and clinical evidence.

## **Key Features**

* Automated test recommendations
* Manual test selection interface
* Test performance metrics visualization
* Detailed test information
* Save/export capabilities

## **Interface Layout**

### **Main Components**

1. **Contact List**:
   * Displays all contacts with their stimulation parameters
   * Shows assigned tests for each contact
   * Organized by electrode and contact number
2. **Test Management Area**:
   * Shows currently assigned tests
   * Allows test removal
   * Provides test details on demand
3. **Action Buttons**:
   * Auto-Assign (applies best tests automatically)
   * Save (stores to database)
   * Export (generates CSV file)
4. **Test Selection Popup**:
   * Appears when adding tests
   * Shows available tests filtered by contact location
   * Displays detailed test information

## **Getting Started**

### **Loading Data**

The tool automatically loads:

* Saved state (if available)
* Initial data (if provided)
* Demo data (if no patient data exists)

## **Using the Tool**

### **Auto-Assigning Tests**

1. Click "Auto-Assign Best Tests" button
2. System automatically:
   * Matches tests to contacts based on anatomical location
   * Selects tests with highest population evidence and disruption rates
   * Assigns one test per contact

### **Manual Test Assignment**

1. **For a specific contact**:
   * Click "+ Add Test" button below the contact
   * Test selection popup will appear
2. **In the test selection popup**:
   * Browse available tests (filtered by contact location)
   * Click on a test to select it
   * Click test name again to view details
   * Click "Confirm" to assign the test

### **Viewing Test Details**

* **Basic Info**: Always visible in test cards
  * Test name
  * Tags/categories
  * Population size
  * Disruption rate percentage
* **Expanded Details**:
  * Click on an assigned test to expand
  * Shows full description
  * Includes "More Details" link (opens in new tab)

### **Managing Assigned Tests**

1. **Remove a test**:
   * Click the "×" button on the test card
   * Test is immediately removed
2. **Reorder tests**:
   * Currently tests display in assignment order
   * Manual reordering not implemented in this version

## **Saving and Exporting**

### **Saving Work**

Click "Save" button to save the work on the database

### **Exporting Data**

Click "Export" button to generate and download CSV file

*  This will save the data on the database as well

## **Data Interpretation**

* **Population**: Number of cases supporting this test
* **Disruption Rate**: Percentage showing functional effect
* **Tags**: Test categories (e.g., motor, language)

## **Troubleshooting**

### **Common Issues**

**No Tests Available**:

* Verify contact has an anatomical location assigned
* Check test database includes this region

**Save/Export Failures**:

* Verify network connection
* Check authentication status
* Confirm file permissions

**Unexpected Test Assignments**:

* Check contact location accuracy
* Review test region mappings

For additional support, consult your system administrator or technical support team.
