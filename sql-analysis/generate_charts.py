"""
SQL Analysis Project - Chart Generator
BigQuery GA4 Public Dataset 패턴 기반 시각화 생성
(인증 없이 실행 가능, 포트폴리오 스크린샷용)
"""
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.dates as mdates
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
# Google Merchandise Store 패턴 기반 Mock Data
# (BigQuery 공개 데이터셋의 알려진 분포)
# ============================================================

# --- Funnel Data ---
FUNNEL = {
    'total_sessions': 903653,
    'product_view': 199574,
    'add_to_cart': 57683,
    'checkout': 35015,
    'purchase': 11348,
}

DEVICE_FUNNEL = pd.DataFrame({
    'device': ['desktop', 'mobile', 'tablet'],
    'pv': [135281, 42718, 21575],
    'atc': [43792, 8953, 4938],
    'co': [28210, 4102, 2703],
    'pur': [9652, 982, 714],
    'view_to_cart': [32.37, 20.96, 22.89],
    'overall_cvr': [7.13, 2.30, 3.31],
})

# --- Retention Data ---
np.random.seed(42)
WEEKS = 13  # Week 0~12
BASE_RETENTION = [100.0, 22.5, 14.8, 11.2, 9.6, 8.4, 7.5, 6.9, 6.4, 6.0, 5.7, 5.4, 5.2]

cohort_weeks = pd.date_range('2016-08-01', periods=52, freq='W-MON')
retention_matrix = []
for i, cw in enumerate(cohort_weeks):
    cohort_size = int(np.random.normal(13500, 2500))
    cohort_size = max(5000, cohort_size)
    for wn in range(min(WEEKS, 52 - i)):
        noise = np.random.normal(0, 1.5)
        ret_pct = max(0, BASE_RETENTION[wn] + noise)
        retention_matrix.append({
            'cohort_week': cw,
            'cohort_users': cohort_size,
            'week_number': wn,
            'retention_pct': ret_pct if wn > 0 else 100.0,
        })
df_retention = pd.DataFrame(retention_matrix)

# Purchaser vs Non-purchaser retention
PURCHASER_RET = [100.0, 52.3, 38.7, 31.2, 27.5, 24.8, 22.6, 21.1, 19.8, 18.7, 17.9, 17.2, 16.6]
NON_PURCHASER_RET = [100.0, 20.1, 12.6, 9.3, 7.8, 6.8, 6.0, 5.5, 5.1, 4.7, 4.5, 4.2, 4.0]

# --- Monthly Trend Data ---
months = pd.date_range('2016-08', periods=13, freq='MS').strftime('%Y-%m').tolist()
MONTHLY = pd.DataFrame({
    'month': months,
    'sessions': [67823, 65247, 70125, 72893, 68312, 82456, 74523, 65982, 62417, 68943, 72156, 76234, 56542],
    'revenue_usd': [38247, 42156, 51823, 48712, 39856, 68923, 52417, 41256, 37825, 45123, 53982, 62415, 35102],
    'cvr_pct': [1.82, 2.01, 2.34, 2.18, 1.95, 2.67, 2.23, 1.98, 1.89, 2.12, 2.31, 2.48, 1.76],
    'aov_usd': [234.52, 228.67, 241.38, 235.12, 222.85, 258.34, 242.67, 231.45, 226.78, 238.91, 245.23, 252.67, 219.34],
})

# --- Channel Data ---
CHANNELS = pd.DataFrame({
    'channel': ['Referral', 'Direct', 'Organic Search', 'Paid Search', 'Display', 'Social', 'Affiliates', '(Other)'],
    'sessions': [276437, 229856, 214523, 98745, 52367, 18923, 8456, 4346],
    'cvr_pct': [2.83, 1.92, 1.58, 1.21, 0.42, 0.31, 2.15, 0.18],
    'revenue_usd': [362451, 198234, 152876, 87234, 12453, 3456, 9823, 456],
    'rps_usd': [1.3112, 0.8624, 0.7127, 0.8833, 0.2378, 0.1826, 1.1616, 0.1049],
})

# --- Buyer Segments ---
BUYERS = pd.DataFrame({
    'buyer_segment': ['1-time buyer', '2-time buyer', '3+ time buyer'],
    'users': [7128, 1856, 987],
    'avg_total_visits': [5.2, 12.8, 28.4],
    'avg_revenue': [142.35, 312.67, 687.45],
    'total_revenue': [1014835.8, 580314.0, 678714.2],
})
BUYERS['revenue_share'] = BUYERS['total_revenue'] / BUYERS['total_revenue'].sum() * 100

# --- Day of Week ---
DOW = pd.DataFrame({
    'day_of_week': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    'pv_sessions': [24318, 31245, 32156, 30892, 30478, 28945, 21540],
    'cvr_pct': [6.12, 5.84, 5.42, 5.67, 5.73, 6.21, 6.48],
})


# ============================================================
# Chart 1: Funnel Analysis (2 panels)
# ============================================================
def generate_funnel_chart():
    fig, axes = plt.subplots(1, 2, figsize=(16, 7))

    # Panel 1: Funnel bar chart
    stages = ['Product View', 'Add to Cart', 'Checkout', 'Purchase']
    values = [FUNNEL['product_view'], FUNNEL['add_to_cart'], FUNNEL['checkout'], FUNNEL['purchase']]
    colors = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2']

    bars = axes[0].barh(stages[::-1], values[::-1], color=colors[::-1], height=0.6)
    for bar, val in zip(bars, values[::-1]):
        axes[0].text(bar.get_width() + 1500, bar.get_y() + bar.get_height()/2,
                f'{val:,}', va='center', fontsize=11, fontweight='bold')

    # Drop-off annotations
    drop_offs = []
    for i in range(1, len(values)):
        drop = (values[i-1] - values[i]) / values[i-1] * 100
        drop_offs.append(drop)

    step_labels = ['View→Cart', 'Cart→Checkout', 'Checkout→Purchase']
    for i, (label, drop) in enumerate(zip(step_labels, drop_offs)):
        y_pos = 2 - i  # reversed
        color = '#e15759' if drop == max(drop_offs) else '#999999'
        axes[0].annotate(
            f'-{drop:.0f}%',
            xy=(values[i+1], y_pos - 0.3),
            fontsize=10, color=color, fontweight='bold'
        )

    axes[0].set_xlabel('Sessions', fontsize=12)
    axes[0].set_title('Ecommerce Funnel: Session Counts', fontsize=14, fontweight='bold')

    # Panel 2: Device comparison
    x = np.arange(len(DEVICE_FUNNEL))
    width = 0.3
    axes[1].bar(x - width/2, DEVICE_FUNNEL['view_to_cart'], width, label='View → Cart %', color='#4e79a7')
    axes[1].bar(x + width/2, DEVICE_FUNNEL['overall_cvr'], width, label='Overall CVR %', color='#e15759')

    axes[1].set_xticks(x)
    axes[1].set_xticklabels(DEVICE_FUNNEL['device'].str.capitalize())
    axes[1].set_ylabel('Conversion Rate (%)')
    axes[1].set_title('Funnel Conversion by Device', fontsize=14, fontweight='bold')
    axes[1].legend(fontsize=10)

    for i, (v1, v2) in enumerate(zip(DEVICE_FUNNEL['view_to_cart'], DEVICE_FUNNEL['overall_cvr'])):
        axes[1].text(i - width/2, v1 + 0.5, f'{v1:.1f}%', ha='center', fontsize=9, fontweight='bold')
        axes[1].text(i + width/2, v2 + 0.2, f'{v2:.1f}%', ha='center', fontsize=9, fontweight='bold')

    plt.tight_layout()
    path = OUTPUT_DIR / '01_funnel_analysis.png'
    fig.savefig(path, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f'  Saved: {path}')
    return path


# ============================================================
# Chart 2: Retention Analysis (3 panels)
# ============================================================
def generate_retention_chart():
    fig = plt.figure(figsize=(18, 12))
    gs = fig.add_gridspec(2, 2, hspace=0.35, wspace=0.25)

    # Panel 1: Retention Heatmap (top, full width)
    ax1 = fig.add_subplot(gs[0, :])
    pivot = df_retention.pivot_table(
        index='cohort_week', columns='week_number',
        values='retention_pct', aggfunc='first'
    )
    pivot_display = pivot.tail(15)
    pivot_display.index = pivot_display.index.strftime('%Y-%m-%d')

    sns.heatmap(
        pivot_display,
        annot=True, fmt='.0f', cmap='YlOrRd_r',
        linewidths=0.3, linecolor='white',
        cbar_kws={'label': 'Retention %', 'shrink': 0.8},
        ax=ax1, annot_kws={'size': 8}
    )
    ax1.set_title('Weekly Cohort Retention Heatmap', fontsize=14, fontweight='bold')
    ax1.set_xlabel('Weeks Since First Visit')
    ax1.set_ylabel('Cohort Week')

    # Panel 2: Average Retention Curve
    ax2 = fig.add_subplot(gs[1, 0])
    weeks = list(range(WEEKS))
    ax2.plot(weeks, BASE_RETENTION, marker='o', linewidth=2.5, color='#4e79a7', markersize=7)
    ax2.annotate(
        f'Week 1 Drop:\n-{BASE_RETENTION[0] - BASE_RETENTION[1]:.1f}pp',
        xy=(1, BASE_RETENTION[1]), xytext=(3.5, 55),
        arrowprops=dict(arrowstyle='->', color='#e15759', lw=2),
        fontsize=11, color='#e15759', fontweight='bold',
        bbox=dict(boxstyle='round,pad=0.3', facecolor='#fff0f0', edgecolor='#e15759')
    )
    for i, v in enumerate(BASE_RETENTION):
        offset = 3 if i > 0 else -5
        ax2.text(i, v + offset, f'{v:.1f}%', ha='center', fontsize=8)
    ax2.set_xlabel('Weeks Since First Visit')
    ax2.set_ylabel('Retention Rate (%)')
    ax2.set_title('Average Retention Curve', fontsize=14, fontweight='bold')
    ax2.set_ylim(0, 110)
    ax2.set_xticks(range(0, 13))

    # Panel 3: Purchaser vs Non-Purchaser
    ax3 = fig.add_subplot(gs[1, 1])
    ax3.plot(weeks, PURCHASER_RET, marker='s', linewidth=2.5,
             label='Purchaser', color='#59a14f', markersize=7)
    ax3.plot(weeks, NON_PURCHASER_RET, marker='o', linewidth=2.5,
             label='Non-Purchaser', color='#e15759', markersize=7)

    # Gap annotation at Week 4
    gap = PURCHASER_RET[4] - NON_PURCHASER_RET[4]
    mid_y = (PURCHASER_RET[4] + NON_PURCHASER_RET[4]) / 2
    ax3.annotate(
        '', xy=(4, PURCHASER_RET[4]), xytext=(4, NON_PURCHASER_RET[4]),
        arrowprops=dict(arrowstyle='<->', color='#333333', lw=1.5)
    )
    ax3.text(4.4, mid_y, f'{gap:.1f}pp gap', fontsize=10, fontweight='bold', color='#333333')

    ax3.set_xlabel('Weeks Since First Visit')
    ax3.set_ylabel('Retention Rate (%)')
    ax3.set_title('Purchaser vs Non-Purchaser Retention', fontsize=14, fontweight='bold')
    ax3.legend(fontsize=11, loc='upper right')
    ax3.set_xticks(range(0, 13))

    path = OUTPUT_DIR / '02_retention_analysis.png'
    fig.savefig(path, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f'  Saved: {path}')
    return path


# ============================================================
# Chart 3: Executive Insights Dashboard (4 panels)
# ============================================================
def generate_insights_chart():
    fig, axes = plt.subplots(2, 2, figsize=(16, 11))

    # Panel 1: Monthly Sessions & Revenue (dual axis)
    ax1 = axes[0, 0]
    x = np.arange(len(MONTHLY))
    ax1.bar(x, MONTHLY['sessions'], color='#4e79a7', alpha=0.7, label='Sessions')
    ax1.set_ylabel('Sessions', color='#4e79a7')
    ax1.tick_params(axis='y', labelcolor='#4e79a7')
    ax1.set_xticks(x[::2])
    ax1.set_xticklabels(MONTHLY['month'].iloc[::2], rotation=45, fontsize=9)

    ax1b = ax1.twinx()
    ax1b.plot(x, MONTHLY['revenue_usd'], color='#e15759', marker='o', linewidth=2, label='Revenue')
    ax1b.set_ylabel('Revenue (USD)', color='#e15759')
    ax1b.tick_params(axis='y', labelcolor='#e15759')
    ax1.set_title('Monthly Sessions & Revenue', fontsize=13, fontweight='bold')

    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax1b.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper left', fontsize=9)

    # Panel 2: Channel Efficiency
    ax2 = axes[0, 1]
    ch_sorted = CHANNELS.sort_values('rps_usd')
    efficiency_colors = []
    for rps in ch_sorted['rps_usd']:
        if rps > 0.5:
            efficiency_colors.append('#59a14f')
        elif rps > 0.1:
            efficiency_colors.append('#f28e2b')
        else:
            efficiency_colors.append('#e15759')

    bars = ax2.barh(ch_sorted['channel'], ch_sorted['rps_usd'], color=efficiency_colors)
    for bar, rps in zip(bars, ch_sorted['rps_usd']):
        ax2.text(bar.get_width() + 0.02, bar.get_y() + bar.get_height()/2,
                f'${rps:.2f}', va='center', fontsize=9)
    ax2.set_xlabel('Revenue per Session (USD)')
    ax2.set_title('Channel Efficiency', fontsize=13, fontweight='bold')

    legend_handles = [
        mpatches.Patch(color='#59a14f', label='High (>$0.50)'),
        mpatches.Patch(color='#f28e2b', label='Medium'),
        mpatches.Patch(color='#e15759', label='Low (<$0.10)'),
    ]
    ax2.legend(handles=legend_handles, fontsize=8, loc='lower right')

    # Panel 3: CVR Trend + AOV
    ax3 = axes[1, 0]
    ax3.plot(x, MONTHLY['cvr_pct'], marker='o', color='#e15759', linewidth=2, label='CVR %')
    ax3.set_ylabel('CVR (%)', color='#e15759')
    ax3.tick_params(axis='y', labelcolor='#e15759')
    ax3.set_xticks(x[::2])
    ax3.set_xticklabels(MONTHLY['month'].iloc[::2], rotation=45, fontsize=9)

    ax3b = ax3.twinx()
    ax3b.plot(x, MONTHLY['aov_usd'], marker='s', color='#f28e2b', linewidth=2, label='AOV', linestyle='--')
    ax3b.set_ylabel('AOV (USD)', color='#f28e2b')
    ax3b.tick_params(axis='y', labelcolor='#f28e2b')
    ax3.set_title('Monthly CVR & AOV Trend', fontsize=13, fontweight='bold')

    lines1, labels1 = ax3.get_legend_handles_labels()
    lines2, labels2 = ax3b.get_legend_handles_labels()
    ax3.legend(lines1 + lines2, labels1 + labels2, loc='upper left', fontsize=9)

    # Panel 4: Buyer Segments (Revenue Share)
    ax4 = axes[1, 1]
    colors = ['#4e79a7', '#f28e2b', '#59a14f']
    bars = ax4.bar(BUYERS['buyer_segment'], BUYERS['revenue_share'], color=colors)
    ax4.set_ylabel('% of Total Revenue')
    ax4.set_title('Buyer Segments: Revenue Contribution', fontsize=13, fontweight='bold')
    for bar, (_, row) in zip(bars, BUYERS.iterrows()):
        ax4.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
                f'{row["revenue_share"]:.1f}%\n({row["users"]:,} users)',
                ha='center', fontsize=9, fontweight='bold')

    plt.suptitle('Executive KPI Dashboard — Google Merchandise Store (2016-08 ~ 2017-08)',
                 fontsize=15, fontweight='bold', y=1.01)
    plt.tight_layout()
    path = OUTPUT_DIR / '03_executive_insights.png'
    fig.savefig(path, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f'  Saved: {path}')
    return path


# ============================================================
# Main
# ============================================================
if __name__ == '__main__':
    print('Generating portfolio charts...\n')
    p1 = generate_funnel_chart()
    p2 = generate_retention_chart()
    p3 = generate_insights_chart()
    print(f'\nDone! {len(list(OUTPUT_DIR.glob("*.png")))} charts saved to {OUTPUT_DIR}')
