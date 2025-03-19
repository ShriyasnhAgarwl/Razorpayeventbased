import { useState } from 'react';
import Payment from './components/Payment/Payment';
import './App.css';

function App() {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');

  return (
    <div className="App">
      <div className="payment-form">
        <h1>Payment Details</h1>
        <div className="form-group">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="1"
            className="amount-input"
          />
        </div>
        <div className="form-group">
          <select 
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="currency-select"
          >
            <option value="INR">INR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        {amount && <Payment amount={amount} currency={currency} />}
      </div>
    </div>
  );
}

export default App;
