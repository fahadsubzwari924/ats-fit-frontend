// Model class that converts snake_case to camelCase
export class JobApplicationStats {
  public totalApplications: number;
  /** May be absent or partial depending on API payload. */
  public applicationsByStatus?: ApplicationsByStatus;
  public responseRate: number;
  public interviewRate: number;
  public successRate: number;
  public topCompanies: TopCompany[];
  public monthlyTrend: MonthlyTrend[];

  constructor(dto: unknown) {
    const dtoRec = dto as Record<string, unknown>;
    this.totalApplications = (dtoRec['total_applications'] as number | undefined) ?? 0;
    this.applicationsByStatus = dtoRec['applications_by_status'] as ApplicationsByStatus | undefined;
    this.responseRate = dtoRec['response_rate'] as number;
    this.interviewRate = dtoRec['interview_rate'] as number;
    this.successRate = dtoRec['success_rate'] as number;

    const topCompaniesRaw = dtoRec['top_companies'] as
      | { company_name: string; application_count: number }[]
      | undefined;
    this.topCompanies =
      topCompaniesRaw?.map((company) => ({
        companyName: company.company_name,
        applicationCount: company.application_count
      })) ?? [];

    const monthlyRaw = (dtoRec['monthly_trend'] as { month: string; count: number }[] | undefined) ?? [];
    this.monthlyTrend = monthlyRaw.map((trend) => ({
      month: trend.month,
      count: trend.count
    }));
  }

}

// Interface for company data with camelCase
export interface TopCompany {
  companyName: string;
  applicationCount: number;
}

// Interface for monthly trend data with camelCase
export interface MonthlyTrend {
  month: string;
  count: number;
}

export interface ApplicationsByStatus {
  accepted: number;
  applied: number;
  interviewed: number;
  offer_received: number;
  rejected: number;
  screening: number;
  technical_round: number;
  withdrawn: number;
}
