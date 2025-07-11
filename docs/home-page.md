# **Home Page**

### **Overview**

The Home Page serves as the central dashboard for navigating and managing patient data within the Wirecracker Stimulation Planning Tool. It supports a **tab-based workflow**, where each open tab corresponds to a patient and their associated files. This layout enables users to quickly access, create, and organize patient-specific plans across specialties.

---

### **Key Features**

* Patient tab system for parallel, multi-file workflow

* File and patient access via **My Files**, **Recent Files**, and **Patient Modals**

* Central actions: Create Patient, Open Files, and Structure–Function–Test Lookup

* Integrated file types: Anatomy, Epilepsy, Neurosurgery, Neuropsychology, and Stimulation

* Quick access "+" button for tab creation

---

### **Sidebar Navigation**

#### **My Files**

Organized into two expandable subcategories:

* **Shared Files**:

  * Displays patient cases **shared with the user** that **have not yet been opened**.

  * Once opened, the file is **removed from this list** and accessible via Recent Files.

* **Approved**:

  * Displays patients whose files have been **approved for final review or clinical use**.

#### **Recent Files**

Shows the **most recently edited patients**.

* Clicking on a patient opens a **Patient Modal** where users can select which file to view or edit.

* This provides a fast way to return to active cases.

---

### **Patient Modal**

When clicking on any patient from the sidebar or central buttons, a **Patient Modal** is shown. This modal includes:

* A list of all available file types:

  * **Anatomy**, **Epilepsy**, **Neurosurgery**, **Neuropsychology**, and all **Stimulation** file types

* Files that **have not been created** for the selected patient are **greyed out**

* Clicking on an available file:

  * **Opens a new tab** with that patient and file in view

  * Adds the patient to the top tab bar for quick switching

* **Tab Dropdown**:

  * Clicking the current tab shows a dropdown of all files available for that patient

  * Users can switch between file views without closing the tab

---

### **Central Action Buttons**

Located in the center of the Home Page:

* **Create New Patient**

  * Launches a new patient record

  * Allows the user to begin populating files such as Anatomy, Epilepsy, etc.

* **Open Patient Files**

  * Dropdown with two options:

    * **Open from Database**: Browse and reopen patients previously worked on

    * **Open CSV**: Upload and open a **Wirecracker-generated CSV** tied to a specific patient

* **Structure–Function–Test Lookup**

  * Opens a searchable **database** of brain **structures**, **functions**, and **tests**

  * Each entry includes descriptive metadata

  * Includes a **2D visualization tool** to explore relationships between structures, functions, and tests

---

### **Top Navigation: Tab Creation**

* A **"+" button** in the upper-right corner allows users to create a **new patient tab** at any time

* This shortcut mirrors the functionality of the **Create New Patient** button in the center of the screen

---

### **Troubleshooting**

| Issue | Solution |
| ----- | ----- |
| Shared file not appearing | Ensure the patient has not already been opened |
| Greyed-out file not clickable | That file type hasn't been created yet for the patient |
| Cannot upload CSV | Verify file was generated by Wirecracker and is unmodified |
| Missing recent file | Check that edits were saved before closing the session |
