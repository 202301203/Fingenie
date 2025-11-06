import React, { useState, useEffect } from "react";
import "../App.css";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import fgLogo from "../images/fglogo.png";

// Add CSRF token function
function getCSRFToken() {
  return getCookie('csrftoken');
}

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const [key, value] = cookie.trim().split("=");
      if (key === name) cookieValue = decodeURIComponent(value);
    }
  }
  return cookieValue;
}

// Custom Hook for hover/focus state management
const useInteractionState = (defaultStyle, hoverStyle) => {
  const [style, setStyle] = useState(defaultStyle);
  const onMouseEnter = () => setStyle((prev) => ({ ...prev, ...hoverStyle }));
  const onMouseLeave = () => setStyle(defaultStyle);
  return { style, onMouseEnter, onMouseLeave };
};

// Custom Hook for input focus state
const useInputFocus = () => {
  const [isFocused, setIsFocused] = useState(false);
  const inputStyle = {
    ...styles.input,
    ...(isFocused ? styles.inputFocus : {}),
  };
  return {
    inputStyle,
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  };
};

// Shared Google Auth Handler
const useGoogleAuth = () => {
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    const token = credentialResponse.credential;

    try {
      console.log("Sending Google token to backend...");
      
      const response = await fetch("http://127.0.0.1:8000/accounts/api/google-login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFToken(),
        },
        credentials: "include",
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.is_new_user) {
          alert(`🎉 Welcome to Fingenie, ${data.username}! Your account has been created via Google.`);
        } else {
          alert(`👋 Welcome back, ${data.username}!`);
        }
        navigate("/mainpageafterlogin");
      } else {
        alert(data.error || "Google authentication failed");
      }
    } catch (err) {
      console.error("Google authentication failed:", err);
      alert("Google authentication failed. Please try again.");
    }
  };

  const handleGoogleError = () => {
    console.error("Google Sign-In was cancelled or failed");
    alert("Google Sign-In was cancelled or failed. Please try again.");
  };

  return { handleGoogleSuccess, handleGoogleError };
};

// 1. Create Account Page
const CreateAccount = ({ onSwitch }) => {
  const navigate = useNavigate();
  const { handleGoogleSuccess, handleGoogleError } = useGoogleAuth();
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const createBtnProps = useInteractionState(styles.button, styles.buttonHover);

  // Input focus hooks
  const usernameInput = useInputFocus();
  const emailInput = useInputFocus();
  const passwordInput = useInputFocus();

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pwd))
      return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(pwd))
      return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(pwd)) return "Password must contain at least one number";
    if (!/[!@#$%^&*]/.test(pwd))
      return "Password must contain at least one special character (!@#$%^&*)";
    return "";
  };

  const handleCreateAccount = async () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!username || !email || !password) {
      alert("Please fill out all fields.");
      return;
    }

    if (!emailPattern.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    } else {
      setEmailError("");
    }

    const pwdError = validatePassword(password);
    if (pwdError) {
      setPasswordError(pwdError);
      return;
    } else {
      setPasswordError("");
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/accounts/api/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFToken(),
        },
        credentials: "include",
        body: JSON.stringify({ 
          username, 
          email, 
          password,
          // Remove contact field as it's not in your backend
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Account created successfully for ${data.username}`);
        navigate("/mainpageafterlogin");
      } else {
        alert(data.error || "Registration failed");
      }
    } catch (err) {
      console.error("Error during registration:", err);
      alert("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.outerContainer}>
      <div style={{ ...styles.modal, ...styles.pulse }}>
        <div style={styles.logo}>
          <img
            src={fgLogo}
            alt="Site logo"
            style={{ height: "130px", width: "auto" }}
          />
        </div>
        <div style={styles.header}>Create your account</div>
        <p style={{ fontSize: "15px", color: "#57556a", marginBottom: "20px" }}>
          Already have an account?{" "}
          <span
            style={{ textDecoration: "underline", cursor: "pointer" }}
            onClick={() => onSwitch("login")}
          >
            Log in
          </span>
        </p>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          {...usernameInput}
          style={usernameInput.inputStyle}
        />

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          {...emailInput}
          style={emailInput.inputStyle}
        />
        {emailError && <p style={styles.errorText}>{emailError}</p>}

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          {...passwordInput}
          style={passwordInput.inputStyle}
        />
        {passwordError && <p style={styles.errorText}>{passwordError}</p>}

        <button
          onClick={handleCreateAccount}
          disabled={isLoading}
          style={{
            ...createBtnProps.style,
            ...(isLoading ? styles.buttonDisabled : {})
          }}
          onMouseEnter={createBtnProps.onMouseEnter}
          onMouseLeave={createBtnProps.onMouseLeave}
        >
          {isLoading ? "Creating Account..." : "Create an account"}
        </button>
      </div>

      <div style={styles.divider}>
        <span style={styles.dividerLine}></span>
        <span style={styles.dividerText}>or continue with</span>
        <span style={styles.dividerLine}></span>
      </div>

      <div style={styles.googleContainer}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          useOneTap
          theme="filled_blue"
          size="large"
          text="continue_with"
          shape="rectangular"
        />
      </div>
    </div>
  );
};

// 2. Login Page (keep as is, but add CSRF token)
const LoginPage = ({ onSwitch }) => {
  const navigate = useNavigate();
  const { handleGoogleSuccess, handleGoogleError } = useGoogleAuth();
  
  const [loginType, setLoginType] = useState("email");
  const [emailError, setEmailError] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const loginBtnProps = useInteractionState(styles.button, styles.buttonHover);
  const identifierInput = useInputFocus();
  const passwordInput = useInputFocus();

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pwd))
      return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(pwd))
      return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(pwd)) return "Password must contain at least one number";
    if (!/[!@#$%^&*]/.test(pwd))
      return "Password must contain at least one special character (!@#$%^&*)";
    return "";
  };

  const handleLogin = async () => {
    if (!identifier || !password) {
      alert("Please enter your details.");
      return;
    }

    // Email validation if loginType is email
    if (loginType === "email") {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(identifier)) {
        setEmailError("Please enter a valid email address");
        return;
      } else {
        setEmailError("");
      }
    }

    // Password validation
    const pwdError = validatePassword(password);
    if (pwdError) {
      setPasswordError(pwdError);
      return;
    } else {
      setPasswordError("");
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/accounts/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFToken(),
        },
        credentials: "include",
        body: JSON.stringify({
          identifier,
          password,
          login_type: loginType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Login successful! Welcome ${data.username}`);
        navigate("/mainpageafterlogin");
      } else {
        alert(data.error || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (type) => {
    setLoginType(type);
    setIdentifier("");
    setEmailError("");
  };

  return (
    <div style={styles.outerContainer}>
      <div style={styles.modal}>
        <div style={styles.logo}>
          <img
            src={fgLogo}
            alt="Site logo"
            style={{ height: "130px", width: "auto" }}
          />
        </div>
        <div style={styles.header}>Log in to your account</div>

        <div style={styles.tabContainer}>
          <div
            style={{
              ...styles.tab,
              ...(loginType === "email" ? styles.tabActive : styles.tabInactive),
            }}
            onClick={() => handleToggle("email")}
          >
            Email address
          </div>
          <div
            style={{
              ...styles.tab,
              ...(loginType === "username"
                ? styles.tabActive
                : styles.tabInactive),
            }}
            onClick={() => handleToggle("username")}
          >
            Username
          </div>
        </div>

        <input
          type={loginType === "email" ? "email" : "text"}
          placeholder={loginType === "email" ? "Email address" : "Username"}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          {...identifierInput}
          style={identifierInput.inputStyle}
        />
        {loginType === "email" && emailError && (
          <p style={styles.errorText}>{emailError}</p>
        )}

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          {...passwordInput}
          style={passwordInput.inputStyle}
        />
        {passwordError && <p style={styles.errorText}>{passwordError}</p>}

        <button
          onClick={handleLogin}
          disabled={isLoading}
          style={{
            ...loginBtnProps.style,
            ...(isLoading ? styles.buttonDisabled : {})
          }}
          onMouseEnter={loginBtnProps.onMouseEnter}
          onMouseLeave={loginBtnProps.onMouseLeave}
        >
          {isLoading ? "Logging in..." : "Log in"}
        </button>

        <p style={{ fontSize: "15px", color: "#57556a", marginBottom: "20px" }}>
          Don't have an account?{" "}
          <span
            style={{ textDecoration: "underline", cursor: "pointer" }}
            onClick={() => onSwitch("create")}
          >
            Sign up
          </span>
        </p>
      </div>

      <div style={styles.divider}>
        <span style={styles.dividerLine}></span>
        <span style={styles.dividerText}>or continue with</span>
        <span style={styles.dividerLine}></span>
      </div>

      <div style={styles.googleContainer}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          useOneTap
          theme="filled_blue"
          size="large"
          text="continue_with"
          shape="rectangular"
        />
      </div>
    </div>
  );
};

const styles = {
  appContainer: {
    backgroundColor: "#515266",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    animation: "fadeIn 0.8s ease-in-out",
  },
  outerContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#d1dfdf",
    borderRadius: "24px",
    padding: "25px 50px",
    width: "400px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)",
    textAlign: "center",
    fontFamily: "Bricolage Grotesque, sans-serif",
    position: "relative",
  },
  googleContainer: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "center",
  },
  header: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#353342",
    marginBottom: "10px",
  },
  logo: {
    fontSize: "40px",
    fontWeight: "900",
    color: "#353342",
    lineHeight: "1",
    marginBottom: "10px",
  },
  input: {
    width: "100%",
    padding: "12px",
    margin: "8px 0",
    borderRadius: "8px",
    border: "1px solid #c2c9cc",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.3s ease-in-out",
    fontFamily: "Bricolage Grotesque, sans-serif",
  },
  phoneContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: "8px 0",
  },
  countryCodeSelect: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #c2c9cc",
    backgroundColor: "#fff",
    fontFamily: "Bricolage Grotesque, sans-serif",
    cursor: "pointer",
    outline: "none",
  },
  errorText: {
    color: "red",
    fontSize: "12px",
    marginTop: "-4px",
    marginBottom: "8px",
    textAlign: "left",
    fontFamily: "Bricolage Grotesque, sans-serif",
  },
  inputFocus: {
    borderColor: "#7f8c8d",
    boxShadow: "0 0 5px rgba(127, 140, 141, 0.5)",
  },
  button: {
    width: "100%",
    padding: "12px",
    margin: "15px 0 10px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#353342",
    color: "#dfe4e6",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.2s ease-in-out, transform 0.1s ease-out",
    fontFamily: "Bricolage Grotesque, sans-serif",
  },
  buttonHover: {
    backgroundColor: "#57556a",
    transform: "translateY(-1px)",
  },
  buttonDisabled: {
    backgroundColor: "#a0a0a0",
    cursor: "not-allowed",
    transform: "none",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    textAlign: "center",
    margin: "20px 0",
    color: "#7f8c8d",
    width: "400px",
    fontFamily: "Bricolage Grotesque, sans-serif",
  },
  dividerLine: {
    flexGrow: "1",
    height: "1px",
    backgroundColor: "#c2c9cc",
  },
  dividerText: {
    padding: "0 10px",
    fontSize: "18px",
  },
  tabContainer: {
    display: "flex",
    marginBottom: "20px",
    backgroundColor: "#c2c9cc",
    borderRadius: "8px",
    padding: "4px",
    transition: "box-shadow 0.3s ease-out",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  tab: {
    flex: "1",
    padding: "8px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    transition: "background-color 0.2s ease-in-out, color 0.2s ease-in-out",
    fontFamily: "Bricolage Grotesque, sans-serif",
  },
  tabActive: {
    backgroundColor: "#353342",
    color: "#dfe4e6",
  },
  tabInactive: {
    backgroundColor: "transparent",
    color: "#57556a",
  },
  pulse: {
    animation: "pulse-animation 2s infinite alternate",
  },
};

// --- MAIN APPLICATION COMPONENT ---
const AuthFlow = () => {
  const [currentPage, setCurrentPage] = useState("create");

  const handleSwitch = (page) => {
    setCurrentPage(page);
  };

  // ✅ Correct Google Client ID format
  const googleClientId = "972027062493-i944gk25qhn7qj8ut7ebu6jdnpud8des.apps.googleusercontent.com";

  // Add a check to make sure it's set
  if (!googleClientId) {
    console.error("Google Client ID is not set!");
    return <div>Error: Google authentication not configured</div>;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <div style={styles.appContainer}>
        {currentPage === "create" && <CreateAccount onSwitch={handleSwitch} />}
        {currentPage === "login" && <LoginPage onSwitch={handleSwitch} />}
      </div>
    </GoogleOAuthProvider>
  );
};

export default AuthFlow; // ✅ Use default export
// --- MAIN APPLICATION COMPONENT ---
// export const AuthFlow = () => {
//   const [currentPage, setCurrentPage] = useState("create");

//   const handleSwitch = (page) => {
//     setCurrentPage(page);
//   };

//   // ✅ Correct Google Client ID format
//   const googleClientId = "972027062493-i944gk25qhn7qj8ut7ebu6jdnpud8des.apps.googleusercontent.com";

//   // Add a check to make sure it's set
//   if (!googleClientId) {
//     console.error("Google Client ID is not set!");
//     return <div>Error: Google authentication not configured</div>;
//   }

//   return (
//     <GoogleOAuthProvider clientId={googleClientId}>
//       <div style={styles.appContainer}>
//         {currentPage === "create" && <CreateAccount onSwitch={handleSwitch} />}
//         {currentPage === "login" && <LoginPage onSwitch={handleSwitch} />}
//       </div>
//     </GoogleOAuthProvider>
//   );
// };
