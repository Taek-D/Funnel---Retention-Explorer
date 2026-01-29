// Chart Configurations and Rendering

let funnelChartInstance = null;
let retentionChartInstance = null;
let segmentChartInstance = null;

// Render Funnel Chart
function renderFunnelChart() {
    const ctx = document.getElementById('funnelChart');

    // Destroy existing chart
    if (funnelChartInstance) {
        funnelChartInstance.destroy();
    }

    const data = AppState.funnelResults;

    funnelChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => `${d.stepNumber}. ${d.step}`),
            datasets: [{
                label: 'Users',
                data: data.map(d => d.users),
                backgroundColor: data.map((d, i) => {
                    if (i === 0) return 'rgba(99, 102, 241, 0.8)';
                    if (d.conversionRate < 30) return 'rgba(239, 68, 68, 0.8)';
                    if (d.conversionRate < 60) return 'rgba(245, 158, 11, 0.8)';
                    return 'rgba(16, 185, 129, 0.8)';
                }),
                borderColor: data.map((d, i) => {
                    if (i === 0) return 'rgba(99, 102, 241, 1)';
                    if (d.conversionRate < 30) return 'rgba(239, 68, 68, 1)';
                    if (d.conversionRate < 60) return 'rgba(245, 158, 11, 1)';
                    return 'rgba(16, 185, 129, 1)';
                }),
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 25, 54, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(99, 102, 241, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            const index = context.dataIndex;
                            const stepData = data[index];
                            return [
                                `Users: ${stepData.users.toLocaleString()}`,
                                `Conversion: ${stepData.conversionRate.toFixed(1)}%`,
                                `Drop-off: ${stepData.dropOff.toLocaleString()}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#f1f5f9',
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    }
                }
            }
        }
    });
}

// Render Retention Chart
function renderRetentionChart() {
    const ctx = document.getElementById('retentionChart');

    // Destroy existing chart
    if (retentionChartInstance) {
        retentionChartInstance.destroy();
    }

    const cohorts = AppState.retentionResults.slice(0, 5); // Show top 5 cohorts
    const days = Array.from({ length: 15 }, (_, i) => i);

    const datasets = cohorts.map((cohort, index) => {
        const colors = [
            'rgba(99, 102, 241, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(251, 146, 60, 1)',
            'rgba(34, 197, 94, 1)'
        ];

        return {
            label: cohort.cohortDate,
            data: days.map(day => cohort.days[`D${day}`] || 0),
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length].replace('1)', '0.1)'),
            borderWidth: 3,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: colors[index % colors.length],
            pointBorderColor: '#0a0e27',
            pointBorderWidth: 2
        };
    });

    retentionChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: days.map(d => `D${d}`),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#f1f5f9',
                        padding: 15,
                        font: {
                            size: 12
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 25, 54, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(99, 102, 241, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: function (value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

// Render Segment Comparison Chart
function renderSegmentChart() {
    const ctx = document.getElementById('segmentChart');

    // Destroy existing chart
    if (segmentChartInstance) {
        segmentChartInstance.destroy();
    }

    const data = AppState.segmentResults;

    // Color segments by type
    const colors = data.map(segment => {
        if (segment.type === 'platform') {
            return 'rgba(99, 102, 241, 0.8)';
        } else {
            return 'rgba(139, 92, 246, 0.8)';
        }
    });

    const borderColors = data.map(segment => {
        if (segment.type === 'platform') {
            return 'rgba(99, 102, 241, 1)';
        } else {
            return 'rgba(139, 92, 246, 1)';
        }
    });

    segmentChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.name),
            datasets: [{
                label: 'Conversion Rate (%)',
                data: data.map(d => d.conversion),
                backgroundColor: colors,
                borderColor: borderColors,
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 25, 54, 0.95)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(99, 102, 241, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            return `Conversion: ${context.parsed.y.toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#f1f5f9',
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: function (value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}
