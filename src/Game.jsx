import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StatusBar,
  Modal, // Add this
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';
import { API_BASE } from '../constants/Api';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import Ionicons from 'react-native-vector-icons/Ionicons';

const TestResultTable = ({ testResults }) => {
  const [colWidths, setColWidths] = useState([0, 0, 0, 0]); // Test, Result, Range, Unit
  const [totalWidth, setTotalWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const recordWidth = (idx, width) => {
    setColWidths(prev => {
      if (width <= prev[idx]) return prev;
      const next = [...prev];
      next[idx] = width;
      // Calculate total width of all columns
      const total = next.reduce((sum, w) => sum + (w || 0), 0);
      setTotalWidth(total);
      return next;
    });
  };
  const isAbnormalResult = (result, normalRange) => {
    // Same as web
    if (!result || !normalRange || normalRange === 'Varies') {
      return false;
    }
    const resultValue = parseFloat(result.replace(/,/g, ''));
    if (isNaN(resultValue)) {
      return false;
    }
    const rangeStr = normalRange.trim();
    if (rangeStr.startsWith('>')) {
      const minValue = parseFloat(rangeStr.substring(1));
      return !isNaN(minValue) && resultValue <= minValue;
    }
    if (rangeStr.startsWith('<')) {
      const maxValue = parseFloat(rangeStr.substring(1));
      return !isNaN(maxValue) && resultValue >= maxValue;
    }
    const rangeParts = rangeStr.split('-');
    if (rangeParts.length === 2) {
      const minValue = parseFloat(rangeParts[0].replace(/,/g, ''));
      const maxValue = parseFloat(rangeParts[1].replace(/,/g, ''));
      if (!isNaN(minValue) && !isNaN(maxValue)) {
        return resultValue < minValue || resultValue > maxValue;
      }
    }
    return false;
  };

  const cellBase = idx => ({
    width: colWidths[idx] || undefined,
    flex: 0,
  });

  const tableContent = (
    <View style={[styles.testTable]}>
      {/* Header */}
      <View style={[styles.testRow]}>
        <Text
          style={[
            styles.testCell,
            styles.testHeader,
            styles.testName,
            cellBase(0),
            { color: 'black' },
          ]}
          onLayout={e => recordWidth(0, e.nativeEvent.layout.width)}
        >
          Test
        </Text>
        <Text
          style={[
            styles.testCell,
            styles.testHeader,
            styles.testResult,
            cellBase(1),
            { color: 'black' },
          ]}
          onLayout={e => recordWidth(1, e.nativeEvent.layout.width)}
        >
          Result
        </Text>
        <Text
          style={[
            styles.testCell,
            styles.testHeader,
            styles.normalRange,
            cellBase(2),
            { color: 'black', textAlign: 'center' },
          ]}
          onLayout={e => recordWidth(2, e.nativeEvent.layout.width)}
        >
          Normal Range
        </Text>
        <Text
          style={[
            styles.testCell,
            styles.testHeader,
            styles.testUnit,
            cellBase(3),
            { color: 'black', textAlign: 'right' },
          ]}
          onLayout={e => recordWidth(3, e.nativeEvent.layout.width)}
        >
          Unit
        </Text>
      </View>
      {/* Rows */}
      {testResults.parameters && testResults.parameters.length > 0 ? (
        testResults.parameters.map((param, paramIdx) => (
          <View key={paramIdx} style={[styles.testRow]}>
            <Text
              style={[
                styles.testCell,
                styles.testName,
                cellBase(0),
                { color: 'black' },
              ]}
              onLayout={e => recordWidth(0, e.nativeEvent.layout.width)}
            >
              {param.parameter}
            </Text>
            <Text
              style={[
                styles.testCell,
                styles.testResult,
                cellBase(1),
                isAbnormalResult(param.result, param.normalRange)
                  ? styles.abnormal
                  : styles.normal,
                {
                  color: isAbnormalResult(param.result, param.normalRange)
                    ? styles.abnormal.color
                    : 'black',
                },
              ]}
              onLayout={e => recordWidth(1, e.nativeEvent.layout.width)}
            >
              {param.result}
            </Text>
            <Text
              style={[
                styles.testCell,
                styles.normalRange,
                cellBase(2),
                { color: 'black', textAlign: 'center' },
              ]}
              onLayout={e => recordWidth(2, e.nativeEvent.layout.width)}
            >
              {param.normalRange || 'Varies'}
            </Text>
            <Text
              style={[
                styles.testCell,
                styles.testUnit,
                cellBase(3),
                { color: 'black', textAlign: 'right' },
              ]}
              onLayout={e => recordWidth(3, e.nativeEvent.layout.width)}
            >
              {param.unit || ''}
            </Text>
          </View>
        ))
      ) : (
        <View style={styles.testRow}>
          <Text
            style={[styles.testCell, styles.testName, { color: 'black' }]}
            onLayout={e => recordWidth(0, e.nativeEvent.layout.width)}
          >
            {testResults.testName}
          </Text>
          <Text
            style={[
              styles.testCell,
              styles.testResult,
              isAbnormalResult(testResults.result, testResults.normalRange)
                ? styles.abnormal
                : styles.normal,
              {
                color: isAbnormalResult(
                  testResults.result,
                  testResults.normalRange,
                )
                  ? styles.abnormal.color
                  : 'black',
              },
            ]}
            onLayout={e => recordWidth(1, e.nativeEvent.layout.width)}
          >
            {testResults.result}
          </Text>
          <Text
            style={[
              styles.testCell,
              styles.normalRange,
              cellBase(2),
              { color: 'black', textAlign: 'center' },
            ]}
            onLayout={e => recordWidth(2, e.nativeEvent.layout.width)}
          >
            {testResults.normalRange || 'Varies'}
          </Text>
          <Text
            style={[
              styles.testCell,
              styles.testUnit,
              cellBase(3),
              { color: 'black', textAlign: 'right' },
            ]}
            onLayout={e => recordWidth(3, e.nativeEvent.layout.width)}
          >
            {testResults.unit || ''}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View
      style={styles.testTableContainer}
      onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {totalWidth > containerWidth ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          {tableContent}
        </ScrollView>
      ) : (
        tableContent
      )}
    </View>
  );
};

function Game() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [currentGameData, setCurrentGameData] = useState(null);
  const [conversationTurn, setConversationTurn] = useState(0);
  const [revealedDisease, setRevealedDisease] = useState({});
  const [showPatientInfo, setShowPatientInfo] = useState(true);
  const [showCurrentSymptoms, setShowCurrentSymptoms] = useState(true);
  const [showModal, setShowModal] = useState(false); // Add this
  const [userGuess, setUserGuess] = useState(''); // Add this
  const [keyboardVisible, setKeyboardVisible] = useState(false); // Add this state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null); // keeps TextInput focused
  const colorScheme = useColorScheme();

  // --- Dynamic table column sizing ---
  // const [colWidths, setColWidths] = useState([0, 0, 0, 0]); // Test, Result, Range, Unit

  // const recordWidth = (idx, width) => {
  //   setColWidths(prev => {
  //     if (width <= prev[idx]) return prev;
  //     const next = [...prev];
  //     next[idx] = width;
  //     return next;
  //   });
  // };

  // const cellBase = idx => ({
  //   width: colWidths[idx] || undefined,
  //   flex: 0,
  // });

  // Derive common colors once so they can be reused throughout the component
  const isDark = colorScheme === 'dark';
  const dynamicTextColor = isDark ? '#ffffff' : '#000000';

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        bottomRef.current?.scrollToEnd({ animated: true });
      },
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  useEffect(() => {
    startGame();
  }, []);

  async function startGame() {
    setLoading(true);
    setFinished(false);
    setCurrentGameData(null);
    setMessages([]);
    setConversationTurn(0);
    setRevealedDisease({});
    setShowPatientInfo(true);
    setShowCurrentSymptoms(true);
    try {
      const res = await fetch(`${API_BASE}/api/game/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to start game');
      const data = await res.json();
      setSessionId(data.sessionId);
      setCurrentGameData(data.gameData);
      setConversationTurn(1);

      setMessages([
        {
          sender: 'ai',
          text: data.reply,
          data: {
            gameData: data.gameData,
            responseType: data.responseType,
            testResults: data.testResults,
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Error starting game');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  async function sendMessage() {
    if (!input.trim() || !sessionId || loading || finished) return;
    const userMsg = input.trim();
    setInput('');
    setUserGuess(userMsg); // Add this
    // Refocus the input so the cursor keeps blinking
    setTimeout(() => inputRef.current?.focus(), 0);
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    if (conversationTurn === 1) {
      setShowCurrentSymptoms(false);
      setShowPatientInfo(false);
    }
    setLoading(true);

    const nextTurn = conversationTurn + 1;
    setConversationTurn(nextTurn);

    try {
      const res = await fetch(`${API_BASE}/api/game/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      if (!res.ok) throw new Error('Failed to talk to server');
      const data = await res.json();
      setCurrentGameData(data.gameData);
      if (data.revealedDisease) {
        setRevealedDisease(data.revealedDisease);
      }
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: data.reply,
          data: {
            gameData: data.gameData,
            responseType: data.responseType,
            testResults: data.testResults,
          },
        },
      ]);
      if (data.finished) {
        setFinished(true);
        setShowModal(true); // Add this
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Error sending message');
    } finally {
      setLoading(false);
    }
  }

  async function submitReport() {
    if (!reportType) {
      Alert.alert('Please select a type');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          type: reportType,
          details: reportDetails,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit report');
      Alert.alert('Success', 'Report submitted successfully');
      setShowReportModal(false);
      setReportType('');
      setReportDetails('');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  }

  const getBodySystemColor = system => {
    const colors = {
      cardiovascular: Colors[colorScheme].red || '#e74c3c',
      respiratory: Colors[colorScheme].blue || '#3498db',
      gastrointestinal: '#f39c12',
      neurological: '#9b59b6',
      endocrine: '#1abc9c',
      musculoskeletal: '#34495e',
      infectious: '#e67e22',
      hematologic: '#c0392b',
      autoimmune: '#8e44ad',
      psychiatric: '#16a085',
      dermatologic: '#d35400',
      genitourinary: '#2c3e50',
    };
    return (
      colors[system?.toLowerCase()] || Colors[colorScheme].grey || '#95a5a6'
    );
  };

  const getSeverityColor = severity => {
    const colors = {
      mild: '#27ae60',
      moderate: '#f39c12',
      severe: '#e74c3c',
      critical: '#c0392b',
    };
    return colors[severity?.toLowerCase()] || '#95a5a6';
  };

  const renderMessage = (m, idx) => {
    const testResults = m.data?.testResults;
    const isAI = m.sender === 'ai';
    return (
      <View
        key={idx}
        style={[styles.message, isAI ? styles.aiMessage : styles.userMessage]}
      >
        {isAI ? (
          <Markdown>{m.text}</Markdown>
        ) : (
          <Text
            style={[
              styles.messageText,
              { color: '' },
              isAI ? { color: 'black' } : { color: 'white' },
            ]}
          >
            {m.text}
          </Text>
        )}
        {testResults && (
          <View style={styles.testResultsContainer}>
            {(() => {
              let isTabular = false;
              if (testResults.parameters && testResults.parameters.length > 0) {
                isTabular = testResults.parameters.some(
                  p => p.normalRange && p.normalRange !== 'Varies' && p.unit,
                );
              } else {
                isTabular =
                  testResults.normalRange &&
                  testResults.normalRange !== 'Varies' &&
                  testResults.unit;
              }
              if (isTabular) {
                return <TestResultTable testResults={testResults} />;
              } else {
                // Report structure
                return (
                  <View style={styles.reportContainer}>
                    <Text style={styles.reportTitle}>
                      {testResults.testName} Report
                    </Text>
                    {testResults.parameters &&
                    testResults.parameters.length > 0 ? (
                      testResults.parameters.map((param, paramIdx) => (
                        <Text key={paramIdx} style={styles.reportLine}>
                          {param.parameter}: {param.result}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.reportLine}>
                        Result: {testResults.result}
                      </Text>
                    )}
                  </View>
                );
              }
            })()}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: Colors[colorScheme].background,
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={[
          styles.container,
          { backgroundColor: Colors[colorScheme].background },
        ]}
      >
        {currentGameData && (
          <View
            style={[
              styles.patientCard,
              {
                backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#ffffff',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => setShowPatientInfo(prev => !prev)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={[styles.sectionTitle, { color: dynamicTextColor }]}
                >
                  Patient Info
                </Text>
                {!showPatientInfo && (
                  <View
                    style={[
                      styles.vitals,
                      {
                        marginLeft: 8,
                        marginBottom: 0,
                        flexDirection: 'row',
                        flexWrap: 'nowrap',
                      },
                    ]}
                  >
                    {currentGameData.age && (
                      <View
                        style={[
                          styles.chip,
                          {
                            borderColor: Colors[colorScheme].tint,
                            paddingVertical: 2,
                            paddingHorizontal: 6,
                            borderRadius: 12,
                            marginRight: 4,
                          },
                        ]}
                      >
                        <Text style={{ color: dynamicTextColor, fontSize: 11 }}>
                          Age: {currentGameData.age}
                        </Text>
                      </View>
                    )}
                    {currentGameData.gender && (
                      <View
                        style={[
                          styles.chip,
                          {
                            borderColor: Colors[colorScheme].tint,
                            paddingVertical: 2,
                            paddingHorizontal: 6,
                            borderRadius: 12,
                            marginRight: 4,
                            marginBottom: 0,
                          },
                        ]}
                      >
                        <Text style={{ color: dynamicTextColor, fontSize: 11 }}>
                          {currentGameData.gender?.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
              <Text style={{ color: dynamicTextColor, marginLeft: 8 }}>
                {showPatientInfo ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>
            {showPatientInfo && (
              <View style={styles.vitals}>
                {currentGameData.age && (
                  <View
                    style={[
                      styles.chip,
                      { borderColor: Colors[colorScheme].tint },
                    ]}
                  >
                    <Text style={{ color: dynamicTextColor, fontSize: 11 }}>
                      Age: {currentGameData.age}
                    </Text>
                  </View>
                )}
                {currentGameData.gender && (
                  <View
                    style={[
                      styles.chip,
                      { borderColor: Colors[colorScheme].tint },
                    ]}
                  >
                    <Text style={{ color: dynamicTextColor, fontSize: 11 }}>
                      {currentGameData.gender}
                    </Text>
                  </View>
                )}
                {/* {currentGameData.bodySystem && (
                  <View
                    style={[
                      styles.chip,
                      {
                        borderColor: getBodySystemColor(
                          currentGameData.bodySystem,
                        ),
                        backgroundColor:
                          getBodySystemColor(currentGameData.bodySystem) + '33', // subtle tint
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: getBodySystemColor(currentGameData.bodySystem),
                        fontSize: 11,
                      }}
                    >
                      {currentGameData.bodySystem}
                    </Text>
                  </View>
                )} */}
              </View>
            )}
            {currentGameData.symptoms &&
              currentGameData.symptoms.length > 0 && ( // Removed the revealedDisease block
                <View>
                  <TouchableOpacity
                    onPress={() => setShowCurrentSymptoms(prev => !prev)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text
                      style={[styles.sectionTitle, { color: dynamicTextColor }]}
                    >
                      Symptoms
                      {!showCurrentSymptoms && currentGameData.symptoms
                        ? ` (${currentGameData.symptoms.length})`
                        : ''}
                    </Text>
                    <Text style={{ color: dynamicTextColor, marginLeft: 8 }}>
                      {showCurrentSymptoms ? '▼' : '▶'}
                    </Text>
                  </TouchableOpacity>
                  {showCurrentSymptoms && (
                    <View style={styles.symptomsList}>
                      {currentGameData.symptoms.map((symptom, idx) => (
                        <View key={idx} style={styles.symptomRow}>
                          <Text
                            style={[styles.bullet, { color: dynamicTextColor }]}
                          >
                            •
                          </Text>
                          <Text
                            style={[
                              styles.symptomText,
                              { color: dynamicTextColor },
                            ]}
                          >
                            {symptom.symptom}
                          </Text>
                          {symptom.severity && (
                            <Text
                              style={[
                                styles.severityChip,
                                {
                                  backgroundColor:
                                    getSeverityColor(symptom.severity) + '33',
                                  color: getSeverityColor(symptom.severity),
                                  borderColor: getSeverityColor(
                                    symptom.severity,
                                  ),
                                  marginRight: 8,
                                },
                              ]}
                            >
                              {symptom.severity}
                            </Text>
                          )}
                          {symptom.timing && (
                            <Text
                              style={[
                                styles.severityChip,
                                {
                                  backgroundColor:
                                    Colors[colorScheme].icon + '33',
                                  color: Colors[colorScheme].icon,
                                  borderColor: Colors[colorScheme].icon,
                                },
                              ]}
                            >
                              {symptom.timing}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

            {!showModal && revealedDisease.medicalTerm && (
              <View style={styles.diagnosisContainer}>
                <Text
                  style={[styles.sectionTitle, { color: dynamicTextColor }]}
                >
                  Diagnosis:
                </Text>
                <Text
                  style={[styles.diagnosisText, { color: dynamicTextColor }]}
                >
                  {revealedDisease.medicalTerm}
                </Text>
                {revealedDisease.commonNames?.length > 0 && (
                  <Text
                    style={[styles.diagnosisText, { color: dynamicTextColor }]}
                  >
                    {revealedDisease.commonNames?.join(', ')}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        <View style={{ flex: 1, position: 'relative' }}>
          <ScrollView style={styles.chatWindow} ref={bottomRef}>
            {messages
              .filter(m => m.data?.responseType !== 'case_presentation')
              .map(renderMessage)}
            {loading && (
              <ActivityIndicator
                size="large"
                color={Colors[colorScheme].tint}
              />
            )}
          </ScrollView>
          {!finished && sessionId && (
            <TouchableOpacity
              style={[
                styles.floatingButton,
                { backgroundColor: '#e74c3c' }, // Reddish background
              ]}
              onPress={() => setShowReportModal(true)}
            >
              <Ionicons name="flag-outline" size={16} color="#ffffff" /> //
              White icon
            </TouchableOpacity>
          )}
        </View>

        {revealedDisease && (
          <Modal
            visible={showModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowModal(false)}
          >
            <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
              <View style={styles.modalContainer}>
                <TouchableWithoutFeedback onPress={() => {}}>
                  <View
                    style={[
                      styles.modalContent,
                      { backgroundColor: Colors[colorScheme].background },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalTitle,
                        { color: Colors[colorScheme].text },
                      ]}
                    >
                      Game Over
                    </Text>
                    <Text
                      style={{
                        color: Colors[colorScheme].text,
                        marginBottom: 10,
                      }}
                    >
                      Diagnosis: {revealedDisease.medicalTerm}
                    </Text>
                    <Text
                      style={{
                        color: Colors[colorScheme].text,
                        marginBottom: 10,
                      }}
                    >
                      Common Names: {revealedDisease.commonNames?.join(', ')}
                    </Text>

                    <Text
                      style={{
                        color: Colors[colorScheme].text,
                        marginBottom: 20,
                        fontWeight: 'bold',
                      }}
                    ></Text>
                    <TouchableOpacity
                      style={[
                        styles.button,
                        { backgroundColor: Colors[colorScheme].tint },
                      ]}
                      onPress={() => {
                        setShowModal(false);
                        startGame();
                      }}
                    >
                      <Text style={{ color: 'black', fontWeight: 'bold' }}>
                        Start New Game
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}

        {showReportModal && (
          <Modal
            visible={showReportModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowReportModal(false)}
          >
            <TouchableWithoutFeedback onPress={() => setShowReportModal(false)}>
              <View style={styles.modalContainer}>
                <TouchableWithoutFeedback onPress={() => {}}>
                  <View
                    style={[
                      styles.modalContent,
                      { backgroundColor: Colors[colorScheme].background },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modalTitle,
                        { color: Colors[colorScheme].text },
                      ]}
                    >
                      Report Inappropriate Content
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                      }}
                    >
                      {['Offensive', 'Inaccurate', 'Harmful', 'Other'].map(
                        type => (
                          <TouchableOpacity
                            key={type}
                            style={{
                              padding: 10,
                              margin: 5,
                              borderRadius: 5,
                              backgroundColor:
                                reportType === type
                                  ? Colors[colorScheme].tint
                                  : 'gray',
                            }}
                            onPress={() => setReportType(type)}
                          >
                            <Text
                              style={{
                                color: reportType === type ? 'black' : 'white',
                              }}
                            >
                              {type}
                            </Text>
                          </TouchableOpacity>
                        ),
                      )}
                    </View>
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: 'gray',
                        borderRadius: 5,
                        padding: 10,
                        margin: 10,
                        color: Colors[colorScheme].text,
                        backgroundColor: Colors[colorScheme].background,
                        width: '90%',
                      }}
                      placeholder="Additional details (optional)"
                      placeholderTextColor="gray"
                      value={reportDetails}
                      onChangeText={setReportDetails}
                      multiline
                    />
                    <TouchableOpacity
                      style={[
                        styles.button,
                        { backgroundColor: Colors[colorScheme].tint },
                      ]}
                      onPress={submitReport}
                      disabled={loading || !reportType}
                    >
                      <Text style={{ color: 'black', fontWeight: 'bold' }}>
                        Submit Report
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}

        <View
          style={[
            styles.controls,
            keyboardVisible && Platform.OS === 'android' && { marginBottom: 0 },
          ]}
        >
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: Colors[colorScheme].background },
            ]}
          >
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: Colors[colorScheme].text }]}
              placeholder={
                finished
                  ? 'Case completed'
                  : 'guess, ask for tests or anything else'
              }
              value={input}
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
              multiline
              placeholderTextColor={
                colorScheme === 'dark' ? '#9BA1A6' : '#687076'
              }
              onFocus={() => bottomRef.current?.scrollToEnd({ animated: true })}
              editable={!!sessionId && !finished}
            />
            {!input.trim() ? (
              <TouchableOpacity
                onPress={startGame}
                disabled={loading}
                style={{
                  backgroundColor: Colors[colorScheme].tint,
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: 'black', fontWeight: 'bold' }}>
                  New Case?
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={sendMessage}
                disabled={loading || finished || !input.trim()}
                style={styles.sendIcon}
              >
                <Ionicons
                  name="send"
                  size={24}
                  color={
                    loading || finished || !input.trim()
                      ? 'gray'
                      : dynamicTextColor
                  }
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 10 },
  header: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ffffff' },
  subtitle: { fontSize: 16, color: '#ffffff' },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 8,
  },
  patientCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginBottom: 4,
  },

  vitals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  vitalItem: {}, // legacy, no longer used but kept to avoid errors if referenced
  chip: {
    paddingVertical: 1,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
  },
  severityChip: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 4,
    fontSize: 12,
    overflow: 'hidden',
  },
  revealedDisease: { fontSize: 16, fontWeight: 'bold', color: 'red' },
  symptomsList: { marginTop: 4 },
  symptomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  bullet: { marginRight: 6, fontSize: 16 },
  symptomText: {
    fontSize: 16,
    marginRight: 8,
    flexShrink: 1,
  },
  chatWindow: { flex: 1 },
  message: {
    paddingTop: 6,
    paddingBottom: 6,
    borderRadius: 10,
    marginVertical: 6,
    elevation: 2,
  },
  aiMessage: {
    backgroundColor: '#e8f5e9',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
  },
  userMessage: {
    backgroundColor: '#005c4b',
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
  },
  messageText: { fontSize: 16 },
  testResultsContainer: {
    marginTop: 8,
    borderRadius: 8,
  },
  testTable: {
    minWidth: '100%',
  },
  testRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  testHeader: { fontWeight: 'bold' },
  // Generic cell padding
  testCell: { paddingHorizontal: 4 },
  testName: {},
  testResult: {},
  normalRange: {},
  testUnit: {},
  abnormal: { color: '#e74c3c', fontWeight: 'bold' },
  normal: { color: '#27ae60' },
  reportContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  reportTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'black',
  },
  reportLine: {
    fontSize: 16,
    color: 'black',
    marginBottom: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 24,

    paddingLeft: 12,
    marginHorizontal: 5,
    minHeight: 40,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 120,
  },
  sendIcon: {
    padding: 6,
  },
  button: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  floatingButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 25,
    height: 25,
    borderRadius: 12.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
  startButton: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  testTableContainer: {
    width: '100%',
  },
});

export default Game;
