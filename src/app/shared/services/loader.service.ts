import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  public showLoader() {
    this.loadingSubject.next(true);
  }

  public hideLoader() {
    this.loadingSubject.next(false);
  }

}
