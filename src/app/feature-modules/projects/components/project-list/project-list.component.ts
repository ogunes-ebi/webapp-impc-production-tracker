import { Component, OnInit, ViewChild } from '@angular/core';
import { first } from 'rxjs/operators';
import { ProjectService } from '../../services/project.service';
import { ProjectSummary, ProjectSummaryAdapter } from '../../model/project-summary';
import { ConfigurationData, ConfigurationDataService, LoggedUserService, LoggedUser } from 'src/app/core';
import { MatPaginator, MatSort } from '@angular/material';
import { ProjectFilterService } from '../../services/project-filter.service';
import { Filter } from 'src/app/core/model/common/filter';
import { ArrayFilter } from 'src/app/core/model/common/array-filter';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css']
})
export class ProjectListComponent implements OnInit {
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;

  isLoading = true;
  projects: ProjectSummary[] = [];
  p = 0;
  page: any = {};

  privacies: NamedValue[];
  intentions: NamedValue[];
  assignmentStatuses: NamedValue[];

  tpnFilterInput: string;
  externalReferenceFilterInput: string;
  markerSymbolFilterInput: string;
  intentionsFilterInput: string;

  tpnFilterObject: Filter = new Filter();
  markerSymbolFilterObject: Filter = new Filter();
  intentionsFilterObject: ArrayFilter = new ArrayFilter();
  privaciesFilterObject: ArrayFilter = new ArrayFilter();

  configurationData: ConfigurationData;

  error;
  loggedUser: LoggedUser = new LoggedUser();

  projectFilterService: ProjectFilterService = new ProjectFilterService();

  constructor(
    private projectService: ProjectService,
    private adapter: ProjectSummaryAdapter,
    private loggedUserService: LoggedUserService,
    private configurationDataService: ConfigurationDataService) { }

  ngOnInit() {
    this.isLoading = true;
    this.configurationDataService.getConfigurationData().subscribe(data => {
      this.configurationData = data;
      this.initFiltersValues();
      if (this.loggedUserService.getLoggerUser()) {
        this.loggedUserService.getLoggerUser().subscribe(data => {
          this.loggedUser = data;
          this.getPage(0);
        });
      } else {
        this.loggedUser = new LoggedUser();
        this.loggedUser.userName = 'anonymous';
        this.getPage(0);
      }

    }, error => {
      console.log('error:', error);
      this.error = error;
      this.isLoading = false;
    });
  }

  private initFiltersValues(): void {
    this.intentions = this.configurationData.alleleTypes.map(p => { return { name: p } });
    this.assignmentStatuses = this.configurationData.assignmentStatuses.map(p => { return { name: p } });
    this.privacies = this.configurationData.privacies.map(p => { return { name: p } });
  }

  getPage(pageNumber: number) {
    this.isLoading = true;
    const apiPageNumber = pageNumber;
    const workUnitNameFilter = this.getWorkUnitNameFilter();

    this.projectService.getPaginatedProjectsWithFilters(
      apiPageNumber,
      this.tpnFilterObject.value,
      this.getMarkerSymbolFilter(),
      this.getIntentionsFilter(),
      workUnitNameFilter,
      this.getPrivaciesFilter()).pipe(first()).subscribe(data => {
        if (data['_embedded']) {
          this.projects = data['_embedded']['projectDToes'];
          this.projects = this.projects.map(x => this.adapter.adapt(x));
        } else {
          this.projects = [];
        }
        this.page = data['page'];
        this.p = pageNumber;
        this.isLoading = false;
        this.error = null;
      },
        error => {
          this.isLoading = false;
          this.error = error;
        }
      );
  }

  getWorkUnitNameFilter(): string[] {
    const workUnitFilter = this.getWorkUnitsForLoggedUser();
    return workUnitFilter;
  }

  private getWorkUnitsForLoggedUser(): string[] {
    const workUnitNames = [];
    if (this.loggedUser.rolesWorkUnits) {
      this.loggedUser.rolesWorkUnits.map(x => workUnitNames.push(x.workUnitName));
    }
    return workUnitNames;
  }

  filterWithTpn(filterInput) {
    const currentFilterValue = this.tpnFilterObject.value;
    this.projectFilterService.updateTpnFilter(this.tpnFilterObject, filterInput);
    const newFilterValue = this.tpnFilterObject.value;
    this.reloadIfValuesAreDifferent(currentFilterValue, newFilterValue);
  }

  cleanTpnlFilter() {
    this.tpnFilterInput = '';
    this.cleanFilter(this.tpnFilterObject);
  }

  filterWithMarkerSymbol(filterInput) {
    const currentFilterValue = this.markerSymbolFilterObject.value;
    this.projectFilterService.updateMarkerSymbolFilter(this.markerSymbolFilterObject, filterInput);
    const newFilterValue = this.markerSymbolFilterObject.value;
    this.reloadIfValuesAreDifferent(currentFilterValue, newFilterValue);
  }

  cleanMarkerSymbolFilter() {
    this.markerSymbolFilterInput = '';
    this.cleanFilter(this.markerSymbolFilterObject);
  }

  filterWithIntentions(filterInput) {
    const currentFilterValue = this.intentionsFilterObject.values;
    this.projectFilterService.updateIntentionsFilter(this.intentionsFilterObject, filterInput);
    const newFilterValue = this.intentionsFilterObject.values;
    this.reloadIfValuesAreDifferent(currentFilterValue, newFilterValue);
  }

  filterWithPrivacies(filterInput) {
    const currentFilterValue = this.privaciesFilterObject.values;
    this.projectFilterService.updatePrivaciesFilter(this.privaciesFilterObject, filterInput);
    const newFilterValue = this.privaciesFilterObject.values;
    this.reloadIfValuesAreDifferent(currentFilterValue, newFilterValue);
  }

  getMarkerSymbolFilter(): string[] {
    let result = [];
    if (this.markerSymbolFilterObject.value) {
      result = [this.markerSymbolFilterObject.value.trim()]
    }
    return result;
  }

  getIntentionsFilter(): string[] {
    let result = [];
    if (this.intentionsFilterObject.values.length > 0) {
      result = this.intentionsFilterObject.values;
    }
    return result;
  }

  getPrivaciesFilter(): string[] {
    let result = [];
    if (this.privaciesFilterObject.values.length > 0) {
      result = this.privaciesFilterObject.values;
    }
    return result;
  }

  private cleanFilter(filter: Filter) {
    filter.value = '';
    this.getPage(0);
  }

  private reloadIfValuesAreDifferent(currentFilterValue, newFilterValue) {
    console.log('currentFilterValue:', currentFilterValue, ' newFilterValue:', newFilterValue);

    if (currentFilterValue != newFilterValue) {
      console.log('@------->Reloading...');

      this.getPage(0);
    }
  }

}
