# **Anatomy Page**

### **Overview**

The Anatomy page allows users to define and configure electrode placements on the brain. This is typically the first step in planning a patient’s stimulation workflow. It supports anatomical localization, contact setup, and collaborative sharing with epileptologists.

### **Key Features**

* Electrode creation via a floating action button

* Modal-based interface for electrode and contact setup

* Customizable electrode labels, types, and contact counts

* Integration with brain structure database for description autofill

* Editable contact-level information with location classifications

* Seamless sharing to Epilepsy planning workflows

---

### **Interface Layout**

The page consists of:

* Floating “+” button at the bottom right to create a new electrode

* Blue electrode bars listed across the screen

* Expandable views for electrode contacts

* Pen icon (edit) and trash icon (delete) for each electrode

* Bottom buttons for workflow continuation: **Share with Epileptologist** and **Open in Epilepsy**

---

### **Creating an Electrode**

1. **Click the "+" button** (bottom-right corner).

2. A **modal** will appear with the following fields and options:

#### **Electrode Modal Details**

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

### **Managing Electrodes**

* **Edit**: Click the **pen icon** to reopen the electrode modal.

* **Delete**: Click the **trash icon** to remove the electrode.

* **Expand**: Click the blue electrode bar to reveal its contact list.

* **Edit Contact**: Click a contact to open the contact modal.

---

### **Editing a Contact**

In the contact modal, users can classify each contact's brain location using one of five predefined types:

| Contact Location Type | Meaning |
| ----- | ----- |
| GM | Gray Matter |
| GM/GM | Between Two Gray Matter Areas |
| WM | White Matter |
| OOB | Out of Brain |
| GM/WM | Between Gray and White Matter |

---

### **Workflow Integration**

At the bottom of the page are two buttons to continue planning:

* **Share with Epileptologist**

  * Opens a modal to enter the **epileptologist's email**.

  * Automatically creates and shares a new **Epilepsy page** with both the user and the specified recipient.

* **Open in Epilepsy**

  * Instantly creates a new **Epilepsy file** linked to the current electrode data.

---

### **Troubleshooting**

| Issue | Solution |
| ----- | ----- |
| Cannot create electrode | Ensure a valid label and a contact count \> 0 are entered |
| Autofill not working | Confirm electrode name matches database convention |
| Electrode not visible after creation | Refresh the page or check for duplicate entries |
| Contact edit modal not opening | Make sure contact is fully visible and clickable |

For best results, use the Anatomy page on a desktop or laptop device.
