import React from "react";
import { Routes, Route } from "react-router-dom";

import HomepageBeforeLogin from "./pages/landingPage.jsx";
import AuthFlow from "./pages/AuthFlow";
import MainPageAfterLogin from "./pages/mainpageafterlogin";
import FileUploadApp from "./pages/FileUploadApp";
import SummaryPage from "./pages/summaryPage";
import NewsPage from "./pages/newsPage";
import TrendsPage from "./pages/trendsAndKpi.jsx";
import SectorOverviewDashboard from "./pages/sectorOverview";
import BlogPage from "./pages/blogPage";
import CompanySearch from "./pages/CompanySerach"
import Wodroftheday from "./pages/Wordoftheday";
import API_key from "./pages/API_key.jsx"; 
import About_us from "./pages/aboutUs.jsx";
import AiInsights from "./pages/AiInsights.jsx";
import ComparisonPage from "./pages/comparison.jsx"; 
import ProfilePage from "./pages/profilePage.jsx";
import FeaturesPage from "./pages/featuresPage.jsx";
import InfoaboutFeatures from "./pages/infoaboutFeatures.jsx";


function App() {
  return (
    <Routes>
      {/* Default (Landing Page) */}
      <Route path="/" element={<HomepageBeforeLogin />} />

      {/* Flow pages */}
      <Route path="/landingPage" element={<HomepageBeforeLogin />} />
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
      <Route path="/AiInsights" element={<AiInsights/>} />
      <Route path="/comparison" element={<ComparisonPage />} />
      <Route path="/Profile_page" element={<ProfilePage />} />
      <Route path="/featuresPage" element={<FeaturesPage />} />
      <Route path="/infoaboutFeatures" element={<InfoaboutFeatures />} />
    </Routes>
  );
}

export default App;