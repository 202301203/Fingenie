import React, { useState, useEffect } from 'react';
import { getAuthToken, checkAuth, testAuth } from '../services/api';

const AuthDebug = () => {
  const [authInfo, setAuthInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const authStatus = await checkAuth();
      const testResult = await testAuth();
      
      setAuthInfo({
        token: token,
        authStatus,
        testResult,
        localStorage: localStorage.getItem('authToken'),
        sessionStorage: sessionStorage.getItem('authToken')
      });
    } catch (error) {
      setAuthInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#f8f9fa',
      border: '1px solid #dee2e6',
      padding: '15px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 10000,
      maxWidth: '400px',
      maxHeight: '500px',
      overflow: 'auto'
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>🔍 Auth Debug</h4>
      
      {loading ? (
        <div>Checking auth status...</div>
      ) : authInfo ? (
        <div>
          <div><strong>Token in getAuthToken():</strong> {authInfo.token ? '✅ Present' : '❌ Missing'}</div>
          <div><strong>Token in localStorage:</strong> {authInfo.localStorage ? '✅ Present' : '❌ Missing'}</div>
          <div><strong>Token in sessionStorage:</strong> {authInfo.sessionStorage ? '✅ Present' : '❌ Missing'}</div>
          <div><strong>Auth Status:</strong> {authInfo.authStatus?.authenticated ? '✅ Authenticated' : '❌ Not Authenticated'}</div>
          {authInfo.authStatus?.authenticated && (
            <div><strong>User:</strong> {authInfo.authStatus.username}</div>
          )}
          {authInfo.testResult?.hasToken !== undefined && (
            <div><strong>Test Result - Has Token:</strong> {authInfo.testResult.hasToken ? '✅ Yes' : '❌ No'}</div>
          )}
          {authInfo.error && (
            <div style={{ color: 'red' }}><strong>Error:</strong> {authInfo.error}</div>
          )}
        </div>
      ) : null}
      
      <button 
        onClick={checkStatus} 
        style={{ 
          marginTop: '10px', 
          padding: '5px 10px', 
          fontSize: '10px',
          cursor: 'pointer'
        }}
      >
        Refresh Status
      </button>
      
      <button 
        onClick={() => {
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('authToken');
          checkStatus();
        }}
        style={{ 
          marginTop: '5px', 
          padding: '5px 10px', 
          fontSize: '10px',
          cursor: 'pointer',
          background: '#ff6b6b',
          color: 'white',
          border: 'none',
          borderRadius: '3px'
        }}
      >
        Clear Tokens
      </button>
    </div>
  );
};

export default AuthDebug;