import React from "react";
import { Routes, Route } from "react-router-dom";

// import all pages
import HomepageBeforeLogin from "./pages/homepage_beforelogin";
import AuthFlow from "./pages/AuthFlow";
import MainPageAfterLogin from "./pages/mainpageafterlogin";
import FileUploadApp from "./pages/FileUploadApp";
import SummaryPage from "./pages/summary_page";
import NewsPage from "./pages/news_page";
import TrendsPage from "./pages/Trends_KPI";
import SectorOverviewDashboard from "./pages/sectorOverview";
import BlogPage from "./pages/blogPage";
import CompanySearch from "./pages/CompanySerach"
import Wodroftheday from "./pages/Wordoftheday";
import API_key from "./pages/API_key.jsx"; 
import About_us from "./pages/About_us.jsx";
import Chatbot from "./pages/ChatbotPage.jsx";
import ComparisonPage from "./pages/comparison.jsx"; 
import ProfilePage from "./pages/Profile_page.jsx";
function App() {
  return (
    <Routes>
      {/* Default (Landing Page) */}
      <Route path="/" element={<HomepageBeforeLogin />} />

      {/* Flow pages */}
      <Route path="/homepage_beforelogin" element={<HomepageBeforeLogin />} />
      <Route path="/AuthFlow" element={<AuthFlow />} />
      <Route path="/mainpageafterlogin" element={<MainPageAfterLogin />} />
      <Route path="/FileUploadApp" element={<FileUploadApp />} />
      <Route path="/summary_page" element={<SummaryPage />} />
      <Route path="/NewsPage" element={<NewsPage />} />
      <Route path="/Trends_KPI" element={<TrendsPage />} />  
      <Route path="/sectorOverview" element={<SectorOverviewDashboard />} /> 
      <Route path="/blogPage" element={<BlogPage />} />
      <Route path="/companySearch" element={<CompanySearch/>}/>
      <Route path="/wordoftheday" element={<Wodroftheday/>}/>
      <Route path="/API_key" element={<API_key/>} /> 
      <Route path="/About_us" element={<About_us/>} /> 
      <Route path="/Chatbot" element={<Chatbot/>} />
      <Route path="/comparison" element={<ComparisonPage />} />
      <Route path="/Profile_page" element={<ProfilePage />} />
    </Routes>
  );
}

export default App;