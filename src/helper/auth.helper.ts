export const checkEmail = (email: string): RegExpMatchArray | null => {
    return String(email).toLowerCase().match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
}
export const checkBirthYear = (date: string): boolean => {
    try {
        const today = new Date();
        const birthDate = new Date(date);
        const age = today.getFullYear() - birthDate.getFullYear();
        return age >= 18;
    } catch (error) {
        return false;
    }
}
export const ventIds = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}