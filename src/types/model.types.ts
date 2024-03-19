import {FEELING, GENDER, STATUS} from "@prisma/client";

export type USERDATA = {
    id: string;
    fName: string;
    lName: string | null;
    username: string;
    email: string;
    birthYear: number;
    gender: GENDER;
    image: string | null;
    feeling: FEELING;
    status: STATUS;
    isEmailConfirmed: boolean;
    createdAt: Date;
    updatedAt: Date;
}