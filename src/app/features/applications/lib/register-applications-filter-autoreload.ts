import { DestroyRef, Signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, debounceTime, distinctUntilChanged, skip } from 'rxjs';

const SEARCH_DEBOUNCE_MS = 300;

function sameSortedStatusSet(a: string[], b: string[]): boolean {
  return a.length === b.length && [...a].sort().join() === [...b].sort().join();
}

/**
 * When any filter signal changes, runs `reload` (typically reset offset + refetch).
 * Skips the initial combined emission so the host can load once on init without doubling requests.
 */
export function registerApplicationsFilterAutoReload(
  destroyRef: DestroyRef,
  filterSearch: Signal<string>,
  filterStatuses: Signal<string[]>,
  filterAppliedFrom: Signal<string>,
  filterAppliedTo: Signal<string>,
  reload: () => void,
): void {
  const search$ = toObservable(filterSearch).pipe(
    debounceTime(SEARCH_DEBOUNCE_MS),
    distinctUntilChanged(),
  );
  const statuses$ = toObservable(filterStatuses).pipe(
    distinctUntilChanged((a, b) => sameSortedStatusSet(a, b)),
  );
  const appliedFrom$ = toObservable(filterAppliedFrom).pipe(distinctUntilChanged());
  const appliedTo$ = toObservable(filterAppliedTo).pipe(distinctUntilChanged());

  combineLatest({
    q: search$,
    statuses: statuses$,
    appliedFrom: appliedFrom$,
    appliedTo: appliedTo$,
  })
    .pipe(skip(1), takeUntilDestroyed(destroyRef))
    .subscribe(() => reload());
}
