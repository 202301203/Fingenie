import React, { useState } from "react";
import "../App.css";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import fglogo_Wbg from '../images/fglogo_Wbg.png';
import Glogo from "../images/Glogo.png";
import API_BASE_URL from '../api/index';


// Custom Hook for hover/focus state management
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

const useInteractionState = (defaultStyle, hoverStyle) => {
  const [style, setStyle] = useState(defaultStyle);
  const onMouseEnter = () => setStyle((prev) => ({ ...prev, ...hoverStyle }));
  const onMouseLeave = () => setStyle(defaultStyle);
  return { style, onMouseEnter, onMouseLeave };
};

// Custom Hook for input focus state
// BACKENDCHANGE: Added to standardize input focus styles
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
      
      const csrfToken = await getCSRFToken();
      
      const response = await fetch(`/accounts/api/google-login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.is_new_user) {
          alert(`Welcome to Fingenie, ${data.username}! Your account has been created via Google.`);
        } else {
          alert(`Welcome back, ${data.username}!`);
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
  //const [countryCode, setCountryCode] = useState("+91");
//  const [contact, setContact] = useState("");
 // const [contactError, setContactError] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
 // const [showPassword, setShowPassword] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
 
  const createBtnProps = useInteractionState(styles.button, styles.buttonHover);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupColor, setPopupColor] = useState("#4CAF50");

  const googleBtnProps = useInteractionState(
    styles.googleButton,
    styles.googleButtonHover
  );
  //const linkProps = useInteractionState(styles.link, styles.linkHover);


  // Input focus hooks

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
      setPopupMessage("Please fill out all fields.");
      setPopupColor("#d6867dff");
      setShowPopup(true);
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
      const csrfToken = await getCSRFToken();
      
      const response = await fetch(`/accounts/api/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ 
          username, 
          email, 
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPopupMessage(`Account created successfully for ${data.username}`);
        setPopupColor("#4CAF50");
        setShowPopup(true);
        setTimeout(() => {
          navigate("/mainpageafterlogin");
        }, 2000);
      } else {
        setPopupMessage(data.error || "Registration failed");
        setPopupColor("#d6867dff");
        setShowPopup(true);
      }
    } catch (err) {
      console.error("Error during registration:", err);
      setPopupMessage("Server error. Please try again later.");
      setPopupColor("#d6867dff");
      setShowPopup(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showPopup && (
        <div style={styles.popupOverlayStyle}>
          <div style={{ ...styles.popupBoxStyle, backgroundColor: popupColor }}>
            <h3>
              {popupColor === "#4CAF50"
                ? "Account Created"
                : "Error"}
            </h3>
            <p>{popupMessage}</p>
            <button
              onClick={() => setShowPopup(false)}
              style={styles.okButtonStyle}
              onMouseOver={(e) =>
                (e.target.style.backgroundColor = "#f0f0f0")
              }
              onMouseOut={(e) => (e.target.style.backgroundColor = "white")}
            >
              OK
            </button>
          </div>
        </div>
      )}
      <div style={styles.outerContainer}>
        <div style={styles.creativeBG} />
        <div style={{ ...styles.modal, ...styles.pulse }}>
          <div style={styles.logo}>
            <img
              src={fglogo_Wbg}
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
            onFocus={usernameInput.onFocus}
            onBlur={usernameInput.onBlur}
            style={usernameInput.inputStyle}
          />

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={emailInput.onFocus}
            onBlur={emailInput.onBlur}
            style={emailInput.inputStyle}
          />
          {emailError && <p style={styles.errorText}>{emailError}</p>}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={passwordInput.onFocus}
            onBlur={passwordInput.onBlur}
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
    </>
  );
};

// 2. & 3. Login Page
const LoginPage = ({ onSwitch }) => {
  const navigate = useNavigate();
   const { handleGoogleSuccess, handleGoogleError } = useGoogleAuth();


  const [loginType, setLoginType] = useState("email"); // 'email' or 'username'
  const [emailError, setEmailError] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
  
  const loginBtnProps = useInteractionState(styles.button, styles.buttonHover);
  const signUpLinkProps = useInteractionState(styles.link, styles.linkHover);
  const identifierInput = useInputFocus();
  const passwordInput = useInputFocus();
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupColor, setPopupColor] = useState("#4CAF50");

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      setPopupMessage("Please enter your email/username and password.");
      setPopupColor("#E74C3C");
      setShowPopup(true);
      return;
    }

    setIsLoading(true);

    try {
      // Get CSRF token first
      const csrfToken = await getCSRFToken();

      console.log("Attempting login with:", { identifier, loginType });

      const requestData = {
        identifier: identifier.trim(),
        password: password,
      };

      const response = await fetch(`/accounts/api/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (response.ok && data.success) {
        setPopupMessage(`Welcome back, ${data.username || identifier}!`);
        setPopupColor("#4CAF50");
        setShowPopup(true);
        setTimeout(() => {
          navigate("/mainpageafterlogin");
        }, 1500);
      } else {
        const errorMessage = data.error || data.message || "Login failed";
        setPopupMessage(errorMessage);
        setPopupColor("#E74C3C");
        setShowPopup(true);
      }
    } catch (err) {
      console.error("Error during login:", err);
      setPopupMessage("Network error. Please check your connection and try again.");
      setPopupColor("#E74C3C");
      setShowPopup(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (type) => {
    setLoginType(type);
    setIdentifier("");
    setEmailError("");
 // Clear input on toggle for better UX
  };

  return (
    <>
    <div style={styles.creativeBG} />
      {showPopup && (
        <div style={styles.popupOverlayStyle}>
          <div style={{...styles.popupBoxStyle, backgroundColor: popupColor}}>
            <h3>
              {popupColor === "#4CAF50" ? "Success" : "Error"}
            </h3>
            <p>{popupMessage}</p>
            <button
              onClick={() => setShowPopup(false)}
              style={styles.okButtonStyle}
              onMouseOver={(e) =>
                (e.target.style.backgroundColor = "#f0f0f0")
              }
              onMouseOut={(e) => (e.target.style.backgroundColor = "white")}
            >
              OK
            </button>
          </div>
        </div>
      )}
      <div style={styles.outerContainer}>
        <div style={styles.modal}>
          <div style={styles.logo}>
            <img
              src={fglogo_Wbg}
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
            onFocus={identifierInput.onFocus}
            onBlur={identifierInput.onBlur}
            style={identifierInput.inputStyle}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={passwordInput.onFocus}
            onBlur={passwordInput.onBlur}
            style={passwordInput.inputStyle}
          />

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
      </div>
    </>
  );
};



// --- MAIN APPLICATION COMPONENT ---
export const AuthFlow = () => {
  const [currentPage, setCurrentPage] = useState("create"); // 'create' or 'login'

  const handleSwitch = (page) => {
    setCurrentPage(page);
  };

  return (
    <div style={styles.appContainer}>

      {currentPage === "create" && <CreateAccount onSwitch={handleSwitch} />}
      {currentPage === "login" && <LoginPage onSwitch={handleSwitch} />}
    </div>
  );
};

// --- STYLES ---
const styles = {

  appContainer: {
   background: `
    linear-gradient(
      to right,
      #e0f2f1 0%,      /* left glow */
      rgba(202, 211, 231, 0.0) 20%,    /* fade to center */
      rgba(202, 211, 231, 0.0) 80%,    /* fade out to right glow */
      #e0f2f1 100%    /* right glow */
    )
  `,
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    animation: "fadeIn 0.8s ease-in-out",
  },

  "@keyframes fadeIn": {
    from: { opacity: 0, transform: "scale(0.9)" },
    to: { opacity: 1, transform: "scale(1)" },
  },

  modal: {
      background: 'linear-gradient(180deg, #e3e8f1ff, #CAD3E7)',

    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',
    borderRadius: '28px',
    border: '1px solid #1c1c1c66',
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

  subText: {
    fontSize: "12px",
    color: "#57556a",
    marginBottom: "25px",
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
  },

  errorText: {
    color: "red",
    fontSize: "12px",
    marginTop: "-4px",
    marginBottom: "8px",
    textAlign: "left",
  },

  inputFocus: {
    borderColor: "#7f8c8d", // Subtle focus color
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
  },
  buttonHover: {
    backgroundColor: "#57556a",
    transform: "translateY(-1px)",
  },
  googleButton: {
    width: "100%",
    padding: "12px",
    margin: "10px 0",
    borderRadius: "24px",
    border: "1px solid #c2c9cc",
    backgroundColor: "#dfe4e6",
    color: "#353342",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s ease-in-out",
  },
  googleButtonHover: {
    backgroundColor: "#e7ebee",
  },
  googleIcon: {
    width: "30px",
    height: "30px",
    marginRight: "10px",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    textAlign: "center",
    margin: "20px 0",
    color: "#000000ff",
  },
  dividerLine: {
    flexGrow: 1,
    height: "1px",
    backgroundColor: "#000000ff",
  },
  dividerText: {
    padding: "0 10px",
    fontSize: "18px",
  },
  link: {
    color: "#353342",
    fontSize: "12px",
    textDecoration: "none",
    display: "block",
    marginTop: "15px",
    cursor: "pointer",
    transition: "opacity 0.2s ease-in-out",
  },
  linkHover: {
    opacity: 0.7,
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
    flex: 1,
    padding: "8px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    transition: "background-color 0.2s ease-in-out, color 0.2s ease-in-out",
  },
  tabActive: {
    backgroundColor: "#353342",
    color: "#dfe4e6",
  },
  tabInactive: {
    backgroundColor: "transparent",
    color: "#57556a",
  },
  popupOverlayStyle: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },

  popupBoxStyle: {
    backgroundColor: "#b1cfb2ff",
    color: "black",
    padding: "20px",
    borderRadius: "8px",
    textAlign: "center",
    boxShadow: "0 4px 8px rgba(20, 13, 13, 0.3)",
  },
  okButtonStyle: {
    marginTop: "10px",
    padding: "8px 16px",
    border: "1px solid black",
    borderRadius: "10px",
    backgroundColor: "white",
    color: "black",
    cursor: "pointer",
    transition: "all 0.2s ease-in-out",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },

  // Animation utility (using a small, repeated animation for effect)
  pulse: {
    animation: "pulse-animation 2s infinite alternate",
    "@keyframes pulse-animation": {
      "0%": { transform: "scale(1)" },
      "100%": { transform: "scale(1.02)" },
    },
  },
};

export default AuthFlow;