import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_ROUTES } from '@core/constants/api.constant';
import {
  EmployerQuestionGroup,
  ProfileQuestion,
  AnswerPayload,
} from '@features/dashboard/models/profile-question.model';
import { ResumeProfileStatus } from '@features/dashboard/models/resume-profile.model';
import { ApiResponse } from '@core/models/response/api-response.model';

/** Raw question item from GET profile-questions API */
interface ProfileQuestionApiItem {
  id: string;
  workExperienceIndex: number;
  bulletPointIndex: number;
  originalBulletPoint: string;
  questionText: string;
  questionCategory: string;
  userResponse: string | null;
  isAnswered: boolean;
  orderIndex: number;
  companyName: string | null;
  jobTitle: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileQuestionsService {
  private readonly http = inject(HttpClient);

  getProfileStatus(): Observable<ResumeProfileStatus> {
    return this.http
      .get<ApiResponse<ResumeProfileStatus>>(
        API_ROUTES.createAPIRoute(API_ROUTES.USER.RESUME_PROFILE_STATUS)
      )
      .pipe(map((res) => res.data as ResumeProfileStatus));
  }

  getQuestions(): Observable<EmployerQuestionGroup[]> {
    return this.http
      .get<ApiResponse<ProfileQuestionApiItem[]>>(
        API_ROUTES.createAPIRoute(API_ROUTES.PROFILE.QUESTIONS)
      )
      .pipe(
        map((res) =>
          this.groupQuestionsByEmployer(res.data as ProfileQuestionApiItem[])
        )
      );
  }

  saveAnswer(payload: AnswerPayload): Observable<{ profileCompleteness: number; enrichedProfileId: string | null }> {
    return this.http
      .post<ApiResponse<{ saved: boolean; profileCompleteness?: number; enrichedProfileId?: string | null }>>(
        API_ROUTES.createAPIRoute(API_ROUTES.PROFILE.ANSWER),
        payload
      )
      .pipe(
        map((res) => {
          const data = res.data as { saved: boolean; profileCompleteness?: number; enrichedProfileId?: string | null };
          return {
            profileCompleteness: data?.profileCompleteness ?? 0,
            enrichedProfileId: data?.enrichedProfileId ?? null,
          };
        })
      );
  }

  skipQuestion(
    questionId: string
  ): Observable<{ profileCompleteness: number; enrichedProfileId: string | null }> {
    return this.saveAnswer({ questionId, response: null });
  }

  markComplete(): Observable<{ enrichedProfileId: string }> {
    return this.http
      .post<ApiResponse<{ enrichedProfileId: string }>>(
        API_ROUTES.createAPIRoute(API_ROUTES.PROFILE.COMPLETE),
        {}
      )
      .pipe(map((res) => res.data as { enrichedProfileId: string }));
  }

  private groupQuestionsByEmployer(
    items: ProfileQuestionApiItem[]
  ): EmployerQuestionGroup[] {
    const byIndex = new Map<number, { questions: ProfileQuestion[]; companyName: string; jobTitle: string }>();

    for (const item of items) {
      const q: ProfileQuestion = {
        id: item.id,
        workExperienceIndex: item.workExperienceIndex,
        bulletPointIndex: item.bulletPointIndex,
        originalBulletPoint: item.originalBulletPoint,
        questionText: item.questionText,
        questionCategory: item.questionCategory,
        userResponse: item.userResponse,
        isAnswered: item.isAnswered,
        orderIndex: item.orderIndex,
      };

      if (!byIndex.has(item.workExperienceIndex)) {
        byIndex.set(item.workExperienceIndex, {
          questions: [],
          companyName: item.companyName ?? `Work Experience ${item.workExperienceIndex + 1}`,
          jobTitle: item.jobTitle ?? '',
        });
      }

      byIndex.get(item.workExperienceIndex)!.questions.push(q);
    }

    const indices = [...byIndex.keys()].sort((a, b) => a - b);
    return indices.map((workExperienceIndex) => {
      const entry = byIndex.get(workExperienceIndex)!;
      return {
        workExperienceIndex,
        companyName: entry.companyName,
        jobTitle: entry.jobTitle,
        questions: entry.questions.sort((a, b) => a.orderIndex - b.orderIndex),
      };
    });
  }
}
