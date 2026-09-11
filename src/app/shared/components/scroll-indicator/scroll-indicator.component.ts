import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { SectionScrollService } from '../../services/section-scroll.service';

@Component({
  selector: 'app-scroll-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './scroll-indicator.component.html',
  styleUrl: './scroll-indicator.component.css'
})
export class ScrollIndicatorComponent {
  readonly target = input.required<string>();
  readonly label = input('Scroll para explorar');
  readonly variant = input<'down' | 'up'>('down');

  private readonly sectionScroll = inject(SectionScrollService);

  handleClick(): void {
    this.sectionScroll.goToSection(this.target());
  }
}
