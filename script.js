class ScriptGenerator {
    constructor() {
        this.apiKey = localStorage.getItem('openRouterApiKey') || '';
        this.timeout = 30000; // 30 seconds timeout
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        // Initialize DOM elements
        this.apiKeyInput = document.getElementById('apiKey');
        this.saveKeyBtn = document.getElementById('saveKey');
        this.topicInput = document.getElementById('videoTopic');
        this.generateBtn = document.getElementById('generate');
        this.scriptContent = document.getElementById('scriptContent');
        this.copyButton = document.getElementById('copyButton');
        this.loadingSpinner = document.querySelector('.loading-spinner');
        this.progressBar = document.querySelector('.progress-bar');
        this.progress = document.querySelector('.progress');
        this.progressText = document.querySelector('.progress-text');
        this.themeToggle = document.getElementById('themeToggle');

        // Set initial API key value
        this.apiKeyInput.value = this.apiKey;

        // Set initial theme
        if (this.theme === 'dark') {
            document.body.classList.add('dark-theme');
        }

        // Event listeners
        this.saveKeyBtn.addEventListener('click', () => this.saveApiKey());
        this.generateBtn.addEventListener('click', () => this.generateScript());
        this.copyButton.addEventListener('click', () => this.copyToClipboard());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    saveApiKey() {
        const key = this.apiKeyInput.value.trim();
        if (key) {
            localStorage.setItem('openRouterApiKey', key);
            this.apiKey = key;
            alert('API key saved successfully!');
        }
    }

    async generateScript() {
        if (!this.apiKey) {
            alert('Sila simpan kunci API OpenRouter anda terlebih dahulu!');
            return;
        }

        const topic = this.topicInput.value.trim();
        if (!topic) {
            alert('Sila masukkan topik!');
            return;
        }

        this.showLoading(true);
        this.startProgress();
        
        const prompt = `Anda bertindak sebagai penulis kandungan SEO dan copywriter yang mahir dalam Bahasa Malaysia. Sediakan skrip YouTube untuk Topik: "${topic}". Skrip mesti mempunyai bahagian Pengenalan, kandungan utama dan kesimpulan. Bahagian kandungan utama mesti mengandungi 5 segmen, setiap segmen mesti mempunyai panjang 200 perkataan. Panjang skrip mesti 700 perkataan. Jika terdapat tajuk kecil, tukarkannya kepada huruf tebal.`;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                signal: controller.signal,
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": "google/learnlm-1.5-pro-experimental:free",
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                })
            });

            clearTimeout(timeoutId);

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message);
            }

            const generatedScript = data.choices[0].message.content;
            this.displayScript(generatedScript);
        } catch (error) {
            if (error.name === 'AbortError') {
                alert('Masa tamat! Sila cuba lagi.');
            } else {
                alert(`Ralat: ${error.message}`);
            }
        } finally {
            this.showLoading(false);
            this.stopProgress();
        }
    }

    displayScript(script) {
        this.scriptContent.textContent = script;
        this.copyButton.classList.remove('hidden');
    }

    startProgress() {
        this.progressBar.classList.remove('hidden');
        this.progress.style.transform = 'scaleX(0)';
        
        // Force reflow
        this.progress.offsetHeight;
        
        this.progress.style.transform = 'scaleX(1)';
        
        let timeLeft = 30;
        this.progressInterval = setInterval(() => {
            timeLeft--;
            this.progressText.textContent = `0:${timeLeft.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                this.stopProgress();
            }
        }, 1000);
    }

    stopProgress() {
        clearInterval(this.progressInterval);
        this.progressBar.classList.add('hidden');
        this.progress.style.transform = 'scaleX(0)';
    }

    showLoading(show) {
        this.loadingSpinner.classList.toggle('hidden', !show);
        this.generateBtn.disabled = show;
    }

    async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(this.scriptContent.textContent);
            const originalText = this.copyButton.textContent;
            this.copyButton.textContent = 'Disalin!';
            setTimeout(() => {
                this.copyButton.textContent = originalText;
            }, 2000);
        } catch (err) {
            alert('Gagal menyalin teks');
        }
    }

    toggleTheme() {
        const isDark = document.body.classList.toggle('dark-theme');
        this.theme = isDark ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
    }

    // Check system theme preference
    checkSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-theme');
            this.theme = 'dark';
            localStorage.setItem('theme', 'dark');
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const app = new ScriptGenerator();
    // Check system theme preference if no theme is set
    if (!localStorage.getItem('theme')) {
        app.checkSystemTheme();
    }
}); 