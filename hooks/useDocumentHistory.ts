
import { useState, useCallback, useRef } from 'react';
import { ExtractedData } from '../types';
import { checkRegression, RegressionReport } from '../utils/regressionCheck';

interface HistoryState {
    past: ExtractedData[];
    present: ExtractedData;
    future: ExtractedData[];
}

export const useDocumentHistory = (initialData: ExtractedData) => {
    // The "Version Ledger" (Segment 5.5)
    const [state, setState] = useState<HistoryState>({
        past: [],
        present: initialData,
        future: []
    });

    const [regressionAlert, setRegressionAlert] = useState<RegressionReport | null>(null);
    const baselineRef = useRef<ExtractedData>(initialData); // The "Stable Baseline Registry" (Segment 5.3)

    const canUndo = state.past.length > 0;
    const canRedo = state.future.length > 0;

    const update = useCallback((newData: ExtractedData) => {
        // Enforce Non-Regression Check before committing to Ledger
        const regression = checkRegression(state.present, newData);
        
        if (regression.severity !== 'none') {
            setRegressionAlert(regression);
            // We still allow the update, but the UI will flag it as a violation
            // In a strict autonomous system, we might reject it, but here we keep Human-in-the-loop
        } else {
            setRegressionAlert(null);
        }

        setState(currentState => ({
            past: [...currentState.past, currentState.present],
            present: newData,
            future: []
        }));
    }, [state.present]);

    const undo = useCallback(() => {
        setState(currentState => {
            if (currentState.past.length === 0) return currentState;

            const previous = currentState.past[currentState.past.length - 1];
            const newPast = currentState.past.slice(0, -1);

            // Re-eval regression on rollback (usually clears it)
            setRegressionAlert(null);

            return {
                past: newPast,
                present: previous,
                future: [currentState.present, ...currentState.future]
            };
        });
    }, []);

    const redo = useCallback(() => {
        setState(currentState => {
            if (currentState.future.length === 0) return currentState;

            const next = currentState.future[0];
            const newFuture = currentState.future.slice(1);

            // Re-eval regression on redo
            const regression = checkRegression(currentState.present, next);
            if (regression.severity !== 'none') setRegressionAlert(regression);

            return {
                past: [...currentState.past, currentState.present],
                present: next,
                future: newFuture
            };
        });
    }, []);

    const restoreBaseline = useCallback(() => {
        // Segment 5.5: "restore the last known stable version"
        setRegressionAlert(null);
        setState(currentState => ({
            past: [...currentState.past, currentState.present],
            present: baselineRef.current,
            future: []
        }));
    }, []);

    return {
        current: state.present,
        historyDepth: state.past.length,
        undo,
        redo,
        canUndo,
        canRedo,
        update,
        restoreBaseline,
        regressionAlert
    };
};
