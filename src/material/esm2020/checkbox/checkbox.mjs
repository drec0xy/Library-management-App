/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Attribute, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, forwardRef, Inject, Input, NgZone, Optional, Output, ViewChild, ViewEncapsulation, } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatRipple, mixinColor, mixinDisabled, mixinDisableRipple, mixinTabIndex, } from '@angular/material/core';
import { ANIMATION_MODULE_TYPE } from '@angular/platform-browser/animations';
import { MAT_CHECKBOX_DEFAULT_OPTIONS, MAT_CHECKBOX_DEFAULT_OPTIONS_FACTORY, } from './checkbox-config';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/a11y";
import * as i2 from "@angular/material/core";
import * as i3 from "@angular/cdk/observers";
// Increasing integer for generating unique ids for checkbox components.
let nextUniqueId = 0;
// Default checkbox configuration.
const defaults = MAT_CHECKBOX_DEFAULT_OPTIONS_FACTORY();
/**
 * Provider Expression that allows mat-checkbox to register as a ControlValueAccessor.
 * This allows it to support [(ngModel)].
 * @docs-private
 */
export const MAT_CHECKBOX_CONTROL_VALUE_ACCESSOR = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MatCheckbox),
    multi: true,
};
/** Change event object emitted by MatCheckbox. */
export class MatCheckboxChange {
}
// Boilerplate for applying mixins to MatCheckbox.
/** @docs-private */
const _MatCheckboxBase = mixinTabIndex(mixinColor(mixinDisableRipple(mixinDisabled(class {
    constructor(_elementRef) {
        this._elementRef = _elementRef;
    }
}))));
/**
 * A material design checkbox component. Supports all of the functionality of an HTML5 checkbox,
 * and exposes a similar API. A MatCheckbox can be either checked, unchecked, indeterminate, or
 * disabled. Note that all additional accessibility attributes are taken care of by the component,
 * so there is no need to provide them yourself. However, if you want to omit a label and still
 * have the checkbox be accessible, you may supply an [aria-label] input.
 * See: https://material.io/design/components/selection-controls.html
 */
export class MatCheckbox extends _MatCheckboxBase {
    constructor(elementRef, _changeDetectorRef, _focusMonitor, _ngZone, tabIndex, _animationMode, _options) {
        super(elementRef);
        this._changeDetectorRef = _changeDetectorRef;
        this._focusMonitor = _focusMonitor;
        this._ngZone = _ngZone;
        this._animationMode = _animationMode;
        this._options = _options;
        /**
         * Attached to the aria-label attribute of the host element. In most cases, aria-labelledby will
         * take precedence so this may be omitted.
         */
        this.ariaLabel = '';
        /**
         * Users can specify the `aria-labelledby` attribute which will be forwarded to the input element
         */
        this.ariaLabelledby = null;
        this._uniqueId = `mat-checkbox-${++nextUniqueId}`;
        /** A unique id for the checkbox input. If none is supplied, it will be auto-generated. */
        this.id = this._uniqueId;
        /** Whether the label should appear after or before the checkbox. Defaults to 'after' */
        this.labelPosition = 'after';
        /** Name value will be applied to the input element if present */
        this.name = null;
        /** Event emitted when the checkbox's `checked` value changes. */
        this.change = new EventEmitter();
        /** Event emitted when the checkbox's `indeterminate` value changes. */
        this.indeterminateChange = new EventEmitter();
        /**
         * Called when the checkbox is blurred. Needed to properly implement ControlValueAccessor.
         * @docs-private
         */
        this._onTouched = () => { };
        this._currentAnimationClass = '';
        this._currentCheckState = 0 /* Init */;
        this._controlValueAccessorChangeFn = () => { };
        this._checked = false;
        this._disabled = false;
        this._indeterminate = false;
        this._options = this._options || defaults;
        this.color = this.defaultColor = this._options.color || defaults.color;
        this.tabIndex = parseInt(tabIndex) || 0;
    }
    /** Returns the unique id for the visual hidden input. */
    get inputId() {
        return `${this.id || this._uniqueId}-input`;
    }
    /** Whether the checkbox is required. */
    get required() {
        return this._required;
    }
    set required(value) {
        this._required = coerceBooleanProperty(value);
    }
    ngAfterViewInit() {
        this._focusMonitor.monitor(this._elementRef, true).subscribe(focusOrigin => {
            if (!focusOrigin) {
                // When a focused element becomes disabled, the browser *immediately* fires a blur event.
                // Angular does not expect events to be raised during change detection, so any state change
                // (such as a form control's 'ng-touched') will cause a changed-after-checked error.
                // See https://github.com/angular/angular/issues/17793. To work around this, we defer
                // telling the form control it has been touched until the next tick.
                Promise.resolve().then(() => {
                    this._onTouched();
                    this._changeDetectorRef.markForCheck();
                });
            }
        });
        this._syncIndeterminate(this._indeterminate);
    }
    // TODO: Delete next major revision.
    ngAfterViewChecked() { }
    ngOnDestroy() {
        this._focusMonitor.stopMonitoring(this._elementRef);
    }
    /**
     * Whether the checkbox is checked.
     */
    get checked() {
        return this._checked;
    }
    set checked(value) {
        if (value != this.checked) {
            this._checked = value;
            this._changeDetectorRef.markForCheck();
        }
    }
    /**
     * Whether the checkbox is disabled. This fully overrides the implementation provided by
     * mixinDisabled, but the mixin is still required because mixinTabIndex requires it.
     */
    get disabled() {
        return this._disabled;
    }
    set disabled(value) {
        const newValue = coerceBooleanProperty(value);
        if (newValue !== this.disabled) {
            this._disabled = newValue;
            this._changeDetectorRef.markForCheck();
        }
    }
    /**
     * Whether the checkbox is indeterminate. This is also known as "mixed" mode and can be used to
     * represent a checkbox with three states, e.g. a checkbox that represents a nested list of
     * checkable items. Note that whenever checkbox is manually clicked, indeterminate is immediately
     * set to false.
     */
    get indeterminate() {
        return this._indeterminate;
    }
    set indeterminate(value) {
        const changed = value != this._indeterminate;
        this._indeterminate = coerceBooleanProperty(value);
        if (changed) {
            if (this._indeterminate) {
                this._transitionCheckState(3 /* Indeterminate */);
            }
            else {
                this._transitionCheckState(this.checked ? 1 /* Checked */ : 2 /* Unchecked */);
            }
            this.indeterminateChange.emit(this._indeterminate);
        }
        this._syncIndeterminate(this._indeterminate);
    }
    _isRippleDisabled() {
        return this.disableRipple || this.disabled;
    }
    /** Method being called whenever the label text changes. */
    _onLabelTextChange() {
        // Since the event of the `cdkObserveContent` directive runs outside of the zone, the checkbox
        // component will be only marked for check, but no actual change detection runs automatically.
        // Instead of going back into the zone in order to trigger a change detection which causes
        // *all* components to be checked (if explicitly marked or not using OnPush), we only trigger
        // an explicit change detection for the checkbox view and its children.
        this._changeDetectorRef.detectChanges();
    }
    // Implemented as part of ControlValueAccessor.
    writeValue(value) {
        this.checked = !!value;
    }
    // Implemented as part of ControlValueAccessor.
    registerOnChange(fn) {
        this._controlValueAccessorChangeFn = fn;
    }
    // Implemented as part of ControlValueAccessor.
    registerOnTouched(fn) {
        this._onTouched = fn;
    }
    // Implemented as part of ControlValueAccessor.
    setDisabledState(isDisabled) {
        this.disabled = isDisabled;
    }
    _getAriaChecked() {
        if (this.checked) {
            return 'true';
        }
        return this.indeterminate ? 'mixed' : 'false';
    }
    _transitionCheckState(newState) {
        let oldState = this._currentCheckState;
        let element = this._elementRef.nativeElement;
        if (oldState === newState) {
            return;
        }
        if (this._currentAnimationClass.length > 0) {
            element.classList.remove(this._currentAnimationClass);
        }
        this._currentAnimationClass = this._getAnimationClassForCheckStateTransition(oldState, newState);
        this._currentCheckState = newState;
        if (this._currentAnimationClass.length > 0) {
            element.classList.add(this._currentAnimationClass);
            // Remove the animation class to avoid animation when the checkbox is moved between containers
            const animationClass = this._currentAnimationClass;
            this._ngZone.runOutsideAngular(() => {
                setTimeout(() => {
                    element.classList.remove(animationClass);
                }, 1000);
            });
        }
    }
    _emitChangeEvent() {
        const event = new MatCheckboxChange();
        event.source = this;
        event.checked = this.checked;
        this._controlValueAccessorChangeFn(this.checked);
        this.change.emit(event);
        // Assigning the value again here is redundant, but we have to do it in case it was
        // changed inside the `change` listener which will cause the input to be out of sync.
        if (this._inputElement) {
            this._inputElement.nativeElement.checked = this.checked;
        }
    }
    /** Toggles the `checked` state of the checkbox. */
    toggle() {
        this.checked = !this.checked;
    }
    /**
     * Event handler for checkbox input element.
     * Toggles checked state if element is not disabled.
     * Do not toggle on (change) event since IE doesn't fire change event when
     *   indeterminate checkbox is clicked.
     * @param event
     */
    _onInputClick(event) {
        const clickAction = this._options?.clickAction;
        // We have to stop propagation for click events on the visual hidden input element.
        // By default, when a user clicks on a label element, a generated click event will be
        // dispatched on the associated input element. Since we are using a label element as our
        // root container, the click event on the `checkbox` will be executed twice.
        // The real click event will bubble up, and the generated click event also tries to bubble up.
        // This will lead to multiple click events.
        // Preventing bubbling for the second event will solve that issue.
        event.stopPropagation();
        // If resetIndeterminate is false, and the current state is indeterminate, do nothing on click
        if (!this.disabled && clickAction !== 'noop') {
            // When user manually click on the checkbox, `indeterminate` is set to false.
            if (this.indeterminate && clickAction !== 'check') {
                Promise.resolve().then(() => {
                    this._indeterminate = false;
                    this.indeterminateChange.emit(this._indeterminate);
                });
            }
            this.toggle();
            this._transitionCheckState(this._checked ? 1 /* Checked */ : 2 /* Unchecked */);
            // Emit our custom change event if the native input emitted one.
            // It is important to only emit it, if the native input triggered one, because
            // we don't want to trigger a change event, when the `checked` variable changes for example.
            this._emitChangeEvent();
        }
        else if (!this.disabled && clickAction === 'noop') {
            // Reset native input when clicked with noop. The native checkbox becomes checked after
            // click, reset it to be align with `checked` value of `mat-checkbox`.
            this._inputElement.nativeElement.checked = this.checked;
            this._inputElement.nativeElement.indeterminate = this.indeterminate;
        }
    }
    /** Focuses the checkbox. */
    focus(origin, options) {
        if (origin) {
            this._focusMonitor.focusVia(this._inputElement, origin, options);
        }
        else {
            this._inputElement.nativeElement.focus(options);
        }
    }
    _onInteractionEvent(event) {
        // We always have to stop propagation on the change event.
        // Otherwise the change event, from the input element, will bubble up and
        // emit its event object to the `change` output.
        event.stopPropagation();
    }
    _getAnimationClassForCheckStateTransition(oldState, newState) {
        // Don't transition if animations are disabled.
        if (this._animationMode === 'NoopAnimations') {
            return '';
        }
        let animSuffix = '';
        switch (oldState) {
            case 0 /* Init */:
                // Handle edge case where user interacts with checkbox that does not have [(ngModel)] or
                // [checked] bound to it.
                if (newState === 1 /* Checked */) {
                    animSuffix = 'unchecked-checked';
                }
                else if (newState == 3 /* Indeterminate */) {
                    animSuffix = 'unchecked-indeterminate';
                }
                else {
                    return '';
                }
                break;
            case 2 /* Unchecked */:
                animSuffix =
                    newState === 1 /* Checked */
                        ? 'unchecked-checked'
                        : 'unchecked-indeterminate';
                break;
            case 1 /* Checked */:
                animSuffix =
                    newState === 2 /* Unchecked */
                        ? 'checked-unchecked'
                        : 'checked-indeterminate';
                break;
            case 3 /* Indeterminate */:
                animSuffix =
                    newState === 1 /* Checked */
                        ? 'indeterminate-checked'
                        : 'indeterminate-unchecked';
                break;
        }
        return `mat-checkbox-anim-${animSuffix}`;
    }
    /**
     * Syncs the indeterminate value with the checkbox DOM node.
     *
     * We sync `indeterminate` directly on the DOM node, because in Ivy the check for whether a
     * property is supported on an element boils down to `if (propName in element)`. Domino's
     * HTMLInputElement doesn't have an `indeterminate` property so Ivy will warn during
     * server-side rendering.
     */
    _syncIndeterminate(value) {
        const nativeCheckbox = this._inputElement;
        if (nativeCheckbox) {
            nativeCheckbox.nativeElement.indeterminate = value;
        }
    }
}
MatCheckbox.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: MatCheckbox, deps: [{ token: i0.ElementRef }, { token: i0.ChangeDetectorRef }, { token: i1.FocusMonitor }, { token: i0.NgZone }, { token: 'tabindex', attribute: true }, { token: ANIMATION_MODULE_TYPE, optional: true }, { token: MAT_CHECKBOX_DEFAULT_OPTIONS, optional: true }], target: i0.ɵɵFactoryTarget.Component });
MatCheckbox.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.1.0", type: MatCheckbox, selector: "mat-checkbox", inputs: { disableRipple: "disableRipple", color: "color", tabIndex: "tabIndex", ariaLabel: ["aria-label", "ariaLabel"], ariaLabelledby: ["aria-labelledby", "ariaLabelledby"], ariaDescribedby: ["aria-describedby", "ariaDescribedby"], id: "id", required: "required", labelPosition: "labelPosition", name: "name", value: "value", checked: "checked", disabled: "disabled", indeterminate: "indeterminate" }, outputs: { change: "change", indeterminateChange: "indeterminateChange" }, host: { properties: { "id": "id", "attr.tabindex": "null", "class.mat-checkbox-indeterminate": "indeterminate", "class.mat-checkbox-checked": "checked", "class.mat-checkbox-disabled": "disabled", "class.mat-checkbox-label-before": "labelPosition == \"before\"", "class._mat-animation-noopable": "_animationMode === 'NoopAnimations'" }, classAttribute: "mat-checkbox" }, providers: [MAT_CHECKBOX_CONTROL_VALUE_ACCESSOR], viewQueries: [{ propertyName: "_inputElement", first: true, predicate: ["input"], descendants: true }, { propertyName: "ripple", first: true, predicate: MatRipple, descendants: true }], exportAs: ["matCheckbox"], usesInheritance: true, ngImport: i0, template: "<label [attr.for]=\"inputId\" class=\"mat-checkbox-layout\" #label>\n  <span class=\"mat-checkbox-inner-container\"\n       [class.mat-checkbox-inner-container-no-side-margin]=\"!checkboxLabel.textContent || !checkboxLabel.textContent.trim()\">\n    <input #input\n           class=\"mat-checkbox-input cdk-visually-hidden\" type=\"checkbox\"\n           [id]=\"inputId\"\n           [required]=\"required\"\n           [checked]=\"checked\"\n           [attr.value]=\"value\"\n           [disabled]=\"disabled\"\n           [attr.name]=\"name\"\n           [tabIndex]=\"tabIndex\"\n           [attr.aria-label]=\"ariaLabel || null\"\n           [attr.aria-labelledby]=\"ariaLabelledby\"\n           [attr.aria-checked]=\"_getAriaChecked()\"\n           [attr.aria-describedby]=\"ariaDescribedby\"\n           (change)=\"_onInteractionEvent($event)\"\n           (click)=\"_onInputClick($event)\">\n    <span matRipple class=\"mat-checkbox-ripple mat-focus-indicator\"\n         [matRippleTrigger]=\"label\"\n         [matRippleDisabled]=\"_isRippleDisabled()\"\n         [matRippleRadius]=\"20\"\n         [matRippleCentered]=\"true\"\n         [matRippleAnimation]=\"{enterDuration: _animationMode === 'NoopAnimations' ? 0 : 150}\">\n      <span class=\"mat-ripple-element mat-checkbox-persistent-ripple\"></span>\n    </span>\n    <span class=\"mat-checkbox-frame\"></span>\n    <span class=\"mat-checkbox-background\">\n      <svg version=\"1.1\"\n           focusable=\"false\"\n           class=\"mat-checkbox-checkmark\"\n           viewBox=\"0 0 24 24\"\n           xml:space=\"preserve\"\n           aria-hidden=\"true\">\n        <path class=\"mat-checkbox-checkmark-path\"\n              fill=\"none\"\n              stroke=\"white\"\n              d=\"M4.1,12.7 9,17.6 20.3,6.3\"/>\n      </svg>\n      <!-- Element for rendering the indeterminate state checkbox. -->\n      <span class=\"mat-checkbox-mixedmark\"></span>\n    </span>\n  </span>\n  <span class=\"mat-checkbox-label\" #checkboxLabel (cdkObserveContent)=\"_onLabelTextChange()\">\n    <!-- Add an invisible span so JAWS can read the label -->\n    <span style=\"display:none\">&nbsp;</span>\n    <ng-content></ng-content>\n  </span>\n</label>\n", styles: ["@keyframes mat-checkbox-fade-in-background{0%{opacity:0}50%{opacity:1}}@keyframes mat-checkbox-fade-out-background{0%,50%{opacity:1}100%{opacity:0}}@keyframes mat-checkbox-unchecked-checked-checkmark-path{0%,50%{stroke-dashoffset:22.910259}50%{animation-timing-function:cubic-bezier(0, 0, 0.2, 0.1)}100%{stroke-dashoffset:0}}@keyframes mat-checkbox-unchecked-indeterminate-mixedmark{0%,68.2%{transform:scaleX(0)}68.2%{animation-timing-function:cubic-bezier(0, 0, 0, 1)}100%{transform:scaleX(1)}}@keyframes mat-checkbox-checked-unchecked-checkmark-path{from{animation-timing-function:cubic-bezier(0.4, 0, 1, 1);stroke-dashoffset:0}to{stroke-dashoffset:-22.910259}}@keyframes mat-checkbox-checked-indeterminate-checkmark{from{animation-timing-function:cubic-bezier(0, 0, 0.2, 0.1);opacity:1;transform:rotate(0deg)}to{opacity:0;transform:rotate(45deg)}}@keyframes mat-checkbox-indeterminate-checked-checkmark{from{animation-timing-function:cubic-bezier(0.14, 0, 0, 1);opacity:0;transform:rotate(45deg)}to{opacity:1;transform:rotate(360deg)}}@keyframes mat-checkbox-checked-indeterminate-mixedmark{from{animation-timing-function:cubic-bezier(0, 0, 0.2, 0.1);opacity:0;transform:rotate(-45deg)}to{opacity:1;transform:rotate(0deg)}}@keyframes mat-checkbox-indeterminate-checked-mixedmark{from{animation-timing-function:cubic-bezier(0.14, 0, 0, 1);opacity:1;transform:rotate(0deg)}to{opacity:0;transform:rotate(315deg)}}@keyframes mat-checkbox-indeterminate-unchecked-mixedmark{0%{animation-timing-function:linear;opacity:1;transform:scaleX(1)}32.8%,100%{opacity:0;transform:scaleX(0)}}.mat-checkbox-background,.mat-checkbox-frame{top:0;left:0;right:0;bottom:0;position:absolute;border-radius:2px;box-sizing:border-box;pointer-events:none}.mat-checkbox{display:inline-block;transition:background 400ms cubic-bezier(0.25, 0.8, 0.25, 1),box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1);cursor:pointer;-webkit-tap-highlight-color:transparent}._mat-animation-noopable.mat-checkbox{transition:none;animation:none}.mat-checkbox .mat-ripple-element:not(.mat-checkbox-persistent-ripple){opacity:.16}.mat-checkbox .mat-checkbox-ripple{position:absolute;left:calc(50% - 20px);top:calc(50% - 20px);height:40px;width:40px;z-index:1;pointer-events:none}.cdk-high-contrast-active .mat-checkbox.cdk-keyboard-focused .mat-checkbox-ripple{outline:solid 3px}.mat-checkbox-layout{-webkit-user-select:none;-moz-user-select:none;user-select:none;cursor:inherit;align-items:baseline;vertical-align:middle;display:inline-flex;white-space:nowrap}.mat-checkbox-label{-webkit-user-select:auto;-moz-user-select:auto;user-select:auto}.mat-checkbox-inner-container{display:inline-block;height:16px;line-height:0;margin:auto;margin-right:8px;order:0;position:relative;vertical-align:middle;white-space:nowrap;width:16px;flex-shrink:0}[dir=rtl] .mat-checkbox-inner-container{margin-left:8px;margin-right:auto}.mat-checkbox-inner-container-no-side-margin{margin-left:0;margin-right:0}.mat-checkbox-frame{background-color:transparent;transition:border-color 90ms cubic-bezier(0, 0, 0.2, 0.1);border-width:2px;border-style:solid}._mat-animation-noopable .mat-checkbox-frame{transition:none}.mat-checkbox-background{align-items:center;display:inline-flex;justify-content:center;transition:background-color 90ms cubic-bezier(0, 0, 0.2, 0.1),opacity 90ms cubic-bezier(0, 0, 0.2, 0.1);-webkit-print-color-adjust:exact;color-adjust:exact}._mat-animation-noopable .mat-checkbox-background{transition:none}.cdk-high-contrast-active .mat-checkbox .mat-checkbox-background{background:none}.mat-checkbox-persistent-ripple{display:block;width:100%;height:100%;transform:none}.mat-checkbox-inner-container:hover .mat-checkbox-persistent-ripple{opacity:.04}.mat-checkbox.cdk-keyboard-focused .mat-checkbox-persistent-ripple{opacity:.12}.mat-checkbox-persistent-ripple,.mat-checkbox.mat-checkbox-disabled .mat-checkbox-inner-container:hover .mat-checkbox-persistent-ripple{opacity:0}@media(hover: none){.mat-checkbox-inner-container:hover .mat-checkbox-persistent-ripple{display:none}}.mat-checkbox-checkmark{top:0;left:0;right:0;bottom:0;position:absolute;width:100%}.mat-checkbox-checkmark-path{stroke-dashoffset:22.910259;stroke-dasharray:22.910259;stroke-width:2.1333333333px}.cdk-high-contrast-black-on-white .mat-checkbox-checkmark-path{stroke:#000 !important}.mat-checkbox-mixedmark{width:calc(100% - 6px);height:2px;opacity:0;transform:scaleX(0) rotate(0deg);border-radius:2px}.cdk-high-contrast-active .mat-checkbox-mixedmark{height:0;border-top:solid 2px;margin-top:2px}.mat-checkbox-label-before .mat-checkbox-inner-container{order:1;margin-left:8px;margin-right:auto}[dir=rtl] .mat-checkbox-label-before .mat-checkbox-inner-container{margin-left:auto;margin-right:8px}.mat-checkbox-checked .mat-checkbox-checkmark{opacity:1}.mat-checkbox-checked .mat-checkbox-checkmark-path{stroke-dashoffset:0}.mat-checkbox-checked .mat-checkbox-mixedmark{transform:scaleX(1) rotate(-45deg)}.mat-checkbox-indeterminate .mat-checkbox-checkmark{opacity:0;transform:rotate(45deg)}.mat-checkbox-indeterminate .mat-checkbox-checkmark-path{stroke-dashoffset:0}.mat-checkbox-indeterminate .mat-checkbox-mixedmark{opacity:1;transform:scaleX(1) rotate(0deg)}.mat-checkbox-unchecked .mat-checkbox-background{background-color:transparent}.mat-checkbox-disabled{cursor:default}.cdk-high-contrast-active .mat-checkbox-disabled{opacity:.5}.mat-checkbox-anim-unchecked-checked .mat-checkbox-background{animation:180ms linear 0ms mat-checkbox-fade-in-background}.mat-checkbox-anim-unchecked-checked .mat-checkbox-checkmark-path{animation:180ms linear 0ms mat-checkbox-unchecked-checked-checkmark-path}.mat-checkbox-anim-unchecked-indeterminate .mat-checkbox-background{animation:180ms linear 0ms mat-checkbox-fade-in-background}.mat-checkbox-anim-unchecked-indeterminate .mat-checkbox-mixedmark{animation:90ms linear 0ms mat-checkbox-unchecked-indeterminate-mixedmark}.mat-checkbox-anim-checked-unchecked .mat-checkbox-background{animation:180ms linear 0ms mat-checkbox-fade-out-background}.mat-checkbox-anim-checked-unchecked .mat-checkbox-checkmark-path{animation:90ms linear 0ms mat-checkbox-checked-unchecked-checkmark-path}.mat-checkbox-anim-checked-indeterminate .mat-checkbox-checkmark{animation:90ms linear 0ms mat-checkbox-checked-indeterminate-checkmark}.mat-checkbox-anim-checked-indeterminate .mat-checkbox-mixedmark{animation:90ms linear 0ms mat-checkbox-checked-indeterminate-mixedmark}.mat-checkbox-anim-indeterminate-checked .mat-checkbox-checkmark{animation:500ms linear 0ms mat-checkbox-indeterminate-checked-checkmark}.mat-checkbox-anim-indeterminate-checked .mat-checkbox-mixedmark{animation:500ms linear 0ms mat-checkbox-indeterminate-checked-mixedmark}.mat-checkbox-anim-indeterminate-unchecked .mat-checkbox-background{animation:180ms linear 0ms mat-checkbox-fade-out-background}.mat-checkbox-anim-indeterminate-unchecked .mat-checkbox-mixedmark{animation:300ms linear 0ms mat-checkbox-indeterminate-unchecked-mixedmark}.mat-checkbox-input{bottom:0;left:50%}\n"], directives: [{ type: i2.MatRipple, selector: "[mat-ripple], [matRipple]", inputs: ["matRippleColor", "matRippleUnbounded", "matRippleCentered", "matRippleRadius", "matRippleAnimation", "matRippleDisabled", "matRippleTrigger"], exportAs: ["matRipple"] }, { type: i3.CdkObserveContent, selector: "[cdkObserveContent]", inputs: ["cdkObserveContentDisabled", "debounce"], outputs: ["cdkObserveContent"], exportAs: ["cdkObserveContent"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: MatCheckbox, decorators: [{
            type: Component,
            args: [{ selector: 'mat-checkbox', exportAs: 'matCheckbox', host: {
                        'class': 'mat-checkbox',
                        '[id]': 'id',
                        '[attr.tabindex]': 'null',
                        '[class.mat-checkbox-indeterminate]': 'indeterminate',
                        '[class.mat-checkbox-checked]': 'checked',
                        '[class.mat-checkbox-disabled]': 'disabled',
                        '[class.mat-checkbox-label-before]': 'labelPosition == "before"',
                        '[class._mat-animation-noopable]': `_animationMode === 'NoopAnimations'`,
                    }, providers: [MAT_CHECKBOX_CONTROL_VALUE_ACCESSOR], inputs: ['disableRipple', 'color', 'tabIndex'], encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, template: "<label [attr.for]=\"inputId\" class=\"mat-checkbox-layout\" #label>\n  <span class=\"mat-checkbox-inner-container\"\n       [class.mat-checkbox-inner-container-no-side-margin]=\"!checkboxLabel.textContent || !checkboxLabel.textContent.trim()\">\n    <input #input\n           class=\"mat-checkbox-input cdk-visually-hidden\" type=\"checkbox\"\n           [id]=\"inputId\"\n           [required]=\"required\"\n           [checked]=\"checked\"\n           [attr.value]=\"value\"\n           [disabled]=\"disabled\"\n           [attr.name]=\"name\"\n           [tabIndex]=\"tabIndex\"\n           [attr.aria-label]=\"ariaLabel || null\"\n           [attr.aria-labelledby]=\"ariaLabelledby\"\n           [attr.aria-checked]=\"_getAriaChecked()\"\n           [attr.aria-describedby]=\"ariaDescribedby\"\n           (change)=\"_onInteractionEvent($event)\"\n           (click)=\"_onInputClick($event)\">\n    <span matRipple class=\"mat-checkbox-ripple mat-focus-indicator\"\n         [matRippleTrigger]=\"label\"\n         [matRippleDisabled]=\"_isRippleDisabled()\"\n         [matRippleRadius]=\"20\"\n         [matRippleCentered]=\"true\"\n         [matRippleAnimation]=\"{enterDuration: _animationMode === 'NoopAnimations' ? 0 : 150}\">\n      <span class=\"mat-ripple-element mat-checkbox-persistent-ripple\"></span>\n    </span>\n    <span class=\"mat-checkbox-frame\"></span>\n    <span class=\"mat-checkbox-background\">\n      <svg version=\"1.1\"\n           focusable=\"false\"\n           class=\"mat-checkbox-checkmark\"\n           viewBox=\"0 0 24 24\"\n           xml:space=\"preserve\"\n           aria-hidden=\"true\">\n        <path class=\"mat-checkbox-checkmark-path\"\n              fill=\"none\"\n              stroke=\"white\"\n              d=\"M4.1,12.7 9,17.6 20.3,6.3\"/>\n      </svg>\n      <!-- Element for rendering the indeterminate state checkbox. -->\n      <span class=\"mat-checkbox-mixedmark\"></span>\n    </span>\n  </span>\n  <span class=\"mat-checkbox-label\" #checkboxLabel (cdkObserveContent)=\"_onLabelTextChange()\">\n    <!-- Add an invisible span so JAWS can read the label -->\n    <span style=\"display:none\">&nbsp;</span>\n    <ng-content></ng-content>\n  </span>\n</label>\n", styles: ["@keyframes mat-checkbox-fade-in-background{0%{opacity:0}50%{opacity:1}}@keyframes mat-checkbox-fade-out-background{0%,50%{opacity:1}100%{opacity:0}}@keyframes mat-checkbox-unchecked-checked-checkmark-path{0%,50%{stroke-dashoffset:22.910259}50%{animation-timing-function:cubic-bezier(0, 0, 0.2, 0.1)}100%{stroke-dashoffset:0}}@keyframes mat-checkbox-unchecked-indeterminate-mixedmark{0%,68.2%{transform:scaleX(0)}68.2%{animation-timing-function:cubic-bezier(0, 0, 0, 1)}100%{transform:scaleX(1)}}@keyframes mat-checkbox-checked-unchecked-checkmark-path{from{animation-timing-function:cubic-bezier(0.4, 0, 1, 1);stroke-dashoffset:0}to{stroke-dashoffset:-22.910259}}@keyframes mat-checkbox-checked-indeterminate-checkmark{from{animation-timing-function:cubic-bezier(0, 0, 0.2, 0.1);opacity:1;transform:rotate(0deg)}to{opacity:0;transform:rotate(45deg)}}@keyframes mat-checkbox-indeterminate-checked-checkmark{from{animation-timing-function:cubic-bezier(0.14, 0, 0, 1);opacity:0;transform:rotate(45deg)}to{opacity:1;transform:rotate(360deg)}}@keyframes mat-checkbox-checked-indeterminate-mixedmark{from{animation-timing-function:cubic-bezier(0, 0, 0.2, 0.1);opacity:0;transform:rotate(-45deg)}to{opacity:1;transform:rotate(0deg)}}@keyframes mat-checkbox-indeterminate-checked-mixedmark{from{animation-timing-function:cubic-bezier(0.14, 0, 0, 1);opacity:1;transform:rotate(0deg)}to{opacity:0;transform:rotate(315deg)}}@keyframes mat-checkbox-indeterminate-unchecked-mixedmark{0%{animation-timing-function:linear;opacity:1;transform:scaleX(1)}32.8%,100%{opacity:0;transform:scaleX(0)}}.mat-checkbox-background,.mat-checkbox-frame{top:0;left:0;right:0;bottom:0;position:absolute;border-radius:2px;box-sizing:border-box;pointer-events:none}.mat-checkbox{display:inline-block;transition:background 400ms cubic-bezier(0.25, 0.8, 0.25, 1),box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1);cursor:pointer;-webkit-tap-highlight-color:transparent}._mat-animation-noopable.mat-checkbox{transition:none;animation:none}.mat-checkbox .mat-ripple-element:not(.mat-checkbox-persistent-ripple){opacity:.16}.mat-checkbox .mat-checkbox-ripple{position:absolute;left:calc(50% - 20px);top:calc(50% - 20px);height:40px;width:40px;z-index:1;pointer-events:none}.cdk-high-contrast-active .mat-checkbox.cdk-keyboard-focused .mat-checkbox-ripple{outline:solid 3px}.mat-checkbox-layout{-webkit-user-select:none;-moz-user-select:none;user-select:none;cursor:inherit;align-items:baseline;vertical-align:middle;display:inline-flex;white-space:nowrap}.mat-checkbox-label{-webkit-user-select:auto;-moz-user-select:auto;user-select:auto}.mat-checkbox-inner-container{display:inline-block;height:16px;line-height:0;margin:auto;margin-right:8px;order:0;position:relative;vertical-align:middle;white-space:nowrap;width:16px;flex-shrink:0}[dir=rtl] .mat-checkbox-inner-container{margin-left:8px;margin-right:auto}.mat-checkbox-inner-container-no-side-margin{margin-left:0;margin-right:0}.mat-checkbox-frame{background-color:transparent;transition:border-color 90ms cubic-bezier(0, 0, 0.2, 0.1);border-width:2px;border-style:solid}._mat-animation-noopable .mat-checkbox-frame{transition:none}.mat-checkbox-background{align-items:center;display:inline-flex;justify-content:center;transition:background-color 90ms cubic-bezier(0, 0, 0.2, 0.1),opacity 90ms cubic-bezier(0, 0, 0.2, 0.1);-webkit-print-color-adjust:exact;color-adjust:exact}._mat-animation-noopable .mat-checkbox-background{transition:none}.cdk-high-contrast-active .mat-checkbox .mat-checkbox-background{background:none}.mat-checkbox-persistent-ripple{display:block;width:100%;height:100%;transform:none}.mat-checkbox-inner-container:hover .mat-checkbox-persistent-ripple{opacity:.04}.mat-checkbox.cdk-keyboard-focused .mat-checkbox-persistent-ripple{opacity:.12}.mat-checkbox-persistent-ripple,.mat-checkbox.mat-checkbox-disabled .mat-checkbox-inner-container:hover .mat-checkbox-persistent-ripple{opacity:0}@media(hover: none){.mat-checkbox-inner-container:hover .mat-checkbox-persistent-ripple{display:none}}.mat-checkbox-checkmark{top:0;left:0;right:0;bottom:0;position:absolute;width:100%}.mat-checkbox-checkmark-path{stroke-dashoffset:22.910259;stroke-dasharray:22.910259;stroke-width:2.1333333333px}.cdk-high-contrast-black-on-white .mat-checkbox-checkmark-path{stroke:#000 !important}.mat-checkbox-mixedmark{width:calc(100% - 6px);height:2px;opacity:0;transform:scaleX(0) rotate(0deg);border-radius:2px}.cdk-high-contrast-active .mat-checkbox-mixedmark{height:0;border-top:solid 2px;margin-top:2px}.mat-checkbox-label-before .mat-checkbox-inner-container{order:1;margin-left:8px;margin-right:auto}[dir=rtl] .mat-checkbox-label-before .mat-checkbox-inner-container{margin-left:auto;margin-right:8px}.mat-checkbox-checked .mat-checkbox-checkmark{opacity:1}.mat-checkbox-checked .mat-checkbox-checkmark-path{stroke-dashoffset:0}.mat-checkbox-checked .mat-checkbox-mixedmark{transform:scaleX(1) rotate(-45deg)}.mat-checkbox-indeterminate .mat-checkbox-checkmark{opacity:0;transform:rotate(45deg)}.mat-checkbox-indeterminate .mat-checkbox-checkmark-path{stroke-dashoffset:0}.mat-checkbox-indeterminate .mat-checkbox-mixedmark{opacity:1;transform:scaleX(1) rotate(0deg)}.mat-checkbox-unchecked .mat-checkbox-background{background-color:transparent}.mat-checkbox-disabled{cursor:default}.cdk-high-contrast-active .mat-checkbox-disabled{opacity:.5}.mat-checkbox-anim-unchecked-checked .mat-checkbox-background{animation:180ms linear 0ms mat-checkbox-fade-in-background}.mat-checkbox-anim-unchecked-checked .mat-checkbox-checkmark-path{animation:180ms linear 0ms mat-checkbox-unchecked-checked-checkmark-path}.mat-checkbox-anim-unchecked-indeterminate .mat-checkbox-background{animation:180ms linear 0ms mat-checkbox-fade-in-background}.mat-checkbox-anim-unchecked-indeterminate .mat-checkbox-mixedmark{animation:90ms linear 0ms mat-checkbox-unchecked-indeterminate-mixedmark}.mat-checkbox-anim-checked-unchecked .mat-checkbox-background{animation:180ms linear 0ms mat-checkbox-fade-out-background}.mat-checkbox-anim-checked-unchecked .mat-checkbox-checkmark-path{animation:90ms linear 0ms mat-checkbox-checked-unchecked-checkmark-path}.mat-checkbox-anim-checked-indeterminate .mat-checkbox-checkmark{animation:90ms linear 0ms mat-checkbox-checked-indeterminate-checkmark}.mat-checkbox-anim-checked-indeterminate .mat-checkbox-mixedmark{animation:90ms linear 0ms mat-checkbox-checked-indeterminate-mixedmark}.mat-checkbox-anim-indeterminate-checked .mat-checkbox-checkmark{animation:500ms linear 0ms mat-checkbox-indeterminate-checked-checkmark}.mat-checkbox-anim-indeterminate-checked .mat-checkbox-mixedmark{animation:500ms linear 0ms mat-checkbox-indeterminate-checked-mixedmark}.mat-checkbox-anim-indeterminate-unchecked .mat-checkbox-background{animation:180ms linear 0ms mat-checkbox-fade-out-background}.mat-checkbox-anim-indeterminate-unchecked .mat-checkbox-mixedmark{animation:300ms linear 0ms mat-checkbox-indeterminate-unchecked-mixedmark}.mat-checkbox-input{bottom:0;left:50%}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.ChangeDetectorRef }, { type: i1.FocusMonitor }, { type: i0.NgZone }, { type: undefined, decorators: [{
                    type: Attribute,
                    args: ['tabindex']
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [ANIMATION_MODULE_TYPE]
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [MAT_CHECKBOX_DEFAULT_OPTIONS]
                }] }]; }, propDecorators: { ariaLabel: [{
                type: Input,
                args: ['aria-label']
            }], ariaLabelledby: [{
                type: Input,
                args: ['aria-labelledby']
            }], ariaDescribedby: [{
                type: Input,
                args: ['aria-describedby']
            }], id: [{
                type: Input
            }], required: [{
                type: Input
            }], labelPosition: [{
                type: Input
            }], name: [{
                type: Input
            }], change: [{
                type: Output
            }], indeterminateChange: [{
                type: Output
            }], value: [{
                type: Input
            }], _inputElement: [{
                type: ViewChild,
                args: ['input']
            }], ripple: [{
                type: ViewChild,
                args: [MatRipple]
            }], checked: [{
                type: Input
            }], disabled: [{
                type: Input
            }], indeterminate: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hlY2tib3guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWF0ZXJpYWwvY2hlY2tib3gvY2hlY2tib3gudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWF0ZXJpYWwvY2hlY2tib3gvY2hlY2tib3guaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQWtCLFlBQVksRUFBYyxNQUFNLG1CQUFtQixDQUFDO0FBQzdFLE9BQU8sRUFBZSxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzFFLE9BQU8sRUFFTCxTQUFTLEVBQ1QsdUJBQXVCLEVBQ3ZCLGlCQUFpQixFQUNqQixTQUFTLEVBQ1QsVUFBVSxFQUNWLFlBQVksRUFDWixVQUFVLEVBQ1YsTUFBTSxFQUNOLEtBQUssRUFDTCxNQUFNLEVBRU4sUUFBUSxFQUNSLE1BQU0sRUFDTixTQUFTLEVBQ1QsaUJBQWlCLEdBRWxCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBdUIsaUJBQWlCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN2RSxPQUFPLEVBS0wsU0FBUyxFQUNULFVBQVUsRUFDVixhQUFhLEVBQ2Isa0JBQWtCLEVBQ2xCLGFBQWEsR0FDZCxNQUFNLHdCQUF3QixDQUFDO0FBQ2hDLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLHNDQUFzQyxDQUFDO0FBQzNFLE9BQU8sRUFDTCw0QkFBNEIsRUFFNUIsb0NBQW9DLEdBQ3JDLE1BQU0sbUJBQW1CLENBQUM7Ozs7O0FBRTNCLHdFQUF3RTtBQUN4RSxJQUFJLFlBQVksR0FBRyxDQUFDLENBQUM7QUFFckIsa0NBQWtDO0FBQ2xDLE1BQU0sUUFBUSxHQUFHLG9DQUFvQyxFQUFFLENBQUM7QUFFeEQ7Ozs7R0FJRztBQUNILE1BQU0sQ0FBQyxNQUFNLG1DQUFtQyxHQUFRO0lBQ3RELE9BQU8sRUFBRSxpQkFBaUI7SUFDMUIsV0FBVyxFQUFFLFVB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LEtBQUs7Z0JBR2EsTUFBTTtzQkFBeEIsTUFBTTtnQkFJWSxtQkFBbUI7c0JBQXJDLE1BQU07Z0JBR0UsS0FBSztzQkFBYixLQUFLO2dCQUdjLGFBQWE7c0JBQWhDLFNBQVM7dUJBQUMsT0FBTztnQkFHSSxNQUFNO3NCQUEzQixTQUFTO3VCQUFDLFNBQVM7Z0JBNERoQixPQUFPO3NCQURWLEtBQUs7Z0JBaUJPLFFBQVE7c0JBRHBCLEtBQUs7Z0JBcUJGLGFBQWE7c0JBRGhCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtGb2N1c2FibGVPcHRpb24sIEZvY3VzTW9uaXRvciwgRm9jdXNPcmlnaW59IGZyb20gJ0Bhbmd1bGFyL2Nkay9hMTF5JztcbmltcG9ydCB7Qm9vbGVhbklucHV0LCBjb2VyY2VCb29sZWFuUHJvcGVydHl9IGZyb20gJ0Bhbmd1bGFyL2Nkay9jb2VyY2lvbic7XG5pbXBvcnQge1xuICBBZnRlclZpZXdDaGVja2VkLFxuICBBdHRyaWJ1dGUsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIGZvcndhcmRSZWYsXG4gIEluamVjdCxcbiAgSW5wdXQsXG4gIE5nWm9uZSxcbiAgT25EZXN0cm95LFxuICBPcHRpb25hbCxcbiAgT3V0cHV0LFxuICBWaWV3Q2hpbGQsXG4gIFZpZXdFbmNhcHN1bGF0aW9uLFxuICBBZnRlclZpZXdJbml0LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Q29udHJvbFZhbHVlQWNjZXNzb3IsIE5HX1ZBTFVFX0FDQ0VTU09SfSBmcm9tICdAYW5ndWxhci9mb3Jtcyc7XG5pbXBvcnQge1xuICBDYW5Db2xvcixcbiAgQ2FuRGlzYWJsZSxcbiAgQ2FuRGlzYWJsZVJpcHBsZSxcbiAgSGFzVGFiSW5kZXgsXG4gIE1hdFJpcHBsZSxcbiAgbWl4aW5Db2xvcixcbiAgbWl4aW5EaXNhYmxlZCxcbiAgbWl4aW5EaXNhYmxlUmlwcGxlLFxuICBtaXhpblRhYkluZGV4LFxufSBmcm9tICdAYW5ndWxhci9tYXRlcmlhbC9jb3JlJztcbmltcG9ydCB7QU5JTUFUSU9OX01PRFVMRV9UWVBFfSBmcm9tICdAYW5ndWxhci9wbGF0Zm9ybS1icm93c2VyL2FuaW1hdGlvbnMnO1xuaW1wb3J0IHtcbiAgTUFUX0NIRUNLQk9YX0RFRkFVTFRfT1BUSU9OUyxcbiAgTWF0Q2hlY2tib3hEZWZhdWx0T3B0aW9ucyxcbiAgTUFUX0NIRUNLQk9YX0RFRkFVTFRfT1BUSU9OU19GQUNUT1JZLFxufSBmcm9tICcuL2NoZWNrYm94LWNvbmZpZyc7XG5cbi8vIEluY3JlYXNpbmcgaW50ZWdlciBmb3IgZ2VuZXJhdGluZyB1bmlxdWUgaWRzIGZvciBjaGVja2JveCBjb21wb25lbnRzLlxubGV0IG5leHRVbmlxdWVJZCA9IDA7XG5cbi8vIERlZmF1bHQgY2hlY2tib3ggY29uZmlndXJhdGlvbi5cbmNvbnN0IGRlZmF1bHRzID0gTUFUX0NIRUNLQk9YX0RFRkFVTFRfT1BUSU9OU19GQUNUT1JZKCk7XG5cbi8qKlxuICogUHJvdmlkZXIgRXhwcmVzc2lvbiB0aGF0IGFsbG93cyBtYXQtY2hlY2tib3ggdG8gcmVnaXN0ZXIgYXMgYSBDb250cm9sVmFsdWVBY2Nlc3Nvci5cbiAqIFRoaXMgYWxsb3dzIGl0IHRvIHN1cHBvcnQgWyhuZ01vZGVsKV0uXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBjb25zdCBNQVRfQ0hFQ0tCT1hfQ09OVFJPTF9WQUxVRV9BQ0NFU1NPUjogYW55ID0ge1xuICBwcm92aWRlOiBOR19WQUxVRV9BQ0NFU1NPUixcbiAgdXNlRXhpc3Rpbmc6IGZvcndhcmRSZWYoKCkgPT4gTWF0Q2hlY2tib3gpLFxuICBtdWx0aTogdHJ1ZSxcbn07XG5cbi8qKlxuICogUmVwcmVzZW50cyB0aGUgZGlmZmVyZW50IHN0YXRlcyB0aGF0IHJlcXVpcmUgY3VzdG9tIHRyYW5zaXRpb25zIGJldHdlZW4gdGhlbS5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gVHJhbnNpdGlvbkNoZWNrU3RhdGUge1xuICAvKiogVGhlIGluaXRpYWwgc3RhdGUgb2YgdGhlIGNvbXBvbmVudCBiZWZvcmUgYW55IHVzZXIgaW50ZXJhY3Rpb24uICovXG4gIEluaXQsXG4gIC8qKiBUaGUgc3RhdGUgcmVwcmVzZW50aW5nIHRoZSBjb21wb25lbnQgd2hlbiBpdCdzIGJlY29taW5nIGNoZWNrZWQuICovXG4gIENoZWNrZWQsXG4gIC8qKiBUaGUgc3RhdGUgcmVwcmVzZW50aW5nIHRoZSBjb21wb25lbnQgd2hlbiBpdCdzIGJlY29taW5nIHVuY2hlY2tlZC4gKi9cbiAgVW5jaGVja2VkLFxuICAvKiogVGhlIHN0YXRlIHJlcHJlc2VudGluZyB0aGUgY29tcG9uZW50IHdoZW4gaXQncyBiZWNvbWluZyBpbmRldGVybWluYXRlLiAqL1xuICBJbmRldGVybWluYXRlLFxufVxuXG4vKiogQ2hhbmdlIGV2ZW50IG9iamVjdCBlbWl0dGVkIGJ5IE1hdENoZWNrYm94LiAqL1xuZXhwb3J0IGNsYXNzIE1hdENoZWNrYm94Q2hhbmdlIHtcbiAgLyoqIFRoZSBzb3VyY2UgTWF0Q2hlY2tib3ggb2YgdGhlIGV2ZW50LiAqL1xuICBzb3VyY2U6IE1hdENoZWNrYm94O1xuICAvKiogVGhlIG5ldyBgY2hlY2tlZGAgdmFsdWUgb2YgdGhlIGNoZWNrYm94LiAqL1xuICBjaGVja2VkOiBib29sZWFuO1xufVxuXG4vLyBCb2lsZXJwbGF0ZSBmb3IgYXBwbHlpbmcgbWl4aW5zIHRvIE1hdENoZWNrYm94LlxuLyoqIEBkb2NzLXByaXZhdGUgKi9cbmNvbnN0IF9NYXRDaGVja2JveEJhc2UgPSBtaXhpblRhYkluZGV4KFxuICBtaXhpbkNvbG9yKFxuICAgIG1peGluRGlzYWJsZVJpcHBsZShcbiAgICAgIG1peGluRGlzYWJsZWQoXG4gICAgICAgIGNsYXNzIHtcbiAgICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgX2VsZW1lbnRSZWY6IEVsZW1lbnRSZWYpIHt9XG4gICAgICAgIH0sXG4gICAgICApLFxuICAgICksXG4gICksXG4pO1xuXG4vKipcbiAqIEEgbWF0ZXJpYWwgZGVzaWduIGNoZWNrYm94IGNvbXBvbmVudC4gU3VwcG9ydHMgYWxsIG9mIHRoZSBmdW5jdGlvbmFsaXR5IG9mIGFuIEhUTUw1IGNoZWNrYm94LFxuICogYW5kIGV4cG9zZXMgYSBzaW1pbGFyIEFQSS4gQSBNYXRDaGVja2JveCBjYW4gYmUgZWl0aGVyIGNoZWNrZWQsIHVuY2hlY2tlZCwgaW5kZXRlcm1pbmF0ZSwgb3JcbiAqIGRpc2FibGVkLiBOb3RlIHRoYXQgYWxsIGFkZGl0aW9uYWwgYWNjZXNzaWJpbGl0eSBhdHRyaWJ1dGVzIGFyZSB0YWtlbiBjYXJlIG9mIGJ5IHRoZSBjb21wb25lbnQsXG4gKiBzbyB0aGVyZSBpcyBubyBuZWVkIHRvIHByb3ZpZGUgdGhlbSB5b3Vyc2VsZi4gSG93ZXZlciwgaWYgeW91IHdhbnQgdG8gb21pdCBhIGxhYmVsIGFuZCBzdGlsbFxuICogaGF2ZSB0aGUgY2hlY2tib3ggYmUgYWNjZXNzaWJsZSwgeW91IG1heSBzdXBwbHkgYW4gW2FyaWEtbGFiZWxdIGlucHV0LlxuICogU2VlOiBodHRwczovL21hdGVyaWFsLmlvL2Rlc2lnbi9jb21wb25lbnRzL3NlbGVjdGlvbi1jb250cm9scy5odG1sXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ21hdC1jaGVja2JveCcsXG4gIHRlbXBsYXRlVXJsOiAnY2hlY2tib3guaHRtbCcsXG4gIHN0eWxlVXJsczogWydjaGVja2JveC5jc3MnXSxcbiAgZXhwb3J0QXM6ICdtYXRDaGVja2JveCcsXG4gIGhvc3Q6IHtcbiAgICAnY2xhc3MnOiAnbWF0LWNoZWNrYm94JyxcbiAgICAnW2lkXSc6ICdpZCcsXG4gICAgJ1thdHRyLnRhYmluZGV4XSc6ICdudWxsJyxcbiAgICAnW2NsYXNzLm1hdC1jaGVja2JveC1pbmRldGVybWluYXRlXSc6ICdpbmRldGVybWluYXRlJyxcbiAgICAnW2NsYXNzLm1hdC1jaGVja2JveC1jaGVja2VkXSc6ICdjaGVja2VkJyxcbiAgICAnW2NsYXNzLm1hdC1jaGVja2JveC1kaXNhYmxlZF0nOiAnZGlzYWJsZWQnLFxuICAgICdbY2xhc3MubWF0LWNoZWNrYm94LWxhYmVsLWJlZm9yZV0nOiAnbGFiZWxQb3NpdGlvbiA9PSBcImJlZm9yZVwiJyxcbiAgICAnW2NsYXNzLl9tYXQtYW5pbWF0aW9uLW5vb3BhYmxlXSc6IGBfYW5pbWF0aW9uTW9kZSA9PT0gJ05vb3BBbmltYXRpb25zJ2AsXG4gIH0sXG4gIHByb3ZpZGVyczogW01BVF9DSEVDS0JPWF9DT05UUk9MX1ZBTFVFX0FDQ0VTU09SXSxcbiAgaW5wdXRzOiBbJ2Rpc2FibGVSaXBwbGUnLCAnY29sb3InLCAndGFiSW5kZXgnXSxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIE1hdENoZWNrYm94XG4gIGV4dGVuZHMgX01hdENoZWNrYm94QmFzZVxuICBpbXBsZW1lbnRzXG4gICAgQ29udHJvbFZhbHVlQWNjZXNzb3IsXG4gICAgQWZ0ZXJWaWV3SW5pdCxcbiAgICBBZnRlclZpZXdDaGVja2VkLFxuICAgIE9uRGVzdHJveSxcbiAgICBDYW5Db2xvcixcbiAgICBDYW5EaXNhYmxlLFxuICAgIEhhc1RhYkluZGV4LFxuICAgIENhbkRpc2FibGVSaXBwbGUsXG4gICAgRm9jdXNhYmxlT3B0aW9uXG57XG4gIC8qKlxuICAgKiBBdHRhY2hlZCB0byB0aGUgYXJpYS1sYWJlbCBhdHRyaWJ1dGUgb2YgdGhlIGhvc3QgZWxlbWVudC4gSW4gbW9zdCBjYXNlcywgYXJpYS1sYWJlbGxlZGJ5IHdpbGxcbiAgICogdGFrZSBwcmVjZWRlbmNlIHNvIHRoaXMgbWF5IGJlIG9taXR0ZWQuXG4gICAqL1xuICBASW5wdXQoJ2FyaWEtbGFiZWwnKSBhcmlhTGFiZWw6IHN0cmluZyA9ICcnO1xuXG4gIC8qKlxuICAgKiBVc2VycyBjYW4gc3BlY2lmeSB0aGUgYGFyaWEtbGFiZWxsZWRieWAgYXR0cmlidXRlIHdoaWNoIHdpbGwgYmUgZm9yd2FyZGVkIHRvIHRoZSBpbnB1dCBlbGVtZW50XG4gICAqL1xuICBASW5wdXQoJ2FyaWEtbGFiZWxsZWRieScpIGFyaWFMYWJlbGxlZGJ5OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICAvKiogVGhlICdhcmlhLWRlc2NyaWJlZGJ5JyBhdHRyaWJ1dGUgaXMgcmVhZCBhZnRlciB0aGUgZWxlbWVudCdzIGxhYmVsIGFuZCBmaWVsZCB0eXBlLiAqL1xuICBASW5wdXQoJ2FyaWEtZGVzY3JpYmVkYnknKSBhcmlhRGVzY3JpYmVkYnk6IHN0cmluZztcblxuICBwcml2YXRlIF91bmlxdWVJZDogc3RyaW5nID0gYG1hdC1jaGVja2JveC0keysrbmV4dFVuaXF1ZUlkfWA7XG5cbiAgLyoqIEEgdW5pcXVlIGlkIGZvciB0aGUgY2hlY2tib3ggaW5wdXQuIElmIG5vbmUgaXMgc3VwcGxpZWQsIGl0IHdpbGwgYmUgYXV0by1nZW5lcmF0ZWQuICovXG4gIEBJbnB1dCgpIGlkOiBzdHJpbmcgPSB0aGlzLl91bmlxdWVJZDtcblxuICAvKiogUmV0dXJucyB0aGUgdW5pcXVlIGlkIGZvciB0aGUgdmlzdWFsIGhpZGRlbiBpbnB1dC4gKi9cbiAgZ2V0IGlucHV0SWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7dGhpcy5pZCB8fCB0aGlzLl91bmlxdWVJZH0taW5wdXRgO1xuICB9XG5cbiAgLyoqIFdoZXRoZXIgdGhlIGNoZWNrYm94IGlzIHJlcXVpcmVkLiAqL1xuICBASW5wdXQoKVxuICBnZXQgcmVxdWlyZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX3JlcXVpcmVkO1xuICB9XG4gIHNldCByZXF1aXJlZCh2YWx1ZTogQm9vbGVhbklucHV0KSB7XG4gICAgdGhpcy5fcmVxdWlyZWQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIHByaXZhdGUgX3JlcXVpcmVkOiBib29sZWFuO1xuXG4gIC8qKiBXaGV0aGVyIHRoZSBsYWJlbCBzaG91bGQgYXBwZWFyIGFmdGVyIG9yIGJlZm9yZSB0aGUgY2hlY2tib3guIERlZmF1bHRzIHRvICdhZnRlcicgKi9cbiAgQElucHV0KCkgbGFiZWxQb3NpdGlvbjogJ2JlZm9yZScgfCAnYWZ0ZXInID0gJ2FmdGVyJztcblxuICAvKiogTmFtZSB2YWx1ZSB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGlucHV0IGVsZW1lbnQgaWYgcHJlc2VudCAqL1xuICBASW5wdXQoKSBuYW1lOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICAvKiogRXZlbnQgZW1pdHRlZCB3aGVuIHRoZSBjaGVja2JveCdzIGBjaGVja2VkYCB2YWx1ZSBjaGFuZ2VzLiAqL1xuICBAT3V0cHV0KCkgcmVhZG9ubHkgY2hhbmdlOiBFdmVudEVtaXR0ZXI8TWF0Q2hlY2tib3hDaGFuZ2U+ID1cbiAgICBuZXcgRXZlbnRFbWl0dGVyPE1hdENoZWNrYm94Q2hhbmdlPigpO1xuXG4gIC8qKiBFdmVudCBlbWl0dGVkIHdoZW4gdGhlIGNoZWNrYm94J3MgYGluZGV0ZXJtaW5hdGVgIHZhbHVlIGNoYW5nZXMuICovXG4gIEBPdXRwdXQoKSByZWFkb25seSBpbmRldGVybWluYXRlQ2hhbmdlOiBFdmVudEVtaXR0ZXI8Ym9vbGVhbj4gPSBuZXcgRXZlbnRFbWl0dGVyPGJvb2xlYW4+KCk7XG5cbiAgLyoqIFRoZSB2YWx1ZSBhdHRyaWJ1dGUgb2YgdGhlIG5hdGl2ZSBpbnB1dCBlbGVtZW50ICovXG4gIEBJbnB1dCgpIHZhbHVlOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBuYXRpdmUgYDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIj5gIGVsZW1lbnQgKi9cbiAgQFZpZXdDaGlsZCgnaW5wdXQnKSBfaW5wdXRFbGVtZW50OiBFbGVtZW50UmVmPEhUTUxJbnB1dEVsZW1lbnQ+O1xuXG4gIC8qKiBSZWZlcmVuY2UgdG8gdGhlIHJpcHBsZSBpbnN0YW5jZSBvZiB0aGUgY2hlY2tib3guICovXG4gIEBWaWV3Q2hpbGQoTWF0UmlwcGxlKSByaXBwbGU6IE1hdFJpcHBsZTtcblxuICAvKipcbiAgICogQ2FsbGVkIHdoZW4gdGhlIGNoZWNrYm94IGlzIGJsdXJyZWQuIE5lZWRlZCB0byBwcm9wZXJseSBpbXBsZW1lbnQgQ29udHJvbFZhbHVlQWNjZXNzb3IuXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICovXG4gIF9vblRvdWNoZWQ6ICgpID0+IGFueSA9ICgpID0+IHt9O1xuXG4gIHByaXZhdGUgX2N1cnJlbnRBbmltYXRpb25DbGFzczogc3RyaW5nID0gJyc7XG5cbiAgcHJpdmF0ZSBfY3VycmVudENoZWNrU3RhdGU6IFRyYW5zaXRpb25DaGVja1N0YXRlID0gVHJhbnNpdGlvbkNoZWNrU3RhdGUuSW5pdDtcblxuICBwcml2YXRlIF9jb250cm9sVmFsdWVBY2Nlc3NvckNoYW5nZUZuOiAodmFsdWU6IGFueSkgPT4gdm9pZCA9ICgpID0+IHt9O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxuICAgIHByaXZhdGUgX2NoYW5nZURldGVjdG9yUmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBwcml2YXRlIF9mb2N1c01vbml0b3I6IEZvY3VzTW9uaXRvcixcbiAgICBwcml2YXRlIF9uZ1pvbmU6IE5nWm9uZSxcbiAgICBAQXR0cmlidXRlKCd0YWJpbmRleCcpIHRhYkluZGV4OiBzdHJpbmcsXG4gICAgQE9wdGlvbmFsKCkgQEluamVjdChBTklNQVRJT05fTU9EVUxFX1RZUEUpIHB1YmxpYyBfYW5pbWF0aW9uTW9kZT86IHN0cmluZyxcbiAgICBAT3B0aW9uYWwoKVxuICAgIEBJbmplY3QoTUFUX0NIRUNLQk9YX0RFRkFVTFRfT1BUSU9OUylcbiAgICBwcml2YXRlIF9vcHRpb25zPzogTWF0Q2hlY2tib3hEZWZhdWx0T3B0aW9ucyxcbiAgKSB7XG4gICAgc3VwZXIoZWxlbWVudFJlZik7XG4gICAgdGhpcy5fb3B0aW9ucyA9IHRoaXMuX29wdGlvbnMgfHwgZGVmYXVsdHM7XG4gICAgdGhpcy5jb2xvciA9IHRoaXMuZGVmYXVsdENvbG9yID0gdGhpcy5fb3B0aW9ucy5jb2xvciB8fCBkZWZhdWx0cy5jb2xvcjtcbiAgICB0aGlzLnRhYkluZGV4ID0gcGFyc2VJbnQodGFiSW5kZXgpIHx8IDA7XG4gIH1cblxuICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgdGhpcy5fZm9jdXNNb25pdG9yLm1vbml0b3IodGhpcy5fZWxlbWVudFJlZiwgdHJ1ZSkuc3Vic2NyaWJlKGZvY3VzT3JpZ2luID0+IHtcbiAgICAgIGlmICghZm9jdXNPcmlnaW4pIHtcbiAgICAgICAgLy8gV2hlbiBhIGZvY3VzZWQgZWxlbWVudCBiZWNvbWVzIGRpc2FibGVkLCB0aGUgYnJvd3NlciAqaW1tZWRpYXRlbHkqIGZpcmVzIGEgYmx1ciBldmVudC5cbiAgICAgICAgLy8gQW5ndWxhciBkb2VzIG5vdCBleHBlY3QgZXZlbnRzIHRvIGJlIHJhaXNlZCBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiwgc28gYW55IHN0YXRlIGNoYW5nZVxuICAgICAgICAvLyAoc3VjaCBhcyBhIGZvcm0gY29udHJvbCdzICduZy10b3VjaGVkJykgd2lsbCBjYXVzZSBhIGNoYW5nZWQtYWZ0ZXItY2hlY2tlZCBlcnJvci5cbiAgICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvaXNzdWVzLzE3NzkzLiBUbyB3b3JrIGFyb3VuZCB0aGlzLCB3ZSBkZWZlclxuICAgICAgICAvLyB0ZWxsaW5nIHRoZSBmb3JtIGNvbnRyb2wgaXQgaGFzIGJlZW4gdG91Y2hlZCB1bnRpbCB0aGUgbmV4dCB0aWNrLlxuICAgICAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICB0aGlzLl9vblRvdWNoZWQoKTtcbiAgICAgICAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLl9zeW5jSW5kZXRlcm1pbmF0ZSh0aGlzLl9pbmRldGVybWluYXRlKTtcbiAgfVxuXG4gIC8vIFRPRE86IERlbGV0ZSBuZXh0IG1ham9yIHJldmlzaW9uLlxuICBuZ0FmdGVyVmlld0NoZWNrZWQoKSB7fVxuXG4gIG5nT25EZXN0cm95KCkge1xuICAgIHRoaXMuX2ZvY3VzTW9uaXRvci5zdG9wTW9uaXRvcmluZyh0aGlzLl9lbGVtZW50UmVmKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBjaGVja2JveCBpcyBjaGVja2VkLlxuICAgKi9cbiAgQElucHV0KClcbiAgZ2V0IGNoZWNrZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2NoZWNrZWQ7XG4gIH1cbiAgc2V0IGNoZWNrZWQodmFsdWU6IGJvb2xlYW4pIHtcbiAgICBpZiAodmFsdWUgIT0gdGhpcy5jaGVja2VkKSB7XG4gICAgICB0aGlzLl9jaGVja2VkID0gdmFsdWU7XG4gICAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgICB9XG4gIH1cbiAgcHJpdmF0ZSBfY2hlY2tlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBjaGVja2JveCBpcyBkaXNhYmxlZC4gVGhpcyBmdWxseSBvdmVycmlkZXMgdGhlIGltcGxlbWVudGF0aW9uIHByb3ZpZGVkIGJ5XG4gICAqIG1peGluRGlzYWJsZWQsIGJ1dCB0aGUgbWl4aW4gaXMgc3RpbGwgcmVxdWlyZWQgYmVjYXVzZSBtaXhpblRhYkluZGV4IHJlcXVpcmVzIGl0LlxuICAgKi9cbiAgQElucHV0KClcbiAgb3ZlcnJpZGUgZ2V0IGRpc2FibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9kaXNhYmxlZDtcbiAgfVxuICBvdmVycmlkZSBzZXQgZGlzYWJsZWQodmFsdWU6IEJvb2xlYW5JbnB1dCkge1xuICAgIGNvbnN0IG5ld1ZhbHVlID0gY29lcmNlQm9vbGVhblByb3BlcnR5KHZhbHVlKTtcblxuICAgIGlmIChuZXdWYWx1ZSAhPT0gdGhpcy5kaXNhYmxlZCkge1xuICAgICAgdGhpcy5fZGlzYWJsZWQgPSBuZXdWYWx1ZTtcbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIF9kaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRoZSBjaGVja2JveCBpcyBpbmRldGVybWluYXRlLiBUaGlzIGlzIGFsc28ga25vd24gYXMgXCJtaXhlZFwiIG1vZGUgYW5kIGNhbiBiZSB1c2VkIHRvXG4gICAqIHJlcHJlc2VudCBhIGNoZWNrYm94IHdpdGggdGhyZWUgc3RhdGVzLCBlLmcuIGEgY2hlY2tib3ggdGhhdCByZXByZXNlbnRzIGEgbmVzdGVkIGxpc3Qgb2ZcbiAgICogY2hlY2thYmxlIGl0ZW1zLiBOb3RlIHRoYXQgd2hlbmV2ZXIgY2hlY2tib3ggaXMgbWFudWFsbHkgY2xpY2tlZCwgaW5kZXRlcm1pbmF0ZSBpcyBpbW1lZGlhdGVseVxuICAgKiBzZXQgdG8gZmFsc2UuXG4gICAqL1xuICBASW5wdXQoKVxuICBnZXQgaW5kZXRlcm1pbmF0ZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5faW5kZXRlcm1pbmF0ZTtcbiAgfVxuICBzZXQgaW5kZXRlcm1pbmF0ZSh2YWx1ZTogQm9vbGVhbklucHV0KSB7XG4gICAgY29uc3QgY2hhbmdlZCA9IHZhbHVlICE9IHRoaXMuX2luZGV0ZXJtaW5hdGU7XG4gICAgdGhpcy5faW5kZXRlcm1pbmF0ZSA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG5cbiAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgaWYgKHRoaXMuX2luZGV0ZXJtaW5hdGUpIHtcbiAgICAgICAgdGhpcy5fdHJhbnNpdGlvbkNoZWNrU3RhdGUoVHJhbnNpdGlvbkNoZWNrU3RhdGUuSW5kZXRlcm1pbmF0ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl90cmFuc2l0aW9uQ2hlY2tTdGF0ZShcbiAgICAgICAgICB0aGlzLmNoZWNrZWQgPyBUcmFuc2l0aW9uQ2hlY2tTdGF0ZS5DaGVja2VkIDogVHJhbnNpdGlvbkNoZWNrU3RhdGUuVW5jaGVja2VkLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgdGhpcy5pbmRldGVybWluYXRlQ2hhbmdlLmVtaXQodGhpcy5faW5kZXRlcm1pbmF0ZSk7XG4gICAgfVxuXG4gICAgdGhpcy5fc3luY0luZGV0ZXJtaW5hdGUodGhpcy5faW5kZXRlcm1pbmF0ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfaW5kZXRlcm1pbmF0ZTogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIF9pc1JpcHBsZURpc2FibGVkKCkge1xuICAgIHJldHVybiB0aGlzLmRpc2FibGVSaXBwbGUgfHwgdGhpcy5kaXNhYmxlZDtcbiAgfVxuXG4gIC8qKiBNZXRob2QgYmVpbmcgY2FsbGVkIHdoZW5ldmVyIHRoZSBsYWJlbCB0ZXh0IGNoYW5nZXMuICovXG4gIF9vbkxhYmVsVGV4dENoYW5nZSgpIHtcbiAgICAvLyBTaW5jZSB0aGUgZXZlbnQgb2YgdGhlIGBjZGtPYnNlcnZlQ29udGVudGAgZGlyZWN0aXZlIHJ1bnMgb3V0c2lkZSBvZiB0aGUgem9uZSwgdGhlIGNoZWNrYm94XG4gICAgLy8gY29tcG9uZW50IHdpbGwgYmUgb25seSBtYXJrZWQgZm9yIGNoZWNrLCBidXQgbm8gYWN0dWFsIGNoYW5nZSBkZXRlY3Rpb24gcnVucyBhdXRvbWF0aWNhbGx5LlxuICAgIC8vIEluc3RlYWQgb2YgZ29pbmcgYmFjayBpbnRvIHRoZSB6b25lIGluIG9yZGVyIHRvIHRyaWdnZXIgYSBjaGFuZ2UgZGV0ZWN0aW9uIHdoaWNoIGNhdXNlc1xuICAgIC8vICphbGwqIGNvbXBvbmVudHMgdG8gYmUgY2hlY2tlZCAoaWYgZXhwbGljaXRseSBtYXJrZWQgb3Igbm90IHVzaW5nIE9uUHVzaCksIHdlIG9ubHkgdHJpZ2dlclxuICAgIC8vIGFuIGV4cGxpY2l0IGNoYW5nZSBkZXRlY3Rpb24gZm9yIHRoZSBjaGVja2JveCB2aWV3IGFuZCBpdHMgY2hpbGRyZW4uXG4gICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG5cbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiBDb250cm9sVmFsdWVBY2Nlc3Nvci5cbiAgd3JpdGVWYWx1ZSh2YWx1ZTogYW55KSB7XG4gICAgdGhpcy5jaGVja2VkID0gISF2YWx1ZTtcbiAgfVxuXG4gIC8vIEltcGxlbWVudGVkIGFzIHBhcnQgb2YgQ29udHJvbFZhbHVlQWNjZXNzb3IuXG4gIHJlZ2lzdGVyT25DaGFuZ2UoZm46ICh2YWx1ZTogYW55KSA9PiB2b2lkKSB7XG4gICAgdGhpcy5fY29udHJvbFZhbHVlQWNjZXNzb3JDaGFuZ2VGbiA9IGZuO1xuICB9XG5cbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiBDb250cm9sVmFsdWVBY2Nlc3Nvci5cbiAgcmVnaXN0ZXJPblRvdWNoZWQoZm46IGFueSkge1xuICAgIHRoaXMuX29uVG91Y2hlZCA9IGZuO1xuICB9XG5cbiAgLy8gSW1wbGVtZW50ZWQgYXMgcGFydCBvZiBDb250cm9sVmFsdWVBY2Nlc3Nvci5cbiAgc2V0RGlzYWJsZWRTdGF0ZShpc0Rpc2FibGVkOiBib29sZWFuKSB7XG4gICAgdGhpcy5kaXNhYmxlZCA9IGlzRGlzYWJsZWQ7XG4gIH1cblxuICBfZ2V0QXJpYUNoZWNrZWQoKTogJ3RydWUnIHwgJ2ZhbHNlJyB8ICdtaXhlZCcge1xuICAgIGlmICh0aGlzLmNoZWNrZWQpIHtcbiAgICAgIHJldHVybiAndHJ1ZSc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuaW5kZXRlcm1pbmF0ZSA/ICdtaXhlZCcgOiAnZmFsc2UnO1xuICB9XG5cbiAgcHJpdmF0ZSBfdHJhbnNpdGlvbkNoZWNrU3RhdGUobmV3U3RhdGU6IFRyYW5zaXRpb25DaGVja1N0YXRlKSB7XG4gICAgbGV0IG9sZFN0YXRlID0gdGhpcy5fY3VycmVudENoZWNrU3RhdGU7XG4gICAgbGV0IGVsZW1lbnQ6IEhUTUxFbGVtZW50ID0gdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuXG4gICAgaWYgKG9sZFN0YXRlID09PSBuZXdTdGF0ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5fY3VycmVudEFuaW1hdGlvbkNsYXNzLmxlbmd0aCA+IDApIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSh0aGlzLl9jdXJyZW50QW5pbWF0aW9uQ2xhc3MpO1xuICAgIH1cblxuICAgIHRoaXMuX2N1cnJlbnRBbmltYXRpb25DbGFzcyA9IHRoaXMuX2dldEFuaW1hdGlvbkNsYXNzRm9yQ2hlY2tTdGF0ZVRyYW5zaXRpb24oXG4gICAgICBvbGRTdGF0ZSxcbiAgICAgIG5ld1N0YXRlLFxuICAgICk7XG4gICAgdGhpcy5fY3VycmVudENoZWNrU3RhdGUgPSBuZXdTdGF0ZTtcblxuICAgIGlmICh0aGlzLl9jdXJyZW50QW5pbWF0aW9uQ2xhc3MubGVuZ3RoID4gMCkge1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKHRoaXMuX2N1cnJlbnRBbmltYXRpb25DbGFzcyk7XG5cbiAgICAgIC8vIFJlbW92ZSB0aGUgYW5pbWF0aW9uIGNsYXNzIHRvIGF2b2lkIGFuaW1hdGlvbiB3aGVuIHRoZSBjaGVja2JveCBpcyBtb3ZlZCBiZXR3ZWVuIGNvbnRhaW5lcnNcbiAgICAgIGNvbnN0IGFuaW1hdGlvbkNsYXNzID0gdGhpcy5fY3VycmVudEFuaW1hdGlvbkNsYXNzO1xuXG4gICAgICB0aGlzLl9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoYW5pbWF0aW9uQ2xhc3MpO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX2VtaXRDaGFuZ2VFdmVudCgpIHtcbiAgICBjb25zdCBldmVudCA9IG5ldyBNYXRDaGVja2JveENoYW5nZSgpO1xuICAgIGV2ZW50LnNvdXJjZSA9IHRoaXM7XG4gICAgZXZlbnQuY2hlY2tlZCA9IHRoaXMuY2hlY2tlZDtcblxuICAgIHRoaXMuX2NvbnRyb2xWYWx1ZUFjY2Vzc29yQ2hhbmdlRm4odGhpcy5jaGVja2VkKTtcbiAgICB0aGlzLmNoYW5nZS5lbWl0KGV2ZW50KTtcblxuICAgIC8vIEFzc2lnbmluZyB0aGUgdmFsdWUgYWdhaW4gaGVyZSBpcyByZWR1bmRhbnQsIGJ1dCB3ZSBoYXZlIHRvIGRvIGl0IGluIGNhc2UgaXQgd2FzXG4gICAgLy8gY2hhbmdlZCBpbnNpZGUgdGhlIGBjaGFuZ2VgIGxpc3RlbmVyIHdoaWNoIHdpbGwgY2F1c2UgdGhlIGlucHV0IHRvIGJlIG91dCBvZiBzeW5jLlxuICAgIGlmICh0aGlzLl9pbnB1dEVsZW1lbnQpIHtcbiAgICAgIHRoaXMuX2lucHV0RWxlbWVudC5uYXRpdmVFbGVtZW50LmNoZWNrZWQgPSB0aGlzLmNoZWNrZWQ7XG4gICAgfVxuICB9XG5cbiAgLyoqIFRvZ2dsZXMgdGhlIGBjaGVja2VkYCBzdGF0ZSBvZiB0aGUgY2hlY2tib3guICovXG4gIHRvZ2dsZSgpOiB2b2lkIHtcbiAgICB0aGlzLmNoZWNrZWQgPSAhdGhpcy5jaGVja2VkO1xuICB9XG5cbiAgLyoqXG4gICAqIEV2ZW50IGhhbmRsZXIgZm9yIGNoZWNrYm94IGlucHV0IGVsZW1lbnQuXG4gICAqIFRvZ2dsZXMgY2hlY2tlZCBzdGF0ZSBpZiBlbGVtZW50IGlzIG5vdCBkaXNhYmxlZC5cbiAgICogRG8gbm90IHRvZ2dsZSBvbiAoY2hhbmdlKSBldmVudCBzaW5jZSBJRSBkb2Vzbid0IGZpcmUgY2hhbmdlIGV2ZW50IHdoZW5cbiAgICogICBpbmRldGVybWluYXRlIGNoZWNrYm94IGlzIGNsaWNrZWQuXG4gICAqIEBwYXJhbSBldmVudFxuICAgKi9cbiAgX29uSW5wdXRDbGljayhldmVudDogRXZlbnQpIHtcbiAgICBjb25zdCBjbGlja0FjdGlvbiA9IHRoaXMuX29wdGlvbnM/LmNsaWNrQWN0aW9uO1xuXG4gICAgLy8gV2UgaGF2ZSB0byBzdG9wIHByb3BhZ2F0aW9uIGZvciBjbGljayBldmVudHMgb24gdGhlIHZpc3VhbCBoaWRkZW4gaW5wdXQgZWxlbWVudC5cbiAgICAvLyBCeSBkZWZhdWx0LCB3aGVuIGEgdXNlciBjbGlja3Mgb24gYSBsYWJlbCBlbGVtZW50LCBhIGdlbmVyYXRlZCBjbGljayBldmVudCB3aWxsIGJlXG4gICAgLy8gZGlzcGF0Y2hlZCBvbiB0aGUgYXNzb2NpYXRlZCBpbnB1dCBlbGVtZW50LiBTaW5jZSB3ZSBhcmUgdXNpbmcgYSBsYWJlbCBlbGVtZW50IGFzIG91clxuICAgIC8vIHJvb3QgY29udGFpbmVyLCB0aGUgY2xpY2sgZXZlbnQgb24gdGhlIGBjaGVja2JveGAgd2lsbCBiZSBleGVjdXRlZCB0d2ljZS5cbiAgICAvLyBUaGUgcmVhbCBjbGljayBldmVudCB3aWxsIGJ1YmJsZSB1cCwgYW5kIHRoZSBnZW5lcmF0ZWQgY2xpY2sgZXZlbnQgYWxzbyB0cmllcyB0byBidWJibGUgdXAuXG4gICAgLy8gVGhpcyB3aWxsIGxlYWQgdG8gbXVsdGlwbGUgY2xpY2sgZXZlbnRzLlxuICAgIC8vIFByZXZlbnRpbmcgYnViYmxpbmcgZm9yIHRoZSBzZWNvbmQgZXZlbnQgd2lsbCBzb2x2ZSB0aGF0IGlzc3VlLlxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgLy8gSWYgcmVzZXRJbmRldGVybWluYXRlIGlzIGZhbHNlLCBhbmQgdGhlIGN1cnJlbnQgc3RhdGUgaXMgaW5kZXRlcm1pbmF0ZSwgZG8gbm90aGluZyBvbiBjbGlja1xuICAgIGlmICghdGhpcy5kaXNhYmxlZCAmJiBjbGlja0FjdGlvbiAhPT0gJ25vb3AnKSB7XG4gICAgICAvLyBXaGVuIHVzZXIgbWFudWFsbHkgY2xpY2sgb24gdGhlIGNoZWNrYm94LCBgaW5kZXRlcm1pbmF0ZWAgaXMgc2V0IHRvIGZhbHNlLlxuICAgICAgaWYgKHRoaXMuaW5kZXRlcm1pbmF0ZSAmJiBjbGlja0FjdGlvbiAhPT0gJ2NoZWNrJykge1xuICAgICAgICBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICB0aGlzLl9pbmRldGVybWluYXRlID0gZmFsc2U7XG4gICAgICAgICAgdGhpcy5pbmRldGVybWluYXRlQ2hhbmdlLmVtaXQodGhpcy5faW5kZXRlcm1pbmF0ZSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnRvZ2dsZSgpO1xuICAgICAgdGhpcy5fdHJhbnNpdGlvbkNoZWNrU3RhdGUoXG4gICAgICAgIHRoaXMuX2NoZWNrZWQgPyBUcmFuc2l0aW9uQ2hlY2tTdGF0ZS5DaGVja2VkIDogVHJhbnNpdGlvbkNoZWNrU3RhdGUuVW5jaGVja2VkLFxuICAgICAgKTtcblxuICAgICAgLy8gRW1pdCBvdXIgY3VzdG9tIGNoYW5nZSBldmVudCBpZiB0aGUgbmF0aXZlIGlucHV0IGVtaXR0ZWQgb25lLlxuICAgICAgLy8gSXQgaXMgaW1wb3J0YW50IHRvIG9ubHkgZW1pdCBpdCwgaWYgdGhlIG5hdGl2ZSBpbnB1dCB0cmlnZ2VyZWQgb25lLCBiZWNhdXNlXG4gICAgICAvLyB3ZSBkb24ndCB3YW50IHRvIHRyaWdnZXIgYSBjaGFuZ2UgZXZlbnQsIHdoZW4gdGhlIGBjaGVja2VkYCB2YXJpYWJsZSBjaGFuZ2VzIGZvciBleGFtcGxlLlxuICAgICAgdGhpcy5fZW1pdENoYW5nZUV2ZW50KCk7XG4gICAgfSBlbHNlIGlmICghdGhpcy5kaXNhYmxlZCAmJiBjbGlja0FjdGlvbiA9PT0gJ25vb3AnKSB7XG4gICAgICAvLyBSZXNldCBuYXRpdmUgaW5wdXQgd2hlbiBjbGlja2VkIHdpdGggbm9vcC4gVGhlIG5hdGl2ZSBjaGVja2JveCBiZWNvbWVzIGNoZWNrZWQgYWZ0ZXJcbiAgICAgIC8vIGNsaWNrLCByZXNldCBpdCB0byBiZSBhbGlnbiB3aXRoIGBjaGVja2VkYCB2YWx1ZSBvZiBgbWF0LWNoZWNrYm94YC5cbiAgICAgIHRoaXMuX2lucHV0RWxlbWVudC5uYXRpdmVFbGVtZW50LmNoZWNrZWQgPSB0aGlzLmNoZWNrZWQ7XG4gICAgICB0aGlzLl9pbnB1dEVsZW1lbnQubmF0aXZlRWxlbWVudC5pbmRldGVybWluYXRlID0gdGhpcy5pbmRldGVybWluYXRlO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBGb2N1c2VzIHRoZSBjaGVja2JveC4gKi9cbiAgZm9jdXMob3JpZ2luPzogRm9jdXNPcmlnaW4sIG9wdGlvbnM/OiBGb2N1c09wdGlvbnMpOiB2b2lkIHtcbiAgICBpZiAob3JpZ2luKSB7XG4gICAgICB0aGlzLl9mb2N1c01vbml0b3IuZm9jdXNWaWEodGhpcy5faW5wdXRFbGVtZW50LCBvcmlnaW4sIG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9pbnB1dEVsZW1lbnQubmF0aXZlRWxlbWVudC5mb2N1cyhvcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICBfb25JbnRlcmFjdGlvbkV2ZW50KGV2ZW50OiBFdmVudCkge1xuICAgIC8vIFdlIGFsd2F5cyBoYXZlIHRvIHN0b3AgcHJvcGFnYXRpb24gb24gdGhlIGNoYW5nZSBldmVudC5cbiAgICAvLyBPdGhlcndpc2UgdGhlIGNoYW5nZSBldmVudCwgZnJvbSB0aGUgaW5wdXQgZWxlbWVudCwgd2lsbCBidWJibGUgdXAgYW5kXG4gICAgLy8gZW1pdCBpdHMgZXZlbnQgb2JqZWN0IHRvIHRoZSBgY2hhbmdlYCBvdXRwdXQuXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH1cblxuICBwcml2YXRlIF9nZXRBbmltYXRpb25DbGFzc0ZvckNoZWNrU3RhdGVUcmFuc2l0aW9uKFxuICAgIG9sZFN0YXRlOiBUcmFuc2l0aW9uQ2hlY2tTdGF0ZSxcbiAgICBuZXdTdGF0ZTogVHJhbnNpdGlvbkNoZWNrU3RhdGUsXG4gICk6IHN0cmluZyB7XG4gICAgLy8gRG9uJ3QgdHJhbnNpdGlvbiBpZiBhbmltYXRpb25zIGFyZSBkaXNhYmxlZC5cbiAgICBpZiAodGhpcy5fYW5pbWF0aW9uTW9kZSA9PT0gJ05vb3BBbmltYXRpb25zJykge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIGxldCBhbmltU3VmZml4OiBzdHJpbmcgPSAnJztcblxuICAgIHN3aXRjaCAob2xkU3RhdGUpIHtcbiAgICAgIGNhc2UgVHJhbnNpdGlvbkNoZWNrU3RhdGUuSW5pdDpcbiAgICAgICAgLy8gSGFuZGxlIGVkZ2UgY2FzZSB3aGVyZSB1c2VyIGludGVyYWN0cyB3aXRoIGNoZWNrYm94IHRoYXQgZG9lcyBub3QgaGF2ZSBbKG5nTW9kZWwpXSBvclxuICAgICAgICAvLyBbY2hlY2tlZF0gYm91bmQgdG8gaXQuXG4gICAgICAgIGlmIChuZXdTdGF0ZSA9PT0gVHJhbnNpdGlvbkNoZWNrU3RhdGUuQ2hlY2tlZCkge1xuICAgICAgICAgIGFuaW1TdWZmaXggPSAndW5jaGVja2VkLWNoZWNrZWQnO1xuICAgICAgICB9IGVsc2UgaWYgKG5ld1N0YXRlID09IFRyYW5zaXRpb25DaGVja1N0YXRlLkluZGV0ZXJtaW5hdGUpIHtcbiAgICAgICAgICBhbmltU3VmZml4ID0gJ3VuY2hlY2tlZC1pbmRldGVybWluYXRlJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFRyYW5zaXRpb25DaGVja1N0YXRlLlVuY2hlY2tlZDpcbiAgICAgICAgYW5pbVN1ZmZpeCA9XG4gICAgICAgICAgbmV3U3RhdGUgPT09IFRyYW5zaXRpb25DaGVja1N0YXRlLkNoZWNrZWRcbiAgICAgICAgICAgID8gJ3VuY2hlY2tlZC1jaGVja2VkJ1xuICAgICAgICAgICAgOiAndW5jaGVja2VkLWluZGV0ZXJtaW5hdGUnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgVHJhbnNpdGlvbkNoZWNrU3RhdGUuQ2hlY2tlZDpcbiAgICAgICAgYW5pbVN1ZmZpeCA9XG4gICAgICAgICAgbmV3U3RhdGUgPT09IFRyYW5zaXRpb25DaGVja1N0YXRlLlVuY2hlY2tlZFxuICAgICAgICAgICAgPyAnY2hlY2tlZC11bmNoZWNrZWQnXG4gICAgICAgICAgICA6ICdjaGVja2VkLWluZGV0ZXJtaW5hdGUnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgVHJhbnNpdGlvbkNoZWNrU3RhdGUuSW5kZXRlcm1pbmF0ZTpcbiAgICAgICAgYW5pbVN1ZmZpeCA9XG4gICAgICAgICAgbmV3U3RhdGUgPT09IFRyYW5zaXRpb25DaGVja1N0YXRlLkNoZWNrZWRcbiAgICAgICAgICAgID8gJ2luZGV0ZXJtaW5hdGUtY2hlY2tlZCdcbiAgICAgICAgICAgIDogJ2luZGV0ZXJtaW5hdGUtdW5jaGVja2VkJztcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgcmV0dXJuIGBtYXQtY2hlY2tib3gtYW5pbS0ke2FuaW1TdWZmaXh9YDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTeW5jcyB0aGUgaW5kZXRlcm1pbmF0ZSB2YWx1ZSB3aXRoIHRoZSBjaGVja2JveCBET00gbm9kZS5cbiAgICpcbiAgICogV2Ugc3luYyBgaW5kZXRlcm1pbmF0ZWAgZGlyZWN0bHkgb24gdGhlIERPTSBub2RlLCBiZWNhdXNlIGluIEl2eSB0aGUgY2hlY2sgZm9yIHdoZXRoZXIgYVxuICAgKiBwcm9wZXJ0eSBpcyBzdXBwb3J0ZWQgb24gYW4gZWxlbWVudCBib2lscyBkb3duIHRvIGBpZiAocHJvcE5hbWUgaW4gZWxlbWVudClgLiBEb21pbm8nc1xuICAgKiBIVE1MSW5wdXRFbGVtZW50IGRvZXNuJ3QgaGF2ZSBhbiBgaW5kZXRlcm1pbmF0ZWAgcHJvcGVydHkgc28gSXZ5IHdpbGwgd2FybiBkdXJpbmdcbiAgICogc2VydmVyLXNpZGUgcmVuZGVyaW5nLlxuICAgKi9cbiAgcHJpdmF0ZSBfc3luY0luZGV0ZXJtaW5hdGUodmFsdWU6IGJvb2xlYW4pIHtcbiAgICBjb25zdCBuYXRpdmVDaGVja2JveCA9IHRoaXMuX2lucHV0RWxlbWVudDtcblxuICAgIGlmIChuYXRpdmVDaGVja2JveCkge1xuICAgICAgbmF0aXZlQ2hlY2tib3gubmF0aXZlRWxlbWVudC5pbmRldGVybWluYXRlID0gdmFsdWU7XG4gICAgfVxuICB9XG59XG4iLCI8bGFiZWwgW2F0dHIuZm9yXT1cImlucHV0SWRcIiBjbGFzcz1cIm1hdC1jaGVja2JveC1sYXlvdXRcIiAjbGFiZWw+XG4gIDxzcGFuIGNsYXNzPVwibWF0LWNoZWNrYm94LWlubmVyLWNvbnRhaW5lclwiXG4gICAgICAgW2NsYXNzLm1hdC1jaGVja2JveC1pbm5lci1jb250YWluZXItbm8tc2lkZS1tYXJnaW5dPVwiIWNoZWNrYm94TGFiZWwudGV4dENvbnRlbnQgfHwgIWNoZWNrYm94TGFiZWwudGV4dENvbnRlbnQudHJpbSgpXCI+XG4gICAgPGlucHV0ICNpbnB1dFxuICAgICAgICAgICBjbGFzcz1cIm1hdC1jaGVja2JveC1pbnB1dCBjZGstdmlzdWFsbHktaGlkZGVuXCIgdHlwZT1cImNoZWNrYm94XCJcbiAgICAgICAgICAgW2lkXT1cImlucHV0SWRcIlxuICAgICAgICAgICBbcmVxdWlyZWRdPVwicmVxdWlyZWRcIlxuICAgICAgICAgICBbY2hlY2tlZF09XCJjaGVja2VkXCJcbiAgICAgICAgICAgW2F0dHIudmFsdWVdPVwidmFsdWVcIlxuICAgICAgICAgICBbZGlzYWJsZWRdPVwiZGlzYWJsZWRcIlxuICAgICAgICAgICBbYXR0ci5uYW1lXT1cIm5hbWVcIlxuICAgICAgICAgICBbdGFiSW5kZXhdPVwidGFiSW5kZXhcIlxuICAgICAgICAgICBbYXR0ci5hcmlhLWxhYmVsXT1cImFyaWFMYWJlbCB8fCBudWxsXCJcbiAgICAgICAgICAgW2F0dHIuYXJpYS1sYWJlbGxlZGJ5XT1cImFyaWFMYWJlbGxlZGJ5XCJcbiAgICAgICAgICAgW2F0dHIuYXJpYS1jaGVja2VkXT1cIl9nZXRBcmlhQ2hlY2tlZCgpXCJcbiAgICAgICAgICAgW2F0dHIuYXJpYS1kZXNjcmliZWRieV09XCJhcmlhRGVzY3JpYmVkYnlcIlxuICAgICAgICAgICAoY2hhbmdlKT1cIl9vbkludGVyYWN0aW9uRXZlbnQoJGV2ZW50KVwiXG4gICAgICAgICAgIChjbGljayk9XCJfb25JbnB1dENsaWNrKCRldmVudClcIj5cbiAgICA8c3BhbiBtYXRSaXBwbGUgY2xhc3M9XCJtYXQtY2hlY2tib3gtcmlwcGxlIG1hdC1mb2N1cy1pbmRpY2F0b3JcIlxuICAgICAgICAgW21hdFJpcHBsZVRyaWdnZXJdPVwibGFiZWxcIlxuICAgICAgICAgW21hdFJpcHBsZURpc2FibGVkXT1cIl9pc1JpcHBsZURpc2FibGVkKClcIlxuICAgICAgICAgW21hdFJpcHBsZVJhZGl1c109XCIyMFwiXG4gICAgICAgICBbbWF0UmlwcGxlQ2VudGVyZWRdPVwidHJ1ZVwiXG4gICAgICAgICBbbWF0UmlwcGxlQW5pbWF0aW9uXT1cIntlbnRlckR1cmF0aW9uOiBfYW5pbWF0aW9uTW9kZSA9PT0gJ05vb3BBbmltYXRpb25zJyA/IDAgOiAxNTB9XCI+XG4gICAgICA8c3BhbiBjbGFzcz1cIm1hdC1yaXBwbGUtZWxlbWVudCBtYXQtY2hlY2tib3gtcGVyc2lzdGVudC1yaXBwbGVcIj48L3NwYW4+XG4gICAgPC9zcGFuPlxuICAgIDxzcGFuIGNsYXNzPVwibWF0LWNoZWNrYm94LWZyYW1lXCI+PC9zcGFuPlxuICAgIDxzcGFuIGNsYXNzPVwibWF0LWNoZWNrYm94LWJhY2tncm91bmRcIj5cbiAgICAgIDxzdmcgdmVyc2lvbj1cIjEuMVwiXG4gICAgICAgICAgIGZvY3VzYWJsZT1cImZhbHNlXCJcbiAgICAgICAgICAgY2xhc3M9XCJtYXQtY2hlY2tib3gtY2hlY2ttYXJrXCJcbiAgICAgICAgICAgdmlld0JveD1cIjAgMCAyNCAyNFwiXG4gICAgICAgICAgIHhtbDpzcGFjZT1cInByZXNlcnZlXCJcbiAgICAgICAgICAgYXJpYS1oaWRkZW49XCJ0cnVlXCI+XG4gICAgICAgIDxwYXRoIGNsYXNzPVwibWF0LWNoZWNrYm94LWNoZWNrbWFyay1wYXRoXCJcbiAgICAgICAgICAgICAgZmlsbD1cIm5vbmVcIlxuICAgICAgICAgICAgICBzdHJva2U9XCJ3aGl0ZVwiXG4gICAgICAgICAgICAgIGQ9XCJNNC4xLDEyLjcgOSwxNy42IDIwLjMsNi4zXCIvPlxuICAgICAgPC9zdmc+XG4gICAgICA8IS0tIEVsZW1lbnQgZm9yIHJlbmRlcmluZyB0aGUgaW5kZXRlcm1pbmF0ZSBzdGF0ZSBjaGVja2JveC4gLS0+XG4gICAgICA8c3BhbiBjbGFzcz1cIm1hdC1jaGVja2JveC1taXhlZG1hcmtcIj48L3NwYW4+XG4gICAgPC9zcGFuPlxuICA8L3NwYW4+XG4gIDxzcGFuIGNsYXNzPVwibWF0LWNoZWNrYm94LWxhYmVsXCIgI2NoZWNrYm94TGFiZWwgKGNka09ic2VydmVDb250ZW50KT1cIl9vbkxhYmVsVGV4dENoYW5nZSgpXCI+XG4gICAgPCEtLSBBZGQgYW4gaW52aXNpYmxlIHNwYW4gc28gSkFXUyBjYW4gcmVhZCB0aGUgbGFiZWwgLS0+XG4gICAgPHNwYW4gc3R5bGU9XCJkaXNwbGF5Om5vbmVcIj4mbmJzcDs8L3NwYW4+XG4gICAgPG5nLWNvbnRlbnQ+PC9uZy1jb250ZW50PlxuICA8L3NwYW4+XG48L2xhYmVsPlxuIl19