/**
 * =============================================
 *  RespiAI — Backend API Integration Layer
 *  Phase 10: API Service Module
 * =============================================
 *
 *  This module provides a clean abstraction layer
 *  for all backend API calls. Currently uses mock
 *  responses; replace BASE_URL and remove mocks
 *  to connect to a real backend.
 *
 *  Supported Backends:
 *    - Flask / FastAPI (Python)
 *    - Spring Boot (Java)
 *    - Express.js (Node)
 *
 *  Usage:
 *    const api = new RespiAPI();
 *    const result = await api.analyzeXray(file);
 * =============================================
 */

class RespiAPI {

    // ——— Configuration ———
    constructor(config = {}) {
        // Base URL — change this when backend is ready
        this.BASE_URL = config.baseUrl || 'http://localhost:5000/api/v1';

        // Default headers
        this.headers = {
            'Accept': 'application/json',
            ...config.headers
        };

        // Request timeout (ms)
        this.timeout = config.timeout || 30000;

        // Retry config
        this.maxRetries = config.maxRetries || 2;
        this.retryDelay = config.retryDelay || 1000;

        // Mock mode — set to false when backend is ready
        this.useMocks = config.useMocks !== undefined ? config.useMocks : true;

        // ESP32 WebSocket
        this.ws = null;
        this.wsCallbacks = {};

        console.log(`🔌 RespiAPI initialized — ${this.useMocks ? 'MOCK MODE' : this.BASE_URL}`);
    }


    // =============================================
    //  CORE — Request Wrapper
    // =============================================

    /**
     * Makes an HTTP request with timeout, retries, and error handling.
     * @param {string} endpoint - API endpoint path
     * @param {object} options - fetch options
     * @returns {Promise<object>} - parsed JSON response
     */
    async request(endpoint, options = {}) {
        if (this.useMocks) {
            return this._getMockResponse(endpoint, options);
        }

        const url = `${this.BASE_URL}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const fetchOptions = {
            ...options,
            headers: { ...this.headers, ...options.headers },
            signal: controller.signal
        };

        let lastError;
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await fetch(url, fetchOptions);
                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorBody = await response.json().catch(() => ({}));
                    throw new APIError(
                        errorBody.message || `HTTP ${response.status}: ${response.statusText}`,
                        response.status,
                        errorBody
                    );
                }

                return await response.json();
            } catch (error) {
                lastError = error;
                if (error.name === 'AbortError') {
                    throw new APIError('Request timed out', 408);
                }
                if (attempt < this.maxRetries) {
                    await this._delay(this.retryDelay * (attempt + 1));
                    console.warn(`⚠️ Retry ${attempt + 1}/${this.maxRetries} for ${endpoint}`);
                }
            }
        }

        throw lastError;
    }


    // =============================================
    //  UPLOAD — File Upload Endpoints
    // =============================================

    /**
     * Upload a chest X-ray image for analysis.
     * Backend endpoint: POST /api/v1/upload/xray
     *
     * @param {File} file - Image file (PNG, JPG, DICOM)
     * @param {function} onProgress - Progress callback (0-100)
     * @returns {Promise<object>} - { fileId, fileName, status }
     */
    async uploadXray(file, onProgress = null) {
        const formData = new FormData();
        formData.append('xray', file);
        formData.append('type', 'chest_xray');
        formData.append('timestamp', new Date().toISOString());

        if (this.useMocks) {
            return this._simulateUpload(file, onProgress, 'xray');
        }

        return this.request('/upload/xray', {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set Content-Type for FormData
        });
    }

    /**
     * Upload a lung sound audio file for analysis.
     * Backend endpoint: POST /api/v1/upload/audio
     *
     * @param {File} file - Audio file (WAV, MP3, OGG, FLAC)
     * @param {function} onProgress - Progress callback (0-100)
     * @returns {Promise<object>} - { fileId, fileName, status }
     */
    async uploadAudio(file, onProgress = null) {
        const formData = new FormData();
        formData.append('audio', file);
        formData.append('type', 'lung_sound');
        formData.append('timestamp', new Date().toISOString());

        if (this.useMocks) {
            return this._simulateUpload(file, onProgress, 'audio');
        }

        return this.request('/upload/audio', {
            method: 'POST',
            body: formData,
            headers: {}
        });
    }


    // =============================================
    //  ANALYSIS — Diagnosis Endpoints
    // =============================================

    /**
     * Trigger AI analysis on uploaded files.
     * Backend endpoint: POST /api/v1/analyze
     *
     * @param {object} params - { xrayFileId, audioFileId }
     * @returns {Promise<object>} - { taskId, status }
     */
    async triggerAnalysis(params) {
        if (this.useMocks) {
            return this._mockAnalysisResponse();
        }

        return this.request('/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
    }

    /**
     * Get analysis results by task ID.
     * Backend endpoint: GET /api/v1/results/:taskId
     *
     * @param {string} taskId - Analysis task identifier
     * @returns {Promise<object>} - Full diagnosis result
     */
    async getResults(taskId) {
        if (this.useMocks) {
            return this._mockDiagnosisResult();
        }

        return this.request(`/results/${taskId}`);
    }

    /**
     * Get analysis history.
     * Backend endpoint: GET /api/v1/history
     *
     * @param {number} limit - Number of results to fetch
     * @returns {Promise<Array>} - List of past analyses
     */
    async getHistory(limit = 10) {
        if (this.useMocks) {
            return { history: [], total: 0 };
        }

        return this.request(`/history?limit=${limit}`);
    }


    // =============================================
    //  ESP32 — Real-time WebSocket
    // =============================================

    /**
     * Connect to ESP32 WebSocket stream.
     * Backend endpoint: ws://[ESP32_IP]:81/ws
     *
     * @param {string} ip - ESP32 IP address
     * @param {object} callbacks - { onOpen, onData, onClose, onError }
     */
    connectESP32(ip = '192.168.1.42', callbacks = {}) {
        this.wsCallbacks = callbacks;

        if (this.useMocks) {
            console.log('🔌 Mock ESP32 connection established');
            if (callbacks.onOpen) callbacks.onOpen();
            this._startMockStream(callbacks);
            return;
        }

        const wsUrl = `ws://${ip}:81/ws`;
        console.log(`🔌 Connecting to ESP32 at ${wsUrl}...`);

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('✅ ESP32 WebSocket connected');
                if (callbacks.onOpen) callbacks.onOpen();
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (callbacks.onData) callbacks.onData(data);
                } catch {
                    // Raw audio buffer
                    if (callbacks.onData) callbacks.onData(event.data);
                }
            };

            this.ws.onclose = (event) => {
                console.log('🔴 ESP32 WebSocket closed:', event.code);
                if (callbacks.onClose) callbacks.onClose(event);
            };

            this.ws.onerror = (error) => {
                console.error('❌ ESP32 WebSocket error:', error);
                if (callbacks.onError) callbacks.onError(error);
            };
        } catch (error) {
            console.error('❌ Failed to connect to ESP32:', error);
            if (callbacks.onError) callbacks.onError(error);
        }
    }

    /**
     * Disconnect from ESP32 WebSocket.
     */
    disconnectESP32() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        if (this._mockStreamInterval) {
            clearInterval(this._mockStreamInterval);
            this._mockStreamInterval = null;
        }
        console.log('🔌 ESP32 disconnected');
    }

    /**
     * Send command to ESP32.
     * @param {object} command - { type: 'start'|'stop'|'config', ... }
     */
    sendESP32Command(command) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(command));
        } else {
            console.warn('⚠️ ESP32 not connected');
        }
    }


    // =============================================
    //  CONTACT — Form Endpoints
    // =============================================

    /**
     * Submit contact form.
     * Backend endpoint: POST /api/v1/contact
     *
     * @param {object} data - { name, email, subject, message }
     * @returns {Promise<object>} - { success, message }
     */
    async submitContact(data) {
        if (this.useMocks) {
            await this._delay(1500);
            return { success: true, message: 'Message sent successfully!' };
        }

        return this.request('/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    /**
     * Subscribe to newsletter.
     * Backend endpoint: POST /api/v1/newsletter
     *
     * @param {string} email
     * @returns {Promise<object>} - { success, message }
     */
    async subscribeNewsletter(email) {
        if (this.useMocks) {
            await this._delay(800);
            return { success: true, message: 'Subscribed!' };
        }

        return this.request('/newsletter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
    }


    // =============================================
    //  HEALTH — System Status
    // =============================================

    /**
     * Check backend health status.
     * Backend endpoint: GET /api/v1/health
     *
     * @returns {Promise<object>} - { status, version, models }
     */
    async healthCheck() {
        if (this.useMocks) {
            return {
                status: 'healthy',
                version: '1.0.0',
                models: {
                    xray_cnn: { loaded: true, version: 'v2.1' },
                    audio_cnn: { loaded: true, version: 'v1.8' },
                    multimodal: { loaded: true, version: 'v1.0' }
                },
                esp32: { connected: false },
                uptime: '72h 14m'
            };
        }

        return this.request('/health');
    }


    // =============================================
    //  MOCK RESPONSES — Remove when backend ready
    // =============================================

    /** Simulate file upload with progress */
    async _simulateUpload(file, onProgress, type) {
        const steps = 10;
        for (let i = 1; i <= steps; i++) {
            await this._delay(150);
            if (onProgress) onProgress(Math.round((i / steps) * 100));
        }

        return {
            fileId: `${type}_${Date.now()}`,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            status: 'uploaded',
            timestamp: new Date().toISOString()
        };
    }

    /** Mock analysis trigger response */
    _mockAnalysisResponse() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    taskId: `task_${Date.now()}`,
                    status: 'processing',
                    estimatedTime: '3-5 seconds'
                });
            }, 500);
        });
    }

    /** Mock full diagnosis result */
    _mockDiagnosisResult() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    taskId: `task_${Date.now()}`,
                    status: 'completed',
                    timestamp: new Date().toISOString(),
                    prediction: {
                        disease: 'Pneumonia',
                        type: 'Bacterial — Community Acquired',
                        confidence: 0.90,
                        severity: 3, // out of 5
                    },
                    probabilities: [
                        { disease: 'Pneumonia', probability: 0.90, color: '#3b82f6' },
                        { disease: 'Tuberculosis', probability: 0.06, color: '#ef4444' },
                        { disease: 'COPD', probability: 0.03, color: '#f97316' },
                        { disease: 'Asthma', probability: 0.01, color: '#8b5cf6' }
                    ],
                    explanation: {
                        gradcam: null, // Base64 heatmap image from backend
                        findings: [
                            'Consolidation detected in right lower lobe (92% activation)',
                            'Air bronchograms visible, consistent with bacterial pneumonia',
                            'Crackle sounds at 300-600Hz — fluid in alveoli',
                            'LIME confirms top 5 features for Pneumonia classification'
                        ]
                    },
                    audioAnalysis: {
                        duration: 8.4,
                        sampleRate: 16000,
                        detectedSounds: ['Crackle'],
                        spectrogram: null // Base64 spectrogram from backend
                    },
                    recommendations: [
                        { title: 'Consult Pulmonologist', desc: 'Schedule appointment for confirmation.' },
                        { title: 'Lab Tests', desc: 'CBC, sputum culture, CRP recommended.' },
                        { title: 'Treatment', desc: 'Antibiotics based on pathogen identification.' },
                        { title: 'Rest & Recovery', desc: 'Follow-up X-ray in 4-6 weeks.' }
                    ]
                });
            }, 2000);
        });
    }

    /** Mock ESP32 data stream */
    _startMockStream(callbacks) {
        let sampleCount = 0;
        this._mockStreamInterval = setInterval(() => {
            sampleCount += 16;
            const mockData = {
                type: 'audio_sample',
                timestamp: Date.now(),
                frequency: (200 + Math.random() * 600).toFixed(0),
                amplitude: (0.3 + Math.random() * 0.5).toFixed(2),
                classification: ['Normal', 'Crackle', 'Wheeze', 'Normal'][Math.floor(Math.random() * 4)],
                sampleCount: sampleCount,
                signalStrength: -42 - Math.floor(Math.random() * 15)
            };
            if (callbacks.onData) callbacks.onData(mockData);
        }, 100);
    }

    /** Mock response router */
    async _getMockResponse(endpoint, options) {
        const method = (options.method || 'GET').toUpperCase();

        // Route to appropriate mock
        if (endpoint.startsWith('/upload/xray')) return this._simulateUpload(new File([], 'mock.jpg'), null, 'xray');
        if (endpoint.startsWith('/upload/audio')) return this._simulateUpload(new File([], 'mock.wav'), null, 'audio');
        if (endpoint === '/analyze') return this._mockAnalysisResponse();
        if (endpoint.startsWith('/results/')) return this._mockDiagnosisResult();
        if (endpoint === '/health') return this.healthCheck();
        if (endpoint === '/contact') { await this._delay(1500); return { success: true }; }
        if (endpoint === '/newsletter') { await this._delay(800); return { success: true }; }

        return { message: 'Mock endpoint not found', endpoint };
    }

    /** Utility: delay */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}


// =============================================
//  Custom API Error Class
// =============================================
class APIError extends Error {
    constructor(message, status, body = {}) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.body = body;
    }
}


// =============================================
//  Export as global (for vanilla JS usage)
//  In a module bundler, use: export default RespiAPI;
// =============================================
window.RespiAPI = RespiAPI;
window.APIError = APIError;

// Auto-initialize global instance
window.api = new RespiAPI({ useMocks: true });

console.log('📦 RespiAI API module loaded — Phase 10');
