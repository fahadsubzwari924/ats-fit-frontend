export class TailoredResume {
  public blob: Blob;
  public filename: string;
  public resumeGenerationId: string;
  public atsScore: string;

  constructor(data: any) {
    this.blob = data?.blob;
    this.filename = data?.filename;
    this.resumeGenerationId = data?.resumeGenerationId;
    this.atsScore = data?.atsScore;
  }
}
