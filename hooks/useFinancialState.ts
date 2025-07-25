import { useState, useEffect, useRef } from 'react';
import type firebase from 'firebase/compat/app';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { FinancialState } from '../types';
import { INITIAL_FINANCIAL_STATE, BLANK_FINANCIAL_STATE } from '../constants';

const DEBOUNCE_DELAY = 1500; // 1.5 seconds

interface UseFinancialStateReturn {
    financialState: FinancialState | null;
    setFinancialState: React.Dispatch<React.SetStateAction<FinancialState | null>>;
    isLoading: boolean;
}

export const useFinancialState = (user: firebase.User | null): UseFinancialStateReturn => {
  const [financialState, setFinancialState] = useState<FinancialState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimerRef = useRef<number | null>(null);

  // Effect to load data from Firestore
  useEffect(() => {
    setIsLoading(true);

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
        // Fallback to a blank state on error to prevent app crash
        setFinancialState(BLANK_FINANCIAL_STATE);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
        fetchOrCreateUserDoc(user);
    } else {
        // This case should ideally not be hit if auth flow is correct,
        // as AuthenticatedApp should only render with a user object.
        setFinancialState(null);
        setIsLoading(false);
    }

  }, [user]);

  // Effect to save data to Firestore with debounce
  useEffect(() => {
    if (!financialState || isLoading || !user) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(async () => {
        try {
            console.log("Autosaving to Firestore...");
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, financialState);
        } catch (error) {
            console.error("Failed to save state to Firestore", error);
        }
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [financialState, user, isLoading]);

  return { financialState, setFinancialState, isLoading };
};