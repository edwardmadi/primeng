import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
    AfterContentInit,
    AfterViewChecked,
    booleanAttribute,
    ChangeDetectionStrategy,
    Component,
    ContentChild,
    ContentChildren,
    ElementRef,
    EventEmitter,
    forwardRef,
    HostBinding,
    inject,
    Input,
    NgModule,
    numberAttribute,
    OnDestroy,
    Output,
    QueryList,
    TemplateRef,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { find, findSingle, focus, getAttribute, getOffset, getOuterWidth, getWidth, uuid } from '@primeuix/utils';
import { BlockableUI, PrimeTemplate, SharedModule } from 'primeng/api';
import { BaseComponent } from 'primeng/basecomponent';
import { ChevronLeftIcon, ChevronRightIcon, TimesIcon } from 'primeng/icons';
import { Ripple } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { Nullable } from 'primeng/ts-helpers';
import { Subscription } from 'rxjs';
import { TabsStyle } from './style/tabsstyle';
import { TabViewChangeEvent, TabViewCloseEvent } from './tabview.interface';

/**
 * TabPanel is a helper component for TabView component.
 * @group Components
 */
@Component({
    selector: 'p-tabPanel, p-tabpanel',
    standalone: true,
    imports: [CommonModule, SharedModule],
    template: `
        <div
            *ngIf="!closed"
            class="p-tabview-panel"
            role="tabpanel"
            [hidden]="!selected"
            [attr.id]="tabView.getTabContentId(id)"
            [attr.aria-hidden]="!selected"
            [attr.aria-labelledby]="tabView.getTabHeaderActionId(id)"
            [attr.data-pc-name]="'tabpanel'"
        >
            <ng-content></ng-content>
            <ng-container *ngIf="(contentTemplate || _contentTemplate) && (cache ? loaded : selected)">
                <ng-container *ngTemplateOutlet="contentTemplate || _contentTemplate"></ng-container>
            </ng-container>
        </div>
    `,

    providers: [TabsStyle]
})
export class TabPanel extends BaseComponent implements AfterContentInit, OnDestroy {
    /**
     * Defines if tab can be removed.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) closable: boolean | undefined = false;
    /**
     * Inline style of the tab header.
     * @group Props
     */
    @Input() get headerStyle(): { [klass: string]: any } | null | undefined {
        return this._headerStyle;
    }
    set headerStyle(headerStyle: { [klass: string]: any } | null | undefined) {
        this._headerStyle = headerStyle;
        this.tabView.cd.markForCheck();
    }
    /**
     * Style class of the tab header.
     * @group Props
     */
    @Input() get headerStyleClass(): string | undefined {
        return this._headerStyleClass;
    }
    set headerStyleClass(headerStyleClass: string | undefined) {
        this._headerStyleClass = headerStyleClass;
        this.tabView.cd.markForCheck();
    }
    /**
     * Whether a lazy loaded panel should avoid getting loaded again on reselection.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) cache: boolean | undefined = true;
    /**
     * Advisory information to display in a tooltip on hover.
     * @group Props
     */
    @Input() tooltip: string | undefined;
    /**
     * Position of the tooltip.
     * @group Props
     */
    @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' | undefined = 'top';
    /**
     * Type of CSS position.
     * @group Props
     */
    @Input() tooltipPositionStyle: string | undefined = 'absolute';
    /**
     * Style class of the tooltip.
     * @group Props
     */
    @Input() tooltipStyleClass: string | undefined;
    /**
     * Defines if tab is active.
     * @defaultValue false
     * @group Props
     */
    @Input() get selected(): boolean {
        return !!this._selected;
    }
    set selected(val: boolean) {
        this._selected = val;

        if (!this.loaded) {
            this.cd.detectChanges();
        }

        if (val) this.loaded = true;
    }
    /**
     * When true, tab cannot be activated.
     * @defaultValue false
     * @group Props
     */
    @Input() get disabled(): boolean {
        return !!this._disabled;
    }
    set disabled(disabled: boolean) {
        this._disabled = disabled;
        this.tabView.cd.markForCheck();
    }
    /**
     * Title of the tabPanel.
     * @group Props
     */
    @Input() get header(): string {
        return this._header;
    }
    set header(header: string) {
        this._header = header;

        // We have to wait for the rendering and then retrieve the actual size element from the DOM.
        // in future `Promise.resolve` can be changed to `queueMicrotask` (if ie11 support will be dropped)
        Promise.resolve().then(() => {
            this.tabView.updateInkBar();
            this.tabView.cd.markForCheck();
        });
    }
    /**
     * Left icon of the tabPanel.
     * @group Props
     * @deprecated since v15.4.2, use `lefticon` template instead.
     */
    @Input() get leftIcon(): string {
        return this._leftIcon;
    }
    set leftIcon(leftIcon: string) {
        this._leftIcon = leftIcon;
        this.tabView.cd.markForCheck();
    }
    /**
     * Left icon of the tabPanel.
     * @group Props
     * @deprecated since v15.4.2, use `righticon` template instead.
     */
    @Input() get rightIcon(): string | undefined {
        return this._rightIcon;
    }
    set rightIcon(rightIcon: string | undefined) {
        this._rightIcon = rightIcon;
        this.tabView.cd.markForCheck();
    }

    closed: boolean = false;

    _headerStyle: { [klass: string]: any } | null | undefined;

    _headerStyleClass: string | undefined;

    _selected: boolean | undefined;

    _disabled: boolean | undefined;

    _header!: string;

    _leftIcon!: string;

    _rightIcon: string | undefined = undefined;

    loaded: boolean = false;

    public id: string | undefined = uuid('pn_id_');

    @ContentChild('content') contentTemplate: TemplateRef<any> | undefined;

    @ContentChild('header') headerTemplate: TemplateRef<any> | undefined;

    @ContentChild('lefticon') leftIconTemplate: TemplateRef<any> | undefined;

    @ContentChild('righticon') rightIconTemplate: TemplateRef<any> | undefined;

    @ContentChild('closeicon') closeIconTemplate: TemplateRef<any> | undefined;

    @ContentChildren(PrimeTemplate) templates: QueryList<PrimeTemplate> | undefined;

    tabView: TabView = inject(forwardRef(() => TabView)) as TabView;

    _componentStyle = inject(TabsStyle);

    _headerTemplate: TemplateRef<any> | undefined;

    _contentTemplate: TemplateRef<any> | undefined;

    _rightIconTemplate: TemplateRef<any> | undefined;

    _leftIconTemplate: TemplateRef<any> | undefined;

    _closeIconTemplate: TemplateRef<any> | undefined;

    ngAfterContentInit() {
        (this.templates as QueryList<PrimeTemplate>).forEach((item) => {
            switch (item.getType()) {
                case 'header':
                    this._headerTemplate = item.template;
                    break;

                case 'content':
                    this._contentTemplate = item.template;
                    break;

                case 'righticon':
                    this._rightIconTemplate = item.template;
                    break;

                case 'lefticon':
                    this._leftIconTemplate = item.template;
                    break;

                case 'closeicon':
                    this._closeIconTemplate = item.template;
                    break;

                default:
                    this._contentTemplate = item.template;
                    break;
            }
        });
    }
}
/**
 * TabView is a container component to group content with tabs.
 * @group Components
 */
@Component({
    selector: 'p-tabView, p-tabview',
    standalone: true,
    imports: [CommonModule, SharedModule, TooltipModule, Ripple, TimesIcon, ChevronLeftIcon, ChevronRightIcon],
    template: `
        <div #elementToObserve class="p-tablist">
            <button
                *ngIf="scrollable && !backwardIsDisabled && autoHideButtons"
                #prevBtn
                class="p-tablist-prev-button p-tablist-nav-button"
                (click)="navBackward()"
                [attr.tabindex]="tabindex"
                [attr.aria-label]="prevButtonAriaLabel"
                type="button"
                pRipple
            >
                <ChevronLeftIcon *ngIf="!previousIconTemplate && !_previousIconTemplate" [attr.aria-hidden]="true" />
                <ng-template *ngTemplateOutlet="previousIconTemplate && _previousIconTemplate"></ng-template>
            </button>
            <div #content class="p-tablist-content" [ngClass]="{ 'p-tablist-viewport': scrollable }" (scroll)="onScroll($event)" [attr.data-pc-section]="'navcontent'">
                <div #navbar class="p-tablist-tab-list" role="tablist" [attr.data-pc-section]="'nav'">
                    @for (tab of tabs; track tab; let i = $index) {
                        @if (!tab.closed) {
                            <button
                                [ngClass]="{
                                    'p-tab': true,
                                    'p-tab-active': tab.selected,
                                    'p-disabled': tab.disabled
                                }"
                                [attr.role]="'tab'"
                                [class]="tab.headerStyleClass"
                                [ngStyle]="tab.headerStyle"
                                [pTooltip]="tab.tooltip"
                                [tooltipPosition]="tab.tooltipPosition"
                                [positionStyle]="tab.tooltipPositionStyle"
                                [tooltipStyleClass]="tab.tooltipStyleClass"
                                [attr.id]="getTabHeaderActionId(tab.id)"
                                [attr.aria-controls]="getTabContentId(tab.id)"
                                [attr.aria-selected]="tab.selected"
                                [attr.tabindex]="tab.disabled || !tab.selected ? '-1' : tabindex"
                                [attr.aria-disabled]="tab.disabled"
                                [disabled]="tab.disabled"
                                [attr.data-pc-index]="i"
                                [attr.data-p-disabled]="tab.disabled"
                                [attr.data-pc-section]="'headeraction'"
                                [attr.data-p-active]="tab.selected"
                                (click)="open($event, tab)"
                                (keydown)="onTabKeyDown($event, tab)"
                                pRipple
                            >
                                @if (tab.headerTemplate || tab._headerTemplate) {
                                    <ng-container *ngTemplateOutlet="tab.headerTemplate || tab._headerTemplate"></ng-container>
                                } @else {
                                    @if (tab.leftIconTemplate || tab._leftIconTemplate) {
                                        <ng-template *ngTemplateOutlet="tab.leftIconTemplate || tab._leftIconTemplate"></ng-template>
                                    } @else if (tab.leftIcon && !tab.leftIconTemplate && !tab._leftIconTemplate) {
                                        <span class="p-tabview-left-icon" [ngClass]="tab.leftIcon"></span>
                                    }
                                    {{ tab.header }}
                                    @if (tab.rightIconTemplate || tab._rightIconTemplate) {
                                        <ng-template *ngTemplateOutlet="tab.rightIconTemplate || tab._rightIconTemplate"></ng-template>
                                    } @else if (tab.rightIcon && !tab.rightIconTemplate && !tab._rightIconTemplate) {
                                        <span class="p-tabview-right-icon" [ngClass]="tab.rightIcon"></span>
                                    }
                                    @if (tab.closable) {
                                        @if (tab.closeIconTemplate || tab._closeIconTemplate) {
                                            <ng-template *ngTemplateOutlet="tab.closeIconTemplate || tab._closeIconTemplate"></ng-template>
                                        } @else {
                                            <TimesIcon (click)="close($event, tab)" />
                                        }
                                    }
                                }
                            </button>
                            <span #inkbar class="p-tablist-active-bar" role="presentation" [attr.aria-hidden]="true" [attr.data-pc-section]="'inkbar'"></span>
                        }
                    }
                </div>
            </div>
            <button *ngIf="scrollable && !forwardIsDisabled && buttonVisible" #nextBtn [attr.tabindex]="tabindex" [attr.aria-label]="nextButtonAriaLabel" class="p-tablist-next-button p-tablist-nav-button" (click)="navForward()" type="button" pRipple>
                @if (nextIconTemplate || _nextIconTemplate) {
                    <ng-template *ngTemplateOutlet="nextIconTemplate || _nextIconTemplate"></ng-template>
                } @else {
                    <ChevronRightIcon [attr.aria-hidden]="true" />
                }
            </button>
        </div>
        <div class="p-tabpanels">
            <ng-content></ng-content>
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    host: {
        '[class.p-tabs]': 'true',
        '[class.p-tabs-scrollable]': 'scrollable',
        '[class.p-component]': 'true',
        '[attr.data-pc-name]': '"tabview"'
    },
    providers: [TabsStyle]
})
export class TabView extends BaseComponent implements AfterContentInit, AfterViewChecked, OnDestroy, BlockableUI {
    @HostBinding('class') get hostClass() {
        return this.styleClass;
    }

    @HostBinding('style') get hostStyle() {
        return this.style;
    }
    /**
     * Inline style of the component.
     * @group Props
     */
    @Input() style: { [klass: string]: any } | null | undefined;
    /**
     * Style class of the component.
     * @group Props
     */
    @Input() styleClass: string | undefined;
    /**
     * Whether tab close is controlled at onClose event or not.
     * @defaultValue false
     * @group Props
     */
    @Input({ transform: booleanAttribute }) controlClose: boolean | undefined;
    /**
     * When enabled displays buttons at each side of the tab headers to scroll the tab list.
     * @defaultValue false
     * @group Props
     */
    @Input({ transform: booleanAttribute }) scrollable: boolean | undefined;
    /**
     * Index of the active tab to change selected tab programmatically.
     * @group Props
     */
    @Input() get activeIndex(): number {
        return this._activeIndex;
    }
    set activeIndex(val: number) {
        this._activeIndex = val;
        if (this.preventActiveIndexPropagation) {
            this.preventActiveIndexPropagation = false;
            return;
        }

        if (this.tabs && this.tabs.length && this._activeIndex != null && this.tabs.length > this._activeIndex) {
            (this.findSelectedTab() as TabPanel).selected = false;
            this.tabs[this._activeIndex].selected = true;
            this.tabChanged = true;

            this.updateScrollBar(val);
        }
    }
    /**
     * When enabled, the focused tab is activated.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) selectOnFocus: boolean = false;
    /**
     * Used to define a string aria label attribute the forward navigation button.
     * @group Props
     */
    @Input() nextButtonAriaLabel: string | undefined;
    /**
     * Used to define a string aria label attribute the backward navigation button.
     * @group Props
     */
    @Input() prevButtonAriaLabel: string | undefined;
    /**
     * When activated, navigation buttons will automatically hide or show based on the available space within the container.
     * @group Props
     */
    @Input({ transform: booleanAttribute }) autoHideButtons: boolean = true;
    /**
     * Index of the element in tabbing order.
     * @group Props
     */
    @Input({ transform: numberAttribute }) tabindex: number = 0;
    /**
     * Callback to invoke on tab change.
     * @param {TabViewChangeEvent} event - Custom tab change event
     * @group Emits
     */
    @Output() onChange: EventEmitter<TabViewChangeEvent> = new EventEmitter<TabViewChangeEvent>();
    /**
     * Callback to invoke on tab close.
     * @param {TabViewCloseEvent} event - Custom tab close event
     * @group Emits
     */
    @Output() onClose: EventEmitter<TabViewCloseEvent> = new EventEmitter<TabViewCloseEvent>();
    /**
     * Callback to invoke on the active tab change.
     * @param {number} index - New active index
     * @group Emits
     */
    @Output() activeIndexChange: EventEmitter<number> = new EventEmitter<number>();

    @ViewChild('content') content?: ElementRef<HTMLDivElement>;

    @ViewChild('navbar') navbar?: ElementRef<HTMLUListElement>;

    @ViewChild('prevBtn') prevBtn?: ElementRef;

    @ViewChild('nextBtn') nextBtn?: ElementRef;

    @ViewChild('inkbar') inkbar?: ElementRef;

    @ContentChildren(TabPanel) tabPanels: QueryList<TabPanel> | undefined;

    initialized: boolean | undefined;

    tabs!: TabPanel[];

    _activeIndex!: number;

    preventActiveIndexPropagation!: boolean;

    tabChanged: boolean | undefined;

    backwardIsDisabled: boolean = true;

    forwardIsDisabled: boolean = false;

    private tabChangesSubscription!: Subscription;

    resizeObserver: Nullable<ResizeObserver>;

    container: HTMLDivElement | undefined;

    list: HTMLUListElement | undefined;

    buttonVisible: boolean;

    @ViewChild('elementToObserve') elementToObserve: ElementRef;

    @ContentChild('previousicon') previousIconTemplate: TemplateRef<any> | undefined;

    @ContentChild('nexticon') nextIconTemplate: TemplateRef<any> | undefined;

    _previousIconTemplate: TemplateRef<any> | undefined;

    _nextIconTemplate: TemplateRef<any> | undefined;

    _componentStyle = inject(TabsStyle);

    @ContentChildren(PrimeTemplate) templates: QueryList<PrimeTemplate> | undefined;

    ngOnInit() {
        super.ngOnInit();
        console.log('TabView component is deprecated as of v18. Use Tabs component instead.');
    }

    ngAfterContentInit() {
        this.initTabs();
        this.tabChangesSubscription = (this.tabPanels as QueryList<TabPanel>).changes.subscribe((_) => {
            this.initTabs();
            this.refreshButtonState();
        });

        (this.templates as QueryList<PrimeTemplate>).forEach((item) => {
            switch (item.getType()) {
                case 'previousicon':
                    this._previousIconTemplate = item.template;
                    break;

                case 'nexticon':
                    this._nextIconTemplate = item.template;
                    break;
            }
        });
    }

    ngAfterViewInit() {
        super.ngAfterViewInit();
        if (isPlatformBrowser(this.platformId)) {
            if (this.autoHideButtons) {
                this.bindResizeObserver();
            }
        }
    }

    bindResizeObserver() {
        this.container = <any>findSingle(this.el.nativeElement, '[data-pc-section="navcontent"]');
        this.list = <any>findSingle(this.el.nativeElement, '[data-pc-section="nav"]');

        this.resizeObserver = new ResizeObserver(() => {
            if (this.list.offsetWidth >= this.container.offsetWidth) {
                this.buttonVisible = true;
            } else {
                this.buttonVisible = false;
            }
            this.updateButtonState();
            this.cd.detectChanges();
        });
        this.resizeObserver.observe(this.container);
    }

    unbindResizeObserver() {
        this.resizeObserver.unobserve(this.elementToObserve.nativeElement);
        this.resizeObserver = null;
    }

    ngAfterViewChecked() {
        if (isPlatformBrowser(this.platformId)) {
            if (this.tabChanged) {
                this.updateInkBar();
                this.tabChanged = false;
            }
        }
    }

    ngOnDestroy(): void {
        if (this.tabChangesSubscription) {
            this.tabChangesSubscription.unsubscribe();
        }

        if (this.resizeObserver) {
            this.unbindResizeObserver();
        }

        super.ngOnDestroy();
    }

    getTabHeaderActionId(tabId) {
        return `${tabId}_header_action`;
    }

    getTabContentId(tabId) {
        return `${tabId}_content`;
    }

    initTabs(): void {
        this.tabs = (this.tabPanels as QueryList<TabPanel>).toArray();
        let selectedTab: TabPanel = this.findSelectedTab() as TabPanel;
        if (!selectedTab && this.tabs.length) {
            if (this.activeIndex != null && this.tabs.length > this.activeIndex) this.tabs[this.activeIndex].selected = true;
            else this.tabs[0].selected = true;

            this.tabChanged = true;
        }

        this.cd.markForCheck();
    }

    onTabKeyDown(event: KeyboardEvent, tab: TabPanel): void {
        switch (event.code) {
            case 'ArrowLeft':
                this.onTabArrowLeftKey(event);
                break;

            case 'ArrowRight':
                this.onTabArrowRightKey(event);
                break;

            case 'Home':
                this.onTabHomeKey(event);
                break;

            case 'End':
                this.onTabEndKey(event);
                break;

            case 'PageDown':
                this.onTabEndKey(event);
                break;

            case 'PageUp':
                this.onTabHomeKey(event);
                break;

            case 'Enter':
            case 'Space':
                this.open(event, tab);
                break;

            default:
                break;
        }
    }

    onTabArrowLeftKey(event: KeyboardEvent) {
        const prevHeaderAction = this.findPrevHeaderAction(<HTMLElement>event.currentTarget);
        const index = getAttribute(prevHeaderAction, 'data-pc-index');

        prevHeaderAction ? this.changeFocusedTab(event, prevHeaderAction, index) : this.onTabEndKey(event);
        event.preventDefault();
    }

    onTabArrowRightKey(event: KeyboardEvent) {
        const nextHeaderAction = this.findNextHeaderAction(<HTMLElement>event.currentTarget);

        const index = getAttribute(nextHeaderAction, 'data-pc-index');
        nextHeaderAction ? this.changeFocusedTab(event, nextHeaderAction, index) : this.onTabHomeKey(event);
        event.preventDefault();
    }

    onTabHomeKey(event: KeyboardEvent) {
        const firstHeaderAction = this.findFirstHeaderAction();
        const index = getAttribute(firstHeaderAction, 'data-pc-index');

        this.changeFocusedTab(event, firstHeaderAction, index);
        event.preventDefault();
    }

    onTabEndKey(event: KeyboardEvent) {
        const lastHeaderAction = this.findLastHeaderAction();
        const index = getAttribute(lastHeaderAction, 'data-pc-index');

        this.changeFocusedTab(event, lastHeaderAction, index);
        event.preventDefault();
    }

    changeFocusedTab(event: KeyboardEvent, element: any, index: number) {
        if (element) {
            focus(element);
            element.scrollIntoView({ block: 'nearest' });

            if (this.selectOnFocus) {
                const tab = this.tabs[index];
                this.open(event, tab);
            }
        }
    }

    findNextHeaderAction(tabElement: any, selfCheck = false) {
        const headerElement = selfCheck ? tabElement : tabElement.nextElementSibling;

        return headerElement ? (getAttribute(headerElement, 'data-p-disabled') || getAttribute(headerElement, 'data-pc-section') === 'inkbar' ? this.findNextHeaderAction(headerElement) : headerElement) : null;
    }

    findPrevHeaderAction(tabElement: any, selfCheck = false) {
        const headerElement = selfCheck ? tabElement : tabElement.previousElementSibling;

        return headerElement ? (getAttribute(headerElement, 'data-p-disabled') || getAttribute(headerElement, 'data-pc-section') === 'inkbar' ? this.findPrevHeaderAction(headerElement) : headerElement) : null;
    }

    findFirstHeaderAction() {
        const firstEl = this.navbar.nativeElement.firstElementChild;
        return this.findNextHeaderAction(firstEl, true);
    }

    findLastHeaderAction() {
        const lastEl = this.navbar.nativeElement.lastElementChild;
        const lastHeaderAction = getAttribute(lastEl, 'data-pc-section') === 'inkbar' ? lastEl.previousElementSibling : lastEl;
        return this.findPrevHeaderAction(lastHeaderAction, true);
    }

    open(event: Event, tab: TabPanel) {
        if (tab.disabled) {
            if (event) {
                event.preventDefault();
            }
            return;
        }

        if (!tab.selected) {
            let selectedTab: TabPanel = this.findSelectedTab() as TabPanel;
            if (selectedTab) {
                selectedTab.selected = false;
            }

            this.tabChanged = true;
            tab.selected = true;
            let selectedTabIndex = this.findTabIndex(tab);
            this.preventActiveIndexPropagation = true;
            this.activeIndexChange.emit(selectedTabIndex);
            this.onChange.emit({ originalEvent: event, index: selectedTabIndex });

            this.updateScrollBar(selectedTabIndex);
        }

        if (event) {
            event.preventDefault();
        }
    }

    close(event: Event, tab: TabPanel) {
        if (this.controlClose) {
            this.onClose.emit({
                originalEvent: event,
                index: this.findTabIndex(tab),
                close: () => {
                    this.closeTab(tab);
                }
            });
        } else {
            this.closeTab(tab);
            this.onClose.emit({
                originalEvent: event,
                index: this.findTabIndex(tab)
            });
        }
        event.stopPropagation();
    }

    closeTab(tab: TabPanel) {
        if (tab.disabled) {
            return;
        }
        if (tab.selected) {
            this.tabChanged = true;
            tab.selected = false;
            for (let i = 0; i < this.tabs.length; i++) {
                let tabPanel = this.tabs[i];
                if (!tabPanel.closed && !tab.disabled) {
                    tabPanel.selected = true;
                    break;
                }
            }
        }

        tab.closed = true;
    }

    findSelectedTab(): TabPanel | null {
        for (let i = 0; i < this.tabs.length; i++) {
            if (this.tabs[i].selected) {
                return this.tabs[i];
            }
        }
        return null;
    }

    findTabIndex(tab: TabPanel) {
        let index = -1;
        for (let i = 0; i < this.tabs.length; i++) {
            if (this.tabs[i] == tab) {
                index = i;
                break;
            }
        }
        return index;
    }

    getBlockableElement(): HTMLElement {
        return this.el.nativeElement.children[0];
    }

    updateInkBar() {
        if (isPlatformBrowser(this.platformId)) {
            if (this.navbar) {
                const tabHeader: HTMLElement | null = <any>findSingle(this.navbar.nativeElement, '[data-pc-section="headeraction"][data-p-active="true"]');

                if (!tabHeader) {
                    return;
                }

                (this.inkbar as ElementRef).nativeElement.style.width = getOuterWidth(tabHeader) + 'px';
                (this.inkbar as ElementRef).nativeElement.style.left = <any>getOffset(tabHeader).left - <any>getOffset(this.navbar.nativeElement).left + 'px';
            }
        }
    }

    updateScrollBar(index: number) {
        let tabHeader = find(this.navbar.nativeElement, '[data-pc-section="headeraction"]')[index];

        if (tabHeader) {
            tabHeader.scrollIntoView({ block: 'nearest' });
        }
    }

    updateButtonState() {
        const content = (this.content as ElementRef).nativeElement;
        const { scrollLeft, scrollWidth } = content;
        const width = getWidth(content);

        this.backwardIsDisabled = scrollLeft === 0;
        this.forwardIsDisabled = Math.round(scrollLeft) === scrollWidth - width;
    }

    refreshButtonState() {
        this.container = <any>findSingle(this.el.nativeElement, '[data-pc-section="navcontent"]');
        this.list = <any>findSingle(this.el.nativeElement, '[data-pc-section="nav"]');
        if (this.list.offsetWidth >= this.container.offsetWidth) {
            if (this.list.offsetWidth >= this.container.offsetWidth) {
                this.buttonVisible = true;
            } else {
                this.buttonVisible = false;
            }
            this.updateButtonState();
            this.cd.markForCheck();
        }
    }

    onScroll(event: Event) {
        this.scrollable && this.updateButtonState();

        event.preventDefault();
    }

    getVisibleButtonWidths() {
        return [this.prevBtn?.nativeElement, this.nextBtn?.nativeElement].reduce((acc, el) => (el ? acc + getWidth(el) : acc), 0);
    }

    navBackward() {
        const content = (this.content as ElementRef).nativeElement;
        const width = getWidth(content) - this.getVisibleButtonWidths();
        const pos = content.scrollLeft - width;
        content.scrollLeft = pos <= 0 ? 0 : pos;
    }

    navForward() {
        const content = (this.content as ElementRef).nativeElement;
        const width = getWidth(content) - this.getVisibleButtonWidths();
        const pos = content.scrollLeft + width;
        const lastPos = content.scrollWidth - width;

        content.scrollLeft = pos >= lastPos ? lastPos : pos;
    }
}

@NgModule({
    imports: [TabView, TabPanel, SharedModule],
    exports: [TabView, TabPanel, SharedModule]
})
export class TabViewModule {}
