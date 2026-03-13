// Model class that converts snake_case to camelCase
export class JobApplicationStats {
  public totalApplications: number;
  public applicationsByStatus: ApplicationsByStatus;
  public averageAtsScore: number;
  public responseRate: number;
  public interviewRate: number;
  public successRate: number;
  public topCompanies: TopCompany[];
  public monthlyTrend: MonthlyTrend[];

  constructor(dto: any) {
    this.totalApplications = dto?.total_applications;
    this.applicationsByStatus = dto?.applications_by_status;
    this.averageAtsScore = dto?.average_ats_score;
    this.responseRate = dto?.response_rate;
    this.interviewRate = dto?.interview_rate;
    this.successRate = dto?.success_rate;

    // Convert top_companies array to camelCase
    this.topCompanies = dto?.top_companies?.map((company: { company_name: string; application_count: number }) => ({
      companyName: company.company_name,
      applicationCount: company.application_count
    }));

    // Convert monthly_trend array to camelCase
    this.monthlyTrend = dto.monthly_trend.map((trend: { month: string; count: number }) => ({
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
