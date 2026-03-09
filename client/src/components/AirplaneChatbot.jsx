import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Send, X, Bot, User, Mic, MicOff, History, Trash2, Volume2, VolumeX, SquareSquare } from 'lucide-react';
import API from '../api/axios';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment } from '@react-three/drei';
import { useAuth } from '../context/AuthContext';
import { useChatContext } from '../context/ChatContext';

function SmokeParticles() {
    const meshRef = useRef();
    const count = 30;

    // We use a shared dummy object for instances
    const dummy = React.useMemo(() => new THREE.Object3D(), []);

    // State of each particle
    const particles = useRef(
        Array.from({ length: count }, () => ({
            position: new THREE.Vector3(-1.0 - Math.random() * 2, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4),
            scale: Math.random() * 0.6 + 0.2,
            velocity: new THREE.Vector3(-0.03 - Math.random() * 0.04, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02),
            life: Math.random(),
        }))
    );

    useFrame((_, delta) => {
        if (!meshRef.current) return;

        particles.current.forEach((particle, i) => {
            particle.life -= delta * 0.6;
            if (particle.life <= 0) {
                // Reset particle to origin (back of the plane)
                particle.life = 1;
                particle.position.set(-1.0, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2);
                particle.scale = Math.random() * 0.4 + 0.2;
            }
            // Move backward
            particle.position.addScaledVector(particle.velocity, delta * 60);
            // Expand slightly
            particle.scale += delta * 0.5;

            dummy.position.copy(particle.position);
            dummy.scale.setScalar(particle.scale * Math.max(0, particle.life));
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[null, null, count]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color="#f1f5f9" transparent opacity={0.6} roughness={1} />
        </instancedMesh>
    );
}

function Aeroplane3D() {
    const propellerRef = useRef();

    // Animate propeller spinning
    useFrame((_, delta) => {
        if (propellerRef.current) {
            propellerRef.current.rotation.x += delta * 20;
        }
    });

    return (
        <group rotation={[0.2, -Math.PI / 4, 0]} scale={0.8}>
            {/* Fuselage (Body) */}
            <mesh position={[0, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <capsuleGeometry args={[0.4, 1.8, 16, 16]} />
                <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
            </mesh>

            {/* Nose */}
            <mesh position={[1.1, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.4, 0.6, 32]} />
                <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.4} />
            </mesh>

            {/* Cockpit Window */}
            <mesh position={[0.6, 0.25, 0]} rotation={[0, 0, -Math.PI / 2.2]}>
                <boxGeometry args={[0.4, 0.45, 0.5]} />
                <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Cartoon Eyes (Left) */}
            <group position={[0.8, 0.2, 0.25]} rotation={[0, Math.PI / 2.5, 0]}>
                <mesh>
                    <sphereGeometry args={[0.12, 16, 16]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.1} />
                </mesh>
                <mesh position={[0.06, 0.02, 0]}>
                    <sphereGeometry args={[0.05, 16, 16]} />
                    <meshStandardMaterial color="#000000" roughness={0.1} />
                </mesh>
            </group>

            {/* Cartoon Eyes (Right) */}
            <group position={[0.8, 0.2, -0.25]} rotation={[0, Math.PI / 2.5, 0]}>
                <mesh>
                    <sphereGeometry args={[0.12, 16, 16]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.1} />
                </mesh>
                <mesh position={[0.06, 0.02, 0]}>
                    <sphereGeometry args={[0.05, 16, 16]} />
                    <meshStandardMaterial color="#000000" roughness={0.1} />
                </mesh>
            </group>

            {/* Cartoon Mouth */}
            <mesh position={[1.05, -0.05, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <torusGeometry args={[0.15, 0.04, 16, 16, Math.PI]} />
                <meshStandardMaterial color="#000000" roughness={0.8} />
            </mesh>

            {/* Main Wings */}
            <mesh position={[0.2, 0, 0]}>
                <boxGeometry args={[0.8, 0.05, 3.5]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.2} roughness={0.4} />
            </mesh>

            {/* Vertical Tail */}
            <mesh position={[-0.9, 0.4, 0]} rotation={[0, 0, -0.2]}>
                <boxGeometry args={[0.4, 0.8, 0.05]} />
                <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.2} />
            </mesh>

            {/* Horizontal Tail */}
            <mesh position={[-1.0, 0.1, 0]}>
                <boxGeometry args={[0.4, 0.05, 1.4]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.2} roughness={0.4} />
            </mesh>

            {/* Propeller Engine Mount */}
            <group position={[1.45, 0, 0]}>
                <mesh>
                    <sphereGeometry args={[0.15, 16, 16]} />
                    <meshStandardMaterial color="#1e293b" />
                </mesh>
                {/* Spinning Propeller Blades */}
                <group ref={propellerRef}>
                    <mesh>
                        <boxGeometry args={[0.04, 1.4, 0.08]} />
                        <meshStandardMaterial color="#0f172a" metalness={0.8} />
                    </mesh>
                </group>
            </group>

            {/* Smoke Trail */}
            <SmokeParticles />
        </group>
    );
}

const AirplaneChatbot = () => {
    const { screenContext, isAdvisorOpen, setIsAdvisorOpen } = useChatContext();
    const [showAudioPrompt, setShowAudioPrompt] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [showWelcomeCloud, setShowWelcomeCloud] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user, actingRole } = useAuth();

    // Initial message
    const WELCOME_MESSAGE = 'Hello! ✈️ I am your AI travel guide. I can help you plan dream trips, track budgets, and find the perfect stay. Where would you like to go today?';

    const [messages, setMessages] = useState([
        { role: 'assistant', text: WELCOME_MESSAGE }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [sessionId, setSessionId] = useState(`session_${Date.now()}`); // Persist session
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [savedSessions, setSavedSessions] = useState([]);
    const [voices, setVoices] = useState([]);

    useEffect(() => {
        const stored = localStorage.getItem('airplane_chat_sessions');
        if (stored) {
            try {
                setSavedSessions(JSON.parse(stored));
            } catch (e) { }
        }

        const audioPref = localStorage.getItem('airplane_audio_preference');
        if (audioPref !== null) {
            setAudioEnabled(audioPref === 'true');
        }
    }, []);

    useEffect(() => {
        // Automatically save session when messages change
        if (messages.length > 1) {
            const titleMsg = messages.find(m => m.role === 'user');
            const title = titleMsg ? titleMsg.text.substring(0, 30) + '...' : 'Chat Session';

            setSavedSessions(prev => {
                const existingIndex = prev.findIndex(s => s.id === sessionId);
                let updated = [...prev];
                if (existingIndex >= 0) {
                    updated[existingIndex] = { ...updated[existingIndex], messages };
                } else {
                    updated.unshift({ id: sessionId, title, date: new Date().toISOString(), messages });
                }
                updated = updated.slice(0, 15); // Keep last 15
                localStorage.setItem('airplane_chat_sessions', JSON.stringify(updated));
                return updated;
            });
        }
    }, [messages, sessionId]);

    const loadSession = (session) => {
        setSessionId(session.id);
        setMessages(session.messages);
        setIsHistoryOpen(false);
    };

    const deleteSession = (e, id) => {
        e.stopPropagation();
        setSavedSessions(prev => {
            const updated = prev.filter(s => s.id !== id);
            localStorage.setItem('airplane_chat_sessions', JSON.stringify(updated));
            return updated;
        });
        if (id === sessionId) {
            handleClose(); // reset view if deleting active session
            setIsAdvisorOpen(true);
        }
    };

    const speakText = (text, customVoices = null) => {
        if (!window.speechSynthesis || !audioEnabled) return;
        window.speechSynthesis.cancel(); // Cancel any ongoing speech
        const utterance = new SpeechSynthesisUtterance(text);

        const currentVoices = customVoices || voices;

        utterance.lang = 'en-US';
        const preferredVoice = currentVoices.find(v => v.lang.includes('en') && v.name.includes('Female')) ||
            currentVoices.find(v => v.lang.includes('en-US')) ||
            currentVoices[0];

        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.rate = 1.0;
        utterance.pitch = 1.1;

        window.speechSynthesis.speak(utterance);
    };

    const sendMessage = async (messageText) => {
        if (!messageText.trim()) return;

        const userMessage = { role: 'user', text: messageText };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const { data } = await API.post('/chat/message', {
                message: messageText,
                sessionId,
                language: 'en',
                currentPath: location.pathname,
                userRole: actingRole || user?.role || 'guest',
                screenContext
            });

            const botReply = data.reply.trim();

            setMessages(prev => [...prev, { role: 'assistant', text: botReply }]);
            speakText(botReply);
        } catch (error) {
            const errorMsg = 'Sorry, I am having trouble connecting right now.';
            setMessages(prev => [...prev, { role: 'assistant', text: errorMsg }]);
            speakText(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const toggleListening = () => {
        // Stop bot speaking immediately when mic is manually activated
        if (window.speechSynthesis) window.speechSynthesis.cancel();

        if (isListening) {
            setIsListening(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support Speech Recognition. Please try Chrome.");
            return;
        }

        const recognition = new SpeechRecognition();

        recognition.lang = 'en-US';

        recognition.interimResults = false;
        // recognition.continuous is false by default, so it stops when the user finishes speaking
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);

        // Barge-in: cancel bot speech as soon as user's voice is detected
        recognition.onspeechstart = () => {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setIsListening(false);
            sendMessage(transcript);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognition.onend = () => setIsListening(false);

        recognition.start();
    };

    useEffect(() => {
        let availableVoices = [];
        if (window.speechSynthesis) {
            const updateVoices = () => {
                const fetchedVoices = window.speechSynthesis.getVoices();
                if (fetchedVoices.length > 0) {
                    setVoices(fetchedVoices);
                    availableVoices = fetchedVoices;
                }
            };
            updateVoices();
            window.speechSynthesis.onvoiceschanged = updateVoices;
        }

        // Show the small cloud message 3 seconds after load if they haven't opened it yet
        const cloudTimer = setTimeout(() => {
            setShowWelcomeCloud(true);
            setTimeout(() => setShowWelcomeCloud(false), 8000); // Hide after 8s
        }, 3000);

        return () => clearTimeout(cloudTimer);
    }, []); // Run only on mount

    const handleClose = () => {
        setIsAdvisorOpen(false);
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        setIsListening(false);
    };

    const handleEndConversation = () => {
        setMessages([{ role: 'assistant', text: WELCOME_MESSAGE }]);
        setSessionId(`session_${Date.now()}`); // Create a new session
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        setIsListening(false);
    };

    const handleAirplaneClick = () => {
        setShowWelcomeCloud(false); // Hide the cloud greeting

        if (isAdvisorOpen) {
            setIsAdvisorOpen(false);
            return;
        }

        const audioPref = localStorage.getItem('airplane_audio_preference');
        if (audioPref === null) {
            setShowAudioPrompt(true);
        } else {
            setIsAdvisorOpen(true);
            if (audioPref === 'true') {
                speakText(WELCOME_MESSAGE);
            }
        }
    };

    const handleAudioChoice = (allow) => {
        localStorage.setItem('airplane_audio_preference', allow.toString());
        setAudioEnabled(allow);
        setShowAudioPrompt(false);
        setIsAdvisorOpen(true);
        if (allow) {
            // Need to wait slightly for state to update, or just use a short timeout to speak
            setTimeout(() => {
                if (window.speechSynthesis) {
                    const utterance = new SpeechSynthesisUtterance(WELCOME_MESSAGE);
                    utterance.lang = 'en-US';
                    const fetchedVoices = voices.length ? voices : window.speechSynthesis.getVoices();
                    const preferredVoice = fetchedVoices.find(v => v.lang.includes('en') && v.name.includes('Female')) || fetchedVoices[0];
                    if (preferredVoice) utterance.voice = preferredVoice;
                    window.speechSynthesis.speak(utterance);
                }
            }, 100);
        }
    };

    const toggleAudio = () => {
        const newVal = !audioEnabled;
        setAudioEnabled(newVal);
        localStorage.setItem('airplane_audio_preference', newVal.toString());

        if (!newVal && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        } else if (newVal && window.speechSynthesis) {
            // Find the last assistant message to say immediately upon unmuting
            const lastBotMsg = [...messages].reverse().find(m => m.role === 'assistant');
            if (lastBotMsg) {
                // Must pass audioEnabled override as true since state update might be slightly delayed
                const utterance = new SpeechSynthesisUtterance(lastBotMsg.text);
                utterance.lang = 'en-US';
                const fetchedVoices = voices.length ? voices : window.speechSynthesis.getVoices();
                const preferredVoice = fetchedVoices.find(v => v.lang.includes('en') && v.name.includes('Female')) || fetchedVoices[0];
                if (preferredVoice) utterance.voice = preferredVoice;
                utterance.rate = 1.0;
                utterance.pitch = 1.1;
                window.speechSynthesis.speak(utterance);
            }
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        sendMessage(input);
    };

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isAdvisorOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 40, originBottomRight: true }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 40 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="mb-6 w-[400px] h-[550px] bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col backdrop-blur-2xl"
                        style={{ transformOrigin: 'bottom right' }}
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-between shadow-lg relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-md">
                                    <Bot className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-black text-lg">AI Travel Guide</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                        </span>
                                        <span className="text-blue-100 text-xs font-bold uppercase tracking-widest">Active & Ready</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 z-10 relative">
                                <button
                                    onClick={toggleAudio}
                                    className={`p-1.5 rounded-full transition-colors ${audioEnabled ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/40' : 'bg-red-500/20 text-red-300 hover:bg-red-500/40'}`}
                                    title={audioEnabled ? "Mute Voice" : "Enable Voice"}
                                >
                                    {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={handleEndConversation}
                                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white"
                                    title="End Conversation & Start New"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white"
                                    title="View Past Conversations"
                                >
                                    <History className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* History Panel Overlay */}
                        <AnimatePresence>
                            {isHistoryOpen && (
                                <motion.div
                                    initial={{ x: '100%' }}
                                    animate={{ x: 0 }}
                                    exit={{ x: '100%' }}
                                    transition={{ type: "tween", duration: 0.3 }}
                                    className="absolute inset-0 z-20 bg-slate-900 border-l border-slate-700/50 flex flex-col pt-16"
                                >
                                    <div className="absolute top-0 w-full p-4 bg-slate-800 flex items-center justify-between border-b border-slate-700 z-30">
                                        <h3 className="text-white font-bold flex items-center gap-2">
                                            <History className="w-5 h-5" />
                                            Conversation History
                                        </h3>
                                        <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-white">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-2 mt-4">
                                        {savedSessions.length === 0 ? (
                                            <p className="text-slate-500 text-sm text-center mt-4">No past conversations</p>
                                        ) : (
                                            savedSessions.map(session => (
                                                <div
                                                    key={session.id}
                                                    onClick={() => loadSession(session)}
                                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between group ${session.id === sessionId ? 'bg-blue-600/20 border-blue-500/50' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
                                                >
                                                    <div className="overflow-hidden">
                                                        <p className="text-sm font-medium text-slate-200 truncate pr-2">{session.title}</p>
                                                        <p className="text-xs text-slate-500 mt-1">{new Date(session.date).toLocaleDateString()}</p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => deleteSession(e, session.id)}
                                                        className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="p-4 border-t border-slate-800 bg-slate-900 relative z-30">
                                        <button
                                            onClick={() => {
                                                handleClose();
                                                setIsHistoryOpen(false);
                                                setIsAdvisorOpen(true);
                                            }}
                                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-md"
                                        >
                                            Start New Chat
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-900/50 scrollbar-thin scrollbar-thumb-slate-700">
                            {messages.map((msg, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={i}
                                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-700 border border-slate-600'}`}>
                                        {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-blue-400" />}
                                    </div>
                                    <div className={`max-w-[75%] p-4 text-sm shadow-md leading-relaxed ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                                        : 'bg-slate-800 text-slate-200 rounded-2xl rounded-tl-sm border border-slate-700'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 flex-row">
                                    <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-slate-700 border border-slate-600">
                                        <Bot className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-sm border border-slate-700 flex gap-1.5 items-center shadow-md">
                                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></span>
                                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></span>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="p-4 bg-slate-900 border-t border-slate-800">
                            <div className="relative flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={toggleListening}
                                    className={`p-3 shrink-0 rounded-full transition-all shadow-md group ${isListening
                                        ? 'bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-500/20'
                                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                        }`}
                                    title={isListening ? "Stop listening" : "Start speaking"}
                                >
                                    {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5" />}
                                </button>

                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder={isListening ? "Listening..." : "Ask for recommendations, tips..."}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-full py-4 pl-6 pr-14 text-white text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-slate-500 shadow-inner"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        disabled={loading}
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || !input.trim()}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-md group"
                                    >
                                        <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Audio Permission Prompt */}
            <AnimatePresence>
                {showAudioPrompt && !isAdvisorOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="absolute bottom-40 right-4 w-72 bg-slate-900 border border-slate-700 p-5 rounded-2xl shadow-2xl z-50 backdrop-blur-xl"
                    >
                        <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                            <Volume2 className="w-5 h-5 text-blue-400" /> Enable Voice?
                        </h4>
                        <p className="text-sm text-slate-300 mb-5 leading-relaxed">
                            Would you like your AI Travel Guide to speak its responses aloud?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleAudioChoice(true)}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-blue-500/25"
                            >
                                Allow
                            </button>
                            <button
                                onClick={() => handleAudioChoice(false)}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-xl text-sm font-semibold transition-all"
                            >
                                Mute
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating 3D Button container with Welcome Cloud */}
            <div className="relative">
                {/* Welcome Cloud Message (only shows if chatbot is closed) */}
                <AnimatePresence>
                    {!isAdvisorOpen && showWelcomeCloud && !showAudioPrompt && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8, y: 5 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="absolute -top-16 right-0 bg-white text-slate-800 text-sm font-bold py-3 px-5 rounded-2xl shadow-xl whitespace-nowrap z-0 border border-slate-200 pointer-events-none"
                        >
                            <div className="flex items-center gap-2">
                                <Bot className="w-4 h-4 text-blue-500" />
                                Hey! I am your AI Travel Guide ✨
                            </div>
                            {/* Speech Bubble Arrow */}
                            <div className="absolute -bottom-2 right-12 w-4 h-4 bg-white transform rotate-45 border-r border-b border-slate-200"></div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    initial={{ x: '-100vw', y: '-50vh', opacity: 0, scale: 0.5, rotate: 20 }}
                    animate={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 40, damping: 15, delay: 0.2, duration: 2 }}
                    className="w-32 h-32 relative group cursor-pointer drop-shadow-2xl z-10"
                    onClick={handleAirplaneClick}
                >
                    {/* Glow Effect */}
                    <div className="absolute inset-2 bg-blue-500/20 rounded-full blur-xl group-hover:bg-blue-400/40 group-hover:blur-2xl transition-all duration-500"></div>

                    {/* 3D Canvas */}
                    <div className="absolute inset-0 z-10 pointer-events-none">
                        <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
                            <ambientLight intensity={0.6} />
                            <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
                            <pointLight position={[-10, -10, -5]} intensity={0.5} color="#3b82f6" />
                            <Environment preset="city" />
                            <Float speed={4} rotationIntensity={0.6} floatIntensity={1.5}>
                                <Aeroplane3D />
                            </Float>
                        </Canvas>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AirplaneChatbot;
