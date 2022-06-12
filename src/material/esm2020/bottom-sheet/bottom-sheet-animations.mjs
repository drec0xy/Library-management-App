/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { animate, state, style, transition, trigger, } from '@angular/animations';
import { AnimationCurves, AnimationDurations } from '@angular/material/core';
/** Animations used by the Material bottom sheet. */
export const matBottomSheetAnimations = {
    /** Animation that shows and hides a bottom sheet. */
    bottomSheetState: trigger('state', [
        state('void, hidden', style({ transform: 'translateY(100%)' })),
        state('visible', style({ transform: 'translateY(0%)' })),
        transition('visible => void, visible => hidden', animate(`${AnimationDurations.COMPLEX} ${AnimationCurves.ACCELERATION_CURVE}`)),
        transition('void => visible', animate(`${AnimationDurations.EXITING} ${AnimationCurves.DECELERATION_CURVE}`)),
    ]),
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYm90dG9tLXNoZWV0LWFuaW1hdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWF0ZXJpYWwvYm90dG9tLXNoZWV0L2JvdHRvbS1zaGVldC1hbmltYXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUNILE9BQU8sRUFDTCxPQUFPLEVBQ1AsS0FBSyxFQUNMLEtBQUssRUFDTCxVQUFVLEVBQ1YsT0FBTyxHQUVSLE1BQU0scUJBQXFCLENBQUM7QUFDN0IsT0FBTyxFQUFDLGVBQWUsRUFBRSxrQkFBa0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBRTNFLG9EQUFvRDtBQUNwRCxNQUFNLENBQUMsTUFBTSx3QkFBd0IsR0FFakM7SUFDRixxREFBcUQ7SUFDckQsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLE9BQU8sRUFBRTtRQUNqQyxLQUFLLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxFQUFDLFNBQVMsRUFBRSxrQkFBa0IsRUFBQyxDQUFDLENBQUM7UUFDN0QsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsRUFBQyxTQUFTLEVBQUUsZ0JBQWdCLEVBQUMsQ0FBQyxDQUFDO1FBQ3RELFVBQVUsQ0FDUixvQ0FBb0MsRUFDcEMsT0FBTyxDQUFDLEdBQUcsa0JBQWtCLENBQUMsT0FBTyxJQUFJLGVBQWUsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQy9FO1FBQ0QsVUFBVSxDQUNSLGlCQUFpQixFQUNqQixPQUFPLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxPQUFPLElBQUksZUFBZSxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FDL0U7S0FDRixDQUFDO0NBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtcbiAgYW5pbWF0ZSxcbiAgc3RhdGUsXG4gIHN0eWxlLFxuICB0cmFuc2l0aW9uLFxuICB0cmlnZ2VyLFxuICBBbmltYXRpb25UcmlnZ2VyTWV0YWRhdGEsXG59IGZyb20gJ0Bhbmd1bGFyL2FuaW1hdGlvbnMnO1xuaW1wb3J0IHtBbmltYXRpb25DdXJ2ZXMsIEFuaW1hdGlvbkR1cmF0aW9uc30gZnJvbSAnQGFuZ3VsYXIvbWF0ZXJpYWwvY29yZSc7XG5cbi8qKiBBbmltYXRpb25zIHVzZWQgYnkgdGhlIE1hdGVyaWFsIGJvdHRvbSBzaGVldC4gKi9cbmV4cG9ydCBjb25zdCBtYXRCb3R0b21TaGVldEFuaW1hdGlvbnM6IHtcbiAgcmVhZG9ubHkgYm90dG9tU2hlZXRTdGF0ZTogQW5pbWF0aW9uVHJpZ2dlck1ldGFkYXRhO1xufSA9IHtcbiAgLyoqIEFuaW1hdGlvbiB0aGF0IHNob3dzIGFuZCBoaWRlcyBhIGJvdHRvbSBzaGVldC4gKi9cbiAgYm90dG9tU2hlZXRTdGF0ZTogdHJpZ2dlcignc3RhdGUnLCBbXG4gICAgc3RhdGUoJ3ZvaWQsIGhpZGRlbicsIHN0eWxlKHt0cmFuc2Zvcm06ICd0cmFuc2xhdGVZKDEwMCUpJ30pKSxcbiAgICBzdGF0ZSgndmlzaWJsZScsIHN0eWxlKHt0cmFuc2Zvcm06ICd0cmFuc2xhdGVZKDAlKSd9KSksXG4gICAgdHJhbnNpdGlvbihcbiAgICAgICd2aXNpYmxlID0+IHZvaWQsIHZpc2libGUgPT4gaGlkZGVuJyxcbiAgICAgIGFuaW1hdGUoYCR7QW5pbWF0aW9uRHVyYXRpb25zLkNPTVBMRVh9ICR7QW5pbWF0aW9uQ3VydmVzLkFDQ0VMRVJBVElPTl9DVVJWRX1gKSxcbiAgICApLFxuICAgIHRyYW5zaXRpb24oXG4gICAgICAndm9pZCA9PiB2aXNpYmxlJyxcbiAgICAgIGFuaW1hdGUoYCR7QW5pbWF0aW9uRHVyYXRpb25zLkVYSVRJTkd9ICR7QW5pbWF0aW9uQ3VydmVzLkRFQ0VMRVJBVElPTl9DVVJWRX1gKSxcbiAgICApLFxuICBdKSxcbn07XG4iXX0=