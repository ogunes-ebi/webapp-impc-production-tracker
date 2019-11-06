import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { TargetListTableRecord } from '../list-management/list-management.component';
import { Target } from 'src/app/model/bio/target_gene_list/gene-result';
import { GeneService, Gene } from 'src/app/core';
import { Observable, of } from 'rxjs';
import { FormControl } from '@angular/forms';
import { MatChipInputEvent, MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material';

@Component({
  selector: 'app-autocomplete-gene-inputs',
  templateUrl: './autocomplete-gene-inputs.component.html',
  styleUrls: ['./autocomplete-gene-inputs.component.css']
})
export class AutocompleteGeneInputsComponent implements OnInit {

  @Input() record: TargetListTableRecord;
  readonly GENE_SYMBOL_LENGTH_THRESHOLD = 3;
  options: string[] = [];
  filteredOptions: Observable<string[]> = of([]);
  genesCtrl = new FormControl();
  separatorKeysCodes: number[] = [ENTER, COMMA];

  @ViewChild('geneInput', { static: false }) geneInput: ElementRef<HTMLInputElement>;
  @ViewChild('auto', { static: false }) matAutocomplete: MatAutocomplete;

  constructor(private geneService: GeneService) { }

  ngOnInit() {
  }

  public onSearchChange(value: string) {
    this.resetGeneSymbolValuesIfNeeded(value);
    if (value.length === this.GENE_SYMBOL_LENGTH_THRESHOLD) {
      this.geneService.findGenesNamesStartingWith(value).subscribe(x => {
        this.options = x;
        this.filteredOptions = of(x);
      });
    } else {
      this.filteredOptions = of(this.filter(value));
    }
  }

  private filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.options.filter(option => option.toLowerCase().includes(filterValue));
  }

  resetGeneSymbolValuesIfNeeded(value: string) {
    if (value.length < this.GENE_SYMBOL_LENGTH_THRESHOLD) {
      this.resetGeneSymbolSuggestionList();
    }
  }

  resetGeneSymbolSuggestionList() {
    this.options = [];
    this.filteredOptions = of([]);
  }

  public getGenesNamesByElement(): string[] {
    const targetsByRecord: Target[] = this.record.targetListElement.targets;
    return targetsByRecord.map(x => x.gene.symbol);
  }

  add(event: MatChipInputEvent): void {
    // Add only when MatAutocomplete is not open
    // To make sure this does not conflict with OptionSelected Event
    if (!this.matAutocomplete.isOpen) {
      const input = event.input;
      const value = event.value;

      if ((value || '').trim()) {
        this.addGeneToRecord(value.trim());
      }

      // Reset the input value
      if (input) {
        input.value = '';
      }

      this.genesCtrl.setValue(null);
    }
  }

  // Add the new gene object to the current record (if it does not exist already)
  private addGeneToRecord(label: string) {
    const targets: Target[] = this.record.targetListElement.targets;
    const alreadyExistingGene = targets.find(x => x.gene.symbol === label);
    if (!alreadyExistingGene) {
      const newGene = new Gene();
      newGene.symbol = label;
      const newTarget = new Target();
      newTarget.gene = newGene;
      targets.push(newTarget);
    }
  }

  public remove(label: string): void {
    this.removeGeneFromRecord(label);
  }

  private removeGeneFromRecord(label: string) {
    const targets: Target[] = this.record.targetListElement.targets;
    const index = targets.findIndex(x => x.gene.symbol === label);
    if (index >= 0) {
      targets.splice(index, 1);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.addGeneToRecord(event.option.viewValue);
    this.geneInput.nativeElement.value = '';
    this.genesCtrl.setValue(null);
  }

}
