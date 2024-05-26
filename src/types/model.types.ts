import {FEELING, GENDER, STATUS} from "@prisma/client";

export type USERDATA = {
    id: string;
    fName: string;
    lName: string | null;
    username: string;
    email: string;
    birthDate: string;
    gender: GENDER;
    image: string | null;
    identity: boolean;
    feeling: FEELING;
    status: STATUS;
    createdAt: Date;
    updatedAt: Date;
}