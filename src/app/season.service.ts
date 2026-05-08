import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SeasonService {
  // Gets current season
  getSuffix(): string {
    return "_S2026";
  }
}