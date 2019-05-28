import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GenesSummary } from '../_models';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GeneService {

  constructor(private http: HttpClient) { }

  getAll() {
    return this.http.get<GenesSummary[]>(`${environment.baseUrl}/api/genes`);
  }

}
