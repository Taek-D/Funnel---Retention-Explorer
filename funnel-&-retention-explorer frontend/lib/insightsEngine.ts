import type {
  ProcessedEvent, Insight, DatasetType,
  SubscriptionKPIs, TrialAnalysis, ChurnAnalysis, RetentionCohort
} from '../types';
import { calculateFullDataFunnel } from './funnelEngine';
import { calculateFullDataRetention } from './retentionEngine';
import { calculateFullDataSegments } from './segmentEngine';
import { INSIGHTS_RETENTION_MAX_DAYS } from './constants';

export function generateInsights(
  processedData: ProcessedEvent[],
  detectedType: DatasetType,
  subscriptionKPIs: SubscriptionKPIs | null,
  trialAnalysis: TrialAnalysis | null,
  churnAnalysis: ChurnAnalysis | null,
  paidRetention: RetentionCohort[] | null
): Insight[] {
  const insights: Insight[] = [];

  const fullFunnelResults = detectedType ? calculateFullDataFunnel(processedData, detectedType) : null;
  const fullSegmentResults = detectedType ? calculateFullDataSegments(processedData, detectedType) : null;
  const fullRetentionResults = calculateFullDataRetention(processedData);

  // Insight 1: Maximum leakage step
  if (fullFunnelResults && fullFunnelResults.length > 1) {
    const lowestConversion = fullFunnelResults.slice(1).reduce((min, step) =>
      step.conversionRate < min.conversionRate ? step : min
    );

    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: '최대 이탈 지점 발견',
      body: `가장 큰 이탈이 "${lowestConversion.step}" 단계에서 발생합니다. 전환율은 ${lowestConversion.conversionRate.toFixed(1)}%이며, 이 단계에서 ${lowestConversion.dropOff}명의 사용자가 이탈했습니다.`,
      metric: lowestConversion.conversionRate.toFixed(1) + '%',
      recommendations: [
        '이 단계에서 사용자 경험 단순화',
        '진행 상황 표시기를 추가하여 완료 유도',
        '다양한 흐름에 대한 A/B 테스트 고려'
      ]
    });
  }

  // Insight 2: Platform performance gap
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
          body: `${platformSegments[platformSegments.length - 1].name}이(가) ${platformSegments[0].name}보다 ${gap.toFixed(1)}%p 낮은 전환율을 보입니다.`,
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

  // Insight 3: Channel gap
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
          body: `${channelSegments[0].name}이(가) ${channelSegments[channelSegments.length - 1].name}보다 ${gap.toFixed(1)}%p 더 나은 성과를 보입니다.`,
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

  // Insight 4: Low D1 retention
  if (fullRetentionResults && fullRetentionResults.length > 0) {
    const avgD1 = fullRetentionResults.reduce((sum, r) => sum + (r.days.D1 || 0), 0) / fullRetentionResults.length;
    if (avgD1 < 25) {
      insights.push({
        type: 'danger',
        icon: '📉',
        title: 'D1 리텐션 낮음 경고',
        body: `D1 리텐션이 ${avgD1.toFixed(1)}%에 불과하며, 이는 건강한 임계값 25%보다 낮습니다.`,
        metric: avgD1.toFixed(1) + '%',
        recommendations: [
          '온보딩을 개선하여 빠르게 가치 입증',
          '개인화된 D1 참여 알림 발송',
          '첫 세션에서 빠른 성과 또는 업적 구현'
        ]
      });
    }
  }

  // Insight 5: Steepest retention drop
  if (fullRetentionResults && fullRetentionResults.length > 0) {
    const avgByDay: Record<number, number> = {};
    for (let day = 0; day <= INSIGHTS_RETENTION_MAX_DAYS; day++) {
      avgByDay[day] = fullRetentionResults.reduce((sum, r) => sum + (r.days[`D${day}`] || 0), 0) / fullRetentionResults.length;
    }

    let maxDrop = 0;
    let maxDropDay = 0;
    for (let day = 1; day <= INSIGHTS_RETENTION_MAX_DAYS; day++) {
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
        body: `가장 큰 리텐션 하락(${maxDrop.toFixed(1)}%p)이 Day ${maxDropDay - 1}과 Day ${maxDropDay} 사이에 발생합니다.`,
        metric: `D${maxDropDay - 1} → D${maxDropDay}`,
        recommendations: [
          `Day ${maxDropDay - 1}에 참여 캠페인 시작`,
          '이 시점에 새로운 콘텐츠 또는 기능 도입',
          '이탈한 사용자를 대상으로 설문조사'
        ]
      });
    }
  }

  // Insight 6: Best performing segment
  if (fullSegmentResults && fullSegmentResults.length > 0) {
    const bestSegment = fullSegmentResults.reduce((best, seg) =>
      seg.conversion > best.conversion ? seg : best
    );

    if (bestSegment.conversion > 10) {
      insights.push({
        type: 'success',
        icon: '✨',
        title: '최고 성과 세그먼트',
        body: `${bestSegment.name}이(가) ${bestSegment.conversion.toFixed(1)}% 전환율로 강력한 성과를 보입니다.`,
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
  if (detectedType === 'subscription') {
    // S1: Trial → Subscribe conversion
    if (trialAnalysis && trialAnalysis.overall) {
      const convRate = trialAnalysis.overall.conversion_rate;
      if (convRate < 35 && trialAnalysis.overall.trial_users >= 30) {
        insights.push({
          type: 'warning',
          icon: '🎯',
          title: '체험 → 구독 전환율 개선 필요',
          body: `체험판 사용자의 ${convRate.toFixed(1)}%만 유료 구독으로 전환합니다 (n=${trialAnalysis.overall.trial_users}).`,
          metric: convRate.toFixed(1) + '%',
          recommendations: [
            '체험 기간 중 핵심 기능 체험 유도',
            '체험 종료 전 리마인더 및 혜택 제공',
            '온보딩 플로우 개선으로 가치 빠른 전달'
          ]
        });
      }
    }

    // S2: Slow conversion time
    if (trialAnalysis?.overall?.median_hours) {
      const medianDays = trialAnalysis.overall.median_hours / 24;
      if (medianDays > 10) {
        insights.push({
          type: 'warning',
          icon: '⏱️',
          title: '구독 결정 지연',
          body: `체험 시작 후 구독까지 중간값 ${medianDays.toFixed(1)}일이 소요됩니다.`,
          metric: `${medianDays.toFixed(1)}일`,
          recommendations: [
            '체험 기간 단축 테스트 (7일 vs 14일)',
            '조기 전환 인센티브 제공',
            '체험 중 가치 입증 포인트 추가'
          ]
        });
      }
    }

    // S3: Payment failure
    if (subscriptionKPIs && subscriptionKPIs.payment_failed_events > 0) {
      const totalPaymentAttempts = subscriptionKPIs.subscribe_events + subscriptionKPIs.renew_events + subscriptionKPIs.payment_failed_events;
      const failureRate = totalPaymentAttempts > 0 ? (subscriptionKPIs.payment_failed_events / totalPaymentAttempts) * 100 : 0;
      if (failureRate >= 10) {
        insights.push({
          type: 'danger',
          icon: '💳',
          title: '결제 실패율 높음',
          body: `결제 시도 중 ${failureRate.toFixed(1)}%가 실패했습니다 (${subscriptionKPIs.payment_failed_events}건).`,
          metric: failureRate.toFixed(1) + '%',
          recommendations: [
            '결제 수단 업데이트 리마인더 발송',
            '다양한 결제 수단 지원',
            '결제 실패 시 즉시 재시도 로직 구현'
          ]
        });
      }
    }

    // S4: High churn rate
    if (churnAnalysis && churnAnalysis.churn_rate_paid > 20) {
      insights.push({
        type: 'danger',
        icon: '📉',
        title: '유료 구독 해지율 높음',
        body: `유료 사용자의 ${churnAnalysis.churn_rate_paid.toFixed(1)}%가 해지했습니다 (${churnAnalysis.churn_users}명).`,
        metric: churnAnalysis.churn_rate_paid.toFixed(1) + '%',
        recommendations: [
          '해지 직전 사용자 식별 및 개입',
          '해지 사유 분석 후 맞춤 대응',
          '로열티 프로그램 또는 장기 할인 제공'
        ]
      });
    }

    // S5: Cancel reason analysis
    if (churnAnalysis?.cancel_reason_top && churnAnalysis.cancel_reason_top.length > 0) {
      const topReason = churnAnalysis.cancel_reason_top[0];
      if (topReason.reason !== 'Unknown' && topReason.share > 20) {
        insights.push({
          type: 'warning',
          icon: '🔍',
          title: `주요 해지 사유: ${topReason.reason}`,
          body: `해지 사용자의 ${topReason.share.toFixed(0)}%가 "${topReason.reason}"을(를) 이유로 들었습니다.`,
          metric: `${topReason.share.toFixed(0)}%`,
          recommendations: [
            '해지 사유 심층 인터뷰 진행',
            '해지 방어 오퍼 테스트',
            '서비스 개선점 도출 및 반영'
          ]
        });
      }
    }

    // S6: Paid Retention warning
    if (paidRetention && paidRetention.length > 0) {
      const avgD7 = paidRetention.reduce((sum, r) => sum + (r.days.D7 || 0), 0) / paidRetention.length;
      const avgD30 = paidRetention.reduce((sum, r) => sum + (r.days.D30 || 0), 0) / paidRetention.length;

      if (avgD7 < 70) {
        insights.push({
          type: 'danger',
          icon: '🔒',
          title: 'D7 유료 구독 유지율 낮음',
          body: `구독 후 7일 유지율이 ${avgD7.toFixed(1)}%로 목표 70%에 미달합니다.`,
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
          body: `구독 후 30일 유지율이 ${avgD30.toFixed(1)}%입니다.`,
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

  return insights;
}
