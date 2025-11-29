import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate} from "react-router-dom"; 
import { User, LogOut, History, Settings, Wrench, BarChart, TrendingUp, Search, Activity, BookOpen, Cpu, GitCompare, Edit, MoveRight, HelpCircle, Mail, Phone, Lock, Sun, Moon, Bell, BellOff, X } from "lucide-react"; // Added X for close button
import fglogo_Wbg from '../images/fglogo_Wbg.png'; // Ensure the logo path is correct
import { he } from 'date-fns/locale';
import Header from "../components/Header";
import Footer from "../components/Footer";
// --- UTILITY FUNCTION FOR DIGIT COUNT ---
// Helper to count only digits in a string, ignoring separators.
const getDigitCount = (str) => {
    return (str.match(/\d/g) || []).length;
};
// --- COUNTRY CODE DATA (NEW) ---
const COUNTRY_CODES = [
    { code: '', label: 'Select CC' },
    { code: '+91', label: 'India (+91)' },
    { code: '+1', label: 'USA/Canada (+1)' },
    { code: '+44', label: 'UK (+44)' },
    { code: '+61', label: 'Australia (+61)' },
   
];
// --- VALIDATION REGEXES (USER CHANGE 1 & 2) ---
const VALIDATION_REGEX = {
    // Basic email format validation
    email: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,    
    // Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
};

// --- COLOR DEFINITIONS (ADJUSTED TO NEW IMAGE) ---
const COLORS = {
  // Page background and main content areas
  PageBackground: '#f3f1f1ff', 
  SidebarBackground: '#FFFFFF', 
  CardBackground: '#FFFFFF',  
  
  // Text and accents
  PrimaryText: '#151515ff',     
  SecondaryText: '#777777',   
  Accent: '#6e778dff',         // Muted purple/gray for active items/borders
  EditButton: '#d0d0d0ff',      
  Border: '#a9a4a4ff',          
  Error: '#EF4444',          // For Logout/Error color
  TextLight: '#ffffff',
  Success: '#38A169', // Green for success buttons

};

// --- DUMMY DATA (UPDATED FOR DOB FORMAT: YYYY-MM-DD) ---
const initialUserData = {
    firstName: "Dhruvinee",
    lastName: "Tandel",
    dob: "2005-10-11",
   countryCode: "+91", // Change from "" or any empty value to a default valid code
    localPhone: "7383135327", 
   email: "dhruvineetandel05@gmail.com",
    username: "DhruvineeD05", 
    userSince: "05/10/2025", // New field for clearer display
    profilePicUrl: "https://via.placeholder.com/200/F0CC8F/E5BA73?text=JD", // Yellowish profile pic
};

// Activity log data (Your Blogs section)
const activityLogData = [
    { type: 'blog', title: 'My First Investment Strategy', date: 'Oct 25, 2025' },
    { type: 'analysis', title: 'Ran Q3 2025 Financial Analysis', date: 'Oct 20, 2025' },
    { type: 'blog', title: 'Deep Dive into Tech Stocks', date: 'Sep 15, 2025' },
];

// Summary History Data 
const summaryHistoryData = [
    {
        dateGroup: 'Today',
        items: [
            { company: 'Company #1', summary: 'summary....................', pdfCount: 2 }
        ]
    },
    {
        dateGroup: 'Nov 3',
        items: [
            { company: 'Company #1', summary: 'summary....................', pdfCount: 2 }
        ]
    }
];

// Settings state data
const initialSettingsData = {
    theme: 'light', // 'light' or 'dark'
    emailNotifications: true,
};

// --- STYLES DEFINITION (Mostly retained, added styles for edit button and modal) ---
const styles = {
    // --- APP WRAPPER ---
    appWrapper: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: COLORS.PageBackground,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },

    // --- MAIN CONTENT LAYOUT ---
    mainLayout: {
        flexGrow: 1,
        display: 'flex',
        padding: '20px',
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        gap: '20px',
    },

    // --- SIDEBAR STYLES ---
    sidebar: {
        width: '20%',
        minWidth: '200px',
        height: 'auto',
        padding: '2px 0',
        display: 'flex',
        flexDirection: 'column',
    },

    sidebarHeader: {
        fontSize: '1.8em',
        fontWeight: 'bold',
        color: COLORS.PrimaryText,
        marginTop: '0px',
        paddingLeft: '10px',
    },
    navItem: {
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        padding: '12px 20px',
        margin: '5px 0',
        color: COLORS.PrimaryText,
        textDecoration: 'none',
        fontSize: '1em',
        fontWeight: 'normal',
        cursor: 'pointer',
        borderRadius: '25px',
        transition: 'background-color 0.2s, color 0.2s',
        border: `1px solid ${COLORS.Border}`,
    },
    navItemActive: {
        backgroundColor: COLORS.Accent,
        color: COLORS.TextLight,
        fontWeight: 'bold',
        border: `1px solid ${COLORS.Accent}`,
    },
    navItemHover: {
        backgroundColor: COLORS.Border,
    },
    navItemLogout: { // Style for Logout item
        color: COLORS.Error,
        border: `1px solid ${COLORS.Error}`,
    },

    // --- PROFILE CONTENT STYLES ---
    profileContentArea: {
        width: '80%',
        backgroundColor: COLORS.CardBackground,
        borderRadius: '24px',
        border: `1px solid ${COLORS.Border}`,
        boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
        padding: '40px',
        marginTop: '10px',
        maxHeight: '650px',
        overflowY: 'auto',
    },


    sectionTitle: {
        fontSize: '1.8em',
        fontWeight: 'bold',
        color: COLORS.PrimaryText,

    },
    // Adjusted profileInfoGrid and added new styles for better visual separation without borders
    profileInfoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)', // Changed to 2 columns for a cleaner, non-table look
        gap: '30px 40px',
        marginBottom: '40px',
    },
    infoItem: {
        display: 'flex',
        flexDirection: 'column',
    },
    infoLabel: {
        fontSize: '0.9em',
        color: COLORS.SecondaryText,
        marginBottom: '5px',
        marginTop: '0px',
        marginRight: '0px',
    },
    infoValue: {
        fontSize: '1em',
        color: COLORS.PrimaryText,
        fontWeight: '500',
    },
    infoInput: {
        padding: '5px 10px',
        fontSize: '0.9em',
        fontWeight: 'bold',
        marginTop: '5px',
        marginBottom: '10px',
        width: '100%',
        boxSizing: 'border-box',
        border: `1px solid ${COLORS.Border}`,
        borderRadius: '5px',
    },
    infoError: {
        color: COLORS.Error,
        fontSize: '0.8em',
        marginTop: '-5px',
        marginBottom: '10px',
    },
    profilePicContainer: {
        position: 'relative',
        width: '150px', // Adjusted size
        height: '150px', // Adjusted size
        borderRadius: '50%',
        backgroundColor: COLORS.PageBackground,
        marginRight: '40px',
        marginBottom: '20px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        border: `1px solid ${COLORS.Border}`,
    },
    profileImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    editPicButton: {
        position: 'absolute',
        bottom: '2px',
        right: '0px',
        backgroundColor: COLORS.EditButton,
        color: COLORS.PrimaryText,
        border: 'none',
        borderRadius: '40%',
        width: '45px',
        height: '45px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    },
    editProfileButton: {
        backgroundColor: COLORS.Accent,
        color: COLORS.TextLight,
        float: 'right',
        border: 'none',
        padding: '10px 25px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'background-color 0.2s',
        marginBottom: '30px',
        marginLeft: '10px',
    },
    cancelEditButton: {
        backgroundColor: COLORS.EditButton,
        color: COLORS.PrimaryText,
        float: 'right',
        border: 'none',
        padding: '10px 25px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'background-color 0.2s',
        marginBottom: '30px',
    },
    saveButton: {
        backgroundColor: COLORS.Success,
        color: COLORS.TextLight,
        float: 'right',
        border: 'none',
        padding: '10px 25px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'background-color 0.2s',
        marginBottom: '30px',
    },
    profileOverview: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '40px',
    },
    usernameArea: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    usernameText: {
        fontSize: '1.5em',
        fontWeight: 'bold',
        color: COLORS.PrimaryText,
    },
    userSinceText: {
        fontSize: '0.9em',
        color: COLORS.SecondaryText,
    },

    // NEW STYLES FOR PHONE INPUT GROUP
    phoneInputGroup: {
        display: 'flex',
        alignItems: 'center',
        marginTop: '5px',
        marginBottom: '10px',
    },
    countryCodeSelect: {
        padding: '5px 10px',
        fontSize: '0.9em',
        fontWeight: 'bold',
        height: '40px',
        marginRight: '10px',
        width: '120px',
        boxSizing: 'border-box',
        border: `1px solid ${COLORS.Border}`,
        borderRadius: '5px',
        backgroundColor: COLORS.CardBackground,
    },
    localPhoneInput: {
        flexGrow: 1,
        padding: '5px 10px',
        fontSize: '0.9em',
        fontWeight: 'bold',
        height: '40px', // Match height of select
        boxSizing: 'border-box',
        border: `1px solid ${COLORS.Border}`,
        borderRadius: '5px',
    },

    // --- Feedback/Support Styles ---
    contactCard: {
        backgroundColor: '#f9f9f9',
        padding: '20px',
        borderRadius: '10px',
        border: `1px solid ${COLORS.Border}`,
        marginTop: '20px',
    },
    inputField: {
        width: '100%',
        padding: '15px',
        border: `1px solid ${COLORS.Border}`,
        borderRadius: '5px',
        marginTop: '10px',
        resize: 'vertical',
        minHeight: '150px',
    },
    submitButton: {
        backgroundColor: COLORS.Success, // Green
        color: COLORS.TextLight,
        border: 'none',
        padding: '10px 25px',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold',
        marginTop: '20px',
        transition: 'opacity 0.2s',
    },
    // --- Modal Styles ---
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: COLORS.CardBackground,
        padding: '30px',
        borderRadius: '10px',
        width: '400px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        position: 'relative', // Added for close button positioning
    },
    modalInput: {
        width: '100%',
        padding: '10px',
        margin: '8px 0',
        border: `1px solid ${COLORS.Border}`,
        borderRadius: '5px',
        boxSizing: 'border-box',
        fontSize: '1em',
    },
    modalButtonContainer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        marginTop: '20px',
    },
    // --- Activity Log Styles ---
    activityItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 0',
        borderBottom: `1px solid ${COLORS.Border}`,
    },
    activityTitle: {
        fontWeight: 'bold',
        color: COLORS.PrimaryText,
    },
    activityDate: {
        fontSize: '0.9em',
        color: COLORS.SecondaryText,
    },
    // --- Settings Styles ---
    settingItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 0',
        borderBottom: `1px solid ${COLORS.Border}`,
    },
    settingText: {
        fontSize: '1.1em',
        fontWeight: '500',
        color: COLORS.PrimaryText,
        display: 'flex',
        alignItems: 'center',
    },
    settingToggle: {
        width: '50px',
        height: '28px',
        backgroundColor: COLORS.EditButton,
        borderRadius: '14px',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    settingToggleActive: {
        backgroundColor: COLORS.Success,
    },
    settingToggleHandle: {
        position: 'absolute',
        top: '2px',
        left: '2px',
        width: '24px',
        height: '24px',
        backgroundColor: COLORS.CardBackground,
        borderRadius: '50%',
        transition: 'transform 0.2s',
    },
    settingToggleHandleActive: {
        transform: 'translateX(22px)',
    },

    // --- Summary History Styles (Change 4) ---
    summaryHistoryCard: {
        backgroundColor: COLORS.CardBackground,
        borderRadius: '10px',
        border: `1px solid ${COLORS.Border}`,
        padding: '20px',
        marginTop: '20px',
    },
    summaryHistoryItem: {
        border: `1px solid ${COLORS.Border}`,
        borderRadius: '8px',
        padding: '15px',
        marginTop: '10px',
    },
    summaryItemHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
    },

    // --- RESPONSIVE STYLES FOR MOBILE ---
    '@media (max-width: 1024px)': {
        mainLayout: {
            padding: '15px',
        },
        sidebar: {
            width: '25%',
            minWidth: '180px',
        },
        profileContentArea: {
            width: '75%',
            padding: '30px',
        },
    },
    '@media (max-width: 431px)': {
        mainLayout: {
            flexDirection: 'column',
            padding: '10px',
        },
        sidebar: {
            width: '100%',
            marginBottom: '20px',
            padding: '10px 0',
        },
        sidebarHeader: {
            fontSize: '1.5em',
        },
        navItem: {
            height: 'auto',
            padding: '15px 20px',
            fontSize: '0.95em',
        },
        profileContentArea: {
            width: '100%',
            padding: '25px',
            maxHeight: 'none',
            marginTop: '0',
        },
        sectionTitle: {
            fontSize: '1.5em',
        },
        profileInfoGrid: {
            gridTemplateColumns: '1fr',
            gap: '20px',
        },
        profileOverview: {
            flexDirection: 'column',
            alignItems: 'flex-start',
        },
        profilePicContainer: {
            marginRight: '0',
            marginBottom: '20px',
        },
        editProfileButton: {
    float: 'none',
    width: '100%',
    marginBottom: '10px',
},
cancelEditButton: {
    float: 'none',
    width: '100%',
    marginBottom: '10px',
},
saveButton: {
    float: 'none',
    width: '100%',
    marginBottom: '10px',
},

        saveButton: {
            float: 'none',
            width: '100%',
            marginBottom: '10px',
        },
    },
    '@media (max-width: 480px)': {
        mainLayout: {
            padding: '5px',
        },
        profileContentArea: {
            padding: '15px',
            borderRadius: '16px',
        },
        sectionTitle: {
            fontSize: '1.3em',
        },
        profilePicContainer: {
            width: '120px',
            height: '120px',
        },
        usernameText: {
            fontSize: '1.3em',
        },
        editPicButton: {
            width: '40px',
            height: '40px',
        },
        modalContent: {
            width: '90%',
            padding: '20px',
        },
        phoneInputGroup: {
            flexDirection: 'column',
            alignItems: 'stretch',
        },
        countryCodeSelect: {
            width: '100%',
            marginRight: '0',
            marginBottom: '10px',
        },
        profileInfoGrid: {
            gap: '15px',
        },
    }
};

// Helper for dynamic styles for sidebar navigation
const getNavItemStyle = (isActive, isLogout) => ({
    ...styles.navItem,
    ...(isLogout ? styles.navItemLogout : {}),
    ...(isActive ? styles.navItemActive : {}),
    
});

// --- Component: Password Modal (Change 1: In-line error message) ---
const PasswordModal = ({ onClose, onSave }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState(''); // CHANGE 1: New state for in-line error

    const handleSave = () => {
        setPasswordError(''); // Clear previous errors

        if (!oldPassword || !newPassword || !confirmPassword) {
            setPasswordError("All password fields are required.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("New password and confirm password must match.");
            return;
        }

        const passwordRegex = VALIDATION_REGEX.password;
        const passwordRules = "Password must be at least 8 characters long and include: one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).";

        if (!passwordRegex.test(newPassword)) {
            // CHANGE 1: Set error message instead of alert
            setPasswordError("New Password does not meet the standard rules. " + passwordRules);
            return;
        }

        // In a real app, you'd send these to an API for validation and update
        alert("Password successfully changed!"); 
        onSave();
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <h3 style={{marginTop: '0'}}>Change Password</h3>
                <button 
                    onClick={onClose} 
                    style={{
                        position: 'absolute', 
                        top: '15px', 
                        right: '15px', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer'
                    }}
                >
                    <X size={20} color={COLORS.PrimaryText} />
                </button>
                
                <label style={styles.infoLabel}>Old Password</label>
                <input 
                    type="password" 
                    value={oldPassword} 
                    onChange={(e) => setOldPassword(e.target.value)} 
                    style={styles.modalInput} 
                />

                <label style={styles.infoLabel}>New Password</label>
                <input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    style={styles.modalInput} 
                />

                <label style={styles.infoLabel}>Confirm New Password</label>
                <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    style={styles.modalInput} 
                />
                
                {/* CHANGE 1: Display in-line error message */}
                {passwordError && (
                    <p style={{...styles.infoError, whiteSpace: 'pre-wrap', color: COLORS.Error}}>
                        {passwordError}
                    </p>
                )}

                <div style={styles.modalButtonContainer}>
                    <button style={styles.cancelEditButton} onClick={onClose}>
                        Cancel
                    </button>
                    <button style={styles.saveButton} onClick={handleSave}>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Component: Profile Info Display (Used in 'personalInfo' tab) ---
const ProfileInfoDisplay = ({ data, isEditing, onFieldChange, onSave, onCancel, editErrors }) => {
    return (
        <>
            {isEditing ? ( // Editing View
                <div style={{marginBottom: '30px'}}>
                    <div style={styles.profileInfoGrid}>
                        {/* Username */}
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>User Name</span>
                            <input type="text" name="username" // Change 3 Fix: Use the 'data' prop directly, which is passed as tempEditData.current
                                value={data.username}
                                onChange={onFieldChange}
                                style={styles.infoInput}
                            />
                            {editErrors.username && <span style={styles.infoError}>{editErrors.username}</span>}
                        </div>
                        {/* First Name */}
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>First Name</span>
                            <input type="text" name="firstName" // Change 3 Fix
                                value={data.firstName}
                                onChange={onFieldChange}
                                style={styles.infoInput}
                            />
                            {editErrors.firstName && <span style={styles.infoError}>{editErrors.firstName}</span>}
                        </div>
                        {/* Last Name */}
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Last Name</span>
                            <input type="text" name="lastName" // Change 3 Fix
                                value={data.lastName}
                                onChange={onFieldChange}
                                style={styles.infoInput}
                            />
                            {editErrors.lastName && <span style={styles.infoError}>{editErrors.lastName}</span>}
                        </div>
                        {/* Phone Number */}
                       {/* Phone Number (MODIFIED) */}
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Phone number</span>
                            <div style={styles.phoneInputGroup}>
                                {/* Country Code Dropdown (NEW) */}
                               <select 
                                    name="countryCode" 
                                    // FIX CHECK: This ensures the value comes from the correct data source
                                    value={data.countryCode} 
                                    onChange={onFieldChange}
                                    style={styles.countryCodeSelect}
                                >
                                    {COUNTRY_CODES.map(cc => (
                                        <option key={cc.code} value={cc.code} disabled={cc.code === ''}>
                                            {cc.label}
                                        </option>
                                    ))}
                                </select>
                                
                                {/* Local Phone Number Input (NEW) */}
                                <input 
                                    type="tel" 
                                    name="localPhone"
                                    value={data.localPhone}
                                    onChange={onFieldChange}
                                    style={styles.localPhoneInput}
                                    placeholder="Enter 10 digits"
                                    maxLength={10} // Added maxLength for simple UI hint
                                    onKeyDown={(e) => {
                                        // Allow: digits (0-9), control keys (Backspace, Delete, Tab, Arrows, Home, End)
                                        if (!((e.key >= '0' && e.key <= '9') || 
                                              ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key))) {
                                            e.preventDefault();
                                        }
                                    }}
                                />
                            </div>
                             {editErrors.countryCode && <span style={styles.infoError}>{editErrors.countryCode}</span>}
                             {editErrors.localPhone && <span style={styles.infoError}>{editErrors.localPhone}</span>}
                        </div>

                        {/* Email Address - Not Editable in this view, typically */}
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>E-mail address</span>
                            <input type="email" name="email" // Change 3 Fix
                                value={data.email}
                                onChange={onFieldChange}
                                style={styles.infoInput}
                            />
                            {editErrors.email && <span style={styles.infoError}>{editErrors.email}</span>}
                        </div>
                        {/* DOB - Date Picker */}
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Date of Birth</span>
                            <input 
                                type="date" // CHANGE 2.2: Standard date chooser
                                name="dob" // Change 3 Fix
                                value={data.dob}
                                onChange={onFieldChange}
                                style={styles.infoInput}
                                max={new Date().toISOString().split('T')[0]} // Prevents selecting future dates
                            />
                            {editErrors.dob && <span style={styles.infoError}>{editErrors.dob}</span>}
                        </div>
                    </div>
                    <div style={{clear: 'both', textAlign: 'right', marginTop: '20px'}}>
                        <button style={styles.editProfileButton} onClick={onSave}>
                            Save Changes
                        </button>
                        <button style={styles.cancelEditButton} onClick={onCancel}>
                            Cancel
                        </button>
                    </div>
                </div>
            ) : ( // Display View
                <>
                    <div style={styles.profileInfoGrid}>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>First Name</span>
                            <span style={styles.infoValue}>{data.firstName}</span>
                        </div>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Last Name</span>
                            <span style={styles.infoValue}>{data.lastName}</span>
                        </div>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>E-mail address</span>
                            <span style={styles.infoValue}>{data.email}</span>
                        </div>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Phone number</span>
                            <span style={styles.infoValue}>{data.countryCode} {data.localPhone}</span>
                        </div>
                        <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Date of Birth</span>
                            {/* CHANGE 2.2: Reformat YYYY-MM-DD for display */}
                            <span style={styles.infoValue}>{data.dob.split('-').reverse().join('/')}</span> 
                        </div>
                    </div>
                    {/* Placeholder for Edit button outside the grid */}
                </>
            )}
        </>
    );
};

// --- Summary History Component (Change 4) ---
const SummaryHistory = ({ history }) => (
    <div style={styles.summaryHistoryCard}>
        <h3 style={{marginTop: '0'}}>Summary History</h3>
        {history.length > 0 ? (
            history.map((group, index) => (
                <div key={index} style={{marginBottom: '20px'}}>
                    <h4 style={{marginTop: '10px', marginBottom: '10px', color: COLORS.Accent}}>{group.dateGroup}</h4>
                    {group.items.map((item, itemIndex) => (
                        <div key={itemIndex} style={styles.summaryHistoryItem}>
                            <div style={styles.summaryItemHeader}>
                                <span style={styles.activityTitle}>{item.company}</span>
                                <span style={styles.activityDate}>{item.pdfCount} PDF{item.pdfCount !== 1 ? 's' : ''}</span>
                            </div>
                            <p style={{whiteSpace: 'pre-wrap', color: COLORS.SecondaryText, fontSize: '0.9em'}}>{item.summary}</p>
                        </div>
                    ))}
                </div>
            ))
        ) : (
            <p style={{color: COLORS.SecondaryText}}>No summary history found.</p>
        )}
    </div>
);


// --- Activity Content Component (Used in 'activity' tab) ---
const ActivityContent = ({ logData, summaryHistory }) => (
    <>
        <h2 style={styles.sectionTitle}>Your Blogs & Analysis</h2>
        <div style={{marginTop: '20px'}}>
            {logData && logData.length > 0 ? (
                logData.map((item, index) => (
                    <div key={index} style={styles.activityItem}>
                        <span style={styles.activityTitle}>
                            {item.type === 'blog' ? 'Blog Post: ' : 'Analysis: '}
                            {item.title}
                        </span>
                        <span style={styles.activityDate}>{item.date}</span>
                    </div>
                ))
            ) : (
                <p style={{color: COLORS.SecondaryText}}>No blogs or analysis recorded yet.</p>
            )}
        </div>
        <SummaryHistory history={summaryHistory} /> 
    </>
);

// --- Help & Support Content Component (Used in 'helpSupport' tab) ---
const HelpSupportContent = () => (
    <>
        <h2 style={styles.sectionTitle}>FAQ</h2>
        <div style={{marginTop: '20px', marginBottom: '30px'}}>
            <div style={styles.contactCard}>
                <p style={styles.infoLabel}><strong>Q:</strong> How do I change my profile picture?</p>
                <p style={styles.infoLabel}><strong>A:</strong> Navigate to the Personal Info tab, click the 'Edit Photo' icon on your picture, and upload a new image.</p>
            </div>
            <div style={{...styles.contactCard, marginTop: '10px'}}>
                <p style={styles.infoLabel}><strong>Q:</strong> Why am I not receiving email alerts?</p>
                <p style={styles.infoLabel}><strong>A:</strong> Check your Preferences section to ensure alerts are enabled and your email is verified.</p>
            </div>
        </div>
        <h2 style={styles.sectionTitle}>Contact Support</h2>
        <p style={{marginTop:'0px', color: COLORS.PrimaryText}}>Need further assistance? Send us your query and our team will get back to you within 24 hours.</p>
            <textarea placeholder="Describe your issue or question here..." style={styles.inputField}></textarea>
            <button style={styles.submitButton} onClick={() => alert("Support ticket submitted!")}>Submit Ticket</button>
            
        <div style={{marginTop: '10px', fontSize: '0.9em', color: COLORS.SecondaryText}}>
            <p>You can also reach us via email at support@fingenie.com or call us at 1-800-555-FIN.</p>
        </div>
    </>
);

// --- Feedback Content Component (Used in 'feedback' tab) ---
const FeedbackContent = () => (
    <>
        <h2 style={styles.sectionTitle}>Provide Feedback</h2>
        <p style={{marginTop:'0px', color: COLORS.PrimaryText}}>We value your input! Help us improve FinGenie by sharing your suggestions or reporting an issue.</p>
        <div style={styles.contactCard}>
            <textarea placeholder="Share your feedback here..." style={styles.inputField}></textarea>
            <button style={styles.submitButton} onClick={() => alert("Feedback submitted!")}>Send feedback</button>
        </div>
    </>
);

// --- Settings Content Component (NEW) ---
const SettingsContent = ({ settings, onSettingToggle, navigate, onShowPasswordModal }) => {
    // Generic Toggle Component
    const ToggleSwitch = ({ isActive, onClick }) => (
        <div style={{...styles.settingToggle, ...(isActive ? styles.settingToggleActive : {})}} onClick={onClick}
        >
            <div style={{...styles.settingToggleHandle, ...(isActive ? styles.settingToggleHandleActive : {})}} />
        </div>
    );
    
    // Change 1: Handle Delete Account
    const handleDeleteAccount = () => {
        if (window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) {
            alert("Account deletion initiated. Redirecting to home page.");
            navigate('/homepage_beforelogin');
        }
    };

    return (
        <div style={styles.profileContentArea}>
            <h2 style={styles.sectionTitle}>Preferences</h2>
            {/* Dark/Light Mode Setting */}
         
            {/* Email Notifications Setting */}
            <div style={styles.settingItem}>
                <span style={styles.settingText}>
                    {settings.emailNotifications ? <Bell size={20} style={{marginRight: '10px'}}/> : <BellOff size={20} style={{marginRight: '10px'}}/>} 
                    Email Notifications
                </span>
                <ToggleSwitch isActive={settings.emailNotifications} onClick={() => onSettingToggle('emailNotifications', !settings.emailNotifications)} />
            </div>
            
            <h2 style={{...styles.sectionTitle, marginTop: '30px'}}>Security</h2>
            
            {/* Change Password Button (Change 2) */}
            <div style={styles.settingItem}>
                <span style={styles.settingText}>
                    <Lock size={20} style={{marginRight: '10px'}}/> Change Password
                </span>
                <button 
                    style={{...styles.editProfileButton, float: 'none', marginBottom: '0', padding: '8px 15px'}} 
                    onClick={onShowPasswordModal} // Open the modal
                >
                    Change
                </button>
            </div>
            
            {/* Data & Privacy Section (Placeholder) */}
            <h2 style={{...styles.sectionTitle, marginTop: '30px', color: COLORS.Error}}>Account Management</h2>
            <div style={{...styles.settingItem, borderBottom: 'none'}}>
                <span style={styles.settingText}>
                    <X size={20} style={{marginRight: '10px', color: COLORS.Error}}/> Delete Account Permanently
                </span>
                <button 
                    style={{...styles.cancelEditButton, float: 'none', marginBottom: '0', padding: '8px 15px', color: COLORS.Error, border: `1px solid ${COLORS.Error}`}}
                    onClick={handleDeleteAccount}
                >
                    Delete
                </button>
            </div>
            
        </div>
    );
};


// --- Component: Profile Content Area (Main content switcher) ---
const ProfileContent = ({ activeItem, data, onDataUpdate, onShowPasswordModal, settings, onSettingToggle, navigate }) => {
    
    
    
    // State to manage whether the profile info is currently being edited
    const [isEditing, setIsEditing] = useState(false);
    // State for the modal
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    // State for in-line edit profile errors
    const [editErrors, setEditErrors] = useState({});
    
    // useRef to hold temporary editing data (to prevent re-rendering on every keystroke)
    const tempEditData = useRef(data);
    
    // CHANGE 2.1: Internal state synced with parent prop `data`
    const [internalData, setInternalData] = useState(data); 

    // Sync internal state when parent data changes (e.g., after a successful save)
    useEffect(() => {
       if (isEditing) {
            // FIX: Ensure tempEditData is fully initialized with all current properties
            tempEditData.current = {
                ...data,
                // Explicitly ensure phone fields are strings, even if 'data' is missing them initially
                countryCode: data.countryCode || '',
                localPhone: data.localPhone || '',
            }; 
        }
    }, [data]);
    
    // Handle when photo change is complete (dummy function)
    const handlePasswordSave = () => {
        // Here you would typically handle the API call for password change
        // For now, we just close the modal
        setShowPasswordModal(false);
    }
    
    // CHANGE 2.1: The actual saving and validation logic
    const handleSave = () => {
        setEditErrors({}); // Clear old errors
        
        const currentData = tempEditData.current;
        const errors = {};

        // 1. Email validation (USER CHANGE 1 from previous prompt)
        if (!VALIDATION_REGEX.email.test(currentData.email)) {
            errors.email = "Invalid Email Address format.";
        }
      // 2. Phone validation (NEW STRICT LOGIC)
         const countryCodeValue = (currentData.countryCode || '').trim();
        const localPhoneValue = (currentData.localPhone || '').trim();

        const allLocalDigits = getDigitCount(localPhoneValue); // Count only digits in local number

        // Check 2a: Is Country Code selected?
        if (countryCodeValue === '' || countryCodeValue === 'Select CC') {
            errors.countryCode = "Country code is mandatory.";
        }

        // Check 2b: Does the local number have exactly 10 digits?
        if (allLocalDigits !== 10) {
            errors.localPhone = `Local phone number must contain exactly 10 digits. Found ${allLocalDigits}.`;
        }
        // 3. DOB Validation (simple check to prevent empty or future date)
        if (!currentData.dob) {
            errors.dob = "Date of birth is required.";
        } else if (new Date(currentData.dob) > new Date()) {
            errors.dob = "Date of birth cannot be in the future.";
        }


        if (Object.keys(errors).length > 0) {
            setEditErrors(errors);
            return;
        }

        // 1. Update ProfileContent's internal display state
        setInternalData(currentData); 
        // 2. Update ProfilePage's main state (triggers re-render with new `data` prop)
        onDataUpdate(currentData); 
        setIsEditing(false); // Close edit mode
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditErrors({}); // Clear errors
        // Revert temporary data back to the last saved data (which is in `internalData` after sync)
        tempEditData.current = internalData;
    };


    // Effect to reset tempEditData when entering edit mode
    useEffect(() => {
        if (isEditing) {
            // Initialize the ref with the latest data prop (which is guaranteed to be current after the `useEffect` above)
            tempEditData.current = {...data}; 
        }
    }, [isEditing, data]);

    // #6: Handle Photo Change with Object-Fit for automatic size setting
    const handlePhotoChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const updatedData = { ...internalData, profilePicUrl: reader.result };
                setInternalData(updatedData);
                onDataUpdate(updatedData); // Update parent state
            };
            reader.readAsDataURL(file);
                
        }
    };

    const handleFieldChange = (e) => {
        const { name, value } = e.target;
        // Update the ref
        tempEditData.current = { ...tempEditData.current, [name]: value }; 
        // Small local state update to force re-render and update input field value
        setInternalData(prev => ({...prev, [name]: value}));
    };
    
    
    const renderContent = () => {
        switch (activeItem) {
            case 'personalInfo':
                return (
                    <div style={styles.profileContentArea}>
                        {/* Title and Edit Button */}
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <h2 style={styles.sectionTitle}>Personal Information</h2>
                            {!isEditing && (
                                <button style={styles.editProfileButton} onClick={() => setIsEditing(true)}>
                                    <Edit size={16} style={{marginRight: '5px'}}/> Edit Profile
                                </button>
                            )}
                        </div>

                        <div style={styles.profileOverview}>
                            <div style={styles.profilePicContainer}>
                                {/* #6: Added style.profileImage for object-fit: cover */}
                                <img src={internalData.profilePicUrl} alt="Profile" style={styles.profileImage} />
                                
                                <input
                                    type="file"
                                    id="photoUpload"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    style={{ display: 'none' }} // Hide the actual file input
                                />
                                {isEditing && (
                                    <label htmlFor="photoUpload" style={styles.editPicButton} title="Change Profile Picture">
                                        <Edit size={20} />
                                    </label>
                                )}
                            </div>
                            <div style={styles.usernameArea}>
                                <span style={styles.usernameText}>{internalData.username}</span>
                                <span style={styles.userSinceText}>User Since: {internalData.userSince}</span>
                            </div>
                        </div>

                        {/* In-page Edit/Display Component */}
                        <ProfileInfoDisplay 
                            data={isEditing ? tempEditData.current : internalData}
                            isEditing={isEditing}
                            onFieldChange={handleFieldChange}
                            onSave={handleSave}
                            onCancel={handleCancel}
                            editErrors={editErrors} // Pass errors to display
                        />
                    </div>
                );
            // #1: Activity Tab Implementation
            case 'activity':
                return (
                    <div style={styles.profileContentArea}>
                        <ActivityContent logData={activityLogData} summaryHistory={summaryHistoryData} />
                    </div>
                );
            // #2: Help and Support Tab Implementation (based on image_d353e1.png)
            case 'helpSupport':
                return (
                    <div style={styles.profileContentArea}>
                        <HelpSupportContent />
                    </div>
                );
            // #3: Feedback Tab Implementation (based on image_d353e1.png)
            case 'feedback':
                return (
                    <div style={styles.profileContentArea}>
                        <FeedbackContent />
                    </div>
                );
                
            // #5: Settings Tab Implementation (NOW IN-PAGE)
            case 'settings':
                return (
                    <>
                        <SettingsContent 
                            settings={settings} 
                            onSettingToggle={onSettingToggle} 
                            navigate={navigate} 
                            onShowPasswordModal={() => setShowPasswordModal(true)} // Change 2: Open modal
                        />
                        {showPasswordModal && (
                            <PasswordModal 
                                onClose={() => setShowPasswordModal(false)} 
                                onSave={handlePasswordSave} 
                            />
                        )}
                    </>
                );
            case 'logout':
               // Handled in main component for navigation
                return null;
        }
    };

    return renderContent();
};


// --- MAIN DASHBOARD COMPONENT ---
const ProfilePage = () => {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false); 
    const [showToolsDropdown, setShowToolsDropdown] = useState(false); 
    // #3: Changed data structure and added userSince for display
    const [userData, setUserData] = useState(initialUserData);
    const [activeItem, setActiveItem] = useState('personalInfo'); // Default to Personal Info

    // #5: Settings State
    const [settings, setSettings] = useState(initialSettingsData);
    
    // Map for external navigation (used for logout)
    const pathMap = {
        'logout': '/landingPage'
    };
    
    // #5: Handle Settings toggles
    const handleSettingToggle = (key, value) => {
        setSettings(prev => ({...prev, [key]: value}));
    };
    
    // Handle sidebar navigation
    const handleSidebarNavigation = (itemKey) => {
        setActiveItem(itemKey);
        
        // Handle external navigation for pages that should leave the profile view
        if (itemKey === 'logout') { 
            setTimeout(() => {
                navigate(pathMap[itemKey]);
            }, 0); 
        }
      
    };
    
    // Allows ProfileContent to update the main component's state (e.g., for profile pic)
    const handleUserDataUpdate = (newUserData) => {
        // CHANGE 2.1: This correctly updates the main state, triggering a re-render in ProfileContent
        setUserData(newUserData); 
    };

    return (
        <div style={styles.appWrapper}>
            <Header />
            <div style={styles.mainLayout}>
                <Sidebar 
                    activeItem={activeItem} 
                    onNavigate={handleSidebarNavigation} 
                />
                <ProfileContent 
                    activeItem={activeItem} 
                    data={userData} 
                    onDataUpdate={handleUserDataUpdate}
                    settings={settings}
                    onSettingToggle={handleSettingToggle}
                    navigate={navigate} // Pass navigate for Delete Account functionality
                />
            </div>
            <Footer />
        </div>
    );
};

// --- Component: Sidebar Navigation ---
const Sidebar = ({ activeItem, onNavigate }) => {
    
    // Sidebar navigation items (based on image_d353e1.png)
    const navItems = [
        { key: 'personalInfo', label: 'Personal Info', icon: User },
        { key: 'activity', label: 'History', icon: Activity },
        { key: 'settings', label: 'Setting', icon: Settings },
        { key: 'helpSupport', label: 'Help & Support', icon: HelpCircle },
        { key: 'feedback', label: 'Feedback', icon: Mail },
        { key: 'logout', label: 'Logout', icon: LogOut },
    ];

    return (
        <aside style={styles.sidebar}>
            <h2 style={styles.sidebarHeader}>My Account</h2>
            <nav style={styles.sidebar}>
                {navItems.map(item => {
                    const isActive = activeItem === item.key;
                    const isLogout = item.key === 'logout';
                    const Icon = item.icon;
                    
                    return (
                        <div
                            key={item.key}
                            style={getNavItemStyle(isActive, isLogout)}
                            onClick={() => onNavigate(item.key)}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = isLogout ? COLORS.Error : isActive ? COLORS.Accent : styles.navItemHover.backgroundColor}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = isLogout ? 'transparent' : isActive ? COLORS.Accent : 'transparent'}
                        >
                            <Icon size={20} style={{ marginRight: '10px' }} color={isActive ? COLORS.TextLight : isLogout ? COLORS.Error : COLORS.PrimaryText} />
                            <span>{item.label}</span>
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
};

export default ProfilePage;