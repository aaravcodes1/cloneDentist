// --- 1. CONFIGURATION ---
// ✅ API key removed from frontend - now stored in Vercel Environment Variables
const YOUR_PHONE_NUMBER = "+918869875602";
const MAKE_WEBHOOK_URL = "https://hook.eu1.make.com/wur5fg7xb1gyqnmwr7d3uozb0fu76a92";

const AI_CONFIG = {
    name: "Riley",
    first_message: "Hello! Thank you for calling Automate.io. How may I help you today?",
    model: "base",
    language: "en",
    voice: "maya",
    voice_settings: { stability: 0.5, similarity_boost: 0.8 },
    instructions: `You are Riley for Automate.io. Greet callers professionally. Answer questions about website creation,dentist,AI reseptionist, hosting, email automation, AI phone agents. If caller wants a human, transfer to +91${YOUR_PHONE_NUMBER.replace('+91', '')}. Keep it friendly and concise.`
};

let currentCallId = null;
let callStatus = 'idle';

window.onload = () => {
    console.log("Starting Automate.io...");
    if (window.lucide) lucide.createIcons();
    setupVoiceCallUI();
    setupFormLogic();
};

const initiateCall = async () => {
    const userPhoneInput = document.getElementById('user-phone');
    let userPhone = userPhoneInput ? userPhoneInput.value.trim() : '';
    
    if (!userPhone) {
        alert("Please enter your phone number to start the call.");
        return;
    }
    
    updateCallUI('connecting');
    
    try {
        userPhone = formatPhoneNumber(userPhone);
        console.log("Calling:", userPhone);
        
        // ✅ Now calling our Vercel API route instead of Bland AI directly
        const response = await fetch('/api/make-call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone_number: userPhone,
                task: AI_CONFIG.instructions,
                name: AI_CONFIG.name,
                model: AI_CONFIG.model,
                language: AI_CONFIG.language,
                voice: AI_CONFIG.voice,
                voice_settings: AI_CONFIG.voice_settings,
                first_message: AI_CONFIG.first_message,
                transfer_tools: true,
                transfer_destination_number: YOUR_PHONE_NUMBER
            })
        });

        const data = await response.json();
        console.log("Response:", data);

        if (data.call_id) {
            currentCallId = data.call_id;
            updateCallUI('active');
            monitorCallStatus();
        } else if (data.error) {
            console.error("Error:", data.error);
            alert("Call failed: " + data.error);
            updateCallUI('idle');
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to start call. Please try again.");
        updateCallUI('idle');
    }
};

const monitorCallStatus = () => {
    const checkStatus = setInterval(async () => {
        if (callStatus === 'ended' || !currentCallId) {
            clearInterval(checkStatus);
            return;
        }
        try {
            // ✅ Now calling our Vercel API route instead of Bland AI directly
            const response = await fetch('/api/call-status?call_id=' + currentCallId);
            const data = await response.json();
            console.log("Status:", data.status);
            if (data.status === 'completed' || data.status === 'ended') {
                callStatus = 'ended';
                updateCallUI('idle');
                clearInterval(checkStatus);
            }
        } catch (error) {
            console.error("Status error:", error);
        }
    }, 5000);
    setTimeout(() => clearInterval(checkStatus), 300000);
};

const transferToHuman = async () => {
    if (!currentCallId) return;
    updateCallUI('transferring');
    try {
        // ✅ Now calling our Vercel API route instead of Bland AI directly
        const response = await fetch('/api/transfer-call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                call_id: currentCallId,
                destination_number: YOUR_PHONE_NUMBER
            })
        });
        const data = await response.json();
        console.log("Transfer:", data);
        if (data.success || data.status === 'transferring') {
            alert("Connecting you to our team...");
        }
    } catch (error) {
        console.error("Transfer error:", error);
        alert("Transfer failed. Call us directly at " + YOUR_PHONE_NUMBER);
    }
};

const endCall = async () => {
    callStatus = 'ended';
    currentCallId = null;
    updateCallUI('idle');
};

const formatPhoneNumber = (phone) => {
    let cleaned = phone.replace(/\D/g, '');
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
        cleaned = '91' + cleaned;
    } else if (!cleaned.startsWith('+') && !cleaned.startsWith('91')) {
        cleaned = '91' + cleaned;
    }
    return '+' + cleaned;
};

const setupVoiceCallUI = () => {
    const callModal = document.getElementById('call-modal');
    const callIdle = document.getElementById('call-idle');
    const callConnecting = document.getElementById('call-connecting');
    const callActive = document.getElementById('call-active');
    const callTransferring = document.getElementById('call-transferring');

    window.updateCallUI = (state) => {
        [callIdle, callConnecting, callActive, callTransferring].forEach(el => {
            if (el) el.classList.add('hidden');
        });
        if (state === 'idle' && callIdle) callIdle.classList.remove('hidden');
        if (state === 'connecting' && callConnecting) callConnecting.classList.remove('hidden');
        if (state === 'active' && callActive) callActive.classList.remove('hidden');
        if (state === 'transferring' && callTransferring) callTransferring.classList.remove('hidden');
        callStatus = state;
        if (window.lucide) lucide.createIcons();
    };

    document.querySelectorAll('#call-now-btn, #call-now-btn-mobile').forEach(btn => {
        if (btn) btn.onclick = () => { if (callModal) callModal.classList.remove('hidden'); };
    });

    const closeBtn = document.getElementById('close-call-modal');
    if (closeBtn) closeBtn.onclick = () => { if (callModal) callModal.classList.add('hidden'); updateCallUI('idle'); };

    const startBtn = document.getElementById('start-call-btn');
    if (startBtn) startBtn.onclick = () => { initiateCall(); };

    const endBtn = document.getElementById('end-call-btn');
    if (endBtn) endBtn.onclick = () => { endCall(); };

    const transferBtn = document.getElementById('transfer-to-human-btn');
    if (transferBtn) transferBtn.onclick = () => { transferToHuman(); };

    const cancelTransferBtn = document.getElementById('cancel-transfer-btn');
    if (cancelTransferBtn) cancelTransferBtn.onclick = () => { endCall(); };

    const backdrop = document.getElementById('call-backdrop');
    if (backdrop) backdrop.onclick = () => { if (callModal) callModal.classList.add('hidden'); updateCallUI('idle'); };
};

const setupFormLogic = () => {
    const form = document.getElementById('consultation-form');
    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault();
        const btnText = document.getElementById('btn-text');
        if (btnText) btnText.innerText = "SENDING...";

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(MAKE_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                console.log("Success!");
                const successMsg = document.getElementById('form-success');
                if (successMsg) {
                    successMsg.classList.remove('hidden');
                    successMsg.innerText = "Thank you! Riley will be in touch.";
                }
                form.reset();
            }
        } catch (error) {
            console.error("Submit error:", error);
        } finally {
            if (btnText) btnText.innerText = "Request Consultation";
        }
    };
};
