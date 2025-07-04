import React, { useState } from 'react';
import './App.css'; // Optional CSS
import axios from 'axios';

const App = () => {
  const [userMessage, setUserMessage] = useState('');
  const [aiResponse, setAiResponse] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userMessage }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ AI Response:', result);
      setAiResponse(result.solution || []);
    } catch (err) {
      console.error('AI API error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cost Calculations
  const subtotal = aiResponse.reduce(
    (sum, item) => sum + (item.defaultEstimatedMonthlyCost || 0),
    0
  );
  const vat = subtotal * 0.15;
  const total = subtotal + vat;

  return (
    <div className="ai-chat-container">
      {/* LEFT PANEL */}
      <div className="chat-panel">
        <div className="chat-history">
          <div className="agent-msg">
            <p>What is the estimated number of SKUs in their product catalog?...</p>
          </div>
          <div className="user-msg">
            <p>{userMessage}</p>
          </div>
        </div>
        <div className="chat-input">
          <input
            type="text"
            placeholder="Type your customer's requirements..."
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
          />
          <button onClick={handleSend} disabled={loading}>
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="suggestion-panel">
        <h3>AI Suggested Solution & Estimate</h3>
        {aiResponse.map((item, index) => (
          <div className="card" key={index}>
            <strong>{item.service || item.instance}</strong>
            <p>{item.instanceType && `Type: ${item.instanceType}`}</p>
            <p>{item.quantity && `Qty: ${item.quantity}`}</p>
            <p>
              Est. SAR {(item.defaultEstimatedMonthlyCost || 0).toFixed(2)} / month
            </p>
          </div>
        ))}

        {/* COST SUMMARY */}
        {aiResponse.length > 0 && (
          <div className="total-section">
            <p>Subtotal: SAR {subtotal.toFixed(2)}</p>
            <p>VAT (15%): SAR {vat.toFixed(2)}</p>
            <strong>Total Monthly Cost: SAR {total.toFixed(2)}</strong>
            <button className="primary-btn">Accept & Finalize Estimate</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
