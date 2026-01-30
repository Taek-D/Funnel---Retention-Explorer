// Global State Management
const AppState = {
    rawData: [],
    processedData: [],
    columnMapping: {},
    headers: [],
    currentDataset: null,
    detectedType: null,
    funnelSteps: [],
    funnelResults: null,
    retentionResults: null,
    segmentResults: null,
    insights: [],
    // Subscription Analytics State
    subscriptionKPIs: null,
    trialAnalysis: null,
    churnAnalysis: null,
    paidRetentionResults: null,
    retentionType: 'activity' // 'activity' or 'paid'
};

// ===== SUBSCRIPTION ANALYTICS UTILITY FUNCTIONS =====

// Check if a column exists in raw data
function hasCol(colName) {
    if (!AppState.headers || AppState.headers.length === 0) return false;
    return AppState.headers.some(h => h.toLowerCase() === colName.toLowerCase());
}

// Get column value from raw row (case-insensitive)
function getColValue(row, colName) {
    if (!row) return null;
    const key = Object.keys(row).find(k => k.toLowerCase() === colName.toLowerCase());
    return key ? row[key] : null;
}

// Check if data looks like subscription data
function isSubscriptionData() {
    return AppState.detectedType === 'subscription';
}

// Get unique values for a column from raw data
function getUniqueColValues(colName) {
    if (!hasCol(colName)) return [];
    return [...new Set(AppState.rawData.map(row => getColValue(row, colName)).filter(v => v != null && v !== ''))];
}

// Event Pattern Definitions for Auto-Detection
const EVENT_PATTERNS = {
    ecommerce: [
        'view_item', 'product_view', 'item_view', 'view_product',
        'add_to_cart', 'add_cart', 'cart_add', 'addtocart',
        'begin_checkout', 'checkout_start', 'checkout', 'start_checkout',
        'purchase', 'buy', 'order', 'transaction', 'complete_purchase'
    ],
    subscription: [
        'app_open', 'app_launch', 'open', 'launch',
        'signup', 'sign_up', 'register', 'registration',
        'onboarding', 'onboarding_complete', 'onboard',
        'start_trial', 'trial_start', 'free_trial', 'trial',
        'subscribe', 'subscription', 'payment', 'start_subscription'
    ]
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    displayRecentFiles();
});

// Event Listeners Setup
function initializeEventListeners() {
    // Tab Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchScreen(btn.dataset.screen));
    });

    // Upload Area
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--accent-primary)';
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--border-color)';
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--border-color)';
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    });
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFileUpload(file);
    });



    // Confirm Mapping
    document.getElementById('confirmMapping').addEventListener('click', confirmMapping);

    // Funnel Templates
    document.getElementById('loadEcommerceFunnel').addEventListener('click', () => {
        loadFunnelTemplate('ecommerce');
    });
    document.getElementById('loadSubscriptionFunnel').addEventListener('click', () => {
        loadFunnelTemplate('subscription');
    });
    const lifecycleFunnelBtn = document.getElementById('loadLifecycleFunnel');
    if (lifecycleFunnelBtn) {
        lifecycleFunnelBtn.addEventListener('click', () => {
            loadFunnelTemplate('lifecycle');
        });
    }

    // Calculate Funnel
    document.getElementById('calculateFunnel').addEventListener('click', calculateFunnel);

    // Calculate Retention
    document.getElementById('calculateRetention').addEventListener('click', calculateRetention);

    // Compare Segments
    document.getElementById('compareSegments').addEventListener('click', compareSegments);

    // Export Report
    const exportBtn = document.getElementById('exportReport');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportReport);
    }

    // n8n Email Integration
    const sendEmailBtn = document.getElementById('sendEmailReport');
    if (sendEmailBtn) {
        sendEmailBtn.addEventListener('click', sendReportViaEmail);
    }

    const toggleSettingsBtn = document.getElementById('toggleN8nSettings');
    if (toggleSettingsBtn) {
        toggleSettingsBtn.addEventListener('click', toggleN8nSettings);
    }

    const saveSettingsBtn = document.getElementById('saveN8nSettings');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveN8nSettings);
    }

    const testWebhookBtn = document.getElementById('testN8nWebhook');
    if (testWebhookBtn) {
        testWebhookBtn.addEventListener('click', testN8nWebhook);
    }

    // Load saved n8n settings on startup
    loadN8nSettings();
}

// Screen Navigation
function switchScreen(screenName) {
    // Update tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-screen="${screenName}"]`).classList.add('active');

    // Update screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(`screen-${screenName}`).classList.add('active');

    // Auto-apply funnel template if navigating to funnel screen and type is detected
    if (screenName === 'funnel' && AppState.detectedType && AppState.funnelSteps.length === 0) {
        setTimeout(() => {
            loadFunnelTemplate(AppState.detectedType);
        }, 100);
    }
}

// File Upload Handler
function handleFileUpload(file) {
    if (!file.name.endsWith('.csv')) {
        alert('CSV 파일을 업로드해주세요');
        return;
    }

    // Read file as text to save to localStorage
    const reader = new FileReader();
    reader.onload = (e) => {
        const csvText = e.target.result;

        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                AppState.rawData = results.data;
                AppState.headers = results.meta.fields;

                // Save to recent files
                saveRecentFile({
                    fileName: file.name,
                    lastOpened: new Date().toISOString(),
                    csvData: csvText
                });

                displayColumnMapping();
                displayRecentFiles();
            },
            error: (error) => {
                alert('CSV 파싱 오류: ' + error.message);
            }
        });
    };
    reader.readAsText(file);
}

// Recent Files Management
function saveRecentFile(fileInfo) {
    let recentFiles = JSON.parse(localStorage.getItem('recentFiles') || '[]');

    // Remove duplicate if exists
    recentFiles = recentFiles.filter(f => f.fileName !== fileInfo.fileName);

    // Add to beginning
    recentFiles.unshift(fileInfo);

    // Keep only last 5 files
    recentFiles = recentFiles.slice(0, 5);

    localStorage.setItem('recentFiles', JSON.stringify(recentFiles));
}

function loadRecentFiles() {
    return JSON.parse(localStorage.getItem('recentFiles') || '[]');
}

function displayRecentFiles() {
    const container = document.getElementById('recentFilesList');
    const recentFiles = loadRecentFiles();

    if (recentFiles.length === 0) {
        container.innerHTML = '<p class="no-recent-files">아직 열어본 파일이 없습니다.</p>';
        return;
    }

    let html = '';
    recentFiles.forEach((file, index) => {
        const date = new Date(file.lastOpened);
        const formattedDate = date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        html += `
            <div class="recent-file-item">
                <div class="file-info" onclick="loadRecentFile(${index})">
                    <div class="file-name">📄 ${file.fileName}</div>
                    <div class="file-date">${formattedDate}</div>
                </div>
                <button class="remove-file-btn" onclick="removeRecentFile(${index})" title="목록에서 제거">
                    ✕
                </button>
            </div>
        `;
    });

    container.innerHTML = html;
}

function loadRecentFile(index) {
    const recentFiles = loadRecentFiles();
    const file = recentFiles[index];

    if (!file) {
        alert('파일을 찾을 수 없습니다.');
        return;
    }

    Papa.parse(file.csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            AppState.rawData = results.data;
            AppState.headers = results.meta.fields;

            // Update last opened time
            file.lastOpened = new Date().toISOString();
            saveRecentFile(file);

            displayColumnMapping();
            displayRecentFiles();
        },
        error: (error) => {
            alert('파일 로딩 오류: ' + error.message);
        }
    });
}

function removeRecentFile(index) {
    event.stopPropagation();

    let recentFiles = loadRecentFiles();
    recentFiles.splice(index, 1);
    localStorage.setItem('recentFiles', JSON.stringify(recentFiles));

    displayRecentFiles();
}

// Display Column Mapping UI
function displayColumnMapping() {
    const mappingSection = document.getElementById('mappingSection');
    mappingSection.style.display = 'block';

    // Populate select dropdowns
    const selects = ['mapTimestamp', 'mapUserId', 'mapEventName', 'mapSessionId', 'mapPlatform', 'mapChannel'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">컬럼 선택...</option>';
        AppState.headers.forEach(header => {
            const option = document.createElement('option');
            option.value = header;
            option.textContent = header;
            select.appendChild(option);
        });
    });

    // Auto-detect common column names
    const autoMapping = {
        mapTimestamp: ['timestamp', 'time', 'date', 'datetime'],
        mapUserId: ['user_id', 'userid', 'user', 'customer_id'],
        mapEventName: ['event_name', 'event', 'action', 'event_type'],
        mapSessionId: ['session_id', 'sessionid', 'session'],
        mapPlatform: ['platform', 'device', 'os'],
        mapChannel: ['channel', 'source', 'utm_source']
    };

    Object.entries(autoMapping).forEach(([selectId, possibleNames]) => {
        const select = document.getElementById(selectId);
        for (const name of possibleNames) {
            const match = AppState.headers.find(h => h.toLowerCase() === name.toLowerCase());
            if (match) {
                select.value = match;
                break;
            }
        }
    });

    // Display preview table
    displayPreviewTable();
}

// Display Preview Table
function displayPreviewTable() {
    const previewTable = document.getElementById('previewTable');
    const previewData = AppState.rawData.slice(0, 10);

    let html = '<thead><tr>';
    AppState.headers.forEach(header => {
        html += `<th>${header}</th>`;
    });
    html += '</tr></thead><tbody>';

    previewData.forEach(row => {
        html += '<tr>';
        AppState.headers.forEach(header => {
            html += `<td>${row[header] || ''}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody>';

    previewTable.innerHTML = html;
}

// Auto-Detect Dataset Type
function detectDatasetType() {
    if (!AppState.processedData || AppState.processedData.length === 0) {
        return null;
    }

    // Get unique event names from processed data
    const uniqueEvents = [...new Set(AppState.processedData.map(e => e.eventName))];
    const eventNames = uniqueEvents.map(e => String(e).toLowerCase());

    let ecommerceScore = 0;
    let subscriptionScore = 0;

    // Calculate how many events match each pattern
    eventNames.forEach(eventName => {
        EVENT_PATTERNS.ecommerce.forEach(pattern => {
            if (eventName.includes(pattern.toLowerCase()) || pattern.toLowerCase().includes(eventName)) {
                ecommerceScore++;
            }
        });

        EVENT_PATTERNS.subscription.forEach(pattern => {
            if (eventName.includes(pattern.toLowerCase()) || pattern.toLowerCase().includes(eventName)) {
                subscriptionScore++;
            }
        });
    });

    // Return the type with higher score (minimum 2 matches required)
    if (ecommerceScore > subscriptionScore && ecommerceScore >= 2) {
        return 'ecommerce';
    } else if (subscriptionScore > ecommerceScore && subscriptionScore >= 2) {
        return 'subscription';
    }

    return null; // Unable to detect
}

// Confirm Mapping and Process Data
async function confirmMapping() {
    const required = ['mapTimestamp', 'mapUserId', 'mapEventName'];
    const mapping = {};

    let isValid = true;
    required.forEach(id => {
        const value = document.getElementById(id).value;
        if (!value) {
            isValid = false;
            alert(`${id.replace('map', '')} 컬럼을 선택해주세요`);
        }
    });

    if (!isValid) return;

    // Show progress bar
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = '데이터 처리 시작...';

    await updateProgress(progressFill, progressText, 10, '이전 결과 초기화 중...');

    // Clear previous analysis results when processing new data
    AppState.funnelSteps = [];
    AppState.funnelResults = null;
    AppState.retentionResults = null;
    AppState.segmentResults = null;
    AppState.insights = [];
    // Clear subscription analytics state
    AppState.subscriptionKPIs = null;
    AppState.trialAnalysis = null;
    AppState.churnAnalysis = null;
    AppState.paidRetentionResults = null;
    AppState.retentionType = 'activity';

    // Clear UI displays
    document.getElementById('funnelResults').style.display = 'none';
    document.getElementById('retentionResults').style.display = 'none';
    document.getElementById('segmentResults').style.display = 'none';
    document.getElementById('insightsContainer').innerHTML = '';

    const funnelChart = Chart.getChart('funnelChart');
    if (funnelChart) funnelChart.destroy();

    const retentionChart = Chart.getChart('retentionChart');
    if (retentionChart) retentionChart.destroy();

    const segmentChart = Chart.getChart('segmentChart');
    if (segmentChart) segmentChart.destroy();

    await updateProgress(progressFill, progressText, 30, '컬럼 매핑 중...');

    // Build column mapping
    ['mapTimestamp', 'mapUserId', 'mapEventName', 'mapSessionId', 'mapPlatform', 'mapChannel'].forEach(id => {
        const value = document.getElementById(id).value;
        if (value) {
            mapping[id.replace('map', '').toLowerCase()] = value;
        }
    });

    AppState.columnMapping = mapping;

    await updateProgress(progressFill, progressText, 50, '데이터 처리 중...');

    // Process data
    processData();

    // Generate and display data quality report
    const qualityReport = generateDataQualityReport();
    renderDataQualityReport(qualityReport);

    await updateProgress(progressFill, progressText, 70, '이벤트 선택기 설정 중...');

    // Populate event selectors
    populateEventSelectors();

    // Populate segment filters
    populateSegmentFilters();

    await updateProgress(progressFill, progressText, 85, '데이터 유형 감지 중...');

    // Auto-detect dataset type
    const detectedType = detectDatasetType();
    if (detectedType) {
        AppState.detectedType = detectedType;
        const typeName = detectedType === 'ecommerce' ? '이커머스' : '구독 서비스';

        await updateProgress(progressFill, progressText, 90, '분석 수행 중...');

        // If subscription data, calculate subscription-specific analytics
        if (detectedType === 'subscription') {
            calculateSubscriptionKPIs();
            analyzeTrialConversion();
            analyzeChurn();
            calculatePaidRetention();

            // Show Lifecycle Funnel button
            const lifecycleFunnelBtn = document.getElementById('loadLifecycleFunnel');
            if (lifecycleFunnelBtn) lifecycleFunnelBtn.style.display = 'inline-flex';
        }

        await updateProgress(progressFill, progressText, 95, '인사이트 생성 중...');

        // Generate automatic insights based on full dataset
        generateInsights();

        // Render subscription KPIs in UI (will show/hide based on data type)
        renderSubscriptionKPIs();

        // Initialize retention type toggle
        initRetentionTypeToggle();

        await updateProgress(progressFill, progressText, 100, '완료!');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Hide progress bar
        progressContainer.style.display = 'none';

        alert(`데이터가 성공적으로 처리되었습니다!\n\n감지된 데이터 유형: ${typeName}\n퍼널 분석 탭에서 자동으로 템플릿이 적용됩니다.\n\n인사이트 카드 탭에서 자동 생성된 인사이트를 확인하세요!`);
    } else {
        AppState.detectedType = null;

        // Hide subscription KPI section
        const kpiSection = document.getElementById('subscriptionKPISummary');
        if (kpiSection) kpiSection.style.display = 'none';

        // Hide Lifecycle Funnel button
        const lifecycleFunnelBtn = document.getElementById('loadLifecycleFunnel');
        if (lifecycleFunnelBtn) lifecycleFunnelBtn.style.display = 'none';

        await updateProgress(progressFill, progressText, 100, '완료!');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Hide progress bar
        progressContainer.style.display = 'none';

        alert('데이터가 성공적으로 처리되었습니다! 다른 화면으로 이동하여 분석하세요.');
    }
}

// Helper function to update progress
function updateProgress(fillEl, textEl, percent, message) {
    return new Promise(resolve => {
        setTimeout(() => {
            fillEl.style.width = `${percent}%`;
            textEl.textContent = message;
            resolve();
        }, 100);
    });
}

// Process Raw Data
function processData() {
    AppState.processedData = AppState.rawData.map(row => {
        const processed = {
            timestamp: new Date(row[AppState.columnMapping.timestamp]),
            userId: row[AppState.columnMapping.userid],
            eventName: row[AppState.columnMapping.eventname],
        };

        if (AppState.columnMapping.sessionid) {
            processed.sessionId = row[AppState.columnMapping.sessionid];
        }
        if (AppState.columnMapping.platform) {
            processed.platform = row[AppState.columnMapping.platform];
        }
        if (AppState.columnMapping.channel) {
            processed.channel = row[AppState.columnMapping.channel];
        }

        return processed;
    }).filter(row => row.timestamp && !isNaN(row.timestamp.getTime()));

    // Sort by timestamp
    AppState.processedData.sort((a, b) => a.timestamp - b.timestamp);
}

// Populate Event Selectors
function populateEventSelectors() {
    const uniqueEvents = [...new Set(AppState.processedData.map(e => e.eventName))];

    // Funnel step selectors
    const container = document.getElementById('funnelStepsContainer');
    container.innerHTML = '';

    // Cohort event selector
    const cohortSelect = document.getElementById('cohortEvent');
    cohortSelect.innerHTML = '<option value="">이벤트 선택...</option>';
    uniqueEvents.forEach(event => {
        const option = document.createElement('option');
        option.value = event;
        option.textContent = event;
        cohortSelect.appendChild(option);
    });

    // Active events selector
    const activeSelect = document.getElementById('activeEvents');
    activeSelect.innerHTML = '';
    uniqueEvents.forEach(event => {
        const option = document.createElement('option');
        option.value = event;
        option.textContent = event;
        activeSelect.appendChild(option);
    });
}

// Populate Segment Filters
function populateSegmentFilters() {
    // Platform segments
    const platforms = [...new Set(AppState.processedData.map(e => e.platform).filter(p => p))];
    const platformContainer = document.getElementById('platformSegments');
    platformContainer.innerHTML = '';
    platforms.forEach(platform => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" value="${platform}">
            <span>${platform}</span>
        `;
        platformContainer.appendChild(label);
    });

    // Channel segments
    const channels = [...new Set(AppState.processedData.map(e => e.channel).filter(c => c))];
    const channelContainer = document.getElementById('channelSegments');
    channelContainer.innerHTML = '';
    channels.forEach(channel => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" value="${channel}">
            <span>${channel}</span>
        `;
        channelContainer.appendChild(label);
    });

    // Subscription-specific segment dimensions (only show if subscription data)
    const subscriptionControlsEl = document.getElementById('subscriptionSegmentControls');
    const subscriptionDimensionEl = document.getElementById('subscriptionDimension');

    if (subscriptionControlsEl && subscriptionDimensionEl) {
        if (isSubscriptionData()) {
            subscriptionControlsEl.style.display = 'block';
            subscriptionDimensionEl.innerHTML = '<option value="">구독 차원 선택 (선택사항)...</option>';

            // Add trial_days if exists
            if (hasCol('trial_days')) {
                const trialDays = getUniqueColValues('trial_days');
                if (trialDays.length > 0) {
                    const optGroup = document.createElement('optgroup');
                    optGroup.label = '체험 기간 (trial_days)';
                    trialDays.forEach(val => {
                        const opt = document.createElement('option');
                        opt.value = `trial_days:${val}`;
                        opt.textContent = `${val}일`;
                        optGroup.appendChild(opt);
                    });
                    subscriptionDimensionEl.appendChild(optGroup);
                }
            }

            // Add plan if exists
            if (hasCol('plan')) {
                const plans = getUniqueColValues('plan');
                if (plans.length > 0) {
                    const optGroup = document.createElement('optgroup');
                    optGroup.label = '플랜 (plan)';
                    plans.forEach(val => {
                        const opt = document.createElement('option');
                        opt.value = `plan:${val}`;
                        opt.textContent = val;
                        optGroup.appendChild(opt);
                    });
                    subscriptionDimensionEl.appendChild(optGroup);
                }
            }

            // Add cancel_reason if exists
            if (hasCol('cancel_reason')) {
                const reasons = getUniqueColValues('cancel_reason');
                if (reasons.length > 0) {
                    const optGroup = document.createElement('optgroup');
                    optGroup.label = '해지 사유 (cancel_reason)';
                    reasons.forEach(val => {
                        const opt = document.createElement('option');
                        opt.value = `cancel_reason:${val}`;
                        opt.textContent = val;
                        optGroup.appendChild(opt);
                    });
                    subscriptionDimensionEl.appendChild(optGroup);
                }
            }
        } else {
            subscriptionControlsEl.style.display = 'none';
        }
    }
}

// Load Funnel Template
function loadFunnelTemplate(type) {
    const templates = {
        ecommerce: ['view_item', 'add_to_cart', 'begin_checkout', 'purchase'],
        subscription: ['app_open', 'signup', 'onboarding_complete', 'start_trial', 'subscribe'],
        lifecycle: ['app_open', 'signup', 'onboarding_complete', 'start_trial', 'subscribe', 'renew']
    };

    const steps = templates[type] || templates.ecommerce;
    createFunnelSteps(steps);
}

// Create Funnel Steps UI
function createFunnelSteps(steps) {
    const container = document.getElementById('funnelStepsContainer');
    container.innerHTML = '';

    const uniqueEvents = [...new Set(AppState.processedData.map(e => e.eventName))];

    steps.forEach((step, index) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'funnel-step';

        const select = document.createElement('select');
        select.className = 'mapping-select';
        select.innerHTML = '<option value="">이벤트 선택...</option>';
        uniqueEvents.forEach(event => {
            const option = document.createElement('option');
            option.value = event;
            option.textContent = event;
            if (event === step) option.selected = true;
            select.appendChild(option);
        });

        stepDiv.innerHTML = `
            <div class="step-number">${index + 1}</div>
        `;
        stepDiv.appendChild(select);

        if (index > 0) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-step';
            removeBtn.textContent = '✕';
            removeBtn.onclick = () => stepDiv.remove();
            stepDiv.appendChild(removeBtn);
        }

        container.appendChild(stepDiv);
    });
}

// Calculate Funnel
function calculateFunnel() {
    const stepSelects = document.querySelectorAll('#funnelStepsContainer select');
    const steps = Array.from(stepSelects).map(s => s.value).filter(v => v);

    if (steps.length < 2) {
        alert('최소 2개 이상의 퍼널 단계를 선택해주세요');
        return;
    }

    AppState.funnelSteps = steps;

    // Calculate funnel metrics
    const funnelData = [];
    const usersByStep = {};

    steps.forEach((step, index) => {
        if (index === 0) {
            // First step: all users who performed this event
            const users = new Set(AppState.processedData.filter(e => e.eventName === step).map(e => e.userId));
            usersByStep[step] = users;
            funnelData.push({
                step: step,
                stepNumber: index + 1,
                users: users.size,
                conversionRate: 100,
                dropOff: 0
            });
        } else {
            // Subsequent steps: users from previous step who also performed this event
            const prevStep = steps[index - 1];
            const prevUsers = usersByStep[prevStep];

            const currentUsers = new Set(
                AppState.processedData
                    .filter(e => e.eventName === step && prevUsers.has(e.userId))
                    .map(e => e.userId)
            );

            usersByStep[step] = currentUsers;
            const conversionRate = prevUsers.size > 0 ? (currentUsers.size / prevUsers.size) * 100 : 0;
            const dropOff = prevUsers.size - currentUsers.size;

            funnelData.push({
                step: step,
                stepNumber: index + 1,
                users: currentUsers.size,
                conversionRate: conversionRate,
                dropOff: dropOff
            });
        }
    });

    // Calculate time between steps
    funnelData.forEach((stepData, index) => {
        if (index > 0) {
            const times = calculateMedianTimeBetweenSteps(steps[index - 1], steps[index], usersByStep[steps[index]]);
            stepData.medianTime = times.median;
        }
    });

    AppState.funnelResults = funnelData;
    displayFunnelResults();
    generateInsights();
}

// Calculate Median Time Between Steps
function calculateMedianTimeBetweenSteps(step1, step2, userSet) {
    const times = [];

    userSet.forEach(userId => {
        const step1Events = AppState.processedData.filter(e => e.userId === userId && e.eventName === step1);
        const step2Events = AppState.processedData.filter(e => e.userId === userId && e.eventName === step2);

        if (step1Events.length > 0 && step2Events.length > 0) {
            const time1 = step1Events[0].timestamp.getTime();
            const time2 = step2Events.find(e => e.timestamp.getTime() > time1);
            if (time2) {
                const diff = (time2.timestamp.getTime() - time1) / 1000 / 60; // minutes
                times.push(diff);
            }
        }
    });

    times.sort((a, b) => a - b);
    const median = times.length > 0 ? times[Math.floor(times.length / 2)] : 0;

    return { median, times };
}

// Display Funnel Results
function displayFunnelResults() {
    const resultsDiv = document.getElementById('funnelResults');
    resultsDiv.style.display = 'block';

    // Create table
    const table = document.getElementById('funnelTable');
    let html = `
        <thead>
            <tr>
                <th>단계</th>
                <th>이벤트</th>
                <th>사용자 수</th>
                <th>전환율</th>
                <th>이탈 수</th>
                <th>중간 소요 시간</th>
            </tr>
        </thead>
        <tbody>
    `;

    AppState.funnelResults.forEach(row => {
        html += `
            <tr>
                <td>${row.stepNumber}</td>
                <td>${row.step}</td>
                <td>${row.users.toLocaleString()}</td>
                <td>${row.conversionRate.toFixed(1)}%</td>
                <td>${row.dropOff.toLocaleString()}</td>
                <td>${row.medianTime ? formatTime(row.medianTime) : '-'}</td>
            </tr>
        `;
    });

    html += '</tbody>';
    table.innerHTML = html;

    // Render chart
    renderFunnelChart();
}

// Format Time
function formatTime(minutes) {
    if (minutes < 60) {
        return `${Math.round(minutes)}분`;
    } else if (minutes < 1440) {
        return `${(minutes / 60).toFixed(1)}시간`;
    } else {
        return `${(minutes / 1440).toFixed(1)}일`;
    }
}

// Calculate Retention
function calculateRetention() {
    // Check if Paid Retention mode is selected
    if (AppState.retentionType === 'paid' && isSubscriptionData()) {
        // Use pre-calculated Paid Retention
        const paidRetention = AppState.paidRetentionResults || calculatePaidRetention();
        if (!paidRetention || paidRetention.length === 0) {
            alert('Paid Retention 데이터가 없습니다. subscribe 이벤트가 필요합니다.');
            return;
        }

        // Transform paid retention data for display
        AppState.retentionResults = paidRetention.map(cohort => ({
            cohortDate: cohort.cohortDate,
            cohortSize: cohort.cohortSize,
            days: {
                D0: cohort.days.D0 || 100,
                D1: cohort.days.D7 || 0, // Map D7 to D1 position for display
                D7: cohort.days.D7 || 0,
                D14: cohort.days.D14 || 0,
                D30: cohort.days.D30 || 0,
                D60: cohort.days.D60 || 0,
                D90: cohort.days.D90 || 0
            }
        }));

        displayPaidRetentionResults();
        generateInsights();
        return;
    }

    // Activity Retention (original logic)
    const cohortEvent = document.getElementById('cohortEvent').value;
    const activeEventOptions = document.getElementById('activeEvents').selectedOptions;
    const activeEvents = Array.from(activeEventOptions).map(opt => opt.value);

    if (!cohortEvent) {
        alert('코호트 이벤트를 선택해주세요');
        return;
    }
    if (activeEvents.length === 0) {
        alert('최소 1개 이상의 활성 이벤트를 선택해주세요');
        return;
    }

    // Build cohorts by date
    const cohorts = {};

    AppState.processedData.forEach(event => {
        if (event.eventName === cohortEvent) {
            const cohortDate = event.timestamp.toISOString().split('T')[0];
            if (!cohorts[cohortDate]) {
                cohorts[cohortDate] = new Set();
            }
            cohorts[cohortDate].add(event.userId);
        }
    });

    // Calculate retention for each cohort
    const retentionMatrix = [];

    Object.entries(cohorts).forEach(([cohortDate, userSet]) => {
        const cohortStartDate = new Date(cohortDate);
        const retention = { cohortDate, cohortSize: userSet.size, days: {} };

        for (let day = 0; day <= 14; day++) {
            const targetDate = new Date(cohortStartDate);
            targetDate.setDate(targetDate.getDate() + day);
            const targetDateStr = targetDate.toISOString().split('T')[0];

            const activeUsers = AppState.processedData.filter(e => {
                const eventDate = e.timestamp.toISOString().split('T')[0];
                return eventDate === targetDateStr &&
                    activeEvents.includes(e.eventName) &&
                    userSet.has(e.userId);
            });

            const uniqueActive = new Set(activeUsers.map(e => e.userId));
            const retentionRate = (uniqueActive.size / userSet.size) * 100;
            retention.days[`D${day}`] = retentionRate;
        }

        retentionMatrix.push(retention);
    });

    AppState.retentionResults = retentionMatrix;
    displayRetentionResults();
    generateInsights();
}

// Display Paid Retention Results (specialized for subscription data)
function displayPaidRetentionResults() {
    const resultsDiv = document.getElementById('retentionResults');
    resultsDiv.style.display = 'block';

    // Calculate averages for D7, D14, D30
    const d7Avg = AppState.retentionResults.reduce((sum, r) => sum + (r.days.D7 || 0), 0) / AppState.retentionResults.length;
    const d14Avg = AppState.retentionResults.reduce((sum, r) => sum + (r.days.D14 || 0), 0) / AppState.retentionResults.length;
    const d30Avg = AppState.retentionResults.reduce((sum, r) => sum + (r.days.D30 || 0), 0) / AppState.retentionResults.length;

    document.getElementById('d1Retention').textContent = d7Avg.toFixed(1) + '% (D7)';
    document.getElementById('d7Retention').textContent = d14Avg.toFixed(1) + '% (D14)';
    document.getElementById('d14Retention').textContent = d30Avg.toFixed(1) + '% (D30)';

    // Build matrix table for paid retention
    const table = document.getElementById('retentionMatrix');
    let html = '<thead><tr><th>구독 시작일</th><th>규모</th><th>D0</th><th>D7</th><th>D14</th><th>D30</th><th>D60</th><th>D90</th></tr></thead><tbody>';

    AppState.retentionResults.slice(0, 10).forEach(cohort => {
        html += `<tr><td class="cohort-header">${cohort.cohortDate}</td><td>${cohort.cohortSize}</td>`;
        ['D0', 'D7', 'D14', 'D30', 'D60', 'D90'].forEach(day => {
            const rate = cohort.days[day] || 0;
            const cellClass = rate >= 80 ? 'high' : rate >= 50 ? 'medium' : 'low';
            html += `<td class="retention-cell ${cellClass}">${rate.toFixed(0)}%</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody>';
    table.innerHTML = html;

    // Render chart (using first cohort's data for curve)
    renderRetentionChart();
}

// Display Retention Results
function displayRetentionResults() {
    const resultsDiv = document.getElementById('retentionResults');
    resultsDiv.style.display = 'block';

    // Calculate average D1, D7, D14
    const d1Avg = AppState.retentionResults.reduce((sum, r) => sum + (r.days.D1 || 0), 0) / AppState.retentionResults.length;
    const d7Avg = AppState.retentionResults.reduce((sum, r) => sum + (r.days.D7 || 0), 0) / AppState.retentionResults.length;
    const d14Avg = AppState.retentionResults.reduce((sum, r) => sum + (r.days.D14 || 0), 0) / AppState.retentionResults.length;

    document.getElementById('d1Retention').textContent = d1Avg.toFixed(1) + '%';
    document.getElementById('d7Retention').textContent = d7Avg.toFixed(1) + '%';
    document.getElementById('d14Retention').textContent = d14Avg.toFixed(1) + '%';

    // Build matrix table
    const table = document.getElementById('retentionMatrix');
    let html = '<thead><tr><th>코호트 날짜</th><th>규모</th>';
    for (let day = 0; day <= 14; day++) {
        html += `<th>D${day}</th>`;
    }
    html += '</tr></thead><tbody>';

    AppState.retentionResults.slice(0, 10).forEach(cohort => {
        html += `<tr><td class="cohort-header">${cohort.cohortDate}</td><td>${cohort.cohortSize}</td>`;
        for (let day = 0; day <= 14; day++) {
            const rate = cohort.days[`D${day}`] || 0;
            const cellClass = rate >= 50 ? 'high' : rate >= 25 ? 'medium' : 'low';
            html += `<td class="retention-cell ${cellClass}">${rate.toFixed(0)}%</td>`;
        }
        html += '</tr>';
    });

    html += '</tbody>';
    table.innerHTML = html;

    // Render chart
    renderRetentionChart();
}

// Compare Segments
function compareSegments() {
    const platformCheckboxes = document.querySelectorAll('#platformSegments input:checked');
    const channelCheckboxes = document.querySelectorAll('#channelSegments input:checked');

    const platforms = Array.from(platformCheckboxes).map(cb => cb.value);
    const channels = Array.from(channelCheckboxes).map(cb => cb.value);

    if (platforms.length === 0 && channels.length === 0) {
        alert('비교할 세그먼트를 최소 1개 선택해주세요');
        return;
    }

    if (!AppState.funnelSteps || AppState.funnelSteps.length === 0) {
        alert('먼저 퍼널을 계산해주세요');
        return;
    }

    // Get options
    const strictOrder = document.getElementById('strictOrder')?.checked || false;
    const baselineType = document.getElementById('baselineSegment')?.value || 'all';

    // Calculate full data funnel for baseline
    const allFunnel = calculateSegmentFunnel(AppState.processedData, AppState.funnelSteps, strictOrder);
    const baselineConversion = allFunnel[allFunnel.length - 1].conversionRate;

    const segments = [];

    // Platform segments
    platforms.forEach(platform => {
        const segmentData = AppState.processedData.filter(e => e.platform === platform);
        const segmentFunnel = calculateSegmentFunnel(segmentData, AppState.funnelSteps, strictOrder);

        const finalStep = segmentFunnel[segmentFunnel.length - 1];
        const conversion = finalStep.conversionRate;
        const uplift = conversion - baselineConversion;

        // Calculate p-value
        const pValue = calculatePValue(
            finalStep.userCount,
            segmentFunnel[0].userCount,
            allFunnel[allFunnel.length - 1].userCount,
            allFunnel[0].userCount
        );

        segments.push({
            name: `플랫폼: ${platform}`,
            type: 'platform',
            population: segmentFunnel[0].userCount,
            conversion,
            uplift,
            pValue,
            stepByStep: segmentFunnel
        });
    });

    // Channel segments
    channels.forEach(channel => {
        const segmentData = AppState.processedData.filter(e => e.channel === channel);
        const segmentFunnel = calculateSegmentFunnel(segmentData, AppState.funnelSteps, strictOrder);

        const finalStep = segmentFunnel[segmentFunnel.length - 1];
        const conversion = finalStep.conversionRate;
        const uplift = conversion - baselineConversion;

        // Calculate p-value
        const pValue = calculatePValue(
            finalStep.userCount,
            segmentFunnel[0].userCount,
            allFunnel[allFunnel.length - 1].userCount,
            allFunnel[0].userCount
        );

        segments.push({
            name: `채널: ${channel}`,
            type: 'channel',
            population: segmentFunnel[0].userCount,
            conversion,
            uplift,
            pValue,
            stepByStep: segmentFunnel
        });
    });

    AppState.segmentResults = segments;
    displaySegmentResults();
    generateInsights();
}

// Calculate Segment Conversion (legacy function - kept for compatibility)
function calculateSegmentConversion(data, steps) {
    if (steps.length < 2) return 0;

    const firstStepUsers = new Set(data.filter(e => e.eventName === steps[0]).map(e => e.userId));
    const lastStepUsers = new Set(data.filter(e => e.eventName === steps[steps.length - 1]).map(e => e.userId));

    const convertedUsers = [...lastStepUsers].filter(u => firstStepUsers.has(u));

    return firstStepUsers.size > 0 ? (convertedUsers.length / firstStepUsers.size) * 100 : 0;
}

// Display Segment Results
function displaySegmentResults() {
    const resultsDiv = document.getElementById('segmentResults');
    resultsDiv.style.display = 'block';

    // Create table
    const table = document.getElementById('segmentTable');
    let html = `
        <thead>
            <tr>
                <th>세그먼트</th>
                <th>모집단</th>
                <th>전환율</th>
                <th>Uplift</th>
                <th>p-value</th>
                <th>유의성</th>
            </tr>
        </thead>
        <tbody>
    `;

    AppState.segmentResults.forEach(segment => {
        const upliftSign = segment.uplift >= 0 ? '+' : '';
        const upliftClass = segment.uplift >= 5 ? 'positive' : segment.uplift <= -5 ? 'negative' : 'neutral';
        const significance = segment.pValue < 0.05 ? '✓ 유의미' : '- 미미';
        const sigClass = segment.pValue < 0.05 ? 'significant' : 'not-significant';

        html += `
            <tr>
                <td>${segment.name}</td>
                <td>${segment.population?.toLocaleString() || 'N/A'}</td>
                <td>${segment.conversion.toFixed(1)}%</td>
                <td class="${upliftClass}">${upliftSign}${segment.uplift?.toFixed(1) || '0.0'}%p</td>
                <td>${segment.pValue?.toFixed(4) || 'N/A'}</td>
                <td class="${sigClass}">${significance}</td>
            </tr>
        `;
    });

    html += '</tbody>';
    table.innerHTML = html;

    // Render chart
    renderSegmentChart();
}

// ===== Full Data Analysis Functions for Automatic Insights =====

// Calculate funnel based on detected type using full dataset
function calculateFullDataFunnel() {
    if (!AppState.detectedType || !AppState.processedData || AppState.processedData.length === 0) {
        return null;
    }

    const templates = {
        ecommerce: ['view_item', 'add_to_cart', 'begin_checkout', 'purchase'],
        subscription: ['app_open', 'signup', 'onboarding_complete', 'start_trial', 'subscribe']
    };

    const steps = templates[AppState.detectedType];
    if (!steps) return null;

    // Check if events exist in data
    const availableEvents = [...new Set(AppState.processedData.map(e => e.eventName))];
    const validSteps = steps.filter(step =>
        availableEvents.some(event => event.toLowerCase().includes(step.toLowerCase()))
    );

    if (validSteps.length < 2) return null;

    // Calculate funnel similar to calculateFunnel
    const funnelData = [];
    const usersByStep = {};

    validSteps.forEach((step, index) => {
        if (index === 0) {
            const stepEvents = AppState.processedData.filter(event =>
                event.eventName && event.eventName.toLowerCase().includes(step.toLowerCase())
            );
            usersByStep[step] = new Set(stepEvents.map(e => e.userId));

            funnelData.push({
                step: step,
                stepNumber: 1,
                users: usersByStep[step].size,
                conversionRate: 100,
                dropOff: 0
            });
        } else {
            const prevUsers = usersByStep[validSteps[index - 1]];
            const stepEvents = AppState.processedData.filter(event =>
                event.eventName && event.eventName.toLowerCase().includes(step.toLowerCase())
            );

            const currentUsers = new Set(
                stepEvents
                    .filter(event => prevUsers.has(event.userId))
                    .map(e => e.userId)
            );

            usersByStep[step] = currentUsers;
            const conversionRate = prevUsers.size > 0 ? (currentUsers.size / prevUsers.size) * 100 : 0;
            const dropOff = prevUsers.size - currentUsers.size;

            funnelData.push({
                step: step,
                stepNumber: index + 1,
                users: currentUsers.size,
                conversionRate: conversionRate,
                dropOff: dropOff
            });
        }
    });

    return funnelData.length > 1 ? funnelData : null;
}

// Calculate segments for all platforms and channels using full dataset
function calculateFullDataSegments() {
    if (!AppState.processedData || AppState.processedData.length === 0 || !AppState.detectedType) {
        return null;
    }

    const segments = [];

    // Get template steps
    const templates = {
        ecommerce: ['view_item', 'add_to_cart', 'begin_checkout', 'purchase'],
        subscription: ['app_open', 'signup', 'onboarding_complete', 'start_trial', 'subscribe']
    };
    const steps = templates[AppState.detectedType];
    if (!steps) return null;

    // Platform segments
    const platforms = [...new Set(AppState.processedData.map(e => e.platform).filter(Boolean))];
    platforms.forEach(platform => {
        const platformData = AppState.processedData.filter(e => e.platform === platform);
        if (platformData.length > 0) {
            const conversion = calculateConversionRate(platformData, steps);
            if (conversion !== null) {
                segments.push({ type: 'platform', name: platform, conversion });
            }
        }
    });

    // Channel segments
    const channels = [...new Set(AppState.processedData.map(e => e.channel).filter(Boolean))];
    channels.forEach(channel => {
        const channelData = AppState.processedData.filter(e => e.channel === channel);
        if (channelData.length > 0) {
            const conversion = calculateConversionRate(channelData, steps);
            if (conversion !== null) {
                segments.push({ type: 'channel', name: channel, conversion });
            }
        }
    });

    return segments.length > 0 ? segments : null;
}

// Helper function to calculate conversion rate for a dataset
function calculateConversionRate(data, steps) {
    if (!data || data.length === 0 || !steps || steps.length < 2) return null;

    const firstStepUsers = new Set(
        data.filter(e => e.eventName && e.eventName.toLowerCase().includes(steps[0].toLowerCase()))
            .map(e => e.userId)
    );

    const lastStepUsers = new Set(
        data.filter(e => e.eventName && e.eventName.toLowerCase().includes(steps[steps.length - 1].toLowerCase()))
            .map(e => e.userId)
    );

    const completedUsers = [...lastStepUsers].filter(userId => firstStepUsers.has(userId));

    return firstStepUsers.size > 0 ? (completedUsers.length / firstStepUsers.size) * 100 : 0;
}

// Calculate retention using most common event as cohort event
function calculateFullDataRetention() {
    if (!AppState.processedData || AppState.processedData.length === 0) {
        return null;
    }

    // Find most common event to use as cohort event
    const eventCounts = {};
    AppState.processedData.forEach(e => {
        if (e.eventName) {
            eventCounts[e.eventName] = (eventCounts[e.eventName] || 0) + 1;
        }
    });

    if (Object.keys(eventCounts).length === 0) return null;

    const cohortEvent = Object.keys(eventCounts).reduce((a, b) =>
        eventCounts[a] > eventCounts[b] ? a : b
    );

    // Simple retention calculation
    const cohortUsers = {};
    AppState.processedData
        .filter(event => event.eventName === cohortEvent)
        .forEach(event => {
            const dateKey = event.timestamp.toISOString().split('T')[0];
            if (!cohortUsers[dateKey]) {
                cohortUsers[dateKey] = new Set();
            }
            cohortUsers[dateKey].add(event.userId);
        });

    const cohortDates = Object.keys(cohortUsers).sort();
    if (cohortDates.length === 0) return null;

    const retentionData = [];

    cohortDates.slice(0, 7).forEach(cohortDate => {
        const cohortSet = cohortUsers[cohortDate];
        const cohortTimestamp = new Date(cohortDate);
        const retention = { cohort: cohortDate, size: cohortSet.size, days: {} };

        for (let day = 0; day <= 14; day++) {
            const targetDate = new Date(cohortTimestamp);
            targetDate.setDate(targetDate.getDate() + day);
            const targetDateKey = targetDate.toISOString().split('T')[0];

            const activeUsers = AppState.processedData.filter(event =>
                cohortSet.has(event.userId) &&
                event.timestamp.toISOString().split('T')[0] === targetDateKey
            );

            const activeUserSet = new Set(activeUsers.map(e => e.userId));
            retention.days[`D${day}`] = cohortSet.size > 0 ? (activeUserSet.size / cohortSet.size) * 100 : 0;
        }

        retentionData.push(retention);
    });

    return retentionData.length > 0 ? retentionData : null;
}

// Generate Insights
function generateInsights() {
    const insights = [];

    // Calculate full dataset analytics for automatic insights
    const fullFunnelResults = calculateFullDataFunnel();
    const fullSegmentResults = calculateFullDataSegments();
    const fullRetentionResults = calculateFullDataRetention();

    // Insight 1: Maximum leakage step (using full data)
    if (fullFunnelResults && fullFunnelResults.length > 1) {
        const lowestConversion = fullFunnelResults.slice(1).reduce((min, step) =>
            step.conversionRate < min.conversionRate ? step : min
        );

        insights.push({
            type: 'warning',
            icon: '⚠️',
            title: '최대 이탈 지점 발견',
            body: `가장 큰 이탈이 \"${lowestConversion.step}\" 단계에서 발생합니다. 전환율은 ${lowestConversion.conversionRate.toFixed(1)}%이며, 이 단계에서 ${lowestConversion.dropOff}명의 사용자가 이탈했습니다.`,
            metric: lowestConversion.conversionRate.toFixed(1) + '%',
            recommendations: [
                '이 단계에서 사용자 경험 단순화',
                '진행 상황 표시기를 추가하여 완료 유도',
                '다양한 흐름에 대한 A/B 테스트 고려'
            ]
        });
    }

    // Insight 2: Platform performance gap (using full data segments)
    if (fullSegmentResults && fullSegmentResults.length >= 2) {
        const platformSegments = fullSegmentResults.filter(s => s.type === 'platform');
        if (platformSegments.length >= 2) {
            platformSegments.sort((a, b) => b.conversion - a.conversion);
            const gap = platformSegments[0].conversion - platformSegments[platformSegments.length - 1].conversion;

            if (gap > 10) {
                insights.push({
                    type: 'danger',
                    icon: '🚨',
                    title: '플랫폼 성과 격차 발견',
                    body: `${platformSegments[platformSegments.length - 1].name}이(가) ${platformSegments[0].name}보다 ${gap.toFixed(1)}%p 낮은 전환율을 보입니다. 이는 플랫폼별 문제를 나타냅니다.`,
                    metric: gap.toFixed(1) + '%p 격차',
                    recommendations: [
                        '플랫폼별 버그 또는 UX 문제 조사',
                        '성능이 낮은 플랫폼에서 흐름 테스트',
                        '플랫폼별 최적화 고려'
                    ]
                });
            }
        }
    }

    // Insight 3: Channel gap (using full data segments)
    if (fullSegmentResults && fullSegmentResults.length >= 2) {
        const channelSegments = fullSegmentResults.filter(s => s.type === 'channel');
        if (channelSegments.length >= 2) {
            channelSegments.sort((a, b) => b.conversion - a.conversion);
            const gap = channelSegments[0].conversion - channelSegments[channelSegments.length - 1].conversion;

            if (gap > 15) {
                insights.push({
                    type: 'warning',
                    icon: '📢',
                    title: '채널 성과 편차 크게 발견',
                    body: `${channelSegments[0].name}이(가) ${channelSegments[channelSegments.length - 1].name}보다 ${gap.toFixed(1)}%p 더 나은 성과를 보입니다. 예산 재분배를 고려하세요.`,
                    metric: gap.toFixed(1) + '%p 차이',
                    recommendations: [
                        '상위 성과 채널에 대한 투자 증가',
                        '채널별 사용자 품질 차이 분석',
                        '채널별 랜딩 페이지 경험 검토'
                    ]
                });
            }
        }
    }

    // Insight 4: Time to conversion warning
    const timeToConversion = calculateFullDataTimeToConversion(fullFunnelResults?.validSteps || (fullFunnelResults ? fullFunnelResults.map(f => f.step) : null));
    if (timeToConversion && timeToConversion.completedUsersCount >= 10) {
        const medianHours = (timeToConversion.medianMinutes / 60).toFixed(1);
        const p90Hours = (timeToConversion.p90Minutes / 60).toFixed(1);
        const medianDays = (timeToConversion.medianMinutes / 1440).toFixed(1);

        // 기준: median > 24시간이면 경고
        if (timeToConversion.medianMinutes > 1440) {
            insights.push({
                type: 'warning',
                icon: '⏱️',
                title: '긴 전환 소요 시간',
                body: `전환된 사용자들의 중간 소요 시간이 ${medianDays}일(${medianHours}시간)입니다. 90% 사용자는 ${p90Hours}시간 이내에 전환했습니다. 전환 경로가 너무 길거나 마찰이 있을 수 있습니다.`,
                metric: `Median: ${medianHours}h`,
                recommendations: [
                    '전환 경로를 단순화하고 불필요한 단계 제거',
                    '카트 저장 기능으로 나중에 돌아올 수 있게 지원',
                    '리타게팅 캠페인으로 전환 독려'
                ]
            });
        } else if (timeToConversion.medianMinutes < 60 && timeToConversion.medianMinutes > 0) {
            // 빠른 전환은 positive insight
            insights.push({
                type: 'success',
                icon: '⚡',
                title: '빠른 전환 프로세스',
                body: `사용자들이 평균 ${medianHours}시간 만에 빠르게 전환하고 있습니다. 이는 효율적인 전환 퍼널을 나타냅니다.`,
                metric: `Median: ${medianHours}h`,
                recommendations: [
                    '현재의 빠른 전환 프로세스 유지',
                    '성공 요인을 분석하여 다른 제품에 적용'
                ]
            });
        }
    }

    // Insight 5: Low D1 retention (using full data retention)
    if (fullRetentionResults && fullRetentionResults.length > 0) {
        const avgD1 = fullRetentionResults.reduce((sum, r) => sum + (r.days.D1 || 0), 0) / fullRetentionResults.length;
        if (avgD1 < 25) {
            insights.push({
                type: 'danger',
                icon: '📉',
                title: 'D1 리텐션 낮음 경고',
                body: `D1 리텐션이 ${avgD1.toFixed(1)}%에 불과하며, 이는 건강한 임계값 25%보다 낮습니다. 사용자가 첫날 이후 돌아오지 않고 있습니다.`,
                metric: avgD1.toFixed(1) + '%',
                recommendations: [
                    '온보딩을 개선하여 빠르게 가치 입증',
                    '개인화된 D1 참여 알림 발송',
                    '첫 세션에서 빠른 성과 또는 업적 구현'
                ]
            });
        }
    }

    // Insight 6: Steepest retention drop (using full data retention)
    if (fullRetentionResults && fullRetentionResults.length > 0) {
        const avgByDay = {};
        for (let day = 0; day <= 14; day++) {
            avgByDay[day] = fullRetentionResults.reduce((sum, r) => sum + (r.days[`D${day}`] || 0), 0) / fullRetentionResults.length;
        }

        let maxDrop = 0;
        let maxDropDay = 0;
        for (let day = 1; day <= 14; day++) {
            const drop = avgByDay[day - 1] - avgByDay[day];
            if (drop > maxDrop) {
                maxDrop = drop;
                maxDropDay = day;
            }
        }

        if (maxDrop > 5) {
            insights.push({
                type: 'warning',
                icon: '📊',
                title: '가장 큰 리텐션 하락 식별',
                body: `가장 큰 리텐션 하락(${maxDrop.toFixed(1)}%p)이 Day ${maxDropDay - 1}과 Day ${maxDropDay} 사이에 발생합니다. 이것은 중요한 개입 지점입니다.`,
                metric: `D${maxDropDay - 1} → D${maxDropDay}`,
                recommendations: [
                    `Day ${maxDropDay - 1}에 참여 캠페인 시작`,
                    '이 시점에 새로운 콘텐츠 또는 기능 도입',
                    '이탈한 사용자를 대상으로 이유 파악을 위한 설문조사'
                ]
            });
        }
    }

    // Insight 7: Best performing segment (using full data segments)
    if (fullSegmentResults && fullSegmentResults.length > 0) {
        const bestSegment = fullSegmentResults.reduce((best, seg) =>
            seg.conversion > best.conversion ? seg : best
        );

        if (bestSegment.conversion > 10) {
            insights.push({
                type: 'success',
                icon: '✨',
                title: '최고 성과 세그먼트',
                body: `${bestSegment.name}이(가) ${bestSegment.conversion.toFixed(1)}% 전환율로 강력한 성과를 보입니다. 이 세그먼트는 모범 사례를 보여줍니다.`,
                metric: bestSegment.conversion.toFixed(1) + '%',
                recommendations: [
                    '이 세그먼트를 성공적으로 만드는 요소 분석',
                    '다른 세그먼트에 학습 내용 적용',
                    '유사한 오디언스 프로필에 대한 투자 확대'
                ]
            });
        }
    }

    // ===== SUBSCRIPTION-SPECIFIC INSIGHTS =====
    if (isSubscriptionData()) {
        // Calculate subscription analytics if not already done
        const kpis = AppState.subscriptionKPIs || calculateSubscriptionKPIs();
        const trialAnalysis = AppState.trialAnalysis || analyzeTrialConversion();
        const churnAnalysis = AppState.churnAnalysis || analyzeChurn();
        const paidRetention = AppState.paidRetentionResults || calculatePaidRetention();

        // Insight S1: Trial → Subscribe conversion rate warning
        if (trialAnalysis && trialAnalysis.overall) {
            const convRate = trialAnalysis.overall.conversion_rate;
            if (convRate < 35 && trialAnalysis.overall.trial_users >= 30) {
                insights.push({
                    type: 'warning',
                    icon: '🎯',
                    title: '체험 → 구독 전환율 개선 필요',
                    body: `체험판 사용자의 ${convRate.toFixed(1)}%만 유료 구독으로 전환합니다 (n=${trialAnalysis.overall.trial_users}). 업계 평균 35-50%를 목표로 개선이 필요합니다.`,
                    metric: convRate.toFixed(1) + '%',
                    recommendations: [
                        '체험 기간 중 핵심 기능 체험 유도',
                        '체험 종료 전 리마인더 및 혜택 제공',
                        '온보딩 플로우 개선으로 가치 빠른 전달'
                    ]
                });
            }
        }

        // Insight S2: Slow conversion time warning
        if (trialAnalysis && trialAnalysis.overall && trialAnalysis.overall.median_hours) {
            const medianDays = trialAnalysis.overall.median_hours / 24;
            if (medianDays > 10) {
                insights.push({
                    type: 'warning',
                    icon: '⏱️',
                    title: '구독 결정 지연',
                    body: `체험 시작 후 구독까지 중간값 ${medianDays.toFixed(1)}일이 소요됩니다. 결정 시간이 길어 이탈 위험이 있습니다.`,
                    metric: `${medianDays.toFixed(1)}일`,
                    recommendations: [
                        '체험 기간 단축 테스트 (7일 vs 14일)',
                        '조기 전환 인센티브 제공',
                        '체험 중 가치 입증 포인트 추가'
                    ]
                });
            }
        }

        // Insight S3: Payment failure warning
        if (kpis && kpis.payment_failed_events > 0) {
            const totalPaymentAttempts = kpis.subscribe_events + kpis.renew_events + kpis.payment_failed_events;
            const failureRate = totalPaymentAttempts > 0 ? (kpis.payment_failed_events / totalPaymentAttempts) * 100 : 0;
            if (failureRate >= 10) {
                insights.push({
                    type: 'danger',
                    icon: '💳',
                    title: '결제 실패율 높음',
                    body: `결제 시도 중 ${failureRate.toFixed(1)}%가 실패했습니다 (${kpis.payment_failed_events}건). 이는 잠재적 매출 손실을 의미합니다.`,
                    metric: failureRate.toFixed(1) + '%',
                    recommendations: [
                        '결제 수단 업데이트 리마인더 발송',
                        '다양한 결제 수단 지원',
                        '결제 실패 시 즉시 재시도 로직 구현'
                    ]
                });
            }
        }

        // Insight S4: High churn rate warning
        if (churnAnalysis && churnAnalysis.churn_rate_paid > 20) {
            insights.push({
                type: 'danger',
                icon: '📉',
                title: '유료 구독 해지율 높음',
                body: `유료 사용자의 ${churnAnalysis.churn_rate_paid.toFixed(1)}%가 해지했습니다 (${churnAnalysis.churn_users}명). 유지 전략 개선이 시급합니다.`,
                metric: churnAnalysis.churn_rate_paid.toFixed(1) + '%',
                recommendations: [
                    '해지 직전 사용자 식별 및 개입',
                    '해지 사유 분석 후 맞춤 대응',
                    '로열티 프로그램 또는 장기 할인 제공'
                ]
            });
        }

        // Insight S5: Cancel reason analysis
        if (churnAnalysis && churnAnalysis.cancel_reason_top && churnAnalysis.cancel_reason_top.length > 0) {
            const topReason = churnAnalysis.cancel_reason_top[0];
            if (topReason.reason !== 'Unknown' && topReason.share > 20) {
                let recommendations = [];
                const reasonLower = topReason.reason.toLowerCase();

                if (reasonLower.includes('expensive') || reasonLower.includes('price') || reasonLower.includes('cost')) {
                    recommendations = [
                        '가격 대비 가치 커뮤니케이션 강화',
                        '저가 플랜 또는 다운그레이드 옵션 제공',
                        'ROI 사례 및 성공 스토리 공유'
                    ];
                } else if (reasonLower.includes('feature') || reasonLower.includes('function')) {
                    recommendations = [
                        '기능 로드맵 공개 및 피드백 수집',
                        '요청 기능 우선순위 조정',
                        '대안 기능 또는 워크어라운드 안내'
                    ];
                } else {
                    recommendations = [
                        '해지 사유 심층 인터뷰 진행',
                        '해지 방어 오퍼 테스트',
                        '서비스 개선점 도출 및 반영'
                    ];
                }

                insights.push({
                    type: 'warning',
                    icon: '🔍',
                    title: `주요 해지 사유: ${topReason.reason}`,
                    body: `해지 사용자의 ${topReason.share.toFixed(0)}%가 "${topReason.reason}"을(를) 이유로 들었습니다.`,
                    metric: `${topReason.share.toFixed(0)}%`,
                    recommendations: recommendations
                });
            }
        }

        // Insight S6: Paid Retention warning
        if (paidRetention && paidRetention.length > 0) {
            const avgD7 = paidRetention.reduce((sum, r) => sum + (r.days.D7 || 0), 0) / paidRetention.length;
            const avgD30 = paidRetention.reduce((sum, r) => sum + (r.days.D30 || 0), 0) / paidRetention.length;

            if (avgD7 < 70) {
                insights.push({
                    type: 'danger',
                    icon: '🔒',
                    title: 'D7 유료 구독 유지율 낮음',
                    body: `구독 후 7일 유지율이 ${avgD7.toFixed(1)}%로 목표 70%에 미달합니다. 초기 이탈 방지가 필요합니다.`,
                    metric: avgD7.toFixed(1) + '%',
                    recommendations: [
                        '구독 직후 온보딩 강화',
                        '첫 주 사용 목표 설정 및 안내',
                        '초기 성공 경험 제공'
                    ]
                });
            } else if (avgD30 < 50) {
                insights.push({
                    type: 'warning',
                    icon: '🔒',
                    title: 'D30 유료 구독 유지율 주의',
                    body: `구독 후 30일 유지율이 ${avgD30.toFixed(1)}%입니다. 장기 유지 전략 점검이 필요합니다.`,
                    metric: avgD30.toFixed(1) + '%',
                    recommendations: [
                        '정기적 가치 전달 콘텐츠 발송',
                        '사용 빈도 저하 시 개입',
                        '커뮤니티 또는 소셜 기능 활성화'
                    ]
                });
            }
        }
    }

    AppState.insights = insights;
    displayInsights();
}

// Display Insights
function displayInsights() {
    const container = document.getElementById('insightsContainer');

    if (AppState.insights.length === 0) {
        container.innerHTML = '<div class="insight-placeholder"><p>아직 인사이트가 없습니다. 퍼널과 리텐션을 계산하여 인사이트를 생성하세요.</p></div>';
        return;
    }

    let html = '';
    AppState.insights.forEach(insight => {
        html += `
            <div class="insight-card ${insight.type}">
                <div class="insight-header">
                    <span class="insight-icon">${insight.icon}</span>
                    <h3 class="insight-title">${insight.title}</h3>
                </div>
                <div class="insight-body">
                    <p>${insight.body}</p>
                    ${insight.metric ? `<div class="insight-metric">${insight.metric}</div>` : ''}
                </div>
                ${insight.recommendations ? `
                    <div class="insight-recommendations">
                        <h4>권장 조치:</h4>
                        <ul>
                            ${insight.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    });

    container.innerHTML = html;
}

// ===== RENDER SUBSCRIPTION KPIs =====

function renderSubscriptionKPIs() {
    const kpiSection = document.getElementById('subscriptionKPISummary');
    if (!kpiSection) return;

    if (!isSubscriptionData()) {
        kpiSection.style.display = 'none';
        return;
    }

    kpiSection.style.display = 'block';

    // Calculate KPIs if not already done
    const kpis = AppState.subscriptionKPIs || calculateSubscriptionKPIs();
    const trialAnalysis = AppState.trialAnalysis || analyzeTrialConversion();
    const churnAnalysis = AppState.churnAnalysis || analyzeChurn();
    const paidRetention = AppState.paidRetentionResults || calculatePaidRetention();

    if (!kpis) {
        kpiSection.innerHTML = '<p class="no-data">구독 KPI를 계산할 수 없습니다.</p>';
        return;
    }

    // Format number helper
    const formatNum = (n) => n != null ? n.toLocaleString() : '-';
    const formatPct = (n) => n != null ? n.toFixed(1) + '%' : 'N/A';
    const formatCurrency = (n) => n != null ? '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'N/A';

    // Basic KPIs
    document.getElementById('kpiUsersTotal').textContent = formatNum(kpis.users_total);

    const subscribeRate = kpis.users_total > 0 ? (kpis.users_subscribed / kpis.users_total * 100) : null;
    document.getElementById('kpiSubscribeRate').textContent = formatPct(subscribeRate);
    document.getElementById('kpiPaidUsers').textContent = formatNum(kpis.paid_user_count);
    document.getElementById('kpiGrossRevenue').textContent = formatCurrency(kpis.gross_revenue);
    document.getElementById('kpiArppu').textContent = formatCurrency(kpis.arppu);
    document.getElementById('kpiCancelRate').textContent = formatPct(kpis.cancel_rate_paid);
    document.getElementById('kpiPaymentFailed').textContent = formatNum(kpis.payment_failed_events);
    document.getElementById('kpiRenewRate').textContent = formatPct(kpis.renew_success_rate);

    // Plan Mix
    const planMixEl = document.getElementById('kpiPlanMix');
    if (hasCol('plan') && kpis.plan_mix) {
        const { monthly, yearly, other } = kpis.plan_mix;
        if (monthly > 0 || yearly > 0 || other > 0) {
            planMixEl.innerHTML = '';
            if (monthly > 0) {
                planMixEl.innerHTML += `<div class="segment monthly" style="width:${monthly}%">월간 ${monthly.toFixed(0)}%</div>`;
            }
            if (yearly > 0) {
                planMixEl.innerHTML += `<div class="segment yearly" style="width:${yearly}%">연간 ${yearly.toFixed(0)}%</div>`;
            }
            if (other > 0) {
                planMixEl.innerHTML += `<div class="segment other" style="width:${other}%">기타 ${other.toFixed(0)}%</div>`;
            }
        } else {
            planMixEl.innerHTML = '<span class="no-data">데이터 없음</span>';
        }
    } else {
        planMixEl.innerHTML = '<span class="no-data">plan 컬럼 없음</span>';
    }

    // Trial Conversion Card
    const trialCard = document.getElementById('trialConversionCard');
    if (trialCard && trialAnalysis && trialAnalysis.overall.trial_users > 0) {
        trialCard.style.display = 'block';
        document.getElementById('trialConversionRate').textContent = formatPct(trialAnalysis.overall.conversion_rate);

        const medianHours = trialAnalysis.overall.median_hours;
        const medianDisplay = medianHours != null
            ? (medianHours < 24 ? `${medianHours.toFixed(1)}시간` : `${(medianHours / 24).toFixed(1)}일`)
            : 'N/A';
        document.getElementById('trialMedianTime').textContent = medianDisplay;

        // Trial by days table
        const tableEl = document.getElementById('trialByDaysTable');
        if (trialAnalysis.by_trial_days.length > 0) {
            tableEl.innerHTML = `
                <thead>
                    <tr><th>체험기간</th><th>체험자</th><th>구독자</th><th>전환율</th></tr>
                </thead>
                <tbody>
                    ${trialAnalysis.by_trial_days.map(row => `
                        <tr>
                            <td>${row.trial_days}일</td>
                            <td>${row.trial_users.toLocaleString()}${row.trial_users < 30 ? ' <span class="sample-warning-badge">n<30</span>' : ''}</td>
                            <td>${row.subscribed_users.toLocaleString()}</td>
                            <td>${row.conversion_rate.toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
        }
    } else if (trialCard) {
        trialCard.style.display = 'none';
    }

    // Churn Summary Card
    const churnCard = document.getElementById('churnSummaryCard');
    if (churnCard && churnAnalysis && churnAnalysis.churn_users > 0) {
        churnCard.style.display = 'block';
        document.getElementById('churnUsers').textContent = formatNum(churnAnalysis.churn_users);

        const medianDays = churnAnalysis.time_to_cancel_median_days;
        document.getElementById('churnMedianDays').textContent = medianDays != null ? `${medianDays.toFixed(1)}일` : 'N/A';

        // Churn reasons
        const reasonsEl = document.getElementById('churnReasonsList');
        if (churnAnalysis.cancel_reason_top && churnAnalysis.cancel_reason_top.length > 0) {
            reasonsEl.innerHTML = churnAnalysis.cancel_reason_top.slice(0, 3).map(r => `
                <div class="churn-reason-item">
                    <span class="reason">${r.reason}</span>
                    <span class="share">${r.share.toFixed(0)}%</span>
                </div>
            `).join('');
        } else {
            reasonsEl.innerHTML = '<span class="no-data">cancel_reason 컬럼 없음</span>';
        }
    } else if (churnCard) {
        churnCard.style.display = 'none';
    }

    // Paid Retention Card
    const paidRetCard = document.getElementById('paidRetentionCard');
    if (paidRetCard && paidRetention && paidRetention.length > 0) {
        paidRetCard.style.display = 'block';

        // Calculate average retention
        const avgD7 = paidRetention.reduce((sum, r) => sum + (r.days.D7 || 0), 0) / paidRetention.length;
        const avgD14 = paidRetention.reduce((sum, r) => sum + (r.days.D14 || 0), 0) / paidRetention.length;
        const avgD30 = paidRetention.reduce((sum, r) => sum + (r.days.D30 || 0), 0) / paidRetention.length;

        document.getElementById('paidRetD7').textContent = formatPct(avgD7);
        document.getElementById('paidRetD14').textContent = formatPct(avgD14);
        document.getElementById('paidRetD30').textContent = formatPct(avgD30);
    } else if (paidRetCard) {
        paidRetCard.style.display = 'none';
    }
}

// ===== RETENTION TYPE TOGGLE HANDLER =====

function initRetentionTypeToggle() {
    const toggleEl = document.getElementById('retentionTypeToggle');
    const activityBtn = document.getElementById('toggleActivityRetention');
    const paidBtn = document.getElementById('togglePaidRetention');
    const activityControls = document.getElementById('activityRetentionControls');
    const paidControls = document.getElementById('paidRetentionControls');
    const descEl = document.getElementById('retentionTypeDesc');

    if (!toggleEl || !activityBtn || !paidBtn) return;

    // Show toggle only for subscription data
    if (isSubscriptionData()) {
        toggleEl.style.display = 'block';
    } else {
        toggleEl.style.display = 'none';
        return;
    }

    activityBtn.addEventListener('click', () => {
        AppState.retentionType = 'activity';
        activityBtn.classList.add('active');
        paidBtn.classList.remove('active');
        if (activityControls) activityControls.style.display = 'block';
        if (paidControls) paidControls.style.display = 'none';
        if (descEl) descEl.textContent = '활성 이벤트 기반 리텐션을 계산합니다';
    });

    paidBtn.addEventListener('click', () => {
        AppState.retentionType = 'paid';
        paidBtn.classList.add('active');
        activityBtn.classList.remove('active');
        if (activityControls) activityControls.style.display = 'none';
        if (paidControls) paidControls.style.display = 'block';
        if (descEl) descEl.textContent = '유료 구독 유지율을 계산합니다 (subscribe → cancel)';
    });
}

// ===== NEW FUNCTIONS: Data Quality Report =====

// Generate Data Quality Report
function generateDataQualityReport() {
    const rawCount = AppState.rawData.length;
    const validCount = AppState.processedData.length;
    const failedCount = rawCount - validCount;

    // Unique users
    const uniqueUsers = new Set(AppState.processedData.map(r => r.userId)).size;

    // Date range
    const timestamps = AppState.processedData.map(r => r.timestamp).filter(t => t);
    const minDate = timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null;
    const maxDate = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null;

    // Missing rates
    const platformMissing = AppState.processedData.filter(r => !r.platform).length;
    const channelMissing = AppState.processedData.filter(r => !r.channel).length;
    const platformMissingRate = (platformMissing / validCount * 100).toFixed(1);
    const channelMissingRate = (channelMissing / validCount * 100).toFixed(1);

    // Top 10 events
    const eventCounts = {};
    AppState.processedData.forEach(r => {
        eventCounts[r.eventName] = (eventCounts[r.eventName] || 0) + 1;
    });
    const sortedEvents = Object.entries(eventCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({
            name,
            count,
            percentage: (count / validCount * 100).toFixed(2)
        }));

    return {
        totalRows: rawCount,
        validRows: validCount,
        failedRows: failedCount,
        uniqueUsers,
        minDate,
        maxDate,
        platformMissingRate,
        channelMissingRate,
        topEvents: sortedEvents
    };
}

// Render Data Quality Report
function renderDataQualityReport(report) {
    document.getElementById('qTotalRows').textContent = report.totalRows.toLocaleString();
    document.getElementById('qValidRows').textContent = `${report.validRows.toLocaleString()} (${report.failedRows} 실패)`;
    document.getElementById('qUniqueUsers').textContent = report.uniqueUsers.toLocaleString();

    const dateRange = report.minDate && report.maxDate
        ? `${report.minDate.toLocaleDateString()} ~ ${report.maxDate.toLocaleDateString()}`
        : 'N/A';
    document.getElementById('qDateRange').textContent = dateRange;

    document.getElementById('qPlatformMissing').textContent = `${report.platformMissingRate}%`;
    document.getElementById('qChannelMissing').textContent = `${report.channelMissingRate}%`;

    // Top 10 events table
    const table = document.getElementById('qTop10Events');
    let html = '<thead><tr><th>이벤트명</th><th>건수</th><th>비중(%)</th></tr></thead><tbody>';
    report.topEvents.forEach(evt => {
        html += `<tr>
            <td>${evt.name}</td>
            <td>${evt.count.toLocaleString()}</td>
            <td>${evt.percentage}%</td>
        </tr>`;
    });
    html += '</tbody>';
    table.innerHTML = html;

    document.getElementById('dataQualitySummary').style.display = 'block';
}

// ===== NEW FUNCTIONS: Time to Conversion =====

// Calculate Full Data Time to Conversion
function calculateFullDataTimeToConversion(validSteps) {
    if (!validSteps || validSteps.length < 2) return null;

    const firstStep = validSteps[0];
    const lastStep = validSteps[validSteps.length - 1];

    // Get users who completed the funnel
    const firstStepUsers = new Set(
        AppState.processedData
            .filter(e => e.eventName.toLowerCase().includes(firstStep.toLowerCase()))
            .map(e => e.userId)
    );

    const lastStepUsers = new Set(
        AppState.processedData
            .filter(e => e.eventName.toLowerCase().includes(lastStep.toLowerCase()))
            .map(e => e.userId)
    );

    const completedUsers = [...firstStepUsers].filter(userId => lastStepUsers.has(userId));

    if (completedUsers.length < 5) return null; // Minimum user count

    // Calculate time to conversion for each completed user
    const conversionTimes = [];
    completedUsers.forEach(userId => {
        const userEvents = AppState.processedData
            .filter(e => e.userId === userId)
            .sort((a, b) => a.timestamp - b.timestamp);

        const firstEvent = userEvents.find(e =>
            e.eventName.toLowerCase().includes(firstStep.toLowerCase())
        );
        const lastEvent = userEvents.find(e =>
            e.eventName.toLowerCase().includes(lastStep.toLowerCase()) &&
            e.timestamp >= firstEvent.timestamp
        );

        if (firstEvent && lastEvent) {
            const minutes = (lastEvent.timestamp - firstEvent.timestamp) / (1000 * 60);
            conversionTimes.push(minutes);
        }
    });

    if (conversionTimes.length === 0) return null;

    // Calculate statistics
    conversionTimes.sort((a, b) => a - b);
    const medianMinutes = conversionTimes[Math.floor(conversionTimes.length / 2)];
    const p90Index = Math.floor(conversionTimes.length * 0.9);
    const p90Minutes = conversionTimes[p90Index];

    return {
        completedUsersCount: completedUsers.length,
        medianMinutes,
        p90Minutes,
        validSteps // Return validSteps for reference
    };
}

// ===== NEW FUNCTIONS: Advanced Segment Comparison =====

// Calculate Segment Funnel with Step-by-Step metrics
function calculateSegmentFunnel(segmentData, steps, strictOrder = false) {
    const results = [];

    steps.forEach((stepName, index) => {
        let stepUsers;

        if (strictOrder && index > 0) {
            // Strict order: 이전 스텝을 통과한 사용자만
            const prevStepUsers = results[index - 1].users;
            stepUsers = new Set();

            prevStepUsers.forEach(userId => {
                const userEvents = segmentData
                    .filter(e => e.userId === userId)
                    .sort((a, b) => a.timestamp - b.timestamp);

                const prevEvent = userEvents.find(e => e.eventName === steps[index - 1]);
                const currentEvent = userEvents.find(e =>
                    e.eventName === stepName &&
                    e.timestamp > (prevEvent?.timestamp || 0)
                );

                if (currentEvent) stepUsers.add(userId);
            });
        } else {
            // Non-strict: 그냥 해당 이벤트 발생한 모든 사용자
            stepUsers = new Set(
                segmentData
                    .filter(e => e.eventName === stepName)
                    .map(e => e.userId)
            );
        }

        const userCount = stepUsers.size;
        const conversionRate = index === 0 ? 100 :
            (userCount / results[0].users.size * 100);
        const dropOff = index === 0 ? 0 :
            results[index - 1].users.size - userCount;

        results.push({
            step: stepName,
            users: stepUsers,
            userCount,
            conversionRate,
            dropOff
        });
    });

    return results;
}

// Statistical functions for p-value calculation
function normalCDF(z) {
    return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

function erf(x) {
    const t = 1 / (1 + 0.5 * Math.abs(x));
    const tau = t * Math.exp(-x * x - 1.26551223 +
        t * (1.00002368 +
            t * (0.37409196 +
                t * (0.09678418 +
                    t * (-0.18628806 +
                        t * (0.27886807 +
                            t * (-1.13520398 +
                                t * (1.48851587 +
                                    t * (-0.82215223 +
                                        t * 0.17087277)))))))));
    return x >= 0 ? 1 - tau : tau - 1;
}

function calculatePValue(count1, total1, count2, total2) {
    const p1 = count1 / total1;
    const p2 = count2 / total2;
    const pPool = (count1 + count2) / (total1 + total2);

    const se = Math.sqrt(pPool * (1 - pPool) * (1 / total1 + 1 / total2));
    if (se === 0) return 1.0;

    const z = (p1 - p2) / se;

    // Two-tailed p-value
    const pValue = 2 * (1 - normalCDF(Math.abs(z)));
    return Math.min(1.0, Math.max(0.0, pValue));
}

// ===== SUBSCRIPTION ANALYTICS FUNCTIONS =====

// [1] Calculate Subscription KPIs
function calculateSubscriptionKPIs() {
    const rows = AppState.rawData;
    if (!rows || rows.length === 0) return null;

    const eventNameCol = AppState.columnMapping?.eventname;
    if (!eventNameCol) return null;

    // Helper to count events
    const countEvents = (eventPattern) => {
        return rows.filter(row => {
            const eventName = (row[eventNameCol] || '').toLowerCase();
            return eventName.includes(eventPattern.toLowerCase());
        }).length;
    };

    // Helper to get unique users by event
    const getUsersByEvent = (eventPattern) => {
        const userIdCol = AppState.columnMapping?.userid;
        if (!userIdCol) return new Set();
        return new Set(
            rows.filter(row => {
                const eventName = (row[eventNameCol] || '').toLowerCase();
                return eventName.includes(eventPattern.toLowerCase());
            }).map(row => row[userIdCol])
        );
    };

    // Basic counts
    const usersTotal = new Set(rows.map(row => row[AppState.columnMapping?.userid]).filter(Boolean)).size;
    const usersSignup = getUsersByEvent('signup').size;
    const usersOnboarded = getUsersByEvent('onboarding').size || getUsersByEvent('onboarding_complete').size;
    const usersTrial = getUsersByEvent('start_trial').size || getUsersByEvent('trial').size;
    const usersSubscribed = getUsersByEvent('subscribe').size;

    // Event counts
    const subscribeEvents = countEvents('subscribe');
    const renewEvents = countEvents('renew');
    const cancelEvents = countEvents('cancel');
    const paymentFailedEvents = countEvents('payment_failed');

    // Paid users: users with subscribe or renew
    const subscribeUsers = getUsersByEvent('subscribe');
    const renewUsers = getUsersByEvent('renew');
    const paidUsers = new Set([...subscribeUsers, ...renewUsers]);
    const paidUserCount = paidUsers.size;

    // Revenue calculation
    let grossRevenue = 0;
    let netRevenue = 0;
    const hasRevenue = hasCol('revenue');
    if (hasRevenue) {
        rows.forEach(row => {
            const rev = parseFloat(getColValue(row, 'revenue')) || 0;
            if (rev > 0) grossRevenue += rev;
            netRevenue += rev; // Net includes refunds (negative values)
        });
    }

    // ARPPU (Average Revenue Per Paying User)
    const arppu = paidUserCount > 0 && hasRevenue ? grossRevenue / paidUserCount : null;

    // Plan mix
    const planMix = { monthly: 0, yearly: 0, other: 0 };
    if (hasCol('plan')) {
        const planCounts = {};
        rows.forEach(row => {
            const eventName = (row[eventNameCol] || '').toLowerCase();
            if (eventName.includes('subscribe') || eventName.includes('renew')) {
                const plan = (getColValue(row, 'plan') || 'unknown').toLowerCase();
                planCounts[plan] = (planCounts[plan] || 0) + 1;
            }
        });
        const total = Object.values(planCounts).reduce((a, b) => a + b, 0);
        if (total > 0) {
            Object.entries(planCounts).forEach(([plan, count]) => {
                if (plan.includes('month')) {
                    planMix.monthly += (count / total) * 100;
                } else if (plan.includes('year') || plan.includes('annual')) {
                    planMix.yearly += (count / total) * 100;
                } else {
                    planMix.other += (count / total) * 100;
                }
            });
        }
    }

    // Cancel rate (among paid users)
    const cancelUsers = getUsersByEvent('cancel');
    const cancelledPaidUsers = [...cancelUsers].filter(u => paidUsers.has(u));
    const cancelRatePaid = paidUserCount > 0 ? (cancelledPaidUsers.length / paidUserCount) * 100 : 0;

    // Renew success rate
    const renewSuccessRate = (renewEvents + paymentFailedEvents) > 0
        ? (renewEvents / (renewEvents + paymentFailedEvents)) * 100
        : null;

    const kpis = {
        users_total: usersTotal,
        users_signup: usersSignup,
        users_onboarded: usersOnboarded,
        users_trial: usersTrial,
        users_subscribed: usersSubscribed,
        subscribe_events: subscribeEvents,
        renew_events: renewEvents,
        cancel_events: cancelEvents,
        payment_failed_events: paymentFailedEvents,
        paid_user_count: paidUserCount,
        gross_revenue: hasRevenue ? grossRevenue : null,
        net_revenue: hasRevenue ? netRevenue : null,
        arppu: arppu,
        plan_mix: planMix,
        cancel_rate_paid: cancelRatePaid,
        renew_success_rate: renewSuccessRate
    };

    AppState.subscriptionKPIs = kpis;
    return kpis;
}

// [2] Analyze Trial to Subscribe Conversion
function analyzeTrialConversion() {
    const rows = AppState.rawData;
    if (!rows || rows.length === 0) return null;

    const eventNameCol = AppState.columnMapping?.eventname;
    const userIdCol = AppState.columnMapping?.userid;
    const timestampCol = AppState.columnMapping?.timestamp;
    if (!eventNameCol || !userIdCol || !timestampCol) return null;

    // Group events by user
    const userEvents = {};
    rows.forEach(row => {
        const userId = row[userIdCol];
        const eventName = (row[eventNameCol] || '').toLowerCase();
        const timestamp = new Date(row[timestampCol]);
        if (!userId || isNaN(timestamp.getTime())) return;

        if (!userEvents[userId]) userEvents[userId] = [];
        userEvents[userId].push({
            eventName,
            timestamp,
            trialDays: getColValue(row, 'trial_days')
        });
    });

    // Find trial users and their conversion
    const trialUsers = {};
    const hasTrialDaysCol = hasCol('trial_days');

    Object.entries(userEvents).forEach(([userId, events]) => {
        events.sort((a, b) => a.timestamp - b.timestamp);

        const trialEvent = events.find(e => e.eventName.includes('start_trial') || e.eventName === 'trial');
        if (!trialEvent) return;

        const subscribeEvent = events.find(e =>
            e.eventName.includes('subscribe') &&
            e.timestamp >= trialEvent.timestamp
        );

        const trialDays = hasTrialDaysCol && trialEvent.trialDays ? trialEvent.trialDays : 'Unknown';

        if (!trialUsers[trialDays]) {
            trialUsers[trialDays] = { trial_users: 0, subscribed_users: 0, conversion_times: [] };
        }

        trialUsers[trialDays].trial_users++;

        if (subscribeEvent) {
            trialUsers[trialDays].subscribed_users++;
            const hoursToConvert = (subscribeEvent.timestamp - trialEvent.timestamp) / (1000 * 60 * 60);
            trialUsers[trialDays].conversion_times.push(hoursToConvert);
        }
    });

    // Calculate statistics for each trial_days group
    const byTrialDays = Object.entries(trialUsers).map(([trialDays, data]) => {
        const times = data.conversion_times.sort((a, b) => a - b);
        const medianIdx = Math.floor(times.length / 2);
        const p90Idx = Math.floor(times.length * 0.9);

        return {
            trial_days: trialDays,
            trial_users: data.trial_users,
            subscribed_users: data.subscribed_users,
            conversion_rate: data.trial_users > 0 ? (data.subscribed_users / data.trial_users) * 100 : 0,
            median_time_to_subscribe_hours: times.length > 0 ? times[medianIdx] : null,
            p90_time_to_subscribe_hours: times.length > 0 ? times[p90Idx] || times[times.length - 1] : null
        };
    }).sort((a, b) => {
        const aDays = parseInt(a.trial_days) || 999;
        const bDays = parseInt(b.trial_days) || 999;
        return aDays - bDays;
    });

    // Overall summary
    const totalTrialUsers = byTrialDays.reduce((sum, g) => sum + g.trial_users, 0);
    const totalSubscribedUsers = byTrialDays.reduce((sum, g) => sum + g.subscribed_users, 0);
    const allTimes = byTrialDays.flatMap(g =>
        trialUsers[g.trial_days]?.conversion_times || []
    ).sort((a, b) => a - b);

    const overall = {
        trial_users: totalTrialUsers,
        subscribed_users: totalSubscribedUsers,
        conversion_rate: totalTrialUsers > 0 ? (totalSubscribedUsers / totalTrialUsers) * 100 : 0,
        median_hours: allTimes.length > 0 ? allTimes[Math.floor(allTimes.length / 2)] : null,
        p90_hours: allTimes.length > 0 ? allTimes[Math.floor(allTimes.length * 0.9)] : null
    };

    const analysis = { by_trial_days: byTrialDays, overall };
    AppState.trialAnalysis = analysis;
    return analysis;
}

// [3] Analyze Churn
function analyzeChurn() {
    const rows = AppState.rawData;
    if (!rows || rows.length === 0) return null;

    const eventNameCol = AppState.columnMapping?.eventname;
    const userIdCol = AppState.columnMapping?.userid;
    const timestampCol = AppState.columnMapping?.timestamp;
    if (!eventNameCol || !userIdCol || !timestampCol) return null;

    // Group events by user
    const userEvents = {};
    rows.forEach(row => {
        const userId = row[userIdCol];
        const eventName = (row[eventNameCol] || '').toLowerCase();
        const timestamp = new Date(row[timestampCol]);
        if (!userId || isNaN(timestamp.getTime())) return;

        if (!userEvents[userId]) userEvents[userId] = [];
        userEvents[userId].push({
            eventName,
            timestamp,
            cancelReason: getColValue(row, 'cancel_reason'),
            plan: getColValue(row, 'plan'),
            channel: getColValue(row, 'channel') || row[AppState.columnMapping?.channel]
        });
    });

    // Identify paid users (subscribe or renew) and churned users
    const paidUsers = new Set();
    const churnedUsers = {};
    const cancelReasons = {};
    const cancelTimes = [];
    const churnByPlan = {};
    const churnByChannel = {};

    Object.entries(userEvents).forEach(([userId, events]) => {
        events.sort((a, b) => a.timestamp - b.timestamp);

        const subscribeEvent = events.find(e => e.eventName.includes('subscribe'));
        const renewEvent = events.find(e => e.eventName.includes('renew'));

        if (subscribeEvent || renewEvent) {
            paidUsers.add(userId);
        }

        const cancelEvent = events.find(e => e.eventName.includes('cancel'));
        if (cancelEvent && (subscribeEvent || renewEvent)) {
            churnedUsers[userId] = cancelEvent;

            // Cancel reason
            const reason = cancelEvent.cancelReason || 'Unknown';
            cancelReasons[reason] = (cancelReasons[reason] || 0) + 1;

            // Time to cancel
            const firstPaidEvent = subscribeEvent || renewEvent;
            if (firstPaidEvent) {
                const daysToCancel = (cancelEvent.timestamp - firstPaidEvent.timestamp) / (1000 * 60 * 60 * 24);
                cancelTimes.push(daysToCancel);
            }

            // Churn by plan
            const plan = (subscribeEvent?.plan || renewEvent?.plan || 'Unknown').toLowerCase();
            if (!churnByPlan[plan]) churnByPlan[plan] = { churned: 0, total: 0 };
            churnByPlan[plan].churned++;

            // Churn by channel
            const channel = subscribeEvent?.channel || renewEvent?.channel || 'Unknown';
            if (!churnByChannel[channel]) churnByChannel[channel] = { churned: 0, total: 0 };
            churnByChannel[channel].churned++;
        }

        // Count total paid users by plan/channel for rate calculation
        if (subscribeEvent || renewEvent) {
            const plan = (subscribeEvent?.plan || renewEvent?.plan || 'Unknown').toLowerCase();
            if (!churnByPlan[plan]) churnByPlan[plan] = { churned: 0, total: 0 };
            churnByPlan[plan].total++;

            const channel = subscribeEvent?.channel || renewEvent?.channel || 'Unknown';
            if (!churnByChannel[channel]) churnByChannel[channel] = { churned: 0, total: 0 };
            churnByChannel[channel].total++;
        }
    });

    const churnUserCount = Object.keys(churnedUsers).length;
    const paidUserCount = paidUsers.size;
    const churnRatePaid = paidUserCount > 0 ? (churnUserCount / paidUserCount) * 100 : 0;

    // Cancel reason top
    const cancelReasonTop = Object.entries(cancelReasons)
        .map(([reason, users]) => ({
            reason,
            users,
            share: churnUserCount > 0 ? (users / churnUserCount) * 100 : 0
        }))
        .sort((a, b) => b.users - a.users)
        .slice(0, 5);

    // Time to cancel statistics
    cancelTimes.sort((a, b) => a - b);
    const medianIdx = Math.floor(cancelTimes.length / 2);
    const p90Idx = Math.floor(cancelTimes.length * 0.9);

    const analysis = {
        churn_users: churnUserCount,
        churn_rate_paid: churnRatePaid,
        cancel_reason_top: cancelReasonTop,
        time_to_cancel_median_days: cancelTimes.length > 0 ? cancelTimes[medianIdx] : null,
        time_to_cancel_p90_days: cancelTimes.length > 0 ? cancelTimes[p90Idx] || cancelTimes[cancelTimes.length - 1] : null,
        churn_by_plan: Object.entries(churnByPlan).map(([plan, data]) => ({
            plan,
            churn_rate: data.total > 0 ? (data.churned / data.total) * 100 : 0,
            n: data.total
        })),
        churn_by_channel: Object.entries(churnByChannel).map(([channel, data]) => ({
            channel,
            churn_rate: data.total > 0 ? (data.churned / data.total) * 100 : 0,
            n: data.total
        }))
    };

    AppState.churnAnalysis = analysis;
    return analysis;
}

// [4] Calculate Paid Retention
function calculatePaidRetention() {
    const rows = AppState.rawData;
    if (!rows || rows.length === 0) return null;

    const eventNameCol = AppState.columnMapping?.eventname;
    const userIdCol = AppState.columnMapping?.userid;
    const timestampCol = AppState.columnMapping?.timestamp;
    if (!eventNameCol || !userIdCol || !timestampCol) return null;

    // Group events by user
    const userEvents = {};
    rows.forEach(row => {
        const userId = row[userIdCol];
        const eventName = (row[eventNameCol] || '').toLowerCase();
        const timestamp = new Date(row[timestampCol]);
        if (!userId || isNaN(timestamp.getTime())) return;

        if (!userEvents[userId]) userEvents[userId] = [];
        userEvents[userId].push({ eventName, timestamp });
    });

    // Build cohorts by first subscribe date
    const cohorts = {};
    const userFirstSubscribe = {};
    const userCancelDate = {};

    Object.entries(userEvents).forEach(([userId, events]) => {
        events.sort((a, b) => a.timestamp - b.timestamp);

        const subscribeEvent = events.find(e => e.eventName.includes('subscribe'));
        if (!subscribeEvent) return;

        const cohortDate = subscribeEvent.timestamp.toISOString().split('T')[0];
        if (!cohorts[cohortDate]) cohorts[cohortDate] = new Set();
        cohorts[cohortDate].add(userId);
        userFirstSubscribe[userId] = subscribeEvent.timestamp;

        // Find cancel event
        const cancelEvent = events.find(e =>
            e.eventName.includes('cancel') &&
            e.timestamp >= subscribeEvent.timestamp
        );
        if (cancelEvent) {
            userCancelDate[userId] = cancelEvent.timestamp;
        }
    });

    // Calculate retention for each cohort
    const retentionMatrix = [];
    const retentionDays = [0, 7, 14, 30, 60, 90];

    Object.entries(cohorts)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(0, 10)
        .forEach(([cohortDate, userSet]) => {
            const cohortStartDate = new Date(cohortDate);
            const retention = { cohortDate, cohortSize: userSet.size, days: {} };

            retentionDays.forEach(day => {
                const targetDate = new Date(cohortStartDate);
                targetDate.setDate(targetDate.getDate() + day);

                let retainedCount = 0;
                userSet.forEach(userId => {
                    const cancelDate = userCancelDate[userId];
                    // User is retained if no cancel or cancel is after target date
                    if (!cancelDate || cancelDate > targetDate) {
                        retainedCount++;
                    }
                });

                retention.days[`D${day}`] = userSet.size > 0 ? (retainedCount / userSet.size) * 100 : 0;
            });

            retentionMatrix.push(retention);
        });

    AppState.paidRetentionResults = retentionMatrix;
    return retentionMatrix;
}

// [5] Calculate Lifecycle Funnel Time-to-Convert
function calculateLifecycleTiming() {
    const rows = AppState.rawData;
    if (!rows || rows.length === 0) return null;

    const eventNameCol = AppState.columnMapping?.eventname;
    const userIdCol = AppState.columnMapping?.userid;
    const timestampCol = AppState.columnMapping?.timestamp;
    if (!eventNameCol || !userIdCol || !timestampCol) return null;

    // Group events by user
    const userEvents = {};
    rows.forEach(row => {
        const userId = row[userIdCol];
        const eventName = (row[eventNameCol] || '').toLowerCase();
        const timestamp = new Date(row[timestampCol]);
        if (!userId || isNaN(timestamp.getTime())) return;

        if (!userEvents[userId]) userEvents[userId] = [];
        userEvents[userId].push({ eventName, timestamp });
    });

    // Calculate time between key lifecycle events
    const timings = {
        app_open_to_subscribe: [],
        trial_to_subscribe: [],
        subscribe_to_cancel: []
    };

    Object.values(userEvents).forEach(events => {
        events.sort((a, b) => a.timestamp - b.timestamp);

        const appOpen = events.find(e => e.eventName.includes('app_open') || e.eventName === 'open');
        const trial = events.find(e => e.eventName.includes('trial'));
        const subscribe = events.find(e => e.eventName.includes('subscribe'));
        const cancel = events.find(e => e.eventName.includes('cancel'));

        // app_open -> subscribe
        if (appOpen && subscribe && subscribe.timestamp >= appOpen.timestamp) {
            const hours = (subscribe.timestamp - appOpen.timestamp) / (1000 * 60 * 60);
            timings.app_open_to_subscribe.push(hours);
        }

        // trial -> subscribe
        if (trial && subscribe && subscribe.timestamp >= trial.timestamp) {
            const hours = (subscribe.timestamp - trial.timestamp) / (1000 * 60 * 60);
            timings.trial_to_subscribe.push(hours);
        }

        // subscribe -> cancel (churn time)
        if (subscribe && cancel && cancel.timestamp >= subscribe.timestamp) {
            const days = (cancel.timestamp - subscribe.timestamp) / (1000 * 60 * 60 * 24);
            timings.subscribe_to_cancel.push(days);
        }
    });

    // Calculate statistics
    const calcStats = (arr) => {
        if (arr.length === 0) return { median: null, p90: null, count: 0 };
        arr.sort((a, b) => a - b);
        return {
            median: arr[Math.floor(arr.length / 2)],
            p90: arr[Math.floor(arr.length * 0.9)] || arr[arr.length - 1],
            count: arr.length
        };
    };

    return {
        app_open_to_subscribe: calcStats(timings.app_open_to_subscribe),
        trial_to_subscribe: calcStats(timings.trial_to_subscribe),
        subscribe_to_cancel: calcStats(timings.subscribe_to_cancel)
    };
}

// ===== NEW FUNCTIONS: Export Report =====

function applyKoreanFontToJsPdf(doc) {
    try {
        const b64 = window.__PDF_FONT_NOTO_SANS_KR_BASE64;
        if (!b64) return false;

        // Register embedded TTF font to jsPDF
        doc.addFileToVFS('NotoSansKR_400Regular.ttf', b64);
        doc.addFont('NotoSansKR_400Regular.ttf', 'NotoSansKR', 'normal');
        doc.setFont('NotoSansKR', 'normal');
        return true;
    } catch (e) {
        console.warn('PDF Korean font load failed:', e);
        return false;
    }
}

function downloadPdfWithFilename(doc, filename) {
    try {
        // Ensure .pdf extension
        const safeName = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;

        // Use arraybuffer -> Blob to enforce correct mime + filename in sandboxy environments
        const pdfArrayBuffer = doc.output('arraybuffer');
        const blob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = safeName;
        a.rel = 'noopener';
        a.style.display = 'none';
        document.body.appendChild(a);

        a.click();

        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        return true;
    } catch (e) {
        console.warn('PDF download failed:', e);
        return false;
    }
}

// ===== PNG export workaround for sandbox/webview =====

// (A) Environment detection - detects hostile download environments
function isDownloadHostileEnv() {
    // iframe sandbox / webview / iOS safari etc.
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const isWebView = /(FBAN|FBAV|Instagram|KAKAOTALK|Line|wv)/i.test(ua);
    const inIframe = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();

    return isIOS || isSafari || isWebView || inIframe;
}

// (B) Generate filename for PNG export
function makeReportPngFilename(pageIndex /*1-based*/) {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
    return `analysis_report_${stamp}_page_${pageIndex}.png`;
}

// (C) Download or open blob with strong fallback for hostile environments
function downloadOrOpenBlobStrong(blob, filename) {
    const url = URL.createObjectURL(blob);
    const hostile = isDownloadHostileEnv();

    // 1) Try download first (works in normal environments)
    try {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.rel = 'noopener';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (e) {
        // ignore and fallback below
    }

    // 2) For hostile environments, also open in new tab for save/share
    if (hostile) {
        try {
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch (e) {
            // Last resort: navigate to the blob URL
            window.location.href = url;
        }
    }

    // Revoke with delay to ensure save completes
    setTimeout(() => URL.revokeObjectURL(url), 8000);
}

// (D) Text wrapping for canvas with Korean support
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text || '').split(' ');
    let line = '';
    let yy = y;

    const pushLine = (s) => { ctx.fillText(s, x, yy); yy += lineHeight; };

    if (words.length === 1) {
        // Character-level wrapping for Korean text without spaces
        let buf = '';
        for (const ch of String(text || '')) {
            const test = buf + ch;
            if (ctx.measureText(test).width > maxWidth && buf) {
                pushLine(buf);
                buf = ch;
            } else {
                buf = test;
            }
        }
        if (buf) pushLine(buf);
        return yy;
    }

    for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > maxWidth && line) {
            pushLine(line);
            line = w;
        } else {
            line = test;
        }
    }
    if (line) pushLine(line);
    return yy;
}

// (E) Draw canvas with background color
function drawCanvasWithBg(destCtx, srcCanvas, x, y, w, h, bgColor) {
    if (!srcCanvas) return false;
    try {
        destCtx.save();
        destCtx.fillStyle = bgColor || '#0b1020';
        destCtx.fillRect(x, y, w, h);
        destCtx.drawImage(srcCanvas, x, y, w, h);
        destCtx.restore();
        return true;
    } catch (e) {
        return false;
    }
}

// (F) Build report snapshot from current AppState
function buildReportSnapshot() {
    const snap = {};
    snap.generatedAt = new Date().toLocaleString('ko-KR');

    // Data Quality
    const rows = (AppState.processedData && AppState.processedData.length) ? AppState.processedData : (AppState.rawData || []);
    const users = new Set(rows.map(r => r.user_id || r.userId).filter(Boolean));
    const ts = rows.map(r => new Date(r.timestamp)).filter(d => !isNaN(d));
    ts.sort((a, b) => a - b);

    snap.data = {
        totalRows: (AppState.rawData || []).length || rows.length,
        validRows: rows.length,
        uniqueUsers: users.size,
        dateMin: ts.length ? ts[0].toISOString().slice(0, 10) : 'N/A',
        dateMax: ts.length ? ts[ts.length - 1].toISOString().slice(0, 10) : 'N/A'
    };

    snap.funnel = Array.isArray(AppState.funnelResults) ? AppState.funnelResults : [];
    snap.retention = AppState.retentionResults || null;
    snap.segment = AppState.segmentResults || null;
    snap.insights = Array.isArray(AppState.insights) ? AppState.insights : [];

    return snap;
}

// (G) Create A4-sized canvas for page rendering
function createA4CanvasPx() {
    // 1240x1754 ~= A4 @ ~150dpi for good readability
    const canvas = document.createElement('canvas');
    canvas.width = 1240;
    canvas.height = 1754;
    return canvas;
}

function makePageContext(canvas) {
    const ctx = canvas.getContext('2d');
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Korean font stack for text rendering
    ctx.fillStyle = '#111827';
    ctx.font = '28px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';
    ctx.textBaseline = 'top';
    return ctx;
}

// (H) Render multi-page report with automatic page breaks
function renderReportPages(snapshot) {
    const pages = [];
    const charts = {
        funnel: document.getElementById('funnelChart'),
        retention: document.getElementById('retentionChart'),
        segment: document.getElementById('segmentChart')
    };

    const margin = 70;
    const contentW = 1240 - margin * 2;
    const lineH = 34;

    let page = createA4CanvasPx();
    let ctx = makePageContext(page);
    let y = margin;

    const newPage = () => {
        pages.push(page);
        page = createA4CanvasPx();
        ctx = makePageContext(page);
        y = margin;
    };

    const ensure = (needH) => {
        if (y + needH > 1754 - margin) newPage();
    };

    // Header
    ctx.font = 'bold 44px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';
    ctx.fillText('데이터 분석 리포트', margin, y);
    y += 64;

    ctx.font = '24px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';
    ctx.fillStyle = '#4b5563';
    ctx.fillText(`생성일: ${snapshot.generatedAt}`, margin, y);
    y += 46;

    // Data summary card
    ensure(220);
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(margin, y, contentW, 180);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 26px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';
    ctx.fillText('데이터 요약', margin + 24, y + 18);

    ctx.font = '24px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';
    const d = snapshot.data || {};
    ctx.fillText(`Rows: ${d.validRows} (raw: ${d.totalRows})`, margin + 24, y + 62);
    ctx.fillText(`Users: ${d.uniqueUsers}`, margin + 24, y + 96);
    ctx.fillText(`기간: ${d.dateMin} ~ ${d.dateMax}`, margin + 24, y + 130);
    y += 210;

    // Funnel section text
    ensure(120);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 30px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';
    ctx.fillText('퍼널 요약', margin, y);
    y += 44;

    ctx.font = '24px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';
    if (snapshot.funnel && snapshot.funnel.length) {
        snapshot.funnel.slice(0, 6).forEach(step => {
            ensure(40);
            const s = `${step.step || step.name || 'step'}: ${step.users ?? 'N/A'}명 (${step.conversionRate ?? 'N/A'}%)`;
            y = wrapText(ctx, `• ${s}`, margin, y, contentW, lineH);
        });
    } else {
        y = wrapText(ctx, '• (퍼널 결과가 없습니다. 퍼널 계산 후 다시 시도하세요)', margin, y, contentW, lineH);
    }
    y += 12;

    // Funnel chart
    ensure(420);
    ctx.font = 'bold 26px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';
    ctx.fillText('퍼널 차트', margin, y);
    y += 40;

    const chartH = 340;
    const okF = drawCanvasWithBg(ctx, charts.funnel, margin, y, contentW, chartH, '#0b1020');
    if (!okF) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '24px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';
        ctx.fillText('(차트가 아직 생성되지 않았습니다)', margin, y + 10);
        ctx.fillStyle = '#111827';
    }
    y += chartH + 30;

    // Retention section
    ensure(120);
    ctx.font = 'bold 30px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';
    ctx.fillText('리텐션 요약', margin, y);
    y += 44;
    ctx.font = '24px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';

    if (snapshot.retention && snapshot.retention.matrix) {
        // Calculate average retention for D1/D7/D14
        const matrix = snapshot.retention.matrix;
        const avg = (day) => {
            let sum = 0, cnt = 0;
            matrix.forEach(row => {
                if (row && row[day] != null && row[day] !== '' && !isNaN(row[day])) {
                    sum += Number(row[day]);
                    cnt++;
                }
            });
            return cnt ? (sum / cnt).toFixed(1) : 'N/A';
        };
        y = wrapText(ctx, `• D1 평균: ${avg(1)}%`, margin, y, contentW, lineH);
        y = wrapText(ctx, `• D7 평균: ${avg(7)}%`, margin, y, contentW, lineH);
        y = wrapText(ctx, `• D14 평균: ${avg(14)}%`, margin, y, contentW, lineH);
    } else {
        y = wrapText(ctx, '• (리텐션 결과가 없습니다. 리텐션 계산 후 다시 시도하세요)', margin, y, contentW, lineH);
    }
    y += 12;

    // Retention chart
    ensure(420);
    ctx.font = 'bold 26px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';
    ctx.fillText('리텐션 차트', margin, y);
    y += 40;

    const okR = drawCanvasWithBg(ctx, charts.retention, margin, y, contentW, chartH, '#0b1020');
    if (!okR) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '24px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';
        ctx.fillText('(차트가 아직 생성되지 않았습니다)', margin, y + 10);
        ctx.fillStyle = '#111827';
    }
    y += chartH + 30;

    // Segment chart may overflow -> proactive new page
    ensure(520);
    ctx.font = 'bold 30px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';
    ctx.fillText('세그먼트 요약', margin, y);
    y += 44;
    ctx.font = '24px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';

    if (snapshot.segment && Array.isArray(snapshot.segment)) {
        const sorted = snapshot.segment.slice().sort((a, b) => (b.conversion || 0) - (a.conversion || 0));
        const top = sorted.slice(0, 3);
        const bottom = sorted.slice(-3).reverse();

        const topStr = top.map(s => `${s.segment || s.name}(${(s.conversion ?? 0).toFixed?.(1) ?? s.conversion}%)`).join(', ');
        const bottomStr = bottom.map(s => `${s.segment || s.name}(${(s.conversion ?? 0).toFixed?.(1) ?? s.conversion}%)`).join(', ');

        y = wrapText(ctx, `• Top3: ${topStr}`, margin, y, contentW, lineH);
        y = wrapText(ctx, `• Bottom3: ${bottomStr}`, margin, y, contentW, lineH);
    } else {
        y = wrapText(ctx, '• (세그먼트 결과가 없습니다. 세그먼트 비교 후 다시 시도하세요)', margin, y, contentW, lineH);
    }
    y += 12;

    ensure(420);
    ctx.font = 'bold 26px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';
    ctx.fillText('세그먼트 차트', margin, y);
    y += 40;

    const okS = drawCanvasWithBg(ctx, charts.segment, margin, y, contentW, chartH, '#0b1020');
    if (!okS) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '24px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';
        ctx.fillText('(차트가 아직 생성되지 않았습니다)', margin, y + 10);
        ctx.fillStyle = '#111827';
    }
    y += chartH + 30;

    // Insights (top 5)
    ensure(200);
    ctx.font = 'bold 30px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';
    ctx.fillText('핵심 인사이트', margin, y);
    y += 44;
    ctx.font = '24px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif';

    if (snapshot.insights && snapshot.insights.length) {
        snapshot.insights.slice(0, 5).forEach(ins => {
            ensure(100);
            const title = ins.title || ins.name || 'Insight';
            const metric = ins.metric ? ` (${ins.metric})` : '';
            y = wrapText(ctx, `• ${title}${metric}`, margin, y, contentW, lineH);
            if (ins.detail || ins.body) {
                y = wrapText(ctx, `  - ${ins.detail || ins.body}`, margin, y, contentW, lineH);
            }
            if (ins.action) {
                y = wrapText(ctx, `  - 권장: ${ins.action}`, margin, y, contentW, lineH);
            }
            y += 8;
        });
    } else {
        y = wrapText(ctx, '• (인사이트가 없습니다)', margin, y, contentW, lineH);
    }

    // Push last page
    pages.push(page);
    return pages;
}

// Export Report as PNG (PNG export workaround for sandbox/webview)
function exportReport() {
    try {
        // Build snapshot and render pages
        const snap = buildReportSnapshot();
        const pages = renderReportPages(snap);

        if (!pages || !pages.length) {
            alert('리포트 생성에 실패했습니다.');
            return;
        }

        // Export each page as PNG
        pages.forEach((c, idx) => {
            const pageNo = idx + 1;
            const filename = makeReportPngFilename(pageNo);

            c.toBlob((blob) => {
                if (!blob) {
                    console.warn('PNG blob 생성 실패', pageNo);
                    return;
                }
                downloadOrOpenBlobStrong(blob, filename);
            }, 'image/png', 1.0);
        });

        // User guidance for hostile environments
        if (isDownloadHostileEnv()) {
            alert('다운로드가 제한된 환경일 수 있어요. 새 탭에 열린 이미지에서 "이미지 저장/공유"를 이용해주세요.');
        }
    } catch (e) {
        console.error(e);
        alert('리포트 내보내기 중 오류가 발생했습니다. 콘솔 로그를 확인해주세요.');
    }
}

// ===== n8n Email Integration =====

// Toggle n8n settings panel visibility
function toggleN8nSettings() {
    const panel = document.getElementById('n8nSettingsPanel');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}

// Load n8n settings from localStorage
function loadN8nSettings() {
    try {
        const settings = JSON.parse(localStorage.getItem('n8nSettings') || '{}');

        if (settings.webhookUrl) {
            document.getElementById('n8nWebhookUrl').value = settings.webhookUrl;
        }
        if (settings.emailRecipients) {
            document.getElementById('emailRecipients').value = settings.emailRecipients;
        }
        if (settings.autoSend !== undefined) {
            document.getElementById('autoSendEmail').checked = settings.autoSend;
        }
    } catch (e) {
        console.warn('Failed to load n8n settings:', e);
    }
}

// Save n8n settings to localStorage
function saveN8nSettings() {
    const webhookUrl = document.getElementById('n8nWebhookUrl').value.trim();
    const emailRecipients = document.getElementById('emailRecipients').value.trim();
    const autoSend = document.getElementById('autoSendEmail').checked;

    if (!webhookUrl) {
        alert('n8n Webhook URL을 입력해주세요.');
        return;
    }

    if (!emailRecipients) {
        alert('수신 이메일 주소를 입력해주세요.');
        return;
    }

    // Validate webhook URL format
    try {
        new URL(webhookUrl);
    } catch (e) {
        alert('올바른 URL 형식이 아닙니다. https://로 시작하는 URL을 입력해주세요.');
        return;
    }

    const settings = {
        webhookUrl,
        emailRecipients,
        autoSend
    };

    localStorage.setItem('n8nSettings', JSON.stringify(settings));
    alert('설정이 저장되었습니다! ✅');
}

// Validate n8n settings
function validateN8nSettings() {
    const settings = JSON.parse(localStorage.getItem('n8nSettings') || '{}');

    if (!settings.webhookUrl || !settings.emailRecipients) {
        alert('⚙️ 이메일 설정이 필요합니다.\n\n"이메일 설정" 버튼을 클릭하여 n8n webhook URL과 수신 이메일 주소를 입력해주세요.');
        return null;
    }

    return settings;
}

// Test n8n webhook connection
async function testN8nWebhook() {
    const settings = validateN8nSettings();
    if (!settings) return;

    const testBtn = document.getElementById('testN8nWebhook');
    const originalText = testBtn.textContent;
    testBtn.textContent = '테스트 중...';
    testBtn.disabled = true;

    try {
        const response = await fetch(settings.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                test: true,
                message: 'n8n webhook 연결 테스트',
                timestamp: new Date().toISOString()
            })
        });

        if (response.ok) {
            alert('✅ n8n webhook 연결 성공!\n\nwebhook이 정상적으로 작동합니다.');
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Webhook test failed:', error);
        alert(`❌ Webhook 연결 실패\n\n${error.message}\n\n• n8n webhook URL이 올바른지 확인하세요\n• n8n 워크플로우가 활성화되어 있는지 확인하세요\n• CORS 설정이 올바른지 확인하세요`);
    } finally {
        testBtn.textContent = originalText;
        testBtn.disabled = false;
    }
}

// Convert canvas pages to base64 strings
async function convertPagesToBase64(pages) {
    const attachments = [];

    for (let i = 0; i < pages.length; i++) {
        const canvas = pages[i];
        const pageNo = i + 1;
        const filename = makeReportPngFilename(pageNo);

        // Convert canvas to base64
        const base64Data = canvas.toDataURL('image/png', 1.0).split(',')[1]; // Remove data:image/png;base64, prefix

        attachments.push({
            filename: filename,
            content: base64Data,
            mimeType: 'image/png'
        });
    }

    return attachments;
}

// Send report via email through n8n webhook
async function sendReportViaEmail() {
    // Validate settings
    const settings = validateN8nSettings();
    if (!settings) return;

    const sendBtn = document.getElementById('sendEmailReport');
    const originalText = sendBtn.textContent;
    sendBtn.textContent = '📧 발송 중...';
    sendBtn.disabled = true;

    try {
        // Build snapshot and render pages
        const snap = buildReportSnapshot();
        const pages = renderReportPages(snap);

        if (!pages || !pages.length) {
            alert('리포트 생성에 실패했습니다.');
            return;
        }

        // Convert pages to base64
        const attachments = await convertPagesToBase64(pages);

        // Parse email recipients
        const emailTo = settings.emailRecipients
            .split(',')
            .map(email => email.trim())
            .filter(email => email.length > 0);

        // Prepare email data
        const d = new Date();
        const pad = n => String(n).padStart(2, '0');
        const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

        const emailData = {
            emailTo: emailTo,
            subject: `데이터 분석 리포트 - ${dateStr}`,
            reportData: {
                generatedAt: snap.generatedAt,
                dataQuality: snap.data,
                funnel: snap.funnel,
                retention: snap.retention,
                segment: snap.segment,
                insights: snap.insights
            },
            attachments: attachments,
            pageCount: pages.length
        };

        // Send to n8n webhook
        const response = await fetch(settings.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData)
        });

        if (response.ok) {
            const result = await response.json().catch(() => ({}));
            alert(`✅ 이메일 발송 요청 성공!\n\n수신자: ${emailTo.join(', ')}\n페이지 수: ${pages.length}장\n\nn8n에서 이메일을 발송 중입니다.`);
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

    } catch (error) {
        console.error('Email send failed:', error);
        alert(`❌ 이메일 발송 실패\n\n${error.message}\n\n• webhook URL이 올바른지 확인하세요\n• n8n 워크플로우가 활성화되어 있는지 확인하세요\n• 네트워크 연결을 확인하세요`);
    } finally {
        sendBtn.textContent = originalText;
        sendBtn.disabled = false;
    }
}

// Auto-send email after analysis (if enabled)
async function autoSendEmailIfEnabled() {
    try {
        const settings = JSON.parse(localStorage.getItem('n8nSettings') || '{}');
        if (settings.autoSend && settings.webhookUrl && settings.emailRecipients) {
            // Add slight delay to ensure insights are generated
            setTimeout(() => {
                sendReportViaEmail();
            }, 1000);
        }
    } catch (e) {
        console.warn('Auto-send check failed:', e);
    }
}
