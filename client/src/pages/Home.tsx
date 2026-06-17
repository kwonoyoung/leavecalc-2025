import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Calculator } from "lucide-react";
import {
  calculateLeaveAllowance,
  formatCurrency,
  formatDate,
  type LeaveCalculationInput,
} from "@/lib/leaveCalculator";

export default function Home() {
  // Input states
  const [childOrder, setChildOrder] = useState<"first" | "second" | "third_plus">("first");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [monthlySalary, setMonthlySalary] = useState<string>("");
  const [spouseConcurrentLeave, setSpouseConcurrentLeave] = useState(false);
  const [singleParent, setSingleParent] = useState(false);
  const [disabledChildParent, setDisabledChildParent] = useState(false);

  // Calculate results
  const result = useMemo(() => {
    if (!startDate || !endDate || !monthlySalary) {
      return null;
    }

    const input: LeaveCalculationInput = {
      childOrder,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      monthlySalary: parseInt(monthlySalary.replace(/,/g, ""), 10),
      spouseConcurrentLeave,
      singleParent,
      disabledChildParent,
    };

    return calculateLeaveAllowance(input);
  }, [childOrder, startDate, endDate, monthlySalary, spouseConcurrentLeave, singleParent, disabledChildParent]);

  // Format salary input with comma
  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, "");
    if (/^\d*$/.test(value)) {
      setMonthlySalary(value ? parseInt(value, 10).toLocaleString() : "");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-white/98 backdrop-blur-sm shadow-sm">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
              <Calculator className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">2025년 육아휴직수당 계산기</h1>
              <p className="text-xs text-muted-foreground">
                공무원보수 등의 업무지침 기준 (인사혁신처예규 제204호) · 월중 육아휴직자 전용
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Panel - Input Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Child Order Selection */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground">자녀 순서</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "first" as const, label: "첫째" },
                      { value: "second" as const, label: "둘째" },
                      { value: "third_plus" as const, label: "셋째 이후" },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant={childOrder === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setChildOrder(option.value)}
                        className="text-xs font-medium transition-all"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground">1. 기본 정보 입력</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="start-date" className="text-xs font-semibold text-foreground">
                      휴직 시작일 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="end-date" className="text-xs font-semibold text-foreground">
                      휴직 종료일 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground leading-tight">
                      복직일 전날을 입력하세요 (예: 복직일이 4.21이면 4.20 입력)
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="salary" className="text-xs font-semibold text-foreground">
                      월봉급액 (원) <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="salary"
                        type="text"
                        placeholder="예: 3,196,410"
                        value={monthlySalary}
                        onChange={handleSalaryChange}
                        className="text-sm"
                      />
                      <span className="text-xs text-muted-foreground font-medium">원</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight">
                      성과급적 연봉제: 78% / 전문임기제·일부 성과급적: 84%
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Special Conditions */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground">2. 특수 조건 선택</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
                    <div className="flex-1 min-w-0">
                      <Label className="text-xs font-semibold text-foreground">부부동시 육아휴직</Label>
                      <p className="text-xs text-muted-foreground leading-tight">
                        배우자가 먼저 휴직한 경우
                      </p>
                    </div>
                    <Switch
                      checked={spouseConcurrentLeave}
                      onCheckedChange={setSpouseConcurrentLeave}
                    />
                  </div>

                  <div className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
                    <div className="flex-1 min-w-0">
                      <Label className="text-xs font-semibold text-foreground">한부모가족</Label>
                      <p className="text-xs text-muted-foreground leading-tight">
                        지급기간 18개월 연장
                      </p>
                    </div>
                    <Switch checked={singleParent} onCheckedChange={setSingleParent} />
                  </div>

                  <div className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
                    <div className="flex-1 min-w-0">
                      <Label className="text-xs font-semibold text-foreground">장애아부모</Label>
                      <p className="text-xs text-muted-foreground leading-tight">
                        지급기간 18개월 연장
                      </p>
                    </div>
                    <Switch
                      checked={disabledChildParent}
                      onCheckedChange={setDisabledChildParent}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Calculation Guidelines */}
              <Card className="border-blue-100 bg-blue-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-blue-900">계산 기준</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-blue-800 space-y-1">
                  <div className="flex gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>지급액은 10원 단위 절사</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>월중 시작·종료 시 일할 계산</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>참고용 (실제와 다를 수 있음)</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2">
            {!startDate || !endDate || !monthlySalary ? (
              <Card className="border-2 border-dashed border-muted-foreground/30">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Calculator className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">계산 준비 완료</h3>
                  <p className="text-sm text-muted-foreground">
                    좌측에 정보를 입력하면 계산 결과가 표시됩니다
                  </p>
                </CardContent>
              </Card>
            ) : result ? (
              <div className="space-y-6">
                {/* Summary Card */}
                <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/5 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-foreground">계산 결과</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-white/50 p-4 border border-primary/10">
                        <p className="text-xs font-medium text-muted-foreground mb-1">총 지급액</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(result.totalAllowance)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/50 p-4 border border-accent/10">
                        <p className="text-xs font-medium text-muted-foreground mb-1">지급 기간</p>
                        <p className="text-2xl font-bold text-accent">
                          {result.totalMonths}<span className="text-lg">개월</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Warnings */}
                {result.warnings.length > 0 && (
                  <Alert className="border-blue-200 bg-blue-50/50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="ml-2 text-xs text-blue-800">
                      <ul className="space-y-0.5">
                        {result.warnings.map((warning, idx) => (
                          <li key={idx}>• {warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Monthly Breakdown Table */}
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-bold">월별 지급액 내역</CardTitle>
                    <CardDescription className="text-xs">
                      {result.totalMonths}개월간 예상 지급액을 월별로 표시합니다
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="text-center text-xs font-semibold text-foreground">월</TableHead>
                            <TableHead className="text-center text-xs font-semibold text-foreground">기간</TableHead>
                            <TableHead className="text-center text-xs font-semibold text-foreground">일수</TableHead>
                            <TableHead className="text-right text-xs font-semibold text-foreground">일할액</TableHead>
                            <TableHead className="text-right text-xs font-semibold text-foreground">지급액</TableHead>
                            <TableHead className="text-xs font-semibold text-foreground">비고</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.monthlyBreakdown.map((month, idx) => (
                            <TableRow key={month.month} className={idx % 2 === 0 ? "bg-white/50 hover:bg-muted/30" : "hover:bg-muted/30"}>
                              <TableCell className="text-center text-sm font-semibold text-primary">
                                {month.month}
                              </TableCell>
                              <TableCell className="text-center text-xs text-muted-foreground">
                                {formatDate(month.monthStart)}
                                <br />
                                {formatDate(month.monthEnd)}
                              </TableCell>
                              <TableCell className="text-center text-sm font-medium">
                                {month.daysInMonth}일
                              </TableCell>
                              <TableCell className="text-right text-xs text-muted-foreground">
                                {formatCurrency(month.allowancePerDay)}
                              </TableCell>
                              <TableCell className="text-right text-sm font-bold text-primary">
                                {formatCurrency(month.totalAllowance)}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {month.notes}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Disclaimer */}
                <Alert className="border-amber-200 bg-amber-50/50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-xs text-amber-800 ml-2">
                    본 계산기는 참고용이며 실제 지급액과 다를 수 있습니다. 정확한 지급액은 소속기관 인사담당자에게 문의하세요.
                  </AlertDescription>
                </Alert>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
