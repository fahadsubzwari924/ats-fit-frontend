export class ResumeTemplate {
  id: string;
  name: string;
  key: string;
  description: string;
  thumbnailImageUrl: string;
  remoteUrl: string;


  constructor(data: any) {
    this.id = data?.id;
    this.name = data?.name;
    this.key = data?.key;
    this.description = data?.description;
    this.thumbnailImageUrl = data?.thumbnailImageUrl;
    this.remoteUrl = data?.remoteUrl;
  }
}
