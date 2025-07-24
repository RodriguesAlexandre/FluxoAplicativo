import { useState, useEffect, useRef } from 'react';
import type firebase from 'firebase/compat/app';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { FinancialState } from '../types';
import { INITIAL_FINANCIAL_STATE, BLANK_FINANCIAL_STATE } from '../constants';

const DEBOUNCE_DELAY = 1500; // 1.5 seconds
const GUEST_STORAGE_KEY = 'fluxo-guest-financial-state';

interface UseFinancialStateReturn {
    financialState: FinancialState | null;
    setFinancialState: React.Dispatch<React.SetStateAction<FinancialState | null>>;
    isLoading: boolean;
}

export const useFinancialState = (user: firebase.User | null, isGuest: boolean): UseFinancialStateReturn => {
  const [financialState, setFinancialState] = useState<FinancialState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimerRef = useRef<number | null>(null);

  // Effect to load data from Firestore or localStorage
  useEffect(() => {
    setIsLoading(true);

    const loadGuestData = () => {
        try {
            const savedState = localStorage.getItem(GUEST_STORAGE_KEY);
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                // Ensure hasSeenWelcomeGuide exists
                if (typeof parsedState.hasSeenWelcomeGuide === 'undefined') {
                    parsedState.hasSeenWelcomeGuide = false;
                }
                setFinancialState(parsedState);
            } else {
                setFinancialState(INITIAL_FINANCIAL_STATE);
            }
        } catch (error) {
            console.error("Error loading guest data from localStorage:", error);
            setFinancialState(INITIAL_FINANCIAL_STATE); // Fallback to initial state
        } finally {
            setIsLoading(false);
        }
    };

    const fetchOrCreateUserDoc = async (firebaseUser: firebase.User) => {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setFinancialState(docSnap.data() as FinancialState);
        } else {
          console.log("New user detected, creating document...");
          // For a new user, start with a blank slate but ensure the welcome guide is shown.
          const newUserState = { ...BLANK_FINANCIAL_STATE, hasSeenWelcomeGuide: false };
          await setDoc(userDocRef, newUserState);
          setFinancialState(newUserState);
        }
      } catch (error) {
        console.error("Error fetching/creating user document:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isGuest) {
        loadGuestData();
    } else if (user) {
        fetchOrCreateUserDoc(user);
    } else {
        setFinancialState(null);
        setIsLoading(false);
    }

  }, [user, isGuest]);

  // Effect to save data to Firestore or localStorage with debounce
  useEffect(() => {
    if (!financialState || isLoading) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(async () => {
        if (isGuest) {
             try {
                console.log("Autosaving to localStorage...");
                localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(financialState));
             } catch (error) {
                console.error("Failed to save state to localStorage", error);
             }
        } else if (user) {
            try {
                console.log("Autosaving to Firestore...");
                const userDocRef = doc(db, 'users', user.uid);
                // Removed { merge: true } to ensure a complete overwrite, which is
                // crucial for the reset functionality to work correctly.
                await setDoc(userDocRef, financialState);
            } catch (error) {
                console.error("Failed to save state to Firestore", error);
            }
        }
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [financialState, user, isGuest, isLoading]);

  return { financialState, setFinancialState, isLoading };
};