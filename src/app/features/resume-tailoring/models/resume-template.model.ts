export class ResumeTemplate {
  id: string;
  name: string;
  key: string;
  description: string;
  thumbnailImageUrl: string;
  remoteUrl: string;


  constructor(data: Record<string, unknown>) {
    this.id = data['id'] as string;
    this.name = data['name'] as string;
    this.key = data['key'] as string;
    this.description = data['description'] as string;
    this.thumbnailImageUrl = data['thumbnailImageUrl'] as string;
    this.remoteUrl = data['remoteUrl'] as string;
  }
}
