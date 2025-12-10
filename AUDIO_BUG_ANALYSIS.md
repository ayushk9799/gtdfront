# Audio Bug Analysis: Dual Audio Playback Issue

## Problem Description
When navigating from `SelectTests.jsx` back to `HomeScreen.jsx`, then selecting a new case, and opening `ClinicalInfo.jsx`, **two audios play simultaneously**:
1. Basic Info audio (index 0) - expected
2. Physical Examination audio (index 3) - unexpected

## Root Cause Analysis

### The Issue
The `index` state in `ClinicalInfo.jsx` is **NOT reset when `caseId` changes**. This creates a race condition where:

1. **Previous State Persistence**: 
   - User was on slide 3 (Physical Exam) in the previous case
   - `index` state remains at `3` when navigating to a new case

2. **Effect Trigger Sequence**:
   - When `caseId` changes, the `useEffect` at line 378-407 runs
   - At this point, `index` is still `3` (from previous case)
   - Effect sets timer to play audio for index 3 (Physical Exam) - **First audio starts**
   - Timer scheduled: `playForIndex(3)` after 200ms

3. **PagerView Initialization**:
   - `PagerView` has `initialPage={0}` (line 435)
   - During initialization, `onPageSelected` fires with `position: 0` (line 436-438)
   - This calls `setIndex(0)`, updating state to 0

4. **Second Effect Trigger**:
   - `index` changes from `3` to `0`
   - `useEffect` runs again (because `index` is in dependency array)
   - Effect sets another timer to play audio for index 0 (Basic Info) - **Second audio starts**
   - Timer scheduled: `playForIndex(0)` after 200ms

5. **Result**: Both timers fire, playing both audios simultaneously

### Code Evidence

**Line 121**: `index` state initialized to 0, but never reset on case change
```javascript
const [index, setIndex] = useState(0);
```

**Line 152**: `caseId` derived from caseData
```javascript
const caseId = (caseData?.caseId && String(caseData.caseId)) || '';
```

**Line 378-407**: Effect that triggers audio playback
```javascript
React.useEffect(() => {
  // ... cleanup ...
  stopPlayback();
  
  if (!caseId || userPausedAudioRef.current) {
    return undefined;
  }

  audioTimerRef.current = setTimeout(() => {
    if (!userPausedAudioRef.current) {
      playForIndex(index);  // Uses current index value
    }
  }, 200);
  // ...
}, [index, caseId, playForIndex, stopPlayback]);  // Both index and caseId in deps
```

**Line 435-438**: PagerView that may fire events during init
```javascript
<PagerView
  ref={pagerRef}
  style={styles.pagerView}
  initialPage={0}
  onPageSelected={(e) => {
    setIndex(e.nativeEvent.position);  // May fire during initialization
  }}
>
```

### Missing Reset Logic
There is **NO useEffect** that resets `index` to 0 when `caseId` changes. The component only resets hero image state (line 179-182) but not the slide index.

## Theoretical Scenarios

### Scenario 1: Component Remounts
- Component unmounts when navigating away
- New instance mounts with new caseId
- `index` starts at 0 (initial state)
- But PagerView might fire multiple `onPageSelected` events during initialization
- If it fires for page 3 first (stale event), then page 0, both audios play

### Scenario 2: Component Stays Mounted (Navigation Stack)
- Component stays in navigation stack
- `caseId` changes but `index` remains at previous value (e.g., 3)
- Effect runs with `index=3`, schedules physical exam audio
- PagerView resets to page 0, fires `onPageSelected(0)`
- Effect runs again with `index=0`, schedules basic info audio
- Both play simultaneously

### Scenario 3: Race Condition in Timer Cleanup
- Previous case's timer might not be fully cleaned up
- New case's timer starts
- Both timers execute, playing different audios

## Solution Recommendations

1. **Reset index when caseId changes**:
```javascript
useEffect(() => {
  if (caseId) {
    setIndex(0);
    pagerRef.current?.setPage(0);
  }
}, [caseId]);
```

2. **Add caseId check in audio playback**:
```javascript
const playForIndex = useCallback((i) => {
  if (!caseId) return;
  // Add guard: only play if index matches current case's expected range
  if (i < 0 || i >= SLIDE_COUNT) return;
  // ... rest of logic
}, [caseId, stopPlayback]);
```

3. **Clear all timers and stop playback when caseId changes**:
```javascript
useEffect(() => {
  // Stop all audio when case changes
  if (audioTimerRef.current) {
    clearTimeout(audioTimerRef.current);
    audioTimerRef.current = null;
  }
  stopPlayback();
  setIndex(0);
  userPausedAudioRef.current = false;
}, [caseId, stopPlayback]);
```

4. **Debounce or guard PagerView onPageSelected**:
```javascript
const handlePageSelected = useCallback((e) => {
  const newIndex = e.nativeEvent.position;
  // Only update if different and caseId is valid
  if (newIndex !== index && caseId) {
    setIndex(newIndex);
  }
}, [index, caseId]);
```





