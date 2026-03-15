/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { auth, db } from './firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc,
  limit
} from 'firebase/firestore';
import { 
  Beaker, 
  FlaskConical, 
  History, 
  LogOut, 
  LogIn, 
  Users
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { ReactionResult, UserProfile, HistoryItem } from './types';

// Import Modules
import { LabModule } from './modules/Lab/LabModule';
import { HistoryModule } from './modules/History/HistoryModule';
import { TeacherModule } from './modules/Teacher/TeacherModule';

const GEMINI_MODEL = "gemini-3-flash-preview";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [chemicals, setChemicals] = useState('');
  const [result, setResult] = useState<ReactionResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [view, setView] = useState<'lab' | 'history' | 'teacher'>('lab');

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          const isAdminEmail = currentUser.email === 'phamngocsonsp@gmail.com';
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email || '',
            role: isAdminEmail ? 'teacher' : 'student',
            displayName: currentUser.displayName || ''
          };
          await setDoc(doc(db, 'users', currentUser.uid), newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Fetch History
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'history'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HistoryItem[];
      setHistory(items);
    });
    return unsubscribe;
  }, [user]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      console.log("🚀 Starting Login Process...");
      // 1. Fetch the Google Auth URL from our server
      const response = await fetch('/api/auth/google/url');
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("❌ Server returned non-JSON response:", text);
        throw new Error(`Server error: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get auth URL');
      }
      
      const { url } = data;
      console.log("🔗 Received Auth URL:", url);

      // 2. Open the Google Auth URL in a popup
      const authWindow = window.open(
        url,
        'google_oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        alert('Please allow popups for this site to sign in.');
      }
    } catch (error) {
      console.error("Login failed", error);
      alert(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Listen for success message from popup
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Validate origin
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('vercel.app')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const googleUser = event.data.user;
        
        // Since we are using Firebase for the DB, we should ideally link this Google user to Firebase.
        // For now, we'll simulate the user state and profile.
        // In a real production app, you'd use Firebase Admin to create a custom token.
        
        const simulatedUser = {
          uid: googleUser.sub,
          email: googleUser.email,
          displayName: googleUser.name,
          photoURL: googleUser.picture
        } as any;

        setUser(simulatedUser);
        
        // Handle profile
        const userDoc = await getDoc(doc(db, 'users', simulatedUser.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          const isAdminEmail = simulatedUser.email === 'phamngocsonsp@gmail.com';
          const newProfile: UserProfile = {
            uid: simulatedUser.uid,
            email: simulatedUser.email || '',
            role: isAdminEmail ? 'teacher' : 'student',
            displayName: simulatedUser.displayName || ''
          };
          await setDoc(doc(db, 'users', simulatedUser.uid), newProfile);
          setProfile(newProfile);
        }
        setLoading(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLogout = () => {
    setUser(null);
    setProfile(null);
    signOut(auth);
  };

  const simulateReaction = async () => {
    if (!chemicals.trim()) return;
    setIsSimulating(true);
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `Analyze these chemicals: ${chemicals}`,
        config: {
          systemInstruction: "You are 'ChemiMaster AI' - an intelligent chemistry simulation tool for K-12 students. Analyze chemicals, predict reactions, and return a JSON object. If no reaction, set reaction_occurred to false. Include danger level (1-5) and a quiz question.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reaction_occurred: { type: Type.BOOLEAN },
              equation: { type: Type.STRING },
              products: { type: Type.ARRAY, items: { type: Type.STRING } },
              visual_effects: {
                type: Type.OBJECT,
                properties: {
                  color_change: { type: Type.STRING, nullable: true },
                  gas_evolution: { type: Type.BOOLEAN },
                  precipitation: { type: Type.STRING, nullable: true },
                  temperature: { type: Type.STRING }
                },
                required: ["color_change", "gas_evolution", "precipitation", "temperature"]
              },
              educational_note: { type: Type.STRING },
              danger_level: { type: Type.NUMBER },
              quiz_question: { type: Type.STRING }
            },
            required: ["reaction_occurred", "equation", "products", "visual_effects", "educational_note", "danger_level", "quiz_question"]
          }
        },
      });

      const data = JSON.parse(response.text || '{}') as ReactionResult;
      setResult(data);

      if (user) {
        await addDoc(collection(db, 'history'), {
          studentUid: user.uid,
          studentEmail: user.email,
          chemicals,
          result: data,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Simulation failed", error);
    } finally {
      setIsSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center font-mono">
        <div className="animate-pulse flex flex-col items-center">
          <Beaker className="w-12 h-12 text-[#141414] mb-4" />
          <p className="text-sm uppercase tracking-widest">Initializing Lab...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border-2 border-[#141414] p-8 shadow-[8px_8px_0px_0px_#141414]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#141414] rounded-lg">
              <FlaskConical className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">ChemiMaster AI</h1>
              <p className="text-xs text-gray-500 uppercase tracking-widest">K-12 Virtual Lab</p>
            </div>
          </div>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Welcome to the future of chemistry education. Simulate reactions, learn mechanisms, and explore the molecular world safely.
          </p>
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 bg-[#141414] text-white py-4 rounded-lg font-medium hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans">
      <nav className="border-b border-[#141414] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('lab')}>
              <Beaker className="w-6 h-6" />
              <span className="font-bold tracking-tight">ChemiMaster</span>
            </div>
            <div className="hidden md:flex items-center gap-1">
              <NavButton active={view === 'lab'} onClick={() => setView('lab')} icon={<FlaskConical className="w-4 h-4" />} label="Virtual Lab" />
              <NavButton active={view === 'history'} onClick={() => setView('history')} icon={<History className="w-4 h-4" />} label="My History" />
              {profile?.role === 'teacher' && (
                <NavButton active={view === 'teacher'} onClick={() => setView('teacher')} icon={<Users className="w-4 h-4" />} label="Teacher Panel" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold uppercase tracking-tighter">{user.displayName}</p>
              <p className="text-[10px] text-gray-500 uppercase">{profile?.role}</p>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {view === 'lab' && (
            <LabModule 
              chemicals={chemicals}
              setChemicals={setChemicals}
              simulateReaction={simulateReaction}
              isSimulating={isSimulating}
              result={result}
            />
          )}

          {view === 'history' && (
            <HistoryModule 
              history={history}
              userUid={user.uid}
            />
          )}

          {view === 'teacher' && (
            <TeacherModule 
              history={history}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active ? 'bg-[#141414] text-white' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
