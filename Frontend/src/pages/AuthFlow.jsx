import React, { useState } from "react";
import "../App.css";
import { useGoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import fgLogo from "../images/fglogo.png";
import Glogo from "../images/Glogo.png";

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

// 1. Create Account Page
const CreateAccount = ({ onSwitch }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [contact, setContact] = useState("");
  const [contactError, setContactError] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
  const usernameInput = useInputFocus();
  const contactInput = useInputFocus();
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

  const handleCreateAccount = () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Check if all fields are filled
    if (!username || !email || !password || !contact) {
      setPopupMessage("Please fill out all fields.");
      setPopupColor("#d6867dff"); // red
      setShowPopup(true);
      return;
    }

    // Email validation
    if (!emailPattern.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    } else {
      setEmailError("");
    }

    // Contact number validation
    if (contact.length !== 10) {
      setContactError("Contact number must be exactly 10 digits");
      return;
    } else {
      setContactError("");
    }

    // Password validation
    const pwdError = validatePassword(password);
    if (pwdError) {
      setPasswordError(pwdError);
      return;
    } else {
      setPasswordError("");
    }
    // All validations passed
    setShowPopup(true);

    navigate("/mainpageafterlogin");
  };

  const handleGoogleSuccess = (tokenResponse) => {
    // The ID token (JWT) is in tokenResponse.credential
    const decodedToken = jwtDecode(tokenResponse.credential);

    console.log("Google Login Success. Decoded Data:", decodedToken);
    setPopupMessage(
      `Signed in as ${decodedToken.name} (${decodedToken.email})!`
    );
    setPopupColor("#4CAF50"); // green
    setShowPopup(true);

    //  CRUCIAL NEXT STEP:
    // Send the ID token (tokenResponse.credential) to your server (e.g., in server.js)
    // for secure verification and user creation/authentication.
    // Example: sendTokenToServer(tokenResponse.credential);
  };

  const handleGoogleError = () => {
    console.error("Google Sign-In Failed");
    setPopupMessage("Google Sign-In failed. Please try again.");
    setPopupColor("#E74C3C"); // red
    setShowPopup(true);
  };

  // 3. Get the actual Google login function using the hook
  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: handleGoogleError,
    // flow: 'auth-code' is recommended for server-side verification (requires backend setup)
  });

  return (
    <>
      {showPopup && (
        <div style={styles.popupOverlayStyle}>
          <div style={{ ...styles.popupBoxStyle, backgroundColor: popupColor }}>
            <h3>
              {popupColor === "#4CAF50"
                ? "✅ Account Created"
                : "⚠️ Incomplete Details"}
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
    <div>
      {/* Your Google Login button goes here */}

      {/* ✅ Custom Popup */}
      {showPopup && (
        <div style={styles.popupOverlayStyle}>
          <div style={{ ...styles.popupBoxStyle, backgroundColor: popupColor }}>
            <h3>
              {popupColor === "#4CAF50"
                ? "✅ Google Sign-In Successful"
                : "❌ Google Sign-In Failed"}
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
    </div>
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
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          {...usernameInput}
          style={usernameInput.inputStyle}
        />

        {/* Contact Number Section (with validation + selector) */}
        <div style={styles.phoneContainer}>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            style={styles.countryCodeSelect}
          >
            <option value="+91">+91 🇮🇳</option>
            <option value="+1">+1 🇺🇸</option>
            <option value="+44">+44 🇬🇧</option>
            <option value="+61">+61 🇦🇺</option>
          </select>

          <input
            type="tel"
            placeholder="Contact number"
            value={contact}
            onChange={(e) => {
              const onlyNums = e.target.value.replace(/\D/g, "").slice(0, 10);
              setContact(onlyNums);
              if (onlyNums.length === 10) {
                setContactError("");
              } else {
                setContactError("Contact number must be exactly 10 digits");
              }
            }}
            {...contactInput}
            style={{
              ...contactInput.inputStyle,
              flex: 1,
              borderColor: contactError
                ? "red"
                : contactInput.inputStyle.borderColor,
            }}
          />
        </div>

        {/* Error message below input */}
        {contactError && <p style={styles.errorText}>{contactError}</p>}

        <input
          type="email"
          placeholder="email address"
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
          style={createBtnProps.style}
          onMouseEnter={createBtnProps.onMouseEnter}
          onMouseLeave={createBtnProps.onMouseLeave}
        >
          Create an account
        </button>

        {/* <div style={styles.divider}>
          <span style={styles.dividerLine}></span>
          <span style={styles.dividerText}>or continue with</span>
          <span style={styles.dividerLine}></span>
        </div> */}
      </div>
      <div style={styles.divider}>
          <span style={styles.dividerLine}></span>
          <span style={styles.dividerText}>or continue with</span>
          <span style={styles.dividerLine}></span>
        </div>
      
      <div
          style={styles.google}
          onClick={googleLogin}
          onMouseEnter={googleBtnProps.onMouseEnter}
          onMouseLeave={googleBtnProps.onMouseLeave}
        >
          <img
            src={Glogo}
            alt="Google logo"
            style={styles.googleIcon}
          />
          Google
        </div>
    </div>
    </>
  );
};

// 2. & 3. Login Page
const LoginPage = ({ onSwitch }) => {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState("email"); // 'email' or 'username'
  const [emailError, setEmailError] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const loginBtnProps = useInteractionState(styles.button, styles.buttonHover);
  const signUpLinkProps = useInteractionState(styles.link, styles.linkHover);
  const identifierInput = useInputFocus();
  const passwordInput = useInputFocus();
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupColor, setPopupColor] = useState("#4CAF50");

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

  const handleLogin = () => {
    if (!identifier || !password) {
      setPopupMessage("Please enter your details.");
      setPopupColor("#E74C3C");
      setShowPopup(true);
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

    // Login logic placeholder
    setPopupMessage(`Logging in with ${loginType}: ${identifier}`);
    setPopupColor("#4CAF50");
    setShowPopup(true);

    navigate("/mainpageafterlogin");
  };

  const handleToggle = (type) => {
    setLoginType(type);
    setIdentifier(""); // Clear input on toggle for better UX
  };

  return (
    <>
    {/* ✅ Popup */}
      {showPopup && (
        <div style={styles.popupOverlayStyle}>
          <div style={styles.popupBoxStyle}>
            <h3>
              {popupColor === "#88a089ff" ? "✅ Success" : "❌ Error"}
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
    <div style={styles.modal}>
      <div style={styles.logo}>
        <img
          src={fgLogo}
          alt="Site logo"
          style={{ height: "130px", width: "auto" }}
        />
      </div>
      {/* <div style={styles.header}>Create your account</div> */}
      <div style={styles.header}>Log in to your account</div>
      {/* <div style={styles.logo}>OG</div> */}

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
        style={loginBtnProps.style}
        onMouseEnter={loginBtnProps.onMouseEnter}
        onMouseLeave={loginBtnProps.onMouseLeave}
      >
        Log in
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
    backgroundColor: "#515266",
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
    backgroundColor: "#d1dfdf",
    borderRadius: "24px",
    padding: "25px 50px",
    width: "400px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)",
    textAlign: "center",
    fontFamily: "Bricolage Grotesque, sans-serif",
    position: "relative",
  },

  google: {
    marginTop: "20px",
    backgroundColor: "#f3f5dc",
    borderRadius: "24px",
    padding: "12px 10px",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
    transition: "background-color 0.3s ease-in-out",
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
    color: "#7f8c8d",
  },
  dividerLine: {
    flexGrow: 1,
    height: "1px",
    backgroundColor: "#c2c9cc",
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
    popupOverlayStyle :{
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
    
     popupBoxStyle : {
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
