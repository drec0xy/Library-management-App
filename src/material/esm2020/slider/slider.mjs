/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { FocusMonitor } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { coerceBooleanProperty, coerceNumberProperty, } from '@angular/cdk/coercion';
import { DOWN_ARROW, END, HOME, LEFT_ARROW, PAGE_DOWN, PAGE_UP, RIGHT_ARROW, UP_ARROW, hasModifierKey, } from '@angular/cdk/keycodes';
import { Attribute, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, forwardRef, Inject, Input, Optional, Output, ViewChild, ViewEncapsulation, NgZone, } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { mixinColor, mixinDisabled, mixinTabIndex, } from '@angular/material/core';
import { ANIMATION_MODULE_TYPE } from '@angular/platform-browser/animations';
import { normalizePassiveListenerOptions } from '@angular/cdk/platform';
import { DOCUMENT } from '@angular/common';
import { Subscription } from 'rxjs';
import * as i0 from "@angular/core";
import * as i1 from "@angular/cdk/a11y";
import * as i2 from "@angular/cdk/bidi";
import * as i3 from "@angular/common";
const activeEventOptions = normalizePassiveListenerOptions({ passive: false });
/**
 * Visually, a 30px separation between tick marks looks best. This is very subjective but it is
 * the default separation we chose.
 */
const MIN_AUTO_TICK_SEPARATION = 30;
/** The thumb gap size for a disabled slider. */
const DISABLED_THUMB_GAP = 7;
/** The thumb gap size for a non-active slider at its minimum value. */
const MIN_VALUE_NONACTIVE_THUMB_GAP = 7;
/** The thumb gap size for an active slider at its minimum value. */
const MIN_VALUE_ACTIVE_THUMB_GAP = 10;
/**
 * Provider Expression that allows mat-slider to register as a ControlValueAccessor.
 * This allows it to support [(ngModel)] and [formControl].
 * @docs-private
 */
export const MAT_SLIDER_VALUE_ACCESSOR = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MatSlider),
    multi: true,
};
/** A simple change event emitted by the MatSlider component. */
export class MatSliderChange {
}
// Boilerplate for applying mixins to MatSlider.
/** @docs-private */
const _MatSliderBase = mixinTabIndex(mixinColor(mixinDisabled(class {
    constructor(_elementRef) {
        this._elementRef = _elementRef;
    }
}), 'accent'));
/**
 * Allows users to select from a range of values by moving the slider thumb. It is similar in
 * behavior to the native `<input type="range">` element.
 */
export class MatSlider extends _MatSliderBase {
    constructor(elementRef, _focusMonitor, _changeDetectorRef, _dir, tabIndex, _ngZone, _document, _animationMode) {
        super(elementRef);
        this._focusMonitor = _focusMonitor;
        this._changeDetectorRef = _changeDetectorRef;
        this._dir = _dir;
        this._ngZone = _ngZone;
        this._animationMode = _animationMode;
        this._invert = false;
        this._max = 100;
        this._min = 0;
        this._step = 1;
        this._thumbLabel = false;
        this._tickInterval = 0;
        this._value = null;
        this._vertical = false;
        /** Event emitted when the slider value has changed. */
        this.change = new EventEmitter();
        /** Event emitted when the slider thumb moves. */
        this.input = new EventEmitter();
        /**
         * Emits when the raw value of the slider changes. This is here primarily
         * to facilitate the two-way binding for the `value` input.
         * @docs-private
         */
        this.valueChange = new EventEmitter();
        /** onTouch function registered via registerOnTouch (ControlValueAccessor). */
        this.onTouched = () => { };
        this._percent = 0;
        /**
         * Whether or not the thumb is sliding and what the user is using to slide it with.
         * Used to determine if there should be a transition for the thumb and fill track.
         */
        this._isSliding = null;
        /**
         * Whether or not the slider is active (clicked or sliding).
         * Used to shrink and grow the thumb as according to the Material Design spec.
         */
        this._isActive = false;
        /** The size of a tick interval as a percentage of the size of the track. */
        this._tickIntervalPercent = 0;
        /** The dimensions of the slider. */
        this._sliderDimensions = null;
        this._controlValueAccessorChangeFn = () => { };
        /** Subscription to the Directionality change EventEmitter. */
        this._dirChangeSubscription = Subscription.EMPTY;
        /** Called when the user has put their pointer down on the slider. */
        this._pointerDown = (event) => {
            // Don't do anything if the slider is disabled or the
            // user is using anything other than the main mouse button.
            if (this.disabled || this._isSliding || (!isTouchEvent(event) && event.button !== 0)) {
                return;
            }
            this._ngZone.run(() => {
                this._touchId = isTouchEvent(event)
                    ? getTouchIdForSlider(event, this._elementRef.nativeElement)
                    : undefined;
                const pointerPosition = getPointerPositionOnPage(event, this._touchId);
                if (pointerPosition) {
                    const oldValue = this.value;
                    this._isSliding = 'pointer';
                    this._lastPointerEvent = event;
                    event.preventDefault();
                    this._focusHostElement();
                    this._onMouseenter(); // Simulate mouseenter in case this is a mobile device.
                    this._bindGlobalEvents(event);
                    this._focusHostElement();
                    this._updateValueFromPosition(pointerPosition);
                    this._valueOnSlideStart = oldValue;
                    // Emit a change and input event if the value changed.
                    if (oldValue != this.value) {
                        this._emitInputEvent();
                    }
                }
            });
        };
        /**
         * Called when the user has moved their pointer after
         * starting to drag. Bound on the document level.
         */
        this._pointerMove = (event) => {
            if (this._isSliding === 'pointer') {
                const pointerPosition = getPointerPositionOnPage(event, this._touchId);
                if (pointerPosition) {
                    // Prevent the slide from selecting anything else.
                    event.preventDefault();
                    const oldValue = this.value;
                    this._lastPointerEvent = event;
                    this._updateValueFromPosition(pointerPosition);
                    // Native range elements always emit `input` events when the value changed while sliding.
                    if (oldValue != this.value) {
                        this._emitInputEvent();
                    }
                }
            }
        };
        /** Called when the user has lifted their pointer. Bound on the document level. */
        this._pointerUp = (event) => {
            if (this._isSliding === 'pointer') {
                if (!isTouchEvent(event) ||
                    typeof this._touchId !== 'number' ||
                    // Note that we use `changedTouches`, rather than `touches` because it
                    // seems like in most cases `touches` is empty for `touchend` events.
                    findMatchingTouch(event.changedTouches, this._touchId)) {
                    event.preventDefault();
                    this._removeGlobalEvents();
                    this._isSliding = null;
                    this._touchId = undefined;
                    if (this._valueOnSlideStart != this.value && !this.disabled) {
                        this._emitChangeEvent();
                    }
                    this._valueOnSlideStart = this._lastPointerEvent = null;
                }
            }
        };
        /** Called when the window has lost focus. */
        this._windowBlur = () => {
            // If the window is blurred while dragging we need to stop dragging because the
            // browser won't dispatch the `mouseup` and `touchend` events anymore.
            if (this._lastPointerEvent) {
                this._pointerUp(this._lastPointerEvent);
            }
        };
        this._document = _document;
        this.tabIndex = parseInt(tabIndex) || 0;
        _ngZone.runOutsideAngular(() => {
            const element = elementRef.nativeElement;
            element.addEventListener('mousedown', this._pointerDown, activeEventOptions);
            element.addEventListener('touchstart', this._pointerDown, activeEventOptions);
        });
    }
    /** Whether the slider is inverted. */
    get invert() {
        return this._invert;
    }
    set invert(value) {
        this._invert = coerceBooleanProperty(value);
    }
    /** The maximum value that the slider can have. */
    get max() {
        return this._max;
    }
    set max(v) {
        this._max = coerceNumberProperty(v, this._max);
        this._percent = this._calculatePercentage(this._value);
        // Since this also modifies the percentage, we need to let the change detection know.
        this._changeDetectorRef.markForCheck();
    }
    /** The minimum value that the slider can have. */
    get min() {
        return this._min;
    }
    set min(v) {
        this._min = coerceNumberProperty(v, this._min);
        this._percent = this._calculatePercentage(this._value);
        // Since this also modifies the percentage, we need to let the change detection know.
        this._changeDetectorRef.markForCheck();
    }
    /** The values at which the thumb will snap. */
    get step() {
        return this._step;
    }
    set step(v) {
        this._step = coerceNumberProperty(v, this._step);
        if (this._step % 1 !== 0) {
            this._roundToDecimal = this._step.toString().split('.').pop().length;
        }
        // Since this could modify the label, we need to notify the change detection.
        this._changeDetectorRef.markForCheck();
    }
    /** Whether or not to show the thumb label. */
    get thumbLabel() {
        return this._thumbLabel;
    }
    set thumbLabel(value) {
        this._thumbLabel = coerceBooleanProperty(value);
    }
    /**
     * How often to show ticks. Relative to the step so that a tick always appears on a step.
     * Ex: Tick interval of 4 with a step of 3 will draw a tick every 4 steps (every 12 values).
     */
    get tickInterval() {
        return this._tickInterval;
    }
    set tickInterval(value) {
        if (value === 'auto') {
            this._tickInterval = 'auto';
        }
        else if (typeof value === 'number' || typeof value === 'string') {
            this._tickInterval = coerceNumberProperty(value, this._tickInterval);
        }
        else {
            this._tickInterval = 0;
        }
    }
    /** Value of the slider. */
    get value() {
        // If the value needs to be read and it is still uninitialized, initialize it to the min.
        if (this._value === null) {
            this.value = this._min;
        }
        return this._value;
    }
    set value(v) {
        if (v !== this._value) {
            let value = coerceNumberProperty(v, 0);
            // While incrementing by a decimal we can end up with values like 33.300000000000004.
            // Truncate it to ensure that it matches the label and to make it easier to work with.
            if (this._roundToDecimal && value !== this.min && value !== this.max) {
                value = parseFloat(value.toFixed(this._roundToDecimal));
            }
            this._value = value;
            this._percent = this._calculatePercentage(this._value);
            // Since this also modifies the percentage, we need to let the change detection know.
            this._changeDetectorRef.markForCheck();
        }
    }
    /** Whether the slider is vertical. */
    get vertical() {
        return this._vertical;
    }
    set vertical(value) {
        this._vertical = coerceBooleanProperty(value);
    }
    /** The value to be used for display purposes. */
    get displayValue() {
        if (this.displayWith) {
            // Value is never null but since setters and getters cannot have
            // different types, the value getter is also typed to return null.
            return this.displayWith(this.value);
        }
        // Note that this could be improved further by rounding something like 0.999 to 1 or
        // 0.899 to 0.9, however it is very performance sensitive, because it gets called on
        // every change detection cycle.
        if (this._roundToDecimal && this.value && this.value % 1 !== 0) {
            return this.value.toFixed(this._roundToDecimal);
        }
        return this.value || 0;
    }
    /** set focus to the host element */
    focus(options) {
        this._focusHostElement(options);
    }
    /** blur the host element */
    blur() {
        this._blurHostElement();
    }
    /** The percentage of the slider that coincides with the value. */
    get percent() {
        return this._clamp(this._percent);
    }
    /**
     * Whether the axis of the slider is inverted.
     * (i.e. whether moving the thumb in the positive x or y direction decreases the slider's value).
     */
    _shouldInvertAxis() {
        // Standard non-inverted mode for a vertical slider should be dragging the thumb from bottom to
        // top. However from a y-axis standpoint this is inverted.
        return this.vertical ? !this.invert : this.invert;
    }
    /** Whether the slider is at its minimum value. */
    _isMinValue() {
        return this.percent === 0;
    }
    /**
     * The amount of space to leave between the slider thumb and the track fill & track background
     * elements.
     */
    _getThumbGap() {
        if (this.disabled) {
            return DISABLED_THUMB_GAP;
        }
        if (this._isMinValue() && !this.thumbLabel) {
            return this._isActive ? MIN_VALUE_ACTIVE_THUMB_GAP : MIN_VALUE_NONACTIVE_THUMB_GAP;
        }
        return 0;
    }
    /** CSS styles for the track background element. */
    _getTrackBackgroundStyles() {
        const axis = this.vertical ? 'Y' : 'X';
        const scale = this.vertical ? `1, ${1 - this.percent}, 1` : `${1 - this.percent}, 1, 1`;
        const sign = this._shouldInvertMouseCoords() ? '-' : '';
        return {
            // scale3d avoids some rendering issues in Chrome. See #12071.
            transform: `translate${axis}(${sign}${this._getThumbGap()}px) scale3d(${scale})`,
        };
    }
    /** CSS styles for the track fill element. */
    _getTrackFillStyles() {
        const percent = this.percent;
        const axis = this.vertical ? 'Y' : 'X';
        const scale = this.vertical ? `1, ${percent}, 1` : `${percent}, 1, 1`;
        const sign = this._shouldInvertMouseCoords() ? '' : '-';
        return {
            // scale3d avoids some rendering issues in Chrome. See #12071.
            transform: `translate${axis}(${sign}${this._getThumbGap()}px) scale3d(${scale})`,
            // iOS Safari has a bug where it won't re-render elements which start of as `scale(0)` until
            // something forces a style recalculation on it. Since we'll end up with `scale(0)` when
            // the value of the slider is 0, we can easily get into this situation. We force a
            // recalculation by changing the element's `display` when it goes from 0 to any other value.
            display: percent === 0 ? 'none' : '',
        };
    }
    /** CSS styles for the ticks container element. */
    _getTicksContainerStyles() {
        let axis = this.vertical ? 'Y' : 'X';
        // For a horizontal slider in RTL languages we push the ticks container off the left edge
        // instead of the right edge to avoid causing a horizontal scrollbar to appear.
        let sign = !this.vertical && this._getDirection() == 'rtl' ? '' : '-';
        let offset = (this._tickIntervalPercent / 2) * 100;
        return {
            'transform': `translate${axis}(${sign}${offset}%)`,
        };
    }
    /** CSS styles for the ticks element. */
    _getTicksStyles() {
        let tickSize = this._tickIntervalPercent * 100;
        let backgroundSize = this.vertical ? `2px ${tickSize}%` : `${tickSize}% 2px`;
        let axis = this.vertical ? 'Y' : 'X';
        // Depending on the direction we pushed the ticks container, push the ticks the opposite
        // direction to re-center them but clip off the end edge. In RTL languages we need to flip the
        // ticks 180 degrees so we're really cutting off the end edge abd not the start.
        let sign = !this.vertical && this._getDirection() == 'rtl' ? '-' : '';
        let rotate = !this.vertical && this._getDirection() == 'rtl' ? ' rotate(180deg)' : '';
        let styles = {
            'backgroundSize': backgroundSize,
            // Without translateZ ticks sometimes jitter as the slider moves on Chrome & Firefox.
            'transform': `translateZ(0) translate${axis}(${sign}${tickSize / 2}%)${rotate}`,
        };
        if (this._isMinValue() && this._getThumbGap()) {
            const shouldInvertAxis = this._shouldInvertAxis();
            let side;
            if (this.vertical) {
                side = shouldInvertAxis ? 'Bottom' : 'Top';
            }
            else {
                side = shouldInvertAxis ? 'Right' : 'Left';
            }
            styles[`padding${side}`] = `${this._getThumbGap()}px`;
        }
        return styles;
    }
    _getThumbContainerStyles() {
        const shouldInvertAxis = this._shouldInvertAxis();
        let axis = this.vertical ? 'Y' : 'X';
        // For a horizontal slider in RTL languages we push the thumb container off the left edge
        // instead of the right edge to avoid causing a horizontal scrollbar to appear.
        let invertOffset = this._getDirection() == 'rtl' && !this.vertical ? !shouldInvertAxis : shouldInvertAxis;
        let offset = (invertOffset ? this.percent : 1 - this.percent) * 100;
        return {
            'transform': `translate${axis}(-${offset}%)`,
        };
    }
    /**
     * Whether mouse events should be converted to a slider position by calculating their distance
     * from the right or bottom edge of the slider as opposed to the top or left.
     */
    _shouldInvertMouseCoords() {
        const shouldInvertAxis = this._shouldInvertAxis();
        return this._getDirection() == 'rtl' && !this.vertical ? !shouldInvertAxis : shouldInvertAxis;
    }
    /** The language direction for this slider element. */
    _getDirection() {
        return this._dir && this._dir.value == 'rtl' ? 'rtl' : 'ltr';
    }
    ngAfterViewInit() {
        this._focusMonitor.monitor(this._elementRef, true).subscribe((origin) => {
            this._isActive = !!origin && origin !== 'keyboard';
            this._changeDetectorRef.detectChanges();
        });
        if (this._dir) {
            this._dirChangeSubscription = this._dir.change.subscribe(() => {
                this._changeDetectorRef.markForCheck();
            });
        }
    }
    ngOnDestroy() {
        const element = this._elementRef.nativeElement;
        element.removeEventListener('mousedown', this._pointerDown, activeEventOptions);
        element.removeEventListener('touchstart', this._pointerDown, activeEventOptions);
        this._lastPointerEvent = null;
        this._removeGlobalEvents();
        this._focusMonitor.stopMonitoring(this._elementRef);
        this._dirChangeSubscription.unsubscribe();
    }
    _onMouseenter() {
        if (this.disabled) {
            return;
        }
        // We save the dimensions of the slider here so we can use them to update the spacing of the
        // ticks and determine where on the slider click and slide events happen.
        this._sliderDimensions = this._getSliderDimensions();
        this._updateTickIntervalPercent();
    }
    _onFocus() {
        // We save the dimensions of the slider here so we can use them to update the spacing of the
        // ticks and determine where on the slider click and slide events happen.
        this._sliderDimensions = this._getSliderDimensions();
        this._updateTickIntervalPercent();
    }
    _onBlur() {
        this.onTouched();
    }
    _onKeydown(event) {
        if (this.disabled ||
            hasModifierKey(event) ||
            (this._isSliding && this._isSliding !== 'keyboard')) {
            return;
        }
        const oldValue = this.value;
        switch (event.keyCode) {
            case PAGE_UP:
                this._increment(10);
                break;
            case PAGE_DOWN:
                this._increment(-10);
                break;
            case END:
                this.value = this.max;
                break;
            case HOME:
                this.value = this.min;
                break;
            case LEFT_ARROW:
                // NOTE: For a sighted user it would make more sense that when they press an arrow key on an
                // inverted slider the thumb moves in that direction. However for a blind user, nothing
                // about the slider indicates that it is inverted. They will expect left to be decrement,
                // regardless of how it appears on the screen. For speakers ofRTL languages, they probably
                // expect left to mean increment. Therefore we flip the meaning of the side arrow keys for
                // RTL. For inverted sliders we prefer a good a11y experience to having it "look right" for
                // sighted users, therefore we do not swap the meaning.
                this._increment(this._getDirection() == 'rtl' ? 1 : -1);
                break;
            case UP_ARROW:
                this._increment(1);
                break;
            case RIGHT_ARROW:
                // See comment on LEFT_ARROW about the conditions under which we flip the meaning.
                this._increment(this._getDirection() == 'rtl' ? -1 : 1);
                break;
            case DOWN_ARROW:
                this._increment(-1);
                break;
            default:
                // Return if the key is not one that we explicitly handle to avoid calling preventDefault on
                // it.
                return;
        }
        if (oldValue != this.value) {
            this._emitInputEvent();
            this._emitChangeEvent();
        }
        this._isSliding = 'keyboard';
        event.preventDefault();
    }
    _onKeyup() {
        if (this._isSliding === 'keyboard') {
            this._isSliding = null;
        }
    }
    /** Use defaultView of injected document if available or fallback to global window reference */
    _getWindow() {
        return this._document.defaultView || window;
    }
    /**
     * Binds our global move and end events. They're bound at the document level and only while
     * dragging so that the user doesn't have to keep their pointer exactly over the slider
     * as they're swiping across the screen.
     */
    _bindGlobalEvents(triggerEvent) {
        // Note that we bind the events to the `document`, because it allows us to capture
        // drag cancel events where the user's pointer is outside the browser window.
        const document = this._document;
        const isTouch = isTouchEvent(triggerEvent);
        const moveEventName = isTouch ? 'touchmove' : 'mousemove';
        const endEventName = isTouch ? 'touchend' : 'mouseup';
        document.addEventListener(moveEventName, this._pointerMove, activeEventOptions);
        document.addEventListener(endEventName, this._pointerUp, activeEventOptions);
        if (isTouch) {
            document.addEventListener('touchcancel', this._pointerUp, activeEventOptions);
        }
        const window = this._getWindow();
        if (typeof window !== 'undefined' && window) {
            window.addEventListener('blur', this._windowBlur);
        }
    }
    /** Removes any global event listeners that we may have added. */
    _removeGlobalEvents() {
        const document = this._document;
        document.removeEventListener('mousemove', this._pointerMove, activeEventOptions);
        document.removeEventListener('mouseup', this._pointerUp, activeEventOptions);
        document.removeEventListener('touchmove', this._pointerMove, activeEventOptions);
        document.removeEventListener('touchend', this._pointerUp, activeEventOptions);
        document.removeEventListener('touchcancel', this._pointerUp, activeEventOptions);
        const window = this._getWindow();
        if (typeof window !== 'undefined' && window) {
            window.removeEventListener('blur', this._windowBlur);
        }
    }
    /** Increments the slider by the given number of steps (negative number decrements). */
    _increment(numSteps) {
        this.value = this._clamp((this.value || 0) + this.step * numSteps, this.min, this.max);
    }
    /** Calculate the new value from the new physical location. The value will always be snapped. */
    _updateValueFromPosition(pos) {
        if (!this._sliderDimensions) {
            return;
        }
        let offset = this.vertical ? this._sliderDimensions.top : this._sliderDimensions.left;
        let size = this.vertical ? this._sliderDimensions.height : this._sliderDimensions.width;
        let posComponent = this.vertical ? pos.y : pos.x;
        // The exact value is calculated from the event and used to find the closest snap value.
        let percent = this._clamp((posComponent - offset) / size);
        if (this._shouldInvertMouseCoords()) {
            percent = 1 - percent;
        }
        // Since the steps may not divide cleanly into the max value, if the user
        // slid to 0 or 100 percent, we jump to the min/max value. This approach
        // is slightly more intuitive than using `Math.ceil` below, because it
        // follows the user's pointer closer.
        if (percent === 0) {
            this.value = this.min;
        }
        else if (percent === 1) {
            this.value = this.max;
        }
        else {
            const exactValue = this._calculateValue(percent);
            // This calculation finds the closest step by finding the closest
            // whole number divisible by the step relative to the min.
            const closestValue = Math.round((exactValue - this.min) / this.step) * this.step + this.min;
            // The value needs to snap to the min and max.
            this.value = this._clamp(closestValue, this.min, this.max);
        }
    }
    /** Emits a change event if the current value is different from the last emitted value. */
    _emitChangeEvent() {
        this._controlValueAccessorChangeFn(this.value);
        this.valueChange.emit(this.value);
        this.change.emit(this._createChangeEvent());
    }
    /** Emits an input event when the current value is different from the last emitted value. */
    _emitInputEvent() {
        this.input.emit(this._createChangeEvent());
    }
    /** Updates the amount of space between ticks as a percentage of the width of the slider. */
    _updateTickIntervalPercent() {
        if (!this.tickInterval || !this._sliderDimensions) {
            return;
        }
        if (this.tickInterval == 'auto') {
            let trackSize = this.vertical ? this._sliderDimensions.height : this._sliderDimensions.width;
            let pixelsPerStep = (trackSize * this.step) / (this.max - this.min);
            let stepsPerTick = Math.ceil(MIN_AUTO_TICK_SEPARATION / pixelsPerStep);
            let pixelsPerTick = stepsPerTick * this.step;
            this._tickIntervalPercent = pixelsPerTick / trackSize;
        }
        else {
            this._tickIntervalPercent = (this.tickInterval * this.step) / (this.max - this.min);
        }
    }
    /** Creates a slider change object from the specified value. */
    _createChangeEvent(value = this.value) {
        let event = new MatSliderChange();
        event.source = this;
        event.value = value;
        return event;
    }
    /** Calculates the percentage of the slider that a value is. */
    _calculatePercentage(value) {
        return ((value || 0) - this.min) / (this.max - this.min);
    }
    /** Calculates the value a percentage of the slider corresponds to. */
    _calculateValue(percentage) {
        return this.min + percentage * (this.max - this.min);
    }
    /** Return a number between two numbers. */
    _clamp(value, min = 0, max = 1) {
        return Math.max(min, Math.min(value, max));
    }
    /**
     * Get the bounding client rect of the slider track element.
     * The track is used rather than the native element to ignore the extra space that the thumb can
     * take up.
     */
    _getSliderDimensions() {
        return this._sliderWrapper ? this._sliderWrapper.nativeElement.getBoundingClientRect() : null;
    }
    /**
     * Focuses the native element.
     * Currently only used to allow a blur event to fire but will be used with keyboard input later.
     */
    _focusHostElement(options) {
        this._elementRef.nativeElement.focus(options);
    }
    /** Blurs the native element. */
    _blurHostElement() {
        this._elementRef.nativeElement.blur();
    }
    /**
     * Sets the model value. Implemented as part of ControlValueAccessor.
     * @param value
     */
    writeValue(value) {
        this.value = value;
    }
    /**
     * Registers a callback to be triggered when the value has changed.
     * Implemented as part of ControlValueAccessor.
     * @param fn Callback to be registered.
     */
    registerOnChange(fn) {
        this._controlValueAccessorChangeFn = fn;
    }
    /**
     * Registers a callback to be triggered when the component is touched.
     * Implemented as part of ControlValueAccessor.
     * @param fn Callback to be registered.
     */
    registerOnTouched(fn) {
        this.onTouched = fn;
    }
    /**
     * Sets whether the component should be disabled.
     * Implemented as part of ControlValueAccessor.
     * @param isDisabled
     */
    setDisabledState(isDisabled) {
        this.disabled = isDisabled;
    }
}
MatSlider.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: MatSlider, deps: [{ token: i0.ElementRef }, { token: i1.FocusMonitor }, { token: i0.ChangeDetectorRef }, { token: i2.Directionality, optional: true }, { token: 'tabindex', attribute: true }, { token: i0.NgZone }, { token: DOCUMENT }, { token: ANIMATION_MODULE_TYPE, optional: true }], target: i0.ɵɵFactoryTarget.Component });
MatSlider.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.1.0", type: MatSlider, selector: "mat-slider", inputs: { disabled: "disabled", color: "color", tabIndex: "tabIndex", invert: "invert", max: "max", min: "min", step: "step", thumbLabel: "thumbLabel", tickInterval: "tickInterval", value: "value", displayWith: "displayWith", valueText: "valueText", vertical: "vertical" }, outputs: { change: "change", input: "input", valueChange: "valueChange" }, host: { attributes: { "role": "slider" }, listeners: { "focus": "_onFocus()", "blur": "_onBlur()", "keydown": "_onKeydown($event)", "keyup": "_onKeyup()", "mouseenter": "_onMouseenter()", "selectstart": "$event.preventDefault()" }, properties: { "tabIndex": "tabIndex", "attr.aria-disabled": "disabled", "attr.aria-valuemax": "max", "attr.aria-valuemin": "min", "attr.aria-valuenow": "value", "attr.aria-valuetext": "valueText == null ? displayValue : valueText", "attr.aria-orientation": "vertical ? \"vertical\" : \"horizontal\"", "class.mat-slider-disabled": "disabled", "class.mat-slider-has-ticks": "tickInterval", "class.mat-slider-horizontal": "!vertical", "class.mat-slider-axis-inverted": "_shouldInvertAxis()", "class.mat-slider-invert-mouse-coords": "_shouldInvertMouseCoords()", "class.mat-slider-sliding": "_isSliding", "class.mat-slider-thumb-label-showing": "thumbLabel", "class.mat-slider-vertical": "vertical", "class.mat-slider-min-value": "_isMinValue()", "class.mat-slider-hide-last-tick": "disabled || _isMinValue() && _getThumbGap() && _shouldInvertAxis()", "class._mat-animation-noopable": "_animationMode === \"NoopAnimations\"" }, classAttribute: "mat-slider mat-focus-indicator" }, providers: [MAT_SLIDER_VALUE_ACCESSOR], viewQueries: [{ propertyName: "_sliderWrapper", first: true, predicate: ["sliderWrapper"], descendants: true }], exportAs: ["matSlider"], usesInheritance: true, ngImport: i0, template: "<div class=\"mat-slider-wrapper\" #sliderWrapper>\n  <div class=\"mat-slider-track-wrapper\">\n    <div class=\"mat-slider-track-background\" [ngStyle]=\"_getTrackBackgroundStyles()\"></div>\n    <div class=\"mat-slider-track-fill\" [ngStyle]=\"_getTrackFillStyles()\"></div>\n  </div>\n  <div class=\"mat-slider-ticks-container\" [ngStyle]=\"_getTicksContainerStyles()\">\n    <div class=\"mat-slider-ticks\" [ngStyle]=\"_getTicksStyles()\"></div>\n  </div>\n  <div class=\"mat-slider-thumb-container\" [ngStyle]=\"_getThumbContainerStyles()\">\n    <div class=\"mat-slider-focus-ring\"></div>\n    <div class=\"mat-slider-thumb\"></div>\n    <div class=\"mat-slider-thumb-label\">\n      <span class=\"mat-slider-thumb-label-text\">{{displayValue}}</span>\n    </div>\n  </div>\n</div>\n", styles: [".mat-slider{display:inline-block;position:relative;box-sizing:border-box;padding:8px;outline:none;vertical-align:middle}.mat-slider:not(.mat-slider-disabled):active,.mat-slider.mat-slider-sliding:not(.mat-slider-disabled){cursor:-webkit-grabbing;cursor:grabbing}.mat-slider-wrapper{-webkit-print-color-adjust:exact;color-adjust:exact;position:absolute}.mat-slider-track-wrapper{position:absolute;top:0;left:0;overflow:hidden}.mat-slider-track-fill{position:absolute;transform-origin:0 0;transition:transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1),background-color 400ms cubic-bezier(0.25, 0.8, 0.25, 1)}.mat-slider-track-background{position:absolute;transform-origin:100% 100%;transition:transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1),background-color 400ms cubic-bezier(0.25, 0.8, 0.25, 1)}.mat-slider-ticks-container{position:absolute;left:0;top:0;overflow:hidden}.mat-slider-ticks{-webkit-background-clip:content-box;background-clip:content-box;background-repeat:repeat;box-sizing:border-box;opacity:0;transition:opacity 400ms cubic-bezier(0.25, 0.8, 0.25, 1)}.mat-slider-thumb-container{position:absolute;z-index:1;transition:transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1)}.mat-slider-focus-ring{position:absolute;width:30px;height:30px;border-radius:50%;transform:scale(0);opacity:0;transition:transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1),background-color 400ms cubic-bezier(0.25, 0.8, 0.25, 1),opacity 400ms cubic-bezier(0.25, 0.8, 0.25, 1)}.mat-slider.cdk-keyboard-focused .mat-slider-focus-ring,.mat-slider.cdk-program-focused .mat-slider-focus-ring{transform:scale(1);opacity:1}.mat-slider:not(.mat-slider-disabled):not(.mat-slider-sliding) .mat-slider-thumb-label,.mat-slider:not(.mat-slider-disabled):not(.mat-slider-sliding) .mat-slider-thumb{cursor:-webkit-grab;cursor:grab}.mat-slider-thumb{position:absolute;right:-10px;bottom:-10px;box-sizing:border-box;width:20px;height:20px;border:3px solid transparent;border-radius:50%;transform:scale(0.7);transition:transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1),background-color 400ms cubic-bezier(0.25, 0.8, 0.25, 1),border-color 400ms cubic-bezier(0.25, 0.8, 0.25, 1)}.mat-slider-thumb-label{display:none;align-items:center;justify-content:center;position:absolute;width:28px;height:28px;border-radius:50%;transition:transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1),border-radius 400ms cubic-bezier(0.25, 0.8, 0.25, 1),background-color 400ms cubic-bezier(0.25, 0.8, 0.25, 1)}.cdk-high-contrast-active .mat-slider-thumb-label{outline:solid 1px}.mat-slider-thumb-label-text{z-index:1;opacity:0;transition:opacity 400ms cubic-bezier(0.25, 0.8, 0.25, 1)}.mat-slider-sliding .mat-slider-track-fill,.mat-slider-sliding .mat-slider-track-background,.mat-slider-sliding .mat-slider-thumb-container{transition-duration:0ms}.mat-slider-has-ticks .mat-slider-wrapper::after{content:\"\";position:absolute;border-width:0;border-style:solid;opacity:0;transition:opacity 400ms cubic-bezier(0.25, 0.8, 0.25, 1)}.mat-slider-has-ticks.cdk-focused:not(.mat-slider-hide-last-tick) .mat-slider-wrapper::after,.mat-slider-has-ticks:hover:not(.mat-slider-hide-last-tick) .mat-slider-wrapper::after{opacity:1}.mat-slider-has-ticks.cdk-focused:not(.mat-slider-disabled) .mat-slider-ticks,.mat-slider-has-ticks:hover:not(.mat-slider-disabled) .mat-slider-ticks{opacity:1}.mat-slider-thumb-label-showing .mat-slider-focus-ring{display:none}.mat-slider-thumb-label-showing .mat-slider-thumb-label{display:flex}.mat-slider-axis-inverted .mat-slider-track-fill{transform-origin:100% 100%}.mat-slider-axis-inverted .mat-slider-track-background{transform-origin:0 0}.mat-slider:not(.mat-slider-disabled).cdk-focused.mat-slider-thumb-label-showing .mat-slider-thumb{transform:scale(0)}.mat-slider:not(.mat-slider-disabled).cdk-focused .mat-slider-thumb-label{border-radius:50% 50% 0}.mat-slider:not(.mat-slider-disabled).cdk-focused .mat-slider-thumb-label-text{opacity:1}.mat-slider:not(.mat-slider-disabled).cdk-mouse-focused .mat-slider-thumb,.mat-slider:not(.mat-slider-disabled).cdk-touch-focused .mat-slider-thumb,.mat-slider:not(.mat-slider-disabled).cdk-program-focused .mat-slider-thumb{border-width:2px;transform:scale(1)}.mat-slider-disabled .mat-slider-focus-ring{transform:scale(0);opacity:0}.mat-slider-disabled .mat-slider-thumb{border-width:4px;transform:scale(0.5)}.mat-slider-disabled .mat-slider-thumb-label{display:none}.mat-slider-horizontal{height:48px;min-width:128px}.mat-slider-horizontal .mat-slider-wrapper{height:2px;top:23px;left:8px;right:8px}.mat-slider-horizontal .mat-slider-wrapper::after{height:2px;border-left-width:2px;right:0;top:0}.mat-slider-horizontal .mat-slider-track-wrapper{height:2px;width:100%}.mat-slider-horizontal .mat-slider-track-fill{height:2px;width:100%;transform:scaleX(0)}.mat-slider-horizontal .mat-slider-track-background{height:2px;width:100%;transform:scaleX(1)}.mat-slider-horizontal .mat-slider-ticks-container{height:2px;width:100%}.cdk-high-contrast-active .mat-slider-horizontal .mat-slider-ticks-container{height:0;outline:solid 2px;top:1px}.mat-slider-horizontal .mat-slider-ticks{height:2px;width:100%}.mat-slider-horizontal .mat-slider-thumb-container{width:100%;height:0;top:50%}.mat-slider-horizontal .mat-slider-focus-ring{top:-15px;right:-15px}.mat-slider-horizontal .mat-slider-thumb-label{right:-14px;top:-40px;transform:translateY(26px) scale(0.01) rotate(45deg)}.mat-slider-horizontal .mat-slider-thumb-label-text{transform:rotate(-45deg)}.mat-slider-horizontal.cdk-focused .mat-slider-thumb-label{transform:rotate(45deg)}.cdk-high-contrast-active .mat-slider-horizontal.cdk-focused .mat-slider-thumb-label,.cdk-high-contrast-active .mat-slider-horizontal.cdk-focused .mat-slider-thumb-label-text{transform:none}.mat-slider-vertical{width:48px;min-height:128px}.mat-slider-vertical .mat-slider-wrapper{width:2px;top:8px;bottom:8px;left:23px}.mat-slider-vertical .mat-slider-wrapper::after{width:2px;border-top-width:2px;bottom:0;left:0}.mat-slider-vertical .mat-slider-track-wrapper{height:100%;width:2px}.mat-slider-vertical .mat-slider-track-fill{height:100%;width:2px;transform:scaleY(0)}.mat-slider-vertical .mat-slider-track-background{height:100%;width:2px;transform:scaleY(1)}.mat-slider-vertical .mat-slider-ticks-container{width:2px;height:100%}.cdk-high-contrast-active .mat-slider-vertical .mat-slider-ticks-container{width:0;outline:solid 2px;left:1px}.mat-slider-vertical .mat-slider-focus-ring{bottom:-15px;left:-15px}.mat-slider-vertical .mat-slider-ticks{width:2px;height:100%}.mat-slider-vertical .mat-slider-thumb-container{height:100%;width:0;left:50%}.mat-slider-vertical .mat-slider-thumb{-webkit-backface-visibility:hidden;backface-visibility:hidden}.mat-slider-vertical .mat-slider-thumb-label{bottom:-14px;left:-40px;transform:translateX(26px) scale(0.01) rotate(-45deg)}.mat-slider-vertical .mat-slider-thumb-label-text{transform:rotate(45deg)}.mat-slider-vertical.cdk-focused .mat-slider-thumb-label{transform:rotate(-45deg)}[dir=rtl] .mat-slider-wrapper::after{left:0;right:auto}[dir=rtl] .mat-slider-horizontal .mat-slider-track-fill{transform-origin:100% 100%}[dir=rtl] .mat-slider-horizontal .mat-slider-track-background{transform-origin:0 0}[dir=rtl] .mat-slider-horizontal.mat-slider-axis-inverted .mat-slider-track-fill{transform-origin:0 0}[dir=rtl] .mat-slider-horizontal.mat-slider-axis-inverted .mat-slider-track-background{transform-origin:100% 100%}.mat-slider._mat-animation-noopable .mat-slider-track-fill,.mat-slider._mat-animation-noopable .mat-slider-track-background,.mat-slider._mat-animation-noopable .mat-slider-ticks,.mat-slider._mat-animation-noopable .mat-slider-thumb-container,.mat-slider._mat-animation-noopable .mat-slider-focus-ring,.mat-slider._mat-animation-noopable .mat-slider-thumb,.mat-slider._mat-animation-noopable .mat-slider-thumb-label,.mat-slider._mat-animation-noopable .mat-slider-thumb-label-text,.mat-slider._mat-animation-noopable .mat-slider-has-ticks .mat-slider-wrapper::after{transition:none}\n"], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.1.0", ngImport: i0, type: MatSlider, decorators: [{
            type: Component,
            args: [{ selector: 'mat-slider', exportAs: 'matSlider', providers: [MAT_SLIDER_VALUE_ACCESSOR], host: {
                        '(focus)': '_onFocus()',
                        '(blur)': '_onBlur()',
                        '(keydown)': '_onKeydown($event)',
                        '(keyup)': '_onKeyup()',
                        '(mouseenter)': '_onMouseenter()',
                        // On Safari starting to slide temporarily triggers text selection mode which
                        // show the wrong cursor. We prevent it by stopping the `selectstart` event.
                        '(selectstart)': '$event.preventDefault()',
                        'class': 'mat-slider mat-focus-indicator',
                        'role': 'slider',
                        '[tabIndex]': 'tabIndex',
                        '[attr.aria-disabled]': 'disabled',
                        '[attr.aria-valuemax]': 'max',
                        '[attr.aria-valuemin]': 'min',
                        '[attr.aria-valuenow]': 'value',
                        // NVDA and Jaws appear to announce the `aria-valuenow` by calculating its percentage based
                        // on its value between `aria-valuemin` and `aria-valuemax`. Due to how decimals are handled,
                        // it can cause the slider to read out a very long value like 0.20000068 if the current value
                        // is 0.2 with a min of 0 and max of 1. We work around the issue by setting `aria-valuetext`
                        // to the same value that we set on the slider's thumb which will be truncated.
                        '[attr.aria-valuetext]': 'valueText == null ? displayValue : valueText',
                        '[attr.aria-orientation]': 'vertical ? "vertical" : "horizontal"',
                        '[class.mat-slider-disabled]': 'disabled',
                        '[class.mat-slider-has-ticks]': 'tickInterval',
                        '[class.mat-slider-horizontal]': '!vertical',
                        '[class.mat-slider-axis-inverted]': '_shouldInvertAxis()',
                        // Class binding which is only used by the test harness as there is no other
                        // way for the harness to detect if mouse coordinates need to be inverted.
                        '[class.mat-slider-invert-mouse-coords]': '_shouldInvertMouseCoords()',
                        '[class.mat-slider-sliding]': '_isSliding',
                        '[class.mat-slider-thumb-label-showing]': 'thumbLabel',
                        '[class.mat-slider-vertical]': 'vertical',
                        '[class.mat-slider-min-value]': '_isMinValue()',
                        '[class.mat-slider-hide-last-tick]': 'disabled || _isMinValue() && _getThumbGap() && _shouldInvertAxis()',
                        '[class._mat-animation-noopable]': '_animationMode === "NoopAnimations"',
                    }, inputs: ['disabled', 'color', 'tabIndex'], encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"mat-slider-wrapper\" #sliderWrapper>\n  <div class=\"mat-slider-track-wrapper\">\n    <div class=\"mat-slider-track-background\" [ngStyle]=\"_getTrackBackgroundStyles()\"></div>\n    <div class=\"mat-slider-track-fill\" [ngStyle]=\"_getTrackFillStyles()\"></div>\n  </div>\n  <div class=\"mat-slider-ticks-container\" [ngStyle]=\"_getTicksContainerStyles()\">\n    <div class=\"mat-slider-ticks\" [ngStyle]=\"_getTicksStyles()\"></div>\n  </div>\n  <div class=\"mat-slider-thumb-container\" [ngStyle]=\"_getThumbContainerStyles()\">\n    <div class=\"mat-slider-focus-ring\"></div>\n    <div class=\"mat-slider-thumb\"></div>\n    <div class=\"mat-slider-thumb-label\">\n      <span class=\"mat-slider-thumb-label-text\">{{displayValue}}</span>\n    </div>\n  </div>\n</div>\n", styles: [".mat-slider{display:inline-block;position:relative;box-sizing:border-box;padding:8px;outline:none;vertical-align:middle}.mat-slider:not(.mat-slider-disabled):active,.mat-slider.mat-slider-sliding:not(.mat-slider-disabled){cursor:-webkit-grabbing;cursor:grabbing}.mat-slider-wrapper{-webkit-print-color-adjust:exact;color-adjust:exact;position:absolute}.mat-slider-track-wrapper{position:absolute;top:0;left:0;overflow:hidden}.mat-slider-track-fill{position:absolute;transform-origin:0 0;transition:transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1),background-color 400ms cubic-bezier(0.25, 0.8, 0.25, 1)}.mat-slider-track-background{position:absolute;transform-origin:100% 100%;transition:transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1),background-color 400ms cubic-bezier(0.25, 0.8, 0.25, 1)}.mat-slider-ticks-container{position:absolute;left:0;top:0;overflow:hidden}.mat-slider-ticks{-webkit-background-clip:content-box;background-clip:content-box;background-repeat:repeat;box-sizing:border-box;opacity:0;transition:opacity 400ms cubic-bezier(0.25, 0.8, 0.25, 1)}.mat-slider-thumb-container{position:absolute;z-index:1;transition:transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1)}.mat-slider-focus-ring{position:absolute;width:30px;height:30px;border-radius:50%;transform:scale(0);opacity:0;transition:transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1),background-color 400ms cubic-bezier(0.25, 0.8, 0.25, 1),opacity 400ms cubic-bezier(0.25, 0.8, 0.25, 1)}.mat-slider.cdk-keyboard-focused .mat-slider-focus-ring,.mat-slider.cdk-program-focused .mat-slider-focus-ring{transform:scale(1);opacity:1}.mat-slider:not(.mat-slider-disabled):not(.mat-slider-sliding) .mat-slider-thumb-label,.mat-slider:not(.mat-slider-disabled):not(.mat-slider-sliding) .mat-slider-thumb{cursor:-webkit-grab;cursor:grab}.mat-slider-thumb{position:absolute;right:-10px;bottom:-10px;box-sizing:border-box;width:20px;height:20px;border:3px solid transparent;border-radius:50%;transform:scale(0.7);transition:transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1),background-color 400ms cubic-bezier(0.25, 0.8, 0.25, 1),border-color 400ms cubic-bezier(0.25, 0.8, 0.25, 1)}.mat-slider-thumb-label{display:none;align-items:center;justify-content:center;position:absolute;width:28px;height:28px;border-radius:50%;transition:transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1),border-radius 400ms cubic-bezier(0.25, 0.8, 0.25, 1),background-color 400ms cubic-bezier(0.25, 0.8, 0.25, 1)}.cdk-high-contrast-active .mat-slider-thumb-label{outline:solid 1px}.mat-slider-thumb-label-text{z-index:1;opacity:0;transition:opacity 400ms cubic-bezier(0.25, 0.8, 0.25, 1)}.mat-slider-sliding .mat-slider-track-fill,.mat-slider-sliding .mat-slider-track-background,.mat-slider-sliding .mat-slider-thumb-container{transition-duration:0ms}.mat-slider-has-ticks .mat-slider-wrapper::after{content:\"\";position:absolute;border-width:0;border-style:solid;opacity:0;transition:opacity 400ms cubic-bezier(0.25, 0.8, 0.25, 1)}.mat-slider-has-ticks.cdk-focused:not(.mat-slider-hide-last-tick) .mat-slider-wrapper::after,.mat-slider-has-ticks:hover:not(.mat-slider-hide-last-tick) .mat-slider-wrapper::after{opacity:1}.mat-slider-has-ticks.cdk-focused:not(.mat-slider-disabled) .mat-slider-ticks,.mat-slider-has-ticks:hover:not(.mat-slider-disabled) .mat-slider-ticks{opacity:1}.mat-slider-thumb-label-showing .mat-slider-focus-ring{display:none}.mat-slider-thumb-label-showing .mat-slider-thumb-label{display:flex}.mat-slider-axis-inverted .mat-slider-track-fill{transform-origin:100% 100%}.mat-slider-axis-inverted .mat-slider-track-background{transform-origin:0 0}.mat-slider:not(.mat-slider-disabled).cdk-focused.mat-slider-thumb-label-showing .mat-slider-thumb{transform:scale(0)}.mat-slider:not(.mat-slider-disabled).cdk-focused .mat-slider-thumb-label{border-radius:50% 50% 0}.mat-slider:not(.mat-slider-disabled).cdk-focused .mat-slider-thumb-label-text{opacity:1}.mat-slider:not(.mat-slider-disabled).cdk-mouse-focused .mat-slider-thumb,.mat-slider:not(.mat-slider-disabled).cdk-touch-focused .mat-slider-thumb,.mat-slider:not(.mat-slider-disabled).cdk-program-focused .mat-slider-thumb{border-width:2px;transform:scale(1)}.mat-slider-disabled .mat-slider-focus-ring{transform:scale(0);opacity:0}.mat-slider-disabled .mat-slider-thumb{border-width:4px;transform:scale(0.5)}.mat-slider-disabled .mat-slider-thumb-label{display:none}.mat-slider-horizontal{height:48px;min-width:128px}.mat-slider-horizontal .mat-slider-wrapper{height:2px;top:23px;left:8px;right:8px}.mat-slider-horizontal .mat-slider-wrapper::after{height:2px;border-left-width:2px;right:0;top:0}.mat-slider-horizontal .mat-slider-track-wrapper{height:2px;width:100%}.mat-slider-horizontal .mat-slider-track-fill{height:2px;width:100%;transform:scaleX(0)}.mat-slider-horizontal .mat-slider-track-background{height:2px;width:100%;transform:scaleX(1)}.mat-slider-horizontal .mat-slider-ticks-container{height:2px;width:100%}.cdk-high-contrast-active .mat-slider-horizontal .mat-slider-ticks-container{height:0;outline:solid 2px;top:1px}.mat-slider-horizontal .mat-slider-ticks{height:2px;width:100%}.mat-slider-horizontal .mat-slider-thumb-container{width:100%;height:0;top:50%}.mat-slider-horizontal .mat-slider-focus-ring{top:-15px;right:-15px}.mat-slider-horizontal .mat-slider-thumb-label{right:-14px;top:-40px;transform:translateY(26px) scale(0.01) rotate(45deg)}.mat-slider-horizontal .mat-slider-thumb-label-text{transform:rotate(-45deg)}.mat-slider-horizontal.cdk-focused .mat-slider-thumb-label{transform:rotate(45deg)}.cdk-high-contrast-active .mat-slider-horizontal.cdk-focused .mat-slider-thumb-label,.cdk-high-contrast-active .mat-slider-horizontal.cdk-focused .mat-slider-thumb-label-text{transform:none}.mat-slider-vertical{width:48px;min-height:128px}.mat-slider-vertical .mat-slider-wrapper{width:2px;top:8px;bottom:8px;left:23px}.mat-slider-vertical .mat-slider-wrapper::after{width:2px;border-top-width:2px;bottom:0;left:0}.mat-slider-vertical .mat-slider-track-wrapper{height:100%;width:2px}.mat-slider-vertical .mat-slider-track-fill{height:100%;width:2px;transform:scaleY(0)}.mat-slider-vertical .mat-slider-track-background{height:100%;width:2px;transform:scaleY(1)}.mat-slider-vertical .mat-slider-ticks-container{width:2px;height:100%}.cdk-high-contrast-active .mat-slider-vertical .mat-slider-ticks-container{width:0;outline:solid 2px;left:1px}.mat-slider-vertical .mat-slider-focus-ring{bottom:-15px;left:-15px}.mat-slider-vertical .mat-slider-ticks{width:2px;height:100%}.mat-slider-vertical .mat-slider-thumb-container{height:100%;width:0;left:50%}.mat-slider-vertical .mat-slider-thumb{-webkit-backface-visibility:hidden;backface-visibility:hidden}.mat-slider-vertical .mat-slider-thumb-label{bottom:-14px;left:-40px;transform:translateX(26px) scale(0.01) rotate(-45deg)}.mat-slider-vertical .mat-slider-thumb-label-text{transform:rotate(45deg)}.mat-slider-vertical.cdk-focused .mat-slider-thumb-label{transform:rotate(-45deg)}[dir=rtl] .mat-slider-wrapper::after{left:0;right:auto}[dir=rtl] .mat-slider-horizontal .mat-slider-track-fill{transform-origin:100% 100%}[dir=rtl] .mat-slider-horizontal .mat-slider-track-background{transform-origin:0 0}[dir=rtl] .mat-slider-horizontal.mat-slider-axis-inverted .mat-slider-track-fill{transform-origin:0 0}[dir=rtl] .mat-slider-horizontal.mat-slider-axis-inverted .mat-slider-track-background{transform-origin:100% 100%}.mat-slider._mat-animation-noopable .mat-slider-track-fill,.mat-slider._mat-animation-noopable .mat-slider-track-background,.mat-slider._mat-animation-noopable .mat-slider-ticks,.mat-slider._mat-animation-noopable .mat-slider-thumb-container,.mat-slider._mat-animation-noopable .mat-slider-focus-ring,.mat-slider._mat-animation-noopable .mat-slider-thumb,.mat-slider._mat-animation-noopable .mat-slider-thumb-label,.mat-slider._mat-animation-noopable .mat-slider-thumb-label-text,.mat-slider._mat-animation-noopable .mat-slider-has-ticks .mat-slider-wrapper::after{transition:none}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i1.FocusMonitor }, { type: i0.ChangeDetectorRef }, { type: i2.Directionality, decorators: [{
                    type: Optional
                }] }, { type: undefined, decorators: [{
                    type: Attribute,
                    args: ['tabindex']
                }] }, { type: i0.NgZone }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [ANIMATION_MODULE_TYPE]
                }] }]; }, propDecorators: { invert: [{
                type: Input
            }], max: [{
                type: Input
            }], min: [{
                type: Input
            }], step: [{
                type: Input
            }], thumbLabel: [{
                type: Input
            }], tickInterval: [{
                type: Input
            }], value: [{
                type: Input
            }], displayWith: [{
                type: Input
            }], valueText: [{
                type: Input
            }], vertical: [{
                type: Input
            }], change: [{
                type: Output
            }], input: [{
                type: Output
            }], valueChange: [{
                type: Output
            }], _sliderWrapper: [{
                type: ViewChild,
                args: ['sliderWrapper']
            }] } });
/** Returns whether an event is a touch event. */
function isTouchEvent(event) {
    // This function is called for every pixel that the user has dragged so we need it to be
    // as fast as possible. Since we only bind mouse events and touch events, we can assume
    // that if the event's name starts with `t`, it's a touch event.
    return event.type[0] === 't';
}
/** Gets the coordinates of a touch or mouse event relative to the viewport. */
function getPointerPositionOnPage(event, id) {
    let point;
    if (isTouchEvent(event)) {
        // The `identifier` could be undefined if the browser doesn't support `TouchEvent.identifier`.
        // If that's the case, attribute the first touch to all active sliders. This should still cover
        // the most common case while only breaking multi-touch.
        if (typeof id === 'number') {
            point = findMatchingTouch(event.touches, id) || findMatchingTouch(event.changedTouches, id);
        }
        else {
            // `touches` will be empty for start/end events so we have to fall back to `changedTouches`.
            point = event.touches[0] || event.changedTouches[0];
        }
    }
    else {
        point = event;
    }
    return point ? { x: point.clientX, y: point.clientY } : undefined;
}
/** Finds a `Touch` with a specific ID in a `TouchList`. */
function findMatchingTouch(touches, id) {
    for (let i = 0; i < touches.length; i++) {
        if (touches[i].identifier === id) {
            return touches[i];
        }
    }
    return undefined;
}
/** Gets the unique ID of a touch that matches a specific slider. */
function getTouchIdForSlider(event, sliderHost) {
    for (let i = 0; i < event.touches.length; i++) {
        const target = event.touches[i].target;
        if (sliderHost === target || sliderHost.contains(target)) {
            return event.touches[i].identifier;
        }
    }
    return undefined;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2xpZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21hdGVyaWFsL3NsaWRlci9zbGlkZXIudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWF0ZXJpYWwvc2xpZGVyL3NsaWRlci5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQWMsTUFBTSxtQkFBbUIsQ0FBQztBQUM1RCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUVMLHFCQUFxQixFQUNyQixvQkFBb0IsR0FFckIsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQ0wsVUFBVSxFQUNWLEdBQUcsRUFDSCxJQUFJLEVBQ0osVUFBVSxFQUNWLFNBQVMsRUFDVCxPQUFPLEVBQ1AsV0FBVyxFQUNYLFFBQVEsRUFDUixjQUFjLEdBQ2YsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQ0wsU0FBUyxFQUNULHVCQUF1QixFQUN2QixpQkFBaUIsRUFDakIsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osVUFBVSxFQUNWLE1BQU0sRUFDTixLQUFLLEVBRUwsUUFBUSxFQUNSLE1BQU0sRUFDTixTQUFTLEVBQ1QsaUJBQWlCLEVBQ2pCLE1BQU0sR0FFUCxNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQXVCLGlCQUFpQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDdkUsT0FBTyxFQUlMLFVBQVUsRUFDVixhQUFhLEVBQ2IsYUFBYSxHQUNkLE1BQU0sd0JBQXdCLENBQUM7QUFDaEMsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDM0UsT0FBTyxFQUFDLCtCQUErQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdEUsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pDLE9BQU8s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RSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDN0MsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFxQixDQUFDO1FBRXRELElBQUksVUFBVSxLQUFLLE1BQU0sSUFBSSxVQUFVLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3hELE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7U0FDcEM7S0FDRjtJQUVELE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtGb2N1c01vbml0b3IsIEZvY3VzT3JpZ2lufSBmcm9tICdAYW5ndWxhci9jZGsvYTExeSc7XG5pbXBvcnQge0RpcmVjdGlvbmFsaXR5fSBmcm9tICdAYW5ndWxhci9jZGsvYmlkaSc7XG5pbXBvcnQge1xuICBCb29sZWFuSW5wdXQsXG4gIGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSxcbiAgY29lcmNlTnVtYmVyUHJvcGVydHksXG4gIE51bWJlcklucHV0LFxufSBmcm9tICdAYW5ndWxhci9jZGsvY29lcmNpb24nO1xuaW1wb3J0IHtcbiAgRE9XTl9BUlJPVyxcbiAgRU5ELFxuICBIT01FLFxuICBMRUZUX0FSUk9XLFxuICBQQUdFX0RPV04sXG4gIFBBR0VfVVAsXG4gIFJJR0hUX0FSUk9XLFxuICBVUF9BUlJPVyxcbiAgaGFzTW9kaWZpZXJLZXksXG59IGZyb20gJ0Bhbmd1bGFyL2Nkay9rZXljb2Rlcyc7XG5pbXBvcnQge1xuICBBdHRyaWJ1dGUsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIGZvcndhcmRSZWYsXG4gIEluamVjdCxcbiAgSW5wdXQsXG4gIE9uRGVzdHJveSxcbiAgT3B0aW9uYWwsXG4gIE91dHB1dCxcbiAgVmlld0NoaWxkLFxuICBWaWV3RW5jYXBzdWxhdGlvbixcbiAgTmdab25lLFxuICBBZnRlclZpZXdJbml0LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7Q29udHJvbFZhbHVlQWNjZXNzb3IsIE5HX1ZBTFVFX0FDQ0VTU09SfSBmcm9tICdAYW5ndWxhci9mb3Jtcyc7XG5pbXBvcnQge1xuICBDYW5Db2xvcixcbiAgQ2FuRGlzYWJsZSxcbiAgSGFzVGFiSW5kZXgsXG4gIG1peGluQ29sb3IsXG4gIG1peGluRGlzYWJsZWQsXG4gIG1peGluVGFiSW5kZXgsXG59IGZyb20gJ0Bhbmd1bGFyL21hdGVyaWFsL2NvcmUnO1xuaW1wb3J0IHtBTklNQVRJT05fTU9EVUxFX1RZUEV9IGZyb20gJ0Bhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXIvYW5pbWF0aW9ucyc7XG5pbXBvcnQge25vcm1hbGl6ZVBhc3NpdmVMaXN0ZW5lck9wdGlvbnN9IGZyb20gJ0Bhbmd1bGFyL2Nkay9wbGF0Zm9ybSc7XG5pbXBvcnQge0RPQ1VNRU5UfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHtTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuXG5jb25zdCBhY3RpdmVFdmVudE9wdGlvbnMgPSBub3JtYWxpemVQYXNzaXZlTGlzdGVuZXJPcHRpb25zKHtwYXNzaXZlOiBmYWxzZX0pO1xuXG4vKipcbiAqIFZpc3VhbGx5LCBhIDMwcHggc2VwYXJhdGlvbiBiZXR3ZWVuIHRpY2sgbWFya3MgbG9va3MgYmVzdC4gVGhpcyBpcyB2ZXJ5IHN1YmplY3RpdmUgYnV0IGl0IGlzXG4gKiB0aGUgZGVmYXVsdCBzZXBhcmF0aW9uIHdlIGNob3NlLlxuICovXG5jb25zdCBNSU5fQVVUT19USUNLX1NFUEFSQVRJT04gPSAzMDtcblxuLyoqIFRoZSB0aHVtYiBnYXAgc2l6ZSBmb3IgYSBkaXNhYmxlZCBzbGlkZXIuICovXG5jb25zdCBESVNBQkxFRF9USFVNQl9HQVAgPSA3O1xuXG4vKiogVGhlIHRodW1iIGdhcCBzaXplIGZvciBhIG5vbi1hY3RpdmUgc2xpZGVyIGF0IGl0cyBtaW5pbXVtIHZhbHVlLiAqL1xuY29uc3QgTUlOX1ZBTFVFX05PTkFDVElWRV9USFVNQl9HQVAgPSA3O1xuXG4vKiogVGhlIHRodW1iIGdhcCBzaXplIGZvciBhbiBhY3RpdmUgc2xpZGVyIGF0IGl0cyBtaW5pbXVtIHZhbHVlLiAqL1xuY29uc3QgTUlOX1ZBTFVFX0FDVElWRV9USFVNQl9HQVAgPSAxMDtcblxuLyoqXG4gKiBQcm92aWRlciBFeHByZXNzaW9uIHRoYXQgYWxsb3dzIG1hdC1zbGlkZXIgdG8gcmVnaXN0ZXIgYXMgYSBDb250cm9sVmFsdWVBY2Nlc3Nvci5cbiAqIFRoaXMgYWxsb3dzIGl0IHRvIHN1cHBvcnQgWyhuZ01vZGVsKV0gYW5kIFtmb3JtQ29udHJvbF0uXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBjb25zdCBNQVRfU0xJREVSX1ZBTFVFX0FDQ0VTU09SOiBhbnkgPSB7XG4gIHByb3ZpZGU6IE5HX1ZBTFVFX0FDQ0VTU09SLFxuICB1c2VFeGlzdGluZzogZm9yd2FyZFJlZigoKSA9PiBNYXRTbGlkZXIpLFxuICBtdWx0aTogdHJ1ZSxcbn07XG5cbi8qKiBBIHNpbXBsZSBjaGFuZ2UgZXZlbnQgZW1pdHRlZCBieSB0aGUgTWF0U2xpZGVyIGNvbXBvbmVudC4gKi9cbmV4cG9ydCBjbGFzcyBNYXRTbGlkZXJDaGFuZ2Uge1xuICAvKiogVGhlIE1hdFNsaWRlciB0aGF0IGNoYW5nZWQuICovXG4gIHNvdXJjZTogTWF0U2xpZGVyO1xuXG4gIC8qKiBUaGUgbmV3IHZhbHVlIG9mIHRoZSBzb3VyY2Ugc2xpZGVyLiAqL1xuICB2YWx1ZTogbnVtYmVyIHwgbnVsbDtcbn1cblxuLy8gQm9pbGVycGxhdGUgZm9yIGFwcGx5aW5nIG1peGlucyB0byBNYXRTbGlkZXIuXG4vKiogQGRvY3MtcHJpdmF0ZSAqL1xuY29uc3QgX01hdFNsaWRlckJhc2UgPSBtaXhpblRhYkluZGV4KFxuICBtaXhpbkNvbG9yKFxuICAgIG1peGluRGlzYWJsZWQoXG4gICAgICBjbGFzcyB7XG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBfZWxlbWVudFJlZjogRWxlbWVudFJlZikge31cbiAgICAgIH0sXG4gICAgKSxcbiAgICAnYWNjZW50JyxcbiAgKSxcbik7XG5cbi8qKlxuICogQWxsb3dzIHVzZXJzIHRvIHNlbGVjdCBmcm9tIGEgcmFuZ2Ugb2YgdmFsdWVzIGJ5IG1vdmluZyB0aGUgc2xpZGVyIHRodW1iLiBJdCBpcyBzaW1pbGFyIGluXG4gKiBiZWhhdmlvciB0byB0aGUgbmF0aXZlIGA8aW5wdXQgdHlwZT1cInJhbmdlXCI+YCBlbGVtZW50LlxuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdtYXQtc2xpZGVyJyxcbiAgZXhwb3J0QXM6ICdtYXRTbGlkZXInLFxuICBwcm92aWRlcnM6IFtNQVRfU0xJREVSX1ZBTFVFX0FDQ0VTU09SXSxcbiAgaG9zdDoge1xuICAgICcoZm9jdXMpJzogJ19vbkZvY3VzKCknLFxuICAgICcoYmx1ciknOiAnX29uQmx1cigpJyxcbiAgICAnKGtleWRvd24pJzogJ19vbktleWRvd24oJGV2ZW50KScsXG4gICAgJyhrZXl1cCknOiAnX29uS2V5dXAoKScsXG4gICAgJyhtb3VzZWVudGVyKSc6ICdfb25Nb3VzZWVudGVyKCknLFxuXG4gICAgLy8gT24gU2FmYXJpIHN0YXJ0aW5nIHRvIHNsaWRlIHRlbXBvcmFyaWx5IHRyaWdnZXJzIHRleHQgc2VsZWN0aW9uIG1vZGUgd2hpY2hcbiAgICAvLyBzaG93IHRoZSB3cm9uZyBjdXJzb3IuIFdlIHByZXZlbnQgaXQgYnkgc3RvcHBpbmcgdGhlIGBzZWxlY3RzdGFydGAgZXZlbnQuXG4gICAgJyhzZWxlY3RzdGFydCknOiAnJGV2ZW50LnByZXZlbnREZWZhdWx0KCknLFxuICAgICdjbGFzcyc6ICdtYXQtc2xpZGVyIG1hdC1mb2N1cy1pbmRpY2F0b3InLFxuICAgICdyb2xlJzogJ3NsaWRlcicsXG4gICAgJ1t0YWJJbmRleF0nOiAndGFiSW5kZXgnLFxuICAgICdbYXR0ci5hcmlhLWRpc2FibGVkXSc6ICdkaXNhYmxlZCcsXG4gICAgJ1thdHRyLmFyaWEtdmFsdWVtYXhdJzogJ21heCcsXG4gICAgJ1thdHRyLmFyaWEtdmFsdWVtaW5dJzogJ21pbicsXG4gICAgJ1thdHRyLmFyaWEtdmFsdWVub3ddJzogJ3ZhbHVlJyxcblxuICAgIC8vIE5WREEgYW5kIEphd3MgYXBwZWFyIHRvIGFubm91bmNlIHRoZSBgYXJpYS12YWx1ZW5vd2AgYnkgY2FsY3VsYXRpbmcgaXRzIHBlcmNlbnRhZ2UgYmFzZWRcbiAgICAvLyBvbiBpdHMgdmFsdWUgYmV0d2VlbiBgYXJpYS12YWx1ZW1pbmAgYW5kIGBhcmlhLXZhbHVlbWF4YC4gRHVlIHRvIGhvdyBkZWNpbWFscyBhcmUgaGFuZGxlZCxcbiAgICAvLyBpdCBjYW4gY2F1c2UgdGhlIHNsaWRlciB0byByZWFkIG91dCBhIHZlcnkgbG9uZyB2YWx1ZSBsaWtlIDAuMjAwMDAwNjggaWYgdGhlIGN1cnJlbnQgdmFsdWVcbiAgICAvLyBpcyAwLjIgd2l0aCBhIG1pbiBvZiAwIGFuZCBtYXggb2YgMS4gV2Ugd29yayBhcm91bmQgdGhlIGlzc3VlIGJ5IHNldHRpbmcgYGFyaWEtdmFsdWV0ZXh0YFxuICAgIC8vIHRvIHRoZSBzYW1lIHZhbHVlIHRoYXQgd2Ugc2V0IG9uIHRoZSBzbGlkZXIncyB0aHVtYiB3aGljaCB3aWxsIGJlIHRydW5jYXRlZC5cbiAgICAnW2F0dHIuYXJpYS12YWx1ZXRleHRdJzogJ3ZhbHVlVGV4dCA9PSBudWxsID8gZGlzcGxheVZhbHVlIDogdmFsdWVUZXh0JyxcbiAgICAnW2F0dHIuYXJpYS1vcmllbnRhdGlvbl0nOiAndmVydGljYWwgPyBcInZlcnRpY2FsXCIgOiBcImhvcml6b250YWxcIicsXG4gICAgJ1tjbGFzcy5tYXQtc2xpZGVyLWRpc2FibGVkXSc6ICdkaXNhYmxlZCcsXG4gICAgJ1tjbGFzcy5tYXQtc2xpZGVyLWhhcy10aWNrc10nOiAndGlja0ludGVydmFsJyxcbiAgICAnW2NsYXNzLm1hdC1zbGlkZXItaG9yaXpvbnRhbF0nOiAnIXZlcnRpY2FsJyxcbiAgICAnW2NsYXNzLm1hdC1zbGlkZXItYXhpcy1pbnZlcnRlZF0nOiAnX3Nob3VsZEludmVydEF4aXMoKScsXG4gICAgLy8gQ2xhc3MgYmluZGluZyB3aGljaCBpcyBvbmx5IHVzZWQgYnkgdGhlIHRlc3QgaGFybmVzcyBhcyB0aGVyZSBpcyBubyBvdGhlclxuICAgIC8vIHdheSBmb3IgdGhlIGhhcm5lc3MgdG8gZGV0ZWN0IGlmIG1vdXNlIGNvb3JkaW5hdGVzIG5lZWQgdG8gYmUgaW52ZXJ0ZWQuXG4gICAgJ1tjbGFzcy5tYXQtc2xpZGVyLWludmVydC1tb3VzZS1jb29yZHNdJzogJ19zaG91bGRJbnZlcnRNb3VzZUNvb3JkcygpJyxcbiAgICAnW2NsYXNzLm1hdC1zbGlkZXItc2xpZGluZ10nOiAnX2lzU2xpZGluZycsXG4gICAgJ1tjbGFzcy5tYXQtc2xpZGVyLXRodW1iLWxhYmVsLXNob3dpbmddJzogJ3RodW1iTGFiZWwnLFxuICAgICdbY2xhc3MubWF0LXNsaWRlci12ZXJ0aWNhbF0nOiAndmVydGljYWwnLFxuICAgICdbY2xhc3MubWF0LXNsaWRlci1taW4tdmFsdWVdJzogJ19pc01pblZhbHVlKCknLFxuICAgICdbY2xhc3MubWF0LXNsaWRlci1oaWRlLWxhc3QtdGlja10nOlxuICAgICAgJ2Rpc2FibGVkIHx8IF9pc01pblZhbHVlKCkgJiYgX2dldFRodW1iR2FwKCkgJiYgX3Nob3VsZEludmVydEF4aXMoKScsXG4gICAgJ1tjbGFzcy5fbWF0LWFuaW1hdGlvbi1ub29wYWJsZV0nOiAnX2FuaW1hdGlvbk1vZGUgPT09IFwiTm9vcEFuaW1hdGlvbnNcIicsXG4gIH0sXG4gIHRlbXBsYXRlVXJsOiAnc2xpZGVyLmh0bWwnLFxuICBzdHlsZVVybHM6IFsnc2xpZGVyLmNzcyddLFxuICBpbnB1dHM6IFsnZGlzYWJsZWQnLCAnY29sb3InLCAndGFiSW5kZXgnXSxcbiAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIE1hdFNsaWRlclxuICBleHRlbmRzIF9NYXRTbGlkZXJCYXNlXG4gIGltcGxlbWVudHMgQ29udHJvbFZhbHVlQWNjZXNzb3IsIE9uRGVzdHJveSwgQ2FuRGlzYWJsZSwgQ2FuQ29sb3IsIEFmdGVyVmlld0luaXQsIEhhc1RhYkluZGV4XG57XG4gIC8qKiBXaGV0aGVyIHRoZSBzbGlkZXIgaXMgaW52ZXJ0ZWQuICovXG4gIEBJbnB1dCgpXG4gIGdldCBpbnZlcnQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2ludmVydDtcbiAgfVxuICBzZXQgaW52ZXJ0KHZhbHVlOiBCb29sZWFuSW5wdXQpIHtcbiAgICB0aGlzLl9pbnZlcnQgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIHByaXZhdGUgX2ludmVydCA9IGZhbHNlO1xuXG4gIC8qKiBUaGUgbWF4aW11bSB2YWx1ZSB0aGF0IHRoZSBzbGlkZXIgY2FuIGhhdmUuICovXG4gIEBJbnB1dCgpXG4gIGdldCBtYXgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fbWF4O1xuICB9XG4gIHNldCBtYXgodjogTnVtYmVySW5wdXQpIHtcbiAgICB0aGlzLl9tYXggPSBjb2VyY2VOdW1iZXJQcm9wZXJ0eSh2LCB0aGlzLl9tYXgpO1xuICAgIHRoaXMuX3BlcmNlbnQgPSB0aGlzLl9jYWxjdWxhdGVQZXJjZW50YWdlKHRoaXMuX3ZhbHVlKTtcblxuICAgIC8vIFNpbmNlIHRoaXMgYWxzbyBtb2RpZmllcyB0aGUgcGVyY2VudGFnZSwgd2UgbmVlZCB0byBsZXQgdGhlIGNoYW5nZSBkZXRlY3Rpb24ga25vdy5cbiAgICB0aGlzLl9jaGFuZ2VEZXRlY3RvclJlZi5tYXJrRm9yQ2hlY2soKTtcbiAgfVxuICBwcml2YXRlIF9tYXg6IG51bWJlciA9IDEwMDtcblxuICAvKiogVGhlIG1pbmltdW0gdmFsdWUgdGhhdCB0aGUgc2xpZGVyIGNhbiBoYXZlLiAqL1xuICBASW5wdXQoKVxuICBnZXQgbWluKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX21pbjtcbiAgfVxuICBzZXQgbWluKHY6IE51bWJlcklucHV0KSB7XG4gICAgdGhpcy5fbWluID0gY29lcmNlTnVtYmVyUHJvcGVydHkodiwgdGhpcy5fbWluKTtcbiAgICB0aGlzLl9wZXJjZW50ID0gdGhpcy5fY2FsY3VsYXRlUGVyY2VudGFnZSh0aGlzLl92YWx1ZSk7XG5cbiAgICAvLyBTaW5jZSB0aGlzIGFsc28gbW9kaWZpZXMgdGhlIHBlcmNlbnRhZ2UsIHdlIG5lZWQgdG8gbGV0IHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIGtub3cuXG4gICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gIH1cbiAgcHJpdmF0ZSBfbWluOiBudW1iZXIgPSAwO1xuXG4gIC8qKiBUaGUgdmFsdWVzIGF0IHdoaWNoIHRoZSB0aHVtYiB3aWxsIHNuYXAuICovXG4gIEBJbnB1dCgpXG4gIGdldCBzdGVwKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3N0ZXA7XG4gIH1cbiAgc2V0IHN0ZXAodjogTnVtYmVySW5wdXQpIHtcbiAgICB0aGlzLl9zdGVwID0gY29lcmNlTnVtYmVyUHJvcGVydHkodiwgdGhpcy5fc3RlcCk7XG5cbiAgICBpZiAodGhpcy5fc3RlcCAlIDEgIT09IDApIHtcbiAgICAgIHRoaXMuX3JvdW5kVG9EZWNpbWFsID0gdGhpcy5fc3RlcC50b1N0cmluZygpLnNwbGl0KCcuJykucG9wKCkhLmxlbmd0aDtcbiAgICB9XG5cbiAgICAvLyBTaW5jZSB0aGlzIGNvdWxkIG1vZGlmeSB0aGUgbGFiZWwsIHdlIG5lZWQgdG8gbm90aWZ5IHRoZSBjaGFuZ2UgZGV0ZWN0aW9uLlxuICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICB9XG4gIHByaXZhdGUgX3N0ZXA6IG51bWJlciA9IDE7XG5cbiAgLyoqIFdoZXRoZXIgb3Igbm90IHRvIHNob3cgdGhlIHRodW1iIGxhYmVsLiAqL1xuICBASW5wdXQoKVxuICBnZXQgdGh1bWJMYWJlbCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fdGh1bWJMYWJlbDtcbiAgfVxuICBzZXQgdGh1bWJMYWJlbCh2YWx1ZTogQm9vbGVhbklucHV0KSB7XG4gICAgdGhpcy5fdGh1bWJMYWJlbCA9IGNvZXJjZUJvb2xlYW5Qcm9wZXJ0eSh2YWx1ZSk7XG4gIH1cbiAgcHJpdmF0ZSBfdGh1bWJMYWJlbDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBIb3cgb2Z0ZW4gdG8gc2hvdyB0aWNrcy4gUmVsYXRpdmUgdG8gdGhlIHN0ZXAgc28gdGhhdCBhIHRpY2sgYWx3YXlzIGFwcGVhcnMgb24gYSBzdGVwLlxuICAgKiBFeDogVGljayBpbnRlcnZhbCBvZiA0IHdpdGggYSBzdGVwIG9mIDMgd2lsbCBkcmF3IGEgdGljayBldmVyeSA0IHN0ZXBzIChldmVyeSAxMiB2YWx1ZXMpLlxuICAgKi9cbiAgQElucHV0KClcbiAgZ2V0IHRpY2tJbnRlcnZhbCgpOiAnYXV0bycgfCBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl90aWNrSW50ZXJ2YWw7XG4gIH1cbiAgc2V0IHRpY2tJbnRlcnZhbCh2YWx1ZTogJ2F1dG8nIHwgTnVtYmVySW5wdXQpIHtcbiAgICBpZiAodmFsdWUgPT09ICdhdXRvJykge1xuICAgICAgdGhpcy5fdGlja0ludGVydmFsID0gJ2F1dG8nO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyB8fCB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLl90aWNrSW50ZXJ2YWwgPSBjb2VyY2VOdW1iZXJQcm9wZXJ0eSh2YWx1ZSwgdGhpcy5fdGlja0ludGVydmFsIGFzIG51bWJlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3RpY2tJbnRlcnZhbCA9IDA7XG4gICAgfVxuICB9XG4gIHByaXZhdGUgX3RpY2tJbnRlcnZhbDogJ2F1dG8nIHwgbnVtYmVyID0gMDtcblxuICAvKiogVmFsdWUgb2YgdGhlIHNsaWRlci4gKi9cbiAgQElucHV0KClcbiAgZ2V0IHZhbHVlKCk6IG51bWJlciB7XG4gICAgLy8gSWYgdGhlIHZhbHVlIG5lZWRzIHRvIGJlIHJlYWQgYW5kIGl0IGlzIHN0aWxsIHVuaW5pdGlhbGl6ZWQsIGluaXRpYWxpemUgaXQgdG8gdGhlIG1pbi5cbiAgICBpZiAodGhpcy5fdmFsdWUgPT09IG51bGwpIHtcbiAgICAgIHRoaXMudmFsdWUgPSB0aGlzLl9taW47XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl92YWx1ZSBhcyBudW1iZXI7XG4gIH1cbiAgc2V0IHZhbHVlKHY6IE51bWJlcklucHV0KSB7XG4gICAgaWYgKHYgIT09IHRoaXMuX3ZhbHVlKSB7XG4gICAgICBsZXQgdmFsdWUgPSBjb2VyY2VOdW1iZXJQcm9wZXJ0eSh2LCAwKTtcblxuICAgICAgLy8gV2hpbGUgaW5jcmVtZW50aW5nIGJ5IGEgZGVjaW1hbCB3ZSBjYW4gZW5kIHVwIHdpdGggdmFsdWVzIGxpa2UgMzMuMzAwMDAwMDAwMDAwMDA0LlxuICAgICAgLy8gVHJ1bmNhdGUgaXQgdG8gZW5zdXJlIHRoYXQgaXQgbWF0Y2hlcyB0aGUgbGFiZWwgYW5kIHRvIG1ha2UgaXQgZWFzaWVyIHRvIHdvcmsgd2l0aC5cbiAgICAgIGlmICh0aGlzLl9yb3VuZFRvRGVjaW1hbCAmJiB2YWx1ZSAhPT0gdGhpcy5taW4gJiYgdmFsdWUgIT09IHRoaXMubWF4KSB7XG4gICAgICAgIHZhbHVlID0gcGFyc2VGbG9hdCh2YWx1ZS50b0ZpeGVkKHRoaXMuX3JvdW5kVG9EZWNpbWFsKSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICB0aGlzLl9wZXJjZW50ID0gdGhpcy5fY2FsY3VsYXRlUGVyY2VudGFnZSh0aGlzLl92YWx1ZSk7XG5cbiAgICAgIC8vIFNpbmNlIHRoaXMgYWxzbyBtb2RpZmllcyB0aGUgcGVyY2VudGFnZSwgd2UgbmVlZCB0byBsZXQgdGhlIGNoYW5nZSBkZXRlY3Rpb24ga25vdy5cbiAgICAgIHRoaXMuX2NoYW5nZURldGVjdG9yUmVmLm1hcmtGb3JDaGVjaygpO1xuICAgIH1cbiAgfVxuICBwcml2YXRlIF92YWx1ZTogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgLyoqXG4gICAqIEZ1bmN0aW9uIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGZvcm1hdCB0aGUgdmFsdWUgYmVmb3JlIGl0IGlzIGRpc3BsYXllZFxuICAgKiBpbiB0aGUgdGh1bWIgbGFiZWwuIENhbiBiZSB1c2VkIHRvIGZvcm1hdCB2ZXJ5IGxhcmdlIG51bWJlciBpbiBvcmRlclxuICAgKiBmb3IgdGhlbSB0byBmaXQgaW50byB0aGUgc2xpZGVyIHRodW1iLlxuICAgKi9cbiAgQElucHV0KCkgZGlzcGxheVdpdGg6ICh2YWx1ZTogbnVtYmVyKSA9PiBzdHJpbmcgfCBudW1iZXI7XG5cbiAgLyoqIFRleHQgY29ycmVzcG9uZGluZyB0byB0aGUgc2xpZGVyJ3MgdmFsdWUuIFVzZWQgcHJpbWFyaWx5IGZvciBpbXByb3ZlZCBhY2Nlc3NpYmlsaXR5LiAqL1xuICBASW5wdXQoKSB2YWx1ZVRleHQ6IHN0cmluZztcblxuICAvKiogV2hldGhlciB0aGUgc2xpZGVyIGlzIHZlcnRpY2FsLiAqL1xuICBASW5wdXQoKVxuICBnZXQgdmVydGljYWwoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX3ZlcnRpY2FsO1xuICB9XG4gIHNldCB2ZXJ0aWNhbCh2YWx1ZTogQm9vbGVhbklucHV0KSB7XG4gICAgdGhpcy5fdmVydGljYWwgPSBjb2VyY2VCb29sZWFuUHJvcGVydHkodmFsdWUpO1xuICB9XG4gIHByaXZhdGUgX3ZlcnRpY2FsID0gZmFsc2U7XG5cbiAgLyoqIEV2ZW50IGVtaXR0ZWQgd2hlbiB0aGUgc2xpZGVyIHZhbHVlIGhhcyBjaGFuZ2VkLiAqL1xuICBAT3V0cHV0KCkgcmVhZG9ubHkgY2hhbmdlOiBFdmVudEVtaXR0ZXI8TWF0U2xpZGVyQ2hhbmdlPiA9IG5ldyBFdmVudEVtaXR0ZXI8TWF0U2xpZGVyQ2hhbmdlPigpO1xuXG4gIC8qKiBFdmVudCBlbWl0dGVkIHdoZW4gdGhlIHNsaWRlciB0aHVtYiBtb3Zlcy4gKi9cbiAgQE91dHB1dCgpIHJlYWRvbmx5IGlucHV0OiBFdmVudEVtaXR0ZXI8TWF0U2xpZGVyQ2hhbmdlPiA9IG5ldyBFdmVudEVtaXR0ZXI8TWF0U2xpZGVyQ2hhbmdlPigpO1xuXG4gIC8qKlxuICAgKiBFbWl0cyB3aGVuIHRoZSByYXcgdmFsdWUgb2YgdGhlIHNsaWRlciBjaGFuZ2VzLiBUaGlzIGlzIGhlcmUgcHJpbWFyaWx5XG4gICAqIHRvIGZhY2lsaXRhdGUgdGhlIHR3by13YXkgYmluZGluZyBmb3IgdGhlIGB2YWx1ZWAgaW5wdXQuXG4gICAqIEBkb2NzLXByaXZhdGVcbiAgICovXG4gIEBPdXRwdXQoKSByZWFkb25seSB2YWx1ZUNoYW5nZTogRXZlbnRFbWl0dGVyPG51bWJlciB8IG51bGw+ID0gbmV3IEV2ZW50RW1pdHRlcjxudW1iZXIgfCBudWxsPigpO1xuXG4gIC8qKiBUaGUgdmFsdWUgdG8gYmUgdXNlZCBmb3IgZGlzcGxheSBwdXJwb3Nlcy4gKi9cbiAgZ2V0IGRpc3BsYXlWYWx1ZSgpOiBzdHJpbmcgfCBudW1iZXIge1xuICAgIGlmICh0aGlzLmRpc3BsYXlXaXRoKSB7XG4gICAgICAvLyBWYWx1ZSBpcyBuZXZlciBudWxsIGJ1dCBzaW5jZSBzZXR0ZXJzIGFuZCBnZXR0ZXJzIGNhbm5vdCBoYXZlXG4gICAgICAvLyBkaWZmZXJlbnQgdHlwZXMsIHRoZSB2YWx1ZSBnZXR0ZXIgaXMgYWxzbyB0eXBlZCB0byByZXR1cm4gbnVsbC5cbiAgICAgIHJldHVybiB0aGlzLmRpc3BsYXlXaXRoKHRoaXMudmFsdWUhKTtcbiAgICB9XG5cbiAgICAvLyBOb3RlIHRoYXQgdGhpcyBjb3VsZCBiZSBpbXByb3ZlZCBmdXJ0aGVyIGJ5IHJvdW5kaW5nIHNvbWV0aGluZyBsaWtlIDAuOTk5IHRvIDEgb3JcbiAgICAvLyAwLjg5OSB0byAwLjksIGhvd2V2ZXIgaXQgaXMgdmVyeSBwZXJmb3JtYW5jZSBzZW5zaXRpdmUsIGJlY2F1c2UgaXQgZ2V0cyBjYWxsZWQgb25cbiAgICAvLyBldmVyeSBjaGFuZ2UgZGV0ZWN0aW9uIGN5Y2xlLlxuICAgIGlmICh0aGlzLl9yb3VuZFRvRGVjaW1hbCAmJiB0aGlzLnZhbHVlICYmIHRoaXMudmFsdWUgJSAxICE9PSAwKSB7XG4gICAgICByZXR1cm4gdGhpcy52YWx1ZS50b0ZpeGVkKHRoaXMuX3JvdW5kVG9EZWNpbWFsKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy52YWx1ZSB8fCAwO1xuICB9XG5cbiAgLyoqIHNldCBmb2N1cyB0byB0aGUgaG9zdCBlbGVtZW50ICovXG4gIGZvY3VzKG9wdGlvbnM/OiBGb2N1c09wdGlvbnMpIHtcbiAgICB0aGlzLl9mb2N1c0hvc3RFbGVtZW50KG9wdGlvbnMpO1xuICB9XG5cbiAgLyoqIGJsdXIgdGhlIGhvc3QgZWxlbWVudCAqL1xuICBibHVyKCkge1xuICAgIHRoaXMuX2JsdXJIb3N0RWxlbWVudCgpO1xuICB9XG5cbiAgLyoqIG9uVG91Y2ggZnVuY3Rpb24gcmVnaXN0ZXJlZCB2aWEgcmVnaXN0ZXJPblRvdWNoIChDb250cm9sVmFsdWVBY2Nlc3NvcikuICovXG4gIG9uVG91Y2hlZDogKCkgPT4gYW55ID0gKCkgPT4ge307XG5cbiAgLyoqIFRoZSBwZXJjZW50YWdlIG9mIHRoZSBzbGlkZXIgdGhhdCBjb2luY2lkZXMgd2l0aCB0aGUgdmFsdWUuICovXG4gIGdldCBwZXJjZW50KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX2NsYW1wKHRoaXMuX3BlcmNlbnQpO1xuICB9XG4gIHByaXZhdGUgX3BlcmNlbnQ6IG51bWJlciA9IDA7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgb3Igbm90IHRoZSB0aHVtYiBpcyBzbGlkaW5nIGFuZCB3aGF0IHRoZSB1c2VyIGlzIHVzaW5nIHRvIHNsaWRlIGl0IHdpdGguXG4gICAqIFVzZWQgdG8gZGV0ZXJtaW5lIGlmIHRoZXJlIHNob3VsZCBiZSBhIHRyYW5zaXRpb24gZm9yIHRoZSB0aHVtYiBhbmQgZmlsbCB0cmFjay5cbiAgICovXG4gIF9pc1NsaWRpbmc6ICdrZXlib2FyZCcgfCAncG9pbnRlcicgfCBudWxsID0gbnVsbDtcblxuICAvKipcbiAgICogV2hldGhlciBvciBub3QgdGhlIHNsaWRlciBpcyBhY3RpdmUgKGNsaWNrZWQgb3Igc2xpZGluZykuXG4gICAqIFVzZWQgdG8gc2hyaW5rIGFuZCBncm93IHRoZSB0aHVtYiBhcyBhY2NvcmRpbmcgdG8gdGhlIE1hdGVyaWFsIERlc2lnbiBzcGVjLlxuICAgKi9cbiAgX2lzQWN0aXZlOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGF4aXMgb2YgdGhlIHNsaWRlciBpcyBpbnZlcnRlZC5cbiAgICogKGkuZS4gd2hldGhlciBtb3ZpbmcgdGhlIHRodW1iIGluIHRoZSBwb3NpdGl2ZSB4IG9yIHkgZGlyZWN0aW9uIGRlY3JlYXNlcyB0aGUgc2xpZGVyJ3MgdmFsdWUpLlxuICAgKi9cbiAgX3Nob3VsZEludmVydEF4aXMoKSB7XG4gICAgLy8gU3RhbmRhcmQgbm9uLWludmVydGVkIG1vZGUgZm9yIGEgdmVydGljYWwgc2xpZGVyIHNob3VsZCBiZSBkcmFnZ2luZyB0aGUgdGh1bWIgZnJvbSBib3R0b20gdG9cbiAgICAvLyB0b3AuIEhvd2V2ZXIgZnJvbSBhIHktYXhpcyBzdGFuZHBvaW50IHRoaXMgaXMgaW52ZXJ0ZWQuXG4gICAgcmV0dXJuIHRoaXMudmVydGljYWwgPyAhdGhpcy5pbnZlcnQgOiB0aGlzLmludmVydDtcbiAgfVxuXG4gIC8qKiBXaGV0aGVyIHRoZSBzbGlkZXIgaXMgYXQgaXRzIG1pbmltdW0gdmFsdWUuICovXG4gIF9pc01pblZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLnBlcmNlbnQgPT09IDA7XG4gIH1cblxuICAvKipcbiAgICogVGhlIGFtb3VudCBvZiBzcGFjZSB0byBsZWF2ZSBiZXR3ZWVuIHRoZSBzbGlkZXIgdGh1bWIgYW5kIHRoZSB0cmFjayBmaWxsICYgdHJhY2sgYmFja2dyb3VuZFxuICAgKiBlbGVtZW50cy5cbiAgICovXG4gIF9nZXRUaHVtYkdhcCgpIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlZCkge1xuICAgICAgcmV0dXJuIERJU0FCTEVEX1RIVU1CX0dBUDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX2lzTWluVmFsdWUoKSAmJiAhdGhpcy50aHVtYkxhYmVsKSB7XG4gICAgICByZXR1cm4gdGhpcy5faXNBY3RpdmUgPyBNSU5fVkFMVUVfQUNUSVZFX1RIVU1CX0dBUCA6IE1JTl9WQUxVRV9OT05BQ1RJVkVfVEhVTUJfR0FQO1xuICAgIH1cbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIC8qKiBDU1Mgc3R5bGVzIGZvciB0aGUgdHJhY2sgYmFja2dyb3VuZCBlbGVtZW50LiAqL1xuICBfZ2V0VHJhY2tCYWNrZ3JvdW5kU3R5bGVzKCk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9IHtcbiAgICBjb25zdCBheGlzID0gdGhpcy52ZXJ0aWNhbCA/ICdZJyA6ICdYJztcbiAgICBjb25zdCBzY2FsZSA9IHRoaXMudmVydGljYWwgPyBgMSwgJHsxIC0gdGhpcy5wZXJjZW50fSwgMWAgOiBgJHsxIC0gdGhpcy5wZXJjZW50fSwgMSwgMWA7XG4gICAgY29uc3Qgc2lnbiA9IHRoaXMuX3Nob3VsZEludmVydE1vdXNlQ29vcmRzKCkgPyAnLScgOiAnJztcblxuICAgIHJldHVybiB7XG4gICAgICAvLyBzY2FsZTNkIGF2b2lkcyBzb21lIHJlbmRlcmluZyBpc3N1ZXMgaW4gQ2hyb21lLiBTZWUgIzEyMDcxLlxuICAgICAgdHJhbnNmb3JtOiBgdHJhbnNsYXRlJHtheGlzfSgke3NpZ259JHt0aGlzLl9nZXRUaHVtYkdhcCgpfXB4KSBzY2FsZTNkKCR7c2NhbGV9KWAsXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBDU1Mgc3R5bGVzIGZvciB0aGUgdHJhY2sgZmlsbCBlbGVtZW50LiAqL1xuICBfZ2V0VHJhY2tGaWxsU3R5bGVzKCk6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9IHtcbiAgICBjb25zdCBwZXJjZW50ID0gdGhpcy5wZXJjZW50O1xuICAgIGNvbnN0IGF4aXMgPSB0aGlzLnZlcnRpY2FsID8gJ1knIDogJ1gnO1xuICAgIGNvbnN0IHNjYWxlID0gdGhpcy52ZXJ0aWNhbCA/IGAxLCAke3BlcmNlbnR9LCAxYCA6IGAke3BlcmNlbnR9LCAxLCAxYDtcbiAgICBjb25zdCBzaWduID0gdGhpcy5fc2hvdWxkSW52ZXJ0TW91c2VDb29yZHMoKSA/ICcnIDogJy0nO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIC8vIHNjYWxlM2QgYXZvaWRzIHNvbWUgcmVuZGVyaW5nIGlzc3VlcyBpbiBDaHJvbWUuIFNlZSAjMTIwNzEuXG4gICAgICB0cmFuc2Zvcm06IGB0cmFuc2xhdGUke2F4aXN9KCR7c2lnbn0ke3RoaXMuX2dldFRodW1iR2FwKCl9cHgpIHNjYWxlM2QoJHtzY2FsZX0pYCxcbiAgICAgIC8vIGlPUyBTYWZhcmkgaGFzIGEgYnVnIHdoZXJlIGl0IHdvbid0IHJlLXJlbmRlciBlbGVtZW50cyB3aGljaCBzdGFydCBvZiBhcyBgc2NhbGUoMClgIHVudGlsXG4gICAgICAvLyBzb21ldGhpbmcgZm9yY2VzIGEgc3R5bGUgcmVjYWxjdWxhdGlvbiBvbiBpdC4gU2luY2Ugd2UnbGwgZW5kIHVwIHdpdGggYHNjYWxlKDApYCB3aGVuXG4gICAgICAvLyB0aGUgdmFsdWUgb2YgdGhlIHNsaWRlciBpcyAwLCB3ZSBjYW4gZWFzaWx5IGdldCBpbnRvIHRoaXMgc2l0dWF0aW9uLiBXZSBmb3JjZSBhXG4gICAgICAvLyByZWNhbGN1bGF0aW9uIGJ5IGNoYW5naW5nIHRoZSBlbGVtZW50J3MgYGRpc3BsYXlgIHdoZW4gaXQgZ29lcyBmcm9tIDAgdG8gYW55IG90aGVyIHZhbHVlLlxuICAgICAgZGlzcGxheTogcGVyY2VudCA9PT0gMCA/ICdub25lJyA6ICcnLFxuICAgIH07XG4gIH1cblxuICAvKiogQ1NTIHN0eWxlcyBmb3IgdGhlIHRpY2tzIGNvbnRhaW5lciBlbGVtZW50LiAqL1xuICBfZ2V0VGlja3NDb250YWluZXJTdHlsZXMoKToge1trZXk6IHN0cmluZ106IHN0cmluZ30ge1xuICAgIGxldCBheGlzID0gdGhpcy52ZXJ0aWNhbCA/ICdZJyA6ICdYJztcbiAgICAvLyBGb3IgYSBob3Jpem9udGFsIHNsaWRlciBpbiBSVEwgbGFuZ3VhZ2VzIHdlIHB1c2ggdGhlIHRpY2tzIGNvbnRhaW5lciBvZmYgdGhlIGxlZnQgZWRnZVxuICAgIC8vIGluc3RlYWQgb2YgdGhlIHJpZ2h0IGVkZ2UgdG8gYXZvaWQgY2F1c2luZyBhIGhvcml6b250YWwgc2Nyb2xsYmFyIHRvIGFwcGVhci5cbiAgICBsZXQgc2lnbiA9ICF0aGlzLnZlcnRpY2FsICYmIHRoaXMuX2dldERpcmVjdGlvbigpID09ICdydGwnID8gJycgOiAnLSc7XG4gICAgbGV0IG9mZnNldCA9ICh0aGlzLl90aWNrSW50ZXJ2YWxQZXJjZW50IC8gMikgKiAxMDA7XG4gICAgcmV0dXJuIHtcbiAgICAgICd0cmFuc2Zvcm0nOiBgdHJhbnNsYXRlJHtheGlzfSgke3NpZ259JHtvZmZzZXR9JSlgLFxuICAgIH07XG4gIH1cblxuICAvKiogQ1NTIHN0eWxlcyBmb3IgdGhlIHRpY2tzIGVsZW1lbnQuICovXG4gIF9nZXRUaWNrc1N0eWxlcygpOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSB7XG4gICAgbGV0IHRpY2tTaXplID0gdGhpcy5fdGlja0ludGVydmFsUGVyY2VudCAqIDEwMDtcbiAgICBsZXQgYmFja2dyb3VuZFNpemUgPSB0aGlzLnZlcnRpY2FsID8gYDJweCAke3RpY2tTaXplfSVgIDogYCR7dGlja1NpemV9JSAycHhgO1xuICAgIGxldCBheGlzID0gdGhpcy52ZXJ0aWNhbCA/ICdZJyA6ICdYJztcbiAgICAvLyBEZXBlbmRpbmcgb24gdGhlIGRpcmVjdGlvbiB3ZSBwdXNoZWQgdGhlIHRpY2tzIGNvbnRhaW5lciwgcHVzaCB0aGUgdGlja3MgdGhlIG9wcG9zaXRlXG4gICAgLy8gZGlyZWN0aW9uIHRvIHJlLWNlbnRlciB0aGVtIGJ1dCBjbGlwIG9mZiB0aGUgZW5kIGVkZ2UuIEluIFJUTCBsYW5ndWFnZXMgd2UgbmVlZCB0byBmbGlwIHRoZVxuICAgIC8vIHRpY2tzIDE4MCBkZWdyZWVzIHNvIHdlJ3JlIHJlYWxseSBjdXR0aW5nIG9mZiB0aGUgZW5kIGVkZ2UgYWJkIG5vdCB0aGUgc3RhcnQuXG4gICAgbGV0IHNpZ24gPSAhdGhpcy52ZXJ0aWNhbCAmJiB0aGlzLl9nZXREaXJlY3Rpb24oKSA9PSAncnRsJyA/ICctJyA6ICcnO1xuICAgIGxldCByb3RhdGUgPSAhdGhpcy52ZXJ0aWNhbCAmJiB0aGlzLl9nZXREaXJlY3Rpb24oKSA9PSAncnRsJyA/ICcgcm90YXRlKDE4MGRlZyknIDogJyc7XG4gICAgbGV0IHN0eWxlczoge1trZXk6IHN0cmluZ106IHN0cmluZ30gPSB7XG4gICAgICAnYmFja2dyb3VuZFNpemUnOiBiYWNrZ3JvdW5kU2l6ZSxcbiAgICAgIC8vIFdpdGhvdXQgdHJhbnNsYXRlWiB0aWNrcyBzb21ldGltZXMgaml0dGVyIGFzIHRoZSBzbGlkZXIgbW92ZXMgb24gQ2hyb21lICYgRmlyZWZveC5cbiAgICAgICd0cmFuc2Zvcm0nOiBgdHJhbnNsYXRlWigwKSB0cmFuc2xhdGUke2F4aXN9KCR7c2lnbn0ke3RpY2tTaXplIC8gMn0lKSR7cm90YXRlfWAsXG4gICAgfTtcblxuICAgIGlmICh0aGlzLl9pc01pblZhbHVlKCkgJiYgdGhpcy5fZ2V0VGh1bWJHYXAoKSkge1xuICAgICAgY29uc3Qgc2hvdWxkSW52ZXJ0QXhpcyA9IHRoaXMuX3Nob3VsZEludmVydEF4aXMoKTtcbiAgICAgIGxldCBzaWRlOiBzdHJpbmc7XG5cbiAgICAgIGlmICh0aGlzLnZlcnRpY2FsKSB7XG4gICAgICAgIHNpZGUgPSBzaG91bGRJbnZlcnRBeGlzID8gJ0JvdHRvbScgOiAnVG9wJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNpZGUgPSBzaG91bGRJbnZlcnRBeGlzID8gJ1JpZ2h0JyA6ICdMZWZ0JztcbiAgICAgIH1cblxuICAgICAgc3R5bGVzW2BwYWRkaW5nJHtzaWRlfWBdID0gYCR7dGhpcy5fZ2V0VGh1bWJHYXAoKX1weGA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0eWxlcztcbiAgfVxuXG4gIF9nZXRUaHVtYkNvbnRhaW5lclN0eWxlcygpOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSB7XG4gICAgY29uc3Qgc2hvdWxkSW52ZXJ0QXhpcyA9IHRoaXMuX3Nob3VsZEludmVydEF4aXMoKTtcbiAgICBsZXQgYXhpcyA9IHRoaXMudmVydGljYWwgPyAnWScgOiAnWCc7XG4gICAgLy8gRm9yIGEgaG9yaXpvbnRhbCBzbGlkZXIgaW4gUlRMIGxhbmd1YWdlcyB3ZSBwdXNoIHRoZSB0aHVtYiBjb250YWluZXIgb2ZmIHRoZSBsZWZ0IGVkZ2VcbiAgICAvLyBpbnN0ZWFkIG9mIHRoZSByaWdodCBlZGdlIHRvIGF2b2lkIGNhdXNpbmcgYSBob3Jpem9udGFsIHNjcm9sbGJhciB0byBhcHBlYXIuXG4gICAgbGV0IGludmVydE9mZnNldCA9XG4gICAgICB0aGlzLl9nZXREaXJlY3Rpb24oKSA9PSAncnRsJyAmJiAhdGhpcy52ZXJ0aWNhbCA/ICFzaG91bGRJbnZlcnRBeGlzIDogc2hvdWxkSW52ZXJ0QXhpcztcbiAgICBsZXQgb2Zmc2V0ID0gKGludmVydE9mZnNldCA/IHRoaXMucGVyY2VudCA6IDEgLSB0aGlzLnBlcmNlbnQpICogMTAwO1xuICAgIHJldHVybiB7XG4gICAgICAndHJhbnNmb3JtJzogYHRyYW5zbGF0ZSR7YXhpc30oLSR7b2Zmc2V0fSUpYCxcbiAgICB9O1xuICB9XG5cbiAgLyoqIFRoZSBzaXplIG9mIGEgdGljayBpbnRlcnZhbCBhcyBhIHBlcmNlbnRhZ2Ugb2YgdGhlIHNpemUgb2YgdGhlIHRyYWNrLiAqL1xuICBwcml2YXRlIF90aWNrSW50ZXJ2YWxQZXJjZW50OiBudW1iZXIgPSAwO1xuXG4gIC8qKiBUaGUgZGltZW5zaW9ucyBvZiB0aGUgc2xpZGVyLiAqL1xuICBwcml2YXRlIF9zbGlkZXJEaW1lbnNpb25zOiBDbGllbnRSZWN0IHwgbnVsbCA9IG51bGw7XG5cbiAgcHJpdmF0ZSBfY29udHJvbFZhbHVlQWNjZXNzb3JDaGFuZ2VGbjogKHZhbHVlOiBhbnkpID0+IHZvaWQgPSAoKSA9PiB7fTtcblxuICAvKiogRGVjaW1hbCBwbGFjZXMgdG8gcm91bmQgdG8sIGJhc2VkIG9uIHRoZSBzdGVwIGFtb3VudC4gKi9cbiAgcHJpdmF0ZSBfcm91bmRUb0RlY2ltYWw6IG51bWJlcjtcblxuICAvKiogU3Vic2NyaXB0aW9uIHRvIHRoZSBEaXJlY3Rpb25hbGl0eSBjaGFuZ2UgRXZlbnRFbWl0dGVyLiAqL1xuICBwcml2YXRlIF9kaXJDaGFuZ2VTdWJzY3JpcHRpb24gPSBTdWJzY3JpcHRpb24uRU1QVFk7XG5cbiAgLyoqIFRoZSB2YWx1ZSBvZiB0aGUgc2xpZGVyIHdoZW4gdGhlIHNsaWRlIHN0YXJ0IGV2ZW50IGZpcmVzLiAqL1xuICBwcml2YXRlIF92YWx1ZU9uU2xpZGVTdGFydDogbnVtYmVyIHwgbnVsbDtcblxuICAvKiogUmVmZXJlbmNlIHRvIHRoZSBpbm5lciBzbGlkZXIgd3JhcHBlciBlbGVtZW50LiAqL1xuICBAVmlld0NoaWxkKCdzbGlkZXJXcmFwcGVyJykgcHJpdmF0ZSBfc2xpZGVyV3JhcHBlcjogRWxlbWVudFJlZjtcblxuICAvKipcbiAgICogV2hldGhlciBtb3VzZSBldmVudHMgc2hvdWxkIGJlIGNvbnZlcnRlZCB0byBhIHNsaWRlciBwb3NpdGlvbiBieSBjYWxjdWxhdGluZyB0aGVpciBkaXN0YW5jZVxuICAgKiBmcm9tIHRoZSByaWdodCBvciBib3R0b20gZWRnZSBvZiB0aGUgc2xpZGVyIGFzIG9wcG9zZWQgdG8gdGhlIHRvcCBvciBsZWZ0LlxuICAgKi9cbiAgX3Nob3VsZEludmVydE1vdXNlQ29vcmRzKCkge1xuICAgIGNvbnN0IHNob3VsZEludmVydEF4aXMgPSB0aGlzLl9zaG91bGRJbnZlcnRBeGlzKCk7XG4gICAgcmV0dXJuIHRoaXMuX2dldERpcmVjdGlvbigpID09ICdydGwnICYmICF0aGlzLnZlcnRpY2FsID8gIXNob3VsZEludmVydEF4aXMgOiBzaG91bGRJbnZlcnRBeGlzO1xuICB9XG5cbiAgLyoqIFRoZSBsYW5ndWFnZSBkaXJlY3Rpb24gZm9yIHRoaXMgc2xpZGVyIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX2dldERpcmVjdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5fZGlyICYmIHRoaXMuX2Rpci52YWx1ZSA9PSAncnRsJyA/ICdydGwnIDogJ2x0cic7XG4gIH1cblxuICAvKiogS2VlcHMgdHJhY2sgb2YgdGhlIGxhc3QgcG9pbnRlciBldmVudCB0aGF0IHdhcyBjYXB0dXJlZCBieSB0aGUgc2xpZGVyLiAqL1xuICBwcml2YXRlIF9sYXN0UG9pbnRlckV2ZW50OiBNb3VzZUV2ZW50IHwgVG91Y2hFdmVudCB8IG51bGw7XG5cbiAgLyoqIFVzZWQgdG8gc3Vic2NyaWJlIHRvIGdsb2JhbCBtb3ZlIGFuZCBlbmQgZXZlbnRzICovXG4gIHByb3RlY3RlZCBfZG9jdW1lbnQ6IERvY3VtZW50O1xuXG4gIC8qKlxuICAgKiBJZGVudGlmaWVyIHVzZWQgdG8gYXR0cmlidXRlIGEgdG91Y2ggZXZlbnQgdG8gYSBwYXJ0aWN1bGFyIHNsaWRlci5cbiAgICogV2lsbCBiZSB1bmRlZmluZWQgaWYgb25lIG9mIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBpcyB0cnVlOlxuICAgKiAtIFRoZSB1c2VyIGlzbid0IGRyYWdnaW5nIHVzaW5nIGEgdG91Y2ggZGV2aWNlLlxuICAgKiAtIFRoZSBicm93c2VyIGRvZXNuJ3Qgc3VwcG9ydCBgVG91Y2guaWRlbnRpZmllcmAuXG4gICAqIC0gRHJhZ2dpbmcgaGFzbid0IHN0YXJ0ZWQgeWV0LlxuICAgKi9cbiAgcHJpdmF0ZSBfdG91Y2hJZDogbnVtYmVyIHwgdW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYsXG4gICAgcHJpdmF0ZSBfZm9jdXNNb25pdG9yOiBGb2N1c01vbml0b3IsXG4gICAgcHJpdmF0ZSBfY2hhbmdlRGV0ZWN0b3JSZWY6IENoYW5nZURldGVjdG9yUmVmLFxuICAgIEBPcHRpb25hbCgpIHByaXZhdGUgX2RpcjogRGlyZWN0aW9uYWxpdHksXG4gICAgQEF0dHJpYnV0ZSgndGFiaW5kZXgnKSB0YWJJbmRleDogc3RyaW5nLFxuICAgIHByaXZhdGUgX25nWm9uZTogTmdab25lLFxuICAgIEBJbmplY3QoRE9DVU1FTlQpIF9kb2N1bWVudDogYW55LFxuICAgIEBPcHRpb25hbCgpIEBJbmplY3QoQU5JTUFUSU9OX01PRFVMRV9UWVBFKSBwdWJsaWMgX2FuaW1hdGlvbk1vZGU/OiBzdHJpbmcsXG4gICkge1xuICAgIHN1cGVyKGVsZW1lbnRSZWYpO1xuICAgIHRoaXMuX2RvY3VtZW50ID0gX2RvY3VtZW50O1xuICAgIHRoaXMudGFiSW5kZXggPSBwYXJzZUludCh0YWJJbmRleCkgfHwgMDtcblxuICAgIF9uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgY29uc3QgZWxlbWVudCA9IGVsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fcG9pbnRlckRvd24sIGFjdGl2ZUV2ZW50T3B0aW9ucyk7XG4gICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLl9wb2ludGVyRG93biwgYWN0aXZlRXZlbnRPcHRpb25zKTtcbiAgICB9KTtcbiAgfVxuXG4gIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcbiAgICB0aGlzLl9mb2N1c01vbml0b3IubW9uaXRvcih0aGlzLl9lbGVtZW50UmVmLCB0cnVlKS5zdWJzY3JpYmUoKG9yaWdpbjogRm9jdXNPcmlnaW4pID0+IHtcbiAgICAgIHRoaXMuX2lzQWN0aXZlID0gISFvcmlnaW4gJiYgb3JpZ2luICE9PSAna2V5Ym9hcmQnO1xuICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0pO1xuICAgIGlmICh0aGlzLl9kaXIpIHtcbiAgICAgIHRoaXMuX2RpckNoYW5nZVN1YnNjcmlwdGlvbiA9IHRoaXMuX2Rpci5jaGFuZ2Uuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgdGhpcy5fY2hhbmdlRGV0ZWN0b3JSZWYubWFya0ZvckNoZWNrKCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpIHtcbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fcG9pbnRlckRvd24sIGFjdGl2ZUV2ZW50T3B0aW9ucyk7XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5fcG9pbnRlckRvd24sIGFjdGl2ZUV2ZW50T3B0aW9ucyk7XG4gICAgdGhpcy5fbGFzdFBvaW50ZXJFdmVudCA9IG51bGw7XG4gICAgdGhpcy5fcmVtb3ZlR2xvYmFsRXZlbnRzKCk7XG4gICAgdGhpcy5fZm9jdXNNb25pdG9yLnN0b3BNb25pdG9yaW5nKHRoaXMuX2VsZW1lbnRSZWYpO1xuICAgIHRoaXMuX2RpckNoYW5nZVN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICB9XG5cbiAgX29uTW91c2VlbnRlcigpIHtcbiAgICBpZiAodGhpcy5kaXNhYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFdlIHNhdmUgdGhlIGRpbWVuc2lvbnMgb2YgdGhlIHNsaWRlciBoZXJlIHNvIHdlIGNhbiB1c2UgdGhlbSB0byB1cGRhdGUgdGhlIHNwYWNpbmcgb2YgdGhlXG4gICAgLy8gdGlja3MgYW5kIGRldGVybWluZSB3aGVyZSBvbiB0aGUgc2xpZGVyIGNsaWNrIGFuZCBzbGlkZSBldmVudHMgaGFwcGVuLlxuICAgIHRoaXMuX3NsaWRlckRpbWVuc2lvbnMgPSB0aGlzLl9nZXRTbGlkZXJEaW1lbnNpb25zKCk7XG4gICAgdGhpcy5fdXBkYXRlVGlja0ludGVydmFsUGVyY2VudCgpO1xuICB9XG5cbiAgX29uRm9jdXMoKSB7XG4gICAgLy8gV2Ugc2F2ZSB0aGUgZGltZW5zaW9ucyBvZiB0aGUgc2xpZGVyIGhlcmUgc28gd2UgY2FuIHVzZSB0aGVtIHRvIHVwZGF0ZSB0aGUgc3BhY2luZyBvZiB0aGVcbiAgICAvLyB0aWNrcyBhbmQgZGV0ZXJtaW5lIHdoZXJlIG9uIHRoZSBzbGlkZXIgY2xpY2sgYW5kIHNsaWRlIGV2ZW50cyBoYXBwZW4uXG4gICAgdGhpcy5fc2xpZGVyRGltZW5zaW9ucyA9IHRoaXMuX2dldFNsaWRlckRpbWVuc2lvbnMoKTtcbiAgICB0aGlzLl91cGRhdGVUaWNrSW50ZXJ2YWxQZXJjZW50KCk7XG4gIH1cblxuICBfb25CbHVyKCkge1xuICAgIHRoaXMub25Ub3VjaGVkKCk7XG4gIH1cblxuICBfb25LZXlkb3duKGV2ZW50OiBLZXlib2FyZEV2ZW50KSB7XG4gICAgaWYgKFxuICAgICAgdGhpcy5kaXNhYmxlZCB8fFxuICAgICAgaGFzTW9kaWZpZXJLZXkoZXZlbnQpIHx8XG4gICAgICAodGhpcy5faXNTbGlkaW5nICYmIHRoaXMuX2lzU2xpZGluZyAhPT0gJ2tleWJvYXJkJylcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBvbGRWYWx1ZSA9IHRoaXMudmFsdWU7XG5cbiAgICBzd2l0Y2ggKGV2ZW50LmtleUNvZGUpIHtcbiAgICAgIGNhc2UgUEFHRV9VUDpcbiAgICAgICAgdGhpcy5faW5jcmVtZW50KDEwKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFBBR0VfRE9XTjpcbiAgICAgICAgdGhpcy5faW5jcmVtZW50KC0xMCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBFTkQ6XG4gICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLm1heDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEhPTUU6XG4gICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLm1pbjtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIExFRlRfQVJST1c6XG4gICAgICAgIC8vIE5PVEU6IEZvciBhIHNpZ2h0ZWQgdXNlciBpdCB3b3VsZCBtYWtlIG1vcmUgc2Vuc2UgdGhhdCB3aGVuIHRoZXkgcHJlc3MgYW4gYXJyb3cga2V5IG9uIGFuXG4gICAgICAgIC8vIGludmVydGVkIHNsaWRlciB0aGUgdGh1bWIgbW92ZXMgaW4gdGhhdCBkaXJlY3Rpb24uIEhvd2V2ZXIgZm9yIGEgYmxpbmQgdXNlciwgbm90aGluZ1xuICAgICAgICAvLyBhYm91dCB0aGUgc2xpZGVyIGluZGljYXRlcyB0aGF0IGl0IGlzIGludmVydGVkLiBUaGV5IHdpbGwgZXhwZWN0IGxlZnQgdG8gYmUgZGVjcmVtZW50LFxuICAgICAgICAvLyByZWdhcmRsZXNzIG9mIGhvdyBpdCBhcHBlYXJzIG9uIHRoZSBzY3JlZW4uIEZvciBzcGVha2VycyBvZlJUTCBsYW5ndWFnZXMsIHRoZXkgcHJvYmFibHlcbiAgICAgICAgLy8gZXhwZWN0IGxlZnQgdG8gbWVhbiBpbmNyZW1lbnQuIFRoZXJlZm9yZSB3ZSBmbGlwIHRoZSBtZWFuaW5nIG9mIHRoZSBzaWRlIGFycm93IGtleXMgZm9yXG4gICAgICAgIC8vIFJUTC4gRm9yIGludmVydGVkIHNsaWRlcnMgd2UgcHJlZmVyIGEgZ29vZCBhMTF5IGV4cGVyaWVuY2UgdG8gaGF2aW5nIGl0IFwibG9vayByaWdodFwiIGZvclxuICAgICAgICAvLyBzaWdodGVkIHVzZXJzLCB0aGVyZWZvcmUgd2UgZG8gbm90IHN3YXAgdGhlIG1lYW5pbmcuXG4gICAgICAgIHRoaXMuX2luY3JlbWVudCh0aGlzLl9nZXREaXJlY3Rpb24oKSA9PSAncnRsJyA/IDEgOiAtMSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBVUF9BUlJPVzpcbiAgICAgICAgdGhpcy5faW5jcmVtZW50KDEpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUklHSFRfQVJST1c6XG4gICAgICAgIC8vIFNlZSBjb21tZW50IG9uIExFRlRfQVJST1cgYWJvdXQgdGhlIGNvbmRpdGlvbnMgdW5kZXIgd2hpY2ggd2UgZmxpcCB0aGUgbWVhbmluZy5cbiAgICAgICAgdGhpcy5faW5jcmVtZW50KHRoaXMuX2dldERpcmVjdGlvbigpID09ICdydGwnID8gLTEgOiAxKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIERPV05fQVJST1c6XG4gICAgICAgIHRoaXMuX2luY3JlbWVudCgtMSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgLy8gUmV0dXJuIGlmIHRoZSBrZXkgaXMgbm90IG9uZSB0aGF0IHdlIGV4cGxpY2l0bHkgaGFuZGxlIHRvIGF2b2lkIGNhbGxpbmcgcHJldmVudERlZmF1bHQgb25cbiAgICAgICAgLy8gaXQuXG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAob2xkVmFsdWUgIT0gdGhpcy52YWx1ZSkge1xuICAgICAgdGhpcy5fZW1pdElucHV0RXZlbnQoKTtcbiAgICAgIHRoaXMuX2VtaXRDaGFuZ2VFdmVudCgpO1xuICAgIH1cblxuICAgIHRoaXMuX2lzU2xpZGluZyA9ICdrZXlib2FyZCc7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgfVxuXG4gIF9vbktleXVwKCkge1xuICAgIGlmICh0aGlzLl9pc1NsaWRpbmcgPT09ICdrZXlib2FyZCcpIHtcbiAgICAgIHRoaXMuX2lzU2xpZGluZyA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgLyoqIENhbGxlZCB3aGVuIHRoZSB1c2VyIGhhcyBwdXQgdGhlaXIgcG9pbnRlciBkb3duIG9uIHRoZSBzbGlkZXIuICovXG4gIHByaXZhdGUgX3BvaW50ZXJEb3duID0gKGV2ZW50OiBUb3VjaEV2ZW50IHwgTW91c2VFdmVudCkgPT4ge1xuICAgIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIHRoZSBzbGlkZXIgaXMgZGlzYWJsZWQgb3IgdGhlXG4gICAgLy8gdXNlciBpcyB1c2luZyBhbnl0aGluZyBvdGhlciB0aGFuIHRoZSBtYWluIG1vdXNlIGJ1dHRvbi5cbiAgICBpZiAodGhpcy5kaXNhYmxlZCB8fCB0aGlzLl9pc1NsaWRpbmcgfHwgKCFpc1RvdWNoRXZlbnQoZXZlbnQpICYmIGV2ZW50LmJ1dHRvbiAhPT0gMCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9uZ1pvbmUucnVuKCgpID0+IHtcbiAgICAgIHRoaXMuX3RvdWNoSWQgPSBpc1RvdWNoRXZlbnQoZXZlbnQpXG4gICAgICAgID8gZ2V0VG91Y2hJZEZvclNsaWRlcihldmVudCwgdGhpcy5fZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50KVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICAgIGNvbnN0IHBvaW50ZXJQb3NpdGlvbiA9IGdldFBvaW50ZXJQb3NpdGlvbk9uUGFnZShldmVudCwgdGhpcy5fdG91Y2hJZCk7XG5cbiAgICAgIGlmIChwb2ludGVyUG9zaXRpb24pIHtcbiAgICAgICAgY29uc3Qgb2xkVmFsdWUgPSB0aGlzLnZhbHVlO1xuICAgICAgICB0aGlzLl9pc1NsaWRpbmcgPSAncG9pbnRlcic7XG4gICAgICAgIHRoaXMuX2xhc3RQb2ludGVyRXZlbnQgPSBldmVudDtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy5fZm9jdXNIb3N0RWxlbWVudCgpO1xuICAgICAgICB0aGlzLl9vbk1vdXNlZW50ZXIoKTsgLy8gU2ltdWxhdGUgbW91c2VlbnRlciBpbiBjYXNlIHRoaXMgaXMgYSBtb2JpbGUgZGV2aWNlLlxuICAgICAgICB0aGlzLl9iaW5kR2xvYmFsRXZlbnRzKGV2ZW50KTtcbiAgICAgICAgdGhpcy5fZm9jdXNIb3N0RWxlbWVudCgpO1xuICAgICAgICB0aGlzLl91cGRhdGVWYWx1ZUZyb21Qb3NpdGlvbihwb2ludGVyUG9zaXRpb24pO1xuICAgICAgICB0aGlzLl92YWx1ZU9uU2xpZGVTdGFydCA9IG9sZFZhbHVlO1xuXG4gICAgICAgIC8vIEVtaXQgYSBjaGFuZ2UgYW5kIGlucHV0IGV2ZW50IGlmIHRoZSB2YWx1ZSBjaGFuZ2VkLlxuICAgICAgICBpZiAob2xkVmFsdWUgIT0gdGhpcy52YWx1ZSkge1xuICAgICAgICAgIHRoaXMuX2VtaXRJbnB1dEV2ZW50KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICAvKipcbiAgICogQ2FsbGVkIHdoZW4gdGhlIHVzZXIgaGFzIG1vdmVkIHRoZWlyIHBvaW50ZXIgYWZ0ZXJcbiAgICogc3RhcnRpbmcgdG8gZHJhZy4gQm91bmQgb24gdGhlIGRvY3VtZW50IGxldmVsLlxuICAgKi9cbiAgcHJpdmF0ZSBfcG9pbnRlck1vdmUgPSAoZXZlbnQ6IFRvdWNoRXZlbnQgfCBNb3VzZUV2ZW50KSA9PiB7XG4gICAgaWYgKHRoaXMuX2lzU2xpZGluZyA9PT0gJ3BvaW50ZXInKSB7XG4gICAgICBjb25zdCBwb2ludGVyUG9zaXRpb24gPSBnZXRQb2ludGVyUG9zaXRpb25PblBhZ2UoZXZlbnQsIHRoaXMuX3RvdWNoSWQpO1xuXG4gICAgICBpZiAocG9pbnRlclBvc2l0aW9uKSB7XG4gICAgICAgIC8vIFByZXZlbnQgdGhlIHNsaWRlIGZyb20gc2VsZWN0aW5nIGFueXRoaW5nIGVsc2UuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IG9sZFZhbHVlID0gdGhpcy52YWx1ZTtcbiAgICAgICAgdGhpcy5fbGFzdFBvaW50ZXJFdmVudCA9IGV2ZW50O1xuICAgICAgICB0aGlzLl91cGRhdGVWYWx1ZUZyb21Qb3NpdGlvbihwb2ludGVyUG9zaXRpb24pO1xuXG4gICAgICAgIC8vIE5hdGl2ZSByYW5nZSBlbGVtZW50cyBhbHdheXMgZW1pdCBgaW5wdXRgIGV2ZW50cyB3aGVuIHRoZSB2YWx1ZSBjaGFuZ2VkIHdoaWxlIHNsaWRpbmcuXG4gICAgICAgIGlmIChvbGRWYWx1ZSAhPSB0aGlzLnZhbHVlKSB7XG4gICAgICAgICAgdGhpcy5fZW1pdElucHV0RXZlbnQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvKiogQ2FsbGVkIHdoZW4gdGhlIHVzZXIgaGFzIGxpZnRlZCB0aGVpciBwb2ludGVyLiBCb3VuZCBvbiB0aGUgZG9jdW1lbnQgbGV2ZWwuICovXG4gIHByaXZhdGUgX3BvaW50ZXJVcCA9IChldmVudDogVG91Y2hFdmVudCB8IE1vdXNlRXZlbnQpID0+IHtcbiAgICBpZiAodGhpcy5faXNTbGlkaW5nID09PSAncG9pbnRlcicpIHtcbiAgICAgIGlmIChcbiAgICAgICAgIWlzVG91Y2hFdmVudChldmVudCkgfHxcbiAgICAgICAgdHlwZW9mIHRoaXMuX3RvdWNoSWQgIT09ICdudW1iZXInIHx8XG4gICAgICAgIC8vIE5vdGUgdGhhdCB3ZSB1c2UgYGNoYW5nZWRUb3VjaGVzYCwgcmF0aGVyIHRoYW4gYHRvdWNoZXNgIGJlY2F1c2UgaXRcbiAgICAgICAgLy8gc2VlbXMgbGlrZSBpbiBtb3N0IGNhc2VzIGB0b3VjaGVzYCBpcyBlbXB0eSBmb3IgYHRvdWNoZW5kYCBldmVudHMuXG4gICAgICAgIGZpbmRNYXRjaGluZ1RvdWNoKGV2ZW50LmNoYW5nZWRUb3VjaGVzLCB0aGlzLl90b3VjaElkKVxuICAgICAgKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMuX3JlbW92ZUdsb2JhbEV2ZW50cygpO1xuICAgICAgICB0aGlzLl9pc1NsaWRpbmcgPSBudWxsO1xuICAgICAgICB0aGlzLl90b3VjaElkID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIGlmICh0aGlzLl92YWx1ZU9uU2xpZGVTdGFydCAhPSB0aGlzLnZhbHVlICYmICF0aGlzLmRpc2FibGVkKSB7XG4gICAgICAgICAgdGhpcy5fZW1pdENoYW5nZUV2ZW50KCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl92YWx1ZU9uU2xpZGVTdGFydCA9IHRoaXMuX2xhc3RQb2ludGVyRXZlbnQgPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvKiogQ2FsbGVkIHdoZW4gdGhlIHdpbmRvdyBoYXMgbG9zdCBmb2N1cy4gKi9cbiAgcHJpdmF0ZSBfd2luZG93Qmx1ciA9ICgpID0+IHtcbiAgICAvLyBJZiB0aGUgd2luZG93IGlzIGJsdXJyZWQgd2hpbGUgZHJhZ2dpbmcgd2UgbmVlZCB0byBzdG9wIGRyYWdnaW5nIGJlY2F1c2UgdGhlXG4gICAgLy8gYnJvd3NlciB3b24ndCBkaXNwYXRjaCB0aGUgYG1vdXNldXBgIGFuZCBgdG91Y2hlbmRgIGV2ZW50cyBhbnltb3JlLlxuICAgIGlmICh0aGlzLl9sYXN0UG9pbnRlckV2ZW50KSB7XG4gICAgICB0aGlzLl9wb2ludGVyVXAodGhpcy5fbGFzdFBvaW50ZXJFdmVudCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKiBVc2UgZGVmYXVsdFZpZXcgb2YgaW5qZWN0ZWQgZG9jdW1lbnQgaWYgYXZhaWxhYmxlIG9yIGZhbGxiYWNrIHRvIGdsb2JhbCB3aW5kb3cgcmVmZXJlbmNlICovXG4gIHByaXZhdGUgX2dldFdpbmRvdygpOiBXaW5kb3cge1xuICAgIHJldHVybiB0aGlzLl9kb2N1bWVudC5kZWZhdWx0VmlldyB8fCB3aW5kb3c7XG4gIH1cblxuICAvKipcbiAgICogQmluZHMgb3VyIGdsb2JhbCBtb3ZlIGFuZCBlbmQgZXZlbnRzLiBUaGV5J3JlIGJvdW5kIGF0IHRoZSBkb2N1bWVudCBsZXZlbCBhbmQgb25seSB3aGlsZVxuICAgKiBkcmFnZ2luZyBzbyB0aGF0IHRoZSB1c2VyIGRvZXNuJ3QgaGF2ZSB0byBrZWVwIHRoZWlyIHBvaW50ZXIgZXhhY3RseSBvdmVyIHRoZSBzbGlkZXJcbiAgICogYXMgdGhleSdyZSBzd2lwaW5nIGFjcm9zcyB0aGUgc2NyZWVuLlxuICAgKi9cbiAgcHJpdmF0ZSBfYmluZEdsb2JhbEV2ZW50cyh0cmlnZ2VyRXZlbnQ6IFRvdWNoRXZlbnQgfCBNb3VzZUV2ZW50KSB7XG4gICAgLy8gTm90ZSB0aGF0IHdlIGJpbmQgdGhlIGV2ZW50cyB0byB0aGUgYGRvY3VtZW50YCwgYmVjYXVzZSBpdCBhbGxvd3MgdXMgdG8gY2FwdHVyZVxuICAgIC8vIGRyYWcgY2FuY2VsIGV2ZW50cyB3aGVyZSB0aGUgdXNlcidzIHBvaW50ZXIgaXMgb3V0c2lkZSB0aGUgYnJvd3NlciB3aW5kb3cuXG4gICAgY29uc3QgZG9jdW1lbnQgPSB0aGlzLl9kb2N1bWVudDtcbiAgICBjb25zdCBpc1RvdWNoID0gaXNUb3VjaEV2ZW50KHRyaWdnZXJFdmVudCk7XG4gICAgY29uc3QgbW92ZUV2ZW50TmFtZSA9IGlzVG91Y2ggPyAndG91Y2htb3ZlJyA6ICdtb3VzZW1vdmUnO1xuICAgIGNvbnN0IGVuZEV2ZW50TmFtZSA9IGlzVG91Y2ggPyAndG91Y2hlbmQnIDogJ21vdXNldXAnO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIobW92ZUV2ZW50TmFtZSwgdGhpcy5fcG9pbnRlck1vdmUsIGFjdGl2ZUV2ZW50T3B0aW9ucyk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihlbmRFdmVudE5hbWUsIHRoaXMuX3BvaW50ZXJVcCwgYWN0aXZlRXZlbnRPcHRpb25zKTtcblxuICAgIGlmIChpc1RvdWNoKSB7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRoaXMuX3BvaW50ZXJVcCwgYWN0aXZlRXZlbnRPcHRpb25zKTtcbiAgICB9XG5cbiAgICBjb25zdCB3aW5kb3cgPSB0aGlzLl9nZXRXaW5kb3coKTtcblxuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cpIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgdGhpcy5fd2luZG93Qmx1cik7XG4gICAgfVxuICB9XG5cbiAgLyoqIFJlbW92ZXMgYW55IGdsb2JhbCBldmVudCBsaXN0ZW5lcnMgdGhhdCB3ZSBtYXkgaGF2ZSBhZGRlZC4gKi9cbiAgcHJpdmF0ZSBfcmVtb3ZlR2xvYmFsRXZlbnRzKCkge1xuICAgIGNvbnN0IGRvY3VtZW50ID0gdGhpcy5fZG9jdW1lbnQ7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5fcG9pbnRlck1vdmUsIGFjdGl2ZUV2ZW50T3B0aW9ucyk7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuX3BvaW50ZXJVcCwgYWN0aXZlRXZlbnRPcHRpb25zKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLl9wb2ludGVyTW92ZSwgYWN0aXZlRXZlbnRPcHRpb25zKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMuX3BvaW50ZXJVcCwgYWN0aXZlRXZlbnRPcHRpb25zKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRoaXMuX3BvaW50ZXJVcCwgYWN0aXZlRXZlbnRPcHRpb25zKTtcblxuICAgIGNvbnN0IHdpbmRvdyA9IHRoaXMuX2dldFdpbmRvdygpO1xuXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdykge1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2JsdXInLCB0aGlzLl93aW5kb3dCbHVyKTtcbiAgICB9XG4gIH1cblxuICAvKiogSW5jcmVtZW50cyB0aGUgc2xpZGVyIGJ5IHRoZSBnaXZlbiBudW1iZXIgb2Ygc3RlcHMgKG5lZ2F0aXZlIG51bWJlciBkZWNyZW1lbnRzKS4gKi9cbiAgcHJpdmF0ZSBfaW5jcmVtZW50KG51bVN0ZXBzOiBudW1iZXIpIHtcbiAgICB0aGlzLnZhbHVlID0gdGhpcy5fY2xhbXAoKHRoaXMudmFsdWUgfHwgMCkgKyB0aGlzLnN0ZXAgKiBudW1TdGVwcywgdGhpcy5taW4sIHRoaXMubWF4KTtcbiAgfVxuXG4gIC8qKiBDYWxjdWxhdGUgdGhlIG5ldyB2YWx1ZSBmcm9tIHRoZSBuZXcgcGh5c2ljYWwgbG9jYXRpb24uIFRoZSB2YWx1ZSB3aWxsIGFsd2F5cyBiZSBzbmFwcGVkLiAqL1xuICBwcml2YXRlIF91cGRhdGVWYWx1ZUZyb21Qb3NpdGlvbihwb3M6IHt4OiBudW1iZXI7IHk6IG51bWJlcn0pIHtcbiAgICBpZiAoIXRoaXMuX3NsaWRlckRpbWVuc2lvbnMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsZXQgb2Zmc2V0ID0gdGhpcy52ZXJ0aWNhbCA/IHRoaXMuX3NsaWRlckRpbWVuc2lvbnMudG9wIDogdGhpcy5fc2xpZGVyRGltZW5zaW9ucy5sZWZ0O1xuICAgIGxldCBzaXplID0gdGhpcy52ZXJ0aWNhbCA/IHRoaXMuX3NsaWRlckRpbWVuc2lvbnMuaGVpZ2h0IDogdGhpcy5fc2xpZGVyRGltZW5zaW9ucy53aWR0aDtcbiAgICBsZXQgcG9zQ29tcG9uZW50ID0gdGhpcy52ZXJ0aWNhbCA/IHBvcy55IDogcG9zLng7XG5cbiAgICAvLyBUaGUgZXhhY3QgdmFsdWUgaXMgY2FsY3VsYXRlZCBmcm9tIHRoZSBldmVudCBhbmQgdXNlZCB0byBmaW5kIHRoZSBjbG9zZXN0IHNuYXAgdmFsdWUuXG4gICAgbGV0IHBlcmNlbnQgPSB0aGlzLl9jbGFtcCgocG9zQ29tcG9uZW50IC0gb2Zmc2V0KSAvIHNpemUpO1xuXG4gICAgaWYgKHRoaXMuX3Nob3VsZEludmVydE1vdXNlQ29vcmRzKCkpIHtcbiAgICAgIHBlcmNlbnQgPSAxIC0gcGVyY2VudDtcbiAgICB9XG5cbiAgICAvLyBTaW5jZSB0aGUgc3RlcHMgbWF5IG5vdCBkaXZpZGUgY2xlYW5seSBpbnRvIHRoZSBtYXggdmFsdWUsIGlmIHRoZSB1c2VyXG4gICAgLy8gc2xpZCB0byAwIG9yIDEwMCBwZXJjZW50LCB3ZSBqdW1wIHRvIHRoZSBtaW4vbWF4IHZhbHVlLiBUaGlzIGFwcHJvYWNoXG4gICAgLy8gaXMgc2xpZ2h0bHkgbW9yZSBpbnR1aXRpdmUgdGhhbiB1c2luZyBgTWF0aC5jZWlsYCBiZWxvdywgYmVjYXVzZSBpdFxuICAgIC8vIGZvbGxvd3MgdGhlIHVzZXIncyBwb2ludGVyIGNsb3Nlci5cbiAgICBpZiAocGVyY2VudCA9PT0gMCkge1xuICAgICAgdGhpcy52YWx1ZSA9IHRoaXMubWluO1xuICAgIH0gZWxzZSBpZiAocGVyY2VudCA9PT0gMSkge1xuICAgICAgdGhpcy52YWx1ZSA9IHRoaXMubWF4O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBleGFjdFZhbHVlID0gdGhpcy5fY2FsY3VsYXRlVmFsdWUocGVyY2VudCk7XG5cbiAgICAgIC8vIFRoaXMgY2FsY3VsYXRpb24gZmluZHMgdGhlIGNsb3Nlc3Qgc3RlcCBieSBmaW5kaW5nIHRoZSBjbG9zZXN0XG4gICAgICAvLyB3aG9sZSBudW1iZXIgZGl2aXNpYmxlIGJ5IHRoZSBzdGVwIHJlbGF0aXZlIHRvIHRoZSBtaW4uXG4gICAgICBjb25zdCBjbG9zZXN0VmFsdWUgPSBNYXRoLnJvdW5kKChleGFjdFZhbHVlIC0gdGhpcy5taW4pIC8gdGhpcy5zdGVwKSAqIHRoaXMuc3RlcCArIHRoaXMubWluO1xuXG4gICAgICAvLyBUaGUgdmFsdWUgbmVlZHMgdG8gc25hcCB0byB0aGUgbWluIGFuZCBtYXguXG4gICAgICB0aGlzLnZhbHVlID0gdGhpcy5fY2xhbXAoY2xvc2VzdFZhbHVlLCB0aGlzLm1pbiwgdGhpcy5tYXgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBFbWl0cyBhIGNoYW5nZSBldmVudCBpZiB0aGUgY3VycmVudCB2YWx1ZSBpcyBkaWZmZXJlbnQgZnJvbSB0aGUgbGFzdCBlbWl0dGVkIHZhbHVlLiAqL1xuICBwcml2YXRlIF9lbWl0Q2hhbmdlRXZlbnQoKSB7XG4gICAgdGhpcy5fY29udHJvbFZhbHVlQWNjZXNzb3JDaGFuZ2VGbih0aGlzLnZhbHVlKTtcbiAgICB0aGlzLnZhbHVlQ2hhbmdlLmVtaXQodGhpcy52YWx1ZSk7XG4gICAgdGhpcy5jaGFuZ2UuZW1pdCh0aGlzLl9jcmVhdGVDaGFuZ2VFdmVudCgpKTtcbiAgfVxuXG4gIC8qKiBFbWl0cyBhbiBpbnB1dCBldmVudCB3aGVuIHRoZSBjdXJyZW50IHZhbHVlIGlzIGRpZmZlcmVudCBmcm9tIHRoZSBsYXN0IGVtaXR0ZWQgdmFsdWUuICovXG4gIHByaXZhdGUgX2VtaXRJbnB1dEV2ZW50KCkge1xuICAgIHRoaXMuaW5wdXQuZW1pdCh0aGlzLl9jcmVhdGVDaGFuZ2VFdmVudCgpKTtcbiAgfVxuXG4gIC8qKiBVcGRhdGVzIHRoZSBhbW91bnQgb2Ygc3BhY2UgYmV0d2VlbiB0aWNrcyBhcyBhIHBlcmNlbnRhZ2Ugb2YgdGhlIHdpZHRoIG9mIHRoZSBzbGlkZXIuICovXG4gIHByaXZhdGUgX3VwZGF0ZVRpY2tJbnRlcnZhbFBlcmNlbnQoKSB7XG4gICAgaWYgKCF0aGlzLnRpY2tJbnRlcnZhbCB8fCAhdGhpcy5fc2xpZGVyRGltZW5zaW9ucykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnRpY2tJbnRlcnZhbCA9PSAnYXV0bycpIHtcbiAgICAgIGxldCB0cmFja1NpemUgPSB0aGlzLnZlcnRpY2FsID8gdGhpcy5fc2xpZGVyRGltZW5zaW9ucy5oZWlnaHQgOiB0aGlzLl9zbGlkZXJEaW1lbnNpb25zLndpZHRoO1xuICAgICAgbGV0IHBpeGVsc1BlclN0ZXAgPSAodHJhY2tTaXplICogdGhpcy5zdGVwKSAvICh0aGlzLm1heCAtIHRoaXMubWluKTtcbiAgICAgIGxldCBzdGVwc1BlclRpY2sgPSBNYXRoLmNlaWwoTUlOX0FVVE9fVElDS19TRVBBUkFUSU9OIC8gcGl4ZWxzUGVyU3RlcCk7XG4gICAgICBsZXQgcGl4ZWxzUGVyVGljayA9IHN0ZXBzUGVyVGljayAqIHRoaXMuc3RlcDtcbiAgICAgIHRoaXMuX3RpY2tJbnRlcnZhbFBlcmNlbnQgPSBwaXhlbHNQZXJUaWNrIC8gdHJhY2tTaXplO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl90aWNrSW50ZXJ2YWxQZXJjZW50ID0gKHRoaXMudGlja0ludGVydmFsICogdGhpcy5zdGVwKSAvICh0aGlzLm1heCAtIHRoaXMubWluKTtcbiAgICB9XG4gIH1cblxuICAvKiogQ3JlYXRlcyBhIHNsaWRlciBjaGFuZ2Ugb2JqZWN0IGZyb20gdGhlIHNwZWNpZmllZCB2YWx1ZS4gKi9cbiAgcHJpdmF0ZSBfY3JlYXRlQ2hhbmdlRXZlbnQodmFsdWUgPSB0aGlzLnZhbHVlKTogTWF0U2xpZGVyQ2hhbmdlIHtcbiAgICBsZXQgZXZlbnQgPSBuZXcgTWF0U2xpZGVyQ2hhbmdlKCk7XG5cbiAgICBldmVudC5zb3VyY2UgPSB0aGlzO1xuICAgIGV2ZW50LnZhbHVlID0gdmFsdWU7XG5cbiAgICByZXR1cm4gZXZlbnQ7XG4gIH1cblxuICAvKiogQ2FsY3VsYXRlcyB0aGUgcGVyY2VudGFnZSBvZiB0aGUgc2xpZGVyIHRoYXQgYSB2YWx1ZSBpcy4gKi9cbiAgcHJpdmF0ZSBfY2FsY3VsYXRlUGVyY2VudGFnZSh2YWx1ZTogbnVtYmVyIHwgbnVsbCkge1xuICAgIHJldHVybiAoKHZhbHVlIHx8IDApIC0gdGhpcy5taW4pIC8gKHRoaXMubWF4IC0gdGhpcy5taW4pO1xuICB9XG5cbiAgLyoqIENhbGN1bGF0ZXMgdGhlIHZhbHVlIGEgcGVyY2VudGFnZSBvZiB0aGUgc2xpZGVyIGNvcnJlc3BvbmRzIHRvLiAqL1xuICBwcml2YXRlIF9jYWxjdWxhdGVWYWx1ZShwZXJjZW50YWdlOiBudW1iZXIpIHtcbiAgICByZXR1cm4gdGhpcy5taW4gKyBwZXJjZW50YWdlICogKHRoaXMubWF4IC0gdGhpcy5taW4pO1xuICB9XG5cbiAgLyoqIFJldHVybiBhIG51bWJlciBiZXR3ZWVuIHR3byBudW1iZXJzLiAqL1xuICBwcml2YXRlIF9jbGFtcCh2YWx1ZTogbnVtYmVyLCBtaW4gPSAwLCBtYXggPSAxKSB7XG4gICAgcmV0dXJuIE1hdGgubWF4KG1pbiwgTWF0aC5taW4odmFsdWUsIG1heCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgYm91bmRpbmcgY2xpZW50IHJlY3Qgb2YgdGhlIHNsaWRlciB0cmFjayBlbGVtZW50LlxuICAgKiBUaGUgdHJhY2sgaXMgdXNlZCByYXRoZXIgdGhhbiB0aGUgbmF0aXZlIGVsZW1lbnQgdG8gaWdub3JlIHRoZSBleHRyYSBzcGFjZSB0aGF0IHRoZSB0aHVtYiBjYW5cbiAgICogdGFrZSB1cC5cbiAgICovXG4gIHByaXZhdGUgX2dldFNsaWRlckRpbWVuc2lvbnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NsaWRlcldyYXBwZXIgPyB0aGlzLl9zbGlkZXJXcmFwcGVyLm5hdGl2ZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkgOiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvY3VzZXMgdGhlIG5hdGl2ZSBlbGVtZW50LlxuICAgKiBDdXJyZW50bHkgb25seSB1c2VkIHRvIGFsbG93IGEgYmx1ciBldmVudCB0byBmaXJlIGJ1dCB3aWxsIGJlIHVzZWQgd2l0aCBrZXlib2FyZCBpbnB1dCBsYXRlci5cbiAgICovXG4gIHByaXZhdGUgX2ZvY3VzSG9zdEVsZW1lbnQob3B0aW9ucz86IEZvY3VzT3B0aW9ucykge1xuICAgIHRoaXMuX2VsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5mb2N1cyhvcHRpb25zKTtcbiAgfVxuXG4gIC8qKiBCbHVycyB0aGUgbmF0aXZlIGVsZW1lbnQuICovXG4gIHByaXZhdGUgX2JsdXJIb3N0RWxlbWVudCgpIHtcbiAgICB0aGlzLl9lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuYmx1cigpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG1vZGVsIHZhbHVlLiBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIENvbnRyb2xWYWx1ZUFjY2Vzc29yLlxuICAgKiBAcGFyYW0gdmFsdWVcbiAgICovXG4gIHdyaXRlVmFsdWUodmFsdWU6IGFueSkge1xuICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgYSBjYWxsYmFjayB0byBiZSB0cmlnZ2VyZWQgd2hlbiB0aGUgdmFsdWUgaGFzIGNoYW5nZWQuXG4gICAqIEltcGxlbWVudGVkIGFzIHBhcnQgb2YgQ29udHJvbFZhbHVlQWNjZXNzb3IuXG4gICAqIEBwYXJhbSBmbiBDYWxsYmFjayB0byBiZSByZWdpc3RlcmVkLlxuICAgKi9cbiAgcmVnaXN0ZXJPbkNoYW5nZShmbjogKHZhbHVlOiBhbnkpID0+IHZvaWQpIHtcbiAgICB0aGlzLl9jb250cm9sVmFsdWVBY2Nlc3NvckNoYW5nZUZuID0gZm47XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGEgY2FsbGJhY2sgdG8gYmUgdHJpZ2dlcmVkIHdoZW4gdGhlIGNvbXBvbmVudCBpcyB0b3VjaGVkLlxuICAgKiBJbXBsZW1lbnRlZCBhcyBwYXJ0IG9mIENvbnRyb2xWYWx1ZUFjY2Vzc29yLlxuICAgKiBAcGFyYW0gZm4gQ2FsbGJhY2sgdG8gYmUgcmVnaXN0ZXJlZC5cbiAgICovXG4gIHJlZ2lzdGVyT25Ub3VjaGVkKGZuOiBhbnkpIHtcbiAgICB0aGlzLm9uVG91Y2hlZCA9IGZuO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgd2hldGhlciB0aGUgY29tcG9uZW50IHNob3VsZCBiZSBkaXNhYmxlZC5cbiAgICogSW1wbGVtZW50ZWQgYXMgcGFydCBvZiBDb250cm9sVmFsdWVBY2Nlc3Nvci5cbiAgICogQHBhcmFtIGlzRGlzYWJsZWRcbiAgICovXG4gIHNldERpc2FibGVkU3RhdGUoaXNEaXNhYmxlZDogYm9vbGVhbikge1xuICAgIHRoaXMuZGlzYWJsZWQgPSBpc0Rpc2FibGVkO1xuICB9XG59XG5cbi8qKiBSZXR1cm5zIHdoZXRoZXIgYW4gZXZlbnQgaXMgYSB0b3VjaCBldmVudC4gKi9cbmZ1bmN0aW9uIGlzVG91Y2hFdmVudChldmVudDogTW91c2VFdmVudCB8IFRvdWNoRXZlbnQpOiBldmVudCBpcyBUb3VjaEV2ZW50IHtcbiAgLy8gVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgZm9yIGV2ZXJ5IHBpeGVsIHRoYXQgdGhlIHVzZXIgaGFzIGRyYWdnZWQgc28gd2UgbmVlZCBpdCB0byBiZVxuICAvLyBhcyBmYXN0IGFzIHBvc3NpYmxlLiBTaW5jZSB3ZSBvbmx5IGJpbmQgbW91c2UgZXZlbnRzIGFuZCB0b3VjaCBldmVudHMsIHdlIGNhbiBhc3N1bWVcbiAgLy8gdGhhdCBpZiB0aGUgZXZlbnQncyBuYW1lIHN0YXJ0cyB3aXRoIGB0YCwgaXQncyBhIHRvdWNoIGV2ZW50LlxuICByZXR1cm4gZXZlbnQudHlwZVswXSA9PT0gJ3QnO1xufVxuXG4vKiogR2V0cyB0aGUgY29vcmRpbmF0ZXMgb2YgYSB0b3VjaCBvciBtb3VzZSBldmVudCByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQuICovXG5mdW5jdGlvbiBnZXRQb2ludGVyUG9zaXRpb25PblBhZ2UoZXZlbnQ6IE1vdXNlRXZlbnQgfCBUb3VjaEV2ZW50LCBpZDogbnVtYmVyIHwgdW5kZWZpbmVkKSB7XG4gIGxldCBwb2ludDoge2NsaWVudFg6IG51bWJlcjsgY2xpZW50WTogbnVtYmVyfSB8IHVuZGVmaW5lZDtcblxuICBpZiAoaXNUb3VjaEV2ZW50KGV2ZW50KSkge1xuICAgIC8vIFRoZSBgaWRlbnRpZmllcmAgY291bGQgYmUgdW5kZWZpbmVkIGlmIHRoZSBicm93c2VyIGRvZXNuJ3Qgc3VwcG9ydCBgVG91Y2hFdmVudC5pZGVudGlmaWVyYC5cbiAgICAvLyBJZiB0aGF0J3MgdGhlIGNhc2UsIGF0dHJpYnV0ZSB0aGUgZmlyc3QgdG91Y2ggdG8gYWxsIGFjdGl2ZSBzbGlkZXJzLiBUaGlzIHNob3VsZCBzdGlsbCBjb3ZlclxuICAgIC8vIHRoZSBtb3N0IGNvbW1vbiBjYXNlIHdoaWxlIG9ubHkgYnJlYWtpbmcgbXVsdGktdG91Y2guXG4gICAgaWYgKHR5cGVvZiBpZCA9PT0gJ251bWJlcicpIHtcbiAgICAgIHBvaW50ID0gZmluZE1hdGNoaW5nVG91Y2goZXZlbnQudG91Y2hlcywgaWQpIHx8IGZpbmRNYXRjaGluZ1RvdWNoKGV2ZW50LmNoYW5nZWRUb3VjaGVzLCBpZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGB0b3VjaGVzYCB3aWxsIGJlIGVtcHR5IGZvciBzdGFydC9lbmQgZXZlbnRzIHNvIHdlIGhhdmUgdG8gZmFsbCBiYWNrIHRvIGBjaGFuZ2VkVG91Y2hlc2AuXG4gICAgICBwb2ludCA9IGV2ZW50LnRvdWNoZXNbMF0gfHwgZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF07XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHBvaW50ID0gZXZlbnQ7XG4gIH1cblxuICByZXR1cm4gcG9pbnQgPyB7eDogcG9pbnQuY2xpZW50WCwgeTogcG9pbnQuY2xpZW50WX0gOiB1bmRlZmluZWQ7XG59XG5cbi8qKiBGaW5kcyBhIGBUb3VjaGAgd2l0aCBhIHNwZWNpZmljIElEIGluIGEgYFRvdWNoTGlzdGAuICovXG5mdW5jdGlvbiBmaW5kTWF0Y2hpbmdUb3VjaCh0b3VjaGVzOiBUb3VjaExpc3QsIGlkOiBudW1iZXIpOiBUb3VjaCB8IHVuZGVmaW5lZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0b3VjaGVzW2ldLmlkZW50aWZpZXIgPT09IGlkKSB7XG4gICAgICByZXR1cm4gdG91Y2hlc1tpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG4vKiogR2V0cyB0aGUgdW5pcXVlIElEIG9mIGEgdG91Y2ggdGhhdCBtYXRjaGVzIGEgc3BlY2lmaWMgc2xpZGVyLiAqL1xuZnVuY3Rpb24gZ2V0VG91Y2hJZEZvclNsaWRlcihldmVudDogVG91Y2hFdmVudCwgc2xpZGVySG9zdDogSFRNTEVsZW1lbnQpOiBudW1iZXIgfCB1bmRlZmluZWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGV2ZW50LnRvdWNoZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB0YXJnZXQgPSBldmVudC50b3VjaGVzW2ldLnRhcmdldCBhcyBIVE1MRWxlbWVudDtcblxuICAgIGlmIChzbGlkZXJIb3N0ID09PSB0YXJnZXQgfHwgc2xpZGVySG9zdC5jb250YWlucyh0YXJnZXQpKSB7XG4gICAgICByZXR1cm4gZXZlbnQudG91Y2hlc1tpXS5pZGVudGlmaWVyO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG4iLCI8ZGl2IGNsYXNzPVwibWF0LXNsaWRlci13cmFwcGVyXCIgI3NsaWRlcldyYXBwZXI+XG4gIDxkaXYgY2xhc3M9XCJtYXQtc2xpZGVyLXRyYWNrLXdyYXBwZXJcIj5cbiAgICA8ZGl2IGNsYXNzPVwibWF0LXNsaWRlci10cmFjay1iYWNrZ3JvdW5kXCIgW25nU3R5bGVdPVwiX2dldFRyYWNrQmFja2dyb3VuZFN0eWxlcygpXCI+PC9kaXY+XG4gICAgPGRpdiBjbGFzcz1cIm1hdC1zbGlkZXItdHJhY2stZmlsbFwiIFtuZ1N0eWxlXT1cIl9nZXRUcmFja0ZpbGxTdHlsZXMoKVwiPjwvZGl2PlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cIm1hdC1zbGlkZXItdGlja3MtY29udGFpbmVyXCIgW25nU3R5bGVdPVwiX2dldFRpY2tzQ29udGFpbmVyU3R5bGVzKClcIj5cbiAgICA8ZGl2IGNsYXNzPVwibWF0LXNsaWRlci10aWNrc1wiIFtuZ1N0eWxlXT1cIl9nZXRUaWNrc1N0eWxlcygpXCI+PC9kaXY+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwibWF0LXNsaWRlci10aHVtYi1jb250YWluZXJcIiBbbmdTdHlsZV09XCJfZ2V0VGh1bWJDb250YWluZXJTdHlsZXMoKVwiPlxuICAgIDxkaXYgY2xhc3M9XCJtYXQtc2xpZGVyLWZvY3VzLXJpbmdcIj48L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwibWF0LXNsaWRlci10aHVtYlwiPjwvZGl2PlxuICAgIDxkaXYgY2xhc3M9XCJtYXQtc2xpZGVyLXRodW1iLWxhYmVsXCI+XG4gICAgICA8c3BhbiBjbGFzcz1cIm1hdC1zbGlkZXItdGh1bWItbGFiZWwtdGV4dFwiPnt7ZGlzcGxheVZhbHVlfX08L3NwYW4+XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuPC9kaXY+XG4iXX0=