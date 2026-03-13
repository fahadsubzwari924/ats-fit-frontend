// Technical Skills sub-model
export class TechnicalSkills {
  public matched?: string[];
  public missing?: string[];
  public score?: number;
  public reasoning?: string;

  constructor(data: Partial<TechnicalSkills> = {}) {
    this.matched = data?.matched;
    this.missing = data?.missing;
    this.score = data?.score;
    this.reasoning = data?.reasoning;
  }
}

// Experience sub-model
export class Experience {
  public level?: string;
  public years?: number;
  public relevance?: number;
  public reasoning?: string;

  constructor(data: Partial<Experience> = {}) {
    this.level = data?.level;
    this.years = data?.years;
    this.relevance = data?.relevance;
    this.reasoning = data?.reasoning;
  }

}

// Achievements sub-model
export class Achievements {
  public count?: number;
  public quality?: number;
  public impact?: number;
  public reasoning?: string;

  constructor(data: Partial<Achievements> = {}) {
    this.count = data?.count;
    this.quality = data?.quality;
    this.impact = data?.impact;
    this.reasoning = data?.reasoning;
  }

}

// Soft Skills sub-model
export class SoftSkills {
  public matched?: string[];
  public reasoning?: string;

  constructor(data: Partial<SoftSkills> = {}) {
    this.matched = data?.matched;
    this.reasoning = data?.reasoning;
  }
}

// Matched Skills sub-model
export class MatchedSkills {
  public hardSkills?: string[];
  public softSkills?: string[];
  public qualifications?: string[];

  constructor(data: Partial<MatchedSkills> = {}) {
    this.hardSkills = data.hardSkills;
    this.softSkills = data.softSkills;
    this.qualifications = data.qualifications;
  }
}

// Extracted Data sub-model
export class ExtractedData {
  public technicalSkills?: TechnicalSkills;
  public experience?: Experience;
  public achievements?: Achievements;
  public softSkills?: SoftSkills;

  constructor(data: Partial<ExtractedData> = {}) {
    this.technicalSkills = new TechnicalSkills(data?.technicalSkills);
    this.experience = new Experience(data?.experience);
    this.achievements = new Achievements(data?.achievements);
    this.softSkills = new SoftSkills(data?.softSkills);
  }
}

// Section Scores sub-model
export class SectionScores {
  public technicalSkills?: number;
  public experienceAlignment?: number;
  public achievements?: number;
  public softSkills?: number;
  public resumeQuality?: number;

  constructor(data: Partial<SectionScores> = {}) {
    this.technicalSkills = data?.technicalSkills;
    this.experienceAlignment = data?.experienceAlignment;
    this.achievements = data?.achievements;
    this.softSkills = data?.softSkills;
    this.resumeQuality = data?.resumeQuality;
  }

}

// Tailored Content sub-model
export class TailoredContent {
  public strengths?: string[];
  public weaknesses?: string[];
  public recommendations?: string[];

  constructor(data: Partial<TailoredContent> = {}) {
    this.strengths = data?.strengths;
    this.weaknesses = data?.weaknesses;
    this.recommendations = data?.recommendations;
  }

}

// Detailed Breakdown for ATS Evaluation
export class DetailedBreakdown {
  public technicalSkills?: TechnicalSkills;
  public experience?: Experience;
  public achievements?: Achievements;
  public softSkills?: SoftSkills;
  public redFlags?: string[];
  public strengths?: string[];
  public weaknesses?: string[];
  public recommendations?: string[];

  constructor(data: Partial<DetailedBreakdown> = {}) {
    this.technicalSkills = new TechnicalSkills(data?.technicalSkills);
    this.experience = new Experience(data?.experience);
    this.achievements = new Achievements(data?.achievements);
    this.softSkills = new SoftSkills(data?.softSkills);
    this.redFlags = data?.redFlags;
    this.strengths = data?.strengths;
    this.weaknesses = data?.weaknesses;
    this.recommendations = data?.recommendations;
  }
}

// ATS Evaluation sub-model
export class ATSEvaluation {
  public overallScore?: number;
  public technicalSkillsScore?: number;
  public experienceAlignmentScore?: number;
  public achievementsScore?: number;
  public softSkillsScore?: number;
  public resumeQualityScore?: number;
  public detailedBreakdown?: DetailedBreakdown;
  public confidence?: number;

  constructor(data: Partial<ATSEvaluation> = {}) {
    this.overallScore = data?.overallScore;
    this.technicalSkillsScore = data?.technicalSkillsScore;
    this.experienceAlignmentScore = data?.experienceAlignmentScore;
    this.achievementsScore = data?.achievementsScore;
    this.softSkillsScore = data?.softSkillsScore;
    this.resumeQualityScore = data?.resumeQualityScore;
    this.detailedBreakdown = new DetailedBreakdown(data?.detailedBreakdown);
    this.confidence = data?.confidence;
  }

}

// Main Details model
export class ATSScoreDetails {
  public keywordScore?: number;
  public contactInfoScore?: number;
  public structureScore?: number;
  public matched?: MatchedSkills;
  public extracted?: ExtractedData;
  public sectionScores?: SectionScores;
  public skillMatchScore?: number;
  public missingKeywords?: string[];
  public tailoredContent?: TailoredContent;
  public atsEvaluation?: ATSEvaluation;

  constructor(data: Partial<ATSScoreDetails> = {}) {
    this.keywordScore = data?.keywordScore;
    this.contactInfoScore = data?.contactInfoScore;
    this.structureScore = data?.structureScore;
    this.matched = new MatchedSkills(data?.matched);
    this.extracted = new ExtractedData(data?.extracted);
    this.sectionScores = new SectionScores(data?.sectionScores);
    this.skillMatchScore = data?.skillMatchScore;
    this.missingKeywords = data?.missingKeywords;
    this.tailoredContent = new TailoredContent(data?.tailoredContent);
    this.atsEvaluation = new ATSEvaluation(data?.atsEvaluation);
  }
}

// Main ATS Match Score Model
export class ATSMatchScore {
  public atsMatchHistoryId?: string;
  public score: number;
  public details?: ATSScoreDetails;

  constructor(data: any) {
    this.atsMatchHistoryId = data?.atsMatchHistoryId;
    this.score = data?.score;
    this.details = new ATSScoreDetails(data?.details);
  }

}
