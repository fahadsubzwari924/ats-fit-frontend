export class UploadedResume {
  public id: string;
  public fileName: string;
  public fileSize: number;
  public mimeType: string;
  public s3Url: string;
  public isActive: boolean;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data: any) {
    this.id = data?.id;
    this.fileName = data?.fileName;
    this.fileSize = data?.fileSize;
    this.mimeType = data?.mimeType;
    this.s3Url = data?.s3Url;
    this.isActive = data?.isActive;
    this.createdAt = data?.createdAt;
    this.updatedAt = data?.updatedAt;
  }
}

