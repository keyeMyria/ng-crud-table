import {
  Directive, ElementRef, HostListener, Input, Output, EventEmitter, OnDestroy, AfterViewInit
} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/observable/fromEvent';
import "rxjs/add/operator/takeUntil";

@Directive({
  selector: '[resizeable]',
  host: {
    '[class.resizeable]': 'resizeEnabled'
  }
})
export class ResizeableDirective implements OnDestroy, AfterViewInit {

  @Input() resizeEnabled: boolean = true;
  @Input() minWidth: number;
  @Input() maxWidth: number;

  @Output() resize: EventEmitter<any> = new EventEmitter();

  element: HTMLElement;
  subscription: Subscription;
  resizing: boolean = false;

  constructor(element: ElementRef) {
    this.element = element.nativeElement;
  }

  ngAfterViewInit(): void {
    if (this.resizeEnabled) {
      const node = document.createElement('span');
      node.classList.add('resize-handle');
      this.element.appendChild(node);
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this._destroySubscription();
    }
  }

  onMouseup(): void {
    this.resizing = false;

    if (this.subscription && !this.subscription.closed) {
      this._destroySubscription();
      this.resize.emit(this.element.clientWidth);
    }
  }

  @HostListener('mousedown', ['$event'])
  onMousedown(event: MouseEvent): void {
    const isHandle = (<HTMLElement>(event.target)).classList.contains('resize-handle');
    const initialWidth = this.element.clientWidth;
    const mouseDownScreenX = event.screenX;

    if (isHandle) {
      event.stopPropagation();
      this.resizing = true;

      let mouseup = Observable.fromEvent(document, 'mouseup');
      this.subscription = mouseup
        .subscribe((ev: MouseEvent) => this.onMouseup());

      let mouseMoveSub = Observable.fromEvent(document, 'mousemove')
        .takeUntil(mouseup)
        .subscribe((e: MouseEvent) => this.move(e, initialWidth, mouseDownScreenX));

      this.subscription.add(mouseMoveSub);
    }
  }

  move(event: MouseEvent, initialWidth: number, mouseDownScreenX: number): void {
    const movementX = event.screenX - mouseDownScreenX;
    const newWidth = initialWidth + movementX;

    const overMinWidth = !this.minWidth || newWidth >= this.minWidth;
    const underMaxWidth = !this.maxWidth || newWidth <= this.maxWidth;

    if (overMinWidth && underMaxWidth) {
      this.element.style.width = `${newWidth}px`;
    }
  }

  private _destroySubscription() {
    this.subscription.unsubscribe();
    this.subscription = undefined;
  }

}
