import {user, trackActivityType, tracker} from "@prisma/client";
import prisma from "../utils/client";

export const trackMe = async (userId: string, activity: trackActivityType): Promise<tracker | null> => {
    try {
        return prisma.tracker.upsert({
            where: {
                user_id: userId
            },
            update: {
                last_activity: activity,
                isOnline: activity !== 'disconnect'
            },
            create: {
                user_id: userId,
                last_activity: activity,
                isOnline: activity !== 'disconnect'
            }
        })
    } catch (e) {
        console.log(e)
        return null;
    }
}
