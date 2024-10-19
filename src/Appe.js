import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { Model } from './Explorer';
import { ConvaiClient } from 'convai-web-sdk';
import { SETTINGS } from './constants';
import './App.css';

const convaiClient = new ConvaiClient({
  apiKey: SETTINGS['CONVAI-API-KEY'],
  characterId: SETTINGS['CHARACTER-ID'],
  enableAudio: true,
});

const humanEmotions = ['😊', '🤔', '😄', '😯', '🙂', '😌'];

export default function App() {
  const [userText, setUserText] = useState('');
  const [npcText, setNpcText] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isTalking, setIsTalking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chathumaduEmotion, setChathumaduEmotion] = useState('😊');
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  const [is3DEnabled, setIs3DEnabled] = useState(true);
  const orbitRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const chatHistoryRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    convaiClient.setResponseCallback((response) => {
      setLoading(false);
      try {
        if (response.hasUserQuery()) {
          const transcript = response.getUserQuery();
          if (transcript.getIsFinal()) {
            const userMessage = transcript.getTextData();
            setUserText(userMessage);
            addToConversation('user', userMessage);
          }
        }
        if (response.hasAudioResponse()) {
          const aiMessage = response.getAudioResponse().getTextData();
          setNpcText(aiMessage);
          addToConversation('ai', aiMessage);
          setChathumaduEmotion(humanEmotions[Math.floor(Math.random() * humanEmotions.length)]);
        }
      } catch (error) {
        setError('An error occurred while processing the response. Please try again.');
      }
    });

    convaiClient.onAudioPlay(() => {
      setIsTalking(true);
      setLoading(true);
    });
    convaiClient.onAudioStop(() => setIsTalking(false));

    return () => {
      convaiClient.setResponseCallback(null);
      convaiClient.onAudioPlay(null);
      convaiClient.onAudioStop(null);
    };
  }, []);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [conversation]);

  const addToConversation = (sender, message) => {
    setConversation(prev => [...prev, { sender, message, timestamp: new Date().toLocaleTimeString() }]);
  };

  const handleVoiceInput = useCallback(() => {
    setIsListening(true);
    convaiClient.startAudioChunk();
  }, []);

  const handleVoiceInputEnd = useCallback(() => {
    setIsListening(false);
    convaiClient.endAudioChunk();
  }, []);

  const handleTextInput = useCallback(() => {
    if (userText.trim()) {
      addToConversation('user', userText);
      convaiClient.sendTextChunk(userText);
      setUserText('');
    }
  }, [userText]);

  const resetError = () => {
    setError(null);
  };

  const toggle3D = () => {
    setIs3DEnabled(!is3DEnabled);
  };

  return (
    <div className={`app-container ${isLandscape ? 'landscape' : 'portrait'}`} ref={containerRef}>
      {is3DEnabled && (
        <div className="canvas-container">
          <Canvas shadows camera={{ position: [0, 0, 15], fov: 30 }}>
            <Environment
              files="/snowy_forest_path_01_4k.hdr"
              ground={{ height: 5, radius: 30, scale: 20 }}
            />
            <Model
              position={[0, -1, 3]}
              scale={1.8}
              animationName={isTalking ? 'talk' : 'idle'}
            />
            <OrbitControls
              ref={orbitRef}
              enableZoom={true}
              minDistance={5}
              maxDistance={20}
              minPolarAngle={Math.PI / 3}
              maxPolarAngle={Math.PI / 2.25}
            />
          </Canvas>
        </div>
      )}
      
      <div className="ui-overlay">
        <button onClick={toggle3D} className="toggle-3d-button" aria-label="Toggle 3D view">
          {is3DEnabled ? 'Disable 3D' : 'Enable 3D'}
        </button>
        <div className="conversation-history" ref={chatHistoryRef}>
          {conversation.map((entry, index) => (
            <div key={index} className={`message ${entry.sender}`}>
              <div className="message-header">
                <strong>{entry.sender === 'user' ? 'You' : 'Chathumadu'} {entry.sender === 'ai' && chathumaduEmotion}</strong>
                <span className="timestamp">{entry.timestamp}</span>
              </div>
              <div className="message-content">{entry.message}</div>
            </div>
          ))}
        </div>

        <div className="input-container">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type your message..."
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleTextInput()}
          />
          <button onClick={handleTextInput} className="send-button" aria-label="Send message">Send</button>
          <button
            onClick={isListening ? handleVoiceInputEnd : handleVoiceInput}
            className={`voice-button ${isListening ? 'listening' : ''}`}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
          >
            {isListening ? 'Listening...' : 'Voice'}
          </button>
        </div>

        {error && (
          <div className="error-message" role="alert">
            {error}
            <button onClick={resetError}>Dismiss</button>
          </div>
        )}

        {loading && (
          <div className="loading-spinner" aria-label="Loading">Processing...</div>
        )}
      </div>
    </div>
  );
}