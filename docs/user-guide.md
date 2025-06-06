# **COMPUTER SCIENCE AND ENGINEERING**

# **WIRECRACKER**

# **USER GUIDE**

# Aditya Bhatia, Noor-Aysha Saadat, Chris Wang, and Yuecheng Zhao

Department of Computer Science  
University of California, Davis  
ECS 193AB

# May 2025

# 

# 

# 

# 

# 

# **Table of Contents** {#table-of-contents}

**[Table of Contents	2](#table-of-contents)**

[**Preface	6**](#preface)

[**Overview of Product	6**](#overview-of-product)

[**Installation or Distribution	7**](#installation-or-distribution)

[**Engineering Standards and Design Constraints	7**](#engineering-standards-and-design-constraints)

[Social and Ethical Considerations	7](#social-and-ethical-considerations)

[Development Standards and Workflow	7](#development-standards-and-workflow)

[Coding Standards	8](#coding-standards)

[Workflow Standards	8](#workflow-standards)

[Documentation and Requirements Tracking	8](#documentation-and-requirements-tracking)

[**Home Page	8**](#home-page)

[Overview	9](#overview)

[Key Features	9](#key-features)

[Sidebar Navigation	9](#sidebar-navigation)

[My Files	9](#my-files)

[Recent Files	9](#recent-files)

[Patient Modal	10](#patient-modal)

[Central Action Buttons	10](#central-action-buttons)

[Top Navigation – Tab Creation	11](#top-navigation-–-tab-creation)

[Troubleshooting	11](#troubleshooting)

[**Anatomy Page	12**](#anatomy-page)

[Overview	12](#overview-1)

[Key Features	12](#key-features-1)

[Interface Layout	12](#interface-layout)

[Creating an Electrode	13](#creating-an-electrode)

[Electrode Modal Details	13](#electrode-modal-details)

[Managing Electrodes	14](#managing-electrodes)

[Editing a Contact	14](#editing-a-contact)

[Workflow Integration	14](#workflow-integration)

[Troubleshooting	15](#troubleshooting-1)

[**Epilepsy Page	15**](#epilepsy-page)

[Overview	15](#overview-2)

[Key Features	15](#key-features-2)

[Interface Layout	15](#interface-layout-1)

[Using the Designation Page	16](#using-the-designation-page)

[Filtering Electrodes	16](#filtering-electrodes)

[Marking Contacts	16](#marking-contacts)

[Neurosurgeon Marks	16](#neurosurgeon-marks)

[Keyboard Shortcuts	16](#keyboard-shortcuts)

[Visual Design Guide	17](#visual-design-guide)

[Troubleshooting	17](#troubleshooting-2)

[**Neurosurgery Tool	18**](#neurosurgery-tool)

[Overview	18](#overview-3)

[Key Features	18](#key-features-3)

[Getting Started	18](#getting-started)

[Loading Data	18](#loading-data)

[Interface Layout	18](#interface-layout-2)

[Main Components	18](#main-components)

[Navigation Controls	19](#navigation-controls)

[Slice Navigation	19](#slice-navigation)

[View Orientation	19](#view-orientation)

[Working with Electrode Contacts	19](#working-with-electrode-contacts)

[Contact Visualization	19](#contact-visualization)

[Manipulating Contacts	19](#manipulating-contacts)

[Color Coding	20](#color-coding)

[Working Without Loaded Imaging Data	20](#working-without-loaded-imaging-data)

[Contact Tile Interface	20](#contact-tile-interface)

[Marking Contacts Without Images	20](#marking-contacts-without-images)

[Transition to Full View	20](#transition-to-full-view)

[When to Use Tile View	21](#when-to-use-tile-view)

[Troubleshooting	21](#troubleshooting-3)

[Common Issues	21](#common-issues)

[**Contact Selection & Stimulation Planning Tool	21**](#contact-selection-&-stimulation-planning-tool)

[Overview	21](#overview-4)

[Key Features	21](#key-features-4)

[Interface Layout	22](#interface-layout-3)

[Main Components	22](#main-components-1)

[Getting Started	22](#getting-started-1)

[Loading Data	22](#loading-data-1)

[Using the Contact List	22](#using-the-contact-list)

[Basic Interactions	22](#basic-interactions)

[Important Behavior Differences:	22](#important-behavior-differences:)

[Contact Display	23](#contact-display)

[Visibility Options	23](#visibility-options)

[Using the Planning Pane	23](#using-the-planning-pane)

[Adding Contacts	23](#adding-contacts)

[Configuring Parameters	23](#configuring-parameters)

[Reordering Contacts	23](#reordering-contacts)

[Removing Contacts	24](#removing-contacts)

[Pairing Contacts	24](#pairing-contacts)

[Saving and Exporting	24](#saving-and-exporting)

[Saving Work	24](#saving-work)

[Exporting Data	24](#exporting-data)

[Troubleshooting	24](#troubleshooting-4)

[Common Issues	24](#common-issues-1)

[**Functional Test Selection Tool	25**](#functional-test-selection-tool)

[Overview	25](#overview-5)

[Key Features	25](#key-features-5)

[Interface Layout	25](#interface-layout-4)

[Main Components	25](#main-components-2)

[Getting Started	26](#getting-started-2)

[Loading Data	26](#loading-data-2)

[Using the Tool	26](#using-the-tool)

[Auto-Assigning Tests	26](#auto-assigning-tests)

[Manual Test Assignment	26](#manual-test-assignment)

[Viewing Test Details	26](#viewing-test-details)

[Managing Assigned Tests	27](#managing-assigned-tests)

[Saving and Exporting	27](#saving-and-exporting-1)

[Saving Work	27](#saving-work-1)

[Exporting Data	27](#exporting-data-1)

[Data Interpretation	27](#data-interpretation)

[Troubleshooting	27](#troubleshooting-5)

[Common Issues	27](#common-issues-2)

**Appendix………………………………………………………………………………………………...28**

[**Introduction	28**](#introduction)

[**Technology Survey	28**](#technology-survey)

[Front-end	29](#front-end)

[CSS framework	29](#css-framework)

[● Tailwind CSS	29](#tailwind-css)

[● Bootstrap	29](#bootstrap)

[JavaScript framework	29](#javascript-framework)

[● React.js	29](#react.js)

[● Vue.js	29](#vue.js)

[UI SDK	30](#ui-sdk)

[● Flutter	30](#flutter)

[● React Native	30](#react-native)

[● Figma	30](#figma)

[Back-end	30](#back-end)

[● Django	30](#django)

[● Node.js	30](#node.js)

[● Dart	31](#dart)

[Full-stack	31](#full-stack)

[● Next.js	31](#next.js)

[● Blazor	31](#blazor)

[Database	31](#database)

[APIs Used	32](#apis-used)

[Project Management Software	32](#project-management-software)

[**System Architecture Overview	32**](#system-architecture-overview)

[UI Components:	34](#ui-components:)

[**User Stories	34**](#user-stories)

[**Prototyping Code	36**](#prototyping-code)

[**Technologies Employed	36**](#technologies-employed)

[**Real-World Constraint Analysis	36**](#real-world-constraint-analysis)

[Cost	36](#cost)

[Space	36](#space)

[Security	36](#security)

[Privacy	37](#privacy)

[Scalability	37](#scalability)

[Maintainability	37](#maintainability)

[Acceptance Test	37](#acceptance-test)

[**Social and Legal Aspects	37**](#social-and-legal-aspects)

[**Glossary of Terms	37**](#glossary-of-terms)

# 

# 

# 

# 

# 

# **Preface** {#preface}

This user guide provides comprehensive instructions for the Wirecracker, a web-based application developed to support the planning of brain stimulations in patients with epilepsy. It is intended for medical professionals and researchers, including epileptologists, neurosurgeons, neuropsychologists, and neuroscientists involved in the clinical assessment and treatment of epilepsy.

The tool fosters collaborative, interdisciplinary planning by integrating clinical data across specialties. This guide will assist users in navigating core features such as mapping seizure onset zones, planning surgical resections, assigning functional tests, and configuring stimulation protocols.

# **Overview of Product** {#overview-of-product}

The Wirecracker Stimulation Planning Tool is a **full-stack web application** developed using **React** for the frontend, **Node.js** for the backend, and **Supabase** for real-time database and authentication management. It centralizes and organizes complex clinical data to assist in patient-specific planning for brain stimulation procedures.

Key Features Include:

* **Anatomy Page**: Plan electrode placements on brain structures.

* **Epilepsy Page**: Identify and map the **Seizure Onset Zone (SOZ)**.

* **Neurosurgery Page**: Visualize electrode contacts and determine **resection zones**.

* **Neuropsychology Page**: Assign cognitive or functional **tests to electrode contacts**.

* **Stimulation Page**: Design detailed **stimulation protocols**, including:

  * Functional Mapping

  * Cortico-Cortical Evoked Potentials (CCEP)

  * Seizure Recreation

* Access to a **database** containing brain structure information, functional mappings, and test inventories.

The tool aims to bridge specialties, reduce miscommunication, and support evidence-based, patient-tailored stimulation strategies.

# **Installation or Distribution** {#installation-or-distribution}

The Wirecracker Stimulation Planning Tool is a **cloud-based application**, accessible via any modern web browser. No installation is required.

**Access the tool at:** [https://wirecracker.com](https://wirecracker.com)

User access is managed through Supabase authentication. Please feel free to use your email to make an account and test the application out.

# **Engineering Standards and Design Constraints** {#engineering-standards-and-design-constraints}

### **Social and Ethical Considerations** {#social-and-ethical-considerations}

This application was developed with a strong emphasis on **patient privacy, ethical collaboration, and clinical accuracy**:

* **Patient data is de-identified** during data handling.

* All shared files require **user authentication** to protect sensitive patient information.

* The tool promotes **interdisciplinary collaboration** while maintaining professional boundaries—each stakeholder (epileptologist, neurosurgeon, neuropsychologist) only edits the files relevant to their role.

* By integrating established neurological databases and emphasizing data traceability, the tool supports **evidence-based decision making**, reducing subjective error in stimulation planning.

The team adhered to the principles outlined in the **Belmont Report** for clinical ethics and followed HIPAA-aligned standards for handling sensitive health data.

### **Development Standards and Workflow** {#development-standards-and-workflow}

Development was guided by internal team agreements and industry-standard practices:

#### **Coding Standards** {#coding-standards}

* **Frontend**: React.js with functional components and hooks. Styling is consistent using utility-first CSS (TailwindCSS or equivalent).

* **Backend**: Express.js with RESTful API design. All endpoints follow versioning and response formatting guidelines.

* **Database**: Supabase (PostgreSQL), with schema validation and role-based access control.

Code adheres to the **Airbnb JavaScript Style Guide**, enforced via ESLint and Prettier.

#### **Workflow Standards** {#workflow-standards}

* Version control through **Git** and **GitHub**, with enforced pull requests, code reviews, and branching (feature/hotfix/main) strategy.

* Project management followed **Agile** principles with weekly sprints, tracked using tools such as Trello or GitHub Projects.

* Continuous integration and deployment were tested manually in a staging environment before production deployment.

#### **Documentation and Requirements Tracking** {#documentation-and-requirements-tracking}

* All features and UI decisions were traced to a **requirements document** collaboratively written at project initiation.

* Updates and deviations were tracked through a team-maintained **change log** and meeting notes.

* Internal documentation was kept in Notion and GitHub README files, while this user guide serves as the official external documentation.

# **Home Page** {#home-page}

### **Overview** {#overview}

The Home Page serves as the central dashboard for navigating and managing patient data within the Wirecracker Stimulation Planning Tool. It supports a **tab-based workflow**, where each open tab corresponds to a patient and their associated files. This layout enables users to quickly access, create, and organize patient-specific plans across specialties.

---

### **Key Features** {#key-features}

* Patient tab system for parallel, multi-file workflow

* File and patient access via **My Files**, **Recent Files**, and **Patient Modals**

* Central actions: Create Patient, Open Files, and Structure–Function–Test Lookup

* Integrated file types: Anatomy, Epilepsy, Neurosurgery, Neuropsychology, and Stimulation

* Quick access "+" button for tab creation

---

### **Sidebar Navigation** {#sidebar-navigation}

#### **My Files** {#my-files}

Organized into two expandable subcategories:

* **Shared Files**:

  * Displays patient cases **shared with the user** that **have not yet been opened**.

  * Once opened, the file is **removed from this list** and accessible via Recent Files.

* **Approved**:

  * Displays patients whose files have been **approved for final review or clinical use**.

#### **Recent Files** {#recent-files}

Shows the **most recently edited patients**.

* Clicking on a patient opens a **Patient Modal** where users can select which file to view or edit.

* This provides a fast way to return to active cases.

---

### **Patient Modal** {#patient-modal}

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

### **Central Action Buttons** {#central-action-buttons}

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

### **Top Navigation – Tab Creation** {#top-navigation-–-tab-creation}

* A **"+" button** in the upper-right corner allows users to create a **new patient tab** at any time

* This shortcut mirrors the functionality of the **Create New Patient** button in the center of the screen

---

### **Troubleshooting** {#troubleshooting}

| Issue | Solution |
| ----- | ----- |
| Shared file not appearing | Ensure the patient has not already been opened |
| Greyed-out file not clickable | That file type hasn't been created yet for the patient |
| Cannot upload CSV | Verify file was generated by Wirecracker and is unmodified |
| Missing recent file | Check that edits were saved before closing the session |

# **Anatomy Page** {#anatomy-page}

### **Overview** {#overview-1}

The Anatomy page allows users to define and configure electrode placements on the brain. This is typically the first step in planning a patient’s stimulation workflow. It supports anatomical localization, contact setup, and collaborative sharing with epileptologists.

### **Key Features** {#key-features-1}

* Electrode creation via a floating action button

* Modal-based interface for electrode and contact setup

* Customizable electrode labels, types, and contact counts

* Integration with brain structure database for description autofill

* Editable contact-level information with location classifications

* Seamless sharing to Epilepsy planning workflows

---

### **Interface Layout** {#interface-layout}

The page consists of:

* Floating “+” button at the bottom right to create a new electrode

* Blue electrode bars listed across the screen

* Expandable views for electrode contacts

* Pen icon (edit) and trash icon (delete) for each electrode

* Bottom buttons for workflow continuation: **Share with Epileptologist** and **Open in Epilepsy**

---

### **Creating an Electrode** {#creating-an-electrode}

1. **Click the "+" button** (bottom-right corner).

2. A **modal** will appear with the following fields and options:

#### **Electrode Modal Details** {#electrode-modal-details}

* **Label**: Enter the electrode name.

  * A trailing **apostrophe (')** denotes a **left hemisphere** electrode.

  * No apostrophe \= **right hemisphere**.

* **Description**:

  * Auto-filled from the brain structure database (if matched).

  * Users can manually enter or override the description if needed.

* **Electrode Type**:

  * Defaults: **DIXI** and **AD-TECH**.

  * Select "Other" to specify an alternate manufacturer.

* **Number of Contacts**:

  * Controlled via both a **slider** and a **numeric input box**.

  * Values **below 0 are not allowed**.

Once saved, the electrode appears as a **blue bar** on the page.

---

### **Managing Electrodes** {#managing-electrodes}

* **Edit**: Click the **pen icon** to reopen the electrode modal.

* **Delete**: Click the **trash icon** to remove the electrode.

* **Expand**: Click the blue electrode bar to reveal its contact list.

* **Edit Contact**: Click a contact to open the contact modal.

---

### **Editing a Contact** {#editing-a-contact}

In the contact modal, users can classify each contact's brain location using one of five predefined types:

| Contact Location Type | Meaning |
| ----- | ----- |
| GM | Gray Matter |
| GM/GM | Between Two Gray Matter Areas |
| WM | White Matter |
| OOB | Out of Brain |
| GM/WM | Between Gray and White Matter |

---

### **Workflow Integration** {#workflow-integration}

At the bottom of the page are two buttons to continue planning:

* **Share with Epileptologist**

  * Opens a modal to enter the **epileptologist's email**.

  * Automatically creates and shares a new **Epilepsy page** with both the user and the specified recipient.

* **Open in Epilepsy**

  * Instantly creates a new **Epilepsy file** linked to the current electrode data.

---

### **Troubleshooting** {#troubleshooting-1}

| Issue | Solution |
| ----- | ----- |
| Cannot create electrode | Ensure a valid label and a contact count \> 0 are entered |
| Autofill not working | Confirm electrode name matches database convention |
| Electrode not visible after creation | Refresh the page or check for duplicate entries |
| Contact edit modal not opening | Make sure contact is fully visible and clickable |

For best results, use the Anatomy page on a desktop or laptop device.

# **Epilepsy Page** {#epilepsy-page}

## **Overview** {#overview-2}

The epilepsy page allows epileptologists to mark and categorize electrode contacts with different visual designations. This interface provides keyboard-optimized workflow for efficient contact marking during activity monitoring.

## **Key Features** {#key-features-2}

* Keyboard-controlled electrode filtering  
* Visual contact marking system  
* Quick cycling through designation states

## **Interface Layout** {#interface-layout-1}

The page consists of:

1. Filter indicator at the top  
2. Electrode cards (one per electrode)  
3. Contact buttons within each card

## **Using the Designation Page** {#using-the-designation-page}

### **Filtering Electrodes** {#filtering-electrodes}

1. **By keyboard**:  
   * Press any letter key to filter electrodes starting with that letter  
   * Example: Press "A" to show only electrodes labeled A, A’, etc.  
   * Press Escape or Backspace to clear the filter  
2. **Visual feedback**:  
   * Current filter appears below the header  
   * Only matching electrodes remain visible

### **Marking Contacts** {#marking-contacts}

**Click any contact** to cycle through available marks:

1. White: Not Involved (default)  
2. Rose (pink): Seizure Onset Zone  
3. Amber (orange): Seizure Network  
4. Stone (gray): Out of Brain

### **Neurosurgeon Marks** {#neurosurgeon-marks}

* Contacts with surgeon marks have:  
  * Thicker dark gray border  
  * Normal mark colors underneath  
* These are set in the resection page

## **Keyboard Shortcuts** {#keyboard-shortcuts}

| Key | Action |
| ----- | ----- |
| A-Z | Filter electrodes starting with letter |
| Esc | Clear current filter |
| Backspace | Clear current filter |

## **Visual Design Guide** {#visual-design-guide}

| Color | Meaning |
| ----- | ----- |
| White | Not Involved |
| Rose (pink) | Seizure Onset Zone |
| Amber (orange) | Seizure Network |
| Stone (gray) | Out of Brain |
| Thick gray border | Marked by Neurosurgeon in Resection page |

## **Troubleshooting** {#troubleshooting-2}

**Issue**: Cannot save to database

* Solution: Verify the internet connection

**Issue**: Filter not working

* Solution: Check if keyboard input is being captured by another application

**Issue**: Unexpected mark colors

* Solution: Refresh the page to reset to expected states

For optimal performance, use this interface on a desktop/laptop computer with a keyboard. Touchscreen devices may work but won't benefit from the keyboard filtering features.

# **Neurosurgery Tool** {#neurosurgery-tool}

## **Overview** {#overview-3}

The Resection Planning tool provides a comprehensive interface for visualizing electrode contacts in anatomical context and planning surgical resections. It combines NIfTI image visualization with electrode coordinate data for precise surgical planning.

## **Key Features** {#key-features-3}

* Multi-planar NIfTI image visualization (Axial, Coronal, Sagittal)  
* Electrode contact marking and selection  
* Interactive navigation  
* Contact information display  
* Surgical marking capabilities

## **Getting Started** {#getting-started}

### **Loading Data** {#loading-data}

1. **Load (MRI) NIfTI File**:  
   * Click "Open NIfTI File" button  
   * Select your anatomical NIfTI file (.nii)  
   * The main view will display the axial plane by default  
2. **Load Coordinate File**:  
   * Click "Open Coordinate File" button  
   * Select a CSV file with electrode coordinates  
   * File must contain columns: \[Electrode, Contact, x, y, z\]

## **Interface Layout** {#interface-layout-2}

### **Main Components** {#main-components}

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

## **Navigation Controls** {#navigation-controls}

### **Slice Navigation** {#slice-navigation}

* **Mouse Wheel**: Scroll up/down to move through slices

### **View Orientation** {#view-orientation}

* **Click any secondary view** to swap it with the main view  
* The clicked view becomes the new primary view

## **Working with Electrode Contacts** {#working-with-electrode-contacts}

### **Contact Visualization** {#contact-visualization}

* Contacts appear as colored circles overlaid on the anatomical images  
* Colors indicate mark status (see Color Coding section)  
* Surgeon-marked contacts have thick black borders

### **Manipulating Contacts** {#manipulating-contacts}

* **Hover on a Contact**: View information of the contact in the information pane  
* **Single Click**: Toggle surgeon mark (add/remove thick black border)  
* **Double Click**:  
  * Focus view on the contact (centers all views on contact location)  
* **Select Multiple Contacts**:  
  * Click and drag to create a selection rectangle  
  * All contacts within the rectangle will be selected

## **Color Coding** {#color-coding}

| Color | Meaning |
| ----- | ----- |
| White | Not Involved |
| Pink | Seizure Onset Zone |
| Orange | Seizure Network |
| Gray | Out Of Brain |

**Surgeon Marks**: Thick black border indicates surgeon-confirmed contacts

## **Working Without Loaded Imaging Data** {#working-without-loaded-imaging-data}

When no NIfTI file is loaded, the interface displays all electrode contacts as interactive tiles for basic marking functionality:

### **Contact Tile Interface** {#contact-tile-interface}

* **Layout**:  
  * Electrodes are grouped by their label (e.g., A1, B2)  
  * Each contact appears as a colored tile showing its number and location  
  * Tiles use the same color coding system as the imaging view

### **Marking Contacts Without Images** {#marking-contacts-without-images}

1. **Single Click**:  
   * Toggles the surgeon mark status (adds/removes thick black border)  
   * Immediate visual feedback on the tile  
2. **Visual Indicators**:  
   * White: Unmarked (default)  
   * Pink/Orange/Gray: Marked with different designations  
   * Black border: Mark by neurosurgeon

### **Transition to Full View** {#transition-to-full-view}

* Once NIfTI data and contact coordinates are loaded:  
  1. All existing marks are preserved  
  2. Contacts automatically appear in their anatomical positions  
  3. The tile view is replaced by the imaging interface

### **When to Use Tile View** {#when-to-use-tile-view}

* For preliminary marking before imaging data is available  
* Quick review of existing contact designations  
* Basic planning when detailed imaging isn't required

## **Troubleshooting** {#troubleshooting-3}

### **Common Issues** {#common-issues}

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

# **Contact Selection & Stimulation Planning Tool** {#contact-selection-&-stimulation-planning-tool}

## **Overview** {#overview-4}

This tool allows clinicians to plan electrode contacts and order of stimulation for functional mapping, CCEPs, or seizure recreation purposes. The interface supports drag-and-drop organization of contacts and parameter configuration.

## **Key Features** {#key-features-4}

* Interactive contact selection with drag-and-drop  
* Stimulation parameter configuration (frequency, duration, current)  
* Contact pairing functionality  
* Save/export capabilities

## **Interface Layout** {#interface-layout-3}

### **Main Components** {#main-components-1}

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

## **Getting Started** {#getting-started-1}

### **Loading Data** {#loading-data-1}

The tool automatically loads data from the previous contact designation / resection page.

The tool can also load from a CSV provided in the main screen provided that the CSV is in the correct format. 

## **Using the Contact List** {#using-the-contact-list}

### **Basic Interactions** {#basic-interactions}

* **Single Click**:  
  * Adds the contact to the end of the planning pane list  
  * When not in pairing mode: Selects contact for stimulation  
  * In pairing mode: Cycles through available pairs for the contact  
* **Drag and Drop**:  
  * Drag contacts to any position in the planning pane  
  * Visual indicator shows where contact will be inserted  
  * Drag from planning pane back to contact list to remove completely

### **Important Behavior Differences:** {#important-behavior-differences:}

| Action | Position in Planning Pane |
| ----- | ----- |
| **Click** | Always appends to end |
| **Drag & Drop** | Insert at any position |

### **Contact Display** {#contact-display}

* **Color Coding**:  
  * Red: Seizure Onset Zone  
  * Yellow: Seizure Network  
  * Gray: Unmarked/Default  
* **Pairing Indicator**:  
  * Shows which contact is paired with the current one  
  * All possible pairs are shown at once

### **Visibility Options** {#visibility-options}

* **Toggle Button (T)**:  
  * Shows/hides unmarked contacts  
  * Helps focus on clinically relevant contacts

## **Using the Planning Pane** {#using-the-planning-pane}

### **Adding Contacts** {#adding-contacts}

1. Drag contacts from left panel  
2. Or click on contacts in left panel

### **Configuring Parameters** {#configuring-parameters}

For each contact in planning pane:

1. **Frequency (Hz)**: Set stimulation frequency  
2. **Duration (s)**: Set stimulation duration  
3. **Current (mA)**: Set stimulation current

### **Reordering Contacts** {#reordering-contacts}

* Drag contacts within pane to reorder  
* Visual indicator shows drop position

### **Removing Contacts** {#removing-contacts}

* Click "Remove" button on contact card  
* Or drag back to contact list

## **Pairing Contacts** {#pairing-contacts}

1. All possible consecutive pairs are shown (eg \- 1-2, 2-3, 3-4)  
2. Click on a pair that is needed. Make sure not to then also add a pair that shares one of the contacts (eg \- if 1-2 is in planning pane, then ensure that 3-4 is added next and not 2-3)  
3. System automatically updates both contacts in pair  
4. Paired contacts appear together in planning pane

## **Saving and Exporting** {#saving-and-exporting}

### **Saving Work** {#saving-work}

Click "Save" button to save the work on the database

### **Exporting Data** {#exporting-data}

Click "Export" button to generate and download CSV file

*  This will save the data on the database as well

## **Troubleshooting** {#troubleshooting-4}

### **Common Issues** {#common-issues-1}

**Contacts Not Appearing**:

* Check visibility toggle state  
* Verify contact marking status

**Pairing Not Working**:

* Ensure electrode has multiple contacts

**Save/Export Failures**:

* Verify network connection  
* Check authentication status

For additional support, consult your system administrator or technical support team.

# **Functional Test Selection Tool** {#functional-test-selection-tool}

## **Overview** {#overview-5}

This tool enables clinicians to select and manage functional mapping tests for marked electrode contacts. It provides test recommendations based on anatomical location and clinical evidence.

## **Key Features** {#key-features-5}

* Automated test recommendations  
* Manual test selection interface  
* Test performance metrics visualization  
* Detailed test information  
* Save/export capabilities

## **Interface Layout** {#interface-layout-4}

### **Main Components** {#main-components-2}

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

## **Getting Started** {#getting-started-2}

### **Loading Data** {#loading-data-2}

The tool automatically loads:

* Saved state (if available)  
* Initial data (if provided)  
* Demo data (if no patient data exists)

## **Using the Tool** {#using-the-tool}

### **Auto-Assigning Tests** {#auto-assigning-tests}

1. Click "Auto-Assign Best Tests" button  
2. System automatically:  
   * Matches tests to contacts based on anatomical location  
   * Selects tests with highest population evidence and disruption rates  
   * Assigns one test per contact

### **Manual Test Assignment** {#manual-test-assignment}

1. **For a specific contact**:  
   * Click "+ Add Test" button below the contact  
   * Test selection popup will appear  
2. **In the test selection popup**:  
   * Browse available tests (filtered by contact location)  
   * Click on a test to select it  
   * Click test name again to view details  
   * Click "Confirm" to assign the test

### **Viewing Test Details** {#viewing-test-details}

* **Basic Info**: Always visible in test cards  
  * Test name  
  * Tags/categories  
  * Population size  
  * Disruption rate percentage  
* **Expanded Details**:  
  * Click on an assigned test to expand  
  * Shows full description  
  * Includes "More Details" link (opens in new tab)

### **Managing Assigned Tests** {#managing-assigned-tests}

1. **Remove a test**:  
   * Click the "×" button on the test card  
   * Test is immediately removed  
2. **Reorder tests**:  
   * Currently tests display in assignment order  
   * Manual reordering not implemented in this version

## **Saving and Exporting** {#saving-and-exporting-1}

### **Saving Work** {#saving-work-1}

Click "Save" button to save the work on the database

### **Exporting Data** {#exporting-data-1}

Click "Export" button to generate and download CSV file

*  This will save the data on the database as well

## **Data Interpretation** {#data-interpretation}

* **Population**: Number of cases supporting this test  
* **Disruption Rate**: Percentage showing functional effect  
* **Tags**: Test categories (e.g., motor, language)

## **Troubleshooting** {#troubleshooting-5}

### **Common Issues** {#common-issues-2}

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

**Appendix**

Emails:  
[htxbhatia@ucdavis.edu](mailto:htxbhatia@ucdavis.edu)[cswang@ucdavis.edu](mailto:cswang@ucdavis.edu)[nsaadat@ucdavis.edu](mailto:nsaadat@ucdavis.edu)[Yuecheng Zhao](mailto:datzhao@ucdavis.edu)

# Introduction {#introduction}

As written by Jack Reynolds in the project description, “Epilepsy is a disorder characterized by recurrent periods of abnormal electrical activity in the brain, known as seizures. To reduce or eliminate seizures from occurring, brain surgery may be considered. However, before surgery can take place, medical professionals must understand the functional ability of the underlying brain tissue to make sure that no healthy or necessary functions such as speech will be negatively affected by the procedure.”  
This is accomplished by conducting a series of tests using electrodes implanted in the patient's brain. Currently, few variations of these tests exist, and the most commonly used tests are not diverse or specific enough to identify all brain functionalities. Additionally, there is no centralized place to share tests with other health centers, nor is there any place to share the results of the tests. Wirecracker allows tests curated and created by Dr. Toprani, Dr. Weakley, and Jack Reynolds to be available for epilepsy researchers around the world. The planning and execution of stimulation on patients' brains is very time-sensitive and requires good coordination between many medical professionals with different specializations. Wirecracker streamlines the process and provides a platform where the team can share the plans and approve (or edit) them without miscommunication.

# Technology Survey {#technology-survey}

Conclusion: For the front end, we decided to use Tailwind CSS for the CSS framework and React.js for the JavaScript framework. For the back end, we will use Node.js. This allows us to have a full JS stack. The database will be PostgreSQL as requested by the client, and the PMS will be GitHub Projects.

## **Front-end** {#front-end}

The client has requested multiple tools, including an electrode localization tool, a test planning tool, and a database lookup tool. The application is likely to be a multi-page application.

### ***CSS framework*** {#css-framework}

* #### Tailwind CSS {#tailwind-css}

  * Pros  
    * Highly customizable with minimal effort.  
    * Reduces the need for writing custom CSS.  
    * Optimized for performance with a small final CSS bundle  
  * Cons  
    * Learning curve for those unfamiliar with utility classes.  
    * Can result in a cluttered HTML structure.

* #### Bootstrap {#bootstrap}

  * Pros  
    * Pre-built components make development faster.  
    * Extensive documentation and community support.  
    * Responsive grid system for easy layout design.  
  * Cons  
    * Requires overriding styles to customize.  
    * Larger CSS files compared to Tailwind.

Conclusion: We decided to go with Tailwind CSS as the CSS framework as it is the easiest and most performant solution while providing high customizability. 

### ***JavaScript framework*** {#javascript-framework}

* #### React.js {#react.js}

  * Pros  
    * Large community support and ecosystem.  
    * Component-based architecture simplifies development and maintenance.  
  * Cons  
    * JSX (syntax used by React) may have a learning curve  
    * Requires additional libraries or tools to handle other aspects like routing, data fetching, and state management.

* #### Vue.js {#vue.js}

  * Pros  
    * Simpler learning curve compared to React.  
    * Reactive data binding makes state management easier.  
    * Well-structured documentation.  
  * Cons  
    * It is a smaller community compared to React.  
    * Less enterprise adoption compared to React and Angular.

Conclusion: We will be using React.js as our front-end framework. Pairing React with Node will allow us to have a full JS stack and React has a better ecosystem and community support.

### ***UI SDK*** {#ui-sdk}

* #### Flutter {#flutter}

  * Pros  
    * High-performance rendering engine.  
    * Strong UI capabilities with pre-built widgets.  
  * Cons  
    * Requires learning Dart, which is less commonly used.  
    * Web support is not as mature as mobile.

* #### React Native {#react-native}

  * Pros  
    * Uses JavaScript, which aligns with the front end.  
    * Large community support and ecosystem.  
  * Cons  
    * Performance may not match native apps.  
    * Limited access to some native APIs without third-party libraries.

* #### Figma {#figma}

  * Pros  
    * Excellent for prototyping and design collaboration.  
    * Cloud-based, allowing easy access and sharing.  
    * Supports plugins for added functionality  
    * The education version (that is available under the .edu account) allows code export.  
  * Cons  
    * Limited offline functionality

Conclusion: Due to the ease of use and collaborative capabilities, we will be using Figma for prototyping and design. 

## **Back-end** {#back-end}

The client requested the technology used in the web application to be something easy to learn for ease of maintenance in the future.

* #### Django {#django}

  * Pros  
    * The client likely knows some degree of Python.  
    * Large ecosystem and extensive documentation.  
  * Cons  
    * Multiple language stack, which may complicate a thing or two

* #### Node.js {#node.js}

  * Pros  
    * If the UI is in JavaScript, we can have a full JS stack.  
    * Large ecosystem with NPM.  
  * Cons  
    * Less structured compared to Django.

* #### Dart {#dart}

  * Pros  
    * Works well with Flutter for full-stack development.  
    * It can be compiled into JavaScript for web apps.  
  * Cons  
    * Limited ecosystem and adoption compared to Python and JavaScript.  
    * Requires learning Dart, which is less common.

Conclusion: We will be using Node.js as the back end. Node.js is a well-supported and commonly used framework and it will make it easier for future developers to contribute to the project. Using Node.js also allows us to have a full JS stack.

## **Full-stack** {#full-stack}

* #### Next.js {#next.js}

  * Pros  
    * It is basically React.js \+ Node.js  
    * Full-stack provides a streamlined development experience  
    * Easier to set up and provides a fast website experience  
  * Cons  
    * Can be overkill for small projects  
    * Limited flexibility compared to doing React \+ Node separately

* #### Blazor {#blazor}

  * Pros  
    * Allows full-stack development with C\#.  
    * Integrated with the .NET ecosystem.  
  * Cons  
    * Requires a Windows-centric development environment. However, the client may use Linux/Unix-based systems.  
    * Less community support compared to JavaScript-based solutions.

Conclusion: We will not be choosing any Full-Stack framework. Blazor is out due to its Windows-centric development environment and lesser community support compared to JS, and we prefer the flexibility of React \+ Node over Next.js.

## **Database** {#database}

Conclusion: For the Database, the client has experience in PostgreSQL and for ease of maintenance in the future, we decided that it is best to use what they have experience in.  
We went forward with Supabase, which is a user-friendly backend-as-a-service. This allowed us to focus on the application logic rather than being tied up in building our own backend infrastructure.

## **APIs Used** {#apis-used}

1. Resend API  
   1. Resend is an email API designed for developers to easily build, test, and send transactional emails at scale. We use their API to send out verification codes to new users to add an extra layer of security to the application. Additionally, the Resend API is used for users to share different plans to other Wirecracker users, enabling asynchronous editing.  
2. Google OAuth  
   1. To make creating an account easier but still secure, we utilized Google’s access tokens to allow users to sign up and log in with their Google accounts.

## **Project Management Software** {#project-management-software}

Conclusion: We will be using GitHub Projects since that is what is required by the class.

# System Architecture Overview {#system-architecture-overview}

**Frontend:**

* Creating a responsive user-friendly UI  
* Adding components for patient profiles, electrode mapping, assigned functions, refined results  
* Main App Container (App.jsx)  
* Serves as the root component  
* Handles routing using react-router-dom  
* Manages global state for tabs and file handling  
* Implements a multi-tab interface for different workspaces  
* Tab System  
  * Allows multiple files/workspaces to be open simultaneously  
  * Supports tab renaming, closing, and state persistence  
  * Each tab maintains its state and data  
* FileUtils Module  
  * Centralizes file operations  
  * Handles data transformation between frontend and backend  
  * Manages file loading and saving operations  
  * File Types: Localization files, designation files, stimulation files  
* State Management  
  * Uses React's useState for local component state  
  * Each major component maintains its state  
  * State changes trigger re-renders and updates  
  * Uses custom events for cross-component communication  
  * Maintains loose coupling between components

**Backend:**

* Using Restful API to handle user data, patient data, storing localization, stimulation, designation, and test planning data, and allowing for file sharing between users  
* Using OAuthV2 to allow users to login  
* Using Resend API to send verification emails for creating an account and to allow file sharing between users  
* Potentially using some type of algorithm to find the optimal region for electrode location

**Database:**

* Uses Supabase client for database operations  
* Handles real-time updates and data synchronization  
* Manages file metadata and content separately  
* Table 1: User  
  * Stores user ID, email, name, password, and time created  
  * Used to keep track of users and user sessions  
* Table 2: Files  
  * Stores the file owner ID (same as user ID), the file name, the creation date, and the modification date  
  * This allows one copy of each plan to be saved to the database, and also allows for the user to continue editing saved plans. The modification date allows the user to be able to view their most recent files.  
* Table 3: Localizations  
  * Stores localization id, electrode id, contact, type of tissue, region id, file id  
  * A good way to think of this is that each contact is saved as a new row in the localization table.  
  * Electrode ID corresponds with the electrode table; every new electrode created through a localization plan is saved to the database.  
  * The contact column means which contact within the electrode is being referred to, and the type of tissue means the type of tissue each contact is affiliated with,  
  * Region ID corresponds to the region table; each region that the electrode is in is put into the region table.  
  * The file ID corresponds to the Files table; this prevents the same file from being saved twice in the database and also enables the user to edit and update their saved localization.  
* Table 4: Electrodes  
  * Stores ID, the acronym, the description, the number of contacts, and the label  
  * Every new electrode created gets added here for the database and autofilling  
* Table 5: Designation  
  * Id, json file of designation data, json file of localization data, file ID  
  * Designation data has information about the surgeon marks for future stimulation plans  
  * Localization data has the information of each contact saved in a JSON structure

### **UI Components:** {#ui-components:}

* Shared Components  
  * Dropdown menus  
  * Buttons  
  * Modal dialogs  
  * Tab interface  
* Specialized Components  
  * File viewers  
  * Data editors  
  * Navigation elements

![][image1]

# User Stories {#user-stories}

1. As an epileptologist, I would like to create a list of electrodes inserted into patients' brains with ease and share the list with other doctors working together on a shared intuitive platform.  
2. As a neurosurgeon, I need to see and work on the stimulation plans to understand what parts of the patient’s brains are impacted the most. However, unlike an epileptologist, I am used to working with real-life representations of a patient’s brain rather than thinking of electrodes in a CSV-like format, which is what epileptologists primarily work with. It would be very beneficial for me to be able to review and edit stimulation plans on a physical brain simulation, which can then be translated into a stimulation plan exported to a CSV for the epileptologist to look over. This helps prevent miscommunication between the epileptologist who is doing research and me.  
3. As an epileptologist, I would like to prioritize the importance of stimulation testing based on an EEG contact’s suspected involvement in seizures.  
4. As an epileptologist, I would like to see all the stimulation tests that can test a specific brain part that might be affecting the epilepsy patient and make a personalized list of tests for the patient.  
5. As an epileptologist, I would like to be able to automatically select the best tests to be done based on the selected electrode locations to be tested, decided on factors like function, popularity, previous results from literature, etc.  
6. As an epileptologist, I would like to automatically select the brain description based on an EEG’s label. This would make the location of the EEG more obvious while removing the need to type out the description.  
7. As a neuropsychologist, I would like to review the stimulation plans the epileptologist created with ease, and be able to edit plans or approve them.  
8. As a team member, I would like to be able to open any of my recently worked-on files from the website without having to download a CSV every time. I would like to have the files linked to my account so that I can still open them without the CSV file, even if I’m using a different device.  
9. As someone who works in the healthcare industry, I would like to use secure applications without worrying about my patients’ data being compromised.  
10. As a team member, I would like to be able to share data from any of the pages to another user without having to download and transfer a file so that it can be looked at or approved by them with the greatest convenience.  
11. As a team member, I would like to receive a notification from the app when any step has been completed such as a localization being done or a stimulation plan being created, or when my work has been approved by the other members in my team.  
12. As a neurologist, I would like to be able to confirm that a localization is accurate, i.e., I would confirm that the locations specified for the electrodes in the app match the locations of the electrodes physically in the patient's brain.  
13. As an epilepsy researcher, I would like to be able to add new data to a centralized database to contribute to future epilepsy research.  
14. As an epilepsy researcher, I would like to look up statistics on common brain functions depending on the different types of epilepsy to conduct research. I would also like to see how different regions of the brain might interact with each other, to build a stimulation plan based on information from other epileptologists.   
15. As a future developer on this project, I would like to be working on a project that is well documented, using a framework that I understand, and is easily scalable. I would like to be able to understand the design choices that the original developers made, and be able to improve upon the application.  
16. As someone who looks through grant applications, I would prefer to give funding to a scalable project that has practical application and is easily usable. The more intuitive this website is to use (and to further develop), the more likely I would be to give funding.

# Prototyping Code {#prototyping-code}

All the source code will be hosted in GitHub as open source.  
[https://github.com/UCD-193AB-ws24/Wirecracker](https://github.com/UCD-193AB-ws24/Wirecracker)

# Technologies Employed {#technologies-employed}

**CSS Framework \-** Tailwind CSS  
**Javascript Framework \-** React.js  
**Back End \-** Node.js  
**Database \-** PostgreSQL  
**Project Management Software \-** GitHub Projects

# Real-World Constraint Analysis {#real-world-constraint-analysis}

## **Cost** {#cost}

During the development phase, the cost will be $0. We are using Supabase to store information since it is scalable, and our needs align with the free tier for now. In addition, we are using Vercel to host the website, which also has a free developer tier.  
For the final product, the cost will be under $50 a month to pay for both Supabase and Vercel. While the clients are not expecting significant website usage, its long-term usage requires the paid versions of both.

## **Space** {#space}

Due to the fact that the data should be text/number-based and easy to store and there will be relatively few accesses to the website due to highly specific use cases, we will be using a relatively small database.

## **Security** {#security}

Single Sign On to login to the web application and other measures needed for HIPAA compliance. As a team, we thought about integrating CAS into this application for security, but our client informed us that their vision included the web application to be used in different hospitals and by epileptologists that aren’t a part of UC Davis.  
With sign up, we use 2FA with a verification code sent to the user’s email address.

## **Privacy** {#privacy}

Data stored on the cloud must be HIPAA-compliant. This can be done by completely anonymizing the data.

## **Scalability** {#scalability}

The app is going to be open source and it will use commonly used frameworks that allow 3rd party developers to easily add features to the app in the future.

## **Maintainability** {#maintainability}

We are using technologies that have plenty of documentation and are widely used, especially for projects that have a similar scope. 

## **Acceptance Test** {#acceptance-test}

To ensure client satisfaction, we are having weekly meetings in which we go through the progress made. Additionally, biweekly, we will have the clients go through the website, noting pain points and features that they seem to like.  
We will also conduct user testing with hopefully more than just epileptologists, as we have been in contact with the client discussing potential user testers. The target goal is to have neuropsychologists and neurosurgeons go through the website and give their feedback.

# **Social and Legal Aspects** {#social-and-legal-aspects}

By the nature of this project, the application will handle patient data and must be HIPAA compliant. While most patient data will be stored locally, for data stored on the cloud, we plan to implement an authentication system that includes user IDs and passwords, with the addition of multi-factor authentication. Additionally, patient data on cloud storage can be encrypted and tagged to ensure both confidentiality and integrity.

# **Glossary of Terms** {#glossary-of-terms}

EEG \- Electroencephalogram. A medical test measuring brain electrical activity.  
Epileptologist \- A neurologist specializing in epilepsy  
HIPAA \- Health Insurance Portability and Accountability Act. A law requiring protection of sensitive health information from disclosure without patient consent.  
Neuropsychologist \- A psychologist specializing in how brain injuries or illnesses impact behavior and cognition  


[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnAAAAHXCAYAAAA84mdoAABbTUlEQVR4Xu3dCbQcVYH/8ZdAhAgh7KCgQAIjR0AQIQEUZTEZIAEdjIITUIKIAkNAZBSIMipiVCJbXMYFRUGEkUVQMALKYgIGxARwOWJCkDWg/EWiSFS8//OrmV973031e939ql66qr+fc+q87ltVt6puddX9veru6r4AAACASulLCwAAANDdCHAAAAAVQ4ADAACoGAIcAABAxRDgAAAAKoYABwAAUDEdB7hFixZlg82cOTPMnTs3mgIohl5XfX19jWHevHnpJC3p9PU5bdq0sGLFirQY6Bk6v/v4a+c40rE6lGNn+fLlHR/vQDPjx49vvJ71OM4yKb328+h1rb5hdSo8wKlMDRI3ig9+H/ja6EmTJmUHpgaNmzhxYnawAim9btIDRa+bCRMmNMKVD0Z3FnrN+SBVmUOgX4OeXjQ+7qDMBzcBDr0u7sR0POj40/la520dJx7v87+PGQc4H2Pi48zHdHqsio9pLwsokvqONL9I2pfE/UY6zgHOr13zNCoXLSd+Lmkm6lThAc4HnIa4TBurDVC5nmucTgCTJ0/O6tF0Q90Y1FOzABcfIO4ofCD69eVx4teXD8Z4vrjD8Ws7HQf0qjjA6ZytY0vHhY8pd4g+n/vc76Dn49fHlo8r150eqyrz8UiAQ9HSAJf2H/GV37hPicf5NezXrl+/vhDl17Bf53E/pDJNH4e6ThQe4Pxfma+oaUWdSDVouvi/Km8EnSSaaRbgXOZAJu5cfLC5E4ini1+TcUchPhjjOnltotfFAc7BTcdMfLVBx016rGia2bNnhxkzZmTPNV/cH+Qdq+5D4jKgSGmAi/+p92szDXDpuDicxXXEr2/R61mP9ZpO+x9P06mO53ZHJ16p+AqaO9g4rFlemeaNTxKADRbgfDCJ/3FIOwWJA1wsL8DFdaadEtBr4nOzz9U61nzc+Mpbeqz4OPL8cR9h6bEaH6MEOJQhDXDp1bL4dddsXFqm13b8j3/6Wtc8vqhV1Gu64wAXH5RaGf8H5gNZZb4q54NaB7yfa7yn10Z544HUYAEuDlx+Taadgvj15YPMr7t4Ggc4/Y0PUh+UQC/KuwIXBzif/90xanoNPoZ8TOmvO053jM2OVT8vqrMDLA5wzi9xIItfd2mA87i4b/DrOu5bfDFBGcfzifuz+EpzpzoOcAAAAFg9CHAAAAAVQ4ADAACoGAIcAABAxRDgAAAAKoYABwAAUDEEOAAAgIohwAEAAFQMAQ4AAKBiCHAAAAAVQ4ADAACoGAIcAABAxRDgAAAAKoYABwAAUDEEOAAAgIohwAEAAFQMAQ4AAKBiCHAAAAAVQ4ADAACoGAIcAABAxRDgAAAAKoYABwAAUDEEOAAAgIohwAEAAFQMAQ4AAKBiCHAAAAAVQ4ADAACoGAIcAABAxRDgAAAAKoYABwAAUDEEOAAAgIohwAEAAFQMAQ4AAKBiCHAAAAAVQ4ADAACoGAIcAABAxRDgAAAAKoYABwAAUDEEOAAAgIohwAEAAFQMAQ4AAKBiCHAAAAAVQ4ADAACoGAIcAABAxRDgUJi+vj6GggcAAPLQQ6AwBI5i0Z4AgGboIVAYAkexaE8AQDP0ECgMgaNYtCcAoBl6CBSGwFEs2hMA0Aw9BApD4CgW7QkAaIYeAoUhcBSL9gQANEMPgcIQOIpFewIAmqGHQGEIHMWiPQEAzdBDoDAEjmLRngCAZughUBgCR7FoTwBAM/QQKAyBo1i0JwCgGXoIFIbAUSzaEwDQDD0ECkPgKBbtCQBoptQe4vbbbw+HH354eM1rXhNe8pKXhBEjRoSRI0eGl7/85eG1r31t+OxnPxvuu+++dDZUFIGjWLQnAKCZUnoIhbLNNtss7LbbbuHSSy8Nd999d3jiiSca43/729+GH//4x+GYY44J48ePDzvssEP43e9+F9WAKiJwFIv2BAA0U2gPcckll4RZs2aFlStXpqMGtWTJkjB9+vSwcOHCdBQqgsBRLNoTANBMYT3EWWedFbbddtu0uG1rrLFGuOqqq9JiVACBo1i0JwCgmUJ6CIW33XffPTz22GPpqLbdfPPNYfTo0WkxKqCowLFo0aKwfPnytLglmnfy5MkDzq9xmq7bFdWeAID6GXIPsXjx4nDHHXekxUOmQIhqKSpwxAFu3rx5Wb3Tpk1rjNdzDRqn6SZOnJg9nzlzZm6AU7nHr1ixIqtLn73UtHrsukRlEyZMyOr0suPxc+fOzZ7PmDGjX33xNEUpqj0BAPUz5B7iDW94Q1pUCHWQp5xySlqMLlZU4HCA018FLYckUYDyNApqKleZg1degNM0qkOvqbjueJwDnQYHMden+j2dyxTwFOA8iOsoSlHtCQConyH1EJtsskn2DdNW3XnnndnQqs997nNh6tSpaTG6VFGBwyHLwcll999/fxacYvFVMgeoNMD5qpnDnwOc/jqsKYQ5CHpeX7nT4ADnsKZp9dhX/zx4GUUoqj0BAPUzpB7iyCOPTIty3XXXXeHNb35z2GOPPbJBj1XWiu222y4tQpcqKnDE4coBTo+XLl3a761U8Vudml7BLS/Ameb1tJpOgcwBLr6S53lVd7weeQHOyyxDUe0JAKifjnsI3aR3MLq325prrpk7rcre+973hjPOOCNcc8014Tvf+U42XHvttdlw3XXXZcPXv/718MILL6SzowsVFTjiEJV+Bk4hyle7NM5X12bPnp1Nkxfg/Bk1Xx2L3zJNP78WL9vjLr744kadXp5ul5N+Bq7Iq29SVHsCAOqn4x7i9NNPDwcddFB44xvfmF1V23XXXcNOO+0Uttlmm7DFFluE9ddfP/s26X/913+lszbo1xk233zz7Ircm970pmw45JBDsuHggw9uDNdff306K7pQLwUOX7ErUy+1JwCgPR33EPoprBtuuCHcdNNN2efa7rnnnuwzSg8++GB49NFHwx/+8Ifs6sQzzzyTztowatSolq6unXbaaWkRulAvBA5f/fNbqWXqhfYEAHSmox5i2bJl2e+ZDuahhx5Ki/pRHYNNI1tttVVahC5E4CgW7QkAaKajHmLBggVhzz33TItzKew1s/HGG6dFufQ5OnQ/AkexaE8AQDMd9RD6soE+r9aKl73sZeGiiy5Ki7OyVn/AfoMNNghPP/10WowuQ+AoFu0JAGimox5CXyo48MAD0+Jcul3IuHHjwrHHHtso02OVtWrdddfNPk+H7kbgKBbtCQBopqMeotXPwKWee+65bGgXn4GrBgJHsWhPAEAzHfcQw/mD87oHF7ofgaNYtCcAoJmOewjdRmS4cBuRaiBwFIv2BAA003EPkffrCmV4/PHHW7pXHFY/AkexaE8AQDND6iHmz5+fFhXunHPOSYvQpQgcxaI9AQDNDKmH2GSTTcLdd9+dFhfmc5/7XJg6dWpajC5F4CgW7QkAaGZIPcT5558fpkyZkhYXQj/Ftemmm4Y77rgjHYUuReAoFu0JAGhmyD3E4sWLSwlZu+++e1qELkfgKBbtCQBoppAeYrvttguPPfZYWtyx73//++Hee+9Ni9HlCBzFoj0BAM0U0kOcddZZ2RWzIkLczTffPKz3mENxCBzFoj0BAM0U2kNccsklYdasWWHlypXpqEEtWbIkTJ8+PSxcuDAdhYogcBSL9gQANFN4DzFjxozs26m/+c1v0lFN6TN0a621VvjIRz6SjkKFEDiKRXsCAJoprIf485//HH72s5+FOXPmhJNPPjnsv//+2Wfj1l577bDGGmuEESNGZB2SBj1Wmb5luuOOO4YDDjggfPCDHwxz584Nv/rVr9KqURHevwzFDQAA5BlSD6HAduGFF4ZXvvKVWSBTGHvf+94Xzj333PDDH/4wLFq0KPzud7/Lwt3f//73xnx/+9vfwooVK7KrdLqP3Lx588Ls2bPDcccdF8aNG5eFPj3++te/Hh588MFoicDQPPvss+Ed73hHWgwAQKW0FeB0b7azzz477LHHHtmVtuGi30JVsPvqV7+ajgJapvCmL8joypYeAwBQVS0HuA996ENZ53fMMceko4bNgQcemL0tC3RCn7EcM2ZMFuD4vCUAoMpaCnBf+9rXsuCmb4qubrfcckvYa6+9wm233ZaOAgbkq28a9JircACAqhowwN1zzz3h/e9/f1rcFXTPuYMPPjg899xz6ShgFX77dOzYsY0Ap28+AwBQRU0DnL6EsN5666XFXWfPPfcMTz75ZFoM9KPPbOq3e0UB7swzz+SG0QCAysoNcA899FD45je/mRZ3rQ984ANpEdAUt+cAAFRdbk82adKktKjr6T5yQCsIcACAquvXkz3wwAPZ/dy64csK7frWt74Vdtttt7QYWAUBDgBQdf16sqOOOip89KMfjYsq5aCDDkqLgFUQ4AAAVdevJ9twww3D888/HxdVim4xAgyGAAcAqLpGT7Zy5crsywtVp99VBQZCgAMAVF2jJ9PvjtbBRhttVMnP8GH4EOAAAFWX9WS6yemIESPScZU0b9688LrXvS4tBhoIcACAqst6sm9/+9u1+gLAuuuuG5YvX54WAxkCHACg6rKebMcdd8x+NqsuzjvvvHD88cenxUCGAAcAqLqsJ9MVqzpZuHBh2HXXXdNiIEOAAwBUXdaT7bvvvml5pf3jH/8II0eOTIuBDAEOAFB1WU920UUXpeWV9453vCMtAjIEOABA1WU92YIFC9Lyyjv77LPTIiBDgAMAVF3fH//4x7SsFvQ5OCAPAQ4AUHV9v/zlL9OyWnj88cfTIiBDgAMAVF3fFVdckZbVBveCQx4CHACg6vo+//nPN56MHz8+69w8TJw4MZr0n2bOnBnmzp0bpk2blv3yQas0T54VK1a0XE+zaRctWhQmT57cr+z+++/v9xwQAhwAoOr6Pv3pTzeeTJgwIQtCrVodAa6ZvACne8HFgbQqw1e/+tV+24FiqY0BAKiyvlNOOaXxJC/AKVi5w9OVNw/xFTjPpyCmcaKreSrTVTyHMwc4lentTU2jcQ5wmt7PXY/m8fh4WpVrGtWj9cgLcNdcc02/51VBgCsXAQ4AUHV973nPexpP0rdQFZAUlvxWqkNSGuD0V8FK/DgOYPHj+K/DYBrQRMtcunRpVp94mjTAWV6A++Y3v9nveVUQ4MpFgAMAVF2fA5I0uwLnAOfHaYCLg5S5zCFNigxwpitwCm55Ae7CCy/s97wqCHDlIsABAKqub8qUKY0nzQJcq2+hiq/A+W3Sst5C9ToM9Bbqpz71qX7Pq4IAVy4CHACg6vpe+9rXpmX9KCzFV+la5bBWFAW0NFwO5vTTT0+LKoEAVy4CHACg6vpe85rXpGX9rO4Apytt/kxeu+IvaFQJAa5cnbyWAADoJn077bRTWlYbJ5xwQlpUCQQ4AAAwkL5tttkmLauNo446Ki2qhMECnD+X6MGfKYz5ix2D0Xx50/nLIQNptgx9TlHrVdRVWC8n/rZzK9JvKg/Gn6vsVLys9Ms2KV/Zbmd7JP7STjPtbDMAoJr6ttxyy7SsNqZPn54WVcJgAc4GChyDdfLW7LOFKtOXUzqhedNAORR5X64pmoKUAlWz9mxFO8GprADn7QAA1FvfRhttlJbVxqGHHpoWVUK7AU6d+uLFixudt8JBersX8xW3+Ju/DlxxHQ5wcWBIr2jF5a43rs91xOulbx6L5vG0KvM3lpcsWZIN8XId4Bx4vA6qL77VjL+xbF5f1ZMXfNJvOjvA+a8fa/C0Xoe4ndNvTovbV3VoGm+HxQHO8/nWOQ6RKk/3S952xNN7ujjIabzqVf15rxe3vdfJbZa3zwEA3aFv7NixaVltHHLIIWlRJbQb4MxvqcbBQp1w+laopnHn7hAVj9MQB6f4Bs++J6DEnbzCQBzi9Dj+Aoym8Xr5uedRPXHg0GMty7/mEQc41yt6vGDBgsZ8DlLm8KHxeV9ccKBU3XGA83a57Vwu8VvXqjt++7pZgIuDl7lt4u3R+Jtvvrnf/jAvMy/Aua0kDXqiafW7wPEtfTxf/HrRPG6zdJ97GwEA3aFv9OjRaVltHHDAAWlRJbQb4Bw0HLbcIXu8A46oI3Zn7HnjsOI6HJx8dUbTpnUNFuBch0NFKwHOwSYOV61egWsW4GbMmNGvfovr0Xo4qPmvH8cBzuvkslauwKWBSryd8Xx5V+DS/ZIX4LxNXo7rdbuoPl+B07R5daZX4NJ9HrcrAGD161trrbXSstqIO8wqaTfAubPWoLDiYOErKXFnL76y4gAVd/yuw526pnFHn16JGSzAiUKBr1a1EuC8XK2Dnnser5un81WnOKg0C3D663WIaVnx1Su3l9fB26v6HarSurx9mq/TAOft8X7Scn3lK923eQHO07vMwc/b5+1wSEvr9PpoWj33/Hn7HADQHfpGjRqVltXGG9/4xrSoEloNcEDR4rAKAOhefSNHjkzLamPfffdNiyqBAAcAAAbSN2LEiLSsNvbZZ5+0qBIIcOXSW4UAAFRZ30c+8pHGZ6LqNtxyyy3p9lYCAa5cem0AAFBl9GRdiABXLgIcAKDq6Mm6EAGuXAQ4AEDV0ZN1IQJcuQhwAICqoyfrQgS4chHgAABVR0/WhQhw5SLAAQCqjp6sCxHgykWAAwBUHT1ZFyLAlYsABwCILVu2LPzkJz8JX/rSl8JZZ52V/SrN3nvvHbbffvvwkpe8JGywwQZBP3yQ3q5Mg8o33HDDbDpN//rXvz689a1vzepRfapX9ReNnqwLEeDKRYADgN71xz/+MSxcuDCcdtpp4c1vfnMWutJQ1mzQz49uvPHGYcstt8z+6nk6TbNBy9HytFyFumeeeSZdtbbQk3UhAly5dCABAOrvk5/8ZJgyZUoYO3ZsI0itvfbaYZdddgn6IYMrrrgi3HvvvelspdBytDwtV8vXenid1l9//TB16tQwe/bsdLam6Mm6EAGuXAQ4AKi3008/PYwfP77fFbCjjz666/pXrY/WK17PbbfdNpxxxhnppKugJ+tC3fYCqxsCHADU06c+9amw2267NcLQ8ccfHy677LLw8MMPp5N2Fa2f1lPr63XXdmh7mqEn60IEuHIR4ACgPs4777yw6aabZuf2ww47LFx99dXpJJWk7dD2aLu0fdrOGD1ZFyLAlYsABwD1sHjx4sYVq0mTJqWja0Hb5W3U9ho9WReqaoCL38NnKGYAWpW+dhiGNqD7jRkzJttXL7zwQjqqlrSd2l5tt/Aq7UJVDnAoDu0JAM3pHDl9+vS0uNaOOOKIRt9AD9GFCHAQ2hMA8n3+85/Pvr3Zi7Td2n56iC5EgIPQngCQ76ijjgpbb711WtwT9tlnn+yGwPQQXYgAB6E9ASDfySefnN38thepb9D200N0IQIchPYEgHz6NQOdI3vtPOltzrY/HYnVjwAHoT0BIJ8CTPY24v+FmbpbtmxZ9raxtld/CXBdigAHoT0BIJ8CjINbfDWuTmFOoS3eNgU38bbTQ3Shbg9wc+bMCc8++2xaTOAoGO0JAPniACcKO/pwv86b+nLD1772tX9OXDFpcNP23HLLLY3xBLgu1u0B7vzzzw+jR4/OBn2Q0mGOwFEs2hMA8qUBLhaHuTgEKdTFQagbpGEtXt9mCHBdrNsDnIwdOzZ7kemO0ApyCnEEjmLRngCQb6AAZ/HnxuJB4U7lCnOaZjhpeVqu1j0vZPpt0oEQ4LpY+mKrwvCOd7wj+4vi0J4AkK+VABdzmEtDkwYHJw2+SjfUYOegpvq0nnlB0svW+HaWR4BDx+K3UPUi4i3UctCeAJCv3QA3EIUnBS0NDnkKVmnYamfQ/L7Sp/Us8jN5BDh07EUvelFYa621VvkiA4GjWLQnAOQrMsANROEuHnRVLW/w+OFAgEPhCBzFoj2B3jZt2rQwb968tLhh+fLlA47vVlrvyZMnp8VtGa4A140IcCgcgaNYtCfQ2wYLcFVFgBsaAhwKR+AoFu0J1M/cuXOzALNo0aIwYcKELKBNnDgxK9Pf+Pn48eOz5wpyK1asWCXQ+QrczJkzG3X7sSgkOSxpeRrv+fRc8+qv6xbNn7dMrZPnl3hZmia+GujnrlPTqi7/1XTaNs2vsnS9W0GAI8ChQASOYtGeQP04xDhYxeFFfz2Iw1P84fg46Dg0ORApjMU0f3we0byuR8vVfKpDHCw1jx6ny3S4NC1Ly3T9mtfTq3zBggWNAOfl+Lm33duWrncrCHAEOBSoiMAR/4fpg9v8X2lqoP/cBhrX7YpoT2Aw7px9bKkzzTvOUr5C00x8VWcgcajoBZ0EuGbnsfiql0NX2uYOVnn1xAFO+/3KK6/Mpsm7IpYGOFOZxt1///39gli8/5sFOMtb78EQ4Ahw6IC+gapvopbxLVQd6O4YZsyYES6++OLGCcYnD5/sfcC7A8pbfjrOJxWf0OLHeScc0cnM/23G/+W64/HbCpp30qRJuSe5TsTbo7bWAau27xZ+W6ZVrXboMbdtO9KOJ+WA4o60HfE/GKm8de1kmwfT7PjrlNpLx5rezpM4wPkKi44h03OV+zjVkBfA4m33sZLuG42P283j0zr9dqPW45hjjlll+nQ9tY+8jkUo8vhLA5zL4nOJ28tXqTw+bj+fo/zX+yU+JvPmi9s1Ps9JHOTTedMAl55LPY2ep2/L+vzq/apyv72redL1Tqnd41/9EQIcAQ4dKPOntPxfmv8uWbKk0aHor4e0c/A0aeeajks7VHdCPoH4BOrQpnF+K0Dza1CdGq8yTRN/TiXtoIbC7an2VVvrVy/U9t2iqgHOnVaRAU715K1rJ9s8mPT4Gyq/nr3+Pl7cRp5G26Jx8XGkv25vlcevB0/jY0PPFRRjDgmptE4v12UOA96XHuf1TNdlKLr1+BOfF+tO7e5f/fFrngBHgOtK/g+pSkORv8TgziQ+KfuxT/gedAKLO+y0807HxR1qeuJX3SpbvHhx9nzWrFmN8f5P0f+hqo54PTR9s869U6r3xS9+8Spt3crgDjP98LK3Mf7P39sWBxBth8riTljP4/Dqut2Juj31V9J5HXY1v/eL19McpF2X1yne/5rX66vHzfa5/8ZXFcTrqPkdDrwdXp84dHn9NY/Dero+cYDz9qgOv1bisKF/SsT7wW3quuJgrOfpvk2HUaNGZcdfp7x80brOnz9/lX2pv34dxdu3dOnSxlUXDfFrKG5HlafjU25Dvx7jOv2a8HTpayNujzhkDoXatNPjb6ABzaVt1WzQa37nnXcmwKUjgFb4t1A1FP1bqDoB6z/1uBObPXt29jivA4g78GaduR/HnYo7AlGZ69bbtgpvmj69YuBOPi+s5ZUNhdpTB6nat92Tv0ODw4DmdThykHKd+uxK+vaIQ0scwlyXBj1Ow6H4cRw8HLJcV7z8VLy/HGosrs/r69AT87K8PemVQgcTh5E4nHgZ8bp5/SXexw4OXp7X1dsXBzjxclyP94nr8bh436Th0+LjT6+RobydqvX3umu99Jr3unrZ3u9xMHKAiz/LFIuPtbzn4jYyrYuDbSxeF4n3SV5Yyytrl9827eT4Q/HiY1P75fTTTyfApSOAwQzHLzGkHXl84o87N3GHnrf8dFzaibgjjcOLPmvjDj3uJNIOVeNUlte5FyHenrgzaUV8xcgdr+ivr5qIttHP43XXPG4Hhwxf9fL+aHYFzp1tOq+fx8HMn4Mxr7frcsjS8vy3lQAX/01DkNc3DXAq1/qlrxGvv9tTz72vvT5xgIvDkObxunu5+uvnqk/z67Hrczu7jjSINDv+OhUHONFjt5fDpF8v4uNPQU/rpsFl4vZM95vGx8sxH0fx6z2tMw1wbnfzeuqvuI2L0u7xh2LpNZ/+o+IQUxb3Gx70etPrMP3nYnUgwKFjc+bMye084hMwhi6vPdX2rfDJxyHLz93BqUzPHUzSAOdO11faHGL0JQ2HwvjKVtzZuvPV/L6CqZOf64o79HiZotAYX52LQ5HKdSXWIadZgHO9XobX0fTcoSUOcKIyn6xjDhluC0/n9VE9bhe3haZVONb4eJu0PD1W2zjkaXs8v4OupolDizU7/rpNGoTroNXjr0x5r/lOFRV0fbzlSf9J60Reuw9HgPP5ya9lAhxqyx0UitFt7ZmGvDLkXXFC9TiENuvU0bkiA1xRBgpw6RXwogxngJP0Cpz/ifM/Xr4qnPcPYNEIcChctwWOqqM9gd7ggKN/XhQafFVWFAb83FeC4oDg55rGV8Ud8hxCNI2vHHt5mk5l/hyjnvuzx64/rk/iK3ZeFy9Lj/UFGG+D/xlzgPOXd+Ir90MxHAHOV9M1aDvzrsDF26/H8X4oCwEOhSNwFIv2BHqHr96kAU6hQGXx8zTAOVz4rXcNmj59+9LLcCBxIFO5HvtzjXnBxetmKvPnZOMrcJ42DXAOfL5iNVTDEeDSdxwc4LwtbiMHOO+7WgS4++67Lxx99NHhta99bXj5y18eRo4cGUaMGBFe8pKXhNe85jXZ50duv/32dDZUFIGjWLQn0BvU2cdXxdIAN9gVuHgaPdag8vgKnMs1nQaVO8ClocOhy/P7CpzXU/KuwOlv/DwOcH5ehwDn9vX21SrA/e53vws77LBDtqO++MUvhh//+Mfht7/9bWP8E088Ee6+++5wyimnhN122y1sttlmWdhDNTT7EDWBo1i0J9AbfNUrDWPi8KRwoD5VV8nyApz4KpxDk587bIivGrlOl6sOP/aVOtcbX5WLuf44wGgaXZzx1T+P1zp5G9Ng1InVGeC8f7Q9uu2UtqnyAW7hwoVh+vTpjfe627Fy5crs3luXXHJJOgpdJr0TfJG/xIB/oj0BIF/ZAa6bFR7grrrqqrDGGmukxW3bdtttw1lnnZUWo8v4RqL+eZMib+SL/0V7AkA+AlxBAe7aa6/NOvGbb745HdW2xx57LOy+++5pMZrYZ599Gpe2V+dQ5E9p4X/RnsDqk57jqj6or6gTAtxHiglwn/vc59KiIdPVPP0mJQamA3O4xW+h6kXEW6jloD0BFKVu55OhBLg42MafJ0z5M2954m/eDrfCApy+iFCGz372s+ENb3hDWozE6jgom/2Uz+pYlzqjPQEUpW7nk6EEOIe2vG/1xmod4KZOndrW1bef/exnYcGCBWlxU/qm6iabbJIWI9JNB2U3rUsd0J4AilK380kRAU4c4hTWdF878TdyHeDyxvkbt67P9Yind8jTOH17OL41i7+524lCAtx2222XFuX6/e9/H0488cSw8847h7322ivsscce2ZceWnHkkUemRYh000HZTetSB7QngKLU7XxSdICL+fYqeVfgPE5/fauX+P544luJpFfpPI9v8ZLW3aohB7gXXnghPP7442nxKl7xildkn5lK/eEPfwhve9vbsluHXHrppeE73/lONugLER6uu+66bOBmv81100HZTetSB7QngKLU7XxSVICLr5Y5kKUBLm9cWnb//fc3njvAmUNifEVuKIYc4K6//vowZcqUMGnSpOyqmm7I+6pXvSqMGzcuvOxlLwsbbLBBWGeddcLrX//6dNaG9ddfP2y++ebhwAMPDG9605uy4ZBDDmkMBx98cDacfvrp6az4P910UHbTutQB7QmgKHU7nxQR4OLPwDmQuSwvwMXjVBa/hZrefFk3MPavUuS9hapxnr5dQw5wp512Wvje974XbrzxxnDHHXdkn1e79957sx/GfeSRR8L/+3//L/zpT3/KrqQ1o5/T0ryD0U9xIV83HZTdtC51QHsCKErdzidDCXBqCw9pmFPw0q8rKGw5cCnXpON8NU11+G1ShTI91y9ROOh5mvTXMobyk2JDDnBbbbVVWpTrwQcfTIsaDj/88HDZZZelxavQ76guW7YsLUboroOym9alDmhPAEWp2/lEX6DUb633Im23tr/jPbrmmmumRbm+8Y1vpEUN+nxcK/d623PPPdv69mov6aaDspvWpQ5oTwBFqdv55Lbbbgsbbrhh+POf/5yOqjVtr7Zb29/RHn366aezz7i1Qp9re//7358WZ2+56u3XVqgOfcEBq+qm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>