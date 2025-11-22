import React, {useState} from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { User, Code, LayoutDashboard, Brain, ScrollText, GitBranch, Home, GraduationCap} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
// Generic image placeholder for demonstration
const PHOTO_STYLE_OVERRIDE = {
    backgroundColor: 'transparent', // Don't show the colored div background under the image
    objectFit: 'cover',             // Ensure the image covers the circular container
};

// Assuming COLORS are imported or defined locally for consistency
const COLORS = {
  PageBackground: '#f3f1f1ff', 
  CardBackground: '#FFFFFF',  
  PrimaryText: '#151515ff',     
  SecondaryText: '#777777',   
  Accent: '#515266', 
  TextLight: '#ffffff',
};

const styles = {
    appWrapper: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: COLORS.PageBackground,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
   
    mainContent: {
        flexGrow: 1,
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '40px',
        backgroundColor: COLORS.CardBackground,
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    },
    sectionTitle: {
        fontSize: '2em',
        fontWeight: 'bold',
        color: COLORS.Accent,
        marginBottom: '20px',
        borderBottom: `2px solid ${COLORS.PageBackground}`,
        paddingBottom: '10px',
    },
    projectInfo: {
        marginBottom: '40px',
        lineHeight: 1.6,
        color: COLORS.PrimaryText,
    },
    memberGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '30px',
        marginTop: '30px',
    },
    memberCard: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: COLORS.PageBackground,
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        textAlign: 'center',
    },
    // Style for the circular container (used for both icon and img)
    memberIcon: { 
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: COLORS.Accent, // Default background for icon
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '10px',
        color: COLORS.TextLight,
        overflow: 'hidden', // Crucial for images
    },
    memberName: {
        fontSize: '1.1em',
        fontWeight: '600',
        color: COLORS.PrimaryText,
        marginBottom: '5px',
    },
    memberId: {
        fontSize: '0.9em',
        color: COLORS.SecondaryText,
        marginBottom: '5px',
    },
    memberTeam: {
        fontSize: '0.95em',
        fontWeight: 'bold',
        color: COLORS.Accent,
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        marginTop: '5px',
    },
};

// const isAboutus = location.pathname === "/About_us";

// --- DUMMY TEAM MEMBER DATA (10 Members) ---
const members = [
 { name: "Dhruvinee Tandel", id: "202301203", team: "Project Lead & Backend", icon: GitBranch, photoUrl: null },          
 { name: "Jayadity Shah", id: "202301254", team: "Backend", icon: Code, photoUrl: null },
  { name: "Priyanka Garg", id: "202301262", team: "Backend", icon: Code, photoUrl: null },
    { name: "Rutu Chaudhari", id: "202301235", team: "Frontend", icon: LayoutDashboard, photoUrl: null },
    { name: "Kresha Vora", id: "202301231", team: "Frontend ", icon: LayoutDashboard, photoUrl: null },
    { name: "Jayansh Gaadhe", id: "202301232", team: "Backend", icon: Code, photoUrl: null},
    { name: "Manan Chhabhaya", id: "202301222", team: "Backend", icon: Code, photoUrl: null },
    { name: "Meet Gandhi", id: "202301219", team: "Backend", icon: Code, photoUrl: null },
    { name: "Ajaykumar Rathod", id: "202301221", team: "Frontend", icon: LayoutDashboard, photoUrl: null },
    // { name: "Nakum Ayush", id: "202301233", team: "", icon: Users, photoUrl: null }, // Explicitly null/empty to show default icon
];



// --- MAIN ABOUT US COMPONENT ---
const AboutUs = () => {
             const location = useLocation(); // <-- FIX: Use the useLocation hook
         const currentPath = location.pathname; // <-- Get the path safely
         const [showDropdown, setShowDropdown] = useState(false);
         const [showToolsDropdown, setShowToolsDropdown] = useState(false);
    
         return (
        <div style={styles.appWrapper}>
             <Header />
            
            <div style={styles.mainContent}>
                <h1 style={{...styles.sectionTitle, textAlign: 'center', fontSize: '2.5em', marginBottom: '30px'}}>
                    About FinGenie 💡
                </h1>

               {/* Project Information Section */}
<div style={styles.projectInfo}>
    <h2 style={styles.sectionTitle}>Project Overview</h2>
    <p>
        FinGenie is a comprehensive financial intelligence platform developed as the final project for the Software Engineering (IT314) course at DA-IICT Gandhinagar. Our mission is to provide users with powerful tools for financial analysis, including AI-driven document summarization, trend tracking, key performance indicator (KPI) comparisons, and corporate debt ratings.
    </p>
    <p>
        The application is built using modern web technologies to deliver a responsive, intuitive, and secure user experience, helping individuals and small businesses make data-backed financial decisions.
    </p>

    {/* New Section for Features */}
    <h3 style={styles.sectionTitle}> Features</h3>
    <ul style={{ paddingLeft: '20px' }}>
        <li>Balance Sheet Analysis: Upload balance sheets to get an immediate summary and key financial ratios.</li>
        <li>Trend Analysis: Tools to generate trends analysis for companies and sectors.</li>
        <li>Sector Overview Dashboard: A dedicated dashboard providing a high-level sector overview.</li>
        <li>Dual Chatbot Integration: Includes one chatbot for document summary questions and one for general inquiries.</li>
        <li>Financial News: A curated feed providing the latest and most relevant financial news.</li>
        <li>Blog Page: A section for articles and insights on finance and investment topics.</li>
        <li>Company Details: Ability to search a company to see its financial details.</li>
        <li>Sector Comparison: Tool to compare a company against its sector peers on performance metrics.</li>
        <li>Learning Tools: Features a Word of the Day (learnings) section, complete with a Quiz based on the word.</li>
    </ul>
</div>
                <hr style={{border: `1px solid ${COLORS.PageBackground}`}}/>

                {/* Course and Faculty Information Section */}
                <div style={styles.projectInfo}>
                    <h2 style={styles.sectionTitle}>Course Details</h2>
                    <p style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <GraduationCap size={20} color={COLORS.Accent}/>
                        Course: Software Engineering (IT314)
                    </p>
                    <p style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <User size={20} color={COLORS.Accent}/>
                        Professor: Sourabh Tiwari
                    </p>
                    <p style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <Home size={20} color={COLORS.Accent}/>
                        Institution: DAU Gandhinagar
                    </p>
                </div>

                <hr style={{border: `1px solid ${COLORS.PageBackground}`}}/>

                {/* Team Information Section */}
                <h2 style={styles.sectionTitle}>Meet the Development Team 👨‍💻</h2>
                <div style={styles.memberGrid}>
                    {members.map((member, index) => {
                        const Icon = member.icon;
                        const hasPhoto = member.photoUrl && member.photoUrl.length > 0;
                        
                        return (
                            <div key={index} style={styles.memberCard}>
                                {/* Conditionally render image or default icon */}
                                {hasPhoto ? (
                                    <img 
                                        src={member.photoUrl} 
                                        alt={member.name} 
                                        // Combine memberIcon style for size/shape, and override background/fit
                                        style={{...styles.memberIcon, ...PHOTO_STYLE_OVERRIDE}} 
                                    />
                                ) : (
                                    <div style={styles.memberIcon}>
                                        <User size={30} />
                                    </div>
                                )}
                                
                                <span style={styles.memberName}>{member.name}</span>
                                <span style={styles.memberId}>ID: {member.id}</span>
                                <span style={styles.memberTeam}>
                                    <Icon size={16} />
                                    {member.team}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <Footer />
        </div>
    );
};

export default AboutUs;