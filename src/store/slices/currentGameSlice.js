import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_BASE } from '../../../constants/Api';

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
    return { caseId: caseDoc?._id, caseData: caseDoc?.caseData };
  }
);

// Thunk: ensure gameplay exists for current user+case, return gameplayId
export const ensureGameplay = createAsyncThunk(
  'currentGame/ensureGameplay',
  async (_, { getState }) => {
    const state = getState();
    const userId = state.currentGame.userId;
    const caseId = state.currentGame.caseId;
    if (!userId || !caseId) throw new Error('userId and caseId required');
    const res = await fetch(`${API_BASE}/api/gameplays`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, caseId })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Failed to ensure gameplay (${res.status})`);
    }
    const data = await res.json();
    return data?.gameplay?._id;
  }
);

const initialState = {
  userId: null,
  caseId: null,
  caseData: null,
  gameplayId: null,
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
    setSelectedTests(state, action) {
      state.selectedTestIds = Array.isArray(action.payload) ? action.payload : [];
    },
    setSelectedDiagnosis(state, action) {
      state.selectedDiagnosisId = action.payload || null;
    },
    setSelectedTreatments(state, action) {
      state.selectedTreatmentIds = Array.isArray(action.payload) ? action.payload : [];
    },
    clearCurrentGame(state) {
      state.caseId = null;
      state.caseData = null;
      state.gameplayId = null;
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
        state.caseId = action.payload.caseId || null;
        state.caseData = action.payload.caseData || null;
      })
      .addCase(loadCaseById.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.error?.message || 'Failed to load case';
      })
      .addCase(ensureGameplay.fulfilled, (state, action) => {
        state.gameplayId = action.payload || null;
      })
      .addCase(ensureGameplay.rejected, (state, action) => {
        state.error = action.error?.message || 'Failed to ensure gameplay';
      });
  }
});

// Submit gameplay thunk: maps selected IDs to indices and sends to backend submit endpoint
export const submitGameplay = createAsyncThunk(
  'currentGame/submitGameplay',
  async (_, { getState, dispatch }) => {
    const state = getState();
    const { caseData, gameplayId, selectedTestIds, selectedDiagnosisId, selectedTreatmentIds } = state.currentGame;
    let gid = gameplayId;
    if (!gid) {
      const ensure = await dispatch(ensureGameplay());
      if (ensureGameplay.fulfilled.match(ensure)) gid = ensure.payload;
    }
    if (!gid || !caseData) throw new Error('Missing gameplay or case data');

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

    const res = await fetch(`${API_BASE}/api/gameplays/${gid}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diagnosisIndex, testIndices, treatmentIndices, complete: true })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Failed to submit gameplay (${res.status})`);
    }
    const data = await res.json();
    return data?.gameplay?._id;
  }
);

export const { setUserId, clearCurrentGame, setSelectedTests, setSelectedDiagnosis, setSelectedTreatments } = currentGameSlice.actions;
export default currentGameSlice.reducer;


