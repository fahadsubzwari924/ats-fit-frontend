import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { API_ROUTES } from "@core/constants/api.constant";
import { ApiResponse } from "@core/models/response/api-response.model";
import { map, Observable } from "rxjs";
import { SubscriptionPlan } from "../models/subscription-plan.model";
import { ICheckout } from "../interfaces/checkout.interface";
import { PaymentHistory } from "../models/payment-history.model";

@Injectable({
  providedIn: 'root',
})
export class BillingService {

  private _http = inject(HttpClient);

  public getSubscriptionPlans(): Observable<SubscriptionPlan[]> {
    return this._http
      .get<ApiResponse<unknown>>(API_ROUTES.createAPIRoute(API_ROUTES.SUBSCRIPTIONS.PLANS))
      .pipe(
        map((response) =>
          ((response?.data as unknown[]) || []).map(
            (item) => new SubscriptionPlan(item as Record<string, unknown>),
          ),
        ),
      );
  }

  public getUserSubscription(userId: string): Observable<SubscriptionPlan | null> {
    return this._http
      .get<ApiResponse<unknown>>(
        API_ROUTES.createAPIRoute(`${API_ROUTES.SUBSCRIPTIONS.USER_SUBSCRIPTION}/${userId}`),
      )
      .pipe(
        map((response) =>
          response?.data ? new SubscriptionPlan(response.data as Record<string, unknown>) : null,
        ),
      );
  }

  public getUserPaymentHistory(): Observable<PaymentHistory[] | null> {
    return this._http
      .get<ApiResponse<unknown>>(API_ROUTES.createAPIRoute(`${API_ROUTES.SUBSCRIPTIONS.PAYMENT_HISTORY}`))
      .pipe(
        map((response) =>
          ((response?.data as unknown[]) || []).map(
            (item) => new PaymentHistory(item as Record<string, unknown>),
          ),
        ),
      );
  }

  public checkout(payload: Record<string, unknown>): Observable<ApiResponse<ICheckout> | null> {
    return this._http.post<ApiResponse<ICheckout>>(API_ROUTES.createAPIRoute(API_ROUTES.SUBSCRIPTIONS.CHECKOUT), payload);
  }

  public cancelSubscription(subscriptionId: string): Observable<ApiResponse<unknown>> {
    return this._http.delete<ApiResponse<unknown>>(
      API_ROUTES.createAPIRoute(`${API_ROUTES.SUBSCRIPTIONS.CANCEL_SUBSCRIPTION}/${subscriptionId}/cancel`)
    );
  }

}
