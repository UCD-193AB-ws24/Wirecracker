# **Neurosurgery Tool**

## **Overview**

The Resection Planning tool provides a comprehensive interface for visualizing electrode contacts in anatomical context and planning surgical resections. It combines NIfTI image visualization with electrode coordinate data for precise surgical planning.

## **Key Features**

* Multi-planar NIfTI image visualization (Axial, Coronal, Sagittal)
* Electrode contact marking and selection
* Interactive navigation
* Contact information display
* Surgical marking capabilities

## **Getting Started**

### **Loading Data**

1. **Load (MRI) NIfTI File**:
   * Click "Open NIfTI File" button
   * Select your anatomical NIfTI file (.nii)
   * The main view will display the axial plane by default
2. **Load Coordinate File**:
   * Click "Open Coordinate File" button
   * Select a CSV file with electrode coordinates
   * File must contain columns: \[Electrode, Contact, x, y, z\]

## **Interface Layout**

### **Main Components**

1. **Primary View (Large Canvas)**:
   * Displays the current primary plane (default: Axial)
   * Shows all electrode contacts in this plane
   * Supports slice navigation with mouse wheel
2. **Secondary Views (Two Smaller Canvases)**:
   * Display orthogonal planes (default: Coronal and Sagittal)
   * Click to swap with the main view
   * Supports independent slice navigation
3. **Information Panel**:
   * Shows details of hovered contacts
   * Displays location, mark status, and surgeon mark status
   * Updates in real-time as you hover over contacts

## **Navigation Controls**

### **Slice Navigation**

* **Mouse Wheel**: Scroll up/down to move through slices

### **View Orientation**

* **Click any secondary view** to swap it with the main view
* The clicked view becomes the new primary view

## **Working with Electrode Contacts**

### **Contact Visualization**

* Contacts appear as colored circles overlaid on the anatomical images
* Colors indicate mark status (see Color Coding section)
* Surgeon-marked contacts have thick black borders

### **Manipulating Contacts**

* **Hover on a Contact**: View information of the contact in the information pane
* **Single Click**: Toggle surgeon mark (add/remove thick black border)
* **Double Click**:
  * Focus view on the contact (centers all views on contact location)
* **Select Multiple Contacts**:
  * Click and drag to create a selection rectangle
  * All contacts within the rectangle will be selected

## **Color Coding**

| Color | Meaning |
| ----- | ----- |
| White | Not Involved |
| Pink | Seizure Onset Zone |
| Orange | Seizure Network |
| Gray | Out Of Brain |

**Surgeon Marks**: Thick black border indicates surgeon-confirmed contacts

## **Working Without Loaded Imaging Data**

When no NIfTI file is loaded, the interface displays all electrode contacts as interactive tiles for basic marking functionality:

### **Contact Tile Interface**

* **Layout**:
  * Electrodes are grouped by their label (e.g., A1, B2)
  * Each contact appears as a colored tile showing its number and location
  * Tiles use the same color coding system as the imaging view

### **Marking Contacts Without Images**

1. **Single Click**:
   * Toggles the surgeon mark status (adds/removes thick black border)
   * Immediate visual feedback on the tile
2. **Visual Indicators**:
   * White: Unmarked (default)
   * Pink/Orange/Gray: Marked with different designations
   * Black border: Mark by neurosurgeon

### **Transition to Full View**

* Once NIfTI data and contact coordinates are loaded:
  1. All existing marks are preserved
  2. Contacts automatically appear in their anatomical positions
  3. The tile view is replaced by the imaging interface

### **When to Use Tile View**

* For preliminary marking before imaging data is available
* Quick review of existing contact designations
* Basic planning when detailed imaging isn't required

## **Troubleshooting**

### **Common Issues**

1. **Contacts Not Appearing**:
   * Verify coordinate file loaded correctly
   * Check CSV file contains required columns
   * Ensure coordinates are in RAS space
2. **Images Not Loading**:
   * Verify NIfTI file integrity
   * Check file is uncompressed .nii format
   * Confirm file is not corrupted
3. **Performance Issues**:
   * Use smaller NIfTI files for better performance
   * Close other applications to free memory
   * Consider resampling high-resolution images

For additional support, consult your system administrator or technical support team.
