import React from "react";
import { Routes, Route } from "react-router-dom";

// import all pages
import HomepageBeforeLogin from "./pages/homepage_beforelogin";
import {AuthFlow} from "./pages/AuthFlow";
import MainPageAfterLogin from "./pages/mainpageafterlogin";
import FileUploadApp from "./pages/FileUploadApp";
import SummaryPage from "./pages/summary_page";

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
    </Routes>
  );
}

export default App;
