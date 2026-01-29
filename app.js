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
    insights: []
};

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

        await updateProgress(progressFill, progressText, 95, '인사이트 생성 중...');

        // Generate automatic insights based on full dataset
        generateInsights();

        await updateProgress(progressFill, progressText, 100, '완료!');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Hide progress bar
        progressContainer.style.display = 'none';

        alert(`데이터가 성공적으로 처리되었습니다!\n\n감지된 데이터 유형: ${typeName}\n퍼널 분석 탭에서 자동으로 템플릿이 적용됩니다.\n\n인사이트 카드 탭에서 자동 생성된 인사이트를 확인하세요!`);
    } else {
        AppState.detectedType = null;

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
}

// Load Funnel Template
function loadFunnelTemplate(type) {
    const templates = {
        ecommerce: ['view_item', 'add_to_cart', 'begin_checkout', 'purchase'],
        subscription: ['app_open', 'signup', 'onboarding_complete', 'start_trial', 'subscribe']
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

function canvasToPngDataUrlWithBg(canvasEl, bgColor = '#0b1020') {
    if (!canvasEl) return null;

    // If canvas has no explicit pixel size, fallback to a reasonable default
    const w = canvasEl.width && canvasEl.width > 0 ? canvasEl.width : 1200;
    const h = canvasEl.height && canvasEl.height > 0 ? canvasEl.height : 600;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = w;
    exportCanvas.height = h;

    const ctx = exportCanvas.getContext('2d');
    // Dark background so light chart labels remain readable in white PDF page
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    try {
        // Draw original chart canvas on top
        ctx.drawImage(canvasEl, 0, 0, w, h);
        return exportCanvas.toDataURL('image/png', 1.0);
    } catch (e) {
        console.warn('Chart image export failed:', e);
        return null;
    }
}

// Export Report as Markdown
function exportReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    applyKoreanFontToJsPdf(doc);
    doc.setFont('NotoSansKR', 'normal');

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = 20;

    // Helper function to check page break
    function checkPageBreak(requiredSpace) {
        if (yPos + requiredSpace > 280) {
            doc.addPage();
            yPos = 20;
        }
    }

    // Helper function to add section title
    function addSectionTitle(title, icon) {
        checkPageBreak(15);
        doc.setFontSize(14);
        doc.setTextColor(99, 102, 241); // Accent color
        doc.text(`${icon} ${title}`, margin, yPos);
        yPos += 8;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
    }

    // Helper function to add text line
    function addText(text, indent = 0) {
        checkPageBreak(6);
        doc.text(text, margin + indent, yPos);
        yPos += 5;
    }

    function addChartToPdf(canvasId, title) {
        // Prefer the actual canvas in DOM
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Section title for chart
        checkPageBreak(12);
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        doc.text(title, margin, yPos);
        yPos += 6;

        const imgData = canvasToPngDataUrlWithBg(canvas, '#0b1020');
        if (!imgData) {
            doc.setFontSize(9);
            doc.setTextColor(120, 120, 120);
            doc.text('(차트 이미지를 생성하지 못했습니다)', margin, yPos);
            yPos += 6;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            return;
        }

        // Scale to fit A4 content area
        const ratio = (canvas.height && canvas.width) ? (canvas.height / canvas.width) : 0.5;
        const maxW = contentWidth;
        const maxH = 90; // mm cap to avoid overflow

        let imgW = maxW;
        let imgH = imgW * ratio;

        if (imgH > maxH) {
            const scale = maxH / imgH;
            imgW = imgW * scale;
            imgH = imgH * scale;
        }

        checkPageBreak(imgH + 10);

        const x = margin + (contentWidth - imgW) / 2;
        doc.addImage(imgData, 'PNG', x, yPos, imgW, imgH);
        yPos += imgH + 8;

        // Restore default text style
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
    }

    // Title
    doc.setFontSize(20);
    doc.setTextColor(99, 102, 241);
    doc.text('데이터 분석 리포트', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`생성일: ${new Date().toLocaleString('ko-KR')}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    doc.setTextColor(0, 0, 0);

    // 1. 데이터 품질 요약
    if (AppState.processedData && AppState.processedData.length > 0) {
        const report = generateDataQualityReport();
        addSectionTitle('데이터 품질 요약', '📊');

        addText(`• 총 행수: ${report.totalRows.toLocaleString()}`);
        addText(`• 유효 행수: ${report.validRows.toLocaleString()}`);
        addText(`• 파싱 실패: ${report.failedRows.toLocaleString()}`);
        addText(`• 고유 사용자: ${report.uniqueUsers.toLocaleString()}`);
        if (report.minDate && report.maxDate) {
            addText(`• 날짜 범위: ${report.minDate.toLocaleDateString()} ~ ${report.maxDate.toLocaleDateString()}`);
        }
        addText(`• Platform 결측률: ${report.platformMissingRate}%`);
        addText(`• Channel 결측률: ${report.channelMissingRate}%`);
        yPos += 5;

        // Top 10 Events Table
        if (report.topEvents.length > 0) {
            checkPageBreak(50);
            doc.setFontSize(11);
            doc.text('Top 10 이벤트:', margin, yPos);
            yPos += 6;

            doc.setFontSize(9);
            doc.setFillColor(240, 240, 250);
            doc.rect(margin, yPos - 4, contentWidth, 6, 'F');
            doc.text('이벤트명', margin + 2, yPos);
            doc.text('건수', margin + 80, yPos);
            doc.text('비중(%)', margin + 110, yPos);
            yPos += 6;

            report.topEvents.slice(0, 5).forEach(evt => {
                doc.text(evt.name.substring(0, 35), margin + 2, yPos);
                doc.text(evt.count.toLocaleString(), margin + 80, yPos);
                doc.text(`${evt.percentage}%`, margin + 110, yPos);
                yPos += 5;
            });
            yPos += 5;
        }
    }

    // 2. 퍼널 분석 결과
    if (AppState.funnelResults && AppState.funnelResults.length > 0) {
        addSectionTitle('퍼널 분석 결과', '🔽');

        doc.setFontSize(9);
        doc.setFillColor(240, 240, 250);
        doc.rect(margin, yPos - 4, contentWidth, 6, 'F');
        doc.text('단계', margin + 2, yPos);
        doc.text('사용자', margin + 60, yPos);
        doc.text('전환율', margin + 95, yPos);
        doc.text('이탈', margin + 125, yPos);
        yPos += 6;

        AppState.funnelResults.forEach(step => {
            checkPageBreak(6);
            doc.text(step.step.substring(0, 25), margin + 2, yPos);
            doc.text(step.users.toLocaleString(), margin + 60, yPos);
            doc.text(`${step.conversionRate.toFixed(1)}%`, margin + 95, yPos);
            doc.text(step.dropOff.toLocaleString(), margin + 125, yPos);
            yPos += 5;
        });
        yPos += 5;
        addChartToPdf('funnelChart', '퍼널 차트');
    }

    // 3. 리텐션 요약
    if (AppState.retentionResults && AppState.retentionResults.length > 0) {
        addSectionTitle('리텐션 요약', '📈');

        const avgRetention = {};
        ['D1', 'D7', 'D14'].forEach(day => {
            const dayIndex = parseInt(day.substring(1));
            const validValues = AppState.retentionResults
                .map(r => r.retention ? r.retention[dayIndex] : (r.days ? r.days[day] : null))
                .filter(v => v !== null && v !== undefined);
            if (validValues.length > 0) {
                avgRetention[day] = (validValues.reduce((a, b) => a + b, 0) / validValues.length).toFixed(1);
            }
        });

        addText(`• D1 리텐션: ${avgRetention.D1 || 'N/A'}%`);
        addText(`• D7 리텐션: ${avgRetention.D7 || 'N/A'}%`);
        addText(`• D14 리텐션: ${avgRetention.D14 || 'N/A'}%`);
        yPos += 5;
        addChartToPdf('retentionChart', '리텐션 곡선');
    }

    // 4. 세그먼트 비교
    if (AppState.segmentResults && AppState.segmentResults.length > 0) {
        addSectionTitle('세그먼트 비교', '🔍');

        const sorted = [...AppState.segmentResults].sort((a, b) => b.conversion - a.conversion);
        addText(`• 최고 성과: ${sorted[0].name} (${sorted[0].conversion.toFixed(1)}%)`);
        addText(`• 최저 성과: ${sorted[sorted.length - 1].name} (${sorted[sorted.length - 1].conversion.toFixed(1)}%)`);
        yPos += 3;

        doc.setFontSize(9);
        sorted.slice(0, 5).forEach(seg => {
            checkPageBreak(5);
            doc.text(`  - ${seg.name}: ${seg.conversion.toFixed(1)}%`, margin, yPos);
            yPos += 4;
        });
        yPos += 5;
        addChartToPdf('segmentChart', '세그먼트 전환율 비교');
    }

    // 5. 인사이트
    if (AppState.insights && AppState.insights.length > 0) {
        addSectionTitle('주요 인사이트', '💡');

        AppState.insights.slice(0, 5).forEach((insight, index) => {
            checkPageBreak(25);

            doc.setFontSize(11);
            doc.setTextColor(50, 50, 50);
            doc.text(`${index + 1}. ${insight.title}`, margin, yPos);
            yPos += 6;

            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);

            // Split long text into multiple lines
            const lines = doc.splitTextToSize(insight.body, contentWidth - 5);
            lines.forEach(line => {
                checkPageBreak(5);
                doc.text(line, margin + 3, yPos);
                yPos += 4;
            });

            if (insight.metric) {
                yPos += 2;
                doc.setTextColor(99, 102, 241);
                doc.text(`핵심 지표: ${insight.metric}`, margin + 3, yPos);
                yPos += 5;
            }

            doc.setTextColor(0, 0, 0);
            yPos += 3;
        });
    }

    // Footer
    checkPageBreak(20);
    yPos += 10;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('이 리포트는 Funnel & Retention Explorer에서 자동 생성되었습니다.', pageWidth / 2, yPos, { align: 'center' });

    // Save PDF (force proper filename + mime)
    downloadPdfWithFilename(doc, `analysis_report_${Date.now()}.pdf`);
}
