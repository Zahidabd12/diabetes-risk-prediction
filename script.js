// Global variables
let diabetesData = [];
let featureImportance = [];
let distributionData = [];
let featImportanceChart;
let distributionChart;

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Simulate loading CSV data
        // In a real implementation, you would fetch this from your server
        // fetch('diabetes_data.csv').then(response => response.text())...
        
        // For demo purposes, we'll simulate the data loading
        setTimeout(() => {
            initializeApp();
        }, 1000);
        
    } catch (error) {
        showError("Error loading data: " + error.message);
    }
});

// Handle window resize for charts
window.addEventListener('resize', function() {
    if (featImportanceChart) {
        featImportanceChart.resize();
    }
    if (distributionChart) {
        distributionChart.resize();
    }
});

// Initialize the application after data is loaded
function initializeApp() {
    hideLoading();
    setupEventListeners();
    calculateBMI();
    createFeatureImportanceChart();
    createDistributionChart();
}

// Set up event listeners
function setupEventListeners() {
    // Form submission
    document.getElementById('prediction-form').addEventListener('submit', handleFormSubmit);
    
    // Calculate BMI when weight or height changes
    document.getElementById('weight').addEventListener('input', calculateBMI);
    document.getElementById('height').addEventListener('input', calculateBMI);
    
    // Modal close button
    document.getElementById('close-modal').addEventListener('click', function() {
        document.getElementById('medical-alert-modal').style.display = 'none';
    });
    
    // Touch-friendly input adjustments for mobile
    if (window.innerWidth <= 480) {
        const numericInputs = document.querySelectorAll('input[type="number"]');
        numericInputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.setAttribute('inputmode', 'decimal');
            });
        });
    }
}

// Calculate BMI from weight and height
function calculateBMI() {
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value) / 100; // convert to meters
    
    if (weight > 0 && height > 0) {
        const bmi = weight / (height * height);
        document.getElementById('bmi').value = bmi.toFixed(2);
    }
}

// Handle form submission for prediction
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const formData = {
        weight: parseFloat(document.getElementById('weight').value),
        height: parseFloat(document.getElementById('height').value),
        blood_glucose: parseFloat(document.getElementById('blood_glucose').value),
        physical_activity: parseFloat(document.getElementById('physical_activity').value),
        diet: parseInt(document.getElementById('diet').value),
        medication_adherence: parseInt(document.getElementById('medication_adherence').value),
        stress_level: parseInt(document.getElementById('stress_level').value),
        sleep_hours: parseFloat(document.getElementById('sleep_hours').value),
        hydration_level: parseInt(document.getElementById('hydration_level').value),
        bmi: parseFloat(document.getElementById('bmi').value)
    };
    
    // Make prediction
    const result = predictDiabetesRisk(formData);
    
    // Show prediction result
    displayPredictionResult(result);
    
    // Show medical alert if high risk and confidence > 50%
    if (result.prediction && result.confidence > 50) {
        showMedicalAlert(result.confidence);
    }
    
    // Scroll to results on mobile
    if (window.innerWidth <= 768) {
        const resultElement = document.getElementById('prediction-result');
        resultElement.scrollIntoView({ behavior: 'smooth' });
    }
}

// Show medical alert modal
function showMedicalAlert(confidence) {
    document.getElementById('risk-percentage').textContent = confidence.toFixed(1) + '%';
    document.getElementById('medical-alert-modal').style.display = 'flex';
}

// Predict diabetes risk based on input data
function predictDiabetesRisk(inputData) {
    // Normalize the input values (simplified)
    const normalizedInput = {
        weight: normalizeValue(inputData.weight, 40, 150),
        height: normalizeValue(inputData.height, 140, 210),
        blood_glucose: normalizeValue(inputData.blood_glucose, 70, 200),
        physical_activity: normalizeValue(inputData.physical_activity, 0, 100),
        diet: inputData.diet,
        medication_adherence: inputData.medication_adherence,
        stress_level: normalizeValue(inputData.stress_level, 0, 10),
        sleep_hours: normalizeValue(inputData.sleep_hours, 3, 12),
        hydration_level: inputData.hydration_level,
        bmi: normalizeValue(inputData.bmi, 15, 45)
    };
    
    // Calculate risk score
    let riskScore = 0;
    
    // Blood glucose has highest impact
    if (normalizedInput.blood_glucose > 0.6) {
        riskScore += 35; // 35% of risk from blood glucose
    }
    
    // BMI impact
    if (normalizedInput.bmi > 0.6) {
        riskScore += 20; // 20% from BMI
    }
    
    // Physical activity impact (inverse relationship)
    riskScore += (1 - normalizedInput.physical_activity) * 15;
    
    // Diet impact (binary)
    if (normalizedInput.diet === 0) {
        riskScore += 8;
    }
    
    // Stress impact
    riskScore += normalizedInput.stress_level * 7;
    
    // Sleep impact (inverse relationship - less sleep is worse)
    riskScore += (1 - normalizedInput.sleep_hours) * 6;
    
    // Medication adherence (binary)
    if (normalizedInput.medication_adherence === 0) {
        riskScore += 4;
    }
    
    // Hydration level (binary)
    if (normalizedInput.hydration_level === 0) {
        riskScore += 3;
    }
    
    // Minor factors
    riskScore += normalizedInput.weight * 1;
    riskScore += (1 - normalizedInput.height) * 1;
    
    // Calculate confidence (simulated)
    const confidenceScore = 60 + Math.min(Math.abs(riskScore - 50) * 0.8, 39);
    
    return {
        prediction: riskScore > 30,
        confidence: confidenceScore,
        riskScore: riskScore
    };
}

// Helper function to normalize values
function normalizeValue(value, min, max) {
    return Math.min(Math.max((value - min) / (max - min), 0), 1);
}

// Display prediction result
function displayPredictionResult(result) {
    const resultElement = document.getElementById('prediction-result');
    resultElement.style.display = 'block';
    
    // Set the appropriate class based on the prediction
    resultElement.className = result.prediction ? 
        'prediction-result prediction-high-risk' : 
        'prediction-result prediction-low-risk';
    
    // Build the result HTML
    resultElement.innerHTML = `
        <div class="prediction-text">
            ${result.prediction ? 'High Risk of Diabetes' : 'Low Risk of Diabetes'}
        </div>
        <div class="confidence">
            Confidence: ${result.confidence.toFixed(1)}%
        </div>
    `;
}

// Create feature importance chart
function createFeatureImportanceChart() {
    // Sample feature importance data
    featureImportance = [
        { name: 'Blood Glucose', value: 0.35 },
        { name: 'BMI', value: 0.20 },
        { name: 'Physical Activity', value: 0.15 },
        { name: 'Diet', value: 0.08 },
        { name: 'Stress Level', value: 0.07 },
        { name: 'Sleep Hours', value: 0.06 },
        { name: 'Medication Adherence', value: 0.04 },
        { name: 'Hydration Level', value: 0.03 },
        { name: 'Weight', value: 0.01 },
        { name: 'Height', value: 0.01 }
    ];
    
    const ctx = document.getElementById('feature-importance-chart').getContext('2d');
    
    // Reverse array to display most important features at the top
    const sortedData = [...featureImportance].reverse();
    
    // For smaller screens, limit the number of features shown
    const displayData = window.innerWidth <= 480 ? 
        sortedData.slice(0, 6) : sortedData;
    
    // Create chart for feature importance
    featImportanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: displayData.map(item => item.name),
            datasets: [{
                label: 'Importance',
                data: displayData.map(item => item.value),
                backgroundColor: [
                    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
                    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
                ],
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: window.innerWidth > 480,
                        text: 'Importance'
                    },
                    ticks: {
                        font: {
                            size: window.innerWidth <= 480 ? 10 : 12
                        }
                    }
                },
                y: {
                    ticks: {
                        font: {
                            size: window.innerWidth <= 480 ? 10 : 12
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return (context.raw * 100).toFixed(1) + '%';
                        }
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Create distribution chart
function createDistributionChart() {
    // Sample distribution data
    distributionData = {
        labels: ['High Risk', 'Low Risk'],
        datasets: [{
            data: [65, 35], // 65% high risk, 35% low risk (example data)
            backgroundColor: ['#ef4444', '#10b981'],
            hoverOffset: 4
        }]
    };
    
    const ctx = document.getElementById('distribution-chart').getContext('2d');
    
    distributionChart = new Chart(ctx, {
        type: 'pie',
        data: distributionData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: window.innerWidth <= 480 ? 'bottom' : 'right',
                    labels: {
                        font: {
                            size: window.innerWidth <= 480 ? 10 : 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw + '%';
                        }
                    }
                }
            }
        }
    });
}

// Helper functions for UI state
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}