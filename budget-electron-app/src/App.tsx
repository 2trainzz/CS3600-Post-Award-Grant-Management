import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    // Fetch from Express server
    fetch('http://localhost:3001/api/hello')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.error(err));
  }, []);

  const fetchData = () => {
    fetch('http://localhost:3001/api/data')
      .then(res => res.json())
      .then(result => setData(result.data))
      .catch(err => console.error(err));
  };

  return (
    <div className="App">
      <h1>Electron + React + Express</h1>
      <p>Message from server: {message}</p>
      <button onClick={fetchData}>Fetch Data</button>
      <ul>
        {data.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  );
}

export default App;
