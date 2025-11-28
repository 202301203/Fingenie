import React, { useState, useEffect, useRef } from 'react';

// --- (NEW) Import Lucide icons for a clean look ---
// You may need to install this: npm install lucide-react
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';

/**
 * A self-contained chatbot component.
 * It floats on the bottom-right of the screen and manages its own state.
 *
 * @param {object} props
 * @param {string} props.reportId - The ID of the report to chat about.
 * @param {string} props.apiKey - The user's API key.
 */
export default function Chatbot({ reportId, apiKey }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState([
        {
            role: 'model',
            text: "Hello! How may I help you?"
        }
    ]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    // API endpoint for Django backend.
    // The backend automatically pulls the stored summary (pros/cons/financial_health_summary)
    // for the provided `reportId` (FinancialReport.report_id). Frontend only needs to send
    // question, history, reportId, and apiKey.
    const CHAT_API_URL = '/api/chat/api/chatbot/'; 

    // Auto-load Groq API key from localStorage if not passed
    useEffect(() => {
        if (!apiKey) {
            const stored = localStorage.getItem('groq_api_key') || localStorage.getItem('userApiKey') || localStorage.getItem('GENAI_API_KEY');
            if (stored && stored !== apiKey) {
                // push a hint message
                setChatHistory(prev => [...prev, { role: 'model', text: 'Using stored API key from previous upload session.' }]);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Scroll to the bottom of the chat window when new messages appear
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory, isOpen]);

    // Inline styles to avoid depending on Tailwind being present
    const chatStyles = {
        floatingButton: {
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#111827',
            color: 'white',
            padding: '12px',
            borderRadius: '9999px',
            boxShadow: '0 10px 15px rgba(0,0,0,0.15)',
            border: 'none',
            cursor: 'pointer',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
        },
        window: {
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '360px',
            maxWidth: 'calc(100% - 48px)',
            height: '70vh',
            maxHeight: 600,
            backgroundColor: '#ffffff',
            borderRadius: 12,
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 2000,
            overflow: 'hidden'
        },
        header: {
            backgroundColor: '#0f1724',
            color: 'white',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        },
        messages: {
            flex: 1,
            padding: 12,
            overflowY: 'auto',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
        },
        inputForm: {
            padding: 12,
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            gap: 8,
            alignItems: 'center'
        },
        input: {
            flex: 1,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            outline: 'none'
        },
        sendButton: {
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '8px 10px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer'
        },
        userBubble: {
            alignSelf: 'flex-end',
            backgroundColor: '#0ea5a4',
            color: 'white',
            padding: '8px 12px',
            borderRadius: 12,
            maxWidth: '80%'
        },
        modelBubble: {
            alignSelf: 'flex-start',
            backgroundColor: '#ffffff',
            color: '#111827',
            padding: '8px 12px',
            borderRadius: 12,
            border: '1px solid #e6e6e6',
            maxWidth: '80%'
        },
        loaderBubble: {
            alignSelf: 'flex-start',
            backgroundColor: '#ffffff',
            color: '#111827',
            padding: '8px 12px',
            borderRadius: 12,
            border: '1px solid #e6e6e6',
            display: 'flex',
            gap: 8,
            alignItems: 'center'
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const handleSendChat = async (e) => {
        e.preventDefault();
        const question = input.trim();
        if (!question) return;

        // Add user message to history immediately
        const userMessage = { role: 'user', text: question };
        setChatHistory(prev => [...prev, userMessage]);

        // Check for reportId and apiKey BEFORE making the request
        const effectiveApiKey = apiKey || localStorage.getItem('groq_api_key') || localStorage.getItem('userApiKey') || localStorage.getItem('GENAI_API_KEY');
        
        if (!reportId || !effectiveApiKey) {
            setChatHistory(prev => [...prev, { 
                role: 'model', 
                text: 'Chat unavailable: missing report ID or API key. Please upload a document or provide an API key.' 
            }]);
            return;
        }

        setIsLoading(true);
        setInput('');

        try {
            const response = await fetch(CHAT_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question,
                    document_id: reportId,
                    history: [...chatHistory, userMessage],
                    api_key: effectiveApiKey
                })
            });

            if (!response.ok) {
                let errorMessage = 'API request failed';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = `Server error (${response.status}): ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            // Add model response to history
            setChatHistory(prev => [...prev, { role: 'model', text: data.answer }]);

        } catch (error) {
            console.error('Chat API Error:', error);
            // Add an error message to the chat
            setChatHistory(prev => [...prev, { role: 'model', text: `Sorry, an error occurred: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    // --- (NEW) Render logic: Icon button OR Chat Window ---
    if (!isOpen) {
        // Floating icon button when chat is CLOSED
        return (
            <button onClick={toggleChat} aria-label="Open chat" style={chatStyles.floatingButton}>
                <MessageSquare size={24} />
            </button>
        );
    }

    // Render the full chat window when chat is OPEN
    return (
        <div style={chatStyles.window}>
            <div style={chatStyles.header}>
                <h2 style={{ margin: 0, fontSize: 16 }}>Report Analyst</h2>
                <button onClick={toggleChat} aria-label="Close chat" style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <X size={20} />
                </button>
            </div>

            <div style={chatStyles.messages}>
                {chatHistory.map((message, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div style={message.role === 'user' ? chatStyles.userBubble : chatStyles.modelBubble}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    {message.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                </div>
                                <div style={{ fontSize: 14 }}>{message.text}</div>
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div style={chatStyles.loaderBubble}>
                            <Bot size={14} />
                            <div style={{ fontSize: 14 }}><Loader2 size={14} /></div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendChat} style={chatStyles.inputForm}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={(!reportId || !apiKey) ? 'Chat disabled: missing report ID or API key' : 'Ask a question...'}
                    style={chatStyles.input}
                    disabled={isLoading || !reportId || !apiKey}
                />
                <button type="submit" style={chatStyles.sendButton} disabled={isLoading || !reportId || !apiKey}>
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
}
