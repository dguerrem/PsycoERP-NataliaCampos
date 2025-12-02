import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';

@Component({
  selector: 'app-bond',
  standalone: true,
  imports: [SectionHeaderComponent],
  templateUrl: './bond.component.html',
  styleUrl: './bond.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BondComponent {

}
