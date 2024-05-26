import {FEELING} from "@prisma/client";

export const generate6DigitCode = () => {
    return Math.floor(100000 + Math.random() * 900000);
}

export const strToInt = (str?: any) => {
    if (str) {
        if (!isNaN(parseInt(str.trim()))) {
            return parseInt(str);
        }
    }
    return 0;
}
export const changeToFeelings = (feelings: string) => {
    switch (feelings) {
        case 'happy':
            return FEELING.happy;
        case 'sad':
            return FEELING.sad;
        case 'angry':
            return FEELING.angry;
        default:
            return FEELING.none;
    }
}