export const checkEmail = (email: string): RegExpMatchArray | null => {
    return String(email).toLowerCase().match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
}
export const checkBirthYear = (year: string): boolean => {
    const pattern = /^([0-9]{4})$/;
    const currentYear = new Date().getFullYear();
    if (pattern.test(year)) {
        if (parseInt(year) < currentYear) {
            if (parseInt(year) >= currentYear - 13) {
                return true;
            }
        }
    }
    return false
}
export const ventIds = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}