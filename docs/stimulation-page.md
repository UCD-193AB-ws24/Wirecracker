# **Contact Selection & Stimulation Planning Tool**

## **Overview**

This tool allows clinicians to plan electrode contacts and order of stimulation for functional mapping, CCEPs, or seizure recreation purposes. The interface supports drag-and-drop organization of contacts and parameter configuration.

## **Key Features**

* Interactive contact selection with drag-and-drop
* Stimulation parameter configuration (frequency, duration, current)
* Contact pairing functionality
* Save/export capabilities

## **Interface Layout**

### **Main Components**

1. **Contact List (Left Panel)**:
   * Displays all available electrode contacts grouped by electrode
   * Color-coded by designation status
   * Supports filtering and selection
2. **Planning Pane (Right Panel)**:
   * Shows selected contacts for stimulation
   * Allows parameter configuration
   * Supports reordering of contacts
3. **Floating Action Buttons**:
   * Pairing toggle (P)
   * Visibility toggle (T)

## **Getting Started**

### **Loading Data**

The tool automatically loads data from the previous contact designation / resection page.

The tool can also load from a CSV provided in the main screen provided that the CSV is in the correct format.

## **Using the Contact List**

### **Basic Interactions**

* **Single Click**:
  * Adds the contact to the end of the planning pane list
  * When not in pairing mode: Selects contact for stimulation
  * In pairing mode: Cycles through available pairs for the contact
* **Drag and Drop**:
  * Drag contacts to any position in the planning pane
  * Visual indicator shows where contact will be inserted
  * Drag from planning pane back to contact list to remove completely

### **Important Behavior Differences**

| Action | Position in Planning Pane |
| ----- | ----- |
| **Click** | Always appends to end |
| **Drag & Drop** | Insert at any position |

### **Contact Display**

* **Color Coding**:
  * Red: Seizure Onset Zone
  * Yellow: Seizure Network
  * Gray: Unmarked/Default
* **Pairing Indicator**:
  * Shows which contact is paired with the current one
  * All possible pairs are shown at once

### **Visibility Options**

* **Toggle Button (T)**:
  * Shows/hides unmarked contacts
  * Helps focus on clinically relevant contacts

## **Using the Planning Pane**

### **Adding Contacts**

1. Drag contacts from left panel
2. Or click on contacts in left panel

### **Configuring Parameters**

For each contact in planning pane:

1. **Frequency (Hz)**: Set stimulation frequency
2. **Duration (s)**: Set stimulation duration
3. **Current (mA)**: Set stimulation current

### **Reordering Contacts**

* Drag contacts within pane to reorder
* Visual indicator shows drop position

### **Removing Contacts**

* Click "Remove" button on contact card
* Or drag back to contact list

## **Pairing Contacts**

1. All possible consecutive pairs are shown (eg \- 1-2, 2-3, 3-4)
2. Click on a pair that is needed. Make sure not to then also add a pair that shares one of the contacts (eg \- if 1-2 is in planning pane, then ensure that 3-4 is added next and not 2-3)
3. System automatically updates both contacts in pair
4. Paired contacts appear together in planning pane

## **Saving and Exporting**

### **Saving Work**

Click "Save" button to save the work on the database

### **Exporting Data**

Click "Export" button to generate and download CSV file

*  This will save the data on the database as well

## **Troubleshooting**

### **Common Issues**

**Contacts Not Appearing**:

* Check visibility toggle state
* Verify contact marking status

**Pairing Not Working**:

* Ensure electrode has multiple contacts

**Save/Export Failures**:

* Verify network connection
* Check authentication status

For additional support, consult your system administrator or technical support team.
