import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthFlow } from '../pages/AuthFlow';

// AuthFlow tests: helpers and behavior checks

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }) => <div>{children}</div>,
  GoogleLogin: ({ onSuccess, onError }) => (
    <div>
      <button data-testid="google-login-button" onClick={() => onSuccess({ credential: 'mock-google-token-12345' })}>Sign in with Google</button>
      <button data-testid="google-login-error-button" onClick={() => onError()}>Trigger Google Error</button>
    </div>
  ),
}));

const renderAuthFlow = () => render(
  <BrowserRouter>
    <GoogleOAuthProvider clientId="test-client-id">
      <AuthFlow />
    </GoogleOAuthProvider>
  </BrowserRouter>
);

const fillForm = (username, email, password) => {
  if (username) fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: username } });
  if (email) fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: email } });
  if (password) fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: password } });
};

const clickButton = (name) => fireEvent.click(screen.getByRole('button', { name }));

const dismissPopup = () => {
  const okBtn = screen.getByText('OK');
  fireEvent.mouseOver(okBtn);
  fireEvent.mouseOut(okBtn);
  fireEvent.click(okBtn);
};

const expectText = async (text) => await waitFor(() => expect(screen.getByText(text)).toBeInTheDocument());
const expectTextRegex = async (regex) => await waitFor(() => expect(screen.getByText(regex)).toBeInTheDocument());

describe('AuthFlow page', () => {
  let fetchSpy;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch');
    mockNavigate.mockClear();
    Object.defineProperty(document, 'cookie', { writable: true, value: 'csrftoken=mock-csrf-token-xyz' });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    jest.clearAllTimers();
  });

  test('1 - Create account and switch to login', () => {
    renderAuthFlow();
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create an account/i })).toBeInTheDocument();
    expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Log in'));
    expect(screen.getByText('Log in to your account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  test('2 - Validate form inputs', async () => {
    renderAuthFlow();
    clickButton(/create an account/i);
    await expectText('Please fill out all fields.');
    dismissPopup();

    fillForm('testuser', 'invalid-email', 'ValidPass123!');
    clickButton(/create an account/i);
    await expectText('Please enter a valid email address');

    const passwordTests = [
      { password: 'short', error: /Password must be at least 8 characters/i },
      { password: 'weakpass123!', error: /Password must contain at least one uppercase letter/i },
      { password: 'PASSWORD123!', error: /Password must contain at least one lowercase letter/i },
      { password: 'Password!', error: /Password must contain at least one number/i },
      { password: 'Password123', error: /Password must contain at least one special character/i }
    ];

    for (const { password, error } of passwordTests) {
      fillForm(null, 'test@example.com', password);
      clickButton(/create an account/i);
      await expectTextRegex(error);
    }
  });

  test('3 - Successful registration', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ username: 'testuser', email: 'test@example.com' }) });
    renderAuthFlow();
    fillForm('testuser', 'test@example.com', 'ValidPass123!');
    clickButton(/create an account/i);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/accounts/api/register/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json', 'X-CSRFToken': 'mock-csrf-token-xyz' }),
          body: JSON.stringify({ username: 'testuser', email: 'test@example.com', password: 'ValidPass123!' })
        })
      );
    });
    await waitFor(() => expect(screen.getByText(/Account created successfully/i)).toBeInTheDocument());
  });

  test('4 - Registration failures and network errors', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Username already exists' }) });
    renderAuthFlow();
    fillForm('existinguser', 'test@example.com', 'ValidPass123!');
    clickButton(/create an account/i);
    await expectText('Username already exists');
    dismissPopup();
    await waitFor(() => expect(screen.queryByText('Username already exists')).not.toBeInTheDocument());

    fetchSpy.mockRejectedValueOnce(new Error('Network error'));
    fillForm('newuser', 'new@example.com', 'ValidPass123!');
    clickButton(/create an account/i);
    await expectTextRegex(/Server error/i);
  });

  test('5 - Login tab switch and validation', async () => {
    renderAuthFlow();
    fireEvent.click(screen.getByText('Log in'));
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Username'));
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    clickButton(/log in/i);
    await expectText('Please enter your email/username and password.');
  });

  test('6 - Successful login', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, username: 'testuser' }) });
    renderAuthFlow();
    fireEvent.click(screen.getByText('Log in'));
    fillForm(null, 'test@example.com', 'ValidPass123!');
    clickButton(/log in/i);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/accounts/api/login/'), expect.objectContaining({ method: 'POST' })));
    await expectTextRegex(/Welcome back/i);
  });

  test('7 - Login failures and username login', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ success: false, error: 'Invalid credentials' }) });
    renderAuthFlow();
    fireEvent.click(screen.getByText('Log in'));
    fillForm(null, 'test@example.com', 'WrongPass123!');
    clickButton(/log in/i);
    await expectText('Invalid credentials');
    cleanup();

    fetchSpy.mockRejectedValueOnce(new Error('Network error'));
    renderAuthFlow();
    fireEvent.click(screen.getByText('Log in'));
    fillForm(null, 'test@example.com', 'Test123!');
    clickButton(/log in/i);
    await expectTextRegex(/Network error/i);
    cleanup();

    fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, username: 'testuser' }) });
    renderAuthFlow();
    fireEvent.click(screen.getByText('Log in'));
    fireEvent.click(screen.getByText('Username'));
    fillForm('testuser', null, 'Test123!');
    clickButton(/log in/i);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/accounts/api/login/'), expect.objectContaining({ method: 'POST' })));
    await expectTextRegex(/Welcome back/i);
  });

  test('8 - Google OAuth flows', async () => {
    const testGoogleOAuth = async (mockResponse) => {
      if (mockResponse.error) {
        fetchSpy.mockRejectedValueOnce(mockResponse.error);
      } else {
        fetchSpy.mockResolvedValueOnce(mockResponse);
      }
      renderAuthFlow();
      fireEvent.click(screen.getByTestId('google-login-button'));
      await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
      cleanup();
      fetchSpy.mockClear();
    };

    await testGoogleOAuth({ ok: true, json: async () => ({ is_new_user: true, username: 'newgoogleuser' }) });
    await testGoogleOAuth({ ok: true, json: async () => ({ is_new_user: false, username: 'existinguser' }) });
    await testGoogleOAuth({ ok: true, json: async () => ({ is_new_user: false, username: 'existinguser' }) });
    await testGoogleOAuth({ ok: false, json: async () => ({ error: 'Google authentication failed' }) });
    await testGoogleOAuth({ error: new Error('Network error') });
  });

  test('9 - Google OAuth error and input interactions', async () => {
    renderAuthFlow();
    
    // Test Google error button
    const errorButton = screen.getByTestId('google-login-error-button');
    fireEvent.click(errorButton);
    
    // Test input focus interactions
    const usernameInput = screen.getByPlaceholderText('Username');
    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    
    fireEvent.focus(usernameInput);
    fireEvent.blur(usernameInput);
    fireEvent.focus(emailInput);
    fireEvent.blur(emailInput);
    fireEvent.focus(passwordInput);
    fireEvent.blur(passwordInput);
    
    // Test button hover interactions
    const createButton = screen.getByRole('button', { name: /create an account/i });
    fireEvent.mouseEnter(createButton);
    fireEvent.mouseLeave(createButton);
    
    // Switch to login and test those interactions
    fireEvent.click(screen.getByText('Log in'));
    const loginButton = screen.getByRole('button', { name: /log in/i });
    fireEvent.mouseEnter(loginButton);
    fireEvent.mouseLeave(loginButton);
    
    const loginPasswordInput = screen.getByPlaceholderText('Password');
    fireEvent.focus(loginPasswordInput);
    fireEvent.blur(loginPasswordInput);
  });
});
