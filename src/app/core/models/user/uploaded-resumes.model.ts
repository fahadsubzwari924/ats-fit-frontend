export class UploadedResume {
  public id: string;
  public fileName: string;
  public fileSize: number;
  public mimeType: string;
  public s3Url: string;
  public isActive: boolean;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data: Record<string, unknown>) {
    this.id = data['id'] as string;
    this.fileName = data['fileName'] as string;
    this.fileSize = data['fileSize'] as number;
    this.mimeType = data['mimeType'] as string;
    this.s3Url = data['s3Url'] as string;
    this.isActive = data['isActive'] as boolean;
    this.createdAt = data['createdAt'] as Date;
    this.updatedAt = data['updatedAt'] as Date;
  }
}

