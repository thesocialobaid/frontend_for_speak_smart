import React, { useState, useRef } from 'react';
// axios is not used in the mock setup, but you'll need it for the real API call
// import axios from 'axios';

// --- Material-UI Imports ---
import {
    Container,
    Box,
    Typography,
    Button,
    Card,
    Grid,
    CircularProgress,
    CssBaseline
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import MicIcon from '@mui/icons-material/Mic';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PsychologyIcon from '@mui/icons-material/Psychology';

// --- Chart.js Imports ---
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Create a simple theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // A standard blue
    },
    secondary: {
      main: '#388e3c', // A nice green for pitch
    },
    warning: {
        main: '#f57c00', // A warm orange for volume
    },
    background: {
      default: '#f4f6f8', // A light grey background
    },
  },
  typography: {
      fontFamily: 'Roboto, sans-serif',
  }
});

// --- NEW ---
// Reusable chart component to keep the results page clean
function AnalysisChart({ title, label, data, dataKey, color }) {
    const chartData = {
        labels: data.map(d => d.time),
        datasets: [{
            label: label,
            data: data.map(d => d[dataKey]),
            borderColor: color,
            backgroundColor: `${color}33`, // Add transparency to the color
            fill: true,
            tension: 0.3
        }],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: title,
                font: { size: 16 }
            }
        },
    };

    return (
        <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Line options={chartOptions} data={chartData} />
        </Card>
    );
}


function App() {
  // === STATE MANAGEMENT ===
  const [analysisResult, setAnalysisResult] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // === LOGIC (Recording, Upload, Submit) ===
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        audioChunksRef.current = [];
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setAudioURL('');
      setAudioBlob(null);
      setAnalysisResult(null); // Reset previous results
    } catch (err) { console.error("Mic error:", err); alert("Microphone access denied."); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        setAudioBlob(file);
        setAudioURL(URL.createObjectURL(file));
        setAnalysisResult(null); // Reset previous results
    }
  };

  const handleAudioSubmit = async () => {
    if (!audioBlob) { alert('Please provide audio first!'); return; }
    setIsLoading(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'speech.webm');

    try {
      // --- UPDATED MOCK API CALL FOR DEMO ---
      // This now includes pitch confidence and volume (loudness) data.
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockResponse = {
        data: {
          feedback: "Excellent start! Your volume and clarity are great. Your pace is a little fast, around 170 WPM. Try to take a breath after key points.\n\nYour pitch is generally confident but wavers slightly in the middle, which could indicate a moment of uncertainty. Your overall volume is good and consistent, ensuring the audience can hear you clearly.",
          wpm_data: [
            { time: "0-10s", wpm: 150 }, { time: "10-20s", wpm: 175 },
            { time: "20-30s", wpm: 168 }, { time: "30-40s", wpm: 155 },
          ],
          // --- NEW DATA ---
          pitch_data: [
            { time: "0-10s", confidence: 0.90 }, { time: "10-20s", confidence: 0.88 },
            { time: "20-30s", confidence: 0.75 }, { time: "30-40s", confidence: 0.92 },
          ],
          volume_data: [
            { time: "0-10s", db: -12 }, { time: "10-20s", db: -11 },
            { time: "20-30s", db: -14 }, { time: "30-40s", db: -12 },
          ],
        }
      };
      setAnalysisResult(mockResponse.data);
      // --- END MOCK ---

      /*
      // --- REAL API CALL (EXAMPLE) ---
      // When your backend is ready, replace the mock call with this:
      const response = await axios.post('YOUR_BACKEND_API_ENDPOINT', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAnalysisResult(response.data);
      */

    } catch (error) {
      console.error('Error:', error); alert('Analysis failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // === UI RENDERING ===
  const renderHomePage = () => (
    <Container maxWidth="md" sx={{ py: 5 }}>
        <Box textAlign="center" mb={5}>
            <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
                SpeakSmart AI Coach
            </Typography>
            <Typography variant="h6" color="text.secondary">
                Upload or record your speech to get instant AI-powered feedback.
            </Typography>
        </Box>

        <Card variant="outlined" sx={{ p: 4 }}>
            <Grid container spacing={4} alignItems="center">
                <Grid item xs={12} md={6}>
                    <Typography variant="h5" gutterBottom>Record Audio</Typography>
                    {isRecording ? (
                        <Button variant="contained" color="error" size="large" startIcon={<StopCircleIcon />} onClick={stopRecording}>Stop Recording</Button>
                    ) : (
                        <Button variant="contained" color="success" size="large" startIcon={<MicIcon />} onClick={startRecording}>Start Recording</Button>
                    )}
                </Grid>
                <Grid item xs={12} md={6}>
                    <Typography variant="h5" gutterBottom>Or Upload File</Typography>
                    <Button variant="outlined" size="large" component="label" startIcon={<UploadFileIcon />}>
                        Choose File
                        <input type="file" accept="audio/*" hidden onChange={handleFileChange} />
                    </Button>
                </Grid>
            </Grid>
            {audioURL && (
                <Box mt={4}>
                    <Typography variant="body1" gutterBottom>Your selected audio:</Typography>
                    <audio src={audioURL} controls style={{ width: '100%' }} />
                </Box>
            )}
        </Card>

        <Box textAlign="center" mt={5}>
            <Button
                variant="contained"
                size="large"
                disabled={!audioBlob || isLoading}
                onClick={handleAudioSubmit}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <PsychologyIcon />}
                sx={{ minWidth: 220, minHeight: 50 }}
            >
                {isLoading ? 'Analyzing...' : 'Analyze My Speech'}
            </Button>
        </Box>
    </Container>
  );

  // --- UPDATED ---
  // The results page now displays a 2x2 grid with all the analysis metrics.
  const renderResultsPage = () => {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom textAlign="center" mb={5}>
            Your Analysis Results
        </Typography>
        <Grid container spacing={4}>
            {/* WPM Chart */}
            <Grid item xs={12} md={6}>
                <AnalysisChart
                    title="Pacing (Words Per Minute)"
                    label="WPM"
                    data={analysisResult.wpm_data}
                    dataKey="wpm"
                    color={theme.palette.primary.main}
                />
            </Grid>

            {/* Pitch Chart */}
            <Grid item xs={12} md={6}>
                <AnalysisChart
                    title="Pitch Confidence"
                    label="Confidence (0-1)"
                    data={analysisResult.pitch_data}
                    dataKey="confidence"
                    color={theme.palette.secondary.main}
                />
            </Grid>

            {/* Volume Chart */}
            <Grid item xs={12} md={6}>
                <AnalysisChart
                    title="Volume (Loudness)"
                    label="Loudness (dB)"
                    data={analysisResult.volume_data}
                    dataKey="db"
                    color={theme.palette.warning.main}
                />
            </Grid>

            {/* AI Feedback Card */}
            <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ p: 3, height: '100%' }}>
                    <Typography variant="h5" component="h3" gutterBottom>🧠 AI Coach Feedback</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {analysisResult.feedback}
                    </Typography>
                </Card>
            </Grid>
        </Grid>

        <Box textAlign="center" mt={5}>
            <Button variant="outlined" onClick={() => setAnalysisResult(null)}>
                Analyze Another Speech
            </Button>
        </Box>
      </Container>
    );
  };


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {!analysisResult ? renderHomePage() : renderResultsPage()}
      </Box>
    </ThemeProvider>
  );
}

export default App;