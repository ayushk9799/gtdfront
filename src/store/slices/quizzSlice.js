import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_BASE } from '../../../constants/Api';

// Thunk: load all quiz categories
export const fetchQuizzCategories = createAsyncThunk(
    'quizz/fetchQuizzCategories',
    async (userId, { rejectWithValue }) => {
        try {
            const url = userId
                ? `${API_BASE}/api/quizz/category?userId=${userId}`
                : `${API_BASE}/api/quizz/category`;
            const res = await fetch(url);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Failed to load quiz categories (${res.status})`);
            }
            const data = await res.json();
            return data.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Thunk: load quizzes by category (first page)
export const fetchQuizzesByCategory = createAsyncThunk(
    'quizz/fetchQuizzesByCategory',
    async ({ categoryId, userId, excludeAttempted }, { rejectWithValue }) => {
        try {
            let url = categoryId
                ? `${API_BASE}/api/quizz?category=${categoryId}&page=1&limit=10`
                : `${API_BASE}/api/quizz?page=1&limit=10`;

            if (userId) url += `&userId=${userId}`;
            if (excludeAttempted) url += `&excludeAttempted=true`;

            const res = await fetch(url);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Failed to load quizzes (${res.status})`);
            }
            const data = await res.json();
            return { quizzes: data.data, hasMore: data.hasMore, page: 1, categoryId, excludeAttempted };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Thunk: submit quiz attempt
export const submitQuizzAttempt = createAsyncThunk(
    'quizz/submitQuizzAttempt',
    async ({ userId, quizzId, selectedOption, isCorrect }, { rejectWithValue }) => {
        try {
            const res = await fetch(`${API_BASE}/api/quizz/attempt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, quizzId, selectedOption, isCorrect }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to submit quiz attempt');
            }
            const data = await res.json();
            return data.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Thunk: load more quizzes (next page)
export const fetchMoreQuizzes = createAsyncThunk(
    'quizz/fetchMoreQuizzes',
    async (userId, { getState, rejectWithValue }) => {
        try {
            const { selectedCategoryId, page, hasMore, excludeAttempted } = getState().quizz;
            if (!hasMore) {
                return { quizzes: [], hasMore: false, page };
            }
            const nextPage = page + 1;
            let url = selectedCategoryId
                ? `${API_BASE}/api/quizz?category=${selectedCategoryId}&page=${nextPage}&limit=10`
                : `${API_BASE}/api/quizz?page=${nextPage}&limit=10`;

            if (userId) url += `&userId=${userId}`;
            if (excludeAttempted) url += `&excludeAttempted=true`;

            const res = await fetch(url);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Failed to load more quizzes (${res.status})`);
            }
            const data = await res.json();
            return { quizzes: data.data, hasMore: data.hasMore, page: nextPage };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    },
    {
        condition: (_, { getState }) => {
            const { hasMore, isFetchingMore } = getState().quizz;
            if (!hasMore || isFetchingMore) return false;
        }
    }
);

const initialState = {
    quizzes: [],
    categories: [],
    selectedCategoryId: null,
    currentQuizIndex: 0,
    page: 1,
    hasMore: false,
    isFetchingMore: false,
    excludeAttempted: false,
    status: 'idle', // 'idle', 'loading', 'succeeded', 'failed'
    categoriesStatus: 'idle',
    error: null,
};

const quizzSlice = createSlice({
    name: 'quizz',
    initialState,
    reducers: {
        nextQuiz(state) {
            if (state.currentQuizIndex < state.quizzes.length - 1) {
                state.currentQuizIndex += 1;
            }
        },
        previousQuiz(state) {
            if (state.currentQuizIndex > 0) {
                state.currentQuizIndex -= 1;
            }
        },
        resetQuizState(state) {
            state.quizzes = [];
            state.selectedCategoryId = null;
            state.currentQuizIndex = 0;
            state.page = 1;
            state.hasMore = false;
            state.status = 'idle';
            state.error = null;
        },
        setCurrentQuizIndex(state, action) {
            state.currentQuizIndex = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchQuizzCategories.pending, (state) => {
                state.categoriesStatus = 'loading';
            })
            .addCase(fetchQuizzCategories.fulfilled, (state, action) => {
                state.categoriesStatus = 'succeeded';
                state.categories = action.payload;
            })
            .addCase(fetchQuizzCategories.rejected, (state, action) => {
                state.categoriesStatus = 'failed';
                state.error = action.payload;
            })
            .addCase(fetchQuizzesByCategory.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchQuizzesByCategory.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.quizzes = action.payload.quizzes;
                state.hasMore = action.payload.hasMore;
                state.page = action.payload.page;
                state.selectedCategoryId = action.payload.categoryId;
                state.excludeAttempted = action.payload.excludeAttempted;
                state.currentQuizIndex = 0;
                state.error = null;
            })
            .addCase(fetchQuizzesByCategory.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            })
            .addCase(fetchMoreQuizzes.pending, (state) => {
                state.isFetchingMore = true;
            })
            .addCase(fetchMoreQuizzes.fulfilled, (state, action) => {
                state.isFetchingMore = false;
                state.quizzes = [...state.quizzes, ...action.payload.quizzes];
                state.hasMore = action.payload.hasMore;
                state.page = action.payload.page;
            })
            .addCase(fetchMoreQuizzes.rejected, (state, action) => {
                state.isFetchingMore = false;
                state.error = action.payload || action.error.message;
            });
    },
});

export const { nextQuiz, previousQuiz, resetQuizState, setCurrentQuizIndex } = quizzSlice.actions;

// Selectors
export const selectAllQuizzes = (state) => state.quizz.quizzes;
export const selectCurrentQuiz = (state) => state.quizz.quizzes[state.quizz.currentQuizIndex];
export const selectQuizzStatus = (state) => state.quizz.status;
export const selectQuizzError = (state) => state.quizz.error;
export const selectQuizzCategories = (state) => state.quizz.categories;
export const selectQuizzCategoriesStatus = (state) => state.quizz.categoriesStatus;
export const selectQuizzHasMore = (state) => state.quizz.hasMore;
export const selectQuizzIsFetchingMore = (state) => state.quizz.isFetchingMore;

export default quizzSlice.reducer;
