"""
ML Analysis Project - Chart Generator
포트폴리오 스크린샷용 시각화 생성 (인증/데이터 없이 실행 가능)
"""
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns
from pathlib import Path

# 스타일 설정
sns.set_theme(style='whitegrid', palette='colorblind')
plt.rcParams['figure.dpi'] = 150
plt.rcParams['font.size'] = 11
plt.rcParams['axes.titlesize'] = 14
plt.rcParams['axes.labelsize'] = 12

OUTPUT_DIR = Path(__file__).parent / 'screenshots'
OUTPUT_DIR.mkdir(exist_ok=True)

# ============================================================
# Mock Data (실제 데이터 분포 패턴 기반)
# ============================================================

np.random.seed(42)

# --- RFM Segmentation Data ---
RFM_SEGMENTS = pd.DataFrame({
    'Segment': ['Champions', 'Loyal Customers', 'At-Risk', 'Lost'],
    'Customers': [847, 1236, 1089, 1200],
    'Avg_Recency': [12, 45, 168, 285],
    'Avg_Frequency': [12.3, 5.8, 8.2, 1.4],
    'Avg_Monetary': [1847.50, 523.80, 1102.30, 87.60],
    'Revenue_Share': [42.3, 24.1, 28.5, 5.1],
})

# --- Churn Data ---
CHURN_BY_FEATURE = pd.DataFrame({
    'Feature': ['Month-to-month', 'One year', 'Two year',
                'Fiber optic', 'DSL', 'No Internet',
                'No TechSupport', 'TechSupport',
                'No OnlineSecurity', 'OnlineSecurity'],
    'Category': ['Contract', 'Contract', 'Contract',
                 'Internet', 'Internet', 'Internet',
                 'TechSupport', 'TechSupport',
                 'OnlineSecurity', 'OnlineSecurity'],
    'Churn_Rate': [0.427, 0.113, 0.029,
                   0.418, 0.190, 0.074,
                   0.416, 0.153,
                   0.418, 0.146],
})

# --- Model Comparison ---
MODEL_RESULTS = pd.DataFrame({
    'Model': ['Logistic Regression', 'Random Forest', 'XGBoost (Tuned)'],
    'Accuracy': [0.782, 0.791, 0.812],
    'Precision': [0.623, 0.651, 0.694],
    'Recall': [0.784, 0.726, 0.801],
    'F1': [0.694, 0.687, 0.744],
    'ROC_AUC': [0.843, 0.838, 0.872],
})

# --- ROC Curve Data ---
# Logistic Regression
fpr_lr = np.array([0, 0.05, 0.10, 0.15, 0.25, 0.40, 0.60, 0.80, 1.0])
tpr_lr = np.array([0, 0.35, 0.52, 0.64, 0.78, 0.88, 0.94, 0.97, 1.0])

# Random Forest
fpr_rf = np.array([0, 0.04, 0.08, 0.14, 0.22, 0.35, 0.55, 0.78, 1.0])
tpr_rf = np.array([0, 0.32, 0.50, 0.62, 0.76, 0.87, 0.93, 0.97, 1.0])

# XGBoost
fpr_xgb = np.array([0, 0.03, 0.07, 0.12, 0.20, 0.32, 0.50, 0.75, 1.0])
tpr_xgb = np.array([0, 0.40, 0.58, 0.70, 0.82, 0.91, 0.96, 0.98, 1.0])

# --- SHAP Feature Importance ---
SHAP_FEATURES = pd.DataFrame({
    'Feature': ['Contract', 'tenure', 'MonthlyCharges', 'OnlineSecurity',
                'TechSupport', 'InternetService', 'PaymentMethod',
                'TotalCharges', 'Dependents', 'Partner'],
    'Mean_SHAP': [0.312, 0.287, 0.198, 0.156, 0.142,
                  0.128, 0.095, 0.082, 0.054, 0.048],
}).sort_values('Mean_SHAP', ascending=True)


# ============================================================
# Chart 1: RFM Segmentation Heatmap
# ============================================================
def generate_rfm_heatmap():
    fig, axes = plt.subplots(1, 2, figsize=(16, 7))

    # Panel 1: Segment distribution (pie + bar)
    colors = {'Champions': '#59a14f', 'Loyal Customers': '#4e79a7',
              'At-Risk': '#f28e2b', 'Lost': '#e15759'}
    seg_colors = [colors[s] for s in RFM_SEGMENTS['Segment']]

    axes[0].pie(RFM_SEGMENTS['Customers'], labels=RFM_SEGMENTS['Segment'],
                autopct='%1.1f%%', colors=seg_colors, startangle=90,
                textprops={'fontsize': 10, 'fontweight': 'bold'})
    axes[0].set_title('Customer Segment Distribution (K-Means, k=4)',
                       fontsize=13, fontweight='bold')

    # Panel 2: RFM Heatmap (normalized)
    rfm_data = RFM_SEGMENTS.set_index('Segment')[['Avg_Recency', 'Avg_Frequency', 'Avg_Monetary']]
    rfm_norm = rfm_data.copy()
    for col in rfm_norm.columns:
        if col == 'Avg_Recency':
            rfm_norm[col] = 1 - (rfm_norm[col] - rfm_norm[col].min()) / (rfm_norm[col].max() - rfm_norm[col].min())
        else:
            rfm_norm[col] = (rfm_norm[col] - rfm_norm[col].min()) / (rfm_norm[col].max() - rfm_norm[col].min())

    rfm_norm.columns = ['Recency\n(inverted)', 'Frequency', 'Monetary']

    sns.heatmap(rfm_norm, annot=True, fmt='.2f', cmap='YlOrRd',
                linewidths=0.5, ax=axes[1],
                cbar_kws={'label': 'Normalized Score (0-1)'})
    axes[1].set_title('RFM Score by Segment (Normalized)', fontsize=13, fontweight='bold')

    plt.suptitle('RFM Segmentation — UCI Online Retail (K-Means Clustering)',
                 fontsize=15, fontweight='bold', y=1.01)
    plt.tight_layout()
    path = OUTPUT_DIR / '01_rfm_segmentation.png'
    fig.savefig(path, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f'  Saved: {path}')
    return path


# ============================================================
# Chart 2: Churn Rate by Feature
# ============================================================
def generate_churn_by_feature():
    fig, axes = plt.subplots(1, 2, figsize=(16, 7))

    avg_churn = 0.265

    # Panel 1: Contract type
    contract = CHURN_BY_FEATURE[CHURN_BY_FEATURE['Category'] == 'Contract']
    colors = ['#e15759' if r > avg_churn else '#4e79a7' for r in contract['Churn_Rate']]
    bars = axes[0].bar(contract['Feature'], contract['Churn_Rate'] * 100, color=colors, width=0.5)
    axes[0].axhline(avg_churn * 100, color='gray', linestyle='--', alpha=0.6,
                     label=f'Average: {avg_churn:.1%}')
    for bar, v in zip(bars, contract['Churn_Rate'] * 100):
        axes[0].text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
                     f'{v:.1f}%', ha='center', fontsize=10, fontweight='bold')
    axes[0].set_ylabel('Churn Rate (%)')
    axes[0].set_title('Churn Rate by Contract Type', fontsize=13, fontweight='bold')
    axes[0].legend(fontsize=10)

    # Panel 2: Service features
    services = CHURN_BY_FEATURE[CHURN_BY_FEATURE['Category'].isin(['Internet', 'TechSupport', 'OnlineSecurity'])]
    colors = ['#e15759' if r > avg_churn else '#4e79a7' for r in services['Churn_Rate']]
    bars = axes[1].barh(services['Feature'], services['Churn_Rate'] * 100, color=colors)
    axes[1].axvline(avg_churn * 100, color='gray', linestyle='--', alpha=0.6,
                     label=f'Average: {avg_churn:.1%}')
    for bar, v in zip(bars, services['Churn_Rate'] * 100):
        axes[1].text(bar.get_width() + 0.5, bar.get_y() + bar.get_height()/2,
                     f'{v:.1f}%', va='center', fontsize=9, fontweight='bold')
    axes[1].set_xlabel('Churn Rate (%)')
    axes[1].set_title('Churn Rate by Service Feature', fontsize=13, fontweight='bold')
    axes[1].legend(fontsize=10)

    plt.suptitle('Telco Customer Churn — Key Risk Factors',
                 fontsize=15, fontweight='bold', y=1.01)
    plt.tight_layout()
    path = OUTPUT_DIR / '02_churn_by_feature.png'
    fig.savefig(path, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f'  Saved: {path}')
    return path


# ============================================================
# Chart 3: Model Comparison
# ============================================================
def generate_model_comparison():
    fig, ax = plt.subplots(figsize=(14, 7))

    metrics = ['Accuracy', 'Precision', 'Recall', 'F1', 'ROC_AUC']
    x = np.arange(len(metrics))
    width = 0.25

    colors = ['#4e79a7', '#f28e2b', '#59a14f']

    for i, (_, row) in enumerate(MODEL_RESULTS.iterrows()):
        values = [row[m] for m in metrics]
        bars = ax.bar(x + i * width, values, width, label=row['Model'], color=colors[i])
        for bar, v in zip(bars, values):
            ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.008,
                    f'{v:.3f}', ha='center', fontsize=8, fontweight='bold')

    ax.set_xticks(x + width)
    ax.set_xticklabels(['Accuracy', 'Precision', 'Recall', 'F1', 'ROC-AUC'])
    ax.set_ylabel('Score')
    ax.set_ylim(0, 1.05)
    ax.set_title('Churn Prediction — Model Performance Comparison', fontsize=15, fontweight='bold')
    ax.legend(fontsize=11, loc='lower right')

    # Best model 강조
    ax.annotate('Best Model', xy=(4 + 2*width, MODEL_RESULTS.iloc[2]['ROC_AUC']),
                xytext=(3.2, 0.95),
                arrowprops=dict(arrowstyle='->', color='#59a14f', lw=2),
                fontsize=11, fontweight='bold', color='#59a14f')

    plt.tight_layout()
    path = OUTPUT_DIR / '03_model_comparison.png'
    fig.savefig(path, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f'  Saved: {path}')
    return path


# ============================================================
# Chart 4: ROC Curves
# ============================================================
def generate_roc_curves():
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))

    # ROC Curves
    axes[0].plot(fpr_lr, tpr_lr, label='Logistic Regression (AUC=0.843)',
                 color='#4e79a7', linewidth=2)
    axes[0].plot(fpr_rf, tpr_rf, label='Random Forest (AUC=0.838)',
                 color='#f28e2b', linewidth=2)
    axes[0].plot(fpr_xgb, tpr_xgb, label='XGBoost Tuned (AUC=0.872)',
                 color='#59a14f', linewidth=2.5)
    axes[0].plot([0, 1], [0, 1], 'k--', alpha=0.3, label='Random (AUC=0.500)')
    axes[0].set_xlabel('False Positive Rate')
    axes[0].set_ylabel('True Positive Rate')
    axes[0].set_title('ROC Curve Comparison', fontsize=14, fontweight='bold')
    axes[0].legend(fontsize=9, loc='lower right')

    # Confusion Matrix (XGBoost best)
    cm = np.array([[892, 142], [74, 301]])
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=['Retained', 'Churned'],
                yticklabels=['Retained', 'Churned'],
                ax=axes[1], linewidths=0.5,
                annot_kws={'size': 14, 'fontweight': 'bold'})
    axes[1].set_xlabel('Predicted', fontsize=12)
    axes[1].set_ylabel('Actual', fontsize=12)
    axes[1].set_title('Confusion Matrix (XGBoost Tuned)', fontsize=14, fontweight='bold')

    # 주석
    tn, fp, fn, tp = cm.ravel()
    recall = tp / (tp + fn)
    axes[1].text(0.5, -0.15, f'Recall: {recall:.1%} — Catches {recall:.0%} of churners',
                 transform=axes[1].transAxes, ha='center', fontsize=10,
                 fontweight='bold', color='#59a14f')

    plt.tight_layout()
    path = OUTPUT_DIR / '04_roc_confusion.png'
    fig.savefig(path, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f'  Saved: {path}')
    return path


# ============================================================
# Chart 5: SHAP Summary + Business Impact
# ============================================================
def generate_shap_summary():
    fig, axes = plt.subplots(1, 2, figsize=(16, 7))

    # Panel 1: SHAP Bar Plot
    colors = ['#59a14f' if v > 0.15 else '#4e79a7' if v > 0.08 else '#b0b0b0'
              for v in SHAP_FEATURES['Mean_SHAP']]
    bars = axes[0].barh(SHAP_FEATURES['Feature'], SHAP_FEATURES['Mean_SHAP'],
                         color=colors)
    for bar, v in zip(bars, SHAP_FEATURES['Mean_SHAP']):
        axes[0].text(bar.get_width() + 0.005, bar.get_y() + bar.get_height()/2,
                     f'{v:.3f}', va='center', fontsize=9)
    axes[0].set_xlabel('Mean |SHAP value|')
    axes[0].set_title('Feature Importance (SHAP)', fontsize=14, fontweight='bold')

    legend_handles = [
        mpatches.Patch(color='#59a14f', label='High impact (>0.15)'),
        mpatches.Patch(color='#4e79a7', label='Medium (0.08-0.15)'),
        mpatches.Patch(color='#b0b0b0', label='Low (<0.08)'),
    ]
    axes[0].legend(handles=legend_handles, fontsize=8, loc='lower right')

    # Panel 2: Business Impact Dashboard
    # Campaign ROI waterfall
    campaign_cost = -44700
    saved_revenue = 264600
    net_benefit = saved_revenue + campaign_cost

    steps = ['Campaign\nCost', 'Saved Revenue\n(12 months)', 'Net Benefit']
    values = [campaign_cost, saved_revenue, net_benefit]
    bar_colors = ['#e15759', '#59a14f', '#4e79a7']

    bars = axes[1].bar(steps, values, color=bar_colors, width=0.5)
    for bar, v in zip(bars, values):
        offset = 5000 if v > 0 else -12000
        axes[1].text(bar.get_x() + bar.get_width()/2, v + offset,
                     f'${abs(v):,.0f}', ha='center', fontsize=11, fontweight='bold')

    axes[1].axhline(0, color='black', linewidth=0.5)
    roi = (net_benefit / abs(campaign_cost)) * 100
    axes[1].set_title(f'Retention Campaign ROI: {roi:.0f}%', fontsize=14, fontweight='bold')
    axes[1].set_ylabel('Amount ($)')

    plt.suptitle('ML-Driven Churn Prevention — Interpretation & Business Impact',
                 fontsize=15, fontweight='bold', y=1.01)
    plt.tight_layout()
    path = OUTPUT_DIR / '05_shap_business_impact.png'
    fig.savefig(path, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f'  Saved: {path}')
    return path


# ============================================================
# Main
# ============================================================
if __name__ == '__main__':
    print('Generating ML portfolio charts...\n')
    p1 = generate_rfm_heatmap()
    p2 = generate_churn_by_feature()
    p3 = generate_model_comparison()
    p4 = generate_roc_curves()
    p5 = generate_shap_summary()
    print(f'\nDone! {len(list(OUTPUT_DIR.glob("*.png")))} charts saved to {OUTPUT_DIR}')
