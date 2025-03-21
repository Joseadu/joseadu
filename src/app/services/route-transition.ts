import { animate, query, style, transition, trigger } from "@angular/animations";

export const routeTransition = trigger('routeTransition', [
    transition('* => *', [
        query(':enter', [
            style({ opacity: 0, transform: 'translateX(-100%)' })
        ]),
        query(':leave', [
            animate('1s', style({ opacity: 0, transform: 'translateX(-100%)' }))
        ]),
        query(':enter', [
            animate('1s', style({ opacity: 1, transform: 'translateX(0%)' }))
        ])
    ])
    // transition('* => *', [
    //     query(':enter', [
    //         style({ opacity: 0, scale: 0.9 })
    //     ], {optional: true}),
    //     query(':leave', [
    //         animate('1s', style({ opacity: 0, scale: 0.9 }))
    //     ], { optional: true }),
    //     query(':enter', [
    //         animate('1s', style({ opacity: 1, scale: 1 }))
    //     ], { optional: true })
    // ])
])