import React from "react";
import { ArrowRight, FileText, GitCompare, Activity, Search, BookOpen, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import fglogo_Wbg from '../images/fglogo_Wbg.png';

const InfoaboutFeatures = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "AI Summary Generator",
      icon: <FileText size={40} color="#4A4A4A" />,
      help: "Upload a single balance sheet and receive an AI-generated summary that simplifies complex financial data into an easy-to-understand format.",
      steps: [
        "Upload your balance sheet (PDF/Excel).",
        "AI analyses liquidity, stability, profitability & more.",
        "You get: pros & cons, financial health summary, animated gauge charts, and computed ratios."
      ],
      link: "/AuthFlow"
    },

    {
      title: "Company Comparison",
      icon: <GitCompare size={40} color="#4A4A4A" />,
      help: "Compare two or more companies side-by-side using AI-processed financial summaries and ratio breakdowns.",
      steps: [
        "Select the companies you want to compare.",
        "AI extracts key metrics like revenue, margins, debt ratios, and trends.",
        "You get: a clear comparison chart + insights explaining which company performs better and why."
      ],
      link: "/AuthFlow"
    },

    {
      title: "Trends & KPIs",
      icon: <Activity size={40} color="#4A4A4A" />,
      help: "Visualize how the company's financial performance changes over time with interactive KPI charts.",
      steps: [
        "Import or select company data.",
        "View trends for revenue, profits, equity, liabilities, liquidity, and more.",
        "AI highlights major improvements, declines, and hidden risks."
      ],
      link: "/AuthFlow"
    },

    {
      title: "Search Public Companies",
      icon: <Search size={40} color="#4A4A4A" />,
      help: "Find any listed company instantly and explore its full financial insights.",
      steps: [
        "Search by company name or ticker.",
        "Get Overview, Charts, Ratios, Peer Analysis, Balance Sheet, Income Statement, and Cash Flow."
      ],
      link: "/AuthFlow"
    },

    {
      title: "Blog Page",
      icon: <BookOpen size={40} color="#4A4A4A" />,
      help: "Read trending finance blogs, share your knowledge, and explore insights from the community.",
      steps: [
        "Browse popular and recent blogs.",
        "Search any topic like stock markets, finance tips, or company deep dives.",
        "Write and publish your own blogs easily."
      ],
      link: "/AuthFlow"
    },

    {
      title: "Sector Overview",
      icon: <BarChart2 size={40} color="#4A4A4A" />,
      help: "Analyze sectors with aggregated performance graphs and evaluate companies within any industry.",
      steps: [
        "Choose a sector or search for a custom industry group.",
        "View sector-wide graphs for revenue, earnings, risks, debt & valuation.",
        "Create custom groups of companies to compare within a sector."
      ],
      link: "/AuthFlow"
    }
  ];
    const Header = () => (
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>
            <img
              src={fglogo_Wbg}
              style={{ height: "80px", width: "auto" }}
              alt="logo"
            />
          </div>
        </div>
        <nav style={styles.nav}>
          <span style={styles.navLink}
          onClick={() => navigate("/NewsPage")}>News</span>
          <span style={styles.navLink}
          onClick={() => navigate("/About_us")}>About us</span>
          <button
                onClick={() => navigate("/AuthFlow")}
                style={styles.signupButton}
              >
  
              Sign up
            </button>
        </nav>
      </header>
    );
  return (
    <>
    <Header />
    <div style={styles.pageWrapper}>
      
      <h1 style={styles.pageTitle}>Explore Our Tools</h1>
      <p style={styles.pageSubtitle}>Everything you need for financial analysis, powered by AI.</p>

      <div style={styles.grid}>
        {features.map((f, index) => (
          <div key={index} style={styles.card}>
            <div style={styles.icon}>{f.icon}</div>

            <h2 style={styles.cardTitle}>{f.title}</h2>

            <p style={styles.helpText}><strong>What it helps with:</strong> {f.help}</p>

            <div style={styles.stepsBox}>
              <strong style={{ fontSize: "15px" }}>How it works:</strong>
              <ul style={styles.stepList}>
                {f.steps.map((s, i) => (
                  <li key={i} style={styles.stepItem}>{s}</li>
                ))}
              </ul>
            </div>

            <button
              style={styles.button}
              onClick={() => navigate(f.link)}
            >
              Try it now
              <ArrowRight size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
    <Footer />
    </>
  );
};

export default InfoaboutFeatures;

const styles = {
  pageWrapper: {
   // padding: "2rem auto",
    backgroundColor: "#F6F7F9",
  },
   header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 2rem',
    backgroundColor: '#DEE6E6',
    border: '1px solid #000000ff',
    borderRadius: '8px',

    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  logo: {
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
  },
  navLink: {
    fontSize: '15px',
    color: '#37474f',
    textDecoration: 'none',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'color 0.3s ease',
  },
    signupButton: {
    background: '#3e555fff',
    color: '#ffffff',
    padding: '10px 20px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '20px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(26, 35, 126, 0.3)',
    transition: 'all 0.3s ease',
    marginBottom: '16px',
  },
  pageTitle: {
    textAlign: "center",
    fontSize: "2.8rem",
    fontWeight: 700,
    marginBottom: "0.5rem",
    color: "#101010"
  },
  pageSubtitle: {
    textAlign: "center",
    fontSize: "1.1rem",
    color: "#555",
    marginBottom: "3rem"
  },

  // GRID — 2 cards per row
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "2rem",
    width: "90%",
    margin: "0 auto"
  },

  card: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "14px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    border: "1px solid #222222ff",
  },

  icon: {
    marginBottom: "1rem"
  },

  cardTitle: {
    fontSize: "1.6rem",
    fontWeight: 700,
    marginBottom: "1rem",
    color: "#000"
  },

  helpText: {
    fontSize: "1rem",
    color: "#333",
    marginBottom: "1rem",
    lineHeight: 1.5
  },

  stepsBox: {
    background: "#F0F3F7",
    padding: "1rem",
    borderRadius: "10px",
    border: "1px solid #d0d7e0",
    marginBottom: "1.5rem"
  },

  stepList: {
    marginTop: "0.5rem",
    paddingLeft: "1.2rem",
    color: "#444",
    lineHeight: 1.6
  },

  stepItem: {
    marginBottom: "0.4rem"
  },

  button: {
    marginTop: "1rem",
    padding: "0.8rem 1.2rem",
    backgroundColor: "#25344F",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 600,
    width: "fit-content",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "0.2s"
  }
};
