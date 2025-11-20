import React from "react";
import { useNavigate } from "react-router-dom";

  const Footer = () => { 
    const navigate = useNavigate();
    return (
    <footer style={styles.footer}>
      <div style={styles.footerLeft}>
        <p style={styles.copyright}>
          © 2025 FinGenie | <a href="#" style={styles.footerLink}onClick={() => navigate("/About_us")}>About</a> | <a href="#" style={styles.footerLink}>Privacy Policy</a> | <a href="#" style={styles.footerLink} onClick={() => navigate("/About_us")}>Contact</a>
        </p>
      </div>

      <div style={styles.footerRight}>
        <h4 style={styles.functionsTitle}>Functions</h4>
        <ul style={styles.functionsList}>
          <li style={styles.functionsItem} onClick={() => navigate("/FileUploadApp")}>AI summary</li>
          <li style={styles.functionsItem} onClick={() => navigate("/sectorOverview")}>Sector View</li>
          <li style={styles.functionsItem} onClick={() => navigate("/CompanySearch")}>search companies</li>
          <li style={styles.functionsItem} onClick={() => navigate("/blogPage")}>Blog Page</li>
          <li style={styles.functionsItem} onClick={() => navigate("/Trends_KPI")}>Trends & KPIs</li>
          <li style={styles.functionsItem} onClick={() => navigate("/comparison")}>Compare companies</li>
        </ul>
      </div>
    </footer>
  );;}

const styles = {
    footer: {
    backgroundColor: '#4D5C61',
    color: '#FFFFFF',
    padding: '2rem 4rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: '4rem',
    position: 'relative',
    zIndex: 5,
  },

  footerLeft: {
    flex: 1,
    alignItems: 'center',
  },
  copyright: {
    fontSize: '0.9rem',
    color: '#cbd5e0',
    margin: 0
  },
  footerLink: {
    color: '#FFFFFF',
    textDecoration: 'none',
    transition: 'opacity 0.3s',
  },

  footerRight: {
    flex: 1,
    textAlign: 'right',
  },
  functionsTitle: {
    fontSize: '14px',
    fontWeight: '700',
    marginRight: '8rem',
  },

  functionsList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'grid',
    gridTemplateColumns: '3.5fr 1fr',
    textAlign: 'right',
    gap: '6px 0px',
  },
  functionsItem: {
    fontSize: '13px',
    margin: 0,
    textTransform: "capitalize",
    whiteSpace: 'nowrap'
  },
};

export default Footer;
