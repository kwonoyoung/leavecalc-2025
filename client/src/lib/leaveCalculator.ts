/**
 * Parental Leave Allowance Calculator
 * Based on 2025 Civil Service Compensation Guidelines (MPM Regulation No. 204)
 * 
 * Calculation Rules:
 * - Months 1-3: 250만원 (or 100% of monthly salary, whichever is lower)
 * - Months 4-6: 200만원 (or 100% of monthly salary, whichever is lower)
 * - Months 7+: 160만원 (or 100% of monthly salary, whichever is lower)
 * - All amounts are rounded down to the nearest 10 won
 * - Mid-month start/end: Daily calculation applied
 * - Special conditions can extend the period to 18 months
 * 
 * Special Conditions:
 * - 부부동시 육아휴직: First 3 months receive 50% reduction
 * - 한부모가족: Extends period to 18 months, first 3 months cap is 3,000,000 won
 * - 장애아부모: Extends period to 18 months
 */

export interface LeaveCalculationInput {
  childOrder: "first" | "second" | "third_plus";
  startDate: Date;
  endDate: Date;
  monthlySalary: number;
  spouseConcurrentLeave: boolean;
  singleParent: boolean;
  disabledChildParent: boolean;
}

export interface MonthlyAllowance {
  month: number;
  monthStart: Date;
  monthEnd: Date;
  daysInMonth: number;
  allowancePerDay: number;
  totalAllowance: number;
  notes: string;
}

export interface CalculationResult {
  totalAllowance: number;
  totalMonths: number;
  monthlyBreakdown: MonthlyAllowance[];
  warnings: string[];
}

// Maximum allowance amounts for each period (in won)
const ALLOWANCE_CAPS = {
  months_1_3: 2_500_000,
  months_4_6: 2_000_000,
  months_7_plus: 1_600_000,
};

// Special condition caps
const SINGLE_PARENT_MONTHS_1_3_CAP = 3_000_000;

// Minimum allowance (700,000 won)
const MINIMUM_ALLOWANCE = 700_000;

/**
 * Get the allowance cap for a given month (1-indexed)
 */
function getAllowanceCap(monthNumber: number, isSingleParent: boolean): number {
  if (monthNumber <= 3) {
    return isSingleParent ? SINGLE_PARENT_MONTHS_1_3_CAP : ALLOWANCE_CAPS.months_1_3;
  }
  if (monthNumber <= 6) return ALLOWANCE_CAPS.months_4_6;
  return ALLOWANCE_CAPS.months_7_plus;
}

/**
 * Round down to nearest 10 won
 */
function roundDown10Won(amount: number): number {
  return Math.floor(amount / 10) * 10;
}

/**
 * Calculate daily allowance rate
 */
function getDailyAllowanceRate(monthlySalary: number, cap: number): number {
  const monthlyAllowance = Math.min(monthlySalary, cap);
  return monthlyAllowance / 30; // Standard calculation uses 30 days
}

/**
 * Get notes for a specific month
 */
function getMonthNotes(
  monthNumber: number,
  daysInMonth: number,
  input: LeaveCalculationInput
): string {
  const notes: string[] = [];

  if (daysInMonth < 30) {
    notes.push("일할 계산");
  }

  if (input.spouseConcurrentLeave && monthNumber <= 3) {
    notes.push("부부동시 50% 감액");
  }

  if (input.singleParent && monthNumber <= 3) {
    notes.push("한부모 상한액 300만원");
  }

  return notes.join(" / ");
}

/**
 * Main calculation function
 */
export function calculateLeaveAllowance(
  input: LeaveCalculationInput
): CalculationResult {
  const warnings: string[] = [];
  const monthlyBreakdown: MonthlyAllowance[] = [];

  // Validate inputs
  if (input.startDate >= input.endDate) {
    warnings.push("휴직 종료일이 시작일보다 빨라야 합니다.");
    return {
      totalAllowance: 0,
      totalMonths: 0,
      monthlyBreakdown: [],
      warnings,
    };
  }

  if (input.monthlySalary <= 0) {
    warnings.push("월봉급액은 0보다 커야 합니다.");
    return {
      totalAllowance: 0,
      totalMonths: 0,
      monthlyBreakdown: [],
      warnings,
    };
  }

  let currentDate = new Date(input.startDate);
  let monthNumber = 1;
  let totalAllowance = 0;

  // Determine maximum leave period based on special conditions
  const maxMonths = input.singleParent || input.disabledChildParent ? 18 : 12;

  // Add warnings for special conditions
  if (input.spouseConcurrentLeave) {
    warnings.push("부부동시 육아휴직: 첫 3개월 50% 감액 적용");
  }
  if (input.singleParent) {
    warnings.push("한부모가족: 지급기간 18개월 연장, 1~3개월 상한액 300만원");
  }
  if (input.disabledChildParent) {
    warnings.push("장애아부모: 지급기간 18개월 연장");
  }

  while (currentDate < input.endDate && monthNumber <= maxMonths) {
    // Get the first and last day of the current month
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Adjust for partial months (intersection with leave period)
    const actualStart = new Date(
      Math.max(monthStart.getTime(), input.startDate.getTime())
    );
    const actualEnd = new Date(
      Math.min(monthEnd.getTime(), input.endDate.getTime())
    );

    // Calculate days in this month for this leave period
    const daysInThisMonth = Math.floor(
      (actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    // Get allowance cap for this month (considering special conditions)
    const cap = getAllowanceCap(monthNumber, input.singleParent);

    // Calculate daily rate
    const dailyRate = getDailyAllowanceRate(input.monthlySalary, cap);

    // Calculate total for this month
    let monthlyAmount = dailyRate * daysInThisMonth;

    // Apply minimum allowance for full months
    if (daysInThisMonth >= 30) {
      monthlyAmount = Math.max(monthlyAmount, MINIMUM_ALLOWANCE);
    }

    // Round down to nearest 10 won
    monthlyAmount = roundDown10Won(monthlyAmount);

    // Apply spouse concurrent leave reduction (first 3 months: 50% reduction)
    if (input.spouseConcurrentLeave && monthNumber <= 3) {
      monthlyAmount = roundDown10Won(monthlyAmount * 0.5);
    }

    monthlyBreakdown.push({
      month: monthNumber,
      monthStart: actualStart,
      monthEnd: actualEnd,
      daysInMonth: daysInThisMonth,
      allowancePerDay: roundDown10Won(dailyRate),
      totalAllowance: monthlyAmount,
      notes: getMonthNotes(monthNumber, daysInThisMonth, input),
    });

    totalAllowance += monthlyAmount;

    // Move to next month
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    monthNumber++;
  }

  if (monthNumber > maxMonths) {
    warnings.push(`최대 지급 기간(${maxMonths}개월)에 도달했습니다.`);
  }

  warnings.push("본 계산기는 참고용이며 실제 지급액과 다를 수 있습니다.");
  warnings.push("정확한 지급액은 소속기관 인사담당자에게 문의하세요.");

  return {
    totalAllowance,
    totalMonths: monthlyBreakdown.length,
    monthlyBreakdown,
    warnings,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
