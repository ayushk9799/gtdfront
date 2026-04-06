import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_BASE } from '../../../constants/Api';
import { computeGameplayScoreNormalized } from '../../services/scoring';

// Thunk: load case data by ObjectId and store as current case
export const loadCaseById = createAsyncThunk(
  'currentGame/loadCaseById',
  async (caseId) => {
    const res = await fetch(`${API_BASE}/api/cases/${caseId}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Failed to load case (${res.status})`);
    }
    const data = await res.json();
    const caseDoc = data?.case;
    // Embed MongoDB _id into caseData so it travels through navigation params
    const caseDataWithId = caseDoc?.caseData ? { ...caseDoc.caseData, _id: caseDoc._id } : null;
    return { caseId: caseDoc?._id, caseData: caseDataWithId, voiceId: caseDoc?.voiceId, sourceType: 'case' };
  }
);

const initialState = {
  userId: null,
  // Source type: 'case' or 'dailyChallenge'
  sourceType: 'case',
  caseId: null,
  dailyChallengeId: null,
  caseData: null,
  voiceId: null,
  audioPaused: false,
  isBackdatePlay: false, // For premium users playing past challenges (no points counted)
  isReattempt: false, // For premium users replaying a completed case
  gameplay: null, // Full gameplay data from server
  selectedTestIds: [],
  selectedDiagnosisId: null,
  selectedTreatmentIds: [],
  status: 'idle',
  error: null,
};

const currentGameSlice = createSlice({
  name: 'currentGame',
  initialState,
  reducers: {
    setUserId(state, action) {
      state.userId = action.payload || null;
    },
    setIsReattempt(state, action) {
      state.isReattempt = !!action.payload;
    },
    // Set already fetched gameplay from server
    setGameplay(state, action) {
      state.gameplay = action.payload || null;
    },
    // setCaseData now supports both case and dailyChallenge
    // For case: { caseId, caseData, sourceType: 'case', voiceId?: string }
    // For dailyChallenge: { dailyChallengeId, caseData, sourceType: 'dailyChallenge', isBackdatePlay?: boolean }
    setCaseData(state, action) {
      const { caseId, dailyChallengeId, caseData, sourceType, voiceId, isBackdatePlay } = action.payload || {};

      // Determine source type
      const effectiveSourceType = sourceType || (dailyChallengeId ? 'dailyChallenge' : 'case');
      state.sourceType = effectiveSourceType;

      if (effectiveSourceType === 'dailyChallenge') {
        state.dailyChallengeId = dailyChallengeId || null;
        state.caseId = null;
        state.voiceId = null; // Daily challenges don't have voiceId
        state.isBackdatePlay = isBackdatePlay === true; // Track backdate plays for premium users
        state.isReattempt = false;
        state.gameplay = null; // New load clears old gameplay
      } else {
        state.caseId = caseId || null;
        state.dailyChallengeId = null;
        state.voiceId = voiceId || null; // Set voiceId if provided
        state.isBackdatePlay = false; // Cases are never backdate plays
        state.isReattempt = false;
        state.gameplay = null; // New load clears old gameplay
      }

      state.caseData = caseData || null;
      state.status = 'in_progress';
      state.audioPaused = false; // Reset audio pause state for new case

      // IMPORTANT: Clear previous selections when loading a new case
      state.selectedTestIds = [];
      state.selectedDiagnosisId = null;
      state.selectedTreatmentIds = [];
    },
    setSelectedTests(state, action) {
      state.selectedTestIds = Array.isArray(action.payload) ? action.payload : [];
    },
    setSelectedDiagnosis(state, action) {
      state.selectedDiagnosisId = action.payload || null;
    },
    setSelectedTreatments(state, action) {
      state.selectedTreatmentIds = Array.isArray(action.payload) ? action.payload : [];
    },
    setAudioPaused(state, action) {
      state.audioPaused = action.payload !== undefined ? action.payload : false;
    },
    clearCurrentGame(state) {
      state.sourceType = 'case';
      state.caseId = null;
      state.dailyChallengeId = null;
      state.caseData = null;
      state.voiceId = null;
      state.audioPaused = false;
      state.isBackdatePlay = false;
      state.isReattempt = false;
      state.gameplay = null;
      state.selectedTestIds = [];
      state.selectedDiagnosisId = null;
      state.selectedTreatmentIds = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCaseById.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadCaseById.fulfilled, (state, action) => {
        state.status = 'in_progress';
        state.sourceType = action.payload.sourceType || 'case';
        state.caseId = action.payload.caseId || null;
        state.dailyChallengeId = null;
        state.caseData = action.payload.caseData || null;
        state.voiceId = action.payload.voiceId || null;
        state.audioPaused = false; // Reset audio pause state for new case
        state.isReattempt = false; // Default for new case load
        state.gameplay = null; // New case load clears current gameplay

        // IMPORTANT: Clear previous selections when loading a new case
        state.selectedTestIds = [];
        state.selectedDiagnosisId = null;
        state.selectedTreatmentIds = [];
      })
      .addCase(loadCaseById.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.error?.message || 'Failed to load case';
      })
      .addCase(submitGameplay.fulfilled, (state, action) => {
        // Store gameplay object after successful submission
        state.gameplay = action.payload.gameplay || null;
      });
  }
});

// Submit gameplay thunk: maps selected IDs to indices and sends to backend submit endpoint
// Supports both Case and DailyChallenge gameplays
export const submitGameplay = createAsyncThunk(
  'currentGame/submitGameplay',
  async (_, { getState }) => {
    const state = getState();
    const {
      userId,
      sourceType,
      caseId,
      dailyChallengeId,
      caseData,
      isBackdatePlay,
      isReattempt,
      selectedTestIds,
      selectedDiagnosisId,
      selectedTreatmentIds
    } = state.currentGame;

    // Resolve caseId: prefer store value, fall back to _id embedded in caseData
    const effectiveCaseId = caseId || caseData?._id || null;
    const effectiveDailyChallengeId = dailyChallengeId;

    // Validate based on source type
    if (!userId) throw new Error('Missing userId');
    if (sourceType === 'case' && !effectiveCaseId) throw new Error('Missing caseId');
    if (sourceType === 'dailyChallenge' && !effectiveDailyChallengeId) throw new Error('Missing dailyChallengeId');
    if (!caseData) throw new Error('Missing case data');

    // Map tests to indices
    const tests = caseData?.steps?.[1]?.data?.availableTests || [];
    const testIndexMap = new Map(tests.map((t, i) => [t.testId, i]));
    const testIndices = (selectedTestIds || [])
      .map((id) => testIndexMap.get(id))
      .filter((i) => typeof i === 'number');

    // Map diagnosis to index
    const diags = caseData?.steps?.[2]?.data?.diagnosisOptions || [];
    const diagIndexMap = new Map(diags.map((d, i) => [d.diagnosisId, i]));
    const diagnosisIndex = selectedDiagnosisId != null ? diagIndexMap.get(selectedDiagnosisId) : null;

    // Map treatments to indices
    const step4 = caseData?.steps?.[3]?.data || {};
    const medications = step4?.treatmentOptions?.medications || [];
    const surgicalInterventional = step4?.treatmentOptions?.surgicalInterventional || [];
    const nonSurgical = step4?.treatmentOptions?.nonSurgical || [];
    const psychiatric = step4?.treatmentOptions?.psychiatric || [];
    const flatTreatments = [
      ...medications,
      ...surgicalInterventional,
      ...nonSurgical,
      ...psychiatric,
    ];
    const treatIndexMap = new Map(flatTreatments.map((t, i) => [t.treatmentId, i]));
    const treatmentIndices = (selectedTreatmentIds || [])
      .map((id) => treatIndexMap.get(id))
      .filter((i) => typeof i === 'number');

    // Compute normalized points (30/40/30)
    const normalized = computeGameplayScoreNormalized(caseData, {
      selectedTestIds,
      selectedDiagnosisId,
      selectedTreatmentIds,
    });

    // Build request body based on source type
    const requestBody = {
      userId,
      sourceType,
      diagnosisIndex,
      testIndices,
      treatmentIndices,
      points: {
        total: normalized.total,
        tests: normalized.tests,
        diagnosis: normalized.diagnosis,
        treatment: normalized.treatment,
      },
      complete: true,
    };

    // Add the appropriate ID based on source type
    if (sourceType === 'dailyChallenge') {
      requestBody.dailyChallengeId = effectiveDailyChallengeId;
      // For backdate plays (premium practice mode), include the flag
      if (isBackdatePlay) {
        requestBody.isBackdatePlay = true;
      }
    } else {
      requestBody.caseId = effectiveCaseId;
    }

    const res = await fetch(`${API_BASE}/api/gameplays/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Failed to submit gameplay (${res.status})`);
    }
    const data = await res.json();
    return {
      gameplay: data?.gameplay || null,
      updatedUser: data?.updatedUser || null,
      sourceType, // Return sourceType to help other slices determine if they need to update
      isReattempt // Pass flag to fulfilled handlers
    };
  }
);

export const { setUserId, setIsReattempt, setGameplay, setCaseData, clearCurrentGame, setSelectedTests, setSelectedDiagnosis, setSelectedTreatments, setAudioPaused } = currentGameSlice.actions;
export default currentGameSlice.reducer;
