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
            return { quizzes: data.data, hasMore: data.hasMore, total: data.total, page: 1, categoryId, excludeAttempted };
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

// Thunk: load solved quizzes (only attempted)
export const fetchSolvedQuizzes = createAsyncThunk(
    'quizz/fetchSolvedQuizzes',
    async ({ categoryId, userId }, { rejectWithValue }) => {
        try {
            // Fetch most recent 10 solved quizzes
            let url = categoryId
                ? `${API_BASE}/api/quizz?category=${categoryId}&page=1&limit=10&onlyAttempted=true`
                : `${API_BASE}/api/quizz?page=1&limit=10&onlyAttempted=true`;

            if (userId) url += `&userId=${userId}`;

            const res = await fetch(url);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Failed to load solved quizzes (${res.status})`);
            }
            const data = await res.json();
            // Data is sorted by most recent first. To show in order (1...15), we should reverse it
            // if we want to show it as [older...newer]. 
            // BUT user said "load last 10 solved cases... and show 14 number case when i move backward all case are shown"
            // If there are 15 cases, "last 10" are 6-15. 
            // In chronological order: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
            // We want to land on 15.
            const reversedQuizzes = [...data.data].reverse();
            return { quizzes: reversedQuizzes, hasMore: data.hasMore, total: data.total, page: 1 };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Thunk: load MORE older solved quizzes
export const fetchMoreSolvedQuizzes = createAsyncThunk(
    'quizz/fetchMoreSolvedQuizzes',
    async ({ categoryId, userId }, { getState, rejectWithValue }) => {
        try {
            const { solvedPage, solvedHasMore } = getState().quizz;
            if (!solvedHasMore) return rejectWithValue('No more solved quizzes');

            const nextPage = solvedPage + 1;
            let url = categoryId
                ? `${API_BASE}/api/quizz?category=${categoryId}&page=${nextPage}&limit=10&onlyAttempted=true`
                : `${API_BASE}/api/quizz?page=${nextPage}&limit=10&onlyAttempted=true`;

            if (userId) url += `&userId=${userId}`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to load more solved quizzes');
            const data = await res.json();

            // Reverse so they are in chronological order
            const reversedQuizzes = [...data.data].reverse();
            return { quizzes: reversedQuizzes, hasMore: data.hasMore, page: nextPage };
        } catch (error) {
            return rejectWithValue(error.message);
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
    totalCount: 0,
    status: 'idle', // 'idle', 'loading', 'succeeded', 'failed'
    categoriesStatus: 'idle',
    error: null,
    // Solved quizzes state
    solvedQuizzes: [],
    solvedStatus: 'idle',
    solvedPage: 1,
    solvedHasMore: false,
    solvedTotal: 0,
    isFetchingMoreSolved: false,
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
            // Reset solved state
            state.solvedQuizzes = [];
            state.solvedStatus = 'idle';
            state.solvedPage = 1;
            state.solvedHasMore = false;
            state.solvedTotal = 0;
            state.isFetchingMoreSolved = false;
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
                state.totalCount = action.payload.total || 0;
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
            })
            // Solved quizzes
            .addCase(fetchSolvedQuizzes.pending, (state) => {
                state.solvedStatus = 'loading';
            })
            .addCase(fetchSolvedQuizzes.fulfilled, (state, action) => {
                state.solvedStatus = 'succeeded';
                state.solvedQuizzes = action.payload.quizzes;
                state.solvedHasMore = action.payload.hasMore;
                state.solvedTotal = action.payload.total || 0;
                state.solvedPage = 1;
            })
            .addCase(fetchSolvedQuizzes.rejected, (state, action) => {
                state.solvedStatus = 'failed';
                state.error = action.payload || action.error.message;
            })
            // Fetch more older solved quizzes (PREPEND)
            .addCase(fetchMoreSolvedQuizzes.pending, (state) => {
                state.isFetchingMoreSolved = true;
            })
            .addCase(fetchMoreSolvedQuizzes.fulfilled, (state, action) => {
                state.isFetchingMoreSolved = false;
                // Prepend older items, and filter out any accidental duplicates
                const newQuizzes = action.payload.quizzes.filter(
                    nq => !state.solvedQuizzes.some(sq => sq._id === nq._id)
                );
                state.solvedQuizzes = [...newQuizzes, ...state.solvedQuizzes];
                state.solvedHasMore = action.payload.hasMore;
                state.solvedPage = action.payload.page;
            })
            .addCase(fetchMoreSolvedQuizzes.rejected, (state, action) => {
                state.isFetchingMoreSolved = false;
            })
            // Submit attempt - update in place to prevent page disappearing
            .addCase(submitQuizzAttempt.fulfilled, (state, action) => {
                const attempt = action.payload;
                const quizId = attempt.quizzId;

                // Update in unsolved if present
                const quiz = state.quizzes.find(q => q._id === quizId);
                if (quiz) {
                    quiz.attempt = attempt;
                }

                // Update in solved if present
                const solvedQuiz = state.solvedQuizzes.find(q => q._id === quizId);
                if (solvedQuiz) {
                    solvedQuiz.attempt = attempt;
                }
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
export const selectSolvedQuizzes = (state) => state.quizz.solvedQuizzes;
export const selectSolvedQuizzesStatus = (state) => state.quizz.solvedStatus;
export const selectSolvedQuizzesTotal = (state) => state.quizz.solvedTotal;
export const selectIsFetchingMoreSolved = (state) => state.quizz.isFetchingMoreSolved;
export const selectSolvedHasMore = (state) => state.quizz.solvedHasMore;

export default quizzSlice.reducer;
