import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import GameRoom from './components/GameRoom';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);

  if (loading) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 className="title-gradient" style={{ fontSize: '2rem', animation: 'freeze-shiver 2s infinite ease-in-out' }}>Spell Chess</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Loading magical files...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <AuthForm />
      </div>
    );
  }

  if (activeRoomId && playerColor) {
    return (
      <div className="app-container">
        <GameRoom
          roomId={activeRoomId}
          playerColor={playerColor}
          onLeave={() => {
            setActiveRoomId(null);
            setPlayerColor(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Dashboard
        onCreateRoom={(roomId, color) => {
          setActiveRoomId(roomId);
          setPlayerColor(color);
        }}
        onJoinRoom={(roomId, color) => {
          setActiveRoomId(roomId);
          setPlayerColor(color);
        }}
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
