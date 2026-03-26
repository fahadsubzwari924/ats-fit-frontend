export interface BatchJobInput {
  jobPosition: string;
  companyName: string;
  jobDescription: string;
}

export interface BatchJobResult {
  jobPosition: string;
  companyName: string;
  status: 'success' | 'failed';
  resumeGenerationId?: string;
  pdfContent?: string;
  filename?: string;
  optimizationConfidence?: number;
  keywordsAdded?: number;
  error?: string;
  blob?: Blob;
}

export interface BatchGenerateRequest {
  jobs: BatchJobInput[];
  templateId: string;
  resumeId?: string;
}

export interface BatchGenerateResponse {
  batchId: string;
  results: BatchJobResult[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
    totalProcessingTimeMs: number;
  };
}

export type BatchTailoringStep = 'input' | 'generating' | 'results';
